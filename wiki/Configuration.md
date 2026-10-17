# Configuration

[Wiki home](Home.md) · [Deployment and recovery](../deploy/README.md)

This configuration applies to the self-hosted source in this repository. Validate credentials, data migration and routing separately for each deployment.

This page describes the self-hosted edition. The public [Speedial app](https://speedial.alvit.here.now/) uses browser-local storage and no shared HTTP API or automatic screenshot service. See [local architecture, privacy and backup transfers](../docs/local-speedial.md).

## Required external credentials

`ACCESS_TOKEN_FILE` points to a readable file containing a cryptographically random URL-safe access token. Surrounding whitespace is trimmed; the resulting token must contain at least 32 characters. Use only URL-safe letters, digits, hyphen, and underscore. Do not put the token in source, image layers, command-line arguments, public logs, or example links.

`SESSION_KEY_FILE` points to a readable file containing at least 32 raw bytes. It signs access sessions. Mount it separately from published application assets, with permissions restricting access to the application and authorized operators. Missing or invalid credentials must prevent startup; there is no built-in fallback access token or automatically published key.

`AUTH_EPOCH` is an optional operator-controlled session-version marker. Session signing incorporates a domain derived from the access-token digest and this marker. A token change, signing-key change, or epoch change invalidates previously issued cookies after restart. The process reads credentials at startup: replacing a mounted file without restarting is not a completed rotation.

The valid entry is `/?access=<token>`. The query remains required for every root/index page navigation. Its signed cookie grants access to assets, images, API reads, and editing. There is no separate editor login.

## Runtime environment

- `PORT` defaults to `3000`; the process listens on all container interfaces.
- `DATA_DIR` selects persistent application data and defaults to `./data` beside the server. It contains the SQLite database, `images/`, and optional `legacy-images/`.
- `INITIAL_STATE_FILE` optionally names an external JSON seed used only for a fresh database. The initial-state file is limited to 16 MiB. With no seed, a new database starts empty. Existing databases must never be overwritten by this setting. Keep private seeds outside Git and container images.
- `CHROMIUM_PATH` defaults to `/usr/bin/chromium`. Install Chromium separately when running outside the provided image.
- `PUBLIC_ORIGIN` is the exact external origin, such as `https://bookmarks.example.test`, without a path or trailing slash. An HTTPS value enables Secure cookies and supplies the expected write Origin. Empty configuration is for local HTTP development.
- `NODE_ENV=production` does not replace the explicit origin and credential configuration.

The application does not need a Kubernetes API token. Keep a writable temporary directory available for Chromium when the image filesystem is read-only.

## Shared and local preferences

`layout.rows` and `layout.columns` accept integers from 1–12; defaults are 4 and 5. `openLinksIn` is `same-window` by default or `new-window`. These fields are saved with the shared board. Existing boards missing them read defaults without reordering bookmarks.

Language is stored in the browser as `speeddial.language`, with English as the default. It is not written to SQLite or included in board exports. See [localization](Localization.md).

## Deployment and state ownership

Use one application replica per SQLite volume with a `Recreate` strategy. Select your own node/storage placement and internal service names; examples intentionally omit private infrastructure identifiers. Mount access-token and signing-key files read-only through your secret-management system.

Keep DNS/tunnel resources and repository-management resources with their existing Terraform state owners. Do not create a second state owner, copy backend identifiers into public examples, or mix unrelated infrastructure changes into a deployment.
