# Speed Dial wiki

Open the public [Speed Dial app](https://speeddial.alvit.here.now/) at its primary address. Each browser profile starts with an empty board and keeps its links and images locally. See [local storage, privacy, backup transfers and publication](../docs/local-speedial.md). The public app does not share the self-hosted application's database or access link.

[English README](../README.md) · [Русский](../README.ru.md) · [Deutsch](../README.de.md) · [Français](../README.fr.md) · [Español](../README.es.md)

This wiki documents public application source and generic deployment procedures. Private recovery records and historical material belong in `speeddial-private`. No live credentials, private hostnames, personal images or backup locations belong in these pages.

## Use and understand

Start with the [user guide](User-Guide.md), [configuration](Configuration.md), and [troubleshooting](Troubleshooting.md). For implementation details, read [architecture](Architecture.md), [HTTP API](API.md), and [localization](Localization.md).

For a complete local copy of a browser board, use the [backup and restore scripts](../docs/browser-backups.md) ([по-русски](../docs/browser-backups.ru.md)). They guide export from the actual browser profile, keep private JSON copies out of Git and verify an explicit transfer into the destination profile. Installing or updating the app alone does not copy that data.

![Application, storage, and credential boundaries](images/architecture.svg)

## Operate and review

The [operations guide](Operations.md) explains backups, validation, and sessions. The [cutover/rollback runbook](../deploy/README.md) covers deployment and migration. [Security](../SECURITY.md) explains the shared bearer-link model and why current-tree cleanup does not clean repository history.

The public browser app is an additional deployment option. The [server edition](../README.md#self-hosted-edition), Docker image, k3s manifests and server recovery procedures remain available. Browser JSON backups and server database/image recovery sets serve different editions and are not interchangeable.

For hosted-default CI, optional separately provisioned runners and reviewed merging, use the [CI runbook and diagram](../docs/CI.md). Private persistent runners are not exposed to this public repository.

[Source and deployment process](Process-and-Results.md) and its [Russian version](Process-and-Results.ru.md) explain repository boundaries and verification. Private deployment acceptance is recorded outside this public source.

Edit this source-controlled wiki together with the code. Native GitHub Wiki, when available, is only an optional publication target; see [documentation maintenance](../docs/README.md).

The [organization profile guide and copyable README](../docs/organization-profile.md) provide a public-facing introduction with links to public source and no operational data.
