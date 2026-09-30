# MAP - topic decomposition

## Topic

MoonAliza open gaps: accurate context accounting across providers, native SQLite in the packaged Electron app, Research Kit redistribution rights

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02, U-03. Provider HTTP APIs and public package/registry files |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | no credential decision is in question; MoonAliza already stores provider keys in its encrypted vault |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | COVERED | U-03. count_tokens is rate-limited per usage tier |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-05 (Research Kit has no license); U-04 (better-sqlite3 is MIT, E-13) |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-01, U-02. Usage fields per provider |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | DISMISSED | all facts are read at pinned versions (Ollama v0.34.4, Electron v44.4.5, better-sqlite3 v13.0.3); re-collect when a pin moves |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | COVERED | U-03. count_tokens is free |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-04, U-06. Electron 44 ABI 149, Node 24.21.0, Node-API prebuilds |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-02, U-03. Exact counts are obtainable after a response from every provider; before sending only from Anthropic |

## Coverage notes (per dimension)

Access, schema and output obtainability rest on each provider's own reference page
(E-01..E-05). Runtime rests on Electron's DEPS, the node-abi registry and better-sqlite3's
package.json at the pinned tag (E-06..E-08, E-12, E-13). Licensing rests on GitHub's own
licensing docs and the kit's repository page (E-10, E-11). The phase-0 search candidates
were forum and blog noise for this compound topic, so the plan named primary pages directly.

## Candidate material

Gathered 2026-09-28.

Likely owners of these facts (by how often a search pointed at them):

- `stackoverflow.com` (3)
- `electronjs.org` (3)
- `reddit.com` (2)
- `rxdb.info` (2)
- `scribd.com` (2)
- `fmacedoo.medium.com` (1)

Candidate pages:

- [Standalone application with Electron, React, and SQLite stack.](https://fmacedoo.medium.com/standalone-application-with-electron-react-and-sqlite-stack-9536a8b5a7b9)
- [I made a complete Electron + SQLite tutorial (from scratch to installer ...](https://www.reddit.com/r/electronjs/comments/1p39pr3/i_made_a_complete_electron_sqlite_tutorial_from/)
- [Electron Database - Storage adapters for SQLite, Filesystem and In-Memory](https://rxdb.info/electron-database.html)
- [How can I access the sqlite3 database file in production with electron?](https://stackoverflow.com/questions/46876930/how-can-i-access-the-sqlite3-database-file-in-production-with-electron)
- [https://dataverse.unc.edu/citation?persistentId=do...](https://dataverse.unc.edu/citation?persistentId=doi:10.15139/S3/5YQIWP)
- [Electron: Build cross-platform desktop apps with JavaScript ...](https://electronjs.org/)
- [Electron](https://en.wikipedia.org/wiki/Electron)
- [electron: Build cross-platform desktop apps with JavaScript ...](https://github.com/electron/electron)
- [Electron SQLite Database - Reactive Local Data with RxDB](https://rxdb.info/articles/electron-sqlite.html)
- [Electron | Coordinating DER value for an affordable grid](https://electron.net/)
- [Introduction | Electron](https://electronjs.org/docs/latest/)
- [Will Electron be still around and relevant for the next 7-8 ...](https://www.reddit.com/r/electronjs/comments/1j0rzxo/will_electron_be_still_around_and_relevant_for/)
- [How to connect to the database in a standalone Electron Angular app?](https://stackoverflow.com/questions/76003259/how-to-connect-to-the-database-in-a-standalone-electron-angular-app)
- [Linux Magazine: April 2025 Highlights | PDF](https://www.scribd.com/document/844523555/Linux-Magazine-USA-April-2025)
- [Full Circle Magazine](https://dl.fullcirclemagazine.org/issue227_en.pdf)
- [The 5 Best Coffee Scales For Making Coffee in 2019 – Page 244](https://www.baristaspace.com/blogs/baristaspace/the-5-best-coffee-scales-for-making-coffee-in-2019?comment=132477452358&page=244)
- [All Hacker News Evergreen Stories in Chronological Order](https://blog.contextly.com/2014/11/all-hacker-news-evergreen-stories-chronological-order/)
- [Books: augmented reality - Edward Betts](https://edwardbetts.com/monograph/augmented_reality)
- [Knowing and Doing: Computing Archives](https://www.cs.uni.edu/~wallingf/blog/archives/cat_1.html)
- [Linux format - 2020 Annual](https://dokumen.pub/linux-format-2020-annual.html)

Search failures - a map drafted from failed searches looks like a map of a quiet topic, so they are listed:

- `MoonAliza open gaps: accurate context accounting across providers, native SQLite in the packaged Electron app, Research Kit redistribution rights` on serpapi: SerpAPI did not answer within 30s - the request was abandoned; a retry may succeed - answered by the other provider

