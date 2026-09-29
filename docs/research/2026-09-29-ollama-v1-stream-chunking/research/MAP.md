# MAP - topic decomposition

## Topic

Ollama's OpenAI-compatible /v1/chat/completions: how tool calls arrive when stream is true (whole or index-keyed fragments)

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02, U-03. Ollama is open source: its own code answers the chunk shape |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | a local Ollama takes no key; profile credentials are unchanged |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | a local runtime has no request quota |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | DISMISSED | no new use: the same local calls, read as they arrive |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-01, U-02, U-03. The chunk schema is the subject |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-04. The index fix dates from v0.4.7 (Nov 2024); the source read is main of 2026-09-29 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | local inference, no per-call price |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-04. Which Ollama the user runs decides what arrives; older builds are refused |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-03. Complete calls and a tool_calls terminal are what the accumulator needs, and both are sent |

## Coverage notes (per dimension)

_One short paragraph per row once it has a status: what was established, and what the
status rests on._

## Candidate material

Gathered 2026-09-29.

Likely owners of these facts (by how often a search pointed at them):

- `docs.ollama.com` (8)
- `docs.deepinfra.com` (4)
- `docs.rs` (4)
- `docs.laozhang.ai` (4)
- `developer.android.com` (4)
- `github.com` (3)

Candidate pages:

- [OpenAI compatibility - Ollama documentation](https://docs.ollama.com/api/openai-compatibility)
- [OpenAI-compatible API tool calls have no index · Issue #7881 - GitHub](https://github.com/ollama/ollama/issues/7881)
- [Has anyone managed to get a tool_call working when stream=True?](https://community.openai.com/t/has-anyone-managed-to-get-a-tool-call-working-when-stream-true/498867)
- [“OpenAI-compatible" is a spectrum, not a boolean 12 things that silently ...](https://discuss.huggingface.co/t/openai-compatible-is-a-spectrum-not-a-boolean-12-things-that-silently-break-when-you-swap-providers/179356)
- [Chat Completions - DeepInfra](https://docs.deepinfra.com/chat/overview)
- [Streaming](https://docs.ollama.com/api/streaming)
- [rig_core/providers/openai/responses_api/ streaming.rs](https://docs.rs/rig-core/latest/src/rig_core/providers/openai/responses_api/streaming.rs.html)
- [LLM documentation - Datasette](https://llm.datasette.io/_/downloads/en/stable/pdf/)
- [Ollama adds /v1/models and /v1/completions OpenAI compatible ...](https://www.reddit.com/r/LocalLLaMA/comments/1du4ddy/ollama_adds_v1models_and_v1completions_openai/)
- [claudish-to-english/README.md at main](https://github.com/gvzdv/claudish-to-english/blob/main/README.md)
- [How to Use Ollama Streaming Tool Calls for Real-Time AI ...](https://apidog.com/blog/ollama-streaming-responses-and-tool-calling/)
- [Finally Ollama has an OpenAI compatible API - YouTube](https://www.youtube.com/watch?v=38jlvmBdBrU)
- [grida/SECURITY.md at main](https://github.com/gridaco/grida/blob/main/SECURITY.md)
- [Agentic AI - MATLAB Central Discussions](https://it.mathworks.com/matlabcentral/discussions/ai.html)
- [Vulnerability Summary for the Week of August 31, 2026](https://www.cisa.gov/news-events/bulletins/sb26-250)
- [llm_firewall_1.md · John6666/forum3 at main](https://huggingface.co/datasets/John6666/forum3/blob/main/llm_firewall_1.md)
- [OpenClaw CLI Commands: The Complete Operator ...](https://onepagecode.substack.com/p/openclaw-cli-commands-the-complete)
- [OpenAI protocol: Chat Completions - LaoZhang API](https://docs.laozhang.ai/en/api-reference/chat-completions)
- [SERVICE Definition & Meaning](https://www.merriam-webster.com/dictionary/service)
- [Congressional Research Service Careers](https://www.loc.gov/offices/congressional-research-service-careers/)

Search failures - a map drafted from failed searches looks like a map of a quiet topic, so they are listed:

- `Ollama's OpenAI-compatible /v1/chat/completions: how tool calls arrive when stream is true (whole or index-keyed fragments)` on serpapi: SerpAPI did not answer within 30s - the request was abandoned; a retry may succeed - answered by the other provider

## Outlines seen in the material

The section headings of the gathered pages that are captured - what related material
covers, as its own tables of contents say (STORM's perspective step, without the model).
Not a verdict: a heading worth a subtopic becomes a row by your hand.

- [OpenAI-compatible API tool calls have no index · Issue #7881 - GitHub](https://github.com/ollama/ollama/issues/7881)
  - Description
  - What is the issue?
  - OS
  - GPU
  - CPU
  - Ollama version
  - Activity
  - gregnr commented on Nov 29, 2024on Nov 29, 2024
  - ParthSareen commented on Nov 29, 2024on Nov 29, 2024
  - ParthSareen commented on Dec 1, 2024on Dec 1, 2024
  - Metadata
  - Assignees
  - _and 7 more_

