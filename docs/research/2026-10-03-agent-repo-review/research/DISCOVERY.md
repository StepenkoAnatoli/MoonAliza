# Discovery Contract - What MoonAliza can adopt from three public repositories the user named (gpt-pilot, beelzebub, tffm) and the GitHub research-and-development topic: what each is, its license and maintenance state, and which patterns fit a local, approval-gated agent

Started 2026-10-03. This file is the definition of "enough information to build".
`node "/root/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

On 2026-10-03 the user named three repositories (gpt-pilot, beelzebub, tffm) and the GitHub research-and-development topic, asking what MoonAliza can take from them. MoonAliza is a local, approval-gated desktop agent whose planned phases are research, project memory, missions and sandbox computer use. Done means a builder knows, from each repository's own pages, what it is, its license and maintenance state, and which patterns (not code) fit MoonAliza, plus what to avoid.

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
| U-01 | What gpt-pilot is and what state it is in | Decides whether its workflow is a usable model for missions | CLOSED | E-01 |
| U-02 | gpt-pilot's license | Decides whether anything beyond ideas may be reused | CLOSED | E-02 |
| U-03 | What beelzebub's MCP decoys do | Decides whether bait tools fit MoonAliza's injection tests | CLOSED | E-03 |
| U-04 | beelzebub's license | Decides whether its code may be reused | CLOSED | E-04 |
| U-05 | What tffm is | Decides whether it is relevant at all | CLOSED | E-05 |
| U-06 | Which repositories the research-and-development topic lists | Decides whether one of them is worth a closer look | KNOWN-UNKNOWN | github.com/topics refused the keyless fetch (HTTP 403). Day-one step: open the topic page in a browser and name any listed repository that is an agent, research or knowledge tool; collect its README in a new project. |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

Locked decisions for this project. Do not revisit these without the human.
