# sr-policy-5 fix round 1: review findings F1 and F2

Builder: cc-opus-high (sr-policy-5, fix round 1). Worktree `/home/user/task5-handoff/wt/sr-policy5`, branch
`build/sr-policy5`, base `48b5f9e` (head of report 1). Two commits, not pushed. This report file is not committed.
Node v24.21.0; every command ran with cwd `/home/user/task5-handoff/wt/sr-policy5` unless noted.

## Gist

- F1 (S3) fixed, docs only: README tiers opening, policy finding 7 and friction item 22 quote the proposal's status clause and its `pending delta review` row, and name the basis for enforcing anyway (the operator's merge of PR #100 without the delta review, `b8e1a1d`; D1-D9) and the off switch.
- F2 (S4) fixed, docs only: the README says rate's observation-tier split applies under any policy. The tiers opening names it as the one exception to "behaves exactly as before", and the D8 bullet says it too. The code behaviour was already pinned by the 'tiers D8' test.
- Suite 117 -> 119 (one red-first test per finding), 10 guard-removal proofs, eslint 0, node --check 0. Each fix commit reverts alone, and the suite stays green after either revert.
- Lead's call, not taken here: keep `"difficulty-tiers": "enforced"` on before the delta review (F1), and the split stays unconditional (F2). Both options are written in the README.

## Commits

| sha | finding | subject |
|---|---|---|
| `782b05a` | F1 | docs(smartrouter): F1 - the tiers proposal's own status clause ("not normative ... hosts MUST NOT emit or require them") and its pending delta review on record, with the basis for enforcing anyway (sr-policy-5 fix round 1) |
| `b82496c` | F2 | docs(smartrouter): F2 - rate's observation-tier split applies under any policy, untiered included; said where the README claims untiered behaves as before (sr-policy-5 fix round 1) |

Identity StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>. Both messages carry the five-part report
and end with the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` lines. Files: `docs/orchestration/smartrouter/README.md`,
`docs/orchestration/smartrouter/route.test.mjs`. No change to `route.mjs`, `host-policy.json` or any trace file. Not a
declared code path, so no `docs/ARCHITECTURE.md` change.

## Per finding

### F1 (S3): fixed (documentation, as the finding's first option)

- **Checked first.** `git -C /home/user/smartrouter show 7f7fc75:docs/proposals/difficulty-tiers.md | sed -n 3,10p` prints
  the status clause. The file is identical at PR #100's merge commit `2e30291` (`git diff 2e30291 7f7fc75` on the file:
  empty) and on `origin/main`. The review record ends `| 1-5 (revision 2) | pending delta review | — | — |`. The basis
  is on record in this repository: `b8e1a1d` (RUN.md) records the operator's decision of 17:35Z to merge #100-#102
  without the delta reviews, as relayed by the originating session. The finding is right.
- **Change.** README:
  - The "Difficulty tiers (host-policy-5)" opening now says the status line still reads "draft proposal, not
    normative" and "hosts MUST NOT emit or require" its fields, with revision 2 pending. It says the host enforces it
    anyway, and points to policy finding 7 and friction item 22.
  - New **policy finding 7** quotes the clause in full and the review row. It names what is emitted (D6: decision,
    §10.1 Brief, §10.5 ledger record) and what is required (D3 floor, D4 Gate 2). It gives the basis (the operator's
    decision, `b8e1a1d`; the lead's brief, D1-D9). It names the switch: delete the key; the tiered entries still load
    (D2); an enforced-revision decision would then be refused at dispatch. It closes with "runs ahead of the
    specification it cites; the lead's call".
  - New **friction item 22**: the proposal text has no state between draft and accepted, so a merged proposal still
    forbids what its adopter does.
- **Lead's option not taken.** Turning the key off until the review is recorded is the lead's decision. The README
  states it as an option.
- **Test.** 'README (F1): ...'. It checks the tiers opening (five phrases), finding 7 (title, the clause word for word,
  the row, PR #100, `2e30291`, `7f7fc75`, `b8e1a1d`, D1-D9, the switch) and friction 22 (title, clause fragment, row,
  cross-reference).

### F2 (S4): fixed (documentation, as the finding's first option)

- **Checked first.** `rate`'s split (`route.mjs` CALIBRATION_TASKS loop) reads only the observation's tier. The
  existing 'tiers D8' test already asserts the same lines under the untiered host-policy-4 fixture ("D8 reads the
  observation, not the policy"). `grep -c '"tier"'` over `trace/calibration-1..3/observations.json` gives 0, 0, 0. The
  finding is right: the behaviour is tested but not documented.
- **Change.** README:
  - The tiers opening now names one exception to "behaves exactly as before".
  - The learning-loop paragraph says the split applies under any policy, because a tier is a fact of the cell. It also
    says what changed from before host-policy-5, that no committed trace holds a tiered observation, and that gating
    on an enforced policy is the lead's option.
  - The D8 bullet says the same.
- **Not taken.** The code gate (the finding's second option). The reviewer judged the documentation enough, and the
  existing test pins the unconditional reading.
- **Test.** 'README (F2): ...', placed after 'tiers D8'. It checks the three sentences.

## Tests (red -> green)

| test | red | green |
|---|---|---|
| README (F1): status clause, pending row, basis, in the tiers opening, policy finding 7, friction item 22 | before the README edit: 118 tests, 117 pass, 1 fail ("the tiers section's opening lacks: not normative") | 118/118 |
| README (F2): observation-tier split under any policy, in the tiers opening, the learning-loop paragraph, the D8 bullet | before the README edit: 119 tests, 118 pass, 1 fail ("the tiers opening") | 119/119 |

Guard-removal proofs. Each ran on a scratch copy of the adapter directory with one counted replacement and the cwd set
to that copy. Each turned the suite red, and only on the named test (117/1 or 118/1):

- **F1** (6 proofs): drop the tiers-opening review sentence; change MUST NOT to SHOULD NOT in finding 7's quote; drop
  finding 7's review row; drop the `b8e1a1d` basis; change friction 22's title; drop friction 22's row.
- **F2** (4 proofs): remove the tiers-opening exception, the learning-loop sentence or the D8-bullet sentence (each
  reddens the F2 test). Gate the split on an enforced policy in `route.mjs` (reddens 'tiers D8' only, so the documented
  behaviour is the tested one).

## Checks (all verified)

- `node --test docs/orchestration/smartrouter/route.test.mjs`: 119/119 at `b82496c`, and 118/118 at `782b05a`.
- `npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs`: exit 0.
- `node --check docs/orchestration/smartrouter/route.mjs`: exit 0.
- The quoted clause equals lines 3-10 of the proposal at `7f7fc75` (whitespace joined), and the row occurs once there.
- Key-removed probe (finding 7's claim), in a scratch copy: the live policy without the key routes six requests as
  host-policy-4 does. Default fix -> cc-haiku-high; review -> cc-sonnet-xhigh; pin-tests -> cc-haiku-low;
  docs-mechanical -> cc-haiku-low; build-ui at 250000 -> cc-opus-high; fix declared T2 -> cc-haiku-high.
- Revert test in a scratch clone: `git revert` of either commit alone applies cleanly, and the suite is 118/118 after
  each.
- Untested: the operator's words behind `b8e1a1d`, which that commit itself marks as relayed and not seen first-hand.
- Refute-first re-review: not run by me (the lead's step).

## What I got wrong

- **mistake:** the F2 test was first appended at the end of `route.test.mjs`, directly after F1's test.
- **where:** `route.test.mjs`, end of file (first version of the F2 commit, `ece02c0`, since amended).
- **impact:** `git revert 782b05a` alone conflicted, so the one-commit-per-task revert test failed. Nothing delivered
  was affected (not pushed).
- **cause:** both fix commits appended at the same end of the file.
- **fix:** the F2 test moved to directly after 'tiers D8', and the F2 commit was amended (now `b82496c`).
- **verified:** in a scratch clone, both commits revert alone and the suite is 118/118 after each.
