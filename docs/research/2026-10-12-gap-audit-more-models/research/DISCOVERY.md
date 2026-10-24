# Discovery Contract - Gap audit comparison sets for MoonAliza More models Phases 1-2: how desktop and editor coding agents and Anthropic's own client handle truncated and refused answers, transient failures, and model token limits

Started 2026-10-13. This file is the definition of "enough information to build".
`node "$HOME/.agents/fetchproof/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

An answer-only gap audit (gap-audit skill, lens GA-B) of MoonAliza's More models Phases 1-2 (`main-axuse` @ `4e2b9d8`): the Anthropic Messages adapter, the per-kind request builder, OpenAI-shaped stream robustness and fail-closed Ollama locality. Nothing is built here. This project holds only the external comparison claims the audit's gaps rest on: how widely used desktop and editor coding agents report an answer cut by a token limit, where they take an Anthropic model's context window and maximum output, and what request timeout they use. Anthropic's own documented client behaviour is already captured in `docs/research/2026-10-05-provider-wire-formats` and is cited from there. Done means each unknown below is CLOSED from its owner page or KNOWN-UNKNOWN, and the audit cites the rows.

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
| U-01 | How does Aider report a response cut by the model's output-token limit or by its context window: does it name which limit was hit and what to do? (S-1) | Benchmark for GA-B1: MoonAliza shows a truncated answer as an ordinary one and fails the run with a generic provider message. | CLOSED | E-01: Aider names the model, the limit hit (input, output or total against the window) and the counts, and lists what to do; it reports the provider's verdict and does not enforce limits. |
| U-02 | Does Zed take an Anthropic model's context window and maximum output from its own model definitions, so the user types token values only for a custom model? (S-2, D-8) | Benchmark for GA-B2: MoonAliza's form keeps 8,192 / 2,048 when the Anthropic API is selected. | CLOSED | E-04 (via E-02): Zed's Anthropic setup is an API key; a context window and output limit are typed only for a custom model, so the listed models carry their own (an inference from the page's wording, not stated outright). |
| U-03 | What does Claude Code document for its maximum output tokens and its API request timeout (defaults and settings)? (S-1, S-2, D-8) | Benchmark for GA-B2 and for the 600 s Anthropic deadline. | CLOSED | E-05: Claude Code's API request timeout defaults to 600000 ms; its maximum output tokens default and cap vary by model (32000 / 128000 for an unknown model id); it retries failed requests 10 times by default with exponential backoff for 529, recovers a stream that fails mid-way, switches model on a classifier refusal, and fails at once on a spend-limit 429. E-03 is the settings page that points to it. |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

Locked decisions for this project. Do not revisit these without the human.

- Answer-only audit: nothing in MoonAliza is changed; this corpus is evidence only.
- Budget: at most 5 Firecrawl credits for these unknowns (3 planned; 2 follow-up pages linked from the first captures, because Zed and Claude Code moved the facts to other pages), inside the 15 credits shared by both auditors of the More models run. Owner pages named directly, no search. Never `--fallback`.
- Anthropic's own documented behaviour (retries, stream errors, stop reasons, context windows) is cited from `docs/research/2026-10-05-provider-wire-formats`, not collected again.
