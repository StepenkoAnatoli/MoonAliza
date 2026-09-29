# Sources

Every page this project has fetched, and what it was used for. `P` primary/official
carries the design, `S` secondary is context, `L` lead-only is a hint and never proof.

| URL | Type | Title | Retrieved | Used for |
|---|---|---|---|---|
| https://github.com/jetelain/OllamaRouter | S | GitHub - jetelain/OllamaRouter: A smart reverse proxy for Ollama: routes requests to your fast local GPU or a big remote server, overflows to ollama.com cloud when both are busy, and lets you monitor and pause any target from a built-in page. · GitHub | 2026-09-29 | phase 0: Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window |
| https://github.com/continuedev/continue/issues/9797 | S | Context window not reset between prompts → 400 “request exceeds available context size” with local llama-server · Issue #9797 · continuedev/continue | 2026-09-29 | phase 0: Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window |
| https://github.com/open-webui/computer/blob/main/CHANGELOG.md | S | computer/CHANGELOG.md at main · open-webui/computer · GitHub | 2026-09-29 | phase 0: Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window |
| https://docs.openwebui.com/troubleshooting/context-window/ | S | Context Window / Prompt Too Long / Open WebUI | 2026-09-29 | phase 0: Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window |
| https://community.openai.com/t/context-limit-token-issue-in-openai-chatcompletion-create-api-call/901481 | S | Context Limit Token Issue in openai.ChatCompletion.create API Call - API - OpenAI Developer Community | 2026-09-29 | phase 0: Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window |
| https://docs.ollama.com/api/openai-compatibility | S | OpenAI compatibility - Ollama | 2026-09-29 | phase 0: Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window |
| https://community.openai.com/t/seem-to-be-unable-to-reach-context-limit-in-my-api-request/823010 | S | Seem to be unable to reach context limit in my API request - API - OpenAI Developer Community | 2026-09-29 | phase 0: Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window |
| https://docs.ollama.com/api/chat | P | Generate a chat message - Ollama | 2026-09-29 | U-01: the truncate parameter and its default on /api/chat |
| https://raw.githubusercontent.com/ollama/ollama/main/server/prompt.go | P | prompt-go | 2026-09-29 | U-01, U-04: how the chat prompt is fitted to num_ctx |
| https://raw.githubusercontent.com/ollama/ollama/main/openai/openai.go | P | openai-go | 2026-09-29 | U-02: what the /v1 request converter sets for truncate |
| https://platform.openai.com/docs/guides/error-codes | P | Error codes \| OpenAI API | 2026-09-29 | U-03: the error OpenAI returns for an over-window request |
| https://raw.githubusercontent.com/ollama/ollama/main/api/types.go | P | types-go | 2026-09-29 | U-01: the ChatRequest truncate/shift fields and what their absence means |
| https://raw.githubusercontent.com/ollama/ollama/main/server/routes.go | P | routes-go | 2026-09-29 | U-01, U-02: the default truncate applies, and the error when a prompt does not fit |
| https://raw.githubusercontent.com/ollama/ollama/main/llm/server.go | P | server-go | 2026-09-29 | U-01: the error a chat completion returns when truncate is false and the prompt does not fit |
