# MAP - topic decomposition

## Topic

Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02, U-03. Ollama is open source; OpenAI documents its errors |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | credentials are unchanged by how an overflow is reported |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | an overflow is refused per request; no quota is involved |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | DISMISSED | no new use of either API |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-03, U-05. The error shape is the schema in question |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-01, U-02. Read from Ollama main of 2026-09-29; defaults can change, so the fix sends the fields explicitly |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | a refused request costs nothing more; truncation costs history, covered by U-01 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-01, U-02, U-04. What each runtime path does with a request that does not fit |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-03. Whether an overflow can be told apart is exactly what was asked |

## Coverage notes (per dimension)

_One short paragraph per row once it has a status: what was established, and what the
status rests on._

## Candidate material

Gathered 2026-09-29.

Likely owners of these facts (by how often a search pointed at them):

- `docs.openwebui.com` (4)
- `community.openai.com` (4)
- `docs.ollama.com` (4)
- `reddit.com` (2)
- `bluegrid.io` (2)
- `sparkco.ai` (2)

Candidate pages:

- [OllamaRouter](https://github.com/jetelain/OllamaRouter)
- [When the context window is exceeded, what happens to the data fed into ...](https://www.reddit.com/r/ollama/comments/1j0pls3/when_the_context_window_is_exceeded_what_happens/)
- [Context Compaction in Open WebUI (filter, tested with ...](https://www.reddit.com/r/OpenWebUI/comments/1wekouv/context_compaction_in_open_webui_filter_tested/)
- [Context Window / Prompt Too Long / Open WebUI](https://docs.openwebui.com/troubleshooting/context-window/)
- [Ollama REST API](https://bluegrid.io/glossary/software-development/ollama-rest-api/)
- [Context window not reset between prompts → 400 “request exceeds ...](https://github.com/continuedev/continue/issues/9797)
- [Understanding Context Size in AI Application Development ...](https://medium.com/@hermannsamimi/understanding-context-size-in-ai-application-development-with-llms-in-ollama-b768b36f5492)
- [Context Limit Token Issue in openai.ChatCompletion.create API ...](https://community.openai.com/t/context-limit-token-issue-in-openai-chatcompletion-create-api-call/901481)
- [Ollama Context Length: Default Settings and How to Modify It](https://deepai.tn/glossary/ollama/ollama-context-length/)
- [Ollama ROCm on Strix Halo returns prior answers after context overflow](https://freenode.net/article/ollama-rocm-on-strix-halo-returns-prior-answers-after-context-overflow)
- [CHANGELOG.md - open-webui/computer](https://github.com/open-webui/computer/blob/main/CHANGELOG.md)
- [🏗️ Building High-Quality AI Agents 🤖 — A Comprehensive ...](https://dev.to/truongpx396/building-high-quality-ai-agents-a-comprehensive-actionable-field-guide-5m1)
- [OpenAI compatibility - Ollama documentation](https://docs.ollama.com/api/openai-compatibility)
- [GitHub Copilot + Ollama 2026 — Local Agentic LLMs in VS ...](https://pooyagolchian.com/blog/github-copilot-ollama-agentic-local-llm-2026/)
- [Ollama context overflow errors not detected by auto-compaction #2626](https://github.com/earendil-works/pi/issues/2626)
- [Build a RAG Chatbot: Complete Step-by-Step Guide](https://aiagentskit.com/blog/build-rag-chatbot-tutorial/)
- [Llama.cpp on Windows 11 with Qwen 3.5: A Practical Local AI ...](https://developersvoice.com/blog/ai-development/llamacpp-qwen35-claude-code-windows-guide/)
- [LoLLMs Client Library](https://pypi.org/project/lollms-client/)
- [Building a ChatGPT Clone with Laravel and Vue: 2026 Guide](https://khimananda.com/blog/building-a-chatgpt-clone-with-laravel-and-vue)
- [Questions about context size · Issue #2204 - GitHub](https://github.com/ollama/ollama/issues/2204)

## Outlines seen in the material

The section headings of the gathered pages that are captured - what related material
covers, as its own tables of contents say (STORM's perspective step, without the model).
Not a verdict: a heading worth a subtopic becomes a row by your hand.

- [OllamaRouter](https://github.com/jetelain/OllamaRouter)
  - How it works
  - Endpoints that are inspected and routed dynamically
  - Cloud overflow
  - Target failover on consecutive errors
  - Other endpoints
  - Setup Ollama instances
  - Local Ollama
  - Remote Ollama
  - Configuration
  - Token estimation overhead recommendations
  - Inference request recording (optional)
  - Installation
  - _and 12 more_
- [Context Window / Prompt Too Long / Open WebUI](https://docs.openwebui.com/troubleshooting/context-window/)
  - What you're seeing
  - Why it happens
  - Why Open WebUI doesn't auto-truncate for you
  - The built-in option: Context Compaction
  - How it works
  - The supported way: use a filter Function
  - Minimal example: "newest N turns" filter
  - Slightly more involved: per-model token budget
  - You almost certainly want a community filter, not this one
  - What users will experience
  - Related
- [Context window not reset between prompts → 400 “request exceeds ...](https://github.com/continuedev/continue/issues/9797)
  - Description
  - Error Details
  - Error Output
  - Server Configuration
  - Observed Behavior
  - Reproduction Steps
  - Prompt 1 (works)
  - Prompt 2 (fails)
  - Additional Notes
  - Activity
  - sestinj commented on Jan 22on Jan 22, 2026
  - girls-whocode commented on Jan 22on Jan 22, 2026
  - _and 16 more_
- [CHANGELOG.md - open-webui/computer](https://github.com/open-webui/computer/blob/main/CHANGELOG.md)
  - \[0.9.21\] - 2026-08-04
  - Added
  - Changed
  - Fixed
  - \[0.9.20\] - 2026-08-01
  - \[0.9.19\] - 2026-07-31
  - \[0.9.18\] - 2026-07-31
  - \[0.9.17\] - 2026-07-31
  - \[0.9.16\] - 2026-07-31
  - \[0.9.15\] - 2026-07-23
  - \[0.9.14\] - 2026-07-23
  - \[0.9.13\] - 2026-07-23
  - _and 72 more_
- [OpenAI compatibility - Ollama documentation](https://docs.ollama.com/api/openai-compatibility)
  - Direct cloud access
  - Local server usage
  - Simple /v1/chat/completions example
  - Simple /v1/responses example
  - /v1/chat/completions with vision example
  - Endpoints
  - /v1/chat/completions
  - /v1/completions
  - /v1/models
  - /v1/models/{model}
  - /v1/embeddings
  - Responses API
  - _and 3 more_

