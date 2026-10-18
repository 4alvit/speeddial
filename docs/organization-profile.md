# Organization profile README example

The [copyable Alvit profile README](examples/organization-profile/README.md) presents the public app and [source repository](https://github.com/4alvit/speeddial), without exposing operational recovery records or personal boards. Its diagram is embedded Mermaid, so the example has no repository-relative image dependencies.

The example describes both available editions: the public browser-local app and the self-hosted server application with Node.js, Docker and k3s support. It does not imply that server access, source distribution or personal data is public. The main README covers [Docker](../README.md#docker) and [k3s / Kubernetes](../README.md#k3s--kubernetes); the [browser backup guide](browser-backups.md) covers explicit transfers between profiles.

## Where it belongs

For a public organization profile, GitHub reads `profile/README.md` from the organization's public `.github` repository. For Alvit, the intended destination is `4alvit/.github`, path `profile/README.md`. This differs from a personal account README named after the user. See [GitHub's organization profile instructions](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/customizing-your-organizations-profile).

This change supplies an example in the Speed Dial repository. It does not create or modify the organization's `.github` repository, change repository visibility, or publish the profile.

## Apply the example when publishing the profile

1. Inspect the existing `4alvit/.github` profile before editing. Preserve unrelated organization information and the repository's default community-health files and automation.
2. Copy the example into `profile/README.md` in that repository, or merge its Speed Dial section into the existing profile. Use the repository's normal reviewed pull-request process.
3. Preview the Markdown and Mermaid diagram. Keep the primary app address unchanged: other hostnames have separate browser storage.
4. Review the public view while signed out. Confirm that every linked destination is public and that no private screenshots, real bookmarks, backup files, access links or internal service addresses were included.

Only public profile text and links belong in the organization profile. Private repository history, operational files, backups and personal images remain excluded. Link to this public source repository for Docker/k3s instructions.

## Keep it accurate

Update the example when supported languages, image capture behavior, browser storage or deployment options change. Keep local export/import distinct from synchronization, and distinguish source support for Docker/k3s from any claim about a live deployment. The script-managed `backups/` directory remains local and ignored by Git; it is never profile content.
