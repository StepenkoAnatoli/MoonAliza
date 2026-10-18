# sr-policy-6 report 1: calibration-first evidence in the adapter, host-policy-6

Builder: cc-opus-high (dispatch seq 3 of sr-policy-6; profile cc-opus-high at effort high). Worktree
`/home/user/task5-handoff/wt/sr-policy6`, branch `build/sr-policy6`, base `145f78e`. Six commits, not pushed. This
report file is not committed.

## Gist

- E1-E3 and E7 in `route.mjs`; `host-policy.json` is `host-policy-6` (`"evidence": "typed"`, the lead's E5 table applied); host-policy-5 frozen as `trace/policies/host-policy-5.json` and its assertions pinned to it.
- Suite 135/135 (119 base + 16 new), red-first for every new test that can be red, 43 guard-removal proofs, eslint 0, node --check 0; the host-policy-1..5 goldens and assertions unchanged. Every reference in the table resolves against the store as it stands (no stop trigger hit).
- Revision 6 routing: fix@T1 -> cc-haiku-high, fix@T2 -> cc-opus-high (now its only T2 holder), review@T1 -> cc-sonnet-xhigh, build-ui undeclared -> cc-opus-high, pin-tests@T1 -> cc-haiku-low, as under revision 5.
- build-core, build-tests, research-collect, docs-mechanical above 15000 tokens: blocked (every delegate Gate 2 '<id> not qualified for <category>'; cc-fable-xhigh Gate 5 'direct unsuitable'); remedy: run 4's T1 host-pack cells.
- Two choices past the brief: the Outcome's owner-profile must be the referencing profile (finding 4); a host-policy-6 fixture will not load from trace/policies/ (finding 5, the next revision's problem).

## Commits

| sha | subject |
|---|---|
| `80f91bc` | test(smartrouter): host-policy-5 frozen as a fixture; the host-policy-5 assertions pinned to it (sr-policy-6) |
| `bb73fef` | feat(smartrouter): the typed production reference - its form from the policy alone, its resolution against the outcome store beside the policy file (E1) |
| `a8344f0` | feat(smartrouter): "evidence": "typed" - every qualified-for entry backed by a PASS grade entry or an accepted reference at its tier; the lead-direct profile exempt (E2, E3) |
| `3552b8c` | feat(smartrouter): host-policy-6 - "evidence": "typed", revision 5's production-derived entries rewritten into typed references or dropped (the lead's table), with the table test and the revision-6 routing |
| `c889070` | feat(smartrouter): rate's qualify proposal ends with the typed references the lead would paste; every command validates the typed policy (E7) |
| `1a4224a` | docs(smartrouter): README for host-policy-6 - Calibration-first evidence (...), how the onboarding proposal was applied, the regenerated table, policy findings, friction items 23-25 |

Identity StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>; every message ends with
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and the `Claude-Session` line; five-part report in each
message. Files touched (all under `docs/orchestration/smartrouter/`): `README.md`, `host-policy.json`, `route.mjs`,
`route.test.mjs`, `trace/policies/host-policy-5.json` (new). No ledger, usage, decision, outcome or calibration file
edited; `trace/qualification-stats.json` untouched. Not a declared code path: no `docs/ARCHITECTURE.md` change. The
commit hook printed "research gate: allow - the gate passes" on each commit; no --no-verify.

## What was built

- **E1** (`referenceForm`, `resolveReference`, `loadPolicy` passes `dirname(resolve(path))`): any evidence line starting
  `outcome:` must be `outcome: <task-id> <category>[@T<k>] accepted <YYYY-MM-DD> (<path>)[; <note>]` with a known
  category, a calendar day, and a relative '/'-separated path naming `outcomes/<task-id>-<seq>.json`. Resolved against
  the policy file's directory: file exists, JSON, a §10.3 Outcome (`validateOutcome`), task-id matches, `accepted`,
  owner-profile is the referencing profile (builder's addition), recorded that UTC day (Outcome `ts`, else the outcome
  record `<task> seq <seq>` in the store's ledger), decided in that category (`categoryMap` of the store), tier equal
  to the decision's declared tier (the decision the dispatch was made under, else the latest), or, against a pre-tier
  decision, a declared tier needs 'would be T<k> by the table' in the note; bare reads T1. Exit 2 naming profile and
  entry. `categoryMap` additively records each decision's declared tier (null for none).
- **E2/E3**: `"evidence": "typed"` (any other value exit 2). Under it, every qualified-for entry of every profile but
  `economics.lead-direct-profile` needs a PASS grade entry or a resolved reference for its category at tier >= k
  (untiered: tier ignored); PARTIAL/FAIL and free text support nothing. The exempt profile's references still resolve.
- **E5** (`host-policy.json`): exactly the lead's table; see README 'Calibration-first evidence'. Notes carry each
  decision's permitted-file count (`sr-policy-5`: six, not the brief's "five and nine").
- **E7**: every command (decide, dispatch, outcome, status, rate, usage) goes through `loadPolicy` (pinned by a test).
  A qualify `PROPOSAL` line ends with `; typed evidence to paste: "outcome: ...", ...` (one per accepted outcome,
  JSON strings, path relative to the policy file); the stats file carries `references`. Reason text unchanged.

## Routing under revision 6 (decide on the live policy's feature-off derivative, asserted)

| request | route | Gate 2 / Gate 5 reasons |
|---|---|---|
| fix@T1 (193000) | delegate cc-haiku-high, $3.1865, reviewer cc-sonnet-xhigh | eligible: cc-haiku-high, cc-opus-high, cc-opus-xhigh, cc-fable-high (as revision 5) |
| fix@T2 (193000) | delegate cc-opus-high, $6.95 | eligible: cc-opus-high only; `cc-fable-high not qualified for fix@T2 (holds fix@T1)` (revision 5 also had cc-fable-high) |
| review@T1 (209000) | delegate cc-sonnet-xhigh, $3.09 | as revision 5 |
| build-ui undeclared (250000, reads T2) | delegate cc-opus-high, $8.09, reviewer cc-sonnet-xhigh | eligible: cc-opus-high only (build-ui@T3 on five references) |
| pin-tests@T1 (120000) | delegate cc-haiku-low, $1.06 | as revision 5 |
| build-core default (316000, T3) | blocked | every delegate Gate 2 `<id> not qualified for build-core` (some with `; context: ... headroom` appended); cc-fable-xhigh Gate 5 `direct unsuitable: 316000 tokens > direct-max-tokens 15000` |
| build-tests default (250000, T2) | blocked | same shape, Gate 5 at 250000 |
| research-collect default (232000, T2) | blocked | same shape, Gate 5 at 232000 |
| docs-mechanical (92000; undeclared T2, declared T1) | blocked | every delegate `<id> not qualified for docs-mechanical`; Gate 5 at 92000 (revision 5: cc-haiku-low, $1.05) |
| any of the four at 15000 tokens | direct cc-fable-xhigh | - |

`eligible-outside-candidates` is empty for the four blocked categories. Under the host-policy-5 fixture the same
build-core, build-tests and research-collect requests delegate to cc-opus-high (asserted).

## Tests (red / green)

Suite command: `node --test docs/orchestration/smartrouter/route.test.mjs`, cwd `/home/user/task5-handoff/wt/sr-policy6`.
Base 119 green at `145f78e` (verified).

| test (new or pinned) | red | green |
|---|---|---|
| host-policy-5 fixture test + six pinned host-policy-5 tests | no fixture: 120 tests, 113 pass, 7 fail | with fixture: 120/120 |
| E1 acceptance (references load, fixtures 1..5 carry no outcome: line) | green before (guards against an over-strict resolver; its guard: resolution base) | 124/124 |
| E1 form; E1 unresolvable; E1 policy-directory vs --trace | before the adapter change: 124 tests, 121 pass, 3 fail | 124/124 |
| E2 key and refusal; E2 support rules; E3 exemption | against the previous route.mjs: 127 tests, 124 pass, 3 fail | 127/127 |
| host-policy-6 table; every entry checked by the validator; E6 routing | against the revision-5 policy: 130 tests, 127 pass, 3 fail | 130/130 |
| E7 every command exit 2 | green before (pins existing loadPolicy use; its guards: status, rate) | 132/132 |
| E7 qualify paste lines | 132 tests, 131 pass, 1 fail | 132/132 |
| README host-policy-6 table; calibration-first section; applied/findings/friction | 135 tests, 132 pass, 3 fail | 135/135 |

## Guard-removal proofs (scratch copies, each turning at least one named test red)

- Fixture: one byte appended to host-policy-5.json -> the fixture test.
- E1 (17): the 'accepted' literal; known category; calendar day; path rule; typed lines checked at all (3 tests); file
  exists (2); an Outcome; task-id; accepted; owner; recorded time; date; decision exists; category; declared tier;
  'would be' wording; resolution base = cwd instead of the policy directory (3 tests).
- E2/E3 (8): key value check; rule gated on the key (applied always: 15 tests red, fixtures included); the rule itself
  (3); PASS-only; tier >= k (2); untiered tier-blindness; references as support (3); the E3 exemption (3).
- Policy (6): key removed; build-core@T3 kept (also P2-4 red: the live policy refuses to load); cc-fable-high fix@T2
  kept; sr-host-fix references removed; a reference dated a day off; docs-mechanical kept - each reds the revision-6 tests.
- E7 (5): paste suffix; declared-tier-or-bare label; path relative to the policy file; status validates; rate validates.
- README (6): a table row's references; the remedy sentence; one gate-walk line; the E7 bullet; friction 24's title;
  finding 5's fixture path.

## Checks

- `node --check docs/orchestration/smartrouter/route.mjs` exit 0 (verified).
- `npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs` exit 0 (verified).
- `node --test docs/orchestration/smartrouter/route.test.mjs` 135/135, about 14 s (verified); goldens exact under
  host-policy-1, assertions on host-policy-2..5 fixtures unchanged.
- `node route.mjs status sr-policy-6` on the committed trace under the live typed policy: exit 0 (verified; the live
  policy resolves all twelve references against `trace/`).

## Policy findings (full text in README 'Policy findings (host-policy-6)')

1. The proposal is not at `/home/user/smartrouter/docs/proposals/calibration-first-onboarding.md`: that checkout is at
   `5bd473a` (PR #98). Read from SmartRouter main `7f7fc75` (contains PR #102's merge `bb3fa6c`) in the read-only
   worktree `/home/user/task5-handoff/wt/sr-main`; identical to `git show origin/main:` in `/home/user/smartrouter`.
   Nothing copied but quoted passages.
2. The proposal's status still reads "draft ... hosts MUST NOT emit or require them", review row pending (as with the
   tiers proposal; friction 22). Bounded by the `"evidence": "typed"` switch.
3. E3 has no clause upstream (friction 23).
4. Owner-profile check beyond E1's list (builder's choice; revertible: one line in `resolveReference`).
5. A future `trace/policies/host-policy-6.json` fixture will not load (references resolve against
   `trace/policies/`); the revision that freezes it must write test derivatives beside a store copy, as
   `LIVE_OFF_DIR` does now, or the lead picks another base for fixtures.
6. Four categories without a delegate (E6); RUN.md consequence is the lead's.
7. References need the ledger beside the outcomes (Outcomes carry no ts).
8. Pre-tier references' tiers are the host's word (only the "would be" note is checked).
9. `sr-policy-5` had six permitted files, not five.
10. The policy `_comment` still describes evidence as run ids or grade entries (left: E5 says nothing else changes).

Builder's choices also recorded: `cc-haiku-low`'s mechanical-extraction line got the dropped suffix (the table lists
the drop but not the line); E7's "the typed reference line" read as one line per accepted outcome behind the proposal.

## Friction items added upstream (README)

23 (no clause for the lead's own profile), 24 (the `outcome:` form carries no tier; this host added `[@T<k>]`),
25 (the store's base: `--trace` in the proposal, the policy file's directory here; form-only mode).

## What I got wrong and fixed

- mistake: E3 test expected an owner refusal from the ref-fail reference; where: route.test.mjs E3 test (before
  commit a8344f0); impact: wrong expected reason, nothing delivered; cause: `accepted` is checked before the owner;
  fix: use REF_T2; verified: suite 127/127.
- mistake: entry count 26; where: 'every calibration-derived entry is supported' (before 3552b8c); impact: false red;
  cause: miscount (30 entries over fourteen delegate profiles); fix: 30; verified: 130/130.
- mistake: exact Gate 2 reason for every delegate in E6; where: routing test (before 3552b8c); impact: false red;
  cause: Gate 2 appends '; context: ...' for headroom shortfalls; fix: match the leading reason; verified: 130/130.
- mistake: undeclared docs-mechanical expected T1; where: routing test (before 3552b8c); impact: false red; cause: D3's
  undeclared default is T2 for normal risk (the T1 floor bounds a declared tier only); fix: T2; verified: 130/130.
- mistake: the first README-writing script referenced a name before defining it and claimed $1.46 for revision 5's
  docs-mechanical route; where: scratch script, before 1a4224a; impact: none (the script failed before writing;
  the figure was computed with decide before use: $1.05); fix: script rewritten, figure from decide; verified: README
  tests 135/135.

## Stop triggers

None hit: no host-policy-1..5 golden changed; the 119 base tests stayed green throughout; every reference in the
table resolved against the store as it stands (no outcome invented).
