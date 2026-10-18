# Unit sr-ci-item4 (SmartRouter upstream): the adapter's Node suite in CI, and Item 4 (`null` cash with an estimate-only marker)

Worktree and branch: `/home/user/task5-handoff/wt/sr-item4`, branch `ci/node-adapter-and-item4`, base `5bd473a` (SmartRouter
main after PR #98). It is a git worktree of `/home/user/smartrouter`, with the repository's pre-commit hook wired
(`core.hooksPath=.githooks`): every commit runs `python3 tools/run_regression.py` and is refused while it is red. Python
only for the gate; Node 24 at `/versions/node/v24.21.0/bin` for the adapter suite. Commit identity
`git -c user.name=StepenkoAnatoli -c user.email=318295322+StepenkoAnatoli@users.noreply.github.com commit`; messages
with the prefix the repository uses (`ci:`, `fix:`, `docs:`, `test:`) and the short five-part report (what changed / why /
what you verified / what you got wrong); never `--no-verify`; no push. Keep every change secret-free (`tools/check_secrets.py`
runs in the gate) and `tools/validate_skills.py --strict` clean (it scans every *.md outside docs/, tools/, tests/, skills/
for forbidden phrases; keep new prose inside docs/ or hosts/claude-code/README.md).

## Why

PR #98's "Remaining limits" named two things this unit removes: the adapter's 91-test Node suite is not run by the repository's
gate (the one workflow, `.github/workflows/regression-gate.yml`, has no Node step), and `tools/conform_spec.py` refuses every
record a subscription host writes because its cash counters are `null` (proposal `docs/proposals/usage-windows-gate4.md`,
Item 4, lines 139-165). The maintainer decided on 2026-10-18 to accept Item 4 as proposed.

## Deliverables

A. **CI job.** In `.github/workflows/regression-gate.yml` add a job `adapter-tests` (display name `claude-code-adapter-tests`)
   on `ubuntu-24.04`: the same pinned `actions/checkout` step as the other jobs, then
   `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0, resolved 2026-09-26` with `node-version: '24'`
   (the sha is the one Research-Kit's workflows pin; the comment form matches this file's), then
   `node --test hosts/claude-code/route.test.mjs`. It runs on the workflow's existing triggers (push to main, pull_request);
   it is not a required status context (branch protection is the maintainer's setting; say so in one line of the header
   comment). One sentence in `hosts/claude-code/README.md` where it says how to run the suite: CI runs it too. You cannot run
   GitHub Actions here: validate the YAML (python `yaml.safe_load` or `python -c "import json,yaml"`; if PyYAML is absent,
   `node -e` with a YAML parser is not available either - then check indentation by eye and say the job is untested in CI).
B. **Item 4 in the checker.** `tools/conform_spec.py`: in `check_record` (line 271 on), `counters.cash-spent` and
   `counters.cash-cap` may be `null` only when `counters["cash-basis"] == "estimate-only"`; in `check_outcome` (line 191 on),
   `evidence.actual-spend` may be `null` only when `evidence["actual-spend-basis"] == "estimate-only"`. An unmarked `null`
   keeps today's violation text; a marker with any other value is a new violation (`counters.cash-basis must be
   "estimate-only" when present`, and the outcome likewise); a marker beside a finite number is allowed (a host that both
   estimates and knows). Red-first tests in `tools/test_conform_spec.py`: unmarked null refused (record and outcome); marked
   null accepted; wrong marker refused; the CLI `--record <marked record>` prints CONFORMANT. Guard-removal proof per
   branch (the marker check removed: the marked-null test goes red).
C. **Docs.** `docs/USAGE_TELEMETRY.md` beside line 56: one sentence that a §10.5 record or §10.3 outcome carries the
   marker when its cash is unknown. The §10.5 LedgerRecord and §10.3 Outcome definitions (grep `cash-spent` and
   `actual-spend` under docs/) gain the additive fields with one line each. `docs/proposals/usage-windows-gate4.md`:
   fill "Review record (pending)" with the decision (2026-10-18, Item 4 accepted as proposed and implemented in this change;
   Items 1-3 remain proposals). `CHANGELOG.md`: an Unreleased entry for both deliverables.
D. **The artifact check.** `tools/test_claude_code_host_artifacts.py` checks the ledger's keys: make it accept the optional
   `cash-basis` in counters and `actual-spend-basis` in outcome evidence, so the next adapter refresh (which writes them)
   passes the gate. Red-first: a fixture record with the marker must pass the key check.

## Non-goals and stop triggers

No change to the adapter itself (`hosts/claude-code/route.mjs` is refreshed from the host by the lead in a separate unit);
no new policy, gate, route or reason text; no cash conversion; no change to the hook. Stop and report if the regression
gate is red at the base, if the YAML cannot be validated at all, or if Item 4 needs a change outside the files named.

## Report

Return: commits, tests [{name, red, green}], guards, checks (the gate's output line, the Node suite's counts, each marked
verified), stoppedAt, mistakes (six fields or "nothing to report"), notes.
