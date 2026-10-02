# Discovery Contract - Reconciling a dispatched GitHub Actions run durably: finding the run a workflow_dispatch started, polling its status over the REST API, and how long its logs and artifacts stay available

Started 2026-10-02. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

Durable reconciliation of GitHub Actions runs for MoonAliza's Stage E (research
provisioning and durable GitHub job reconciliation, HANDOFF.md). MoonAliza dispatches a
workflow with `workflow_dispatch`, may be closed or restarted before the run ends, and must
later find that exact run again, read whether it finished and how, and fetch its logs and
artifacts while they still exist. Done means a builder knows, from the owner's pages: how
the run's id is obtained at dispatch time or recovered afterwards, which endpoint reports
status and conclusion and in what values, how often it may be polled, and how long logs,
artifacts and the run record itself remain available.

## Unknowns

A fact belongs here when guessing it wrong changes the design: API limits and pricing,
auth model, data schemas, rate limits, licensing/ToS, platform behavior, current library
versions, competitor pricing, data availability.

Status is exactly one of:
- `CLOSED` - proven by an `E-##` row in `research/EVIDENCE.md` (which must point at cached raw text).
- `KNOWN-UNKNOWN` - unreachable now; the `Evidence` cell names the day-one verification step.

Anything else (`OPEN`, blank, "in progress") fails the gate.

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|
| U-01 | How does a caller learn the run id of the run its `workflow_dispatch` created? | Decides whether the dispatch is a single request that can be recorded durably, or a dispatch plus a search for the run it started. | CLOSED | E-01, E-03: the dispatch POST returns the run id with `return_run_details`; the request carries `ref` and `inputs` |
| U-02 | Which REST endpoint reports a run's status and conclusion, and what values can they take? | The reconciler's state machine is those values; a wrong set leaves runs stuck "pending" or reports them finished early. | CLOSED | E-02: GET a workflow run with Actions read; list runs by event, branch, head_sha, created; the status and conclusion vocabulary |
| U-03 | How long do a run's logs and artifacts stay downloadable, and is that configurable? | Sets the deadline by which MoonAliza must fetch a result it dispatched before closing. | CLOSED | E-06, E-04: 90 days by default, 1-90 public and 1-400 private, applying to new objects only |
| U-04 | Does GitHub delete the run record itself after a retention period, not only its artifacts? | A reconciler that looks a run up weeks later must know whether "not found" can mean "expired". | CLOSED | E-04, E-06: since 2026-10-01 the run record itself is deleted under the same retention setting |
| U-05 | What rate limits apply to polling the REST API with a user or installation token? | Sets the polling cadence and the back-off a desktop app must keep to. | CLOSED | E-05: 5,000 requests per hour per user token, 1,000 per hour per repository for GITHUB_TOKEN, 60 unauthenticated |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

Locked decisions for this project. Do not revisit these without the human.
