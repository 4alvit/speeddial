import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { primaryUrl, assertGitProtection, prepareDirectory, sameRestoredContent, saveBackup,
  downloadSnapshot, waitForExport, installedBrowsers, openBrowser } from './browser-backup-lib.mjs';

const help = `Local Speedial backups (Node.js 24+, run inside the Git checkout)

  npm run backup:browser -- [--browser chrome] [--downloads /local/folder]
  npm run backup:browser -- --file /local/export.json
  npm run restore:browser -- backups/<backup>.json --browser firefox
  npm run backup:browser -- --list-browsers

Options: --browser NAME, --app /absolute/Browser.app, --no-open,
         --downloads PATH (default ~/Downloads), --timeout SECONDS (default 600)

These are interactive helpers. Click Export backup in the actual source profile.
Restore requires a destination export, Import backup / Replace this board,
then reload and a verification export. No browser profile databases are edited.
Use --no-open on Linux/Windows or with an already-open browser of any kind.
All saved backups and receipts stay in the Git-ignored backups/ directory.
Download originals remain in your chosen download folder. No files are uploaded.`;

function printSaved(result, title = 'Saved and verified locally', log = console.log) {
  log(`${title}: ${result.file}\n${result.tiles} tiles, ${result.images} images, ${result.rows} × ${result.columns}, ${result.imageBytes} image bytes.\nSHA-256: ${result.sha256}`);
}

// Keep the rescue, confirmation and verification sequence together. The CLI
// checks for a real terminal before entering this flow; adapters make its
// ordering testable without touching a browser or anyone's personal files.
export async function restoreBoard({ source, directory, baseline, timeoutMs }, {
  capture = waitForExport,
  archive = saveBackup,
  snapshot = downloadSnapshot,
  createPrompt = () => createInterface({ input: process.stdin, output: process.stdout }),
  log = console.log,
} = {}) {
  const first = await capture(directory, baseline, { timeoutMs });
  const saved = await archive(first, { label: 'before-restore' });
  printSaved(saved, 'Destination rescue copy saved', log);

  const prompt = createPrompt();
  try {
    const answer = await prompt.question('Confirm that the export came from the destination profile. Type RESTORE to continue: ');
    if (answer.trim() !== 'RESTORE') { log('Cancelled; no import was requested. Local copies are retained.'); return; }
    const verificationBaseline = await snapshot(directory);
    log(`In that same browser/profile:\n1. Click Import backup and select:\n${source.file}\n2. Review the summary and click Replace this board.\n3. Reload the page, expand the arrow, and click Export backup again.\nWaiting for the verification export. Rescue copy: ${saved.file}`);
    const after = await capture(directory, verificationBaseline, { timeoutMs });
    const verified = await archive(after, { label: 'after-restore' });
    if (!sameRestoredContent(source, verified)) {
      throw new Error(`Restoration is NOT verified: the exported content differs. Your rescue copy is ${saved.file}. No automatic rollback was attempted.`);
    }
    printSaved(verified, 'Restoration verified against a fresh export', log);
    log('Ordered links, titles, image bytes, grid, opening preference and any included locale match. Confirm visually that images display in the intended profile.');
  } finally { prompt.close(); }
}

export async function main(mode, args = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    browser: { type: 'string', default: 'chrome' }, app: { type: 'string' },
    'no-open': { type: 'boolean' }, downloads: { type: 'string', default: path.join(os.homedir(), 'Downloads') },
    timeout: { type: 'string', default: '600' }, file: { type: 'string' },
    'list-browsers': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) { console.log(help); return; }
  if (values['list-browsers']) {
    if (process.platform !== 'darwin') throw new Error('Discovery is macOS-only; use --no-open with any browser on other systems.');
    for (const item of await installedBrowsers()) console.log(`${item.id}: ${item.app}`);
    return;
  }
  if ((mode === 'backup' && positionals.length) || (mode === 'restore' && (positionals.length !== 1 || values.file))) throw new Error(help);
  const timeoutMs = Number(values.timeout) * 1000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 86_400_000) throw new Error('Timeout must be 1–86400 seconds.');
  assertGitProtection();
  await prepareDirectory();
  if (mode === 'backup' && values.file) {
    printSaved(await saveBackup(path.resolve(values.file)));
    return;
  }
  const directory = path.resolve(values.downloads);
  const baseline = await downloadSnapshot(directory);
  let source;
  if (mode === 'restore') {
    if (!process.stdin.isTTY) throw new Error('Restore requires an interactive terminal for the destination-rescue step.');
    // Keep an immutable local restore source; never import a file that can change beneath us.
    source = await saveBackup(path.resolve(positionals[0]), { label: 'restore-source' });
    printSaved(source, 'Validated restore source');
  }
  await openBrowser({ browser: values.browser, app: values.app, noOpen: values['no-open'] });
  console.log(`Open ${primaryUrl} in the intended ${values.app || values['no-open'] ? 'browser' : values.browser} profile.\nExpand the upper-right arrow and click Export backup. Save to: ${directory}\nWaiting for a NEW export; filenames alone cannot identify which browser/profile produced it.`);
  if (mode === 'restore') {
    await restoreBoard({ source, directory, baseline, timeoutMs });
    return;
  }
  const first = await waitForExport(directory, baseline, { timeoutMs });
  printSaved(await saveBackup(first, { label: 'backup' }));
}

export function run(mode) {
  main(mode).catch(error => {
    // Do not dump parser internals, private JSON, URLs or stack traces.
    console.error(error.code ? `Local backup failed (${error.code}). Check file paths, permissions, and .gitignore.` : error.message);
    process.exitCode = 1;
  });
}
