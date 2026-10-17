# SmartRouter host adapter (MoonAliza build process)

`route.mjs` is the host side of [SmartRouter](https://github.com/StepenkoAnatoli/SmartRouter) (pinned at `fbe7bca`,
skill 3.0.0) for this repository's build runs. SmartRouter itself is a routing policy: advisory and stateless. It
says which route (direct, delegate, speculative, recommend-escalation, blocked), which profile (model and effort)
and which isolation apply to a unit of work, and why. The **host** is this adapter plus the lead session. The host
collects the inputs, enforces the decision, and keeps the Outcome Ledger. The adapter never dispatches anything
itself. Every output it prints carries `Advisory: recommendation only — no dispatch performed or claimed`.

| File | What it is |
|---|---|
| `host-policy.json` | The host's declared inputs: harness, authorization, accounting mode, prices, categories, profiles with qualification evidence, economics constants, opt-ins. Edited only by the lead. |
| `route.mjs` | The adapter: CLI plus named exports. Node built-ins only. |
| `route.test.mjs` | `node --test` suite, one test per SmartRouter fixture it mirrors, plus the three golden hand-walked decisions. |
| `trace/ledger.jsonl` | The Outcome Ledger: spec-v2 §10.5 records, append-only, never rewritten. |
| `trace/decisions/<task>-<seq>.json` | One file per decision: the request, input and policy digests, the per-candidate gate walkthrough with reasons, the chosen profile, estimates vs accounting, the Brief. `hand-*.json` are the lead's hand-walked decisions from before the adapter existed. |
| `trace/outcomes/<task>-<seq>.json` | The §10.3 Outcome objects that outcome records point at. |
| `trace/qualification-stats.json` | Derived by `rate`. Regenerated on every run, never hand-edited. |

## The lead's per-dispatch procedure

Run every command from the repository root. Node 24 must be on `PATH`.

1. **Decide.** Write the request JSON (fields below) and run
   `node docs/orchestration/smartrouter/route.mjs decide <request.json>`.
   It prints the Required output format block, the Advisory line, a gate walk per candidate and, for `delegate`,
   the Brief. It also writes `trace/decisions/<task>-<seq>.json` and appends a `decision` record. Exit 0 means a
   route was decided, and that includes `blocked`. Exit 2 means the request is invalid. **A `blocked` route is
   final**: change the inputs (scope, checks, data classes) and decide again; never dispatch around it. When no
   candidate is eligible the route is `blocked`, even if a profile outside `candidates` would pass: the
   Uncertainty line names it as a hint (`not among candidates: ...`), and only a fresh decision that lists it can
   route to it. The adapter never emits `recommend-escalation` (friction item 13).
2. **Put the Brief in the builder's prompt** verbatim. The JSON after `Brief:` is the contract. Use the profile's
   model and effort exactly as the `Profile:` tuple says.
3. **Record the dispatch before launching:**
   `node docs/orchestration/smartrouter/route.mjs dispatch <task-id> <profile-id>`.
   This reserves the call slot. Exit 3 means refused, so do not launch. Before it records anything, `dispatch`
   re-walks the decision's stored request (`trace/decisions/<task>-<seq>.json`) against the current policy, ledger
   and `--now`: a fingerprint that expired, a data class or destination that was revoked, or a route that moved to
   another profile since the decision refuses the dispatch, and the lead decides again. Dispatching any other
   profile than the decided one is a host deviation: it needs `--deviation "<reason>"`, the ledger marks it, and it
   is allowed only to a profile that passes Gates 1-4 on the same request. An unqualified profile, or one with no
   capability fingerprint, is refused even as a deviation (spec-v2 §11.2, §11.10, §12).
4. **Launch** the sub-agent in its own worktree and branch (`build/<unit-slug>`, the host convention; the Brief's
   `branch-hint`).
5. **Record the outcome** when the unit ends, from observed evidence, never from the agent's self-report:
   `node docs/orchestration/smartrouter/route.mjs outcome <outcome.json>`. This takes a §10.3 Outcome. Its
   `original-brief-fingerprint` must be the decision's, `actual-spend` is `null` in this host, and `owner-profile`
   is the profile id or its exact identity tuple.
6. **Re-route on failure.** Decide again with `previousResult` set to that Outcome. One same-profile repair is
   allowed per task. After that, the same profile is refused at Gate 4 and the decision falls to another
   qualified profile, which is a fresh decision.
7. `status <task-id>` prints the task's counters. `rate` runs the learning step (below).

Request fields: `taskId`, `objective`, `category`, `unit`, `permittedEffects`, `sources`, `nonGoals`,
`acceptanceChecks` ([{command, expect}]), `estimatedTokens` (default: the category median), `requiredTools`
(default: the category's), `needsVision`, `dataClasses`, `projectStop` ({redSuite, gateOff, researchGateFailing}),
`previousResult`, `deadline`, `now` (both ISO-8601; `now` is injected for determinism), `candidates` (default: every
profile), `allowDirect` (default true), `hostOptIns`. Three optional additions are accepted: `uncertainty: "high"`
(the only way to reach `speculative`, and only with the host opt-in) and `requiredIsolation` (a lower bound on the
§6 lattice). Every command takes `--trace <dir>` and `--policy <file>`. `dispatch`, `outcome` and `rate` also take
`--now <iso>`.

Exit codes: 0 done; 2 invalid input, including a `now` earlier than the task's latest ledger event (the task clock
is monotonic); 3 refused; 4 ledger integrity (an unparseable or non-§10.5 line, a seq gap, or a last line with no
trailing newline). The adapter refuses to append to a ledger it cannot read; it never skips a line. When writing a
ledger line by hand, end it with a newline: the adapter refuses an unterminated last line rather than append onto
it, and the fix is to add the missing newline, which changes no record.

## Enforced vs advisory in this host

| Concern | Status | Where |
|---|---|---|
| Permissions, data classes, project stops | **enforced**: Gate 1 denies before anything else; a forbidden data class never reaches Gate 2 | `decide` |
| Capability qualification and fingerprint freshness | **enforced**: declared `qualified-for`, `qualified-at`, `expires`, `headroom-tested`; equality with `expires` is expiry | `decide` |
| Verification prerequisites | **enforced**: every category check must be named in `acceptanceChecks`; a required review needs a fresh review-qualified profile | `decide` |
| Call slots (6 per task) | **enforced**: `used + 1 <= limit` in `decide` and again in `dispatch` | `decide`, `dispatch` |
| Same-profile repairs (1 per task) | **enforced**: counted from the ledger by identity (harness, provider, model, effort, config); renaming a profile in the policy does not reset them | `decide`, `dispatch` |
| Deadline | **enforced**: `now` strictly before; capped at 12 h from the task's first ledger event | `decide`, `dispatch` |
| Pre-dispatch recheck | **enforced**: `dispatch` re-runs Gates 1-5 on the stored request with the current policy and `now`; the decided profile must still be eligible and still the route's choice (gates.md 'Qualification, freshness and pre-dispatch binding' items 3-4). A decision record with no decision file behind it is unknown evidence and is refused | `dispatch` |
| Isolation | **enforced as a lower bound**: `worktree+branch` for delegated work; a stronger requirement than the host's capability is denied at Gate 1 | `decide` |
| Cash | **advisory**: the conservative bound (tokens x output rate) is computed, recorded and printed, never a cap. The Uncertainty line always says `cash: estimate only, no host accounting (subscription); not a strict cap` | `decide` |
| Unknown price | **enforced, by host choice**: a profile whose model has no price fails Gate 4 (`unknown price for <model>: the bound cannot be computed (no silent zero)`), though cash is not a cap here (friction item 15) | `decide` |
| Speculative and nested delegation | **off**: speculative needs the opt-in plus `uncertainty: "high"`; a nested opt-in is refused with a note, because this host cannot produce or enforce a NestedBrief (§14) | `decide` |
| Counters across task-id renames | **the lead's duty**: the adapter keys every counter by `taskId`, so a renamed task would start from zero. Never rename a task to get slots back (spec-v2 §11.9) | lead |

## Qualification table

Status of every row: **host-declared from run history, reviewer: lead, expires 2027-01-15**. This is not an
independent review. Qualification is declared by the host, never inferred from price or label (gates.md,
'Qualification, freshness and pre-dispatch binding').

| Profile | Model, effort | Qualified for | Headroom tested | Evidence |
|---|---|---|---|---|
| `cc-fable-xhigh` | lead model, xhigh | build-core, build-ui, build-tests, review, fix, docs-mechanical, research-collect | 460k | the lead's own direct fixes and integration units this session. **Direct only**, up to 15k tokens. |
| `cc-fable-high` | lead model, high | review, fix | 352k | workflow runs `wf_1fcbe585-d1e` (U5 review 3, fix 3, re-review 3) and `wf_7f80ebc5-5a8` (U5 fix 4) |
| `cc-opus-high` | worker model, high | build-core, build-ui, build-tests, review, fix, research-collect | 514k | 302 completed dispatches (28 builds, 130 reviews, 39 fix rounds, 26 research runs); every unit reached ACCEPT within three fix rounds |
| `cc-sonnet-high` | high | none | untested | no evidence in this host; Gate 2 rejects it as a missing capability fingerprint |
| `cc-haiku-low` | low, no vision | docs-mechanical | 92k | one mechanical extraction dispatch (91k tokens) |

The exact model ids live in `host-policy.json`. The `Profile:` line prints the full identity tuple
`(id, harness, provider, model, effort, config)`.

With the current prices the adapter routes `build-core`, `build-ui`, `build-tests`, `fix`, `review` and
`research-collect` to `cc-opus-high`, and small (under 92k tokens) `docs-mechanical` work to `cc-haiku-low`. Work of
at most 15k tokens goes direct to the lead. See the policy findings below for the `docs-mechanical` edge.

### How to add evidence

1. A qualification run cannot go through `dispatch`: a profile not qualified for the category fails Gate 2, and
   `dispatch` refuses it even with `--deviation`. Running an unqualified profile on real work is a host policy
   that SmartRouter does not sanction (spec-v2 §12: "No dispatch on unknown ... capability"). Whether this host
   runs such qualification runs at all, and how they are recorded, is **the lead's decision and is not yet made**
   (friction item 14). Evidence from runs outside SmartRouter routing, such as a calibration matrix, can still
   support a qualification.
2. Run `rate`. Three `accepted` outcomes for an unqualified (profile, category) produce a **qualification
   proposal**. With step 1 undecided, such outcomes appear only if the lead records out-of-band runs in the ledger
   by hand, as dispatch records marked `deviation: true`.
3. The lead ratifies by editing `host-policy.json`: add the category to `qualified-for`, append the run ids to
   `evidence`, set `qualified-at` to the ratification date, and set `expires` (at most three months out). Bump
   `policy-revision`. The decision files bind every decision to the policy digest, so old decisions stay readable.
   A decision not yet dispatched is rechecked against the edited policy at `dispatch`, so a demotion or a
   revocation takes effect on pending decisions too.
4. A profile with `qualified-at: null` or a past `expires` fails Gate 2 until this is done.

## The learning loop

`outcome` records go in, `rate` turns them into proposals, and the lead edits the policy. The adapter never
writes the policy.

- `rate` aggregates outcomes per (profile, category): accepted, verification-failed, partial, cost-overrun,
  cancelled, blocked, escalated, plus how many came from host deviations. It counts **one outcome per dispatch**:
  a later outcome record for the same dispatch supersedes the earlier one (spec-v2 §10.5, decision-trace.md §4),
  so recording a correction never double-counts. It writes `trace/qualification-stats.json`
  (`outcomes-counted` after supersession, `outcome-records` before), which is byte-identical when regenerated from
  the same ledger.
- It proposes **demotion** of a profile from a category after two consecutive `verification-failed` outcomes there
  since its `qualified-at`, or after any `cost-overrun`.
- It proposes **qualification** after three `accepted` outcomes in a category the profile is not qualified for.
  `dispatch` refuses such runs, so these outcomes can only come from runs the lead recorded by hand (see 'How to
  add evidence').
- It **flags** a profile whose `expires` falls within 14 days.
- Proposals are printed, never applied. Until the lead edits the policy, `decide` routes by the policy as it
  stands, and its Uncertainty line names every pending proposal for the chosen profile, e.g.
  `pending proposal (not applied): demote cc-opus-high from fix: 2 consecutive verification-failed (f-1, f-2)`.

MoonAliza the product gets the same loop later, through its Phase 6 advisory UI. That is out of scope here; this
adapter serves the build process only.

## Policy findings (host-policy-1)

These were found while building the adapter. The policy file is unchanged; the lead decides.

1. **A default `docs-mechanical` request is blocked.** `cc-haiku-low` has `headroom-tested` 92000, which equals the
   category's `median-tokens` 92000. Gate 2 requires the estimate to be strictly below headroom, so a request
   without `estimatedTokens` fails on the only delegate qualified for that category, and the lead's direct path
   stops at 15k tokens. Reproduction: `decide` on a `docs-mechanical` request with no `estimatedTokens` prints
   `context: 92000 tokens not below headroom-tested 92000 on cc-haiku-low`. Either test haiku above 92k, or pass a
   real estimate.
2. **`tools: true` cannot attest a tool list.** Categories require named tools (`research-collect` needs
   `firecrawl`), but profiles declare a boolean. The adapter accepts `true` as covering every required tool, and
   checks a list when one is given. A per-profile tool list would make Gate 2's "required tools present" checkable.
3. **The hand-walked ledger records `cash-spent: 0.0`.** decision-trace.md §1 says missing billable usage is
   "`unknown`, never zero". The adapter writes `null` for both `cash-spent` and `cash-cap`. The lead's six initial
   lines keep `0.0` because the ledger is never rewritten.
4. **The hand walk for `cc-haiku-low` on a `review` request stopped at its first reason.** The adapter's Gate 2
   collects every reason, as the fixture runner's `run_gates` does, and also reports
   `context: 209000 tokens not below headroom-tested 92000`. The first failing gate (2) and the route are
   identical.
5. **The `gsi-u5-rereview4` dispatch (18:12) precedes its decision (18:40).** The decision was walked after the
   fact, and the dispatch is honestly marked as a host deviation. The adapter now refuses a `now` earlier than a
   task's latest event, so such a sequence cannot be produced through it.

## Friction log for SmartRouter upstream

Every point where the spec was ambiguous or did not fit a subscription host. Citations are to
`StepenkoAnatoli/SmartRouter@fbe7bca`.

1. **No cash accounting in subscription hosts.** gates.md Gate 4: "Strict caps additionally require a reliable
   conservative billable bound and reliable host accounting". A subscription with weekly token limits has neither
   per-call USD nor a cap to enforce. Yet spec-v2 §10.5 types `counters.cash-spent` and `cash-cap` as numbers, and
   §10.3 types `evidence.actual-spend` as a number. This host writes `null` for all three and reports cash as an
   estimate on every Uncertainty line. Upstream could add an `accounting: estimate-only` mode that types these
   fields as `number | null` and names the resource that *is* finite here (weekly tokens).
2. **What counts as one "original task" across iterative review rounds.** SKILL.md 'Closed feedback loop' and
   spec-v2 §7 allow "at most one same-profile corrective dispatch per original task". brief-and-result.md
   'Attempt, repair and ledger rules' forbids renewing the allowance "by restarting, renaming, changing profiles or
   escalating". This build runs review, fix and re-review rounds (U5 needed four fix rounds). If every round is one
   task, its 6 calls and 1 repair run out by the second fix round. If every round is a new task, the cap is renewed
   by renaming, which is forbidden. Neither spec-v2 nor host-task-id.md (non-normative, and about id format and
   uniqueness only) defines the boundary. This host uses one task id per dispatch unit (one build, one review, one
   fix round). Upstream should define whether a fresh review finding opens a new task.
3. **The README's dead link to `docs/HANDOFF_RESEARCH_KIT.md` is no longer present at `fbe7bca`.** Commit
   `56fe172` (2026-10-13, "Make routing autonomous and separate project scope") deleted the file together with the
   README row that linked it, and `git grep HANDOFF_RESEARCH_KIT` at `fbe7bca` finds nothing. This was carried as a
   known item from an earlier revision. It is recorded here as resolved upstream, not as an open defect.
4. **MaxNestingDepth has two numberings.** The Required output format (SKILL.md, spec-v2 §9) allows `<0 | 1 | 2>`.
   brief-and-result.md allows `max-nesting-depth: <1 | 2>` in the Brief. spec-v2 §10.4 says "a top-level Brief is
   depth 1". With nesting off, this host prints `MaxNestingDepth: 0` (the policy's value) and emits
   `"max-nesting-depth": 1` in the Brief, meaning the top level only. One numbering would remove the ambiguity.
5. **Tools are a boolean in the fixture runner.** gates.md Gate 2 asks for "required tools (active, not
   decorative)", but `tests/smart_router_decisions.py` models `Profile.tools: bool`, and no §10 object carries a
   profile's tool list. Policy finding 2 above follows from this.
6. **The direct bound is not specified.** gates.md Gate 5 says to compare "against the full direct bound". This
   host's builder brief sets the direct bound to the lead's rate on the tokens, without the required review that a
   delegate carries. That favours direct, which SmartRouter prefers anyway, but the asymmetry is the host's choice,
   not the spec's.
7. **Fingerprint expiry at equality.** gates.md 'Qualification, freshness and pre-dispatch binding' item 4 makes
   quote and deadline equality expiry, but says nothing explicit about capability-fingerprint freshness limits. The
   adapter applies the same rule: `now` equal to `expires` is stale.
8. **"Report the first failing gate and reason" vs collected reasons.** SKILL.md decision-flow step 3 asks for the
   first failing gate and reason, while the fixture runner's Gate 2 joins every capability reason into one string.
   The adapter reports the first failing gate with that gate's full reason.
9. **The speculative "hard shared budget" cannot be hard for cash here.** speculative-mode.md 'When It Is Used'
   condition 4 requires "a hard shared budget". Without accounting only the call half is enforceable. The adapter
   keeps speculative off by default (policy opt-in false) and, when opted in, enforces the calls and labels the
   cash `estimate-only`.
10. **Verification names have no schema link to acceptance checks.** gates.md Gate 3 requires the checks
    "available", but nothing ties a category's verification names to the `acceptance.checks` of §10.1. The adapter
    matches each name case-insensitively as a substring of a check's `command` or `expect`, which is documented
    here, not in the spec.
11. **Task id format.** host-task-id.md §1 (non-normative) specifies `^[0-9a-f]{4,16}$` and branch
    `sr/<task-id>/<slug>`. This host uses descriptive ids (`sr-host-build`) and `build/<unit-slug>` branches. The
    adapter accepts `[A-Za-z0-9][A-Za-z0-9._-]{0,127}`, which is safe in file names. A hex id would be safer
    against collisions but unreadable in the run ledgers.
12. **Sameness includes the host profile id, which lets a rename renew a repair.** brief-and-result.md 'Attempt,
    repair and ledger rules' defines a same-profile repair by the tuple `(host-profile-id, harness, provider,
    model-id/revision, tool/output-config revision)`. Read literally, renaming a profile in the host policy makes
    the next dispatch a "different" profile and renews the repair. That contradicts SKILL.md 'Hard prohibitions'
    ("No reset of call/repair/attempt counters by restart, rename, or profile change") and spec-v2 §11.9. The
    adapter drops the host id from the sameness key. Upstream could state that the host id is a label, not part of
    sameness.
13. **`recommend-escalation` and the candidate set.** spec-v2 §5 defines `recommend-escalation` as "No current
    candidate is suitable; recommend a stronger eligible profile", which reads as reaching outside the candidates.
    The fixture-pinned semantics say the opposite: SKILL.md decision flow step 3 ("No eligible candidate ⇒ route is
    `blocked`"), 'Hard prohibitions' ("No empty-set resurrection"), gates.md Gate 5 ("do not fall back to a cheaper
    tier to avoid blocking"), and fixture E01's first leg in `tests/smart_router_decisions.py` (only C is a
    candidate, C fails Gate 2, expected `BLOCKED`). The fixture runner's `choose_route` never returns
    `recommend-escalation`, and the policy has no order of strength between profiles. The adapter follows the
    fixtures: an empty eligible set is `blocked`, and a would-be-eligible non-candidate is only a hint in
    Uncertainty. Upstream could say which profiles §5's "stronger eligible profile" may be drawn from, and add a
    fixture that reaches the route.
14. **No sanctioned path to qualification evidence.** gates.md Gate 2 and spec-v2 §11.10 require declared, tested
    qualification. §12 forbids dispatch on unknown capability, and §11.2 requires every gate decision to be
    enforced. So a host cannot route the first runs that would produce the evidence. The builder brief asked for a
    "qualification run" deviation; the adapter refuses it (review finding F3). Upstream could define a
    qualification mode, for example shadow runs whose output is never merged, with its own ledger kind.
15. **Unknown price without a strict cap.** gates.md Gate 4 says "Unknown or unbounded fees block a strict cap".
    The fixture runner checks price and accounting only under `if ctx.strict_cap is not None`. spec-v2 §12 reads
    "No dispatch on unknown permissions, identity, destination, capability, price or accounting under a strict
    cap", which can be read either way. This host has no strict cash cap, so the fixtures would let an unpriced
    profile through. The adapter still rejects it at Gate 4, as a deliberate host choice: Gate 5 ranks candidates
    by their all-in bound, and an unknown bound can neither be ranked honestly nor reported in Reservations. The
    other option, eligible but ranked after every priced candidate with 'unpriced' in Uncertainty, was set aside.
    It never matters while every profile is priced, and it would let a profile be chosen on a bound nobody can
    state. Every profile in host-policy-1 is priced. `validatePolicy` requires a price only for the lead-direct
    profile, so the reject is what keeps an unpriced profile out of routing. Upstream could say whether an unknown
    price blocks only a strict cap.
