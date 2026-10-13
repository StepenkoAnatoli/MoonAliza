---
url: https://zed.dev/docs/ai/llm-providers
retrieved: 2026-10-13
command: firecrawl scrape https://zed.dev/docs/ai/llm-providers --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: LLM Providers | LLM Providers - Zed
---
Agent documentation index: [llms.txt](https://zed.dev/docs/llms.txt). Markdown versions are available for docs pages.


Use this page to choose which models power [the Zed Agent](https://zed.dev/docs/ai/zed-agent.html) and
other Zed-owned AI features, including [Inline Assistant](https://zed.dev/docs/ai/inline-assistant.html),
Git commit generation, thread summaries, and similar model-backed features.

Model access paths do not configure [External Agents](https://zed.dev/docs/ai/external-agents.html) or
[Terminal Threads](https://zed.dev/docs/ai/terminal-threads.html). External Agents and Terminal Threads
usually own their own model access, auth, and configuration.

| Model access path | Best when | Source of truth |
| --- | --- | --- |
| [Use Zed-Hosted Models](https://zed.dev/docs/account/zed-hosted-models.html) | You want models billed through Zed | Account & Billing > Zed-Hosted Models |
| [Use API Access](https://zed.dev/docs/ai/use-api-access.html) | You have provider API access, credits, or usage billing | Use API Access |
| [Use an Existing Subscription](https://zed.dev/docs/ai/use-an-existing-subscription.html) | You already pay for ChatGPT, Claude, Copilot, or another subscription | Use an Existing Subscription |
| [Use a Gateway](https://zed.dev/docs/ai/use-a-gateway.html) | You route through OpenRouter, Bedrock, Vercel, or a similar platform | Use a Gateway |
| [Use a Local Model](https://zed.dev/docs/ai/use-a-local-model.html) | You run models locally or self-hosted | Use a Local Model |

Use the setup pages for provider-specific details. See [Agents](https://zed.dev/docs/ai/agents.html) for
the difference between the Zed Agent, External Agents, and Terminal Threads.

[Edit Prediction](https://zed.dev/docs/ai/edit-prediction.html) has its own provider setup under `edit_predictions`. LLM providers on this page apply to model-backed Zed AI features such as Zed Agent, Inline Assistant, Git commit generation, and thread summaries.

Anthropic-compatible provider setup has moved to [Use API Access](https://zed.dev/docs/ai/use-api-access.html#anthropic-compatible).

OpenAI-compatible provider setup has moved to [Use API Access](https://zed.dev/docs/ai/use-api-access.html#openai-compatible).

[Inline Assistant](https://zed.dev/docs/ai/inline-assistant.html "Inline Assistant") [Use API Access](https://zed.dev/docs/ai/use-api-access.html "Use API Access")

Zed uses cookies to improve your experience and for marketing. Read [our cookie policy](https://zed.dev/cookie-policy) for more details.


Strictly Necessary

Analytics

Marketing

Reject all

Accept all
