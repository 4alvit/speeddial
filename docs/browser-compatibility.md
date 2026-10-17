# Browser and operating-system acceptance

The CI workflow runs the real frontend suite through the shared browser
pipeline. `CI_RUNNER_MODE=github` (also the unset default) uses GitHub-hosted
runners: pull requests require current Chromium, Firefox and WebKit on Linux,
Chromium on Windows, and WebKit on macOS. Weekly and manual runs expand from
these 5 required targets to all 35 targets in `.github/browser-compatibility.json`.

With `CI_RUNNER_MODE=self-hosted` or its `k3s` alias, trusted same-repository pull
requests and default-branch push/schedule/manual events use the Linux runner
labels in the JSON array `CI_RUNNER_LABELS`. Their inventory is
`.github/browser-compatibility-linux.json`: 3 required current engines, or
9 extended targets covering Chromium, Firefox and WebKit across three pinned
Playwright generations. For example, a qualified pool can use
`["self-hosted","Linux","X64","speeddial-public-ci"]`. Missing or invalid labels fail
closed; there is no implicit fallback to another self-hosted machine.

The Linux inventory is derived without rewriting any target's OS. Its 26 omitted
targets are 22 Windows/macOS targets and 4 Linux branded channels
(Chrome/Edge Stable and Beta). Those checks remain available by selecting
GitHub-hosted mode. A separately provisioned self-hosted image must supply bundled-engine OS
libraries; CI installs only the unprivileged bundled browser archives there. The shared workflow uses `--with-deps` only on
GitHub-hosted runners. A Linux success does not claim Windows or macOS coverage.

Fork pull requests, unsupported events and non-default manual runs cannot route
source code onto the self-hosted pool. They retain the GitHub-hosted inventory
and runners. Metadata-only approval and merge jobs run on GitHub-hosted machines
for this public repository. The private operational repository's persistent
runner is not registered here; see the [CI trust boundary](CI.md). Qualify a new,
separately isolated runner before enabling self-hosted mode.


The suite in `test/frontend-smoke.mjs` runs fourteen groups of actual assertions
against an isolated copy of the server and public frontend. It preserves the
existing five-language, local-storage, validation, drag/keyboard, pagination,
concurrent-edit, stale-response, upload and safe-navigation checks. Each target
uses its selected Playwright generation, records the actual browser version and
named passing groups, and retains a trace and failure screenshot.

The fixture uses synthetic bookmarks, temporary access/signing credentials, a
temporary persistent database and a synthetic screenshot provider. Unexpected
outbound browser requests fail the suite; the final navigation is fulfilled
locally. Production state, deployed boards, real screenshots and deployment
credentials are not used. Copying the frontend instead of creating a directory
symlink also supports Windows runners.

`Application checks` is the stable required aggregate: it depends on the complete
selected browser workflow and explicitly fails for a failed, cancelled or skipped
browser result. Its unit, language, documentation and CI policy checks
remain mandatory. Private Terraform and runner-provisioning checks are outside
this public source repository.
Individual matrix names vary by inventory; neither bot approval nor a successful
single browser is sufficient to pass the aggregate. The redundant single-engine
CI invocation is replaced by the same assertions in the required matrix;
`npm run test:browser` remains available locally with the application Playwright
dependency.

Playwright WebKit is not native Safari. Its Firefox build is not native Firefox
ESR, and a mobile viewport is not physical-device qualification. These are source
acceptance checks; this workflow does not claim a release-channel qualification
or deploy the site.

Refresh `.github/browser-compatibility.json` and the isolated toolchain locks
under `tools/browser-compatibility/` together using the reviewed shared toolkit
browser generator. Then run `node scripts/browser-matrix.mjs --write` to derive
the Linux inventory. `node scripts/browser-matrix.mjs` verifies it is current;
`node --test test/browser-policy.test.mjs` checks the exact platform/engine scope
and toolchain pins. Keep the three generations distinct from normal application
dependency updates.
