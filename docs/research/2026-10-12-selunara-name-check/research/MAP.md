# MAP - topic decomposition

## Topic

Is Selunara free to use as the product name of a Windows desktop AI coding assistant (formerly MoonAliza/Moonzila; Selenic was refused for a Parasoft trademark): US, EU and WIPO marks for Selunara and close variants; software and AI products and companies named Selunara; GitHub, npm and PyPI names; selunara domains; Microsoft Store listings; the word's meaning

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-03, U-04, U-05, U-09, U-10, U-11, U-14, U-15 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | A name check reads public registers, search endpoints and registry APIs with no account; the product's own accounts and keys do not change with its name |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | A one-time check with no cadence; the collection is capped by the project's 20-credit budget, not by a source's rate limit (PyPI asked the collector to wait once, 43 seconds, and then answered) |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-01, U-02, U-03, U-04, U-05 |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | DISMISSED | No data feed is consumed by the product; each register is read once for a decision |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-01, U-02, U-05, U-09, U-10 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | The question is whether the name is free, not what a domain, a trademark filing or a clearance search costs; those prices follow the decision. Whether the taken .com can be bought at all is U-16 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-12 |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-02, U-03, U-04, U-05, U-06, U-07, U-08, U-09, U-10, U-11, U-12, U-13, U-14, U-15, U-16, U-17, U-18 |
| S-1 | US trademark filings for SELUNARA and the close variants SELUNA, SELUNAR, SELENARA and SALUNARA (Justia's index; TSDR for its hits; the USPTO's own search) | A live mark for the name or a look-alike covering software is the legal blocker | COVERED | U-01, U-02, U-03, U-18 |
| S-2 | EU, UK and international marks (TMview across EUIPO and national offices, the WIPO Global Brand Database and Madrid) | The product ships worldwide; a mark outside the US can block use there | COVERED | U-04 |
| S-3 | Software and AI products and companies trading as Selunara (two pages of a web search, product sites, the account names the registries show, company registers) | A current same-named software or AI product is the direct confusion risk | COVERED | U-05, U-15, U-17 |
| S-4 | Developer namespaces: GitHub repositories and account, npm package and scope, PyPI project | The product's repository, packages and organisation need the name | COVERED | U-06, U-07, U-08, U-14 |
| S-5 | Domains selunara.com, .dev, .app, .ai and .io, and what a registered one serves | The product needs an address; a taken one held by another business adds confusion | COVERED | U-09, U-10, U-11, U-16 |
| S-6 | Microsoft Store listings named Selunara | The target platform; a same-named listing is a direct collision | COVERED | U-12 |
| S-7 | The word's meaning or origin in a dictionary | A descriptive or common word weakens the mark; a coined one is the strongest | COVERED | U-13 |

## Coverage notes (per dimension)

- D-1 (access): Justia, GitHub's REST search, the npm and PyPI searches, the RDAP servers, the TSDR status pages, Wiktionary's search and the Microsoft Store's JSON endpoint are public pages read without an account and all rendered. Four sources did not: the USPTO's own search, TMview and the WIPO Global Brand Database are JavaScript applications this transport cannot drive (the sibling project's captures; not retried, U-03, U-04); Google's page 2 answered with its request-verification page and then failed, and Bing answered with unrelated pages (U-15); and an RDAP 404 for an unregistered domain is an error page the kit does not keep (U-11). The npm scope's owner name has no search endpoint (U-14).
- D-4 (legality of the intended use): the use is a product name, so legality is trademark conflict and confusion with a current product; S-1 and S-2 carry the marks (U-01 to U-04) and S-3 the uses in trade (U-05).
- D-6 (freshness): every capture is dated 2026-10-12. The two SELUNA applications of Seluna Ltd are pending (one suspended, one set for publication on 2026-10-27, U-02), the .com and .ai holdings expire in 2027 (U-09, U-10), and new products appear daily; the brief says what to re-check before the name is adopted.
- D-8 (platform): the product is a Windows desktop app, so the Microsoft Store's own search is the platform check (U-12).
- D-9 (obtainability): what could not be read is a KNOWN-UNKNOWN with its manual step (U-03, U-04, U-11, U-14, U-15, U-16). Two parts of "done" were not reached for and were found missing in review after the budget was spent: company registers (U-17) and the TSDR records of the four variant filings whose goods do not begin with software (U-18); both are KNOWN-UNKNOWN with their manual step.
- D-2, D-3, D-5, D-7: dismissed with the reasons in the table.

## Candidate material

Gathered 2026-10-12.

_No material gathered - phase 0 ran as a dry run (`decompose.mjs --dry-run`), spending nothing; the sources were chosen from the sibling projects' plans (docs/research/2026-10-12-selenic-name-check/research/plan*.json and docs/research/2026-10-12-product-name-screen/research/plan*.json), which record which owner pages and endpoints rendered._
