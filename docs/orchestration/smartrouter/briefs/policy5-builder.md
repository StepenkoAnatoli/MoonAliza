# Unit sr-policy-5: difficulty tiers in the adapter and host policy revision 5

Worktree and branch: created by the lead from the integration head (named in the launch prompt). Work only
under `docs/orchestration/smartrouter/`. Node 24 at `/versions/node/v24.21.0/bin`; suite
`node --test docs/orchestration/smartrouter/route.test.mjs` (100 tests green at the start); lint
`npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs`; typecheck is
`node --check docs/orchestration/smartrouter/route.mjs`. Commit identity and trailer lines as in
`briefs/router-builder.md` (the `Co-Authored-By` line names the model that writes the commit, plus the
`Claude-Session` line); never --no-verify; no push; never edit `trace/ledger.jsonl`, `trace/usage.jsonl`,
`trace/decisions/*.json`, `trace/outcomes/*.json` or any `trace/calibration-*` file by hand. Commit with the
five-part report (what changed, why, what it touched, what you verified with verified/untested/expected, what you
got wrong). `docs/orchestration/smartrouter/` is not a declared code path, so no `docs/ARCHITECTURE.md` change.
Reports: write the full report to `docs/orchestration/2026-10-13-github-sign-in/reports/sr-policy-5-<n>.md` and
return the structured report (`briefs/common.md`, "Reports").

## Why

SmartRouter merged the difficulty-tiers proposal (`docs/proposals/difficulty-tiers.md` on main, PR #100, merged
2026-10-18 by the operator). This host is the reference host adapter, so it adopts the proposal first: Items 1-3
and 5 in the adapter and the policy; Item 4 (calibration run 4) is a later unit. The proposal's text is the
specification; where it leaves a choice, the lead's decisions below bind. Read the proposal in full first
(`/home/user/smartrouter/docs/proposals/difficulty-tiers.md` is a read-only checkout of SmartRouter main; copy
nothing from that repository except what this brief quotes).

## The lead's decisions (binding where the proposal leaves a choice)

D1. **Tiering is explicit per policy.** A policy carries the top-level key `"difficulty-tiers": "enforced"` to turn
    the rules on; any other value is invalid (exit 2); absent means untiered, and an untiered policy behaves
    exactly as today (no `DifficultyTier` line, no `difficulty-tier` fields, Gate 2 per category). The fixture
    policies host-policy-1..4 stay untiered, so every existing golden and assertion is unchanged. Revision 5 is
    enforced.
D2. **Policy form.** A `qualified-for` entry is `<category>` or `<category>@T1|T2|T3`. Under an enforced policy a
    bare entry reads `@T1` (proposal 2.2); the same category twice on one profile (bare and tiered, or two tiers)
    is invalid. The calibration grade entry gains the optional tier: `calibration-<n>: <category>[@T<k>]
    PASS|PARTIAL|FAIL (n=<k>)`; tierless reads `@T1` (proposal 2.6). Both forms validate under an untiered policy
    too (the form is checked, the tier ignored), so a tiered policy copied to an older adapter still loads.
D3. **Request form and floor.** The request gains the optional `difficultyTier` (`"T1" | "T2" | "T3"`; any other
    value invalid). The edit set is `permittedEffects` minus entries ending in `ARCHITECTURE.md`. The floor is
    mechanical: `T3` when `uncertainty === 'high'` or the edit set has more than three entries; `T2` when it has
    exactly three; `T1` otherwise; `docs-mechanical` always `T1`. A declared tier below the floor is an invalid
    request (exit 2) naming both and the reason; above the floor it is accepted as given (proposal 1.1). Undeclared
    reads as the proposal's default (`T3` for a high-risk category, `T2` otherwise), then raised to the floor if the
    floor is higher. A `difficultyTier` on a request against an untiered policy is validated for form and has no
    effect; the Uncertainty line then carries `difficulty tiers: not enforced by this policy`.
D4. **Gate 2 reads the tier.** Under an enforced policy `capabilities()` passes a profile for the request's
    category only when the profile holds that category at a tier >= the request's tier (tier k covers lower
    tiers, proposal 2.1). The reason text: `<id> not qualified for <category>@<tier> (holds <category>@T<j>)`, or
    `<id> not qualified for <category>` when it holds nothing of the category. Nothing else in the gates changes.
    The empty-set case stays `blocked`; the existing `eligible-outside-candidates` hint already names a profile
    outside the candidates that would pass, which is the proposal's "names it" clause; no new route and no
    `recommend-escalation` (proposal Item 3).
D5. **The required reviewer is walked at `review@T1`.** The reviewer of a unit is chosen with `capabilities()` for
    the `review` category at the review median, as today, and under an enforced policy that walk requires
    `review@T1`: the review of a unit is its own request when the lead dispatches it, with its own declared tier.
    State this in the README. (The alternative, walking the reviewer at the unit's tier, would block every T2 and
    T3 unit until a `review@T2+` profile exists; the lead rejected it.)
D6. **Printed and recorded.** Under an enforced policy the decision text gains the line `DifficultyTier: T<k>`
    directly after the unchanged `Difficulty` line; the decision JSON gains `difficulty-tier`; the Brief gains
    `difficulty-tier` (additive, §13; `conform_spec.check_brief` checks required keys only, so it passes); the
    ledger decision record gains `difficulty-tier` (additive, as `usage-tokens` is). The pre-dispatch recheck
    recomputes the Brief with the field, so a decision made under revision 5 round-trips; assert it. The ledger
    holds no undispatched decision at the base commit (every decision has its dispatch or is blocked): assert that
    too, because a pending decision from an untiered revision could not be dispatched under the enforced one (its
    Brief fingerprint would change), and the README must say so.
D7. **The learning loop is per (profile, category, tier).** `categoryMap()` returns, per task, the category and
    the tier from the decision file (`decision['difficulty-tier']`); a decision without one (every record before
    this revision) counts at `T1`. `learn()` keys its streams by (profile, category, tier); the demotion proposal
    reads `demote <profile> from <category>@T<k>: ...` and the qualify proposal `qualify <profile> for
    <category>@T<k>: ...`; `qualification-stats.json` carries the tier in its keys (`fix@T1`). Under an untiered
    policy the output is unchanged (no `@T` suffix anywhere), so the existing `rate` and `status` assertions hold on
    their fixtures.
D8. **`rate` and observations.** The CALIBRATION line keeps its format for runs 1-3 (their cells are T1 by the
    protocol). An observation's task object may carry `"tier": "T2" | "T3"` (run 4 will); when present the line
    reads `<category>@T<k>` and counts separately per tier; absent means T1 and prints as today. Nothing else in
    `rate` changes.
D9. **Revision 5 of the policy** = revision 4 plus `"difficulty-tiers": "enforced"` and the production-derived
    qualifications re-declared at the tier of the units that produced them (proposal 2.2), from the table below.
    Calibration-derived entries stay bare (they read `@T1`). Nothing else changes: headroom, categories, economics,
    prices, usage-windows, harness, authorization, isolation, accounting untouched. Every profile this revision
    re-declares gets `qualified-at: 2026-10-18` and keeps its reviewer line; the re-declared entries carry the
    evidence lines in the table and the reviewer line `host-declared (lead), not independent`.

## The re-declaration table (lead's reading of the production units by the proposal's Item 1 table)

Units are tiered "as Item 1 would have declared" from their decision files (`trace/decisions/<task>-<seq>.json`:
`permittedEffects`, `uncertainty`) and the README's run history; they are sizing information for the declared
tier, never calibration evidence. Write the "would be T<k> by the table" wording into each evidence line.

| profile | entry | evidence line (one per entry, in addition to the lines the profile already carries) |
|---|---|---|
| cc-opus-high | `build-core@T3` | `build-core@T3: pre-adapter units U1-U5 of github-sign-in (28 builds, RUN.md), multi-file units with new harnesses, would be T3 by the table; host-declared (lead), not independent` |
| cc-opus-high | `build-ui@T3` | `build-ui@T3: accepted outcomes sr-policy-2 seq 3, sr-policy-3 seq 5, sr-policy-4 seq 4 (five files), sr-ci-item4 seq 3 (nine files), would be T3 by the table` |
| cc-opus-high | `build-tests@T3` | `build-tests@T3: pre-adapter test units of U1-U5 (RUN.md), new harnesses (fakes, recorders), would be T3 by the table; host-declared (lead), not independent` |
| cc-opus-high | `review@T1` | `review@T1: accepted outcomes sr-host-review seq 3, sr-host-rereview1 seq 3, sr-host-rereview2 seq 3 (one module against gates.md with the shipped tests), would be T1 by the table; calibration-1..3 review PASS` |
| cc-opus-high | `fix@T2` | `fix@T2: accepted outcomes sr-host-fix1 seq 4, sr-host-fix2 seq 4 (three files, one module, cause named by the findings, existing harness), would be T2 by the table; two passes at T2 (rule 2.3)` |
| cc-opus-high | `research-collect@T2` | `research-collect@T2: 26 research runs this session (RUN.md), 20-page budgets with enumerated unknowns, would be T2 by the table (budget over ten pages); host-declared (lead), not independent` |
| cc-opus-high | `pin-tests` (bare) | unchanged (calibration-derived) |
| cc-fable-high | `fix@T2` | `fix@T2: U5 fix rounds 3 and 4 (wf_1fcbe585-d1e, wf_7f80ebc5-5a8; src/main/github-signin.ts, its tests and fixtures: three files, cause named by the findings), would be T2 by the table; host-declared (lead), not independent` |
| cc-fable-high | `review@T1` | `review@T1: U5 review and re-review rounds (wf_1fcbe585-d1e) and accepted outcome gsi-u5-rereview4 seq 3 (one module with the shipped tests), would be T1 by the table; calibration-1..3 review PASS` |
| cc-fable-high | `pin-tests` (bare) | unchanged |
| cc-fable-xhigh | every category it holds, `@T3` | `<category>@T3: the lead-direct profile integrates every unit of every tier and fixes inline (U1-R11 d4c4bdb, U2-R15 d37652e); host-declared (lead), not independent; eligible only below direct-max-tokens` |
| cc-haiku-high | `fix` (bare) | add the line `fix-x2-1 seq 3 accepted (five files, src/main and tests), would be T3 by the table: one pass at T3, not a qualification (rule 2.3)` |
| every other profile | unchanged, bare | nothing added |

## Deliverables

A. `route.mjs`: D1-D8. Keep the gate order, reason texts (except the new tier reason), categories, economics,
   prices and the usage-windows block as they are. No new command; `difficultyTier` is a request field, not a flag.
B. `host-policy.json` becomes `policy-revision: host-policy-5` per D9 and the table.
C. Fixture: copy the policy at the unit's base commit to `trace/policies/host-policy-4.json` (never edited) and pin
   the `host-policy-4:` assertions, the README routing-consequence test and the usage tests that read the committed
   policy to it with `--policy` / the fixture path, as revisions 3 and 4 did. The host-policy-1..3 goldens and
   assertions stay on their fixtures, unchanged.
D. Revision-5 assertions on the live policy, computed with `decide` and asserted (and quoted in the README):
   `fix` 193000 `difficultyTier: 'T1'` -> cc-haiku-high with cc-sonnet-xhigh the reviewer; `fix` 193000 `T2` ->
   cc-opus-high; `fix` 193000 undeclared (reads T3) -> blocked, every candidate failing Gate 2 with the tier reason,
   cc-fable-xhigh failing on direct-max-tokens; `fix` with `permittedEffects` of five files and `difficultyTier:
   'T1'` -> invalid request (floor T3); `review` 209000 `T1` -> cc-sonnet-xhigh; `review` undeclared -> blocked;
   `build-ui` 250000 undeclared (reads T2) -> cc-opus-high (holds build-ui@T3); `docs-mechanical` with
   `difficultyTier: 'T3'` -> accepted as declared (above the floor) and routed to the cheapest profile holding
   `docs-mechanical@T3` or blocked if none (compute it). A decision made under revision 5 dispatches (the recheck
   accepts the Brief with `difficulty-tier`) in a temp trace. `rate` under the live policy prints no `@T` suffix on
   CALIBRATION lines for runs 1-3, prints a `fix@T3` line for a temp observations file whose fix task carries
   `tier: 'T3'`, and a demotion proposal for a temp ledger with two consecutive verification-failed outcomes at T2
   reads `fix@T2`.
E. README: a section "Difficulty tiers (host-policy-5)" with the predicate table (quote the proposal's Item 1
   table), the floor rule, D5, D6's pending-decision note, the re-declaration table above, the lead's declaration
   rubric (one line per category: what the lead checks before declaring T1), and the routing consequence (D);
   "Qualification rules" gains rule 5 (per (category, tier), proposal 2.3-2.5, quoted); the qualification table
   regenerated with the tiered entries; a "How the tiers proposal was applied (host-policy-5)" section naming the
   lead's decisions D1-D9; friction item 21: the proposal's Item 3 "names it" clause is the existing
   `eligible-outside-candidates` hint, and the reviewer-tier question (D5) is not addressed by the proposal.
F. Tests red-first with guard-removal proofs for every assertion in A, C, D (policy validation of the tiered forms
   and their refusals; the floor and the undeclared default; Gate 2 at every tier; the printed line and the three
   recorded fields; the untiered policy's unchanged behaviour with a declared tier; the learning loop per tier;
   `rate` with a tiered observation; the fixture goldens; the revision-5 table test in the shape of the
   `host-policy-4:` one).

## Non-goals and stop triggers

No change to the route set, gate order, categories, economics, prices or usage-windows; no qualification beyond
the table; no edit to ledgers, outcomes, decisions, readings or any `trace/calibration-*` file; no new command or
flag; no edit outside `docs/orchestration/smartrouter/` except the report file. Stop and report if a golden under
the host-policy-1..4 fixtures changes, if the 100 base tests do not stay green, or if applying the table would
require a rule not written above.
