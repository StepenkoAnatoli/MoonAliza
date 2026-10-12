# Requirements: More models, Phase 1

Task statement: the More models task (RUN.md), Phase 1 as set in `docs/specification/more-models.md`
and MANDATE.md decision 2. User, 2026-10-11: "you have full access. continue".

| ID | Requirement | Source |
|----|-------------|--------|
| F-1 | `readSse` skips comment lines (`:` first), keeps `event:` names with their data, ignores `id:` and `retry:`; existing callers keep receiving the parsed data | wire E-25, E-10, E-33; wire design point 3 |
| F-2 | On the OpenAI-shaped path an error chunk (top-level `error`) or a `finish_reason` of `error`, `insufficient_system_resource` or `aborted` fails the call; no answer is saved | wire E-25, E-22, E-20 |
| F-3 | An unknown `finish_reason` fails the call; `model_length` maps to incomplete; `length` stays incomplete; `stop`, `tool_calls`, `content_filter`, refusal keep their outcomes | wire E-22; design point 3 |
| F-4 | A repeated identical terminal `finish_reason` (OpenRouter's usage chunk) is accepted; a changed one fails | wire E-25 |
| F-5 | Under an effective local-only policy, an `ollama` profile's inference proceeds only after `GET <endpoint>/api/status` answers 200 with `cloud.disabled === true`; every other answer, a timeout, an oversized or non-JSON body, or a redirect refuses with `LOCAL_MODEL_UNVERIFIED` before any chat request | wire E-28, E-30, E-31; design point 8 |
| F-6 | The check runs before every inference step; under cloud-allowed no status request is made; the managed runtime path is unchanged | design point 8; `src/models/managed-ollama.ts` |
| F-7 | `LOCAL_MODEL_UNVERIFIED` is a public error code and an internal `inference.error` code, passed through by `inferenceErrorCode`, and the engine shows the actionable message from the spec, no retry | spec, Phase 1 design 2 |
| S-1 | The status request uses the local network session, carries no credential and no prompt byte, and follows no redirect | AGENTS.md invariants; spec |
| T-1 | Every new test is shown red with its guard removed; fixtures are copied from the captures, not invented | lead-orchestrator; wire brief, first build step |
| A-1 | Pinned Linux gate equals the baseline; Windows CI green on the merged head | AGENTS.md merge rule |
| D-1 | ARCHITECTURE.md, the spec's "as built" notes and AGENTS.md (a locality invariant row) current in the same pull request | AGENTS.md, standing protocol rule 1 |
