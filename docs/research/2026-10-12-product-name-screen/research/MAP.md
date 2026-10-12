# MAP - topic decomposition

## Topic

Product-name screen for a Windows desktop AI coding assistant: is there an obvious conflict for Moonwright, Lunarch, Perilune, Selunara or Tidewright as the name of an AI coding assistant or developer software (US trademark index, web search, GitHub, .com domain)

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02, U-03, U-04, U-05 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | A name screen reads public indexes, a public search API and public registries with no account; the product's own accounts and keys do not change with its name |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | A one-time screen with no cadence; the collection is capped by the project's 20-credit budget, not by a source's rate limit |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-01, U-02, U-03, U-04, U-05 |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | DISMISSED | No data feed is consumed by the product; the indexes are read once for a decision |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-01, U-02, U-03, U-04, U-05 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | The question is whether a name is obviously taken, not what a domain or a trademark filing costs; those prices follow the choice and change no part of it |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | DISMISSED | The screen's scope, set by the order, is a trademark index, the web, GitHub and the .com; a same-named Microsoft Store listing on the target platform is part of the full check of the name chosen (the sibling project's U-07 and U-11 are the template), not of this screen |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-02, U-03, U-04, U-05 |
| S-1 | US trademark filings for each exact name (Justia's index of USPTO data; TSDR when it points to a live mark in software classes) | A live mark for the exact name in Class 9 or 42 is the legal blocker | COVERED | U-01, U-02, U-03, U-04, U-05 |
| S-2 | Software or AI products and companies using each name (one web search per name) | A current same-named software product, above all a developer tool, is the direct confusion risk | COVERED | U-01, U-02, U-03, U-04, U-05 |
| S-3 | Open-source projects matching each name on GitHub (stars-sorted repository search) | A widely used same-named project is a confusion risk among developers, the product's audience | COVERED | U-01, U-02, U-03, U-04, U-05 |
| S-4 | The .com domain for each name (the .com registry's RDAP record) | A taken .com held by a software business adds confusion and changes the product's address | COVERED | U-01, U-02, U-03, U-04, U-05 |

## Coverage notes (per dimension)

- D-1 (access): Justia's trademark search, the web search results page, GitHub's REST search endpoint and Verisign's RDAP server are public pages read without an account; which of them rendered, and what each capture holds, is recorded per evidence row in research/EVIDENCE.md.
- D-4 (legality of the intended use): the use is a product name, so legality is trademark conflict and confusion with a current software product; S-1 and S-2 carry it, per name, in U-01 to U-05.
- D-6 (freshness): every capture is dated 2026-10-12; filings, products and domain holdings change, and the brief says what to re-check before the name is adopted.
- D-9 (obtainability): each name's verdict needs the four sources of S-1 to S-4; where one could not be read, or was skipped because an earlier source already showed a conflict, the unknown's evidence cell says so.
- D-2, D-3, D-5, D-7, D-8: dismissed with the reasons in the table.

## Candidate material

Gathered 2026-10-12.

_No material gathered - phase 0 ran as a dry run (`decompose.mjs --dry-run`), spending nothing; the sources were chosen from the sibling project's plans (docs/research/2026-10-12-selenic-name-check/research/plan*.json), which record which owner pages and endpoints rendered for Selenic._
