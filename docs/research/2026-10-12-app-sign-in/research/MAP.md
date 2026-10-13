# MAP - topic decomposition

## Topic

Can the MoonAliza Electron desktop app sign users in to GitHub (OAuth device flow or another desktop-suited flow), to Claude with a Claude.ai subscription account, and to OpenAI Codex with Sign in with ChatGPT, and use those sign-ins for repository access and model calls - or must third-party apps use API keys

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-1, U-5, U-7 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | COVERED | U-1, U-2, U-3, U-5, U-6, U-7 |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | COVERED | U-4, U-5 |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-2, U-5, U-6, U-8, U-9 |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-3, U-4 |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-3, U-10 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | COVERED | U-6, U-7 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-1, U-7 |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-5, U-6, U-9 |
| T-1 | Running the vendor's own client (Claude Code binary, Codex CLI) instead of an in-app login | The one route Anthropic leaves open for subscription use in a third-party product, and the way Codex signs in with ChatGPT | COVERED | U-6, U-7 |
| T-2 | Where sign-in tokens are stored on the desktop | MoonAliza keeps credentials out of the engine, logs and files in clear; the vendor clients' own token caches are part of that picture | COVERED | U-3, U-7 |

## Coverage notes (per dimension)

- D-1 Access model: every fact sits on public owner pages (docs.github.com, code.claude.com, OpenAI's Codex docs and terms); the services themselves are reached through OAuth sign-ins or API keys.
- D-2 Auth and credentials: GitHub supports the device flow and a loopback web flow for desktop apps (U-1), with `repo` or GitHub App permissions (U-2) and 8-hour/6-month tokens (U-3). Anthropic forbids third-party Claude.ai login (U-5) and requires API keys (U-6). Codex's ChatGPT sign-in is documented for OpenAI's own clients only (U-7).
- D-3 Rate limits: GitHub's device-flow and REST limits are captured (U-4). Claude Pro/Max limits assume ordinary individual use (U-5, E-04). ChatGPT plan limits were not collected: no OpenAI permission for third-party use was found (U-9).
- D-4 ToS and legality: decisive for Claude (prohibited, U-5; Claude Code carve-out, U-6) and open for OpenAI (U-8 constraints, U-9 KNOWN-UNKNOWN).
- D-5 Schema stability: GitHub's token-response fields carry fixed values (U-3), but GitHub calls expiring GitHub App tokens an optional feature subject to change, and its secondary limits change without notice (U-4).
- D-6 Freshness: tokens expire in 8 hours and refresh tokens in 6 months (U-3); automatic revocation of long-lived OAuth tokens is U-10 (KNOWN-UNKNOWN). Policies can change: OpenAI promises 30 days notice only for materially adverse changes (E-07); Anthropic may enforce without notice (E-04).
- D-7 Cost: API keys are billed to the key owner at API rates (U-6, U-7); subscription billing is not available to a third-party app for Claude (U-5) and not permitted on record for OpenAI (U-9).
- D-8 Runtime: an Electron desktop app on Windows - GitHub's loopback redirect for native apps and the device flow both fit (U-1); Codex itself uses a localhost callback (U-7).
- D-9 Output obtainability: GitHub sign-in is obtainable; Claude subscription sign-in is not, except through the unmodified Claude Code binary (U-6); OpenAI's is unconfirmed (U-9).
- T-1, T-2: added for this topic - the vendor-client route, and token storage.

## Candidate material

Gathered 2026-10-12.

_No material gathered - run without `--dry-run`, or add URLs to `research/plan.json`._

