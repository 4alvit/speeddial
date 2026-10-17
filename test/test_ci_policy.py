"""Exercise the real workflow files and reject representative unsafe edits."""

from copy import deepcopy
import importlib.util
from pathlib import Path
import unittest
import os
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("ci_policy", ROOT / "scripts/check-ci-policy.py")
POLICY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(POLICY)


class WorkflowPolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sources = POLICY.read_workflows(ROOT)

    def test_actual_workflows_follow_reviewed_policy(self):
        POLICY.check_policy(self.sources)

    def test_unsafe_workflow_mutations_are_rejected(self):
        cases = [
            ("ci.yml", "contents: read", "contents: write", "writable PR token"),
            ("ci.yml", "head.repo.full_name == github.repository", "head.repo.full_name != ''", "fork on private worker"),
            ("ci.yml", "persist-credentials: false", "persist-credentials: true", "persisted checkout credentials"),
            ("ci.yml", "npm ci", "echo ${{ secrets['BOT_PAT'] }}", "indexed secret in PR code"),
            ("ci.yml", "browser-test-command: node test/frontend-smoke.mjs", "browser-test-command: echo skipped", "removed browser regression"),
            ("ci.yml", " && node test/local-browser-smoke.mjs", "", "removed local privacy regression"),
            ("ci.yml", "needs: browser-compatibility", "needs: repository-configuration", "application passes before browser targets"),
            ("ci.yml", 'test "$BROWSER_RESULT" = success', 'test "$BROWSER_RESULT" != failure', "accept skipped browser targets"),
            ("ci.yml", "force-full: true", "force-full: false", "documentation-only browser bypass"),
            ("ci.yml", POLICY.BROWSER_PIN, "main", "mutable browser workflow"),
            ("ci.yml", "browser-matrix-file: " + POLICY.BROWSER_MATRIX, "browser-matrix-file: .github/browser-compatibility-linux.json", "hosted checks lose native coverage"),
            ("ci.yml", "      browser-extended:", "      browser-release-channel: stable\n      browser-extended:", "false release qualification"),
            ("ci.yml", "  browser-compatibility:\n", "  browser-compatibility:\n    secrets: inherit\n", "browser job receives repository secrets"),
            ("ci.yml", "  browser-compatibility:\n", "  browser-compatibility:\n    if: false\n", "silently skipped browser job"),
            ("ci.yml", "  workflow_dispatch:\n", "  pull_request_target:\n", "privileged source execution event"),
            ("auto-approve.yml", POLICY.PIN, "main", "mutable shared approval"),
            ("auto-approve.yml", "CI_RUNNER_AUTOMATION_LABELS", "CI_RUNNER_LABELS", "bypasses automation routing variable"),
            ("auto-approve.yml", "    uses:", "    steps:\n      - run: ./untrusted.sh\n    uses:", "source execution in bot job"),
            ("auto-approve.yml", "    secrets:", "    runs-on: ubuntu-latest\n    secrets:", "extra metadata job field"),
            ("auto-approve.yml", "    secrets:", "    secrets: inherit\n    duplicate:", "secret inheritance"),
            ("auto-merge.yml", "native-auto-merge: false", "native-auto-merge: true", "unprotected native queue"),
            ("auto-merge.yml", "reviewed-merge: true", "reviewed-merge: false", "disabled reviewed gate"),
            ("auto-merge.yml", "reviewed-single-pass: true", "reviewed-single-pass: false", "blocking metadata waiter"),
            ("auto-merge.yml", "    with:", "    with:\n      allow-owned-bot-actions-review: true", "unreviewed reviewer exception"),
            ("auto-merge.yml", "    with:", "    uses: arbitrary/action@main\n    with:", "duplicate workflow key"),
            ("auto-merge.yml", "workflows: [CI, Auto Approve PRs]", "workflows: [Untrusted workflow]", "unreviewed completion source"),
        ]
        for filename, before, after, reason in cases:
            with self.subTest(reason=reason):
                candidate = deepcopy(self.sources)
                self.assertIn(before, candidate[filename], "mutation must affect the real input")
                candidate[filename] = candidate[filename].replace(before, after, 1)
                with self.assertRaises(POLICY.PolicyError):
                    POLICY.check_policy(candidate)

    def test_actual_aggregate_shell_command_accepts_only_success(self):
        ci = POLICY.mapping(self.sources["ci.yml"], 0, "ci")
        jobs = POLICY.mapping(ci["jobs"], 2, "jobs")
        app = POLICY.mapping(jobs["application"], 4, "application")
        gate = POLICY.steps(app["steps"], "application.steps")[0]
        for result in ("success", "failure", "cancelled", "skipped", "", "pending"):
            with self.subTest(result=result):
                completed = subprocess.run(["sh", "-c", gate["run"]],
                                           env={**os.environ, "BROWSER_RESULT": result},
                                           check=False, capture_output=True)
                self.assertEqual(completed.returncode == 0, result == "success")


if __name__ == "__main__":
    unittest.main()
