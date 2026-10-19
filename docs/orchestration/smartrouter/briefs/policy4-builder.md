# Unit sr-policy-4: host policy revision 4 from calibration run 3

Worktree and branch: created by the lead from the integration head (named in the launch prompt). Work only
under `docs/orchestration/smartrouter/`. Node 24 at `/versions/node/v24.21.0/bin`; suite
`node --test docs/orchestration/smartrouter/route.test.mjs` (93 tests green at the start); lint
`npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs`; typecheck is
`node --check docs/orchestration/smartrouter/route.mjs`. Commit identity and trailer lines as in
`briefs/router-builder.md` (the `Co-Authored-By` line names the model that writes the commit, plus the
`Claude-Session` line); never --no-verify; no push; never edit `trace/ledger.jsonl`, `trace/usage.jsonl`,
`trace/decisions/*.json`, `trace/outcomes/*.json` or any `trace/calibration-*` file by hand. Commit with the
five-part report (what changed, why, what it touched, what you verified with verified/untested/expected, what you
got wrong). `docs/orchestration/smartrouter/` is not a declared code path, so a commit touching only the adapter
needs no `docs/ARCHITECTURE.md` change (revisions 2 and 3 committed that way).

## Why

Calibration run 3 (`trace/calibration-3/`, main run `wf_4e9ef48d-066` plus the supplementary run `wf_dbe29a64-3b2`
for two cells void under amendment A-1; protocol preregistered upstream in SmartRouter
`docs/evidence/2026-10-18/claude-code-calibration-3/`) graded 12 profiles on pin and fix (U1-R11 at e68583c, history-less
checkouts) and 15 on review (U1-R8 + U1-R11 at 0e7a7f3, a reachability-defined classification, a preregistered
three-lens adjudication). With runs 1 and 2 that gives second passes for several high-risk review cells, one pin fail,
and the learning loop's first demotion proposal from production outcomes. The lead has applied the qualification
rules (README, "Qualification rules" 1-4, unchanged) and this unit writes the result into the policy, its tests and
the README. Qualification is declared by the host from evidence, never inferred.

## The results the lead applied (`trace/calibration-3/results-table.md`; runs 1-2 from their tables; `rate` prints the counts)

| profile | review run 1 / 2 / 3 | pin run 3 | fix run 3 | consequence |
|---|---|---|---|---|
| cc-haiku-low | FAIL / FAIL / PASS | PASS | PASS | review: one of the two later passes rule 3 needs; not qualified. **`fix` removed**: the ledger's demotion proposal (two consecutive `verification-failed` production outcomes, fix-u7-r3 and fix-x2-2; `rate` prints it) is ratified; re-qualification needs two later passes dated after 2026-10-18. Keeps `docs-mechanical`, `pin-tests` |
| cc-haiku-medium | FAIL / FAIL / PASS | PASS | PASS | review: one of two later passes; not qualified. Unchanged otherwise |
| cc-haiku-high | FAIL / FAIL / PASS | PASS | PASS (supplementary run) | review: one of two later passes; not qualified. Unchanged otherwise |
| cc-sonnet-low | PASS / PARTIAL / PASS | PASS | PASS | **`review` added**: two independent passes (rule 2); the PARTIAL is neither a pass nor a fail and is recorded as such. Note: its headroom (114000) keeps a default review (209000 + overhead) off it at Gate 2 |
| cc-sonnet-medium | PASS / FAIL / PASS | PASS | PASS | review: one of the two later passes rule 3 needs after the fail; not qualified |
| cc-sonnet-high | FAIL / PASS / PASS | PASS | PASS | **`review` added**: two passes after the fail (rule 3 satisfied) |
| cc-sonnet-xhigh (review only) | - / PASS / PASS | - | - | **`review` added**: `qualified-for: ["review"]` (two passes) |
| cc-opus-medium | PASS / FAIL / PASS | PASS | PASS | review: one of two later passes; not qualified |
| cc-opus-high | PASS / PASS / PASS | PASS | PASS | unchanged; gains the entries |
| cc-opus-xhigh | PASS / PASS / PASS | PASS | PASS | unchanged; gains the entries |
| cc-opus-max (review only) | - / PASS / PASS | - | - | **`review` added** (two passes) |
| cc-fable-medium | PASS / PASS / PASS | **FAIL** | PASS | **`pin-tests` removed** (rule 3: a calibration fail blocks the category until two later passes; the pin was over-specified, lead-notes N-1). Keeps `review`, `fix` |
| cc-fable-high | PASS / PASS / PASS | PASS | PASS | unchanged; gains the entries |
| cc-fable-xhigh | PASS / PASS / PASS | PASS | PASS | unchanged (lead-direct); gains the entries |
| cc-fable-max (review only) | - / PASS / PASS | - | - | **`review` added** (two passes) |

G-2 (lead-notes.md): two of the five adjudicated clusters rest on two prongs of the classification; under the full
definition the run-3 review of cc-haiku-medium and cc-haiku-high would be FAIL. The preregistered score (PASS) is
what the evidence entries record, and it changes nothing above (both profiles need two later passes either way).
Write this sentence into the README's "How calibration run 3 was applied" section.

Evidence entries use the existing form, one per run and task: `calibration-3: pin-tests PASS (n=1)`,
`calibration-3: fix PASS (n=1)`, `calibration-3: review PASS|FAIL (n=1)` (no PARTIAL this run). Each calibrated
profile also gets the run-id entry `wf_4e9ef48d-066 (calibration-3): pin, fix and review graded in
trace/calibration-3/ (results-table.md, observations.json)`; for cc-haiku-high and cc-haiku-low the entry adds
`; fix (cc-haiku-high) and review (cc-haiku-low) from the supplementary run wf_dbe29a64-3b2 (amendment A-1)`.
cc-haiku-low's `fix` removal gets the entry `demoted from fix 2026-10-18: two consecutive verification-failed
outcomes (fix-u7-r3 seq 4, fix-x2-2 seq 3; rate proposal ratified); re-qualification needs two later passes`.
cc-fable-medium's `pin-tests` removal gets `pin-tests blocked 2026-10-18: calibration-3 pin FAIL (over-specified
pin, lead-notes N-1); two later passes needed`. `qualified-at` 2026-10-18 and reviewer `host-declared (lead) from
calibration-1, calibration-2 and calibration-3 grades` for every profile this revision adds a qualification to or
removes one from; the others keep their `qualified-at` and reviewer and gain the entries. `expires` stays 2027-01-15.

`headroom-tested`: the rule (largest completed run, rounded up to the next thousand, never lowered) raises nothing
this run: every run-3 cell is below its profile's current figure (largest: sonnet-xhigh review 227,264 < 328000;
opus-max 266,339 < 307000; fable-max 189,364 < 230000; haiku-high fix 142,418 < 726000). Assert this in the test's
headroom rule, which now folds in run 3's usage.

## Deliverables

A. `host-policy.json` becomes `policy-revision: host-policy-4` with the table above applied: `review` added to
   cc-sonnet-low, cc-sonnet-high, cc-sonnet-xhigh, cc-opus-max, cc-fable-max; `fix` removed from cc-haiku-low;
   `pin-tests` removed from cc-fable-medium; the entries and run ids on every profile; nothing else changes
   (categories, economics, usage-windows, prices, harness, authorization, isolation, accounting untouched).
B. Goldens: the host-policy-1 fixture goldens stay; the revision-2 assertions stay on `trace/policies/host-policy-2.json`;
   copy the pre-revision policy (the policy at the unit's base commit) to `trace/policies/host-policy-3.json` (a
   fixture, never edited) and pin the host-policy-3 assertions (the `host-policy-3:` tests, the README
   routing-consequence test, the usage tests that read the committed policy) to it with `--policy` / the fixture
   path, exactly as revision 3 did for revision 2. Add the host-policy-4 assertions against the live policy:
   `pin-tests` -> cc-haiku-low (unchanged); `fix` (193000) -> the profile the economics choose with cc-haiku-low gone
   (compute it with `decide`, assert it, name it in the README; the lead expects cc-haiku-high: haiku-medium's
   183000 headroom does not admit 193000); `review` (209000) -> the profile the economics choose among the newly
   qualified (compute it; the lead expects cc-sonnet-xhigh, the cheapest review-qualified profile whose headroom
   admits 209000 + overhead; cc-sonnet-low and cc-sonnet-high fail Gate 2 on headroom); a `review` request with
   `candidates` limited to cc-haiku-low, cc-haiku-medium, cc-haiku-high, cc-sonnet-medium and cc-opus-medium routes
   `blocked` (one later pass is not a qualification); a `fix` request with `candidates` limited to cc-haiku-low
   routes `blocked` (demoted); a `pin-tests` request limited to cc-fable-medium routes `blocked`.
C. `rate`: no code change expected (it already reads calibration-3 and prints the demotion proposal). Add the test
   that, under the live policy, `rate` prints no demotion proposal for cc-haiku-low from fix once the profile no
   longer holds the category (the proposal concerns a qualified profile), and still prints the CALIBRATION lines
   for calibration-3 with the counts above (e.g. `cc-sonnet-high review: 2 pass, 0 partial, 1 fail`). If `rate`
   does propose demotion of an already-demoted profile, fix that red-first (it would re-propose forever).
D. README: the qualification table regenerated from the policy (15 rows, run-3 column added); a section "How
   calibration run 3 was applied (host-policy-4)" with the table above in prose or as is, the G-2 sentence, the
   demotion ratification and the pin block; the routing-consequence paragraph recomputed with `decide` and quoted
   (fix and review defaults under revision 4, with the Gate 5 reason and the all-in bound); and two friction-log
   items: (19) the workflow harness relays the operator's latest chat message into every worker as the request
   that "wins" over the computed task (amendment A-1 upstream): the isolation contract (§6) says a worker gets its
   brief; a host whose harness injects operator chat cannot guarantee the brief is the whole input, and the
   calibration kit must record the relayed text before the launch; (20) the three-lens adjudication's output schema
   needs the classification's third prong (`forbidden`) or the majority counts on two prongs (G-2).
E. Tests red-first with guard-removal proofs for every assertion in B and C: policy validation of the revision-4
   table (a `host-policy-4:` table test in the shape of the `host-policy-3:` one: qualified-for per profile, the
   entries including the three runs' grade entries and run ids, the demotion and block entries, headroom rule over
   the three runs' usage), the host-policy-3 fixture goldens, the host-policy-4 routing assertions, the `rate`
   assertions.

## Non-goals and stop triggers

No change to gate order, reason texts, categories, economics, prices or the usage-windows block; no qualification
beyond the table (a cheaper profile does not become eligible because it looks capable); no edit to the ledgers,
outcomes, decisions, readings or any `trace/calibration-*` file; no new command or flag; no adapter code change
unless C requires one. Stop and report if a golden under the host-policy-1 or host-policy-2 fixture changes, if the
suite's 93 tests do not stay green, or if applying the table would require a rule not written above.
