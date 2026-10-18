# Operations

[Wiki home](Home.md) · [Configuration](Configuration.md) · [Cutover and rollback](../deploy/README.md)

The self-hosted edition requires external credentials and a private data volume. For an older installation, follow the migration runbook before an ordinary upgrade because its access model and legacy image layout may differ.

## Public Speed Dial publication and personal transfers

The separate public app is live at [speeddial.alvit.here.now](https://speeddial.alvit.here.now/). Publish only the explicit `dist/local` build allowlist and preserve this primary address so existing browser data remains at the same origin. Keep the former `speedial.alvit.here.now` site available for exports as described in the [address migration notes](../docs/local-speedial.md#corrected-address-and-existing-backups). The app contains no initial personal board; each new browser profile starts empty.

Treat app updates and data transfers as separate operations. A deployment updates code and cannot transfer an existing board into a real browser. For an authorized personal transfer, use a complete local JSON backup, import it in the intended browser profile at the primary address, and verify order, images and settings after reload. Preserve a private source backup until verification succeeds. Never include the transfer file, real screenshots or private data inventories in hosting assets, Git, logs or documentation.

Follow the [private migration and real-browser verification runbook](../docs/browser-migration.md) for an existing board. Use the [local publication and transfer guide](../docs/local-speedial.md) for update concurrency, browser privacy checks and the older server-export limitation. Existing private-service deployment and credential rotation remain separate from this public app.

For the public browser-local app, use the [local browser backup scripts](../docs/browser-backups.md) to preserve complete JSON copies under the ignored `backups/` directory and verify a deliberate transfer. This is separate from the server database recovery procedure below.

These helpers are interactive: the operator selects the actual browser profile, exports its board and confirms the app's replacement import. A restore first preserves the destination board, then compares a fresh post-reload export with the source, including ordered links, images and settings. Follow the guide's visual checks; a matching file alone cannot identify which browser profile supplied it.

## Supported deployment paths

The static public app does not replace the server application. Node.js startup, the Docker image and k3s deployment remain supported source paths; see the [main README](../README.md#self-hosted-edition) and [server cutover runbook](../deploy/README.md). The server keeps its SQLite database and image directories on persistent storage, while the public app keeps a separate board in each browser profile. Applying a server image cannot restore browser-local data, and importing a browser JSON file is not a server recovery procedure.

## CI runners and automatic merging

Public CI runs required Chromium, Firefox and WebKit checks on Linux, Chromium on Windows and WebKit on macOS using GitHub-hosted runners. Extended manual/scheduled checks cover additional targets. Private persistent runners and their provisioning are outside this public repository. The [CI runbook](../docs/CI.md) covers checks, independent review and the `automerge` opt-in; the [flow diagram](../docs/images/ci-runner-routing.svg) shows source checks and metadata jobs.

Manage repository variables and private infrastructure in their owning administrative repository. A ready PR requires successful validation and an independent approval of its current head. A source merge does not deploy the application or rotate credentials.

## Release preparation

Run source, documentation, browser, and security checks on synthetic fixtures. Build an image without runtime data, old source archives, private thumbnails, credentials, or environment-specific infrastructure details. Read back its immutable digest and labels. A source push or successful build does not prove a successful deployment.

Use one application process per SQLite volume. Preserve data during a `Recreate` rollout and plan for a short interruption. Set the exact external `PUBLIC_ORIGIN`; mount `ACCESS_TOKEN_FILE` and `SESSION_KEY_FILE` read-only. Check node/storage placement, Secret permissions, ingress selectors, and egress enforcement in the actual operator overlay.

## Acceptance checks

After an authorized rollout, validate through both the internal service and public HTTPS path:

- `/healthz` responds, with the understanding that this alone does not validate storage or captures.
- An empty, missing, or wrong token gives 404; a bare page remains 404 even with a valid cookie.
- The operator's valid token grants a session. Assets and state require the cookie; old pre-rotation cookies fail.
- All expected bookmark IDs, ordering, titles, URLs, settings, and image references are preserved. For the full security cutover, freeze edits and settle captures before the old-service preflight, then stop the writer and snapshot immediately. The post-cutover verifier requires the complete export to match the preflight hash exactly. On unrelated ordinary releases, pending captures can legitimately advance revision/image/status fields and must be accounted for separately.
- The header starts collapsed, all languages work, dragging swaps only two tiles, and same-window navigation remains the default.
- Migrated legacy image paths return their bytes from the data volume, while a fresh unseeded instance is empty.
- No private token or complete entry URL appears in shared logs, deployment receipts, shell output, or screenshots.

A real screenshot test is separate from deterministic fixtures. Prefer an isolated capture of a public example site without changing the shared board. `test/smoke-live.mjs`, if used, mutates a board and is not a read-only health probe.

## Backup and restore

A complete recovery set includes a consistent SQLite database and sidecars, `images/`, `legacy-images/`, any external initial state needed for reconstruction, both credential files, the configured epoch, and the matching image/manifest revision. Keep the secrets protected separately as appropriate. A database-only or JSON-only export does not contain all image bytes or credentials.

The simplest consistent backup is offline: record the state, stop the single writer, mount its PVC with a maintenance pod that does not launch the server, then copy data to private off-node storage. Verify SQLite integrity and all referenced images on the copy. Record a private manifest of files/hashes and image identity. Never put that private manifest or backup path in public documentation.

For an online snapshot, coordinate an SQLite-consistent snapshot with the image set and concurrent writes; a plain copy of a live main database file is insufficient. A successful copy is not a verified restore. Keep the verified snapshot sealed and read-only. Rehearse recovery on a separate writable copy in isolated storage, using synthetic or appropriately protected private data and no public route. Do not launch the server on the sealed verification output.

Before restoring, stop the application and preserve a separate rescue copy of the current data. Restore one consistent backup set, not a mixture of database and WAL files from different points in time. Use a compatible fixed application and the current new credentials; never restore the historical vulnerable access model or old signing key. Verify permissions, credentials, images, and board state before reopening ingress.

A local-path volume does not survive loss of its node by itself. An off-node backup and a tested restore path are separate operational requirements; the application does not install a backup schedule or automatic failover.

## Rotation

Generate a new random token and/or signing key in protected external files; never pass them as visible command-line values. For session-only revocation, change `AUTH_EPOCH`. Keep the old recovery set protected until the new configuration is accepted. Restart the application to load the new values, confirm that old cookies fail and the new entry works, and distribute the new link only through the intended private channel.

Changing only the signing key or epoch revokes cookies but does not revoke the old entry token. To revoke a leaked link, rotate the token. Do not call a rotation complete merely because Secret bytes were updated.

## Source publication

The public `speeddial` repository owns application code, tests, documentation and generic deployment examples. Private operational repositories consume a pinned public revision or immutable image digest and keep overlays, credentials, data and recovery records private. Scan public commits, image layers and release attachments. Never merge the old private history into this clean source history.
