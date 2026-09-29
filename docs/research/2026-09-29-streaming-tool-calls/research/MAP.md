# MAP - topic decomposition

## Topic

Streaming tool calls: how Ollama /api/chat and OpenAI-compatible Chat Completions deliver tool calls when stream is true

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02, U-03. Public API docs from each owner |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | credentials are MoonAliza profile concerns, unchanged by streaming |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | streaming changes delivery, not request counts |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | DISMISSED | no new use of either API - the same calls, streamed |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-01, U-02, U-03. The chunk schemas are the subject |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-01. Ollama streaming with tools dates from May 2025 (E-04); older Ollama builds lack it |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | streaming costs the same tokens as a non-streamed call |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-03. The one runtime behaviour not documented is named, with its check |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-02. Complete tool calls are obtainable from both streams |

## Coverage notes (per dimension)

_One short paragraph per row once it has a status: what was established, and what the
status rests on._

## Candidate material

Gathered 2026-09-29.

Likely owners of these facts (by how often a search pointed at them):

- `docs.ollama.com` (8)
- `github.com` (6)
- `nuget.org` (2)
- `ollama.com` (2)
- `onyx.dev` (2)
- `enterprisedna.co` (2)

Candidate pages:

- [nika-spec/stdlib/providers-v0.1.md at main](https://github.com/supernovae-st/nika-spec/blob/main/stdlib/providers-v0.1.md)
- [Help for function calls with streaming - API - OpenAI Developer Community](https://community.openai.com/t/help-for-function-calls-with-streaming/627170)
- [OpenAI 2.9.1](https://www.nuget.org/packages/OpenAI/2.9.1?_src=template)
- [Tool calling - Ollama documentation](https://docs.ollama.com/capabilities/tool-calling)
- [CkAi Dart Reference Documentation](https://www.chilkatsoft.com/refdoc/dart_AiRef.html)
- [Streaming responses with tool calling · Ollama Blog](https://ollama.com/blog/streaming-tool)
- [Adding Multi-Agent Orchestration to a Vercel AI SDK App](https://open-multi-agent.com/blog/multi-agent-vercel-ai-sdk/)
- [Ollama Tool Calling + Streaming Issue #12557 - GitHub](https://github.com/ollama/ollama/issues/12557)
- [Releasing Flama 2.0](https://flama.dev/blog/releasing_flama_2_0/)
- [“OpenAI-compatible" is a spectrum, not a boolean 12 things that silently ...](https://discuss.huggingface.co/t/openai-compatible-is-a-spectrum-not-a-boolean-12-things-that-silently-break-when-you-swap-providers/179356)
- [Streaming responses with tool calling · Ollama Blog](https://daily.dev/posts/streaming-responses-with-tool-calling-ollama-blog-c49wmqmsl)
- [Onyx AI Endpoint API](https://onyx.dev/documentation/api-documentation/ai-endpoint)
- [What is Ollama? | Jeff Bailey](https://jeffbailey.us/blog/2026/04/27/what-is-ollama/)
- [OpenAI compatibility - Ollama documentation](https://docs.ollama.com/api/openai-compatibility)
- [Does ollama API support function calling in streaming?](https://www.reddit.com/r/ollama/comments/1gb4428/does_ollama_api_support_function_calling_in/)
- [Tool support · Ollama Blog](https://ollama.com/blog/tool-support)
- [Native integration with Atomic Chat (local OpenAI ...](https://github.com/Trae-AI/TRAE/issues/2531)
- [Is streaming of new "custom" tool calls supported using Chat Completions?](https://github.com/openai/openai-python/discussions/2550)
- [ivo-toby/talon: Talon is a secure, flexible, ...](https://github.com/ivo-toby/talon)
- [OpenAI 2.13.0](https://www.nuget.org/packages/OpenAI/AbsoluteLatest)

## Outlines seen in the material

The section headings of the gathered pages that are captured - what related material
covers, as its own tables of contents say (STORM's perspective step, without the model).
Not a verdict: a heading worth a subtopic becomes a row by your hand.

- [nika-spec/stdlib/providers-v0.1.md at main](https://github.com/supernovae-st/nika-spec/blob/main/stdlib/providers-v0.1.md)
  - Collapse file tree
  - Files
  - File metadata and controls
  - Model selection · ONE field · model: <provider>/<name>
  - The 17 canonical providers
  - The three lists · three laws (why 17 · why the catalog knows more · why MCP never closes)
  - Registration policy · how the 17 grows (the post-freeze door)
  - Local vs cloud · the prefix decides
  - Transport deadline · the task timeout: governs the provider call
  - The openai escape hatch · any OpenAI-compatible server
  - Provider config lives OUTSIDE the workflow
  - Common contract · all providers
  - _and 20 more_
- [Help for function calls with streaming - API - OpenAI Developer Community](https://community.openai.com/t/help-for-function-calls-with-streaming/627170)
  - post by antmannacho on Feb 14, 2024
  - post by \j on Feb 14, 2024
  - post by antmannacho on Feb 15, 2024
  - post by supershaneski on Feb 15, 2024
  - post by \j on Feb 15, 2024
  - post by Terrya on Feb 23, 2024
  - post by mugiwara90 on Apr 5, 2024
  - post by zjh2510280010 on May 20, 2024
  - post by gokturkbuyuktuna00 on Jul 13, 2024
  - post by ma\gm on Feb 10, 2025
  - Related topics

