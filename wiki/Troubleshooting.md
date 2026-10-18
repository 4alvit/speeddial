# Troubleshooting

[Wiki home](Home.md) · [Operations](Operations.md) · [Cutover and rollback](../deploy/README.md)

These instructions describe the current self-hosted access/storage contract. When upgrading an older installation, verify its version and use the migration runbook before assuming compatibility.

## Public Speed Dial: an empty board or missing images

Start with [the primary app address](https://speeddial.alvit.here.now/). A first visit from a new browser, profile, device or origin is supposed to be empty. A hosting alias may display the same app but has a separate database. Copying the page URL or board ID cannot recover another profile’s data.

Return to the original browser profile and exact address, export a complete local JSON backup, then import it at the primary address in the desired profile. Confirm the preview only after backing up any destination board. The old server’s export references image paths and is not a complete local backup; it cannot restore images on its own. See [transfer instructions](../docs/local-speedial.md#move-a-board-between-browsers-or-addresses).

Use the [local backup and restore scripts](../docs/browser-backups.md) to keep a destination rescue copy and verify the transfer. If the script keeps waiting, finish any browser **Save As** dialog and check that its download folder matches `--downloads`. It waits for a new `speedial-backup-*.json` export; an older file is intentionally not accepted. For a renamed or existing export, use the guide's explicit-file backup command. A verification mismatch keeps the rescue files and does not automatically replace the destination again.

If an image was never uploaded or pasted, the tile shows an initial. Public Speed Dial does not automatically capture websites or download their favicons. A local backup must include image bytes; neither cloud recovery nor automatic device synchronization is provided.

If storage is unavailable or was reset, follow the translated error and **Reload page** action after allowing site storage. Repeated reloads cannot restore data that browser cleanup deleted. Import a protected backup when available. A denied persistent-storage request does not prevent ordinary use, but regular backups remain necessary.

The remaining diagnostics refer to the self-hosted edition.

## Startup fails

Verify that `ACCESS_TOKEN_FILE` and `SESSION_KEY_FILE` exist and are readable by the application UID/group. The trimmed token must be at least 32 URL-safe characters; the signing key must contain at least 32 raw bytes. Do not solve this by putting a fixed credential into source or printing files into logs.

Verify a writable `DATA_DIR`, a readable optional `INITIAL_STATE_FILE`, and an installed Chromium executable. Missing Chromium can prevent captures even if HTTP startup succeeds. A fresh database is empty by design unless external initial state is supplied.

## A page or asset returns 404

Use the privately supplied `/?access=<token>` entry. A missing or incorrect value, or a bare root/index page, returns 404 even with a cookie. Assets and the API require a valid signed cookie; they do not gain access merely because a token is appended to an arbitrary asset URL.

Reopen the valid entry after the eight-hour session expires or after token/key/epoch rotation. Credential changes take effect on restart. If the token was changed, the old entry link must be replaced privately; refreshing an old link cannot repair it. Do not paste the complete link into a public support request.

## Editing gives 403 or 409

A 403 commonly means the supplied Origin differs from `PUBLIC_ORIGIN`, including scheme, port, or a mistakenly configured trailing slash. Cross-site writes are also rejected.

A 409 means the board revision changed, possibly due to another editor or a completed screenshot. Review refreshed state and retry. Preserve revision checks rather than forcing a write with no revision.

## Previews are missing after migration

Verify that compatible legacy image references resolve to files in `DATA_DIR/legacy-images`. The new image deliberately does not contain private legacy thumbnails. Compare the sealed migration manifest and the offline backup before making live repairs. Never reseed or replace the database merely to recover missing image files.

Generated/uploaded images remain in `DATA_DIR/images`. A complete migration and backup include current and retained-history references, not only the visible page. Keep paths and manifests private.

## Captures fail or look wrong

The server browser has no personal login cookies. Sign-in screens, CAPTCHA, delayed content, and consent overlays can prevent useful captures. Private-network destinations, IPv6-only sites, and nonstandard ports are intentionally not captured; upload a preview instead.

Check Chromium installation, memory pressure, DNS, and the deployed network-policy selectors. `/healthz` alone does not prove the screenshot path works. Jobs are serial and state updates are polled, so a busy queue adds delay. A failed refresh preserves an existing image, while a URL change clears it.

## API stalls when capture starts

Slow synchronous Playwright initialization on the HTTP event loop was reproduced blocking API responses and causing keep-alive connection resets. The implementation moves driver initialization and capture into `screenshot-worker.mjs`, through the `screenshot.mjs` parent wrapper. The HTTP thread keeps the serial queue, result-version checks, and all persistent writes.

When validating this change in an isolated deployment, verify that the image contains the worker module and that API requests remain responsive while the first capture starts. `/healthz` alone, before a capture, does not exercise this case. If stalls persist, inspect CPU throttling, host contention, and storage latency; increasing client timeouts does not establish that the HTTP event loop is responsive. Verify the deployed revision rather than assuming a source update has reached the running service.

## Dragging, grid, and language

Drop onto another tile to swap exactly those two positions; gaps cancel the drop. Use the grip on touch screens or arrow/Home/End keys with focus on the move control. Escape or loss of focus cancels a drag. Fixed columns can require horizontal scrolling; overflow is paginated without removing tiles.

Save the chosen language in Settings. It persists in this browser's localStorage, not the shared database. Storage restrictions can prevent persistence; unsupported locale values fall back to English. A language-only save should not change the board revision.

## Recovery or publication questions

Do not delete/recreate a PVC as a first repair step. Stop writers, preserve the current state, and restore a consistent recovery set using the cutover/rollback runbook.

The public source has a clean history. Historical private material remains in `speeddial-private`; never import that history or private recovery artifacts into public source. Code updates and private data restores are separate operations.
