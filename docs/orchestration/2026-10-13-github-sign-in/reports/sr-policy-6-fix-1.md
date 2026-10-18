# sr-policy-6 fix round 1: F1 (references cannot leave the policy directory), F2 (superseded outcomes)

Builder: cc-opus-high. Worktree `/home/user/task5-handoff/wt/sr-policy6`, branch `build/sr-policy6`, base `1a4224a`.
Two commits, one per finding, not pushed. This report file is not committed.

## Gist

- F1 fixed (`f497ba7`): a reference whose path leaves the policy file's directory is refused (exit 2), by `..` in either spelling or through a symlink; rate prints no paste line for a store outside it and says why; README updated.
- F2 fixed (`5860969`): a reference must name the latest outcome record of its dispatch (the latestOutcomes rule, now one `outcomeKey`); a superseded one is refused, naming the superseding record; README updated.
- Suite 140/140 (135 + 5 new), every new test red first, 8 guard-removal proofs; eslint 0, node --check 0; the live policy's twelve references still resolve (`status sr-policy-6` exit 0).
- No finding judged wrong. One residual: an Outcome carrying its own `ts` with no ledger record cannot be checked for supersession (this host's Outcomes carry no `ts`).

## Commits

| sha | finding | subject |
|---|---|---|
| `f497ba7` | F1 | fix(smartrouter): F1 - a typed reference's path cannot leave the policy file's directory ('..' or symlink); rate offers nothing to paste for a store outside it (sr-policy-6 fix round 1) |
| `5860969` | F2 | fix(smartrouter): F2 - a typed reference must name the latest outcome record of its dispatch; a superseded one is refused, as rate counts it (sr-policy-6 fix round 1) |

Identity StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>; both messages carry the five-part
report and end with the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` lines. The commit hook printed
"research gate: allow - the gate passes" on each; no --no-verify. Files touched (all under
`docs/orchestration/smartrouter/`): `route.mjs`, `route.test.mjs`, `README.md`. No policy, ledger, usage, outcome,
decision or calibration file edited.

## Per finding

### F1 (S2) - fixed

- **What I did.** `route.mjs` gains `inside(dir, path)`: inside by spelling (`relative()` neither absolute nor `..`-led),
  and, when both exist, after symlinks (`realpathSync` of both). `resolveReference` refuses before any existence check:
  `<path> leaves the policy file's directory <dir>: a reference names an outcome file under it`. `rate` computes
  `inside(policyDir, traceDir)`; outside, a qualify proposal carries no `references` and its line ends
  `; no typed evidence to paste: the outcome store <dir> is outside the policy file's directory <dir>, and a reference cannot leave it (E1)`.
  README: the (b) form says the path cannot leave the directory; the resolution list names it; both E7 places give the note.
- **Beyond the finding's fix (same class).** A symlinked `trace/` pointing out of the directory is refused too (the
  lexical check alone misses it). A `..` that stays inside (`trace/../trace/outcomes/...`) still resolves.
- **Tests.** `E1 (F1)`: `../elsewhere/...`, `trace/../../elsewhere/...` and `../nowhere/...` (missing file: still
  "leaves", not "does not exist") refused; the absolute spelling stays a form refusal; a symlinked `trace/` refused; an
  inside `..` resolves. `E7 (F1)`: three hand-recorded accepted T2 fixes in a store beside, not under, the policy
  directory; the exact PROPOSAL line with the note, no `../forge` in stdout, stats `references` undefined.
  `README (F1)`: the section's sentences and the note in both places.
- **Red (verified).** Against `1a4224a`'s route.mjs: `E1 (F1)` "Missing expected exception" at the `../elsewhere`
  reference; `E7 (F1)` failed, stdout showing `typed evidence to paste: "outcome: q-1 fix@T2 accepted 2026-10-18
  (../forge/trace/outcomes/q-1-3.json)", ...` (the finding's symptom). `README (F1)` red against the previous README.
- **Green (verified).** 138/138 at the F1 commit.
- **Guard proofs (verified, scratch copies).** spelling check removed -> `E1 (F1)` red at `../nowhere` (got "does not
  exist"); realpath check removed -> `E1 (F1)` red at the symlink; resolver call removed -> `E1 (F1)` red; rate's
  `storeInside` forced true -> `E7 (F1)` red; the note removed -> `E7 (F1)` red.
- **The finding's evidence replayed (verified).** The live policy with every `(trace/outcomes/` rewritten to
  `(../elsewhere/trace/outcomes/` (and to `(trace/../../elsewhere/trace/outcomes/`), the store copied to
  `elsewhere/trace`: `route.mjs status sr-policy-6 --policy <copy>` now prints `invalid policy: profile cc-fable-high
  evidence 'outcome: gsi-u5-rereview4 review@T1 ... (../elsewhere/trace/outcomes/gsi-u5-rereview4-3.json) ...' cannot
  be resolved` (scratch, removed after).
- **Alternative set aside.** Refusing any `..` segment in `referenceForm` (form only): misses symlinks and refuses
  harmless inside spellings.

### F2 (S2) - fixed

- **What I did.** `latestOutcomes`' dispatch key is factored into `outcomeKey(r)`; `resolveReference`, after finding the
  outcome record `<task> seq <seq>`, takes the latest record with the same key from `latestOutcomes(store.records)`;
  if it is not the referenced record: `<path> is superseded by outcome record <task> seq <n> (<value>) for the same
  dispatch (seq <d>)`. README: the resolution list (with the reason's form) and the applied E1 bullet.
- **Tests.** `E1 (F2)` on a copy of REF_STORE (the shared store stays as later tests read it): rate before, fix@T2 on
  cc-opus-high accepted 1 / verification-failed 1; ref-t2's Outcome recorded again as verification-failed (seq 4,
  `dispatch seq 2`); REF_T2 refused naming seq 4; rate now 0 / 2 (the resolver and the learning loop agree); recorded
  again as accepted (seq 5): the `-5` reference loads, `-3` refused naming seq 5 (accepted), `-4` refused as not
  accepted; REF_T2 still loads beside the shared store. `README (F2)`.
- **Red (verified).** Against the F1 commit's route.mjs: `E1 (F2)` "Missing expected exception" at REF_T2 (it loaded
  over the superseding verification-failed record: the finding's symptom). `README (F2)` red against the previous README.
- **Green (verified).** 140/140 at the F2 commit.
- **Guard proofs (verified).** check removed -> `E1 (F2)` red; `last` taken as the record itself -> `E1 (F2)` red;
  `outcomeKey` made per record -> `E1 (F2)`, `F4: a superseding outcome ...` and three other rate tests red (one rule,
  shared).
- **Committed references unaffected (verified).** `node docs/orchestration/smartrouter/route.mjs status sr-policy-6`
  on the live policy exit 0: the twelve references are each their dispatch's latest outcome, as the finding said.
- **Residual (expected, not tested).** When an Outcome file carries its own `ts` and the store has no outcome record
  for it, the reference resolves by the `ts` alone and supersession cannot be checked (no dispatch to key on). This
  host's Outcomes never carry `ts` and `recordOutcome` writes file and record together, so it does not arise here;
  the lead may want E1 to require the record (a tightening of E1's "ts or recorded time", so not done unasked).

## Checks

- `node --test docs/orchestration/smartrouter/route.test.mjs`, cwd `/home/user/task5-handoff/wt/sr-policy6`: 140/140,
  about 15 s (verified).
- `node --check docs/orchestration/smartrouter/route.mjs` exit 0 (verified).
- `npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs` exit 0 (verified).
- host-policy-1..5 goldens and assertions unchanged (the suite's pinned tests green) (verified).

## What I got wrong and fixed

- mistake: the first test insertion used `String.replace` with a replacement string holding `$` sequences; where:
  scratch insertion before `f497ba7`; impact: route.test.mjs garbled in the working tree, nothing committed; cause:
  `$` patterns are special in a replacement string; fix: `git checkout` of the file and insertion by split/join;
  verified: diff 45 lines, suite 138/138.
- mistake: `E1 (F2)` first asserted rate's fix@T2 stream as accepted 0 / verification-failed 1; where:
  route.test.mjs before `5860969`; impact: a false red, nothing delivered; cause: the copied store also holds ref-fail
  (a verification-failed fix@T2 on cc-opus-high); fix: assert the shift, [1, 1] before and [0, 2] after; verified:
  140/140.
- mistake: the first read of the lexical guard proof looked like it failed at the symlink case; where: guard step,
  output filtered and sorted; impact: none (re-run unfiltered showed it fails at `../nowhere` as designed); cause:
  `sort -u` over two runs' lines; fix: re-ran that guard alone with the assertion text; verified: the red names
  `../nowhere ... does not exist`.

## Stop triggers

None hit: no host-policy-1..5 golden changed, the base tests stayed green, no ledger/outcome/decision file edited.
