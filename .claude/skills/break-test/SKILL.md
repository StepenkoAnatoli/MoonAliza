---
name: "break-test"
description: Adversarially probe a project for realistic build and test failures (clean-checkout builds, lockfile and dependency drift, stale generated code, missing env vars, toolchain mismatches, order-dependent or flaky tests, races, timezone and locale assumptions, offline installs, permissions, resource limits), prove each one with a repro command, then apply minimal fixes as separate commits, keeping only fixes that demonstrably remove the failure and keep the build green. Use whenever the user asks to break-test, chaos-test, stress-test or harden a build, run a pre-release reliability check, hunt flaky tests, or asks "what could break our CI / our build", even if they never say "break-test". Not for debugging a single known bug or reviewing a diff.
compatibility: Any coding agent with shell and file access. No vendor-specific tools are assumed. Git is required for the default workflow; a non-git fallback is described.
---

# Break Test

## Purpose

Identify the realistic ways this project's build or test suite can fail, demonstrate each failure with a reproducible command, and apply the smallest fix that removes it. A fix is retained only if it removes the demonstrated failure and leaves the build and tests at least as healthy as the recorded baseline. Everything that cannot be fixed under those conditions is reported as a risk.

This procedure deliberately breaks things while guaranteeing that nothing is left broken. The isolation steps in section 0 are what make both possible; complete them before any probe or fix.

## Principles

1. **Reproduce before reporting.** A failure counts only after it has been reproduced with a command whose output you observed. A problem suspected from reading code is a risk marked *unverified*, never a finding.
2. **Never damage the user's work.** Probes and fix attempts run in an isolated copy. The user's checkout, uncommitted changes, and environment outside the project are never modified except by the fix commits described in section 0.
3. **Minimal change.** Each fix is the smallest edit that removes the root cause. No new dependencies, refactors, or behaviour changes without the user's decision.
4. **Verified means both checks passed.** A fix is verified only when the repro passes *and* the gate shows no new failures against the baseline. A green gate alone proves nothing was broken, not that anything was fixed.
5. **Report exactly what was done.** See *Reporting standards*. The report must not claim more coverage, more certainty, or more success than the evidence supports.

## Definitions

- **Gate:** the set of commands that must pass for a change to be retained, normally install, build, typecheck/lint, and tests.
- **Fast gate:** a subset of the gate (build plus the tests covering the touched area) used per fix when the full gate is slow.
- **Baseline:** the gate's results on the untouched code, recorded before any change.
- **Probe:** a controlled attempt to trigger a specific class of failure.
- **Finding:** a reproduced failure with a recorded repro command, root cause, severity, and likelihood.

## Confirmation required

Ask the user and wait for an answer before:

- Any probe that could reach real external services: deployments, package publishing, production databases, paid APIs, email or messaging. If unsetting an environment variable could make the code fall back to a production URL or real credentials, do not run the probe; record it as a finding.
- Any fix that requires a decision the user should own (section 4, step 2).
- Any single probe expected to run longer than approximately 15 minutes.
- Working on a project that is not under version control.

## Procedure

### 0. Isolate the work

Isolation serves two purposes: probes must not affect the user's work, and every retained fix must be individually reviewable and revertible. Choose the setup that satisfies both in the current environment.

1. Run `git status`. Inform the user that uncommitted changes are excluded from testing and ask whether they want to commit first.
2. **Default setup:** perform all work in a separate git worktree on a new branch: `git worktree add ../<repo>-break-test -b break-test/<YYYY-MM-DD>`. Commit each retained fix there as its own commit. The user's checkout is not modified.
3. **Pinned-branch setup:** if the environment restricts the session to a single branch or does not permit new branches, run every probe and fix attempt in a temporary clone. Apply each fix that passed there to the current branch as its own commit with a message naming the finding. Do not squash fixes. Before reporting, run the full gate again in the real checkout, because a fix can behave differently in the clone and in the checkout; if it fails there, revert that commit.
4. A worktree or clone lacks local-only files (`.env`, credentials, build output, installed dependencies). If the gate cannot run without them, record that as a clean-checkout finding. Copy such files in only with the user's confirmation and never commit them.
5. Run probes that deliberately corrupt state (lockfiles, caches, generated files) in a separate throwaway clone, or restore your worktree or clone with `git reset --hard && git clean -fd` before continuing. These commands are acceptable in your own worktree or clone and never in the user's checkout.
6. Do not modify anything outside the project: no global installs, no changes to shell profiles, `~/.npmrc`, global git configuration, system permissions, or network settings, and no clearing of shared caches. Simulate conditions per command instead: inline environment variables, a temporary cache directory, offline flags, `ulimit` in a subshell. If a probe requires a tool the project does not have (for example a random-order test plugin), install it only in the throwaway environment, never in the project's manifest.
7. **No version control:** with the user's confirmation, copy the project to a temporary directory and initialise a git repository there so the rest of the procedure applies. Deliver fixes as a patch file rather than commits.

### 1. Map the build

Record the following before probing:

- Build system, package manager, and declared toolchain versions (`.nvmrc`, `engines`, `.python-version`, `go.mod`, `rust-toolchain`, Dockerfile base images), together with the versions CI actually uses.
- Exact commands for install, build, typecheck/lint, code generation or formatting checks, and each test tier. Prefer the CI configuration over the README as the source of truth, and record any drift between them as a finding. In a monorepo, record per-package commands and whether the root command covers all packages.
- Services the tests depend on (databases, caches, containers, emulators) and whether the suite can run without them.
- Approximate duration of the full suite.

Define the gate from these commands. Tests alone are insufficient because a change can pass the tests and still break the build or the type checker. If the full gate exceeds approximately 10 minutes, also define a fast gate for per-fix checks, and run the full gate at checkpoints and at the end.

### 2. Record the baseline

Run the full gate on the untouched code three times and record pass/fail per test. Every later retain-or-revert decision is a comparison against this record.

- **Stable and green:** retain a fix only if the gate remains green.
- **Consistent failures:** record them as findings. Retain a fix only if it introduces no failures beyond the baseline; otherwise every fix would be reverted for a cause it did not introduce.
- **Intermittent failures:** record them as findings with the observed failure rate. When such a test fails after a fix, rerun up to twice before attributing the failure to the fix.
- **Gate cannot run** (install or build broken): this is the primary finding. Report it and ask the user how to proceed, since no fix can be verified until it is resolved.

### 3. Probe

Work through the list in order; it is ordered approximately by how often each cause breaks real builds. Skip what does not apply and record each skip with its reason. Use the commands appropriate to the project's ecosystem; those in parentheses are examples. Record the exact command for every probe, including probes that found nothing, so the user can rerun them.

1. **Clean checkout.** Fresh clone, empty caches, build and test. Detects uncommitted files the build depends on, gitignored generated files, and reliance on cached artifacts.
2. **Lockfile and install integrity.** Strict install from the lockfile (`npm ci`, `pnpm install --frozen-lockfile`, `uv sync --locked`, fresh virtualenv with `pip install --require-hashes`, `cargo build --locked`, `go mod verify` and `go mod tidy -diff`). Detects lockfiles out of sync with manifests, unpinned ranges, missing hashes.
3. **Generated code and formatting.** Rerun every code generation and formatting step the project defines, then `git diff --exit-code`. Detects committed output that has drifted from its source, a frequent CI-only failure.
4. **Toolchain versions.** Compare declared, CI, and local versions. If another supported version is available locally, build with it. Detects unpinned toolchains and code that works on a single minor version only.
5. **Environment variables and configuration.** Enumerate every environment variable and configuration value the build and tests read. Run with each required value unset, then empty, inline and per command, subject to the confirmation rules above. Detects crashes without a clear message, silent defaults, and tests that require secrets.
6. **Test isolation and order.** Run tests in random order and individually (`pytest -p randomly`, `jest --randomize`, `go test -shuffle=on`, `rspec --order random`). Detects shared state, leftover files or database rows, and leaking global mocks.
7. **Flakiness and races.** Repeat the suite or suspect tests many times (`go test -race -count=20`, `pytest --count=20`, or a shell loop), and in parallel where the runner supports it. Detects timing assertions, sleeps, unawaited asynchronous work, fixed ports.
8. **Locale, timezone, platform.** Run with a timezone far from UTC (`TZ=Pacific/Kiritimati`, `TZ=America/St_Johns`), with `LANG=C`, and with a non-English locale. Search for hardcoded path separators, imports whose case does not match the filename, line-ending assumptions, and shell-specific scripts.
9. **Network and registry.** Install offline against an empty temporary cache to determine what requires network access. Search for build-time downloads: postinstall scripts, `curl` in Makefiles, unpinned container tags, `latest`.
10. **Permissions and filesystem.** Executable bits on committed scripts, writes to absolute or read-only paths, temporary files that are not cleaned up, very long paths.
11. **Resource limits.** Constrain workers and memory where the runner supports it (`--maxWorkers=1`, `NODE_OPTIONS=--max-old-space-size=512`, `ulimit -n 256` in a subshell). Detects tests that pass only on large machines. Never run anything that could hang or exhaust the host.
12. **Dependency health.** The ecosystem's audit tool for known-vulnerable or deprecated packages, duplicate or conflicting versions, circular imports. Normally report-only (section 4, step 2).

Stop when the list is complete. Do not describe the search as exhaustive; the report's *Not probed* section records where it was not.

### 4. Fix

For each finding, one at a time:

1. Record the repro command, root cause, severity, and likelihood.
2. Decide whether the fix is yours to make. Apply it if the change is small, local to the repository, and does not require a decision the user should own. Report instead of fixing when the fix would add a dependency, bump a major version, change public behaviour or an API, touch CI secrets or infrastructure outside the repository, or require a substantial refactor.
3. Apply the smallest change that removes the root cause.
4. Rerun the repro. If it still fails, the fix is ineffective: revert it and record the attempt.
5. Run the gate (fast or full) and compare with the baseline. On a new failure, rerun up to twice if that test was intermittent at baseline; if it still fails, revert and record which check failed.
6. If both the repro and the gate pass, commit with a message naming the finding.

Do not retain a fix that works by weakening the checks: deleting, skipping, or marking a test as expected-failure; loosening an assertion; raising a timeout without showing why the previous value was wrong; adding retries to mask flakiness; disabling a lint rule or warning instead of fixing its cause; regenerating an entire lockfile to resolve one entry. Such changes pass the gate while making the build less trustworthy. If weakening a check is genuinely the correct outcome, report it as a recommendation for the user to decide.

### 5. Finish

1. Run the full gate on the final state. If it fails although each fix passed individually, bisect the fix commits to identify the combination that fails, revert it, and rerun.
2. Remove temporary clones, caches, and probe artifacts. Confirm that the user's checkout is unchanged apart from the fix commits and contains no probe artifacts.
3. In the default setup, leave the worktree and branch in place for review and state how to inspect and remove them (`git diff <base>...break-test/<date>`, `git worktree remove <path>`).
4. Write the report.

## Severity and likelihood

Severity:

- **Critical:** fails on a clean checkout or in CI today, or could ship a broken artifact or affect production data.
- **High:** fails under common conditions: a new development machine, a CI cache miss, a different timezone, a registry outage.
- **Medium:** fails under plausible but less common conditions, or fails intermittently at a low rate.
- **Low:** hygiene. Unlikely to cause a failure, but makes failures harder to diagnose.

Likelihood: **Likely** (expected within normal operation), **Possible** (requires a specific but realistic condition), **Unlikely** (requires an unusual combination of conditions). Rank remaining risks by severity, then likelihood.

## Reporting standards

- Every statement about the build is supported by a command you ran and output you observed. Quote the relevant output lines; do not paraphrase error messages.
- Distinguish what was observed from what was inferred. Where the root cause is not certain, write "likely cause" and state what would confirm it.
- Report intermittent failures numerically (for example, "failed 3 of 20 runs"), not as fixed or passing.
- Describe a fix as verified only if both the repro and the full gate passed. If only the fast gate was run, say so.
- List every probe that was run, including those that found nothing. A null result is evidence of coverage.
- If the session ends early because of time, budget, or a blocker, state which steps did not run.
- Do not invent commit identifiers, command output, test counts, or durations. If a value was not captured, say that it was not captured.
- Do not inflate severity to make the report appear more useful, or understate it to make the build appear healthier.

## Report template

Use this structure. Keep entries brief and lead with the repro command.

**Overview:** stack, gate commands, baseline result (including consistent and intermittent failures), isolation setup used, and where the fix commits landed (branch and commit identifiers).

**Findings:** one entry each, in this form:

> **[F3] Tests fail when TZ is not UTC** (High, Likely)
> Repro: `TZ=Pacific/Kiritimati npm test -- src/billing`
> Observed: `expected "2026-10-03" to equal "2026-10-04"` in `invoice.test.ts:41`
> Cause: `invoiceDate()` constructs a date from local components; CI runs in UTC, developer machines do not.
> Action: Fixed, commit `a1b2c3d` (use `Date.UTC`).
> Verification: repro passes; full gate green, identical to baseline.

**Applied fixes:** commit, finding ID, files changed.

**Rejected fixes:** what was attempted and which check failed.

**Remaining risks:** ranked, each with a recommended fix and the decision required from the user. Mark anything not reproduced as *unverified*.

**Not probed:** each skipped probe and the reason (not applicable, requires another operating system, requires credentials, too slow, session ended).

**Summary:** two to four sentences on the current resilience of the build, the single most important open risk, and how to review what was changed.
