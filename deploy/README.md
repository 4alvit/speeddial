# Self-hosted deployment, migration and recovery

This guide covers deploying and recovering the self-hosted edition. The public source includes a Docker build and a generic Kubernetes base. Use your own protected operational repository for overlays, data, credentials and acceptance records, and pin the public source revision or verified image digest you deploy.

This runbook uses generic names. Resolve the actual cluster context, namespace, deployment, PVC, image registry, ingress route, and private backup location from protected operator inventory. Do not write those values or live access links back into publication-facing documentation.

## Runtime contract

The application requires external `ACCESS_TOKEN_FILE` and `SESSION_KEY_FILE` and uses `/?access=<token>` for page entry. Session validation is bound to the token digest and optional `AUTH_EPOCH`, so changed credentials/epoch revoke old cookies after restart. There is no editor password or built-in access token.

Private legacy image bytes move from the old image/source tree to `DATA_DIR/legacy-images`. Their application URLs remain compatible with stored board references. New databases are empty unless an external `INITIAL_STATE_FILE` is supplied. Existing databases, order, settings, and retained history must be preserved.

The example Kubernetes manifests are intentionally generic. They require an immutable verified image, the exact HTTPS origin, an appropriate storage/node overlay, and a Secret mounted read-only at `/run/secrets/speeddial`. The `speeddial-access` Secret must provide `access-token` and `session-key`; neither value belongs in Git. Verify that file mode/group ownership allow the non-root application to read them. The example `AUTH_EPOCH` is a version marker, not a secret.

The legacy redirect is optional and is not part of the default kustomization. Configure it only if required; preserve query parameters without embedding or injecting a token. The network-policy tunnel selector also needs an operator-specific overlay.

## 1. Establish recovery and rollback inputs

Record the currently running image digest, manifests, storage placement, board state, and actual auth behavior in a private change record. Capture the current credential/configuration set where applicable. Do not assume an old image understands the new environment variables or data layout.

For a migration cutover, freeze writes and stop the application before taking the final application-consistent snapshot. Copy that snapshot off the storage node. It must include SQLite, all generated/uploaded images, original legacy image bytes needed by current or historical references, and the credentials required by the corresponding release. Validate the backup with an isolated restore and SQLite integrity check before scheduling cutover.

Retain the private pre-cutover data and manifests for recovery evidence. Do not delete original private assets or rewrite old private history as part of migration preparation. Prepare a rollback target that uses a compatible fixed application and the new credential contract; do not plan to restore the vulnerable access model or an old signing key.

## 2. Rehearse on an isolated copy

Use separate storage, separate credentials, and no public route. Keep the original volume intact as recovery. Freeze writes and stop all writers before taking a cutover snapshot; use an offline copy for rehearsal. Run the reviewed migration utility against the copy, following its checked-in help. Its purpose is to place legacy thumbnail bytes under `legacy-images/` while preserving board values and history; it must not reseed or renumber existing bookmarks.

Use [the migration utility](../scripts/migrate-private-data.py) from the same reviewed source revision as the image. The variables below are private operator-supplied paths, not literal deployment values. `migrate`, `rollback`, and `credentials` default to a dry run; they do not create their requested destination unless `--execute` is supplied. Dry-run migration validates through a private temporary workspace.

```sh
python3 scripts/migrate-private-data.py migrate \
  --source-archive "$SD_BACKUP_ARCHIVE" \
  --legacy-images "$SD_LEGACY_IMAGES" \
  --destination "$SD_NEW_DATA_DIR"
```

Use `--source-dir "$SD_STOPPED_SNAPSHOT"` instead of `--source-archive` for an already stopped consistent data snapshot. The two sources are alternatives. The destination must be new; the tool must never run against the live data directory. Add `--execute` only for the approved isolated rehearsal or later authorized cutover.

After an executed offline migration, verify the sealed output:

```sh
python3 scripts/migrate-private-data.py verify --source-dir "$SD_NEW_DATA_DIR"
```

Migration preserves board/history values and referenced image bytes and omits the old `session.key`. It writes a private `migration-manifest.json` with filenames and hashes. Keep that manifest out of publication artifacts. Verification applies to a sealed offline result; normal server writes make the original manifest stale. Before future migration/recovery verification, create a fresh stopped snapshot rather than treating a live database as the sealed result.

If recovering directly from a saved HTML archive rather than an existing database, [the extraction utility](../legacy/extract.py) accepts `--html "$SD_PRIVATE_HTML" --output "$SD_NEW_IMPORT_DIR"`, with optional `--encoding`, `--manifest`, and `--expected-count`. Output must be new or empty. It writes `seed.json`, provenance, and `legacy-images/`; keep all outputs private, set `INITIAL_STATE_FILE` explicitly for a new database, and place its images under `DATA_DIR/legacy-images`. This extraction path is not a replacement for preserving an existing SQLite board.

Keep the verified migration output sealed and read-only. Create a separate writable copy of that output for the rehearsal; never start the server against the sealed snapshot. Start the new image with independent test credential files and the writable rehearsal copy. Verify IDs, order, titles, URLs, settings, current/history image references, SQLite integrity, and empty-start behavior with no initial state. Exercise token/key/epoch rotation in isolation and confirm old cookies fail after restart. Confirm the image contains no private legacy assets or embedded credentials.

## 3. Prepare protected credentials and image

Generate a random URL-safe access token of at least 32 characters and a signing key of at least 32 raw bytes. A random 32-byte token encoded as base64url and a random 48-byte key are suitable formats. Store files with restrictive permissions and transfer them through the operator's secret-management process. Do not print them in build logs or pass complete entry links in command-line arguments.

The credential helper creates appropriately sized random values without printing them:

```sh
python3 scripts/migrate-private-data.py credentials --destination "$SD_NEW_AUTH_DIR"
```

This command is a dry run. Adding `--execute` creates a new mode-0700 directory with mode-0600 `access-token` and `session-key` files; it does not update Kubernetes or rotate a running service.

Create/update the Kubernetes Secret from files through the established secret workflow. Confirm the application receives the required paths, chosen epoch, exact public origin, and data mount. Build and scan the application image, record its immutable digest, and render the final overlay for review. Validate the manifests with a server-side dry run before any application change.

### Prove the old session before cutover

The full cutover verifier is [verify-access.mjs](../scripts/verify-access.mjs). It is not a key-only or epoch-only rotation checker: it expects the old entry query to stop working after the migration. All modes use the same protected file paths and public origin:

```sh
node scripts/verify-access.mjs \
  --origin "$SD_PUBLIC_ORIGIN" \
  --token-file "$SD_NEW_TOKEN_FILE" \
  --old-query-file "$SD_OLD_QUERY_FILE" \
  --old-cookie-file "$SD_OLD_COOKIE_FILE" \
  --preflight-file "$SD_PREFLIGHT_FILE"
```

This default mode validates configuration and reads the new-token/current-query files without HTTP requests or output writes. `--token-file` always names the **new future token**, including during preflight. The old-query file contains only the current complete query string beginning with `?`. Token, query, cookie, and receipt paths must be distinct; never print their contents.

Immediately before an **authorized** cutover, freeze user edits and wait for every pending capture to finish while the old service is still running. Then capture proof of an actually valid old session and the quiescent board. `--prepare` refuses a board with pending captures:

```sh
node scripts/verify-access.mjs \
  --origin "$SD_PUBLIC_ORIGIN" \
  --token-file "$SD_NEW_TOKEN_FILE" \
  --old-query-file "$SD_OLD_QUERY_FILE" \
  --old-cookie-file "$SD_OLD_COOKIE_FILE" \
  --preflight-file "$SD_PREFLIGHT_FILE" \
  --prepare
```

Preparation checks that the old entry and old-session API both return 200. It exclusively creates mode-0600 files for the actual issued cookie and a hash-bound preflight receipt; existing outputs are not overwritten. The receipt binds the origin, new token, old query, issued cookie, and the complete `/api/export` hash. Keep edits frozen. Stop the writer and take the final consistent snapshot immediately afterward, so the state copied to the new volume is exactly the preflight state. Use fresh private output paths for a new attempt. The cookie file contains only the cookie name/value pair, without attributes.

The preflight command is a live, read-only access check and private-file write; run it deliberately against the intended installation. Capture it close enough to cutover that the receipt is less than eight hours old and the old cookie still has more than 60 seconds of validity when the post-cutover verifier runs. An expired or fabricated cookie cannot prove revocation.

## 4. Perform an authorized cutover

1. Keep the authorized maintenance window active and edits frozen after the successful old-service preflight. Do not allow new capture requests or other changes.
2. Immediately stop the single application writer after preflight. Wait until it has terminated, then record the quiescent recovery state.
3. Take a final consistent recovery copy. Prepare migrated data in a **new private PVC or copied volume**, using the reviewed utility and flags tested during rehearsal. Keep the original PVC untouched and retain the sealed snapshot; do not delete either. Make the new runtime volume a writable copy of the verified sealed output.
4. Mount the new credentials, select the verified immutable image, and apply the reviewed private overlay that explicitly switches the data claim to the new volume. Treat that claim switch as part of the approved cutover. Keep a single replica.
5. Wait for readiness and inspect startup errors without exposing secret content. A health response alone is not acceptance.
6. Verify the new entry link privately, rejection of old cookies and invalid tokens, gated images/API, migrated previews, board preservation, five languages, and screenshot networking.
7. Reopen intended ingress and share the new link only through the approved private channel. Retain the recovery set until the rollback window closes.

After the authorized full cutover, execute verification using the same bound files:

```sh
node scripts/verify-access.mjs \
  --origin "$SD_PUBLIC_ORIGIN" \
  --token-file "$SD_NEW_TOKEN_FILE" \
  --old-query-file "$SD_OLD_QUERY_FILE" \
  --old-cookie-file "$SD_OLD_COOKIE_FILE" \
  --preflight-file "$SD_PREFLIGHT_FILE" \
  --execute
```

The verifier requires a matching, fresh preflight receipt and an unexpired old cookie. It checks rejection of the old query and old cookie, acceptance of the new entry, cookie flags, gated API/images, cross-origin rejection, an unchanged board export throughout the probe, and an exact match to the pre-cutover export hash in the preflight receipt. It sends deliberately invalid write requests to confirm rejection; it is not a pure HTTP-GET probe. Do not edit or substitute any bound file between preparation and execution. A failed or expired preflight requires a reviewed fresh attempt, not bypassing verification.

For this full security cutover, the preflight requires settled captures and frozen edits, so the export must match exactly across the migration. Unexpected resumed captures or any other export change require investigation; do not dismiss a verifier mismatch as normal revision drift. If any required state or auth check fails, keep writes stopped and use the recovery procedure rather than repeatedly modifying the live database.

## 5. Roll back deliberately

Stop the writer and preserve a separate copy of post-cutover data for investigation. Prepare a fresh restore directory from a verified stopped recovery set:

```sh
python3 scripts/migrate-private-data.py rollback \
  --source-dir "$SD_SEALED_RECOVERY_DATA" \
  --destination "$SD_NEW_RESTORE_DIR"
```

This is a dry run; `--execute` prepares data in an exclusive new directory. The helper does not change deployments, replace a live PVC, copy auth into the new runtime, or restore an old application image. Verify the resulting sealed copy before using it.

Use a compatible fixed application with the **current new token/signing key**. Do not restore the historical vulnerable image, old fixed query gate, or old `session.key`. If safe binary compatibility is not available, keep ingress restricted and repair forward instead of reverting the security boundary.

Restore a single consistent data set, never a mixture of old SQLite and newer WAL files. Update the runtime data mount only during the authorized maintenance window, then validate bookmarks, images, settings, and rejection of old credentials before reopening service. Keep private recovery artifacts and new credentials protected; record the actual outcome privately.

## Publication remains separate

The public repository has a clean source history and synthetic assets. Keep the old private repository history, backup archives, historical images and attachments private. Store deployment acceptance in your private operational records without placing real tokens, hostnames, registry addresses, node IDs or backup locations in public documentation.
