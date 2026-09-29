# Discovery Contract - Ollama's OpenAI-compatible /v1/chat/completions: how tool calls arrive when stream is true (whole or index-keyed fragments)

Started 2026-09-29. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

MoonAliza's OpenAI-compatible accumulator (`src/main/provider-stream.ts`, merged in PR #7)
must read tool calls streamed by Ollama's `/v1/chat/completions` as well as by OpenAI. The
streaming brief left that as its U-03. Done means knowing, from Ollama's own code, what one
streamed tool-call delta carries (`index`, `id`, `type`, `function.name`, whole or partial
`arguments`), which `finish_reason` ends a tool-call turn, and since which release, so the
accumulator either accepts it as written or gets a named, tested change.

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
| U-01 | Does each streamed tool-call delta from Ollama `/v1` carry `index`, `id`, `type` and `function.name`? | The accumulator rejects a delta without `index` and a call without `id`/`type`; issue #7881 says `index` was once missing | CLOSED | E-03 (all four fields on every call), E-06 (template parser numbers calls 0,1,2). Built-in model parsers may repeat `index` 0 with distinct ids (E-05, a lead): handled by treating a new id at a used index as a new call |
| U-02 | Are a call's `arguments` sent whole in one delta or in fragments? | Decides whether U-03 of the streaming brief is closed or still needs a live check | CLOSED | E-03: whole - the argument object marshalled to one JSON string per call; E-05's 0.15.4 deltas show the same |
| U-03 | Which `finish_reason` ends a streamed tool-call turn? | MoonAliza executes calls only when `finish_reason` is `tool_calls`; any other value discards them as incomplete | CLOSED | E-03, E-04: `tool_calls`, on its own finish chunk, when the done reason was `stop` and a call was sent. E-02: the 2024 stream said `stop` |
| U-04 | Since which Ollama change is `index` populated? | Decides whether an older Ollama must be tolerated or refused with a clear error | CLOSED | E-05 (PR #7888, merged Nov 2024), E-02 (released in v0.4.7). Older versions are refused, not guessed at |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

- The two-accumulator design of `docs/research/2026-09-29-streaming-tool-calls` stands; this project only checks Ollama `/v1` against it.

Locked decisions for this project. Do not revisit these without the human.
