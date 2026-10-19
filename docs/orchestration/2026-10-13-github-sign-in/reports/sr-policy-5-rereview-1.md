# sr-policy-5 re-review 1 (refute-first, after fix round 1)

Reviewer: a fresh refute-first reviewer. I changed nothing in the worktree except this report file. Worktree
`/home/user/task5-handoff/wt/sr-policy5`, branch `build/sr-policy5`, base `69b8e3f`, head `b82496c`. The unit has
eight commits: 46591ab..48b5f9e, then fix round 1, `782b05a` (F1) and `b82496c` (F2).

- Contract: `docs/orchestration/smartrouter/briefs/policy5-builder.md` (D1-D9).
- Checklist: `briefs/router-reviewer.md`.
- Specification where the brief defers: SmartRouter `docs/proposals/difficulty-tiers.md` at `7f7fc75` (read with `git show`).

Every probe ran on scratch clones under
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-policy5-rereview1/`, on
temporary traces:

- `wt`: HEAD.
- `base`: `69b8e3f`.
- `mix`: the base tree with HEAD's `route.mjs`.
- `mutN`: one mutation each.

The probes strip `usage-windows`, as the suite's fixture does. Node v24.21.0.

## Verdict: ACCEPT

Both earlier findings are fixed, and I re-ran their proofs. Fix round 1 changed only `README.md` and `route.test.mjs`:
`git diff 48b5f9e..HEAD -- route.mjs host-policy.json trace` is empty. I reviewed the whole unit again against the
first review's checklist, and every item still holds.

One new S4 wording point (F3) comes from the fix round's own text. It does not need a fix round. The lead can fold it
in at integration or leave it.

## Earlier findings: re-proved

### F1 (S3): fixed

- **The quote is exact.** I joined the blockquote in README policy finding 7 and compared it with lines 3-10 of
  `git -C /home/user/smartrouter show 7f7fc75:docs/proposals/difficulty-tiers.md`, whitespace normalised. They are
  equal (`True`).
- **The review row is real.** `| 1-5 (revision 2) | pending delta review | — | — |` is line 249 of the proposal.
- **The file has not changed since the merge.**
  - `git diff 2e30291 7f7fc75 -- docs/proposals/difficulty-tiers.md` is empty, and so is the diff to `origin/main`.
  - `2e30291` is "Merge pull request #100" (parent `6a75383`).
  - `git log --all` on the file shows only `987a4e3` and `6a75383`, so no later commit changes the status.
- **The basis is on record.** `b8e1a1d` exists and is an ancestor of `69b8e3f`. Its RUN.md note reads: "Update 17:35Z
  (operator decision, relayed by the originating session): SmartRouter #100, #101 and #102 go into main now, without
  the delta reviews". The README's wording ("as relayed by the originating session") keeps that commit's own
  "untested: not seen first-hand".
- **The off-switch claim holds** (probe `f1.mjs`). With the key deleted from the live policy, these route exactly as
  host-policy-4 routes them, and the decision text is equal once the bindings lines are removed:
  - a default `fix` goes to cc-haiku-high;
  - a default `review` goes to cc-sonnet-xhigh;
  - a default `pin-tests` and a default `docs-mechanical` go to cc-haiku-low;
  - `build-ui` at 250000 goes to cc-opus-high;
  - `fix` declared T2 goes to cc-haiku-high.

  The tiered entries still load.
- **Where the record now sits.** The README tiers opening, policy finding 7 and friction item 22 carry the status
  clause, the pending row, the basis and the lead's option.
- **Guard proofs re-run** (`probes/mutate.py`, mutations 0-3). Each mutation turns only the F1 test red (118/1):
  - MUST NOT changed to SHOULD NOT in finding 7's quote;
  - the `b8e1a1d` basis dropped;
  - friction 22's row dropped;
  - the tiers opening's pending row dropped.

### F2 (S4): fixed

- **Probe p8 re-run** (`p8.mjs`). The trace is calibration-3 plus a calibration-4 copy whose opus-high pin, fix and
  review carry T2, T3 and T3.
  - Under the untiered `trace/policies/host-policy-4.json`, base prints `fix: 2 pass ... (calibration-3,
    calibration-4)`.
  - HEAD prints `fix: 1 pass ... (calibration-3)` and `fix@T3: 1 pass ... (calibration-4)`, and does the same for
    pin-tests@T2 and review@T3.
  - HEAD under revision 5 prints the same lines.

  The behaviour is unchanged, and the README now documents it in three places: the tiers opening ("One exception"),
  the learning-loop paragraph and the D8 bullet.
- **"No committed trace holds one".** `grep -c '"tier"'` over `trace/calibration-1..3/observations.json` gives 0, 0 and 0.
- **Guard proofs re-run** (mutations 4-7).
  - Removing any one of the three sentences turns only the F2 test red (118/1).
  - Gating the split on an enforced policy in `route.mjs` turns only `tiers D8` red (118/1). So the documented
    behaviour is the tested one.

## New finding

### F3 (S4): policy finding 7 names one dispatch refusal where there are two

- **Problem.** README policy finding 7 says that with the key removed, "A decision taken under the enforced revision
  would then be refused at dispatch (`changed: difficulty-tier`)". That reason is given only when the untiered route
  still picks the decided profile. When it picks another profile, `dispatch` refuses earlier with "the route
  changed". One such case is a `fix` declared T2, which the same paragraph lists. Either way the decision is refused,
  so the conclusion holds and only the parenthetical is incomplete.
- **Evidence (run, `probes/f1.mjs`, `probes/f1b.mjs`).** Each decision was made under revision 5 and dispatched under
  the key-removed policy:
  - `fix` declared T2, decided cc-opus-high: exit 3, `pre-dispatch recheck: the route changed since decision seq 1
    (now delegate cc-haiku-high); decide again`.
  - `build-ui` undeclared (cc-opus-high), `review` T1 (cc-sonnet-xhigh) and `fix` T1 (cc-haiku-high): exit 3, `the
    Brief changed since decision seq 1; decide again (changed: difficulty-tier)`.
- **Fix (optional, wording only).** Say "refused at dispatch: `the route changed` where the untiered route picks
  another profile (a `fix` declared T2), `changed: difficulty-tier` where it does not". No code or test change is
  needed.

## Whole unit, re-reviewed (all run)

1. **Untiered fixtures unchanged (D1).**
   - The base suite (`69b8e3f`, 100 tests) passes against HEAD's `route.mjs` (`mix`): 100/100.
   - Probe `untiered.mjs` covers host-policy-1..4 × every category × uncertainty unset or high × 1, 3 or 4 files ×
     50k, 193k or 400k tokens. All 558 `decide` calls give byte-equal stdout, ledger and decision files under base
     and HEAD.
   - The same 558 requests with `difficultyTier` T1 or T3 (1116 calls) differ only by
     `difficulty tiers: not enforced by this policy`. They write no `DifficultyTier`, `difficulty-tier` or `@T`.
   - `rate` on copies of the committed trace under host-policy-1..4 gives the same `qualification-stats.json` and the
     same text under base and HEAD. The only difference is the temp path in the "regenerated" line.
   - `trace/policies/host-policy-4.json` is byte-equal (`cmp`) to `69b8e3f:docs/orchestration/smartrouter/host-policy.json`.
2. **Floor and default (D3).** Probe `floor.mjs` runs 1152 cases: every category × uncertainty unset, low or high ×
   0-5 files × with or without `docs/ARCHITECTURE.md` × undeclared, T1, T2 or T3.
   - Every case matches D3: more than three files or uncertainty high gives T3, exactly three gives T2, and
     `docs-mechanical` is always T1.
   - The architecture map is never counted. The default is T3 for build-core, review and fix (risk high) and T2
     otherwise, raised to the floor.
   - A declared tier below the floor exits 2 and names both tiers and the reason.
   - Untiered, `requestTier` is always null and never throws.
   - `T4`, `t1`, `1`, `""` and `null` exit 2 under both policies (form checked even untiered).
3. **Gate 2 per tier (D4)** (probe `gate2.mjs`, 40/40). The profile holds fix none, bare, @T1, @T2 or @T3, and the
   request is undeclared, T1, T2 or T3, under an enforced and an untiered policy.
   - Enforced: the profile passes exactly when it holds the tier or above, and bare reads @T1.
   - The reason reads `cc-opus-high not qualified for fix@T<k> (holds fix@T<j>)`, or `... not qualified for fix`
     when nothing is held.
   - Untiered: any held form passes.
   - Policy validation: a duplicate category, a `@T4` entry, `"difficulty-tiers": "on"` and a `@T4` grade each exit
     2, under both policies. A tiered grade loads.
4. **Revision-5 routing (deliverable D)** (probe `table.mjs`).

   | request | result |
   |---|---|
   | fix 193000 T1 | cc-haiku-high |
   | fix 193000 T2 | cc-opus-high |
   | fix 193000 undeclared | T3, blocked |
   | fix, five files, T1 | exit 2 (floor T3) |
   | review 209000 T1 | cc-sonnet-xhigh |
   | review undeclared | T3, blocked |
   | build-ui 250000 undeclared | T2, cc-opus-high |
   | docs-mechanical T3 | blocked |
   | build-core T3, build-tests T3 | cc-opus-high |

   - In the blocked fix request, every candidate fails Gate 2 with the tier reason except cc-fable-xhigh, which fails
     Gate 5 on `direct-max-tokens`.
   - docs-mechanical T3 is blocked because no delegate holds `docs-mechanical@T3`: cc-haiku-low holds @T1, and
     cc-fable-xhigh is direct-only.
   - The `DifficultyTier:` line directly follows `Difficulty:` in every case.
5. **Reviewer at T1 (D5).** `review-profile` is cc-sonnet-xhigh for fix T1 and T2, build-core T3 and build-ui T3. The
   walk passes `tier: ctx.tier ? 'T1' : null` (`route.mjs:922`). Mutating it to the unit's tier turns 10 tests red.
6. **Recorded fields and dispatch round-trip (D6)** (probe `f1.mjs`).
   - A revision-5 fix T2 decision carries `difficulty-tier` T2 on the decision, the Brief and the ledger record, and
     dispatches as decided (seq 2).
   - Committed ledger: there is no pending latest decision; the only open dispatch is `sr-policy-5` seq 2 (this unit).
   - Recording this unit's outcome under revision 5 (probe `outcome.mjs`) works: seq 3, `no proposals`, and the unit
     counts as `build-ui@T1` (D7: a pre-tier decision counts at T1).
7. **Learning loop and rate per tier (D7, D8)** (probes `learn.mjs`, `committed.mjs`, `p8.mjs`).
   - Two verification-failed fix outcomes at T2 under revision 5 give `PROPOSAL demote cc-opus-high from fix@T2` and
     stats key `fix@T2`. Under host-policy-4 they give `demote cc-opus-high from fix` and key `fix`.
   - On the committed trace, revision 5 gives `no proposals`, 0 `@T` CALIBRATION lines, and CALIBRATION lines equal
     to the host-policy-4 fixture's. The stats keys are `fix@T1`, `review@T1` and `build-ui@T1`.
8. **Re-declaration table (D9).** A JSON diff of `trace/policies/host-policy-4.json` against `host-policy.json` shows
   only these changes:
   - `policy-revision` becomes host-policy-5, and `difficulty-tiers: enforced` is added;
   - cc-opus-high: build-core, build-ui and build-tests @T3, review@T1, fix@T2, research-collect@T2, pin-tests bare;
   - cc-fable-high: review@T1, fix@T2, pin-tests bare;
   - cc-fable-xhigh: all eight categories @T3;
   - `qualified-at` 2026-10-18 on those three profiles;
   - cc-haiku-high: only the added evidence line.

   Every added evidence line matches the brief's table word for word. Nothing else changes: headroom, categories,
   economics, prices, usage-windows, harness, authorization, isolation and accounting are untouched.
9. **Ledgers untouched.** `git diff --name-status 69b8e3f..b82496c -- docs/orchestration/smartrouter/trace` shows
   only `A trace/policies/host-policy-4.json`. `git status` of the worktree is clean after the suite and every probe:
   only the untracked report files and the node_modules link.
10. **Red-first, re-proved independently** (`probes/mutate.py`, 14 mutations, all red).
    - The F1 and F2 guards: mutations 0-7 above.
    - D5 reviewer at the unit's tier: 10 fail.
    - Bare entry reads T3: 7 fail.
    - docs-mechanical not special: 1 fail.
    - Exactly-three floor removed: 1 fail.
    - Ledger record without the tier: 2 fail.
    - Untiered `requestTier` tiered: 72 fail.
11. **Commands at HEAD (cwd `/home/user/task5-handoff/wt/sr-policy5`).**
    - `node --test docs/orchestration/smartrouter/route.test.mjs`: 119/119.
    - `npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs`: exit 0.
    - `node --check docs/orchestration/smartrouter/route.mjs`: exit 0.
12. **Revert test and commits.**
    - `git revert` of `782b05a` alone and of `b82496c` alone both apply cleanly, and the suite is 118/118 after each.
    - Both fix commits carry the five-part report, the author StepenkoAnatoli, and the `Co-Authored-By` and
      `Claude-Session` trailers.
13. **Determinism.** The same revision-5 request in two traces gives byte-identical stdout, ledger and decision file.
14. **Friction log and spec claims (checklist 7).** Friction 22 and finding 7 cite the proposal file, its status line,
    its review row, the merge commits and `b8e1a1d`. Finding 7 says the host "runs ahead of the specification it
    cites" and does not present the adoption as spec behaviour. The §13 point quotes the proposal's own words. F3 is
    the one imprecision I found.

## Notes for the lead (not findings)

- **Pre-tier decisions count at T1.** A decision made before revision 5 counts at T1 (D7). So this unit's own outcome,
  six files and T3 by the table, will feed `build-ui@T1` stats. That is D7 as written. It can support a T1
  qualification proposal but can never demote at T2 or T3.
- **Two options are still open for you:** keep `"difficulty-tiers": "enforced"` before the delta review (finding 7),
  or gate the D8 split on an enforced policy. The README states both.
