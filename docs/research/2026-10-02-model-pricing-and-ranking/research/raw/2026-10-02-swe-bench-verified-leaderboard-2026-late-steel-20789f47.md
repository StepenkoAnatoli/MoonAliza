---
url: https://leaderboard.steel.dev/leaderboards/swe-bench-verified/
retrieved: 2026-10-02
command: http-keyless scrape https://leaderboard.steel.dev/leaderboards/swe-bench-verified/
statusCode: 200
transport: http-keyless
completeness: partial
omitted: 1 sibling section(s) totalling ~5 words were outside the page's main content and are not in this capture
title: SWE-bench Verified Leaderboard 2026: Latest Coding Agent Scores | Steel.dev
---
# SWE-bench Verified Leaderboard

 SWE-bench Verified leaderboard for coding agents resolving 500 human-filtered real GitHub issues with Docker-based test execution.

 Last updated: 2026-09-04

 model scope


- [Leaderboard](#leaderboard)
- [About this benchmark](#about)
- [Example tasks](#example-tasks)
- [Methodology](#methodology)
- [Links](#links)
- [FAQ](#faq)

 Copy markdown





## Leaderboard



 Model scope


| System / Submission | Score | Organization | Reported | Source |
| Claude Opus 5 (Vals.ai run) New Independently measured by Vals.ai (97.00% +/-0.76) with its mini-swe-agent bash-only harness in isolated Docker containers; archived board, updated 2026-09-01. | 97.00% | Anthropic | Sep 2026 | [Source](https://vals.ai/benchmarks/swebench) |
| Claude Opus 5 New Five-trial average in the card's standard configuration; self-reported in the Opus 5 system card. Vals.ai independently measures 97.00% with a bash-only harness. | 96.0% | Anthropic | Jul 2026 | [Source](https://www-cdn.anthropic.com/ceaf5c7ff2783855203fde8208ec311252dced5b/Claude%20Opus%205%20System%20Card.pdf) |
| Claude Mythos 5 New Averaged over 5 trials in standard configuration (adaptive thinking at max effort, thinking blocks included in sampling). Self-reported in the Claude 5 system card. | 95.5% | Anthropic | Jun 2026 | [Source](https://www-cdn.anthropic.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf) |
| Claude Fable 5 New Generally available sibling of Mythos 5; averaged over 5 trials in standard configuration. Self-reported in the Claude 5 system card. | 95.0% | Anthropic | Jun 2026 | [Source](https://www-cdn.anthropic.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf) |
| Claude Mythos Preview Utilizes Mythos reasoning loops to reach near-human resolution on verified tasks. | 93.9% | Anthropic | Apr 2026 | [Source](https://www.mindstudio.ai/blog/claude-mythos-benchmark-results-swe-bench-agentic-coding) |
| Claude Opus 4.8 New Anthropic's May 2026 frontier release; standard configuration with thinking blocks included. Self-reported in the Opus 4.8 system card. | 88.6% | Anthropic | May 2026 | [Source](https://www.anthropic.com/news/claude-opus-4-8) |
| Claude Opus 4.7 Anthropic's April 2026 frontier release; optimized for long-context codebase understanding. | 87.6% | Anthropic | Apr 2026 | [Source](https://www.anthropic.com/news/claude-opus-4-7) |
| GPT-5.6 Sol New max/xhigh reasoning; third-party measurement reported by Thinking Machines in the Inkling announcement. | 82.2% | OpenAI | Jul 2026 | [Source](https://thinkingmachines.ai/news/introducing-inkling) |
| Claude Opus 4.5 Self-reported on the official leaderboard; high-throughput frontier model. | 80.9% | Anthropic | Nov 2025 | [Source](https://www.anthropic.com/news/claude-opus-4-5) |
| Claude Opus 4.6 Self-reported by Anthropic; near-parity with Opus 4.5. | 80.8% | Anthropic | Feb 2026 | [Source](https://www.anthropic.com/news/claude-opus-4-6) |
| DeepSeek-V4-Pro-Max New Large-scale MoE model with specialized coding reinforcement learning. | 80.6% | DeepSeek | Apr 2026 | [Source](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/) |
| Gemini 3.1 Pro Self-reported by Google DeepMind at Gemini 3.1 Pro launch, February 2026. | 80.6% | Google DeepMind | Feb 2026 | [Source](https://deepmind.google/models/gemini/pro/) |
| Kimi K2.6 New Advanced reasoning model with integrated terminal and editor tools. | 80.2% | Moonshot AI | Apr 2026 | [Source](https://www.kimi.com/blog/kimi-k2-6) |
| MiniMax M2.5 Leading open-weight model on the official leaderboard. | 80.2% | MiniMax | Feb 2026 | [Source](https://www.minimax.io/news/minimax-m25) |
| GPT-5.2 Self-reported by OpenAI on the official leaderboard. | 80.0% | OpenAI | Dec 2025 | [Source](https://openai.com/index/introducing-gpt-5-2/) |
| GLM-5.2 New Open-weights model; third-party measurement reported by Thinking Machines in the Inkling announcement. | 80.0% | Zhipu AI | Jul 2026 | [Source](https://thinkingmachines.ai/news/introducing-inkling) |
| Claude Sonnet 4.6 Self-reported; high efficiency with frontier-class coding performance. | 79.6% | Anthropic | Feb 2026 | [Source](https://www.anthropic.com/news/claude-sonnet-4-6) |
| DeepSeek-V4-Flash-Max SWE-bench Verified resolve rate; reported on huggingface.co. | 79.0% | DeepSeek | Apr 2026 | [Source](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash) |
| Qwen3.6 Plus SWE-bench Verified resolve rate; reported on qwen.ai. | 78.8% | Alibaba Cloud / Qwen Team | Apr 2026 | [Source](https://qwen.ai/blog?id=qwen3.6) |
| Gemini 3 Flash SWE-bench Verified resolve rate; reported on blog.google. | 78.0% | Google DeepMind | Dec 2025 | [Source](https://blog.google/products/gemini/gemini-3-flash/) |
| MiMo-V2-Pro SWE-bench Verified resolve rate; reported on mimo.xiaomi.com. | 78.0% | Xiaomi | Mar 2026 | [Source](https://mimo.xiaomi.com/mimo-v2-pro) |
| GLM-5 SWE-bench Verified resolve rate; reported on docs.z.ai. | 77.8% | Zhipu AI | Feb 2026 | [Source](https://docs.z.ai/guides/llm/glm-5) |
| Inkling New Open-weights model at effort=0.99; self-reported by Thinking Machines in the Inkling announcement. | 77.6% | Thinking Machines | Jul 2026 | [Source](https://thinkingmachines.ai/news/introducing-inkling) |
| Kimi K2.5 New Open-weights model; third-party measurement reported by Thinking Machines in the Inkling announcement. | 76.8% | Moonshot AI | Jul 2026 | [Source](https://thinkingmachines.ai/news/introducing-inkling) |
| Nemotron 3 Ultra New Open-weights model; third-party measurement reported by Thinking Machines in the Inkling announcement. | 70.7% | NVIDIA | Jul 2026 | [Source](https://thinkingmachines.ai/news/introducing-inkling) |





 Expand to see 13 more Show less





## About this benchmark

 SWE-bench Verified is the 500-instance human-reviewed split of SWE-bench, built from real GitHub issues in popular Python repositories. Agents receive an issue and repository state, then generate a patch.

 It became the standard public signal for autonomous coding agents because scoring uses actual test execution rather than preference judgments or synthetic unit tests.

 The benchmark is now mature and heavily exposed in public training data. Recent audits argue that top frontier scores should be interpreted with contamination and test-design caveats, especially when comparing very high-scoring systems.



 Strong at measuring public issue-resolution workflows; weaker as a frontier-only signal once scores approach saturation or contamination dominates.







## Example tasks


Three public tasks quoted from benchmark sources:


- "Subclassed SkyCoord gives misleading attribute access message" [Citation: SWE-bench Verified dataset](https://huggingface.co/datasets/princeton-nlp/SWE-bench_Verified)
- "Please support header rows in RestructuredText output" [Citation: SWE-bench Verified dataset](https://huggingface.co/datasets/princeton-nlp/SWE-bench_Verified)
- "IndexError: tuple index out of range in identify_format (io.registry)" [Citation: SWE-bench Verified dataset](https://huggingface.co/datasets/princeton-nlp/SWE-bench_Verified)





## Methodology


- Metric is % Resolved: the share of instances where the generated patch passes the benchmark tests after being applied in the evaluation harness.
- SWE-bench uses containerized execution to improve reproducibility, though environment details, tool permissions, time limits, and scaffold design still matter.
- Verified was curated by expert review from the larger SWE-bench set, but later audits found remaining flawed or underspecified tests at high performance levels.
- We retain Verified because it is widely reported, while linking to source notes so readers can distinguish official leaderboard entries from launch-post claims.





## Links


- [SWE-bench leaderboard](https://www.swebench.com/)
- [SWE-bench repository](https://github.com/princeton-nlp/SWE-bench)
- [SWE-bench Verified announcement](https://openai.com/index/introducing-swe-bench-verified/)
- [OpenAI limitations analysis](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)





## Related benchmarks


Compare this benchmark with related pages from the hub:

 [agentbench](/leaderboards/agentbench/)[tau-bench](/leaderboards/tau-bench/)[gaia](/leaderboards/gaia/)

 [Back to benchmark hub](/)





## Frequently asked questions





 Which system is currently best on SWE-bench Verified? + - Claude Opus 5 (Vals.ai run) is the model currently leading with a tracked score of 97.00%. This page is model-focused, so rankings mostly reflect model capability under the reported harness. Based on our latest tracked results, last updated Sep 4, 2026.

 What should I read into a SWE-bench Verified score? + - SWE-bench Verified scores are most useful for within-benchmark ranking. Read the Notes column to understand setup context, and use the methodology section before making procurement or architecture decisions.

 Are these independently verified? + - Not always. Some rows are independently benchmarked and some are team-reported. Use each source link and notes field to verify evidence level before drawing strong conclusions.
