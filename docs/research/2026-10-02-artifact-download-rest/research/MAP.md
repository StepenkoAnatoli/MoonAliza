# MAP - topic decomposition

## Topic

Downloading a GitHub Actions run's artifacts over the REST API: listing a run's artifacts, the download redirect and how long its URL lives, the ZIP the bytes arrive in, the artifact's digest, size and expiry, and the limits on artifact size and count

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | COVERED | U-03, U-08 |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | COVERED | U-07, U-08 |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | DISMISSED | MoonAliza downloads artifacts its own workflow uploaded to the user's own repository, through the REST endpoint GitHub documents for exactly that; the GitHub Terms govern it as they govern every other REST call this product already makes, and nothing in this question changes that |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-01, U-04 |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-05 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | COVERED | U-06 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-02, U-06 |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-02, U-04, U-05 |
| T-1 | Behaviour after expiry or deletion | A reconciler that comes back late must tell an expired artifact from one that never existed, and must not retry a download that can never succeed | COVERED | U-05 |

## Coverage notes (per dimension)

- **D-1 Access model**: the artifacts are behind GitHub's REST API, an official API with
  documented endpoints; U-01 and U-02 name the list and download calls and the redirect
  the download answers with.
- **D-2 Auth and credentials**: U-03 asks which token and permission the calls need; whether
  the redirect target takes the token at all is U-08, a known unknown with its day-one step.
- **D-3 Rate limits and quotas**: U-07 re-captures the REST rate-limit page so the
  reconciler's catch-up cadence rests on this corpus, not the sibling's; whether the redirected
  download counts is U-08.
- **D-4 ToS, licensing, legality**: dismissed - the product reads its own repository's
  artifacts through the documented endpoint; no new term applies.
- **D-5 Data schema and its stability**: U-01 pins the artifact object's fields and U-04
  the digest field's presence and absence; GitHub versions the REST API by date header.
- **D-6 Freshness and staleness**: U-05 - an artifact expires on a retention clock, and
  the reconciler's deadline is that clock.
- **D-7 Cost at expected volume**: U-06 - storage is the cost; artifacts count against the
  plan's storage quota until they expire.
- **D-8 Runtime and platform limits**: U-02 and U-06 - the bytes arrive as one container
  whose size is bounded by the per-artifact limit; the app unpacks it on Windows.
- **D-9 Output obtainability**: U-02, U-04 and U-05 - the bytes can be fetched before
  expiry, and a digest exists to verify them against.
- **T-1 Behaviour after expiry**: U-05.

## Candidate material

Gathered 2026-10-02.

Likely owners of these facts (by how often a search pointed at them):

- `docs.github.com` (16)
- `getorchestra.io` (6)
- `stackoverflow.com` (5)
- `learn.microsoft.com` (2)
- `tryapis.com` (2)
- `mlflow.org` (2)

Candidate pages:

- [Workflow artifacts - GitHub Docs](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)
- [REST API endpoints for GitHub Actions artifacts](https://docs.github.com/en/rest/actions/artifacts)
- [github - Downloading an artifact from actions on someone else's ...](https://stackoverflow.com/questions/67232445/downloading-an-artifact-from-actions-on-someone-elses-repository)
- [Futures Contract Specifications Explained: Size, Tick Value and Expiry](https://www.ironcladresearch.com/learn/futures/contract-specifications)
- [az pipelines runs artifact | Microsoft Learn](https://learn.microsoft.com/en-us/cli/azure/pipelines/runs/artifact?view=azure-cli-latest)
- [Why does Github actions rest API download artifacts by creating a ...](https://stackoverflow.com/questions/72919393/why-does-github-actions-rest-api-download-artifacts-by-creating-a-temporary-url)
- [Download artifacts from a different GitHub repo with gh cli](https://stackoverflow.com/questions/79542168/download-artifacts-from-a-different-github-repo-with-gh-cli)
- [Futures Contract Specifications](https://learn.optimusfutures.com/contract-specifications-and-values)
- [List artifacts using @actions/artifact - GitHub](https://github.com/actions/toolkit/issues/379)
- [REST API endpoints for GitHub Actions](https://docs.github.com/en/rest/actions)
- [Can you download one file in an artifact with GitHub Actions?](https://devops.stackexchange.com/questions/20050/can-you-download-one-file-in-an-artifact-with-github-actions)
- [F&O Lot Sizes & Expiry Dates 2026 (Nifty, Bank Nifty, Sensex)](https://onetradejournal.com/fno-lot-size-expiry-calendar)
- [List workflow run artifacts | Needle](https://needle.app/resources/connectors/github/tools/list_workflow_run_artifacts)
- [Downloading workflow artifacts - GitHub Docs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)
- [Batch Code Checker (Updated 2026) - Cosmetic Calculator](https://batchcode.org/)
- [az pipelines runs | Microsoft Learn](https://learn.microsoft.com/en-us/cli/azure/pipelines/runs?view=azure-cli-latest)
- [GitHub API | Download an artifact - tryapis.com](https://tryapis.com/github/api/actions-download-artifact/)
- [Food Product Dating - Food Safety and Inspection Service](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/food-product-dating)
- [Github Actions API: List artifacts for a repository - Orchestra](https://www.getorchestra.io/guides/github-actions-api-list-artifacts-for-a-repository)
- [How to Download GitHub Actions Artifacts - GeeksforGeeks](https://www.geeksforgeeks.org/devops/download-github-actions-artifacts/)

Search failures - a map drafted from failed searches looks like a map of a quiet topic, so they are listed:

- `Downloading a GitHub Actions run's artifacts over the REST API the artifact's digest` on http-keyless: DuckDuckGo served its bot check instead of results - the keyless search was refused from this network; retry later, or use a keyed search provider
- `Downloading a GitHub Actions run's artifacts over the REST API the limits on artifact size and count` on http-keyless: DuckDuckGo served its bot check instead of results - the keyless search was refused from this network; retry later, or use a keyed search provider

## Outlines seen in the material

_No outlines - none of these pages is captured yet. `--max-scrapes <n>` captures the first n; their headings appear here._

