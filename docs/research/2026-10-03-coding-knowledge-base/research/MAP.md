# MAP - topic decomposition

## Topic

A local coding knowledge base for MoonAliza's agents: which language and platform documentation (Python, Node.js, Java, the web platform) may be stored offline and redistributed, in what packaging, how the version a project uses is chosen, and how agent-oriented documentation formats (llms.txt, Context7) work

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-09 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | COVERED | U-07 |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | documentation sets are static files fetched once per version; the one rate-limited service (Context7) is covered under U-07 |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-02, U-03, U-04, U-05 |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-01, U-06 |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-09 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | COVERED | U-09 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-08, U-09 |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-09 |

## Coverage notes (per dimension)

_One short paragraph per row once it has a status: what was established, and what the
status rests on._

## Candidate material

Gathered 2026-10-03.

Likely owners of these facts (by how often a search pointed at them):

- `llmconfigurator.com` (1)
- `github.com/chrisbraddock` (1)
- `promptquorum.com` (1)
- `github.com/quotentiroler` (1)
- `github.com/fff2832` (1)
- `ai-infrastructure.net` (1)

Candidate pages:

- [How to Run a Local AI Coding Agent (2026): Ollama + VS Code Setup | LLM ...](https://llmconfigurator.com/en/guides/coding-agents/setup-local-coding-agent)
- [GitHub - chrisbraddock/bluera-knowledge: Local knowledge search for AI ...](https://github.com/chrisbraddock/bluera-knowledge/tree/main)
- [Best Local LLM Stack 2026: Coding, RAG, Writing & Agents](https://www.promptquorum.com/local-llms/best-local-llm-stack-use-case)
- [GitHub - quotentiroler/bluera-knowledge: Local knowledge search for AI ...](https://github.com/quotentiroler/bluera-knowledge)
- [Local-Coding-Agent - GitHub](https://github.com/FFF2832/Local-Coding-Agent)
- [Running Local Coding Agents - AI Infrastructure Knowledge Base](https://ai-infrastructure.net/local-coding-agents/)
- [How to Build a Fully Local Coding Agent: Best Practice… | BestHub](https://www.besthub.dev/articles/how-to-build-a-fully-local-coding-agent-best-practices-and-benchmarks-c6c588253f88)
- [Local LLMs as Daily Knowledge Bases: Real-World Setups Beyond Coding](https://dasroot.net/posts/2026/05/local-llm-knowledge-bases-real-world-setups/)
- [Graphify — Knowledge Graphs for AI Coding Assistants](https://graphify.net/)
- [How to Build a Local AI Knowledge Base You Actually Own](https://www.modemguides.com/blogs/ai-infrastructure/local-ai-knowledge-base-setup-guide)
- [codebase-memory-mcp — Code Intelligence Knowledge Graph for AI Coding ...](https://deusdata.github.io/codebase-memory-mcp/)
- [How to Build a Knowledge Base for AI Agents: 2026 Guide](https://atlan.com/know/ai-agent/data-for-ai/how-to-build-knowledge-base-for-ai-agents/)
- [Local Agentic Coding Workflow 2026: The Full Guide [Tested]](https://www.kunalganglani.com/blog/local-agentic-coding-workflow-2026)
- [CodeGraph Setup: Local Code Knowledge Graph for AI Agents](https://knightli.com/en/2026/05/23/codegraph-local-code-knowledge-graph-ai-coding-agent/)

Search failures - a map drafted from failed searches looks like a map of a quiet topic, so they are listed:

- `which language and platform documentation (Python` on http-keyless: DuckDuckGo served its bot check instead of results - the keyless search was refused from this network; retry later, or use a keyed search provider
- `A local coding knowledge base for MoonAliza's agents Node.js` on http-keyless: DuckDuckGo served its bot check instead of results - the keyless search was refused from this network; retry later, or use a keyed search provider
- `in what packaging` on http-keyless: fetch failed (Connect Timeout Error (attempted address: lite.duckduckgo.com:443, timeout: 10000ms))
- `how the version a project uses is chosen` on http-keyless: DuckDuckGo served its bot check instead of results - the keyless search was refused from this network; retry later, or use a keyed search provider

## Outlines seen in the material

_No outlines - none of these pages is captured yet. `--max-scrapes <n>` captures the first n; their headings appear here._

