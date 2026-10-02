# MAP - topic decomposition

## Topic

Which free and paid LLM models an agent app can use through an API or locally, what each costs per million tokens today, and how each ranks on coding and writing benchmarks

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | COVERED | U-02, U-06 |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | COVERED | U-06 |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-05 |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | DISMISSED | no data schema is consumed here: the pages are read by a person into a table, and the API shapes MoonAliza calls are closed in the sibling projects (streaming-tool-calls, ollama-v1-stream-chunking) |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-07 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | COVERED | U-01 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-08 |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-03, U-04 |

## Coverage notes (per dimension)

- D-1, D-2, D-3: a paid model is an API behind a key with tiered rate limits; a free one is a
  vendor's free tier (an account, a low limit) or an open-weight model run locally (no key,
  no limit but hardware). U-01, U-02, U-06.
- D-4: U-05 reads the vendors' terms and the open-weight licences.
- D-6: U-07 - the pages carry update dates, and the brief is dated.
- D-7: U-01 at a stated monthly volume (the one intent question).
- D-8: U-08, the memory a local model needs.
- D-9: U-03 and U-04 - the leaderboards are public pages; whether they render through the
  transport is what the collection shows.
- D-5: dismissed with the reason in the row.

## Candidate material

Gathered 2026-10-02.

Likely owners of these facts (by how often a search pointed at them):

- `reddit.com` (3)
- `developers.openai.com` (2)
- `app.stationx.net` (2)
- `tensorzero.com` (2)
- `silicondata.com` (2)
- `iternal.ai` (2)

Candidate pages:

- [Curated 550+ free LLM tools for builders (APIs, local models, RAG ...](https://www.reddit.com/r/LocalLLaMA/comments/1sigg35/curated_550_free_llm_tools_for_builders_apis/)
- [What do you think the cost per million tokens will be in a few years from ...](https://www.reddit.com/r/LocalLLM/comments/1tja697/what_do_you_think_the_cost_per_million_tokens/)
- [Why are almost all new benchmarks and leaderboards coding focused?](https://www.reddit.com/r/LocalLLaMA/comments/1vd2yk9/why_are_almost_all_new_benchmarks_and/)
- [mnfst/awesome-free-llm-apis - GitHub](https://github.com/mnfst/awesome-free-llm-apis)
- [LLM pricing calculator](https://www.llm-prices.com/)
- [Best LLM for Coding 2026 | AI Coding Model Rankings & Benchmarks](https://onyx.app/best-llm-for-coding)
- [Free LLM APIs Compared: Rate Limits, Models, and Real Costs (2026)](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/)
- [Pricing | OpenAI API](https://developers.openai.com/api/docs/pricing)
- [LiveBench](https://livebench.ai/)
- [Free LLM API: Run 120+ AI Models for $0 in 2026](https://app.stationx.net/articles/free-llm-api)
- [Stop comparing price per million tokens: the hidden LLM API costs](https://www.tensorzero.com/blog/stop-comparing-price-per-million-tokens-the-hidden-llm-api-costs/)
- [Hemingway-bench: The AI Writing Leaderboard Judged by Expert ...](https://surgehq.ai/blog/hemingway-bench-ai-writing-leaderboard)
- [4 Free Methods to use LLM APIs in Development - YouTube](https://www.youtube.com/watch?v=87HrBpOZeUE)
- [OpenAI API Pricing per 1M Tokens (2026): All Models Compared](https://www.silicondata.com/use-cases/openai-api-pricing-per-1m-tokens)
- [AI & LLM Benchmarks 2026: Rankings, Scores & Results - LLM Stats](https://llm-stats.com/benchmarks)
- [You can build AI apps and agents without paying any LLM costs.](https://www.linkedin.com/posts/satyam-agarwal_you-can-build-ai-apps-and-agents-without-activity-7356930434238214147-jfvJ)
- [AI Token Cost 2026: LLM API Pricing Calculator Per 1M Tokens](https://iternal.ai/llm-pricing-calculator)
- [Most AI benchmarks test coding or creative writing. Businesses need ...](https://www.facebook.com/authorityhacker/videos/benchmarks-are-measuring-the-wrong-thing/1009982158733408/)
- [AnythingLLM — On-device AI for productivity | Local & Private](https://anythingllm.com/)
- [Inference Unit Economics: The True Cost Per Million Tokens | Introl Blog](https://introl.com/blog/inference-unit-economics-true-cost-per-million-tokens-guide)

## Outlines seen in the material

_No outlines - none of these pages is captured yet. `--max-scrapes <n>` captures the first n; their headings appear here._

