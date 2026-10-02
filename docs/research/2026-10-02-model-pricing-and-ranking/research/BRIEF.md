# Brief - Which free and paid LLM models an agent app can use through an API or locally, what each costs per million tokens today, and how each ranks on coding and writing benchmarks

_Auto-drafted 2026-10-02 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require the reviewing agent's judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## Intent

A model-choice table for MoonAliza, the agent app: which LLMs it can use, free (an open-weight
model run locally through Ollama, or a vendor's free API tier) or paid (a vendor API), what
each costs per million input and output tokens on the day of collection, and where each
ranks on coding and on writing by published leaderboards - so a reader can say "for this
price you get this, best at that". Prices and rankings move monthly; every row carries its
retrieval date, and the brief says what to re-check before relying on a number. Done means a
dated table with a cost column at a stated monthly volume, a coding rank, a writing rank, the
licence or terms that allow use in a product, and the runtime a free model needs.

## What we verified

| Claim | Source | Type |
|---|---|---|
| Anthropic's API prices per million tokens (MTok), 2026-10-02: Fable 5.1 $10 in / $50 out (prompt-cache read $0.25, write $12.50); Opus 5.5 $4 / $20 (cache read $0.20, write $5); Sonnet 5.5 $2 / $10 (cache read $0.20, write $2.50); Haiku 4.5 $1 in / $5 out. Batch processing halves the price. [quote: Next generation intelligence for long-running agents] [quote: Save 50% with batch processing.] | E-01 `anthropic.com` (U-01) | P |
| OpenAI's API prices per 1M tokens, 2026-10-02, Standard tier, short context: gpt-6-astra $10.00 in / $1.00 cached / $12.50 cache write / $50.00 out; gpt-6.1-sol $2.00 / $0.10 / $2.50 / $10.00; gpt-6-luna $0.10 / $0.01 / $0.125 / $0.50. Long context doubles each; Batch and Flex tiers halve them; Fast doubles them. [quote: Prices per 1M tokens.] | E-02 `developers.openai.com` (U-01) | P |
| Google's Gemini API, 2026-10-02: Gemini 3.8 Flash (and 3.7, 3.6 Flash) are free of charge on the free tier; paid, $0.75 in / $3.75 out per 1M tokens through 2026-12-31 and $1.50 / $7.50 from 2027-01-01, with a $1.35 / $6.75 row for the larger-context band; Gemini 3.5 Flash $1.50 / $9.00. The vendor states the price step a quarter ahead, which is how fast this table ages. [quote: $0.75 through December 31, 2026.] [quote: $1.50 starting January 1, 2027.] | E-03 `ai.google.dev` (U-01, U-02, U-07) | P |
| DeepSeek, 2026-10-02, per 1M tokens, two models: deepseek-flash (V4.1-Flash) and deepseek-v4-pro (V4-Pro-0813), both 1M context, OpenAI- and Anthropic-format endpoints. Off-peak: input cache miss $0.15 (flash) / $0.66 (pro), output $0.60 / $1.98; peak doubles (input $0.30 / $1.32, output $1.20 / $3.96); cache hits $0.003 / $0.022. The cheapest paid frontier-class API in this corpus. [quote: The prices listed below are in units of per 1M tokens.] | E-04 `api-docs.deepseek.com` (U-01) | P |
| Mistral's pricing page, 2026-10-02, is mostly the consumer plans (Pro $14.99); for the API it states the model is per-million-token pricing with input and output counted separately, Mistral Large at $0.5 in / $1.5 out, batch at half price and cached input up to 90% off; per-model API rates live elsewhere and are not in this capture. [quote: For example, Mistral Large costs $0.5 /M tokens in and $1.5 /M tokens out.] | E-05 `mistral.ai` (U-01) | P |
| Ollama's library, 2026-10-02 (most pulled first): llama3.1 8b/70b/405b (120M pulls), deepseek-r1 1.5b-671b, llama3.2 1b/3b, qwen2.5 0.5b-72b, gemma3 270m-27b, qwen3 0.6b-235b, gemma4 e2b-31b (updated 2 days ago), mistral 7b, qwen2.5-coder 0.5b-32b, qwen3.5 0.8b-122b, gpt-oss 20b/120b, qwen3-coder 30b/480b - all free to run locally; the page lists sizes and tags, not memory needs. | E-07 `ollama.com` (U-02) | P |
| OpenRouter's comparison of free LLM APIs (2026): 13 platforms, permanent free tiers at OpenRouter (20+ models, 20 RPM, 50 requests a day, 1,000 with a $10 top-up), Google AI Studio (8 Gemini/Gemma variants, 5-15 RPM, 20-1,500 a day, data used for training outside the EU), Groq (Llama 3.3 70B, 30 RPM, 1,000 a day), Mistral (about 1B tokens a month, data training on the experiment tier), Cerebras (30 RPM, about 1M tokens a day); every free tier is a demo-grade cadence. [quote: 13 platforms offer usable free LLM API access in 2026, including several permanent free tiers for text inference.] | E-08 `openrouter.ai` (U-02, U-06) | S |
| Onyx's 2026 open-source ranking lists, with licences: 1 DeepSeek-V4-Pro (MIT), 2 Kimi K2.6 (modified MIT), 3 GLM-5.2 (MIT), 4 MiniMax M3 (community), 5 DeepSeek-V4-Flash (MIT), 6 Hunyuan Hy3 (Apache 2.0), 7 Step-3.7-Flash (Apache 2.0), 8 Qwen3.6-27B (Apache 2.0) - the free-to-run models that also appear on LiveBench and EQ-Bench. [quote: DeepSeek-V4-Pro (DeepSeek, MIT)] | E-13 `onyx.app` (U-02) | S |
| LiveBench, 2026-10-02 - overall / coding / agentic coding / cost per successful task: Claude Fable 5.1 Max Effort 83.4 / 86.4 / 66.1 / $1.212; Claude 5.5 Opus Thinking 83.2 / 89.3 / 71.7 / $0.799; Claude Fable 5 83.0 / 86.0 / 62.2 / $1.439; GPT-6 Astra 82.2 / 80.4 / 57.3 / $0.736; GPT-6.1 Sol 81.6 / 80.4 / 54.5 / $0.142; DeepSeek V4.1 Flash (open weights) 81.1 / 80.0 / 77.3 / $0.029; Kimi K3 (open) 79.2 / 81.4 / 62.2 / $0.348. On coding, Opus 5.5 leads; on agentic coding and on cost, the open DeepSeek V4.1 Flash does. | E-09 `livebench.ai` (U-03, U-07) | P |
| SWE-bench Verified as mirrored by steel.dev, 2026-10-02: Claude Opus 5 97.00% (independent Vals.ai run) and 96.0% self-reported, Claude Mythos 5 95.5%, Claude Fable 5 95.0%, Claude Mythos Preview 93.9%, Claude Opus 4.8 88.6%, Opus 4.7 87.6%, GPT-5.6 Sol 82.2%, Opus 4.5 80.9%, Gemini 3.1 Pro 80.6%, GPT-5.2 80.0%, Claude Sonnet 4.6 79.6%, Gemini 3 Flash 78.0%. Mostly self-reported; the one independent measurement is marked. [quote: Independently measured by Vals.ai] _(partial capture)_ | E-18 `leaderboard.steel.dev` (U-03) | S |
| Aider's polyglot leaderboard is stale for this question: its top entries are gpt-5 (high) 88.0% at $29.08 a run, gpt-5 (medium) 86.7%, o3-pro 84.9% at $146.32, gemini-2.5-pro 83.1%, all dated June-August 2025; none of the 2026 models above appears. Kept for the cost-per-run idea, not for the ranking. | E-10 `aider.chat` (U-03, U-07) | P |
| benchr.org's coding leaderboard loads its table client-side; the capture holds only the placeholder, so the page cannot be read through a fetch - kept as the record. [quote: Loading provider-published results…] _(partial capture)_ | E-19 `benchr.org` (U-03) | S |
| EQ-Bench Creative Writing v3 (LLM-judged Elo), 2026-10-02: gpt-6-astra 2173.3, claude-fable-5-1 2162.0, claude-opus-5 2132.6, gpt-6-sol 2124.7, kimi-k3 2082.3 (open weights), GLM-5.3 2075.0 (open), claude-opus-5-5 2050.1, grok-4.7 2006.7, claude-fable-5 1943.1; rubric scores cluster at 82-86, so the Elo column is the ranking. | E-12 `eqbench.com` (U-04) | P |
| Hemingway-bench (Surge AI), judged by expert human writers: Gemini 3 Flash, Gemini 3 Pro and Claude Opus 4.5 took the top three, with per-model personas (Opus 4.5 the most human-like voice, GPT-5.2 solid for practical writing, Qwen3 original but error-prone). The models are a generation older than the pricing pages, so it ranks writing style, not today's catalogue. [quote: Gemini 3 Flash, Gemini 3 Pro, and Claude Opus 4.5 take the top 3 spots.] | E-11 `surgehq.ai` (U-04, U-07) | S |
| Open-weight licences fall into two families: true open-source (Apache 2.0 - Qwen, Mistral Small, GPT-oss, Granite; MIT - DeepSeek, GLM), which permit commercial use with minimal conditions and are approve-once like any dependency; and vendor community licences (Meta's Llama, Google's Gemma terms) that permit most commercial use with conditions - acceptable-use policies, attribution, and Llama's user-count threshold. [quote: Open-weight model licenses fall into two families] | E-14 `llmconfigurator.com` (U-05) | S |
| The Llama 3.3 / Llama 4 Community License's threshold: commercial use is permitted up to 700 million monthly active users across affiliated products, above which a separate licence from Meta is required; Llama 4 Maverick and Scout ship under the Llama 4 Community License. [quote: 700 million MAU across affiliated products] _(partial capture)_ | E-16 `bestllmfor.com` (U-05) | S |
| The 2026 open-weight licence landscape agrees: the Llama 3.x and 4 Community Licence permits commercial use up to the user threshold, under its acceptable-use policy. [quote: The Llama 3.x and 4 Community Licence permits commercial use up to] | E-17 `presenc.ai` (U-05) | S |
| The Llama licence page itself was not reachable: Firecrawl does not support llama.com, and the keyless fetch of dev.meta.ai landed on a single sign-on wall (174 characters, graded partial) - the record that the owner page needs a browser session; the licence terms rest on E-14, E-16 and E-17. [quote: For added security, you need to confirm your identity.] _(partial capture)_ | E-15 `dev.meta.ai` (U-05) | P |
| Gemini rate limits, 2026-10-02: limits are per project (RPM, TPM, RPD), in tiers - Free (an active project, no spend cap), Tier 1 (a billing account, $10 per 10 minutes, $250 billing cap), Tier 2 ($100 paid, $50 per 10 minutes), Tier 3 ($1,000 paid, $200 per 10 minutes); the per-model free-tier RPM table is rendered client-side and is not in the capture. [quote: Rate limits are applied per project, not per API key.] | E-06 `ai.google.dev` (U-06) | P |

## Contradictions and how they were resolved

Five disagreements, each resolved by reading what the sources measure rather than averaging:

1. **Writing: who is first.** Hemingway-bench (E-11), judged by expert human writers, put
   Gemini 3 Flash, Gemini 3 Pro and Claude Opus 4.5 first - a previous generation, since
   none of the 2026-10 models exists on it. EQ-Bench Creative Writing v3 (E-12), an LLM-judged
   Elo dated today, puts gpt-6-astra first and claude-fable-5-1 second. Trusted for today's
   catalogue: EQ-Bench, because it holds the models the pricing pages sell; Hemingway is
   kept for its method and its personas, not its ranking.
2. **Coding: three leaderboards, three answers.** LiveBench coding (E-09): Claude 5.5 Opus
   Thinking 89.3, Fable 5.1 86.4. SWE-bench Verified (E-18): Claude Opus 5 97.0% in the one
   independent run, Fable 5 95.0%, GPT-5.6 Sol 82.2%. Aider (E-10): gpt-5 at 88%, from
   August 2025, with none of today's models. They measure different work (a live problem
   set, repository issues, edit-format compliance); the two current ones agree that
   Anthropic's Opus leads coding, and Aider is set aside as stale.
3. **DeepSeek has two prices.** Peak is double off-peak (E-04). Both are recorded; the table
   shows off-peak and names the peak, because the time of day MoonAliza's users work in is
   not known here.
4. **Gemini Flash is free and is $0.75.** The same model, two tiers (E-03): the free tier is a
   demo-grade cadence (E-08: 5-15 requests a minute, 20-1,500 a day, data used for training
   outside the EU), and the paid price steps up on 2027-01-01.
5. **Mistral's page states one rate, not a table.** $0.5 / $1.5 for Mistral Large (E-05) is the
   page's example; the per-model rates live elsewhere, so the Mistral row is marked partial
   rather than guessed.

## Known unknowns

- **U-08** - What hardware does a free local model need - memory per model size, as the Ollama library states it?
  - Known so far: E-07, E-20: the library lists sizes (1b to 671b) and the README states no memory per size any more.
  - Day-one verification: on the machine MoonAliza runs on, `ollama pull <model>` then `ollama ps` after one prompt, and read the memory column - the rule of thumb (a 7-8b model in about 8 GB, 14b in 16 GB, 30-32b in 32 GB) is a guess until that is read.

## Decision

**The table, dated 2026-10-02.** Monthly cost assumes 10 million input and 2 million output
tokens a month (the open intent question); the formula is `10 x input price + 2 x output
price`, so any other volume is one multiplication away. Prices are per million tokens.

| Model | Access | Price in / out | Month at the assumed volume | Coding | Writing | Best at |
|---|---|---|---|---|---|---|
| Claude Fable 5.1 | paid API (E-01) | $10 / $50 | $200 | LiveBench 86.4 (2nd); SWE-bench Verified, Fable 5: 95.0% | EQ-Bench 2162 (2nd) | long-running agents, writing near the top; the most expensive row |
| Claude Opus 5.5 | paid API (E-01) | $4 / $20 | $80 | LiveBench coding 89.3 (1st), agentic 71.7 | EQ-Bench 2050 (7th) | coding, at 40% of Fable's price |
| Claude Sonnet 5.5 | paid API (E-01) | $2 / $10 | $40 | not on the captured leaderboards | not on the captured leaderboards | the mid-price Claude; unranked here |
| GPT-6 Astra | paid API (E-02) | $10 / $50 | $200 | LiveBench 80.4; agentic 57.3 | EQ-Bench 2173 (1st) | writing |
| GPT-6.1 Sol | paid API (E-02) | $2 / $10 | $40 | LiveBench 80.4; $0.142 per successful task | gpt-6-sol 2125 (4th) | cheap frontier-class generalist |
| GPT-6 Luna | paid API (E-02) | $0.10 / $0.50 | $2 | not on the captured leaderboards | not on the captured leaderboards | the cheapest OpenAI row; unranked here |
| Gemini 3.8 Flash | free tier, or paid (E-03) | $0 on the free tier; $0.75 / $3.75 paid ($1.50 / $7.50 from 2027-01-01) | $0 or $15 | Gemini 3.1 Pro 80.6%, Gemini 3 Flash 78.0% on SWE-bench Verified (E-18) | Hemingway's human judges put the previous Gemini Flash first (E-11) | free prototyping; the cheapest paid big-vendor row |
| DeepSeek V4.1 Flash | paid API, open weights MIT (E-04, E-13) | $0.15 / $0.60 off-peak (double at peak) | $2.70 (peak $5.40) | LiveBench 80.0, agentic coding 77.3 (1st), $0.029 per task | not on EQ-Bench's captured rows | value: 81.1 overall at a fortieth of Fable's cost per task |
| DeepSeek V4 Pro | paid API, open weights MIT (E-04, E-13) | $0.66 / $1.98 off-peak | $10.56 | Onyx's open-source #1; no leaderboard row captured | - | the strongest open-weight model, cheap |
| Mistral Large | paid API (E-05) | $0.5 / $1.5 (the page's example) | $8 | not on the captured leaderboards | not on the captured leaderboards | partial: per-model rates not on the page |
| Kimi K3, GLM-5.3 (open) | open weights (E-13) | local: $0 | $0 plus hardware | Kimi K3 LiveBench 81.4 | Kimi K3 2082, GLM-5.3 2075 (5th, 6th) | the best free writing models |
| Qwen3 / Qwen3.5, Gemma 4, gpt-oss, qwen3-coder (Ollama) | local, free (E-07) | $0 | $0 plus hardware (U-08) | not on the captured leaderboards | not on the captured leaderboards | zero marginal cost once the memory question (U-08) is read |

**Best at, by the two current leaderboards:** coding - Claude Opus 5.5 (LiveBench) and
Claude Opus 5 (SWE-bench Verified, independent 97.0%); writing - GPT-6 Astra, then Claude
Fable 5.1; value - DeepSeek V4.1 Flash; free for prototypes - Gemini 3.8 Flash's free tier;
free in production - an open-weight model through Ollama, after U-08.

**First build step:** give MoonAliza three model roles rather than one model - coding
(Opus 5.5, or Sonnet 5.5 at half the price once a leaderboard row for it is captured),
writing (Fable 5.1 or GPT-6 Astra), and default (DeepSeek V4.1 Flash, or Gemini 3.8 Flash
free while prototyping) - with a local Ollama model as the zero-cost fallback once the
memory check in U-08 is done on the target machine. Re-collect this project every quarter:
the Google page already carries a 2027-01-01 price step, and two of four leaderboards
reached here were a generation behind.

**Out of scope:** licences of the vendor APIs beyond their published terms (not re-read
here); the Gemini per-model free-tier limits and benchr's table, both rendered client-side
and unreadable through a fetch (E-06, E-19); Aider's leaderboard as a ranking (E-10);
Mistral's per-model rates (E-05); any model not named in the unknowns.

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "/root/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=cfc428996fc3ff24 inputs=41890f4b5ff629eb gate=pass -->
