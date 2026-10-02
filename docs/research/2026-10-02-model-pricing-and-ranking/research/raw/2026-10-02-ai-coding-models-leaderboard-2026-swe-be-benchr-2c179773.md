---
url: https://benchr.org/leaderboard/coding
retrieved: 2026-10-02
command: http-keyless scrape https://benchr.org/leaderboard/coding
statusCode: 200
transport: http-keyless
completeness: partial
omitted: 1 sibling section(s) totalling ~8 words were outside the page's main content and are not in this capture
title: AI Coding Models Leaderboard 2026 — SWE-bench Ranked — benchr
---
Leaderboard · Coding Capabilities · September 2026

# AI coding models leaderboard

 Provider-published SWE-bench Verified results are ranked below. Models without a comparable published result appear in a separate, unranked editorial-estimates table; those estimates never affect the official rank or quality-per-dollar column.


 Data from [models.json](../../assets/data/models.json)
 Data-driven and neutral





| Rank | Model | Provider | SWE-bench Verified | Input $/1M | Quality per dollar |

| Loading provider-published results… |



## Editorial estimates — not official SWE-bench results

 These values are benchr editorial estimates from `benchmarks_estimated` in [models.json](../../assets/data/models.json). They are shown for planning context only, without a rank or quality-per-dollar calculation.




| Model | Provider | Editorial SWE estimate | Input $/1M |

| Loading clearly labeled editorial estimates… |



## What SWE-bench Verified measures

 SWE-bench presents a model with a GitHub issue and the repository's codebase. The model must locate the bug, write a fix, and have that fix pass the repository's test suite — automatically, without human guidance. The "Verified" subset removes ambiguous issues that could be fixed in multiple ways, making scores more reliable.

 What it doesn't measure: speed, latency, non-coding tasks, or how the model behaves when a developer is actively supervising. A model that scores 75% on SWE-bench might be excellent for pair programming even if an 88% model is better for fully autonomous pipelines. The score is most meaningful when humans are out of the loop.

## Reading the leaderboard: the cost dimension

 Within the provider-published table, the “quality per dollar” column divides a published SWE-bench result by the listed input price. It is a simple derived screen, not a production-cost forecast. Editorial estimates are excluded from both the rank and this calculation.

 For autonomous code repair at volume, the relevant question isn't just "who scores highest" but "at what failure rate does the quality gap cost more than the price gap." See the [GPT-5 vs Opus 4.8 comparison](../../compare/gpt-5-vs-claude-opus-4-8) for that analysis; it was written for the earlier pair, and the break-even method carries over to the current models.

## Where the ranking stands in September 2026

 The top of the provider-published table is now close to a tie on SWE-bench Verified and far apart on price: GPT-5.6 (listed by OpenAI as GPT-5.6 Sol) at 89.8%, OpenAI-reported, for $4 input per 1M tokens, and Claude Sonnet 5 at 89.4%, Anthropic-reported, for $2 input per 1M tokens. Among open-weight models, DeepSeek-V4-Pro leads at 80.6%, DeepSeek-reported.

 Several of the newest flagships are missing from the ranking because their providers have not published a SWE-bench Verified figure that benchr records: Claude Opus 5, Claude Fable 5.1, GPT-6 Astra, and Grok 4.6. Kimi K3 is in the same position; Moonshot publishes Terminal-Bench 2.1 (88.3) and DeepSWE (67.5) for it instead. A missing row is not a low score, and results from different benchmarks or benchmark versions are not comparable with the figures in this table.

## Methodology

 The ranked table includes only results recorded as provider-published in the data. When no comparable published result is available, any benchr editorial estimate appears in the separate unranked table with a visible label. No private or “internal evaluation” evidence is claimed.

## How to validate a coding model before switching

 Use SWE-bench as a screen, not as the final decision. A model that repairs Python repository issues well may still struggle with your TypeScript monorepo, your test harness, your dependency graph, or your internal style constraints. Before migration, run the candidate model against recent bugs your team already fixed and check whether its patch would have passed review.

 A more useful local metric is accepted patch cost: token spend plus failed attempts and engineer review time. If a cheaper model needs more retries, it can cost more per accepted change. If every patch receives the same developer review, a lower-cost model may still be the better default despite a lower benchmark score.

## Why repository fit matters

 Coding models vary by language, repository size, test quality, and how much surrounding context they need. A benchmark score can hide those differences. Before moving traffic, sample issues from your own repositories: one simple bug, one dependency problem, one refactor, one failing test with misleading logs, and one issue that requires reading documentation. That small suite reveals failure modes faster than a generic leaderboard.

 Also check tool behavior. Some models write excellent patches but struggle with shell commands, file navigation, or concise commit messages. If your coding agent depends on those behaviors, evaluate the full workflow instead of the final patch only.

 One more practical point: keep a small regression set after you choose a model. Coding models can change behavior when providers update routing, inference settings, or model aliases. A monthly rerun on the same issues will tell you whether the model still deserves its spot in your pipeline.






## Frequently asked questions


 What is SWE-bench Verified?
 SWE-bench Verified is a benchmark that presents models with real GitHub issues from open-source Python repositories. The model must identify the problem, write a fix, and pass the existing test suite without scaffolding or hints. A 'verified' subset filters out ambiguous or underspecified issues for cleaner scoring. It's widely considered the best public signal of autonomous coding ability.



 Which is the best coding model in 2026?
 The provider-published table is sorted by the current SWE-bench field in `models.json`. Treat it as a source-labeled screening view, not a universal coding winner: provider runs can use different harnesses and conditions, and production choice needs same-workload testing.



 Why are some SWE-bench scores marked as estimates?
 Not all providers publish a directly comparable SWE-bench result. Any value identified by `benchmarks_estimated` is placed in a separate unranked table and labeled “Editorial estimate”; it is excluded from official rank and value calculations.
