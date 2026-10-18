# Application screenshots

`speedial-local.jpg` is a real 1440 × 810 browser capture of the browser-local
edition at source commit `048f67a`, taken on 2026-10-17. It shows the English
interface with its controls expanded and twelve synthetic bookmarks. The
colored bookmark covers are demo artwork, not captured websites. This is not a
capture of the separate self-hosted server edition.

The README hero projects that same screenshot onto a gently tilted plane with a
neutral background and a soft shadow. The interface is not redrawn, and the
[flat screenshot](speedial-local.jpg) remains available for detailed inspection.

## Capture a replacement

1. Run `npm run build:local` from the repository root.
2. Serve only `dist/local` on an unused loopback port, for example:
   `python3 -m http.server 43821 --bind 127.0.0.1 --directory dist/local`.
3. Open that local address in a fresh browser profile or unused origin. Do not
   import into a browser board that contains personal bookmarks.
4. Expand the controls, choose **Import backup**, and select
   [`demo-board.json`](demo-board.json). Confirm only after the preview shows
   twelve sites and twelve images. This public fixture contains only fictional
   covers and `example.com` links.
5. Dismiss the import notification. Capture the page at a 1440 × 810 viewport
   with controls expanded, without browser chrome or an open dialog. Save it as
   `docs/images/speedial-local.jpg`, and record the new source revision here.
6. Run `bash scripts/render-docs-hero.sh`, then inspect both images and run
   `node scripts/check-docs.mjs` before committing.

The renderer uses ImageMagick 7 (validated with 7.1.2-31). The same image and
renderer version reproduce the hero; different versions may resample pixels
slightly differently. It refuses a different source size so that a future
capture cannot silently distort the layout.
