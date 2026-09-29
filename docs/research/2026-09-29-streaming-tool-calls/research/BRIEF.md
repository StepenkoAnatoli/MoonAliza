# Brief - Streaming tool calls: how Ollama /api/chat and OpenAI-compatible Chat Completions deliver tool calls when stream is true

_Auto-drafted 2026-09-29 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require human/agent judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## The prior, registered before anything was collected

_Ledger seq 1, chained: neither this text nor its place before the evidence
can be changed now. Read it against the findings below - it may well be wrong, and a wrong
prior that was recorded in advance is worth more than a right one remembered afterwards._

> I expect Ollama's native /api/chat to send each tool call whole inside one streamed message chunk, and OpenAI Chat Completions to stream tool calls as deltas keyed by index, with id and name only in the first delta and arguments as string fragments to concatenate; and Ollama's OpenAI-compatible endpoint to follow OpenAI's delta shape. So MoonAliza needs two different accumulators, not one.

## Intent

Streaming for MoonAliza's agent loop. Today `src/main/inference.ts` calls both provider
families with `stream: false`, and HANDOFF.md lists streaming as remaining provider work.
Done means knowing, for each provider family MoonAliza supports, how a tool call arrives in
a stream - whole or in fragments, keyed how, and what ends the turn - so one accumulator per
wire format can be written without guessing.

## What we verified

| Claim | Source | Type |
|---|---|---|
| Ollama blog, 28 May 2025: streaming with tool calling shipped. Its sample stream shows content chunks, then one chunk (done: false) whose message.tool_calls holds a complete call - name and arguments as a JSON object, not a string fragment. [quote: Ollama now supports streaming responses with tool calling] | E-04 `ollama.com` (U-01) | P |
| OpenAI guide, function calling / Streaming: each delta.tool_calls item carries index (which call it belongs to); id, type and function.name are set only on a call's first delta; function.arguments arrives as string fragments to concatenate per index into an encoded JSON string, parsed only once complete. [quote: Many of these fields are only set for the first] [quote: Identifies which function call the] [quote: aggregating chunks into an encoded] | E-07 `platform.openai.com` (U-02) | P |

## Contradictions and how they were resolved

None between sources. Ollama's docs and blog agree, and so do OpenAI's guide and reference.
The two *formats* differ, and that difference is the finding:
- **Ollama native** sends each tool call whole, with arguments as an object.
- **OpenAI Chat Completions** sends index-keyed fragments, with arguments as a string.

The prior predicted this split correctly. It also predicted that Ollama's OpenAI-compatible
endpoint "follows OpenAI's delta shape". The docs neither confirm nor deny that, which is why
U-03 stays a known unknown instead of taking the prior's word.

## Known unknowns

- **U-03** - Does Ollama's OpenAI-compatible endpoint stream tool calls whole or as index-keyed fragments?
  - Known so far: E-05 says Streaming and Tools are supported (tool_choice is not) but shows no streamed tool call.
  - Day-one verification: against a local Ollama, POST /v1/chat/completions with stream true and one tool, log every delta.tool_calls, and check the index-keyed accumulator (U-02) yields one call with parseable arguments - it must, whether the arguments arrive whole or in fragments.

## Decision

**Two accumulators, one per wire format.** Both sit behind the existing
`ModelProvider.stream()` contract (`src/shared/contracts.ts`).

**1. Native Ollama (`/api/chat`, `stream: true`):**
- Append `message.content` and `message.thinking` as they arrive.
- Extend a `tool_calls` list with every complete call seen.
- The turn is a tool turn when that list is non-empty at `done: true`.
- Send back `thinking`, `content` and `tool_calls` together with the tool results (E-03).

**2. OpenAI-compatible (`/v1/chat/completions`, `stream: true`):**
- Key calls by `delta.tool_calls[].index`.
- Take `id`, `type` and `function.name` from the first delta that has them.
- Concatenate `function.arguments`.
- Parse the JSON only when `finish_reason` is `tool_calls` (E-06, E-07).
- Keep `stream_options.include_usage: true`: the open-gaps brief showed that without it no
  usage arrives, and context accounting depends on usage.

**The same accumulator serves the Ollama OpenAI-compatible endpoint.** Joining by index is
correct whether a call arrives whole or in fragments. So U-03 changes nothing in the design;
it only needs confirming.

**Out of scope:**
- `tool_choice` on Ollama's OpenAI-compatible endpoint: it is unsupported (E-05).
- UI rendering of partial arguments.
- The Responses API.

**First build step:** a fixture test per format that replays the chunk sequences quoted in
E-04 and E-07 through the accumulator and asserts one complete call. Then flip `stream` in
`src/main/inference.ts`.

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "$HOME/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=8422df5cc7941595 inputs=30b4c18e5e23339c gate=pass -->
