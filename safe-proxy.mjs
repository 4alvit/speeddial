import http from 'node:http';
import net from 'node:net';
import { lookup } from 'node:dns/promises';

// Chromium only reaches the web through this proxy. DNS resolution is pinned to
// a checked public IPv4 address per socket, including redirects and subresources.
// Special-use ranges: https://www.iana.org/assignments/iana-ipv4-special-registry/
// Keep /24 ranges exact: blocking their whole /16 also rejects public websites.
export function publicIPv4(ip) {
  if (net.isIP(ip) !== 4) return false;
  const [a, b, c] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && [0, 2].includes(c)) || (b === 88 && c === 99))) ||
    (a === 198 && ([18, 19].includes(b) || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

export function parseWebURL(value) {
  if (typeof value !== 'string' || value.length > 4096) throw new Error('Invalid URL');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('An http:// or https:// URL without credentials is required');
  return url;
}

async function resolvePublic(host) {
  const results = await lookup(host, { all: true, family: 4 });
  if (!results.length || results.some(({ address }) => !publicIPv4(address)))
    throw new Error('Private network address blocked');
  return results[0].address;
}

export async function createSafeProxy() {
  const sockets = new Set();
  const server = http.createServer(async (req, res) => {
    try {
      const url = parseWebURL(req.url);
      if (url.protocol !== 'http:' || (url.port && url.port !== '80')) throw new Error('Port blocked');
      const ip = await resolvePublic(url.hostname);
      const headers = { ...req.headers, host: url.host };
      delete headers['proxy-authorization'];
      delete headers['proxy-connection'];
      const upstream = http.request({ hostname: ip, port: 80, path: url.pathname + url.search,
        method: req.method, headers, timeout: 20000, agent: false }, reply => {
        res.writeHead(reply.statusCode, reply.headers);
        reply.pipe(res);
      });
      upstream.on('timeout', () => upstream.destroy());
      upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
      req.on('aborted', () => upstream.destroy());
      res.on('close', () => upstream.destroy());
      req.pipe(upstream);
    } catch { res.writeHead(403); res.end('Blocked destination'); }
  });
  server.on('connect', async (req, client, head) => {
    let remote;
    try {
      const url = new URL('https://' + req.url);
      if (url.username || url.password || (url.port && url.port !== '443')) throw new Error('Port blocked');
      const ip = await resolvePublic(url.hostname);
      if (client.destroyed) return;
      remote = net.connect({ host: ip, port: 443 });
      sockets.add(remote);
      remote.setTimeout(25000, () => remote.destroy());
      remote.on('close', () => { sockets.delete(remote); client.destroy(); });
      remote.on('error', () => client.destroy());
      client.on('close', () => remote.destroy());
      remote.on('connect', () => {
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        if (head.length) remote.write(head);
        client.pipe(remote); remote.pipe(client);
      });
    } catch { client.end('HTTP/1.1 403 Forbidden\r\n\r\n'); remote?.destroy(); }
  });
  server.on('connection', socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => {
    for (const socket of sockets) socket.destroy(); server.close();
  } };
}
