# Contributing

This is the public application source repository. Keep changes scoped and reviewable, and retain both supported editions: browser-local Speedial and the self-hosted server. Preserve compact collapsed controls, pairwise swaps, pointer-following previews and same-window links by default. The explicit page access query applies only to the server edition.

## Development

Use Node.js 24 or newer. Run `npm ci`, set `CHROMIUM_PATH` for a locally installed Chromium, and create development-only `ACCESS_TOKEN_FILE` and `SESSION_KEY_FILE` credentials using the [local setup instructions](README.md#local-development) before `npm start`. Never commit or print those credentials. A fresh database starts empty unless an external `INITIAL_STATE_FILE` is explicitly provided. The default `data/` directory is ignored. Use a temporary `DATA_DIR` for experiments instead of touching production data.

Run `npm run check` before proposing application changes. It includes syntax checks, documentation checks, and `npm test`. The API suite starts isolated servers and uses temporary databases and deterministic captures. It covers access, revisions, persistence, screenshot races, and validation. Translation checks cover catalog consistency. These tests do not prove a real site's screenshot or production routing works.

For a browser change, run `CHROMIUM_PATH=/path/to/chromium npm run test:browser` with a compatible Chromium, then inspect pointer dragging, keyboard movement, dialogs, small viewports, pagination, translated labels, and localStorage fallback. Do not use production bookmark mutations as a substitute for isolated UI tests.

## Code and data boundaries

- Keep user content and translation strings as text. Do not inject HTML from titles, URLs, errors, or catalogs.
- Preserve revision checks and generation guards. A screenshot must never overwrite a newer URL or upload.
- Keep application state under `DATA_DIR`; do not introduce runtime writes into the read-only image filesystem.
- Do not commit credentials, cookies, `.env`, runtime images/databases, Terraform plans/state, or upstream archives excluded by `.gitignore`.
- Maintain public-only screenshot networking and container restrictions. Discuss storage and security consequences before changing them.
- Do not increase replica count without redesigning SQLite ownership and queue coordination.

## Localization and documentation

Follow the [localization guide](wiki/Localization.md) for all five languages. A new control needs visible text and accessible names in every catalog. Language stays local to the browser; layout and link behavior stay on the shared board.

Update the English and localized READMEs when user-visible capabilities change. Add API or operational detail to the appropriate [wiki page](wiki/Home.md). Keep SVG diagrams editable and include a title and description; do not replace factual architecture with screenshots of a diagram. See [documentation maintenance](docs/README.md).

The changelog describes implementation changes. Record private deployment evidence in the separate operational repository, never in public source or test fixtures.

## Infrastructure and releases

Repository administration, private runner provisioning, DNS/tunnels and recovery records belong in private infrastructure repositories. Preserve their state ownership. This repository contains the reusable application code, Docker build and generic Kubernetes base; operational repositories consume a pinned source revision or verified immutable image.

Build immutable application images and follow the [operations runbook](wiki/Operations.md). Keep the PVC and original tiles intact. State clearly which checks passed and which production checks were not run.

The source remains `UNLICENSED`. Public visibility does not grant an open-source redistribution license. Do not add a license covering recovered third-party assets without confirming the relevant rights.
