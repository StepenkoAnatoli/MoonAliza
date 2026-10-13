# MAP - topic decomposition

## Topic

What does a GitHub App device-flow sign-in in the MoonAliza Electron app need on GitHub's side to read a user's private repositories read-only, refresh and end its tokens, and stay within GitHub's limits?

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-2, U-7, U-10 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | COVERED | U-1, U-3, U-4, U-5, U-8, U-14 |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | COVERED | U-12 (user-token limits for GitHub Apps, with the numbers from the prior project docs/research/2026-10-12-app-sign-in, its E-08), U-16 (device-flow cap per app: KNOWN-UNKNOWN with a day-one step) |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-8, U-11 (who may install the app, and where); whether GitHub allows a desktop app to sign users in at all was closed by the prior project (its U-1, U-2: allowed, documented for desktop apps) |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-3, U-4, U-6 |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-4, U-5 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | Reason: the design uses no paid GitHub plan feature; the constraints at volume are the user's shared hourly REST limit (U-12) and, if it counts per app, the device-flow cap on sign-ins (U-16), neither of which is a price |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-3, U-8 (a desktop app with no web server and no shipped client secret) |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-1, U-2, U-7, U-15 |
| S-1 | Endpoint surface and versioning | Which endpoints carry the facts, and what a version bump does to them | COVERED | U-2, U-5, U-7, U-15 (endpoints); U-9 (API version 2022-11-28 supported until March 10, 2028) |
| S-2 | Pagination and result caps | What the API refuses to return in one call, and what that costs at volume | DISMISSED | Reason: signing in changes who may read, not how much one call returns; read_github already bounds directory listings (1,000 entries) and files (256 KiB) for public repositories, and the installation listings (U-2) are ordinary paginated lists |
| S-3 | Error and retry semantics | Which failures are retryable, and what backoff the provider actually requires | COVERED | U-3, U-4, U-10, U-12, U-16 |
| S-4 | SDK vs raw HTTP | Whether an official client exists, what it hides, and whether it is maintained | DISMISSED | Reason: not a blocking fact - the device flow and refresh are plain form POSTs and read_github already calls the REST API over raw fetch; choosing a client library is a build decision, not a GitHub-side fact |
| T-1 | Token formats for validating the token response | MoonAliza checks the shape of GitHub's token response before storing it; its secret screen is exact-value vault redaction, which needs each token stored as its own vault value, not a prefix list | COVERED | U-6 |
| T-2 | Installation and repository reach | A GitHub App user token reads only where the app is installed; the UI must show and extend that reach, and explain a failed private read | COVERED | U-2, U-10, U-11 |
| T-3 | Ending a sign-in | Sign-out, user revocation on GitHub, and GitHub's own expiry and revocation decide the token lifecycle | COVERED | U-5, U-13 |
| T-4 | App registration settings | The registration is made once by hand and fixes the flow, expiry, webhook and who can install | COVERED | U-1, U-8, U-11, U-14 |
| T-5 | Cloning private repositories over git with the user token | Another way to read code | DISMISSED | Reason: out of scope - read_github reads through the REST API and its tool description excludes cloning; nothing in this design clones |

## Coverage notes (per dimension)

- D-1, D-9, S-1: every fact sits on GitHub's public documentation (docs.github.com); the product reaches GitHub through the REST API with a GitHub App user access token, and U-2, U-7 and U-15 decide which repositories and endpoints that token reaches; U-10 what a failed private read returns. The captures' request examples send API version 2026-03-10 while read_github sends 2022-11-28, which U-9 (closed in round 2) shows is supported until March 10, 2028.
- D-2, D-8, T-4: the credential is a GitHub App user access token from the device flow, with no client secret in the desktop binary (prior brief); U-1, U-3, U-4, U-5, U-8 and U-14 settle the permissions, the flow, refresh, revocation, the registration and later permission changes.
- D-3: covered in round 2 (round 1 dismissed it on the prior project's rows): U-12 ties the user-token limits to GitHub Apps; U-16 carries the device-flow cap, stated only for OAuth apps, as KNOWN-UNKNOWN. D-7 stays dismissed with the reason above.
- D-4: GitHub documents this use for desktop apps (prior project U-1); what remains here is who can install the app and where (U-8, U-11).
- D-5, D-6, S-3: token response fields, prefixes, lifetimes and error codes (U-3, U-4, U-6); revocation and expiry (U-5); failed reads and rate-limit responses (U-10, U-12).
- T-1..T-3: added for this topic: token-response shape, installation reach and sign-out (U-13 gives the place on GitHub). T-5 (git clone) is out of scope.
