# Brief - Gap audit comparison sets for MoonAliza More models Phases 1-2: how desktop and editor coding agents and Anthropic's own client handle truncated and refused answers, transient failures, and model token limits

_Auto-drafted 2026-10-13 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
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

An answer-only gap audit (gap-audit skill, lens GA-B) of MoonAliza's More models Phases 1-2 (`main-axuse` @ `4e2b9d8`): the Anthropic Messages adapter, the per-kind request builder, OpenAI-shaped stream robustness and fail-closed Ollama locality. Nothing is built here. This project holds only the external comparison claims the audit's gaps rest on: how widely used desktop and editor coding agents report an answer cut by a token limit, where they take an Anthropic model's context window and maximum output, and what request timeout they use. Anthropic's own documented client behaviour is already captured in `docs/research/2026-10-05-provider-wire-formats` and is cited from there. Done means each unknown below is CLOSED from its owner page or KNOWN-UNKNOWN, and the audit cites the rows.

## What we verified

| Claim | Source | Type |
|---|---|---|
| Per https://aider.chat/docs/troubleshooting/token-limits.html (retrieved 2026-10-13): when the provider reports a token limit, Aider prints an error that names the model, which limit was hit and the counts, then what to do. Its example: [quote: Model gpt-3.5-turbo has hit a token limit!] with [quote: Output tokens: 4096 of 4096 -- exceeded output limit!], and [quote: The error will include suggested actions to try and] avoid the limit (smaller changes, smaller files, a model that returns diffs). It reports the provider's verdict, it does not enforce limits itself (l.45-46). Benchmark for GA-B1. | E-01 `aider.chat` (U-01) | P |
| Per https://zed.dev/docs/ai/use-api-access.html (retrieved 2026-10-13): Zed's Anthropic API setup is an API key: [quote: Enter your Anthropic API key.] (l.94). Token limits are typed only for a custom model: [quote: Add custom Anthropic models in settings when you need an alternate model ID,] [quote: display name, context window, output limit, tool override, or thinking mode.] (l.98-99). Inference, not stated: the models Zed lists for a key carry their own context window and output limit. Benchmark for GA-B2. | E-04 `zed.dev` (U-02) | P |
| Per https://zed.dev/docs/ai/llm-providers (retrieved 2026-10-13): an index page; it does not itself say how Anthropic models are configured. It points elsewhere: [quote: Anthropic-compatible provider setup has moved to] Use API Access (l.34), the page collected as E-04. | E-02 `zed.dev` (U-02) | P |
| Per https://code.claude.com/docs/en/env-vars (retrieved 2026-10-13), Claude Code, Anthropic's own coding agent: request timeout [quote: Timeout for API requests in milliseconds (default: 600000, or 10 minutes; maximum: 2147483647)] (l.176); a 5-minute body idle timeout, and [quote: When unset, the timeout is active on providers other than the direct Anthropic API] (l.175); output tokens chosen per model, [quote: Set the maximum number of output tokens for most requests. Defaults and caps vary by model] and [quote: For a model ID Claude Code can’t resolve to a model it knows, the default is 32000 and the cap is 128000.] (l.311); retries [quote: Override the number of times to retry failed API requests (default: 10).] (l.312), with 529 retried on [quote: Starting delay in milliseconds, in place of the default 500, of the exponential backoff between] retries (l.338); a stream that fails mid-way is recovered: [quote: to disable the non-streaming fallback when a streaming request fails mid-stream. Streaming errors propagate to the retry layer instead.] (l.256); a refusal switches model: [quote: automatic model switch when a safety classifier flags a request] (l.262); a spend-limit 429 is not retried: [quote: Claude Code fails at once when a standard-speed request gets a] 429 that reports a spend limit (l.362). Benchmark for GA-B1, GA-B2, GA-B3 and for the 600 s deadline. | E-05 `code.claude.com` (U-03) | P |
| Per https://code.claude.com/docs/en/settings (retrieved 2026-10-13): Claude Code's settings precedence page. Relevant only in passing: it has a fallbackModel setting that [quote: is an ordered chain where position carries meaning] (l.219); when the chain is used is on other pages. Its variable list moved to the env-vars page (l.88, l.313), collected as E-05. | E-03 `code.claude.com` (U-03) | P |

## Contradictions and how they were resolved

No source contradicts another; each is the owner's page about its own product. Two limits, kept visible:
- E-04 does not say outright that Zed's listed Anthropic models carry their own limits; that is inferred from "add custom Anthropic models ... when you need ... context window, output limit". Treat it as WELL-SUPPORTED, not VERIFIED.
- E-05 does not say whether `API_TIMEOUT_MS` bounds a whole streaming response or only its start; the audit compares only the 10-minute default value with MoonAliza's 600 s, not the semantics.
- E-05 is version-dependent documentation (Claude Code v2.1.x as of 2026-10-13); a later release may change defaults.

## Known unknowns

None. Every blocking unknown was closed with cited evidence.

## Decision

Nothing is built from this corpus: it backs an answer-only gap audit (lens GA-B) of MoonAliza More models Phases 1-2, returned to the run's lead as text. The audit cites E-01, E-04 and E-05 as benchmarks, and cites Anthropic's own documentation from `docs/research/2026-10-05-provider-wire-formats` (E-10, E-11, E-12, E-13) and `docs/research/2026-10-05-coding-model-shortlist` (E-01) directly. Out of scope: any change to MoonAliza, which waits for the user's explicit authorization.

## Next steps

1. The Contradictions and Decision sections above were reviewed by the auditing agent on 2026-10-13.
2. Hand this file to the builder (phase 2). Re-running `node "$HOME/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=5de671d28a8df974 inputs=6c0ed3ccb262d567 gate=pass -->
