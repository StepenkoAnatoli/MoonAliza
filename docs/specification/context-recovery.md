# Context, privacy and result recovery

## User behavior

A cloud profile selected for a local-only project disables Send and the Ctrl+Enter path before a session or run is created. The notice identifies the selected host and offers privacy review. The dialog explains that future selected cloud profiles may receive prompts, selected files and tool results. Cancelling preserves policy and draft. Confirming updates the expected project-policy revision and preserves the draft without sending. Main and engine still independently enforce live policy and trust.

Model profiles can be edited with the current immutable revision as a precondition. Leaving the credential blank preserves it only at the same endpoint/provider kind. Changing either requires a newly supplied credential or an explicit clear request; main enforces this even if the renderer is bypassed. Context settings apply to future runs; increasing a configured limit does not increase the provider's actual capacity.

The context disclosure displays an estimate, response reserve, omitted history messages and compacted tool-result count. Provider-reported input/output usage is a separate observation for the named step, not a cumulative run total. Missing, fractional, negative or malformed usage remains unknown. Context, usage and the latest run failure survive restart through existing durable events.

If an irreducible request or a provider rejects the context budget, the failure offers profile settings and a fresh conversation with the last request prepared as a draft. Neither action retries inference or commands automatically. Previously applied edits remain applied; the original conversation and Changes/Undo remain available.

## Assembly and retrieval

`src/engine/context.ts` estimates serialized UTF-8 message/declaration bytes divided by two, plus 256 framing tokens and eight per message. The configured response allowance is reserved inside the configured context window. This is deliberately labeled a heuristic, not an exact tokenizer or a universal upper bound. Different model families and chat templates can still reject a request; a validated context error code or bounded overflow refusal becomes a sanitized actionable failure.

Historical plain user/assistant messages are grouped into complete turns and removed oldest-first when needed. Intermediate tool-call narration and partial assistant outputs are excluded from this historical projection. The original durable history is never edited. Current tool exchanges retain all call IDs, arguments and matching results, including multi-call responses. Current prompts, tool arguments and system instructions are never silently discarded. The IPC message-count limit is also enforced before inference.

Tool results are stored in full before context compaction. Bodies over 3,072 UTF-8 bytes become JSON envelopes containing a stable message ID, a bounded preview, tool identity, original character length and selected outcome facts. If needed, previews are removed oldest-first. Status, exit code, timeout, cancellation, applied-write and truncation facts remain when present. Unknown command outcomes still terminate the run before another inference step.

The model can call `read_tool_result` with `resultId`, UTF-16 `offset` and `length` (1–2,048; default 1,024). Results are looked up by both message ID and current session ID. A missing/foreign ID returns a bounded failure without revealing the other conversation. Retrieval reads saved observations and never executes the source tool again. Reads use the same per-tool live trust/policy/cancellation fence and durable operation events. Under dense Unicode or a very small budget, smaller retrieval pages may be necessary; result bodies remain subject to the same compaction rules. Tool outputs remain untrusted data.

No database migration is required. Existing messages store original outputs, and events store the new strict `context.updated` and optional `usage.updated` payloads. A session snapshot reports only telemetry/failure from its newest run. New runs do not inherit a preceding run's error state. All old records lacking this telemetry return null values.

## Evidence and remaining work

Primary response/accounting evidence is in [the research brief](../../research/BRIEF.md). The [stage plan](../superpowers/plans/2026-09-28-context-recovery.md) records implementation and validation; [the release record](../releases/0.6.0-dev.1.md) records delivery checks. Regressions cover the original overflow, Unicode estimates, complete-turn eviction, command-failure facts, stored originals, conversation isolation, policy admission, actual/unknown usage, profile revision editing and actual Electron restart/recovery.

This stage does not implement semantic summarization, exact model tokenizers or calibrated estimates, live display of streamed text, provider-native continuation for other provider families, global conversation-storage quotas or automatic retry. It does not qualify a managed local model. Genuine signed catalogue/lab/machine inputs, production activation integration and the remaining full product roadmap still apply.

The reconciled provider transport streams native NDJSON and compatible SSE, including terminal token counts. Native Ollama always sets `truncate: false` and `shift: false`. Its compatible `/v1` endpoint cannot enforce these flags; profile setup recommends the native kind. Responses still reach the renderer after complete-response redaction. See the [September 30 research review](research-kit-integration-review.md) for the new findings and remaining stages.
