# sr-policy-6 re-review 1 (refute-first, after fix round 1)

Unit: sr-policy-6. Worktree `/home/user/task5-handoff/wt/sr-policy6`, branch `build/sr-policy6`, base `145f78e`. Head
`5860969`: the six unit commits plus two fix commits, `f497ba7` (F1) and `5860969` (F2). Contract:
`briefs/policy6-builder.md` (E1-E7). Checklist: `briefs/router-reviewer.md` and the first review
(`sr-policy-6-review-1.md`).

I changed nothing in the worktree except this report. Every probe ran on scratch copies under
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-policy6-rereview1/`:
- `head/` is `git archive HEAD`.
- `pre/` is `git archive 1a4224a`.
- `f1/` and `f2/` are copies of the first review's reproduction stores.

Node: `/versions/node/v24.21.0/bin` (v24.21.0). cwd for the suite: the worktree root.

## Verdict: ACCEPT

Both earlier findings are fixed. I re-ran each finding's own reproduction against the pre-fix `route.mjs` and against
HEAD: each fails before the fix and is refused at HEAD. Each fix's tests are red against the code before it, and
eight guard-removal proofs each turn a test red. The second full pass over the checklist found no new finding. Two
residual edges are recorded below as observations: neither is reachable without hand-editing the trace, which the
brief forbids.

## Earlier findings, re-checked

### F1 (S2): a reference leaving the policy directory. Fixed.

The reproduction from review 1 was re-run with `pre/.../route.mjs` (1a4224a) and with `head/.../route.mjs`.

| probe | 1a4224a | HEAD |
|---|---|---|
| live policy, every `(trace/outcomes/` rewritten to `(../elsewhere/trace/outcomes/` | `LOADED host-policy-6` | refused: `... (../elsewhere/trace/outcomes/gsi-u5-rereview4-3.json) ... cannot be resolved: ../elsewhere/... leaves the policy file's directory ...` |
| the same with `(trace/../../elsewhere/trace/outcomes/` | `LOADED host-policy-6` | refused, same reason |
| `decide` with `forge/pol/host-policy.json` (`build-core@T3` backed by `../../forgeT/outcomes/build-x-3.json`) | `Route: delegate`, cc-opus-high, exit 0 | `invalid policy: ... ../../forgeT/outcomes/build-x-3.json leaves the policy file's directory .../forge/pol ...`, exit 2 |
| `rate --trace forgeT-rate-* --policy copy/host-policy-off.json` | `typed evidence to paste: "outcome: build-x build-core@T3 accepted 2026-10-18 (../forgeT-rate-pre/outcomes/build-x-3.json)", ...` | `no typed evidence to paste: the outcome store .../forgeT-rate-head is outside the policy file's directory .../copy, and a reference cannot leave it (E1)` |

I also tried to break the fix (`p/`):
- **P1, verified.** A single outcome file symlinked out of `trace/outcomes/` is refused with `leaves the policy file's
  directory`. The realpath branch works.
- **P6, verified.** The live policy loaded through a symlinked directory path (`link -> real`) still loads, because
  `inside()` realpaths both sides. There is no false refusal on hosts where `/tmp` is a symlink.
- **P6b, verified.** A `trace/` symlink whose target is inside the policy directory loads.

### F2 (S2): a superseded acceptance resolving. Fixed.

I re-ran the review-1 store `f2/trace`: the live store plus `build-x` accepted (seq 3), then verification-failed
(seq 4, dispatch seq 2).
- `decide` with `f2/host-policy.json` gives `Route: delegate`, cc-opus-high, exit 0 at 1a4224a.
- At HEAD it gives `invalid policy: ... trace/outcomes/build-x-3.json is superseded by outcome record build-x seq 4
  (verification-failed) for the same dispatch (seq 2)`, exit 2.
- `rate` on the same store gives `cc-opus-high build-core@T3` accepted 0 and verification-failed 1. The resolver and
  the learning loop now agree.

The fix uses one rule: `outcomeKey` is shared by `latestOutcomes` and `resolveReference`. `rate`'s E7 paste lines come
from `learn()` over `latestOutcomes`, so the line it offers is always the latest record, which is the one E1 accepts.

### Red-first and guard proofs (verified, scratch `head/`)

New tests against older `route.mjs` files, using the HEAD test file:

| route.mjs from | result |
|---|---|
| `1a4224a` | 3 fail: `E1 (F1)`, `E7 (F1)`, `E1 (F2)` |
| `f497ba7` | 1 fail: `E1 (F2)` |

The two README tests against the 1a4224a README: 2 fail, `README (F1)` and `README (F2)`.

Guard removals on HEAD (`sr-policy6-rereview1/guard.sh`, baseline 140/140):

| guard removed | red |
|---|---|
| `inside()` check removed from `resolveReference` | 1 (`E1 (F1)`) |
| `inside()` lexical only (realpath branch -> true) | 1 (`E1 (F1)`, symlinked trace/) |
| `inside()` realpath only (lexical check removed) | 1 (`E1 (F1)`, `../nowhere`) |
| `rate` `storeInside` forced true | 1 (`E7 (F1)`) |
| `rate` note removed | 1 (`E7 (F1)`) |
| F2 supersession check removed | 1 (`E1 (F2)`) |
| `last` = first record of the dispatch, not the latest | 10, including `E1 (F2)`, the committed-policy tests, and the README table (the live sr-host-fix1/fix2 references name the superseding seq 4) |
| `outcomeKey` ignores `dispatch-seq` | 5 (`E1 (F2)`, `F4: a superseding outcome ...`, three `rate` tests) |

## Second full pass (same checklist as review 1)

1. **Suite, lint, typecheck (verified, cwd the worktree root).**
   `node --test docs/orchestration/smartrouter/route.test.mjs` gives 140 tests, 140 pass, 0 fail.
   `node --check docs/orchestration/smartrouter/route.mjs` exits 0.
   `npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs` exits 0.
2. **Fixtures unchanged (verified).**
   `git show 145f78e:docs/orchestration/smartrouter/host-policy.json | cmp - trace/policies/host-policy-5.json`:
   identical. `git diff --quiet 145f78e HEAD` on `trace/policies/host-policy-1..4.json` exits 0 for each. host-policy-5
   is the only added file. The fix commits only add tests: their test diff is 95 added lines and one changed import
   (`symlinkSync`), so no base assertion changed.
3. **E1 refusals (verified).** The review-1 refusal set is still covered and green: wrong category, non-accepted,
   missing file, tier against a tiered decision, missing "would be" wording, bad or wrong date, absolute or backslash
   path, another profile's or task's outcome, non-Outcome. Two refusals are new: a path that leaves the policy
   directory (F1) and a superseded record (F2). Resolution is relative to the policy file, not `--trace`: guard
   proofs and the E1 base-directory test are green. The F1 check runs before the existence check, so `../nowhere/...`
   is reported as leaving the directory rather than as missing.
4. **E2 on every profile (verified, independent node script over `host-policy.json`).** Every non-lead entry has at
   least one PASS grade entry or accepted reference at its tier or above:
   - cc-fable-max review 2
   - cc-fable-high review@T1 4, fix 3, pin-tests 3
   - cc-fable-medium review 3, fix 3
   - cc-opus-max review 2
   - cc-opus-xhigh review 3, fix 3, pin-tests 3
   - cc-opus-high build-ui@T3 5, review@T1 6, fix@T2 2, pin-tests 3
   - cc-opus-medium fix 3, pin-tests 3
   - cc-sonnet-xhigh review 2
   - cc-sonnet-high review 2, fix 3, pin-tests 3
   - cc-sonnet-medium fix 3, pin-tests 3
   - cc-sonnet-low review 2, fix 3, pin-tests 3
   - cc-haiku-high fix 4, pin-tests 3
   - cc-haiku-medium fix 3, pin-tests 3
   - cc-haiku-low pin-tests 3

   `route.mjs status sr-policy-6` on the live policy exits 0, so `loadPolicy` agrees.
5. **E3 (verified).** cc-fable-xhigh (`economics['lead-direct-profile']`) keeps all eight `@T3` entries with no typed
   backing, and the policy loads. The review-1 guard proof (12 red without the exemption) was not affected by the fix
   diff.
6. **Revision-6 table against the store (verified).** `host-policy.json` is unchanged since 1a4224a
   (`git diff --quiet 1a4224a HEAD` exits 0), so review 1's table diff against host-policy-5 stands. I re-checked all
   12 references with an independent script. Each file is `accepted` and owned by the referencing profile, and its
   outcome record's day matches the line. Each path is under `trace/outcomes/`, and each record is the latest outcome
   of its dispatch:
   - sr-policy-2/-3/-4, sr-ci-item4, sr-policy-5: build-ui@T3, cc-opus-high
   - sr-host-review, sr-host-rereview1/-2: review@T1, cc-opus-high
   - sr-host-fix1/-2: fix@T2, cc-opus-high, seq 4
   - gsi-u5-rereview4: review@T1, cc-fable-high
   - fix-x2-1: fix@T3, cc-haiku-high

   The policy's `"evidence"` key is `"typed"`.
7. **E6 routing (verified, CLI, usage windows removed, temp traces; probe `sr-policy6-review/probes/e6.mjs` against
   HEAD's route.mjs).**
   Revision 6:
   - fix@T1: delegate cc-haiku-high, $3.19
   - fix@T2: delegate cc-opus-high, $6.95
   - review@T1: delegate cc-sonnet-xhigh, $3.09
   - build-ui undeclared (T2): delegate cc-opus-high, $9.41
   - pin-tests@T1: delegate cc-haiku-low, $1.06
   - build-core (T3), build-tests, research-collect, docs-mechanical@T1, docs-mechanical undeclared: blocked
   - build-core@T1 at 16000 tokens: blocked
   - docs-mechanical@T1 at 15000 tokens: direct cc-fable-xhigh

   Revision 5 (the fixture) gives the same five delegated routes. It also delegates build-core, build-tests,
   research-collect and docs-mechanical@T1. These are the same results as in review 1.
8. **Untouched ledgers (verified).** `git diff --stat 145f78e..HEAD -- docs/orchestration/smartrouter/trace` lists
   only `trace/policies/host-policy-5.json` (new). `git diff 1a4224a..HEAD` touches only `README.md`, `route.mjs` and
   `route.test.mjs`. `git status`: only the untracked reports and `node_modules`.
9. **E7 (verified).** `rate` still prints paste lines for a store inside the policy directory (the E7 test that pastes
   them and reloads is green). It prints the note instead for a store outside the directory, and the stats file then
   carries no `references`.
10. **Commits (verified).** `f497ba7` and `5860969` carry identity
    `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>`, both trailers
    (`Co-Authored-By: Claude Opus 5.5`, `Claude-Session: ...`), and the five named parts with the got-wrong line.
11. **README (verified).** The F1 and F2 sentences are present and are pinned by `README (F1)` and `README (F2)`.

## Observations (not findings)

- **Store files symlinked out (residual of F1, verified, P2).** `inside()` checks the referenced outcome file's path.
  The store's `ledger.jsonl` and `decisions/` are read from `dirname(dirname(file))` and are not checked themselves. I
  built a store whose `trace/ledger.jsonl` is a symlink to an outside ledger that lacks the superseding seq-4 record.
  With it, the F2 policy loads (`LOADED host-policy-6`); the same store with the real ledger is refused as superseded.
  This needs a symlink committed in place of the ledger, which is a hand edit of `trace/` that the brief forbids, so
  I do not count it as a finding. If the lead wants the rule airtight, apply `inside(baseDir, ...)` to `ledgerPath(dir)`
  and `join(dir, 'decisions')` as well.
- **Wording (expected, from code reading, not isolated in a run).** The README says a symlink out is refused with
  `leaves the policy file's directory ...` "whether or not the file is there". For a symlinked `trace/` whose target
  lacks the referenced file, `inside()` falls back to the lexical check: the file does not exist, so it cannot be
  realpathed. The refusal then reads `... does not exist`. It is still exit 2. Only the `..` spellings give "leaves"
  for a missing file.
- **The fixer's residual (agree).** An Outcome file carrying its own `ts`, with no ledger record, cannot be checked
  for supersession. `recordOutcome` always writes the file and the record together, so this cannot arise without
  hand-placing a file.
- **Windows.** `E1 (F1)` calls `symlinkSync(..., 'dir')`, which needs symlink privilege on Windows. `route.test.mjs`
  is not in CI: `vitest.config.ts` includes only `tests/**`, and `windows.yml` runs `npm test`. So this does not
  affect CI today.

## What I got wrong and fixed

- **mistake:** my first wording probe (P7: a symlinked `trace/` plus a missing file) refused on an earlier reference.
  - **where:** `sr-policy6-rereview1/p/p7`.
  - **impact:** none. It did not isolate the case, and no finding rests on it.
  - **cause:** the live policy's own references sit under the same symlinked `trace/` and are validated first.
  - **fix:** I record the wording point as expected, from code reading (`inside()` returns true when the path does not
    exist), and not as verified.
  - **verified:** n/a (reasoned).
