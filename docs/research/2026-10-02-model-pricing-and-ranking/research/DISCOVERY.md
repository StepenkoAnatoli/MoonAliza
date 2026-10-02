# Discovery Contract - Which free and paid LLM models an agent app can use through an API or locally, what each costs per million tokens today, and how each ranks on coding and writing benchmarks

Started 2026-10-02. This file is the definition of "enough information to build".
`node "/root/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

A model-choice table for MoonAliza, the agent app: which LLMs it can use, free (an open-weight
model run locally through Ollama, or a vendor's free API tier) or paid (a vendor API), what
each costs per million input and output tokens on the day of collection, and where each
ranks on coding and on writing by published leaderboards - so a reader can say "for this
price you get this, best at that". Prices and rankings move monthly; every row carries its
retrieval date, and the brief says what to re-check before relying on a number. Done means a
dated table with a cost column at a stated monthly volume, a coding rank, a writing rank, the
licence or terms that allow use in a product, and the runtime a free model needs.

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
| U-01 | What do the main paid APIs charge per million input and output tokens today - Anthropic, OpenAI, Google Gemini, DeepSeek, Mistral - and which models are on offer? | The cost column is the decision; a price from memory is a guess that changes monthly. | CLOSED | E-01, E-02, E-03, E-04, E-05: per-million prices on 2026-10-02 - Anthropic Fable 5.1 $10/$50, Opus 5.5 $4/$20, Sonnet 5.5 $2/$10; OpenAI gpt-6-astra $10/$50, gpt-6.1-sol $2/$10, gpt-6-luna $0.10/$0.50; Gemini 3.8 Flash $0.75/$3.75 (steps up 2027-01-01); DeepSeek flash $0.15/$0.60 and pro $0.66/$1.98 off-peak; Mistral Large $0.5/$1.5. |
| U-02 | Which models are free: vendor free tiers (with their conditions) and open-weight models that run locally through Ollama? | "Free" decides whether a tier of MoonAliza can run at zero marginal cost. | CLOSED | E-03, E-07, E-08, E-13: Gemini Flash models are free on the free tier; 13 platforms offer free API tiers at demo-grade limits (E-08); every model on the Ollama library runs locally for free (E-07), the strongest open-weight ones under MIT or Apache 2.0 (E-13). |
| U-03 | Which models lead on coding, by a published leaderboard (SWE-bench, Aider, LiveBench), and by how much? | The "best at coding" column. | CLOSED | E-09, E-18 (E-10 and E-19 as the record of a stale and an unreadable leaderboard): LiveBench coding - Claude 5.5 Opus Thinking 89.3, Fable 5.1 86.4, DeepSeek V4.1 Flash 80.0 at a fortieth of the cost; SWE-bench Verified - Claude Opus 5 97.0% (independent), Mythos 5 95.5%, Fable 5 95.0%, GPT-5.6 Sol 82.2%, Gemini 3.1 Pro 80.6%. |
| U-04 | Which models lead on writing, by a published leaderboard (Hemingway-bench, EQ-Bench creative writing)? | The "best at writing" column. | CLOSED | E-12 (E-11 for an older, human-judged view): EQ-Bench Creative Writing v3 Elo - gpt-6-astra 2173, claude-fable-5-1 2162, claude-opus-5 2133, gpt-6-sol 2125, kimi-k3 2082 (open), GLM-5.3 2075 (open); Hemingway-bench, human-judged on the previous generation, put Gemini 3 Flash, Gemini 3 Pro and Claude Opus 4.5 first. |
| U-05 | Under what terms may each model's output be used in a product - the vendors' usage terms, and the open-weight licences (Llama, Qwen, DeepSeek, Gemma)? | A licence that forbids the use ends the row; Llama's community licence has conditions, others are Apache-2.0 or MIT. | CLOSED | E-14, E-16, E-17 (E-15 the record of the walled owner page): Apache 2.0 (Qwen, Mistral Small, GPT-oss) and MIT (DeepSeek, GLM) are approve-once; Llama and Gemma are community licences with an acceptable-use policy, attribution, and for Llama a 700 million monthly-active-user threshold. Vendor APIs are used under their commercial terms (not re-read here). |
| U-06 | What rate limits and tiers bind the paid and free APIs? | A free tier with 15 requests a minute is a demo, not a product; the cadence MoonAliza can sustain is set here. | CLOSED | E-06, E-08: Gemini limits are per project in tiers (Free with no spend cap, Tier 1 $10 per 10 minutes after a billing account, Tier 2 $50, Tier 3 $200); the free tiers across providers run at 5-30 requests a minute and 20-1,500 a day (E-08). |
| U-07 | How fast do prices and leaderboards move - when was each page last updated, and what does the vendor say about price changes? | Decides how the table is dated and how often it must be re-collected. | CLOSED | E-03, E-09, E-10, E-11: Google states a price step for 2027-01-01 on today's page; LiveBench is dated 2026-10-02 and lists models released this quarter; Aider's leaderboard stopped at August 2025 and Hemingway-bench ranks the previous generation - a leaderboard can lag a year, a price page a quarter. The table is dated and re-collected at least quarterly. |
| U-08 | What hardware does a free local model need - memory per model size, as the Ollama library states it? | A 70B model that needs 40 GB of memory is not free on a laptop. | KNOWN-UNKNOWN | E-07, E-20: the library lists sizes (1b to 671b) and the README states no memory per size any more. Day one: on the machine MoonAliza runs on, `ollama pull <model>` then `ollama ps` after one prompt, and read the memory column - the rule of thumb (a 7-8b model in about 8 GB, 14b in 16 GB, 30-32b in 32 GB) is a guess until that is read. |

## Questions for the human (maximum 3)

1. What monthly token volume should the cost column assume? Until answered, the brief assumes 10 million input and 2 million output tokens a month and shows the formula.

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

Locked decisions for this project. Do not revisit these without the human.

- Prices and ranks are dated facts: every claim carries its retrieval date, and the brief is
  valid for that date, not for "now".
- Leaderboards are read as published; no benchmark is run here.
- The collection is bounded to the vendors and leaderboards named in the unknowns; a model
  outside them is out of scope, and the brief says so.
