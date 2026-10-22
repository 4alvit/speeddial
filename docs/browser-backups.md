# Local browser backup and restore scripts

<!-- language-navigation:start -->
<p dir="ltr">
<a href="browser-backups.md" lang="en" dir="ltr">English</a>
<a href="browser-backups.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="browser-backups.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="browser-backups.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="browser-backups.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="browser-backups.es.md" lang="es" dir="ltr">Español</a>
<a href="browser-backups.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="browser-backups.fr.md" lang="fr" dir="ltr">Français</a>
<a href="browser-backups.he.md" lang="he" dir="rtl">עברית</a>
<a href="browser-backups.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="browser-backups.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="browser-backups.it.md" lang="it" dir="ltr">Italiano</a>
<a href="browser-backups.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="browser-backups.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="browser-backups.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="browser-backups.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="browser-backups.pt.md" lang="pt" dir="ltr">Português</a>
<a href="browser-backups.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="browser-backups.th.md" lang="th" dir="ltr">ไทย</a>
<a href="browser-backups.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="browser-backups.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="browser-backups.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="browser-backups.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="browser-backups.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[Migration runbook](browser-migration.md) · [All deployment options](../README.md#storage-and-deployment)

These scripts preserve the **Speed Dial board**: ordered links, titles, complete image bytes, rows, columns, opening preference and language. They do not back up browser history, passwords, extensions or unrelated bookmarks. They use the app's portable `speedial-local-backup` JSON format, not Chrome's or Firefox's internal databases.

They operate on the browser-local app at [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). They do not replace [server backups](../wiki/Operations.md#backup-and-restore) for Node.js, Docker or k3s deployments. The server's older JSON export is not accepted as a complete browser backup; transferring that board requires the [image collection and conversion procedure](browser-migration.md).

If your board is still at the former `speedial.alvit.here.now` address, export from that exact address first; these scripts now open `speeddial.alvit.here.now`. Use `--no-open` with the already-open old browser tab, or archive its saved export explicitly. Old `speedial-local-backup` files and the `speedial-backup-*.json` download names remain supported. See the [address migration notes](local-speedial.md#corrected-address-and-existing-backups).

## Requirements and browser support

Run Node.js 24+ from this Git checkout. No additional package installation is needed. On macOS, the launcher recognizes Chrome, Firefox, Safari, Edge, Brave, Arc, Opera, Vivaldi, Chromium, Orion, Zen, LibreWolf and Waterfox under `/Applications`, `~/Applications` or `/System/Applications`. This is launcher support, not a claim that every named browser has been tested. Automated app coverage uses Chromium, Firefox and WebKit.

```sh
npm run backup:browser -- --list-browsers
```

For another macOS browser, use `--app /absolute/path/Browser.app`. For an already-open browser, Codex's in-app browser, Windows or Linux, use `--no-open` and open the site yourself. No debugging port, extension, Accessibility permission or direct profile-file access is needed.

```sh
npm run backup:browser -- --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --no-open
npm run restore:browser -- backups/YOUR-BACKUP.json --app "/Applications/Brave Browser.app"
```

The launch URL is fixed to the primary address. An existing board at another origin must be exported from that exact origin; use `--no-open` while working there and check the intended destination address yourself. Browser storage does not follow a redirect or hostname change.

**These are interactive scripts.** They open the app and manage local files, but you click export, select the import file and confirm replacement. An application can have several profiles: select the intended profile and use [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). A new profile being empty is expected. The script cannot attest which profile produced a download.

## Back up Chrome

```sh
npm run backup:browser -- --browser chrome
```

1. Select your existing Chrome profile, expand the upper-right arrow and click **Export backup**.
2. Save with the suggested `speedial-backup-YYYY-MM-DD.json` filename in `~/Downloads`. Collision suffixes such as ` (1)` are supported.
3. The script waits for a new, complete export, validates it, copies it into `backups/`, reads the copy back and prints its path, counts and SHA-256. It never falls back to an old export. Multiple simultaneous exports cause an error rather than guessing.

Use `--downloads /absolute/local/folder` if the browser downloads elsewhere; choose that same folder in the browser. Choose local folders outside cloud-sync directories. The default wait is ten minutes; `--timeout 1200` changes it to twenty minutes. A browser **Save As** dialog may need confirmation before the file exists. For a renamed or already downloaded export:

```sh
npm run backup:browser -- --file /absolute/local/export.json
```

Explicit-file mode archives that file; it does **not** fetch current browser data or establish freshness. Download originals are retained. Exports collected by the watcher are restricted to mode `0600` on POSIX; explicit input files are left unchanged.

## Restore to another browser

Replace `YOUR-BACKUP.json` with the printed backup filename:

```sh
npm run restore:browser -- backups/YOUR-BACKUP.json --browser firefox
npm run restore:browser -- backups/YOUR-BACKUP.json --browser chrome
npm run restore:browser -- backups/YOUR-BACKUP.json --browser safari
```

The restore command requires an interactive terminal and guides one browser/profile at a time:

1. It validates and preserves a separate `restore-source` copy. In the destination profile, export the current board, even if empty. The script saves it as `before-restore` so that board remains recoverable.
2. Confirm in the terminal that the export came from the correct destination profile by typing `RESTORE`.
3. Click **Import backup** in that same browser, select the printed `restore-source` file, review the summary, then click **Replace this board**. On macOS, press **⌘⇧G** in the file chooser and paste the absolute file path.
4. Reload Speed Dial, check that the images display, then export again. The script archives this `after-restore` export and compares ordered links, titles, image bytes, grid, opening preference and language against the source. Regenerated internal IDs and timestamps are ignored. Older backups without a language leave the destination language unchanged.

Success is reported only after content matches. A mismatch or timeout is **not** a verified restoration. All copies are kept; there is no automatic rollback. To roll back, repeat the command with the saved `before-restore` file. Matching exports prove content equality; checking the profile, origin and visible images remains necessary.

Returning to Chrome later uses the same restore command with `--browser chrome` and the desired saved JSON file. The format does not depend on the source browser. Each restore replaces one destination board rather than merging its links; keep the automatically preserved destination copy if both versions may be needed.

Do not export from another tab or profile while a command is waiting. Run separate commands for separate browsers. This is a one-time transfer; later edits do not synchronize.

## Local-only storage and validation

All script output goes to the fixed `backups/` directory in this checkout. The command checks that Git ignores it and that it has no tracked files. A symlinked output directory is rejected. Each backup has a unique name, is committed without overwriting another file, is read back, and has a `.receipt.json` with counts and digests but no titles or URLs. Invalid input does not create a backup. The CLI reuses the app's schema, base64 and raster-header validation; the destination app additionally decodes images before its atomic import.

Use the board `.json` file for restoration, not its `.receipt.json` companion. A receipt records verification metadata and cannot restore a board. The scripts do not remove old backups or download originals automatically; retain the copies you need and manage their storage locally.

On macOS/Linux, the directory has mode `0700` and files `0600`. On Windows, restrict access with account filesystem ACLs; POSIX modes are not an ACL guarantee. JSON backups are plaintext. The scripts have no upload or synchronization code. The folder is excluded from Git, Docker build input and the public frontend allowlist. `.gitignore` does not prevent forced Git adds, manual sharing, OS backups or an independently configured sync client. Keep the checkout and download folder outside synced directories for local-only storage.

No board data is embedded in scripts, tests, documentation or the public site. See [browser storage limitations](local-speedial.md#what-is-private-and-what-is-not) and [migration acceptance](browser-migration.md).
