# Unit sr-policy-6: calibration-first evidence in the adapter (typed production references) and host policy revision 6

Worktree and branch: created by the lead from the integration head (named in the launch prompt). Work only
under `docs/orchestration/smartrouter/` plus your report file. Node 24 at `/versions/node/v24.21.0/bin`; suite
`node --test docs/orchestration/smartrouter/route.test.mjs` (119 tests green at the start); lint
`npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs`; typecheck is
`node --check docs/orchestration/smartrouter/route.mjs`. Conventions, commit identity, trailer lines, five-part
reports, red-first with guard proofs: `briefs/router-builder.md`. Reports: full report to
`docs/orchestration/2026-10-13-github-sign-in/reports/sr-policy-6-<n>.md`, a gist of at most five lines returned
(`briefs/common.md`, "Reports"). Never --no-verify; no push; never edit `trace/ledger.jsonl`, `trace/usage.jsonl`,
`trace/decisions/*.json`, `trace/outcomes/*.json` or any `trace/calibration-*` file by hand.

## Why

SmartRouter merged the calibration-first onboarding proposal (`docs/proposals/calibration-first-onboarding.md` on
main, PR #102, merged 2026-10-18 by the operator; read it in full from the read-only checkout
`/home/user/smartrouter/docs/proposals/calibration-first-onboarding.md`, copy nothing from that repository). This
host adopts its Item 1 (no hand-declared qualification: every `qualified-for` entry is backed by a typed evidence
entry, the validator resolves typed production references against the outcome store) in the adapter and the policy.
Items 2-4 (the kit, the shared pack, the CI check and the table) are upstream units that follow. The proposal is
the specification; where it leaves a choice, the lead's decisions below bind. Revision 5 (difficulty tiers,
`briefs/policy5-builder.md`, decisions D1-D9) is in force and stays: the proposal's Item 1.4 says the two
proposals' re-declarations are one revision when both land; here they are two consecutive revisions, and this one
rewrites revision 5's production-derived entries into the typed form or drops them.

## The lead's decisions

E1. **Two typed evidence forms.** (a) The grade entry, as today (`calibration-<n>: <category>[@T<k>]
    PASS|PARTIAL|FAIL (n=<k>)`). (b) The typed production reference
    `outcome: <task-id> <category>[@T<k>] accepted <ISO date> (<path>)`, where `<path>` is the outcome file,
    relative to the policy file's directory (the host writes `trace/outcomes/<task>-<seq>.json`). The validator
    checks (b) for form from the policy alone; it then resolves it: the file must exist, parse as an outcome whose
    `task-id` matches, whose `outcome` is `accepted`, whose `ts` or recorded time matches the date to the day, and
    whose task's category (the decision file `trace/decisions/<task>-<n>.json` of the referenced task, as
    `categoryMap()` reads it) equals the entry's category. The tier on a reference is the host's declaration: when
    the task's decision carries `difficulty-tier` the two must match; when it does not (every decision before
    revision 5) any declared tier is accepted and the evidence line must say `would be T<k> by the table`. An
    unresolvable reference is an invalid policy (exit 2, the reason naming the entry). Resolution is relative to
    the policy file, never to `--trace`, so temp traces in tests do not interfere and an upstream copy of the
    policy with its trace resolves.
E2. **Supported entries.** Under a policy that carries the top-level key `"evidence": "typed"` (the adopting
    switch, the shape of revision 5's `"difficulty-tiers"`; absent means the old behaviour and the fixtures
    host-policy-1..5 stay as they are), every `qualified-for` entry `<category>[@T<k>]` (bare reads `@T1` under
    an enforced-tiers policy, else untiered) must have at least one supporting evidence entry: a grade entry with
    PASS for that category at tier >= k (a tierless grade entry is T1), or a production reference `accepted` for
    that category at tier >= k. A PARTIAL or FAIL grade entry supports nothing. The validator still counts no
    passes (the lead's rules do); an entry with nothing typed behind it is an invalid policy (exit 2, naming the
    profile and the entry). Extra typed references that support no entry are allowed (they are the record).
E3. **The lead-direct profile is exempt** from E2 (`economics['lead-direct-profile']`): its qualifications are the
    operator's authorization of the lead's own inline work, not a capability claim about a delegate, and dropping
    them would make `direct` unroutable for every bounded task. Record this as policy finding and as friction
    item 23 upstream (the proposal has no exemption clause; it needs one or the lead profile needs its own rule).
E4. **Free text stays as prose.** Existing free-text evidence lines are kept (they are the record) but support no
    entry. Revision 6 rewrites each production-derived entry of revision 5 into form (b) where the outcome store
    holds the outcome, and **drops the entry where it does not** (the proposal's Item 1.1 last sentence). The
    re-declaration lines of revision 5 that name units without store rows stay as prose with the entry removed.
E5. **Revision 6 of the policy** = revision 5 plus `"evidence": "typed"` and this table:

| profile | entry | action |
|---|---|---|
| cc-opus-high | build-ui@T3 | kept; references: sr-policy-2 (trace/outcomes/sr-policy-2-3.json), sr-policy-3 (sr-policy-3-5.json), sr-policy-4 (sr-policy-4-4.json), sr-ci-item4 (sr-ci-item4-3.json), sr-policy-5 (sr-policy-5-3.json), each `build-ui@T3 ... would be T3 by the table` (five and nine files; pre-revision-5 decisions carry no tier) |
| cc-opus-high | review@T1 | kept; references: sr-host-review (sr-host-review-3.json), sr-host-rereview1 (-3), sr-host-rereview2 (-3) |
| cc-opus-high | fix@T2 | kept; references: sr-host-fix1 (sr-host-fix1-4.json), sr-host-fix2 (sr-host-fix2-4.json), `fix@T2 ... would be T2 by the table` |
| cc-opus-high | pin-tests | kept (calibration grade entries) |
| cc-opus-high | build-core@T3, build-tests@T3, research-collect@T2 | **dropped**: the units behind them (U1-U5, the research runs) predate the adapter and have no outcome rows; the revision-5 lines stay as prose and gain the suffix `; entry dropped in host-policy-6 (no outcome row to reference)` |
| cc-fable-high | review@T1 | kept; reference: gsi-u5-rereview4 (gsi-u5-rereview4-3.json), plus the calibration grade entries |
| cc-fable-high | fix@T2 | **dropped to bare `fix`** (calibration grade entries PASS x3 support fix@T1); the U5 fix-round line stays as prose with the dropped suffix |
| cc-fable-high | pin-tests | kept |
| cc-fable-xhigh | all | unchanged (E3) |
| cc-haiku-high | fix, pin-tests | kept (grade entries); the fix-x2-1 line is rewritten as `outcome: fix-x2-1 fix@T3 accepted 2026-10-18 (trace/outcomes/fix-x2-1-3.json); would be T3 by the table: one pass at T3, not a qualification` |
| cc-haiku-low | docs-mechanical | **dropped**: the "one completed mechanical extraction dispatch" has no outcome row; `pin-tests` kept |
| every other profile | unchanged | calibration-derived; the validator must find every entry supported by its grade entries (assert it) |

    Dates in references: the outcome file's recorded time, to the day. Every changed profile gets
    `qualified-at: 2026-10-18`.
E6. **Routing consequence to state and assert.** Under revision 6 no delegate holds `build-core`, `build-tests`,
    `research-collect` or `docs-mechanical`: a request in those categories above direct-max-tokens is blocked
    until a calibration cell (the kit's host pack) qualifies a profile. The README says so, names the remedy (run
    4 gains one T1 host-pack cell per such category), and the RUN.md consequence is the lead's to report. fix@T1,
    fix@T2, review@T1, build-ui undeclared and pin-tests@T1 route as under revision 5 (assert with `decide`).
E7. `status`, `rate`, `decide` and `dispatch` all load the policy through `loadPolicy`, so they all validate; no
    new command or flag. `rate` keeps proposing from outcomes as it does; a `qualify` proposal's text now ends
    with the typed reference line the lead would paste.

## Deliverables

A. `route.mjs`: E1-E3, E7. B. `host-policy.json` -> `host-policy-6` per E5. C. Fixture `trace/policies/host-policy-5.json`
(the policy at the base commit, byte-identical, never edited); the `host-policy-5:` assertions, the routing test
and the usage tests pinned to it, as every revision did. D. Revision-6 assertions on the live policy (E6) and on
the validator: a policy with `"evidence": "typed"` and an unsupported entry is refused naming it; a reference
with a wrong category, a non-accepted outcome, a missing file, a mismatched tier against a tiered decision, or a
bad date is refused; a reference against a pre-tier decision with the "would be" wording is accepted; the
lead-direct exemption; fixtures host-policy-1..5 load unchanged (no key, no checks). E. README: "Calibration-first
evidence (host-policy-6)" (E1-E4 with the two forms quoted, the table, E6 with the remedy), "How the onboarding
proposal was applied (host-policy-6)", the qualification table regenerated, policy findings, friction items 23
(E3) and 24 (the proposal's `outcome:` form carries no tier; this host added `[@T<k>]`, which the tiers proposal
implies and the onboarding proposal does not state). F. Tests red-first with guard proofs for every assertion.

## Non-goals and stop triggers

No change to gates, routes, categories, economics, prices, usage-windows or the tier rules of revision 5; no
qualification beyond the table; no edit to ledgers, outcomes, decisions, readings or calibration traces; no new
command or flag. Stop and report if a golden under host-policy-1..5 changes, if the 119 base tests do not stay
green, or if a reference in the table cannot be resolved against the store as it stands (report which; do not
invent an outcome).
