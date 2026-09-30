# Sources

Every page this project has fetched, and what it was used for. `P` primary/official
carries the design, `S` secondary is context, `L` lead-only is a hint and never proof.

| URL | Type | Title | Retrieved | Used for |
|---|---|---|---|---|
| https://docs.rs/rig-core/latest/src/rig_core/providers/openai/responses_api/streaming.rs.html | S | streaming.rs - source | 2026-09-29 | phase 0: Ollama's OpenAI-compatible /v1/chat/completions: how tool calls arrive when stream is true (whole or index-keyed fragments) |
| https://github.com/ollama/ollama/issues/7881 | S | OpenAI-compatible API tool calls have no index · Issue #7881 · ollama/ollama | 2026-09-29 | phase 0: Ollama's OpenAI-compatible /v1/chat/completions: how tool calls arrive when stream is true (whole or index-keyed fragments) |
| https://raw.githubusercontent.com/ollama/ollama/main/openai/openai.go | P | openai-go | 2026-09-29 | U-01, U-02, U-03: how a ChatResponse becomes a chat.completion.chunk (tool calls, finish_reason) |
| https://raw.githubusercontent.com/ollama/ollama/main/middleware/openai.go | P | openai-go | 2026-09-29 | U-02: how the /v1 stream writer emits each chunk |
| https://github.com/ollama/ollama/pull/7888 | P | Enable index tracking for tools - openai api support by ParthSareen · Pull Request #7888 · ollama/ollama | 2026-09-29 | U-04: the change that closed issue #7881 (tool calls without index) |
| https://raw.githubusercontent.com/ollama/ollama/main/tools/tools.go | P | tools-go | 2026-09-29 | U-01: where a streamed call's Function.Index is assigned, across chunks |
