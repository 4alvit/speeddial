# Security model

The separate [browser-local Speedial edition](docs/local-speedial.md) is publicly available at [speedial.alvit.here.now](https://speedial.alvit.here.now/) and publishes only allowlisted frontend code. Its IndexedDB data stays in each browser profile and origin; another visitor starts with an empty board. IDs and the public site address are not cloud access keys. Different hosting aliases do not share the local board. Complete JSON backups contain readable links and image bytes. Import reads the file locally and replaces the destination board only after validation and confirmation; it does not publish or synchronize the board. Protect backup files as private data. Browser profile access, XSS, extensions and compromised future app updates remain relevant risks. The server-specific access model below does not apply to the public local edition.

The server-specific sections below describe the implementation in this public source repository. Deployments need their own credentials, data protection, upgrade testing and acceptance checks; source publication does not deploy or rotate any running service.

## Shared bearer access

Each page visit requires `/?access=<token>`, where the token is loaded from the required `ACCESS_TOKEN_FILE`. After trimming whitespace, it must be at least 32 URL-safe characters. Generate it with a cryptographically secure random source; length validation alone does not make a predictable phrase safe.

Anyone holding the complete entry link can read, edit, delete, and export the shared board. There are no individual users, read-only roles, per-user audit identities, or separate editor passwords. Use an additional identity-aware access layer if your audience requires those controls.

The full link can appear in browser history or upstream request logs. Do not commit it, paste it into public issues, include it in screenshots, or record it in shared logs. Use HTTPS and limit access to proxy logs. Referrer policy and no-store headers reduce some accidental exposure but cannot erase a copied link or existing logs.

## External keys and revocation

`SESSION_KEY_FILE` contains at least 32 raw bytes used to sign sessions. Keep both credential files outside source control, outside the image, and readable only by the application and authorized operators. Missing or invalid credentials must stop startup; no fixed source-code token is available as a fallback.

The session signing domain incorporates a digest of the access token and optional `AUTH_EPOCH`. Changing the token, the signing key, or the epoch invalidates earlier cookies after application restart. Files are loaded at startup: updating a mounted Secret without restarting does not complete rotation. Rotate the token to revoke a leaked entry link; changing only the key or epoch revokes cookies but lets holders of the unchanged token sign in again.

Valid signed cookies authorize images, assets, reads, and edits for eight hours. Root/index page navigation still requires the correct token. Cookies are HttpOnly and SameSite=Strict; HTTPS `PUBLIC_ORIGIN` enables Secure. The health endpoint is intentionally unauthenticated.

## Request and screenshot boundaries

Mutations require JSON, reject a supplied foreign Origin and cross-site Fetch Metadata, and support revision checks. A non-browser request can omit Origin; possession of an authorized session remains the access requirement. Browser clients must preserve revision checks instead of bypassing conflicts.

The server sends a restrictive same-origin CSP, no-referrer, nosniff, frame denial, noindex, and no-store responses. These are controls, not a promise that private data can never be copied.

Screenshots use a fresh Chromium context and a proxy that pins approved public IPv4 addresses per connection. Standard HTTP/HTTPS ports are allowed; private, loopback, link-local, reserved, and metadata destinations are rejected. Kubernetes egress policy provides a further boundary when the cluster network enforces it. No personal browser cookies are supplied to captures.

Chromium currently uses `--no-sandbox`. Do not claim Chromium's own sandbox as a defense. Preserve non-root execution, dropped capabilities, no privilege escalation, no service-account token, a read-only image filesystem, restricted egress, and timely dependency/browser updates. The application has bounded request/image sizes and a serial queue but no per-user rate limits.

## Private data and publication

`DATA_DIR` contains private board data, history, generated/uploaded images, and optional `legacy-images/`. An external `INITIAL_STATE_FILE` can seed a new database; the default board is empty. Private seeds and migrated images must not be included in a source release or image layer. Back up data and external credentials through a protected operator-managed process.

This public repository has a new source history with synthetic fixtures. The earlier history is retained in the separate private operational repository `speeddial-private` and must not be imported here. Keep real deployment records, data, backups, credentials and historical private container images outside public releases. Audit new commits and build contexts as well as release attachments.

## Reporting

Report vulnerabilities privately to the repository owner using an established trusted channel. Use private vulnerability reporting if available; do not assume it is enabled. Include the affected source revision, a minimal reproduction using synthetic data, and impact. Do not send real tokens, cookies, bookmarks, backups, or signing keys. No response-time guarantee or historical-version support promise is made.
