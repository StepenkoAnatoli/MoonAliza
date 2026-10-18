# sr-policy-6 review 1 (refute-first): calibration-first evidence

Unit: sr-policy-6, worktree `/home/user/task5-handoff/wt/sr-policy6`, branch `build/sr-policy6`, base `145f78e`, head
`1a4224a` (six commits: 80f91bc, bb73fef, a8344f0, 3552b8c, c889070, 1a4224a). Contract: `briefs/policy6-builder.md`
(E1-E7), the proposal `docs/proposals/calibration-first-onboarding.md` read from SmartRouter at `bb3fa6c` (PR #102's merge)
with `git show`, because `/home/user/smartrouter` is checked out at `5bd473a`, where the file is missing (the builder's
policy finding 1 is correct). Checklist: `briefs/router-reviewer.md`. Nothing in the worktree was changed except this
report. Every probe ran on scratch copies under
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-policy6-review/`.
Node `/versions/node/v24.21.0/bin`. cwd for the suite: the worktree root.

## Verdict: FIX

Two S2 findings in E1 resolution. Each one lets a typed reference back a `qualified-for` entry when the evidence it
names should not count, and in each case `decide` then routes on it. Everything else checked holds: the six other
items in the checklist, the E5 table against the store, E6, the fixtures, and the trace guard.

## Findings

### F1 (S2): a reference whose path leaves the policy directory resolves; only absolute paths are refused

`referenceForm` refuses `/abs/...`, `C:/...` and backslashes. Its stated reason is that "an absolute path would not
travel with the policy and its trace". It does not refuse `..` segments, so `../elsewhere/trace/outcomes/<t>-<s>.json`
and `trace/../../elsewhere/trace/outcomes/<t>-<s>.json` both pass the form check, and `resolveReference` then reads
whatever store sits there. A path that leaves the directory fails to travel in the same way an absolute one does. As
a result, an outcome store that is never committed, such as a test's temp trace, can back a live qualification. No
test covers the case. `rate` (E7) also prints such paths: when `--trace` is outside the policy directory, its
`typed evidence to paste` lines start with `../`.

Reproduction (run):
1. Copy of the live policy at `sr-policy6-review/esc/pol/host-policy.json`, with every `(trace/outcomes/` rewritten as
   `(../elsewhere/trace/outcomes/` (16 lines), and the copied store at `esc/elsewhere/trace`. `loadPolicy` returns
   `LOADED host-policy-6`. The same happens with `(trace/../../elsewhere/trace/outcomes/`.
2. A store outside the policy directory (`sr-policy6-review/forgeT`): one `decide`, `dispatch` and `outcome accepted`
   cycle of task `build-x` (`build-core`, decided T3, cc-opus-high) under the host-policy-5 feature-off fixture. A
   copy of the live policy (usage windows off) at `forge/pol/host-policy.json` gets `build-core@T3` on cc-opus-high
   and the line `outcome: build-x build-core@T3 accepted 2026-10-18 (../../forgeT/outcomes/build-x-3.json)`. Then
   `route.mjs decide` on a default `build-core` request with a temp `--trace` prints `Route: delegate`, Profile
   cc-opus-high (exit 0). With the absolute path to the same file, the policy is refused: `path ... must be relative
   to the policy file's directory`. Revision 6 itself blocks `build-core`.
3. After two more such cycles in `forgeT`, `route.mjs rate --trace forgeT --policy copy/host-policy-off.json` prints
   `PROPOSAL qualify cc-opus-high for build-core@T3: ... typed evidence to paste: "outcome: build-x build-core@T3
   accepted 2026-10-18 (../forgeT/outcomes/build-x-3.json)", ...`.

Fix: after `resolve(baseDir, ref.path)`, refuse when `relative(baseDir, file)` starts with `..` or is absolute. Use a
reason in the existing style, e.g. `path <p> leaves the policy file's directory`. Red-first tests should use both
spellings above. In `rate`, print no paste line (or print one with a note) when the outcome file is not under the
policy directory, so E7 never proposes a line that E1 refuses. The README's form list ("a relative `/`-separated
path") should say that the path cannot leave the directory.

### F2 (S2): a superseded acceptance still resolves; the validator ignores §10.5 supersession, which the adapter's own `rate` applies

`resolveReference` checks the referenced file and its own outcome record (`rec`, matched by seq). It never asks
whether a later outcome record for the same dispatch supersedes that record. This host treats the latest outcome per
dispatch as the outcome: spec-v2 §10.5, decision-trace.md §4, `latestOutcomes()`, and the README's learning loop all
say so, and that is how `sr-host-fix1` and `sr-host-fix2` are read (seq 4 supersedes seq 3). A reference to an
`accepted` file whose dispatch was later recorded `verification-failed` therefore supports a qualification that
`rate` counts as a failure.

Reproduction (run): store `sr-policy6-review/sup/trace` = the live store plus the `build-x` cycle above (accepted,
seq 3), then `route.mjs outcome` of the same Outcome as `verification-failed`, giving `outcome recorded: build-x seq 4
outcome verification-failed (dispatch seq 2)`. The policy `sup/host-policy.json` = the live policy (usage windows off),
with `build-core@T3` on cc-opus-high and `outcome: build-x build-core@T3 accepted 2026-10-18
(trace/outcomes/build-x-3.json)`. Then `decide` on a default build-core request gives `Route: delegate`, cc-opus-high.
`rate` on the same store gives `cc-opus-high build-core@T3: {"accepted":0, ..., "verification-failed":1}`.

The committed table is not affected: each of the 12 referenced outcome records is the latest for its dispatch (ledger
listing in the checks below).

Fix: in `resolveReference`, after finding `rec`, take the last outcome record in the store with the same `task-id` and
`dispatch-seq`. If it is not `rec`, refuse with e.g. `<path> is superseded by outcome record <task> seq <n> (<value>)`.
This is the same rule `latestOutcomes()` applies. A red-first test should be built on the `REF_STORE` with a second
outcome for `ref-t2`.

## Observations (not findings)

- **Owner check.** The `owner-profile` check goes beyond E1 (policy finding 4). It is disclosed, every table reference
  satisfies it, and the guard proof turns two tests red. The lead should ratify it or drop it.
- **E5 suffix.** The dropped suffix on cc-haiku-low's mechanical-extraction prose line is not in the E5 table, but E4
  implies it, and README E5 discloses it. No other line changed.
- **Bare references.** A bare reference against a pre-tier decision loads without the "would be" wording and reads T1.
  This is consistent with `learn()` reading untiered decisions as T1, and with E7's bare paste lines. E1's "the
  evidence line must say" is read as applying only to a declared tier. It is harmless today because no table line is
  bare.
- **Two `hand-*` decision files.** `gsi-u5-rereview4` and `sr-host-review` resolve their category through
  `trace/decisions/hand-*.json`, not `<task>-<n>.json`. E1 says "as `categoryMap()` reads it", and `categoryMap()`
  reads those files, so this conforms.

## Checks run (evidence)

1. **Suite, lint, typecheck (verified).** From the worktree root: `node --test docs/orchestration/smartrouter/route.test.mjs`
   gives 135 pass, 0 fail. `node --check route.mjs` exits 0. `npx eslint route.mjs route.test.mjs` exits 0. The base
   suite (`git archive 145f78e` into scratch `base/`) gives 119 pass, 0 fail.
2. **Fixture (verified).** `git show 145f78e:docs/orchestration/smartrouter/host-policy.json | cmp - trace/policies/host-policy-5.json`
   reports identical bytes. No fixture `host-policy-1..5` carries an `outcome:` line or an `"evidence"` key (grep: 0
   each). The base-test edits are path pins only: `git diff --word-diff` shows nothing but
   `COMMITTED_POLICY_PATH`/`LIVE_OFF_PATH` replaced by `HP5_POLICY_PATH`/`HP5_OFF_PATH`, plus titles. Goldens and the
   status and rate assertions are unchanged and green.
3. **Trace guard (verified).** `git diff --stat 145f78e..HEAD -- docs/orchestration/smartrouter/trace` lists only
   `trace/policies/host-policy-5.json` (new). `git status` shows only the builder's untracked report and
   `node_modules`.
4. **Revision-6 diff against host-policy-5 (verified, node script).** Top-level changes: `policy-revision` and
   `"evidence": "typed"` only. Profiles changed: cc-fable-high (qualified-for, evidence), cc-opus-high (qualified-for,
   evidence), cc-haiku-high (evidence), cc-haiku-low (qualified-for, evidence). All other profiles are byte-equal, and
   cc-fable-xhigh is unchanged. Every changed profile has `qualified-at: 2026-10-18`. Dropped entries match the table:
   cc-opus-high build-core@T3, build-tests@T3 and research-collect@T2; cc-fable-high fix@T2 becomes `fix`; cc-haiku-low
   docs-mechanical. Kept entries match the table too. The dropped lines carry the suffix, and the fix-x2-1 line
   matches the table word for word.
5. **The 12 references against the store (verified, node script).** For each reference I checked the file's `task-id`
   and `accepted` value, the owner, the outcome record's ts day (UTC), and the decision category, with no
   `difficulty-tier` on any of them. All 12 match: sr-policy-2 (2026-10-17), sr-policy-3/-4/sr-ci-item4/sr-policy-5
   (2026-10-18) build-ui; sr-host-review/rereview1/rereview2 review (2026-10-17); sr-host-fix1/fix2 fix (2026-10-17,
   seq 4, the superseding acceptance); gsi-u5-rereview4 review (2026-10-17, cc-fable-high); fix-x2-1 fix (2026-10-18,
   cc-haiku-high). Each referenced record is the latest outcome for its dispatch.
6. **E1 refusals.** The builder's tests cover the wrong category, a non-accepted outcome, a missing file, the tier
   against a tiered decision, the missing "would be" wording, a bad and a wrong date, an absolute or backslash path,
   another profile's or another task's outcome, and a non-Outcome file. Guard-removal proofs I ran on a scratch copy
   (`sr-policy6-review/probes/guard.sh`) each turned the named tests red:
   - date: 1 red
   - tier match: 1 red
   - "would be": 1 red
   - category: 1 red
   - accepted: 2 red
   - owner: 2 red
   - resolution base set to cwd instead of the policy directory: 17 red
   A path leaving the directory is not refused (F1).
7. **Resolution against the policy file, not `--trace` (verified).** With the live policy (scratch copy beside a copy
   of the store) and a temp `--trace`: `decide` exits 0 for 12 requests, `rate` exits 0 (0 outcomes), `usage` exits 0,
   and `status` exits 2 only on the unknown task. `rate` against the copied store also exits 0 (16 outcomes, no
   proposals).
8. **E2/E3 (verified).** Removing the E2 block turns 4 tests red. Removing the E3 exemption turns 12 red. Letting
   PARTIAL/FAIL support turns 2 red. Ignoring the tier turns 3 red. The live policy loads under `"evidence": "typed"`,
   so every non-lead entry is supported, and the builder's test asserts each calibration-derived entry against its own
   grades.
9. **E6 with `decide` (verified, CLI, usage windows off, temp traces).** Revision 6:
   - fix@T1: cc-haiku-high, $3.19
   - fix@T2: cc-opus-high, $6.95
   - review@T1: cc-sonnet-xhigh, $3.09
   - build-ui undeclared (T2): cc-opus-high, $9.41 at the 316000 median; the README's $8.09 is at 250000, as in rev 5
   - pin-tests@T1: cc-haiku-low, $1.06
   - build-core, build-tests, research-collect, docs-mechanical@T1 and docs-mechanical undeclared: blocked
   - build-core@T1 at 16000 tokens: blocked
   - docs-mechanical@T1 at 15000 tokens: direct

   Revision 5 on the same requests gives the same five routes, with build-core, build-tests, research-collect and
   docs-mechanical@T1 delegated.
10. **E7 (verified).** All six command functions call `loadPolicy` (lines 563, 660, 1230, 1328, 1410, 1443, 1588). The
    `qualify` proposal ends with the paste lines (reproduced in F1.3).
11. **Commits (verified).** There are six commits, each with the identity and both trailers, and each with the
    five-part report in short form.

## What I got wrong and fixed

- **Mistake:** my first E6 probe showed every route blocked under both revisions.
  - **Where:** `sr-policy6-review/probes/e6.mjs` against the live policy with a fresh `--trace`.
  - **Impact:** none delivered; it would have been a false E6 finding.
  - **Cause:** the live policy's usage windows block Gate 4 with no reading ("usage reading missing").
  - **Fix:** probed the feature-off derivatives (usage-windows removed), as the suite does.
  - **Verified:** a re-run gave the routes in check 9.
