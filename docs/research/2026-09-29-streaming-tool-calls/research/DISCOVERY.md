# Discovery Contract - Streaming tool calls: how Ollama /api/chat and OpenAI-compatible Chat Completions deliver tool calls when stream is true

Started 2026-09-29. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

Streaming for MoonAliza's agent loop. Today `src/main/inference.ts` calls both provider
families with `stream: false`, and HANDOFF.md lists streaming as remaining provider work.
Done means knowing, for each provider family MoonAliza supports, how a tool call arrives in
a stream - whole or in fragments, keyed how, and what ends the turn - so one accumulator per
wire format can be written without guessing.

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
| U-01 | How does Ollama's native /api/chat deliver tool calls when stream is true? | Picks the accumulator for the Ollama path: whole calls to collect, or fragments to join. | CLOSED | E-04, E-03: whole - a streamed message chunk carries complete tool_calls (arguments as an object); the client collects them across chunks and returns thinking, content and tool_calls with the results. [single-witness: Ollama documenting its own API, in its docs and its blog] |
| U-02 | How does OpenAI Chat Completions deliver tool calls when stream is true? | Picks the accumulator for the OpenAI-compatible path, and what marks the end of a tool turn. | CLOSED | E-07, E-06: as deltas keyed by index; id, type and name only on the first; arguments as string fragments concatenated then parsed; finish_reason tool_calls ends the turn. [single-witness: OpenAI's guide and API reference are one publisher describing its own API] |
| U-03 | Does Ollama's OpenAI-compatible endpoint stream tool calls whole or as index-keyed fragments? | MoonAliza's OpenAI-compatible profile may point at Ollama; a parser that assumes one granularity could mis-join calls. | KNOWN-UNKNOWN | E-05 says Streaming and Tools are supported (tool_choice is not) but shows no streamed tool call. Day-one verification: against a local Ollama, POST /v1/chat/completions with stream true and one tool, log every delta.tool_calls, and check the index-keyed accumulator (U-02) yields one call with parseable arguments - it must, whether the arguments arrive whole or in fragments. |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

Locked decisions for this project. Do not revisit these without the human.
