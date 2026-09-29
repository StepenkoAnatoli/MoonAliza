# Discovery Contract - Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window

Started 2026-09-29. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

MoonAliza's context handling (Stage C: "explicit context failure", "accurate context
accounting"). Today the engine estimates 2 characters per token, drops the oldest history,
and raises `CONTEXT_LIMIT` only when the current run alone does not fit
(`src/engine/application.ts`). Anything the estimate misses reaches the provider. Done means
knowing, per provider path MoonAliza supports (native Ollama, Ollama `/v1`,
OpenAI-compatible), what happens to a request larger than the model's window: is it
refused, and with what status and text, or silently truncated? And does the reserved
output count against the window? With that, an overflow can reach the user as
`CONTEXT_LIMIT` rather than `PROVIDER_HTTP_400`, and nothing is dropped unseen.

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
| U-01 | Native Ollama `/api/chat`: when the prompt exceeds `num_ctx`, what happens with `truncate: false`, and what is the default when `truncate` is not sent? | MoonAliza's managed path sends `truncate: false`; a user's own Ollama profile sends nothing, so a truncating default would drop history silently | CLOSED | E-13: absent means true (and `shift` likewise); E-09: truncation drops whole messages from the front, keeping system and last; E-12: `shift: false` errors instead of shifting. E-08: neither field is in the reference |
| U-02 | Ollama `/v1/chat/completions`: can the request refuse truncation, or does Ollama truncate what does not fit? | Decides whether that path can promise "nothing dropped unseen" at all | CLOSED | E-10: the /v1 converter sets neither field, so the E-13 defaults apply - it truncates, and a client cannot refuse; E-06: the page offers no way either |
| U-03 | OpenAI Chat Completions: what status and error shape does an over-window request get? | MoonAliza maps HTTP errors to `PROVIDER_HTTP_<status>`; mapping overflow to `CONTEXT_LIMIT` needs a signal that says so | CLOSED | E-11: a 400 BadRequestError with no documented code - only the message; E-04, E-02: other OpenAI-compatible servers word it differently. No portable signal exists |
| U-04 | Does the reserved output (`max_completion_tokens` / `num_predict`) count against the window check? | Sets whether MoonAliza's budget `contextTokens - outputTokens` matches what the provider enforces | KNOWN-UNKNOWN | Known so far: Ollama's admission check compares the prompt alone with num_ctx (E-09); OpenAI documents nothing (E-11). MoonAliza's budget reserves the output either way, which is safe. Day-one verification: send an OpenAI request whose input fits but input + max_completion_tokens does not, and record whether it is refused |
| U-05 | Native Ollama with `truncate: false`: what status and text come back when the prompt does not fit? | The signal MoonAliza would map to `CONTEXT_LIMIT` on its managed path | KNOWN-UNKNOWN | Known so far: the refusal is raised in Ollama's runner, not in the files collected (E-14). Day-one verification: against a local Ollama, POST /api/chat with truncate false, shift false and a prompt over num_ctx, and record the status and body |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

- The hybrid accounting of `docs/research/2026-09-28-open-gaps` stands: estimate before sending, record the provider's exact input count after, calibrate. This project covers what happens when the estimate is wrong.

Locked decisions for this project. Do not revisit these without the human.
