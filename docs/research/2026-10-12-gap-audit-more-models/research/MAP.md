# MAP - topic decomposition

## Topic

Gap audit comparison sets for MoonAliza More models Phases 1-2: how desktop and editor coding agents and Anthropic's own client handle truncated and refused answers, transient failures, and model token limits

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02, U-03: every page planned is a public documentation page, no login |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | Reason: no account or key is needed to read public documentation; the audit sends nothing to a model vendor |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | Reason: Anthropic rate limits, 529 and retry behaviour are already captured in docs/research/2026-10-05-provider-wire-formats (E-12, E-14, E-10), which the audit cites directly |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | DISMISSED | Reason: pages are read for comparison only; nothing is redistributed or built on them |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | DISMISSED | Reason: each claim is dated by its retrieval; the comparison is a point-in-time benchmark, not a dependency |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | DISMISSED | Reason: same as D-5; a stale benchmark changes a recommendation, never the project evidence of a gap |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | Reason: at most 5 Firecrawl credits, inside the 15-credit budget shared by both auditors |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-02, U-03: how desktop and editor agents set model token limits and request timeouts |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-02, U-03: each fact is on its owner page (aider.chat, zed.dev, code.claude.com) |
| S-1 | How a coding agent reports an answer cut by the output limit or the context window, or refused | The audit's gap on unmarked truncated and refused answers is benchmarked against it | COVERED | U-01, U-03 |
| S-2 | Where a desktop or editor agent takes an Anthropic model's context window and maximum output | The audit's gap on the profile form's token defaults is benchmarked against it | COVERED | U-02, U-03 |
| S-3 | How other agents retry connection errors and in-stream overload | The audit's transient-failure gap | DISMISSED | Reason: the vendor's own client behaviour is captured in the wire corpus (E-12, E-10); no third-party page fits the shared budget, so claims about other tools' retries are labelled unverified in the audit |

## Coverage notes (per dimension)

_One short paragraph per row once it has a status: what was established, and what the
status rests on._

## Candidate material

Gathered 2026-10-13.

_No material gathered - run without `--dry-run`, or add URLs to `research/plan.json`._

