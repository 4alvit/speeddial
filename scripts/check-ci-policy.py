#!/usr/bin/env python3
"""Fail closed on changes to the reviewed workflow privilege boundaries.

This is a checker for this repository's restricted block-style workflow format,
not a general YAML parser. Unsupported constructs, duplicate keys, extra
credential-bearing jobs and changed metadata contracts require explicit review.
GitHub's full syntax is validated separately with actionlint.
"""

from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PIN = "2149218f2b98dd1ccab0960690a39ab998c92ba9"
TOOLKIT = "victron-venus/venus-os-ci-toolkit/.github/workflows/"
AUTHORS = '["4alvit","californiantiramisu","dependabot[bot]","renovate[bot]"]'
MODE = "(vars.CI_RUNNER_MODE == 'self-hosted' || vars.CI_RUNNER_MODE == 'k3s')"
DEFAULT_BRANCH = "github.ref == format('refs/heads/{0}', github.event.repository.default_branch)"
SAME_REPO = "github.event.pull_request.head.repo.full_name == github.repository"
TRUSTED_EVENT = (
    "((github.event_name == 'pull_request' && " + SAME_REPO + ") || "
    "(contains(fromJSON('[\"push\",\"schedule\",\"workflow_dispatch\"]'), github.event_name) && "
    + DEFAULT_BRANCH + "))"
)
CI_RUNNER = (
    "${{ fromJSON(" + MODE + " && " + TRUSTED_EVENT + " && "
    "(vars.CI_RUNNER_LABELS || '[]') || '[\"ubuntu-latest\"]') }}"
)
BROWSER_PIN = "9f82dae6eac27db5bd57e864a72010131a28107a"
BROWSER_MATRIX = (
    "${{ " + MODE + " && " + TRUSTED_EVENT
    + " && '.github/browser-compatibility-linux.json' || '.github/browser-compatibility.json' }}"
)
BROWSER_GATE = {
    "name": "Require all selected browser targets",
    "env": "BROWSER_RESULT: ${{ needs.browser-compatibility.result }}",
    "run": 'test "$BROWSER_RESULT" = success',
}
AUTOMATION_RUNNER = (
    "${{ github.event.repository.private && " + MODE
    + " && (vars.CI_RUNNER_AUTOMATION_LABELS || '[]') || '[\"ubuntu-latest\"]' }}"
)
APP_CHECK = "Application checks"
POLICY_COMMAND = "python3 -m unittest discover -s test -p 'test_ci_policy.py'"



class PolicyError(ValueError):
    """A reviewed workflow contract was changed."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise PolicyError(message)


def compact(value: str) -> str:
    return " ".join(value.split())


def lines(block: str) -> list[str]:
    return [line for line in block.splitlines() if line.strip() and not line.lstrip().startswith("#")]


def mapping(block: str, indent: int, location: str) -> dict[str, str]:
    """Extract direct block keys; reject duplicates, aliases and flow mappings."""
    result: dict[str, str] = {}
    key = None
    for line in lines(block):
        depth = len(line) - len(line.lstrip(" "))
        require("\t" not in line[:depth + 1], f"{location}: tabs are unsupported")
        require(depth >= indent, f"{location}: unexpected indentation")
        if depth == indent:
            match = re.fullmatch(r"([A-Za-z][A-Za-z0-9_-]*):(?:[ ]+(.*))?", line[indent:])
            require(match is not None, f"{location}: use reviewed block mapping syntax")
            key, value = match.group(1), match.group(2) or ""
            require(key not in result, f"{location}: duplicate key {key}")
            result[key] = value
        else:
            require(key is not None, f"{location}: unexpected nested content")
            result[key] += "\n" + line
    return result


def exact(actual: dict[str, str], expected: dict[str, str], location: str) -> None:
    require(set(actual) == set(expected), f"{location}: fields differ from reviewed contract")
    for key, value in expected.items():
        require(compact(actual[key]) == compact(value), f"{location}.{key}: reviewed contract changed")


def steps(block: str, location: str) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    current: list[str] = []
    for line in lines(block):
        if line.startswith("      - "):
            if current:
                result.append(mapping("\n".join(current), 8, location))
            current = ["        " + line[8:]]
        else:
            require(bool(current), f"{location}: unsupported sequence syntax")
            current.append(line)
    if current:
        result.append(mapping("\n".join(current), 8, location))
    require(bool(result), f"{location}: missing steps")
    return result


def read_workflows(root: Path = ROOT) -> dict[str, str]:
    directory = root / ".github/workflows"
    return {name: (directory / name).read_text() for name in ("ci.yml", "auto-approve.yml", "auto-merge.yml")}


def check_policy(sources: dict[str, str]) -> None:
    parsed = {}
    for filename, source in sources.items():
        root = mapping(source, 0, filename)
        require(set(root) == {"name", "on", "permissions", "concurrency", "jobs"},
                f"{filename}: unexpected top-level fields")
        parsed[filename] = root
    require(set(parsed) == {"ci.yml", "auto-approve.yml", "auto-merge.yml"}, "Missing policy workflows")
    ci = parsed["ci.yml"]
    require(ci["name"] == "CI", "The CI name must match the merge completion trigger")
    require(compact(ci["concurrency"]) == "group: ci-${{ github.ref }} cancel-in-progress: true",
            "CI must cancel obsolete runs on the same ref")
    exact(mapping(ci["permissions"], 2, "ci.permissions"), {"contents": "read"}, "ci.permissions")
    events = mapping(ci["on"], 2, "ci.on")
    require(set(events) == {"push", "pull_request", "workflow_dispatch", "schedule"}, "CI must not run privileged PR-target events")
    exact(mapping(events["push"], 4, "ci.push"), {"branches": "[main]"}, "ci.push")
    require(not events["pull_request"].strip(), "PR CI must not use filters that skip required checks")
    require(not events["workflow_dispatch"].strip(), "One-time bootstrap recovery is disabled")
    require(compact(events["schedule"]) == "- cron: '23 6 * * 2'", "Keep the reviewed extended-browser schedule")

    jobs = mapping(ci["jobs"], 2, "ci.jobs")
    require(set(jobs) == {"application", "browser-compatibility"}, "Unexpected CI job")
    exact(mapping(jobs["browser-compatibility"], 4, "browser"), {
        "uses": TOOLKIT + "typescript-ci.yml@" + BROWSER_PIN,
        "with": "node-version: '24' run-node-ci: false force-full: true browser-matrix-file: " + BROWSER_MATRIX
                + " browser-prepare-command: node scripts/browser-matrix.mjs && node --check test/frontend-smoke.mjs && node --check test/local-browser-smoke.mjs"
                + " browser-test-command: node test/frontend-smoke.mjs && node test/local-browser-smoke.mjs"
                + " browser-extended: ${{ github.event_name == 'schedule' || github.event_name == 'workflow_dispatch' }}",
    }, "browser")
    job_steps = {}
    for key, name in (("application", APP_CHECK),):
        job = mapping(jobs[key], 4, key)
        expected_keys = {"name", "runs-on", "timeout-minutes", "steps"}
        if key == "application":
            expected_keys |= {"needs", "if"}
            require(job.get("needs") == "browser-compatibility" and job.get("if") == "${{ !cancelled() }}",
                    "Application aggregate must wait for all browser targets and handle failed/skipped results")
        require(set(job) == expected_keys, f"{key}: extra job privileges or conditions")
        require(job["name"] == name, f"{key}: required check was renamed")
        require(job["runs-on"] == CI_RUNNER, f"{key}: trusted/fork runner selector changed")
        require(job["timeout-minutes"].isdigit() and 1 <= int(job["timeout-minutes"]) <= 30, f"{key}: unbounded timeout")
        require(re.search(r"\bsecrets\b", jobs[key]) is None, f"{key}: PR code must not receive repository secrets")
        source_steps = steps(job["steps"], key + ".steps")
        job_steps[key] = source_steps
        if key == "application":
            exact(source_steps[0], BROWSER_GATE, "browser.aggregate")
        for index, step in enumerate(source_steps):
            if key == "application" and index == 0:
                continue  # The only environment-bearing step is checked exactly above.
            require(set(step) <= {"name", "uses", "with", "run", "if", "working-directory"}, f"{key}: unreviewed step field")
            require(("uses" in step) != ("run" in step), f"{key}: each step requires exactly one action or command")
            if "uses" in step:
                action = step["uses"].split(" #", 1)[0]
                require(re.fullmatch(r"(actions/checkout|actions/setup-node|hashicorp/setup-terraform)@[0-9a-f]{40}", action) is not None,
                        f"{key}: actions must use an allowed source and immutable SHA")
                require("if" not in step, f"{key}: required setup cannot be conditional")
                if action.startswith("actions/checkout@"):
                    exact(mapping(step.get("with", ""), 10, "checkout.with"), {"persist-credentials": "false"}, "checkout.with")
            else:
                require("with" not in step, f"{key}: run steps cannot contain action parameters")
        require(sum(s.get("uses", "").startswith("actions/checkout@") for s in source_steps) == 1, f"{key}: exactly one checkout is required")
    application = job_steps["application"]
    for command in ("npm ci", "npm run check", POLICY_COMMAND):
        matches = [s for s in application if s.get("run") == command]
        require(len(matches) == 1 and "if" not in matches[0], f"application: mandatory unconditional command missing: {command}")
    # Entire credential-bearing jobs are allowlisted: no source checkout,
    # shell steps, arbitrary secrets, mutable workflow versions or extra flags.
    for filename, job_id in (("auto-approve.yml", "auto-approve"), ("auto-merge.yml", "auto-merge")):
        workflow = parsed[filename]
        exact(mapping(workflow["permissions"], 2, filename + ".permissions"), {"contents": "read", "pull-requests": "write"}, filename + ".permissions")
        events = mapping(workflow["on"], 2, filename + ".on")
        if job_id == "auto-approve":
            require(workflow["name"] == "Auto Approve PRs", "Approval name must match the merge completion trigger")
            require(set(events) == {"pull_request_target", "workflow_dispatch"}, "Unexpected approval event")
            exact(mapping(events["pull_request_target"], 4, "approve.events"), {
                "types": "[opened, synchronize, reopened, ready_for_review, labeled, unlabeled, edited, converted_to_draft]",
            }, "approve.events")
        else:
            require(workflow["name"] == "Auto Merge PRs", "Unexpected merge workflow name")
            exact(events, {
                "pull_request_target": "types: [opened, synchronize, reopened, ready_for_review, labeled, unlabeled, edited, converted_to_draft, closed]",
                "workflow_run": "workflows: [CI, Auto Approve PRs] types: [completed]",
                "status": "",
                "workflow_dispatch": "",
                "schedule": "- cron: '*/15 * * * *'",
            }, "merge.events")
            require(compact(workflow["concurrency"]) == "group: reviewed-auto-merge cancel-in-progress: false",
                    "Merge evaluations must remain serialized")
        metadata_jobs = mapping(workflow["jobs"], 2, filename + ".jobs")
        require(set(metadata_jobs) == {job_id}, f"{filename}: extra credential-bearing job")
        metadata_job = mapping(metadata_jobs[job_id], 4, job_id)
        if job_id == "auto-approve":
            expected = {
                "if": ">- (github.event_name == 'pull_request_target' && " + SAME_REPO + " && "
                      f"contains(fromJSON('{AUTHORS}'), github.event.pull_request.user.login) && !github.event.pull_request.draft) || "
                      "(github.event_name == 'workflow_dispatch' && " + DEFAULT_BRANCH + ")",
                "uses": TOOLKIT + "auto-approve-reusable.yml@" + PIN,
                "with": "runner-labels: " + AUTOMATION_RUNNER
                        + " pull-request-number: ${{ github.event_name == 'workflow_dispatch' && inputs.pull-request-number || '' }}"
                        + " expected-head: ${{ github.event_name == 'workflow_dispatch' && inputs.expected-head || '' }}",
                "secrets": "BOT_PAT: ${{ secrets.BOT_PAT }} APPROVAL_PAT: ${{ secrets.APPROVAL_PAT }}",
            }
        else:
            expected = {
                "if": ">- (github.event_name == 'pull_request_target' && " + SAME_REPO + " && "
                      f"contains(fromJSON('{AUTHORS}'), github.event.pull_request.user.login)) || "
                      "(contains(fromJSON('[\"workflow_run\",\"status\",\"workflow_dispatch\",\"schedule\"]'), github.event_name) && "
                      + DEFAULT_BRANCH + ")",
                "uses": TOOLKIT + "auto-merge.yml@" + PIN,
                "with": "native-auto-merge: false reviewed-merge: true reviewed-single-pass: true merge-method: merge "
                        + "required-status-checks: " + APP_CHECK + " runner-labels: " + AUTOMATION_RUNNER,
                "secrets": "BOT_PAT: ${{ secrets.BOT_PAT }}",
            }
        exact(metadata_job, expected, job_id)


if __name__ == "__main__":
    try:
        check_policy(read_workflows())
    except PolicyError as error:
        raise SystemExit(f"CI policy: {error}") from None
    print("CI policy: runner boundaries, exact checks and pinned metadata jobs passed.")
