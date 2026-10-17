# Documentation maintenance

The [English README](../README.md), four localized READMEs and [wiki](../wiki/Home.md) document the public source. Browser-local Speedial and self-hosted Speed Dial have different storage and deployment models; name the edition when explaining backup, access or screenshot behavior.

Start with [browser backups](browser-backups.md) ([Русский](browser-backups.ru.md)) for Chrome and cross-browser restoration, or the main README's [Docker](../README.md#docker) and [k3s](../README.md#k3s--kubernetes) sections for server deployment. The [organization profile guide](organization-profile.md) includes a copyable README example.

## Source and private operations

This public repository contains reusable code, generic deployment examples and synthetic fixtures. `speeddial-private` owns private operational recovery records and consumes a pinned public revision or immutable image. Do not duplicate application code there or copy its old Git history here.

Use reserved example domains, synthetic bookmark data and generic deployment references. Link consistently to the [primary public app](https://speedial.alvit.here.now/), without personal board data or backup parameters. Never include real access tokens, working entry links, cookies, personal images, infrastructure addresses, backend identifiers or private backup paths. Backups in `backups/` remain local and Git-ignored.

## Source-controlled wiki

The canonical wiki lives in `wiki/`. A native GitHub Wiki is an optional publication target. Generate a review copy with:

```sh
python3 docs/export-wiki.py /tmp/speeddial-wiki-export
```

The exporter requires an absent or empty destination. It copies pages/assets and rewrites source links to the public repository; it does not authenticate or publish anything. Review the result before publishing. Use `--ref <commit-or-tag>` to pin external source links to a release.

## Editable diagrams

Six SVGs under `wiki/images/` are generated with Python's standard library. Edit [render-diagrams.py](render-diagrams.py), then run:

```sh
python3 docs/render-diagrams.py
python3 docs/render-diagrams.py --check
```

The architecture, request, screenshot and tile-swap diagrams describe implementation with synthetic examples. The process and repository-boundary diagrams distinguish reusable public code from private deployment/data. They are not live telemetry or claims of deployment acceptance.

Standalone SVGs in `docs/images/` cover CI, origin/profile separation and [private browser transfers](browser-migration.md). Edit their vector source directly. Every diagram needs a title, description and viewBox; preserve readable text, connected arrows and useful Markdown alt text. Do not invent performance measurements or test counts.

## Validation

See [CI runners and reviewed merging](CI.md) for runner selection, required checks and credential boundaries.

Run `npm run check` for syntax, links, generated SVG consistency and application tests. Build the local edition with `npm run build:local`; use `CHROMIUM_PATH=/path/to/chromium npm run test:local` for isolated profile and complete-backup scenarios, and `npm run test:browser` for the server frontend.

Keep APIs, startup requirements, translations and migration instructions consistent with the code. Review release files and images for private content as well: a link checker cannot establish privacy. Record private deployment outcomes only in protected operational records.
