import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const assets = Object.freeze({
  'index.html': 'local/index.html',
  'app.js': 'local/app.js',
  'storage.js': 'local/storage.js',
  'i18n.js': 'local/i18n.js',
  'i18n-base.js': 'public/i18n.js',
  'app.css': 'public/app.css',
  'local.css': 'local/local.css',
  'favicon.svg': 'public/favicon.svg',
});

// Resolve existing ancestors too, including a symlink above a new output folder.
async function canonicalDestination(filename) {
  try { return await fs.realpath(filename); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return path.join(await canonicalDestination(path.dirname(filename)), path.basename(filename));
  }
}

// A public build is an explicit file export, never a recursive repository copy.
// Databases, seed data, Git history, backups and credentials cannot be inputs.
export async function buildLocal({ sourceRoot = projectRoot, outDir = path.join(projectRoot, 'dist/local') } = {}) {
  const prepared = [];
  for (const [name, source] of Object.entries(assets)) {
    const filename = path.join(sourceRoot, source);
    let stat;
    try { stat = await fs.lstat(filename); }
    catch (error) { if (name === 'local.css' && error.code === 'ENOENT') continue; throw error; }
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Public asset must be a regular file: ${source}`);
    const realRoot = await fs.realpath(sourceRoot);
    const real = await fs.realpath(filename);
    if (!real.startsWith(realRoot + path.sep)) throw new Error(`Public asset escapes source root: ${source}`);
    const data = await fs.readFile(filename);
    if (data.length > 2 * 1024 * 1024) throw new Error(`Unexpectedly large public code asset: ${source}`);
    prepared.push({ name, data, sourcePath: real });
  }
  const html = prepared.find(a => a.name === 'index.html').data.toString();
  if (!/http-equiv=["']Content-Security-Policy["']/i.test(html) || !/connect-src\s+'none'/.test(html))
    throw new Error('Local build requires a network-disabled Content Security Policy');
  if (/\son[a-z]+\s*=|javascript:/i.test(html)) throw new Error('Inline event handlers and script URLs are forbidden');
  for (const { name, data } of prepared.filter(a => a.name.endsWith('.js'))) {
    if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\s*\(/.test(data.toString()))
      throw new Error(`Unexpected networking in local-only asset: ${name}`);
  }
  const output = path.resolve(outDir);
  const canonicalOutput = await canonicalDestination(output);
  if (canonicalOutput === path.parse(canonicalOutput).root || prepared.some(({ sourcePath }) =>
    sourcePath === canonicalOutput || sourcePath.startsWith(canonicalOutput + path.sep)))
    throw new Error('Output must be a dedicated build directory, never a source directory or its ancestor');
  try { if ((await fs.lstat(output)).isSymbolicLink()) throw new Error('Output cannot be a symlink'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.mkdir(output, { recursive: true });
  // Refuse an unrelated directory rather than deleting arbitrary content.
  const existing = await fs.readdir(output);
  if (existing.some(name => !Object.hasOwn(assets, name))) throw new Error('Output contains files outside the public allowlist');
  await Promise.all(existing.map(name => fs.rm(path.join(output, name))));
  await Promise.all(prepared.map(({ name, data }) => fs.writeFile(path.join(output, name), data, { flag: 'wx' })));
  return prepared.map(({ name, data }) => ({ path: name, size: data.length, sha256: createHash('sha256').update(data).digest('hex') }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const manifest = await buildLocal();
  console.log(JSON.stringify({ output: 'dist/local', files: manifest }, null, 2));
}
