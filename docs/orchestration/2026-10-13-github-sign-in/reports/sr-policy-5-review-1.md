# sr-policy-5 review 1 (refute-first): difficulty tiers in the adapter, host-policy-5

Reviewer: refute-first unit reviewer (read-only on the worktree). Worktree `/home/user/task5-handoff/wt/sr-policy5`,
branch `build/sr-policy5`, base `69b8e3f`, head `48b5f9e` (six commits, 46591ab..48b5f9e). Contract:
`docs/orchestration/smartrouter/briefs/policy5-builder.md` (D1-D9 bind); specification where the brief defers:
SmartRouter `docs/proposals/difficulty-tiers.md` read from merged main `7f7fc75` (`git show`; the checkout at
`/home/user/smartrouter` is on `5bd473a` and does not have the file, as the builder's policy finding 1 says).
Checklist: `briefs/router-reviewer.md`. Every probe ran under
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-policy5-review/` on scratch
clones (`wt` = HEAD, `base` = 69b8e3f, `seq` = each commit) and temporary traces. Nothing in the worktree was changed.
Node v24.21.0.

## Verdict: FIX (documentation only; the code is accepted as it stands)

The adapter change, the policy and the tests survived every attempt to break them. Untiered policies are byte-for-byte
unchanged, and the floor, the default, Gate 2, D5, D6, D7 and D8 behave as the brief says. The policy diff against the
frozen host-policy-4 is exactly the re-declaration table. Two findings remain, both about the record and not the
code. F1 (S3): the merged proposal text says it is not normative and that hosts MUST NOT emit its fields, and this is
recorded nowhere. F2 (S4): an untiered policy now splits a tiered calibration observation, which nothing documents.

## Findings

### F1 (S3) - The proposal's own status clause is not recorded: the adapter now emits fields the merged text says hosts MUST NOT emit

- **Problem.** At `7f7fc75` (and on `origin/main`), the merged proposal's status line reads: "draft proposal, not
  normative; revision 2 ... If accepted after independent review (plan §15), the items below would become ... additive
  §9/§10 fields ...; until then hosts MUST NOT emit or require them." Its review record shows `1-5 (revision 2) |
  pending delta review`. Under D6 the unit emits `DifficultyTier`/`difficulty-tier` on the decision, on the §10.1
  Brief and on the §10.5 ledger record. It also requires the field, through the floor refusal and the Gate 2 tier.
  The README says "The proposal is the specification" and "merged ... by the operator". Neither the README (policy
  findings, friction log) nor the builder's report says that adoption goes against the specification's own
  status clause, or on what basis (the operator's merge of PR #100 and the lead's brief) the host goes ahead before
  the delta review. Checklist item 7 asks exactly this: is anything presented as spec behaviour that the spec does
  not say.
- **Evidence (run).** `git -C /home/user/smartrouter show 7f7fc75:docs/proposals/difficulty-tiers.md | sed -n 3,10p`
  prints the clause above. The same line 3 is on `refs/remotes/origin/main`. `git log --all -- docs/proposals/difficulty-tiers.md`
  shows only 987a4e3 and 6a75383 (no status change after the merge). `grep -n -i "not normative\|MUST NOT emit\|pending delta"`
  over the README, the builder's report and the brief returns nothing. Probe p4 shows the fields emitted
  (`decision.difficulty-tier: T2`, Brief `T2`, ledger decision record `T2`).
- **Fix.** Add one policy finding and one friction item in the README that quote the status clause and the pending
  review row, and that name the basis on which host-policy-5 enforces the proposal anyway (the operator's merge of
  PR #100, D1-D9). Or the lead holds `"difficulty-tiers": "enforced"` until the delta review is recorded. That is
  the lead's call, and no code changes. The emitted fields are additive under spec-v2 §13, so a conformance checker
  is not broken either way.

### F2 (S4) - Under an untiered policy, a calibration observation that carries a tier now prints `@T` lines and counts apart; undocumented

- **Problem.** D1 says an untiered policy "behaves exactly as today", and D7 says "no `@T` suffix anywhere" in its
  output. D8 is unconditional, so `calibrationEvidence` splits by observation tier whatever the policy. On the
  untiered host-policy-4 fixture, a run-4-shaped observation now prints `fix@T3` and `pin-tests@T2` lines. At
  `69b8e3f` it counted them into the bare lines. No committed fixture or trace carries a tier, so no golden or
  assertion changes. The behaviour still differs from before for that input, and the README's D8 bullet does not
  say whether it applies under any policy.
- **Evidence (run).** Probe p8: a temp trace holding `calibration-3` plus a `calibration-4` copy with
  `opus-high.fix.tier = "T3"` and `opus-high.pin.tier = "T2"`, rated under `trace/policies/host-policy-4.json`.
  The `69b8e3f` route.mjs prints `CALIBRATION cc-opus-high fix: 2 pass ... (calibration-3, calibration-4)`. HEAD
  prints `fix: 1 pass ... (calibration-3)` and `fix@T3: 1 pass ... (calibration-4)` (pin-tests likewise).
- **Fix.** One sentence in the README's D8 bullet saying the split applies under any policy, since an observation's
  tier is a fact of the cell and not of the policy. Or gate the split on the enforced policy, if the lead reads D1
  as overriding D8. The documentation fix is enough.

## What was checked (all run)

1. **Untiered policies byte-for-byte (D1, D7).**
   - The base suite of `69b8e3f` (100 tests) passes against HEAD's `route.mjs` with the base live policy (= host-policy-4).
   - The 62 `decide` requests (host-policy-1..4 feature-off × every category × uncertainty unset/high, four-file edit sets) produce
     identical stdout and identical trace directories (ledger plus decision files) under the base and HEAD `route.mjs`.
   - `rate` and `status` on the committed trace under host-policy-1..4 are identical, `qualification-stats.json`
     included.
   - A declared `difficultyTier` under host-policy-4 adds only `difficulty tiers: not enforced by this policy`. It
     writes no `DifficultyTier`, `difficulty-tier` or `@T` anywhere in the trace (grep count 0).
   - `trace/policies/host-policy-4.json` is byte-equal to `git show 69b8e3f:docs/orchestration/smartrouter/host-policy.json`.
2. **Floor and undeclared default (D3).**
   - Every category × uncertainty {unset, low, high} × edit sets 1-4 (each also with `docs/ARCHITECTURE.md` added) ×
     {undeclared, T1, T2, T3} matches D3. Exactly three files gives floor T2; more than three, or uncertainty high,
     gives T3. `docs-mechanical` stays T1 even with uncertainty high and four files.
   - Undeclared reads T3 for build-core, review and fix. It reads T2 for the other categories (docs-mechanical
     included), raised to the floor. A declared tier below the floor is exit 2 and names both tiers and the reason.
   - The architecture map is never counted. Untiered, `requestTier` always returns null and never throws.
3. **Gate 2 at every (holds, requests) pair (D4).**
   - Enforced: holds none, bare, @T1, @T2 or @T3 × requests undeclared, T1, T2 or T3. The profile passes only when it
     holds the category at the requested tier or above, and a bare entry reads @T1. The reason is
     `<id> not qualified for fix@T<k> (holds fix@T<j>)`, or `not qualified for fix` when the profile holds nothing.
   - Untiered: any held form passes at any declared tier.
   - A `--deviation` dispatch is rechecked at the tier: a T2 decision cannot deviate to cc-haiku-high, refused with
     `not qualified for fix@T2 (holds fix@T1)`.
4. **D5.**
   - A fix@T2 on cc-opus-high gets cc-sonnet-xhigh as the required reviewer.
   - build-core@T3, build-tests@T3 and build-ui@T2 (all cc-opus-high) also get cc-sonnet-xhigh.
   - review@T1 routes to cc-sonnet-xhigh. Undeclared review (T3) and review@T2 are blocked.
5. **D6.**
   - Under revision 5, `DifficultyTier` directly follows `Difficulty`. `difficulty-tier` appears on the decision,
     the Brief and the ledger decision record, and the CLI dispatch in a temp trace exits 0.
   - A host-policy-4 decision dispatched under revision 5 is refused when the route is unchanged (`changed:
     difficulty-tier`), and refused at Gate 2 when the tier excludes the decided profile.
   - In the committed ledger, the only undispatched non-blocked decision is `sr-policy-3` seq 2, superseded by seq 3.
     The hand-walked dispatches carry no decision-seq but follow their decision. So the brief's literal "every
     decision has its dispatch" is false, and the builder's latest-decision assertion and README wording are the
     correct form.
   - The only open dispatch is `sr-policy-5` seq 2 (this unit).
6. **D7.**
   - In a temp trace under revision 5: x-1 is decided at T2 on cc-opus-high and fails. It is decided again at T1
     (cc-haiku-medium, accepted). x-2 at T2 on cc-opus-high fails.
   - Result: stats `cc-opus-high fix@T2 verification-failed:2` and `PROPOSAL demote cc-opus-high from fix@T2: 2
     consecutive verification-failed (x-1, x-2)`. The per-dispatch tier (builder's policy finding 3) is what
     makes this demotion visible.
   - The same trace under host-policy-4 prints `demote cc-opus-high from fix` with no `@T` anywhere.
   - On the committed trace, revision 5 and the host-policy-4 fixture both give `no proposals`, and every stats key
     maps 1:1 to `<category>@T1`. The committed ledger's demotion history is unchanged.
7. **D8.** In a temp trace under revision 5: `fix@T3` and `pin-tests@T2` lines are separate, an explicit `tier: "T1"`
   prints as bare, and `tier: "T4"` is exit 4. Runs 1-3 lines are identical under revision 5 and the host-policy-4
   fixture (see F2 for the untiered case).
8. **D9 / the table.** `diff trace/policies/host-policy-4.json host-policy.json`:
   - The only changes are `policy-revision`, the new key, the qualified-for entries, the evidence lines and
     `qualified-at` 2026-10-18 on the three re-declared profiles.
   - cc-opus-high: build-core/ui/tests@T3, review@T1, fix@T2, research-collect@T2, pin-tests bare. cc-fable-high:
     review@T1, fix@T2, pin-tests bare. cc-fable-xhigh: all eight @T3. cc-haiku-high: the added line only.
   - Every evidence line matches the brief's table verbatim, and the reviewer lines are kept. Headroom, categories,
     economics, prices, usage-windows, harness, authorization, isolation and accounting are unchanged.
   - No entry was granted beyond the table, and none is missing.
9. **Trace untouched.** `git diff --name-status 69b8e3f..HEAD -- docs/orchestration/smartrouter/trace` shows only
   `A trace/policies/host-policy-4.json`.
10. **Commands.**
    - At HEAD: `node --test docs/orchestration/smartrouter/route.test.mjs` 117/117; `npx eslint ...` exit 0; `node --check` exit 0.
    - Each commit is green: 46591ab 101, 2393e33 104, 40c586f 108, 0abd430 111, f87362f 115. Every commit carries
      the five-part report and both trailers.
11. **Red-first, re-proved independently.** 17 single-replacement mutations of `route.mjs` in the scratch clone each
    turned the suite red:
    - Reviewer at the unit's tier (10 fail); floor refusal removed (3); undeclared not raised to the floor (1);
      Brief without the tier (3); learn per latest decision (1); Gate 2 ignores the tier (7); bare reads T2 (7);
      ledger record without the tier (2).
    - docs-mechanical not special (1); ARCHITECTURE counted (1); duplicate category allowed (1); not-enforced line
      dropped (1); enforced value unchecked (1); untiered learn tiered (1); high-risk default T2 (6); observation
      tier ignored (2); exactly-three floor removed (1).
12. **Determinism.** The same revision-5 request in two traces gives byte-identical stdout, decision file and ledger.

## Notes for the lead (not findings against the unit)

- D3 applies the edit-set and uncertainty floor to every category, including review, pin-tests and
  research-collect, whose Item 1 predicates do not use either. That is D3 as written, and the builder followed it.
  A three-file review report set therefore cannot be declared T1.
- Builder policy finding 2 holds (probe p3): undeclared pin-tests and docs-mechanical (T2), undeclared fix and
  review (T3), and any review above T1 are blocked. The lead must declare a tier on every request.
