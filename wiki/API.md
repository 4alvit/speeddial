# HTTP API

[Wiki home](Home.md) · [Architecture](Architecture.md)

The self-hosted API is same-origin and JSON-based. There is no separate editor session, import endpoint, or public read API. Visit `/?access=<token>` with the operator-provided token to receive the signed session cookie; it authorizes both reads and writes.

The token comes from `ACCESS_TOKEN_FILE`, the signing key from `SESSION_KEY_FILE`. Do not hard-code either into API clients or examples. Every root/index navigation still requires the token even when a cookie exists. Changing the token, key, or optional `AUTH_EPOCH` invalidates older cookies after application restart.

This page describes the self-hosted edition. The public [Speed Dial app](https://speeddial.alvit.here.now/) uses browser-local storage and no shared HTTP API or automatic screenshot service. See [local architecture, privacy and backup transfers](../docs/local-speedial.md).

## Read state safely

An API client should load the token from a protected file, construct the entry URL in memory, retain the returned cookie privately, and use it for subsequent same-origin requests. Avoid putting the complete entry URL in process arguments, command history, shared logs, or test output. Use synthetic state for examples and tests.

`GET /api/state` returns the board plus `authenticated: true`. For example, a **synthetic** one-tile state looks like this:

```json
{
  "revision": 12,
  "layout": { "rows": 4, "columns": 5 },
  "openLinksIn": "same-window",
  "tiles": [
    {
      "id": "example-id",
      "title": "Example",
      "url": "https://example.com/",
      "image": "/images/example.jpg",
      "generation": "example-generation",
      "screenshotStatus": "ready",
      "screenshotError": null
    }
  ],
  "authenticated": true
}
```

`GET /api/export` returns the stored board without the `authenticated` field and with an attachment disposition. It includes image paths, not image bytes. `GET /healthz` returns `{"status":"ok"}` without a cookie. That endpoint reports an HTTP process response; it does not test screenshot generation or backup integrity.

## Mutation rules

Send `Content-Type: application/json`, the session cookie, and the exact same-origin `Origin` header. The server rejects a supplied wrong Origin or `Sec-Fetch-Site: cross-site`; a non-browser client that omits Origin is not automatically rejected. Cookie possession remains the authorization requirement.

Always include the latest integer `revision` in mutation bodies. The current API permits omission for compatibility, but then optimistic concurrency protection is bypassed. A supplied revision differing from the current board receives 409. A screenshot completing between reads can also advance the revision. Reload state, reconsider the change, and resubmit with the new revision; do not blindly overwrite another edit.

All successful mutations below return HTTP 200 and the entire updated board with `authenticated: true`. They increment the revision and retain a pre-edit snapshot. JSON bodies must be objects and may not exceed 8 MiB.

## Endpoints

### Create a bookmark

`POST /api/tiles`

```json
{ "revision": 12, "url": "https://example.com/", "title": "Example" }
```

`url` is required, at most 4096 characters, absolute HTTP(S), and without embedded username/password. `title` is optional; a blank title becomes the hostname. The server and browser editor allow at most 300 title characters. The board holds at most 500 bookmarks. Creation appends the tile with a pending capture.

Private-network URLs can be stored; automatic capture still applies the stricter public-network rules. Unsupported capture ports do not turn a bookmark into a valid screenshot destination.

### Edit or delete a bookmark

`PATCH /api/tiles/:id` accepts `revision` and an optional `url` and/or `title`. A changed URL clears the previous preview and starts a new capture. A title-only edit preserves the preview.

`DELETE /api/tiles/:id` takes a JSON body such as `{"revision":12}`. It removes the tile and cancels any waiting capture. Already-running work cannot restore the removed tile.

### Save grid preferences

`PUT /api/settings`

```json
{ "revision": 12, "rows": 4, "columns": 5, "openLinksIn": "same-window" }
```

Rows and columns must both be integers from 1 through 12. `openLinksIn` accepts `same-window` or `new-window`; omitting it preserves the existing value. These preferences are global to the board. Language is deliberately absent: it is a browser preference, not an API setting.

### Save the complete order

`PUT /api/order`

```json
{ "revision": 12, "ids": ["second-id", "first-id", "third-id"] }
```

Send every current tile ID exactly once, including tiles on other pages. Missing, duplicate, or unknown IDs are rejected. The API accepts a complete permutation. The UI implements a pairwise swap before submitting that permutation, so intermediate tiles remain fixed.

### Refresh or upload a preview

`POST /api/tiles/:id/screenshot` with `{"revision":12}` queues a new capture and returns before Chromium finishes. Poll state until `screenshotStatus` becomes `ready` or `error`. A refresh preserves the current preview while pending and on capture failure.

`POST /api/tiles/:id/image` accepts `revision` and a `data` field containing a base64 data URL. The API and browser uploader accept PNG, JPEG, WebP, and GIF. The API checks the file signature against the declared type. Decoded files must be between 12 bytes and 5 MiB. Uploading advances the generation so an older capture cannot overwrite it.

## Errors and compatibility

Errors use an English fallback `error` message and a stable `code` for localization. For example, an invalid URL returns `{"error":"Enter a full http:// or https:// URL without credentials","code":"INVALID_URL"}`. Clients should branch on status/code, not parse English prose. Capture failures also expose `screenshotErrorCode: "SCREENSHOT_FAILED"` alongside the fallback `screenshotError` text; a new attempt or successful upload clears the error code.

- **400** — malformed JSON, invalid fields, invalid image, invalid order, or board limit reached.
- **403** — a write supplied a disallowed Origin or cross-site Fetch Metadata.
- **404** — missing/expired/invalid access cookie, unkeyed page, missing tile, or unknown route. The removed login/logout routes also return 404.
- **405** — unsupported method for a recognized route.
- **409** — revision conflict; reload before retrying.
- **413** — JSON request exceeded the 8 MiB body limit or a decoded image exceeded 5 MiB.
- **415** — mutation body is not sent as JSON.
- **500** — unexpected server error; inspect server logs without publishing private URLs or data.

The app is a private, versioned deployment; it does not currently promise a separately versioned public API. Keep client and server changes in the same reviewed release.
