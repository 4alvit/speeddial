# Changelog

## Unreleased

- Add public RC-only fuzz assessment for portable backup validation and raster dimension headers, with locked Jazzer.js tooling, committed regression inputs and source-bound evidence.

## Public source baseline — 2026-10-17

- Create a public source repository with a new Git history and synthetic fixtures. Historical private material remains in the separate `speeddial-private` repository.
- Keep reusable browser and server code, Docker support, generic Kubernetes manifests, tests, five interface languages and five README versions together.
- Keep repository administration, private runner provisioning, deployment evidence, credentials and data outside public source. Private deployments consume a pinned public revision or verified immutable image without maintaining a second application copy.
- Retain shared CI runner selection with GitHub-hosted execution by default, full hosted browser coverage and metadata-only reviewed merging.
- Preserve `UNLICENSED`; source visibility is not an open-source redistribution license.

### Browser-local Speed Dial

- Publish [Speed Dial](https://speeddial.alvit.here.now/) with empty initial boards, IndexedDB metadata and image bytes, transactional revisions and no board network client.
- Support pairwise drag-and-drop, compact controls, configurable rows and columns, link targets and five interface languages.
- Support complete JSON backup export, validated replacement import, image upload/paste and browser persistence requests.
- Include interactive backup/restore helpers that preserve a destination rescue copy and compare ordered links, image bytes and settings after restore. Files stay in Git-ignored `backups/` and are excluded from image and static-site builds.
- Test independent-browser privacy and backup behavior. Automatic screenshots and cloud synchronization remain outside this edition.

### Self-hosted Speed Dial

- Support Node.js, Docker and Kubernetes with SQLite and persistent image storage.
- Read access-token and signing-key files externally; require the page access token and bind signed sessions to the token digest and optional `AUTH_EPOCH`.
- Start fresh databases empty unless an explicit external initial state is supplied.
- Capture website screenshots in a worker through a restricted public-network proxy, with version checks that prevent stale results from replacing newer edits.
- Provide offline data migration, credential preparation, access verification, backup and rollback procedures. Keep private legacy images under the data volume rather than source or container layers.

This baseline records source capabilities. Private deployment acceptance, live credentials, personal board contents and historical operational receipts are not public release artifacts.
