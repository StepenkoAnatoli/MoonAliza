# Brief - Ollama's OpenAI-compatible /v1/chat/completions: how tool calls arrive when stream is true (whole or index-keyed fragments)

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

## Intent

MoonAliza's OpenAI-compatible accumulator (`src/main/provider-stream.ts`, merged in PR #7)
must read tool calls streamed by Ollama's `/v1/chat/completions` as well as by OpenAI. The
streaming brief left that as its U-03. Done means knowing, from Ollama's own code, what one
streamed tool-call delta carries (`index`, `id`, `type`, `function.name`, whole or partial
`arguments`), which `finish_reason` ends a tool-call turn, and since which release, so the
accumulator either accepts it as written or gets a named, tested change.

## What we verified

| Claim | Source | Type |
|---|---|---|
| Ollama's openai/openai.go (main, retrieved 2026-09-29): every streamed tool call carries `id`, `type: "function"`, `function.name` and an `index` copied from the call, and its `arguments` are the whole argument object marshalled to one JSON string, not fragments. [quote: toolCalls[i].Index = tc.Function.Index] [quote: args, err := json.Marshal(tc.Function.Arguments)] The finish reason goes out on its own chunk with an empty delta, and `stop` becomes `tool_calls` once a tool call was sent; other done reasons pass through. [quote: if reason == "stop" && toolCallSent {] | E-03 `raw.githubusercontent.com` (U-01, U-02, U-03) | P |
| Ollama's tools/tools.go (main): the template-based tool-call parser keeps one counter per response and gives each parsed call the next index, so calls it parses are numbered 0, 1, 2 across chunks. [quote: Arguments: args, ... Index: p.n,] Models that use their own built-in parsers do not go through this parser; this page says nothing about them. | E-06 `raw.githubusercontent.com` (U-01) | P |
| PR #7888 "Enable index tracking for tools - openai api support" closed issue #7881 and merged as commit 5f80511 on 29-30 Nov 2024. A later comment reports the problem still seen on 0.15.4: two parallel calls arriving in separate deltas, both `index=0`, with different ids - one user's report, a lead, not proof. [quote: I still have the problem on version 0.15.4] The same comment shows each call's arguments whole in one delta (`arguments='{"sides":6}'`). [render-reviewed: the PR title, the merge of commit 5f80511 and the 0.15.4 comment with both deltas are present in the capture] | E-05 `github.com` (U-01, U-02, U-04) | P |
| Ollama's middleware/openai.go (main): the /v1 chat stream writer marks `toolCallSent` when any chunk carried tool calls, then writes the finish chunk; with `stream_options.include_usage` the usage rides on that finish chunk, not a separate chunk. [quote: w.toolCallSent = true] [quote: finishChunk.Usage = &u] | E-04 `raw.githubusercontent.com` (U-03) | P |
| Issue #7881 (opened 29 Nov 2024): Ollama's /v1 stream then sent tool calls without `index`, and its sample stream ended a tool-call turn with `finish_reason` `stop`, not `tool_calls`. [quote: does not populate the `.choices[].delta.tool_calls[].index` field] A maintainer answered that the fix was released in v0.4.7. [quote: just released - https://github.com/ollama/ollama/releases/tag/v0.4.7] | E-02 `github.com` (U-03, U-04) | S |

## Contradictions and how they were resolved

**Old behaviour against current code (E-02 against E-03, E-04).**
- The 2024 stream in issue #7881 sent tool calls without `index`, and ended the turn with
  `finish_reason: "stop"`.
- Current main sets `index` on every call, and sends `tool_calls` on a separate finish
  chunk.
- Both are true, at different versions. The fix shipped in v0.4.7 (E-02, E-05).
- A current Ollama therefore matches MoonAliza's contract. An older one fails loudly
  (`PROVIDER_INVALID_RESPONSE`) rather than being guessed at: see the Decision.

**Numbered calls against a user's report (E-06 against E-05).**
- Ollama's template-based parser numbers the calls in one response 0, 1, 2 (E-06).
- One comment on 0.15.4 shows two calls in separate deltas, both with `index=0` and with
  different ids (E-05).
- I trust the source for the path it covers. The report is plausible for models whose
  built-in parsers were not collected here.
- The decision treats a new `id` at an index already in use as a new call. That handles
  both cases without relying on either.

## Known unknowns

None. Every blocking unknown was closed with cited evidence.

## Decision

**Keep the index-keyed accumulator.** Add one rule to `OpenAIAccumulator` in MoonAliza's
`src/main/provider-stream.ts`:

- **The new rule:** a delta whose non-null `id` differs from the `id` of the call already
  at its `index` starts a new call.
- **Unchanged:** a delta with no `id` still extends the latest call at its index.
- **OpenAI is unaffected:** OpenAI sends `id` only on a call's first delta, and never
  reuses an index for a second call (streaming brief, E-07).
- **Ollama is covered either way:** whole calls with repeated `index=0` and distinct ids
  (E-05) become separate calls instead of rejecting the turn.
- **Today's behaviour, for contrast:** `PROVIDER_INVALID_RESPONSE`, which drops every
  parallel-call turn from such a model.

**Everything else Ollama `/v1` sends is already handled.**
- Whole `arguments` strings (E-03).
- `finish_reason: "tool_calls"` on its own chunk with an empty delta (E-03).
- Usage riding on that finish chunk (E-04).
- Extra fields the accumulator ignores: `reasoning` and `logprobs`.

**Out of scope:**
- **Ollama before v0.4.7.** It sends no `index` and ends with `stop`, and stays refused.
  The error is explicit, and the fix is two years old.
- **Reading `delta.reasoning` into thinking.** That is a separate feature.

**First build step:** a replay test of the E-05 shape. Two deltas each carry one whole call
with `index` 0 and ids `call_a` / `call_b`, then a finish chunk with `tool_calls` and usage.
Assert two calls in arrival order. Keep the existing identity-change test: same index,
different id, arriving as a fragment continuation. Its expectation changes only if it no
longer describes a fragment. Then make the change.

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "$HOME/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=82cde7970a9ac3f7 inputs=cf4fee3bc1e6790b gate=pass -->
