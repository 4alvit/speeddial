import { createFixture, syntheticPng, syntheticTiles } from './fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, copyFile, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { publicIPv4, parseWebURL, createSafeProxy } from '../safe-proxy.mjs';
import http from 'node:http';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// The server is copied byte-for-byte; only the expensive browser adapter is
// replaced, letting these tests deterministically resolve screenshot races.
test('review: keyed access, persisted state, and stale screenshot cancellation', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'speeddial-review-'));
  const fixture = createFixture(dir);
  let child;
  try {
    await Promise.all(['server.mjs', 'safe-proxy.mjs', 'access.mjs', 'initial-state.mjs'].map(name => copyFile(path.join(root, name), path.join(dir, name))));
    await symlink(path.join(root, 'public'), path.join(dir, 'public'));
    await writeFile(path.join(dir, 'screenshot.mjs'), `
      import fs from 'node:fs';
      const sleep = ms => new Promise(r=>setTimeout(r,ms));
      export async function capture(url) {
        fs.appendFileSync(process.env.REVIEW_LOG, 'start '+url+'\\n');
        await sleep(url.includes('slow') ? 250 : 80);
        fs.appendFileSync(process.env.REVIEW_LOG, 'end '+url+'\\n');
        if(url.includes('/fail')) throw Error('deliberate');
        return Buffer.from(url);
      }`);
    let base, accessCookie;
    const cookies = () => accessCookie || '';
    async function start() {
      child = spawn(process.execPath, [path.join(dir, 'server.mjs')], {
        env: { PORT: '0', ...fixture.env,
          PUBLIC_ORIGIN: 'https://review.example',
          REVIEW_LOG: path.join(dir, 'captures.log') }, stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      await new Promise((resolve, reject) => {
        const timer=setTimeout(()=>reject(Error('server startup timeout')),10000);
        child.on('error',reject);
        child.on('exit',code=>{ if(!base) reject(Error('server exit '+code)); });
        child.stdout.on('data',chunk=>{
          output+=chunk;
          const match=output.match(/listening on (\d+)/);
          if(match) {base='http://127.0.0.1:'+match[1];clearTimeout(timer);resolve();}
        });
      });
    }
    async function request(route, body, method='POST', extraHeaders={}) {
      const res=await fetch(base+route, { method: body===undefined ? 'GET' : method,
        headers:{'content-type':'application/json',cookie:cookies(),...extraHeaders},
        body:body===undefined?undefined:JSON.stringify(body) });
      let data; try {data=await res.json();} catch {data=null;}
      return {res,data};
    }
    async function until(predicate) {
      for(let i=0;i<60;i++) {const {data}=await request('/api/state'); if(predicate(data))return data;await delay(30);}
      throw Error('state did not settle');
    }
    await start();
    assert.equal((await request('/api/tiles',{url:'https://example.com/'})).res.status,404);
    const entry = await fetch(base + fixture.entryPath);
    assert.equal(entry.status, 200);
    const setCookie=entry.headers.get('set-cookie'); assert.match(setCookie,/Secure/); assert.match(setCookie,/SameSite=Strict/);
    accessCookie = setCookie.split(';')[0];
    let result=await request('/api/state'); assert.equal(result.data.tiles.length,20);
    assert.equal((await request('/api/tiles',{url:'https://example.com/'},'POST',{origin:'https://evil.example'})).res.status,403);
    assert.equal((await request('/api/login',{})).res.status,404);
    assert.equal((await request('/api/logout',{})).res.status,404);
    assert.equal((await request('/api/state')).data.authenticated,true);
    assert.equal((await request('/api/tiles',{url:'file:///etc/passwd'})).res.status,400);
    assert.equal((await request('/api/tiles',{url:'http://u:p@example.com/'})).res.status,400);
    assert.equal((await request('/api/tiles',{url:'https://example.com/',revision:0})).res.status,409);
    assert.equal((await request('/api/tiles',{url:'https://example.com/'},'POST',{'sec-fetch-site':'cross-site'})).res.status,403);
    const original=result.data.tiles[0];
    assert.equal((await request('/api/order',{ids:[]},'PUT')).res.status,400);
    assert.equal((await fetch(base+'/legacy/source/manifest.json')).status,404);
    assert.equal((await fetch(base+'/images/%2e%2e/session.key')).status,404);

    result=await request('/api/tiles',{url:'https://example.com/slow-old'});
    const id=result.data.tiles.at(-1).id;
    await delay(40);
    await request('/api/tiles/'+id,{url:'https://example.com/new'},'PATCH');
    let board=await until(b=>b.tiles.find(t=>t.id===id)?.screenshotStatus==='ready');
    let tile=board.tiles.find(t=>t.id===id);
    assert.equal(await (await fetch(base+tile.image, { headers: { cookie: cookies() } })).text(),'https://example.com/new');

    await request('/api/tiles/'+id,{url:'https://example.com/slow-again'},'PATCH');
    await delay(40);
    const png=syntheticPng;
    result=await request('/api/tiles/'+id+'/image',{data:'data:image/png;base64,'+png.toString('base64')});
    const uploaded=result.data.tiles.find(t=>t.id===id).image;
    assert.equal(result.data.tiles.find(t=>t.id===id).screenshotErrorCode, null);
    await delay(300);
    tile=(await request('/api/state')).data.tiles.find(t=>t.id===id);
    assert.equal(tile.image,uploaded); assert.equal(tile.screenshotStatus,'ready');

    await request('/api/tiles/'+id,{url:'https://example.com/fail'},'PATCH');
    board=await until(b=>b.tiles.find(t=>t.id===id)?.screenshotStatus==='error');
    assert.equal(board.tiles.find(t=>t.id===id).image,null);
    assert.equal(board.tiles.find(t=>t.id===id).screenshotErrorCode, 'SCREENSHOT_FAILED');
    await request('/api/tiles/'+id+'/image',{data:'data:image/png;base64,'+png.toString('base64')});
    await request('/api/tiles/'+id+'/screenshot',{});
    board=await until(b=>b.tiles.find(t=>t.id===id)?.screenshotStatus==='error');
    assert.ok(board.tiles.find(t=>t.id===id).image, 'failed refresh preserves manual image');

    await request('/api/tiles/'+id,{url:'https://example.com/slow-deleted'},'PATCH');
    await delay(40);
    await request('/api/tiles/'+id,{},'DELETE');
    await delay(300);
    assert.ok(!(await request('/api/state')).data.tiles.some(t=>t.id===id));
    await request('/api/tiles/'+original.id,{title:'Persisted title'},'PATCH');
    const events=(await readFile(path.join(dir,'captures.log'),'utf8')).trim().split('\n');
    let active=0; for(const event of events) {active+=event.startsWith('start ')?1:-1;assert.ok(active<=1);assert.ok(active>=0);} assert.equal(active,0);
    child.kill('SIGTERM'); await once(child,'exit'); base=undefined;
    await start();
    result=await request('/api/state');assert.equal(result.data.tiles.find(t=>t.id===original.id).title,'Persisted title');assert.equal(result.data.authenticated,true);
    assert.equal(result.data.tiles.length,20);
  } finally {
    if(child && child.exitCode===null) {child.kill('SIGTERM');await once(child,'exit');}
    await rm(dir,{recursive:true,force:true});
  }
});

test('review: SSRF proxy denies loopback, metadata, IPv6 and unsafe ports', async () => {
  for(const ip of ['127.0.0.1','10.1.2.3','172.16.4.5','192.168.1.2','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1']) assert.equal(publicIPv4(ip),false,ip);
  assert.equal(publicIPv4('93.184.216.34'),true);
  for(const url of ['file:///etc/passwd','http://u:p@example.com/','javascript:alert(1)'])assert.throws(()=>parseWebURL(url));
  const proxy=await createSafeProxy();
  try {
    const address=new URL(proxy.url);
    for(const target of ['http://127.0.0.1/','http://2130706433/','http://0x7f000001/','http://169.254.169.254/','http://[::1]/','http://example.com:3000/']) {
      const status=await new Promise((resolve,reject)=>{
        const req=http.get({host:address.hostname,port:address.port,path:target},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);
      }); assert.equal(status,403,target);
    }
  } finally {proxy.close();}
});

test('screenshot address checks block exact special-use ranges without blocking neighboring public networks', () => {
  const denied = ['192.0.0.1', '192.0.2.1', '192.88.99.1', '192.88.99.2',
    '198.51.100.1', '203.0.113.1', '198.18.0.1', '198.19.255.254',
    '100.64.0.1', '100.127.255.254', '239.255.255.255', '240.0.0.1', '255.255.255.255'];
  const allowed = ['192.0.1.1', '192.2.1.1', '192.88.98.1', '192.88.100.1',
    '198.51.99.1', '198.51.101.1', '203.0.112.1', '203.0.114.1',
    '198.17.255.254', '198.20.0.1', '100.63.255.254', '100.128.0.1'];
  for (const address of denied) assert.equal(publicIPv4(address), false, address);
  for (const address of allowed) assert.equal(publicIPv4(address), true, address);
});
