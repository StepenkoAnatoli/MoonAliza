# MAP - topic decomposition

## Topic

Reconciling a dispatched GitHub Actions run durably: finding the run a workflow_dispatch started, polling its status over the REST API, and how long its logs and artifacts stay available

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02. Public docs and an official REST API from the owner |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | COVERED | U-02, U-05. The token and permissions the endpoints require |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | COVERED | U-05. Polling cadence is bounded by the REST rate limits |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | DISMISSED | the REST API is used as its owner documents it; nothing is scraped or redistributed |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-02. The run object and its status values are the schema |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-03, U-04. Retention is the staleness that matters here |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | REST calls within the rate limit are not billed; the only cost is polling frequency, D-3 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-05. A desktop app polls under the same limits as any client |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01. The run id is the one output the reconciler cannot do without |

## Coverage notes (per dimension)

- D-1 access: every fact lives on docs.github.com or github.blog, the owner's own pages; no login wall.
- D-2 auth: the workflow-runs endpoints state the token scope they need (U-02); polling is read-only.
- D-3 rate limits: the REST rate-limit page is the one source (U-05); the collection itself is six page fetches.
- D-4 dismissed: using GitHub's REST API as documented is the intended use; nothing is scraped from third parties.
- D-5 schema: the run object's `status` and `conclusion` fields and their values (U-02).
- D-6 freshness: retention periods for logs, artifacts and the run record (U-03, U-04), including the 2026 change that extends retention to runs.
- D-7 dismissed: no per-call charge inside the rate limit.
- D-8 runtime: a desktop app is an ordinary REST client; the limit that binds it is D-3 (U-05).
- D-9 obtainability: whether the dispatch returns the run id (U-01) decides the whole design.

## Candidate material

Gathered 2026-10-02.

Likely owners of these facts (by how often a search pointed at them):

- `docs.github.com` (24)
- `stackoverflow.com` (5)
- `github.blog` (4)
- `github.com` (3)
- `getorchestra.io` (3)
- `github.com/universal-actions` (1)

Candidate pages:

- [Manually running a workflow - GitHub Docs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [REST API endpoints for GitHub Actions](https://docs.github.com/en/rest/actions)
- [Configuring the retention period for checks, workflow runs, commit ...](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization)
- [Managing workflow runs - GitHub Docs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs?tool=cli)
- [REST API endpoints for workflow runs - GitHub Docs](https://docs.github.com/en/rest/actions/workflow-runs)
- [Actions retention now covers checks, runs, and statuses](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses/)
- [Workflow Dispatch Action - GitHub Marketplace](https://github.com/marketplace/actions/workflow-dispatch-action)
- [GitHub - universal-actions/dispatch-workflow: Run a distinct workflow ...](https://github.com/universal-actions/dispatch-workflow)
- [Actions retention will cover checks, workflow runs, and statuses](https://github.blog/changelog/2026-08-27-actions-retention-will-cover-checks-workflow-runs-and-statuses/)
- [Workflow Run Dispatch · Actions · GitHub Marketplace · GitHub](https://github.com/marketplace/actions/workflow-run-dispatch)
- [Sync Action Status · Actions · GitHub Marketplace · GitHub](https://github.com/marketplace/actions/sync-action-status)
- [Unified retention for GitHub Actions checks, runs, and statuses ...](https://cloudninjas.ca/devops/unified-retention-for-github-actions-checks-runs-and-statuses-simplifies-cleanup-and-cost-management/)
- [Get run id after triggering a github workflow dispatch event](https://stackoverflow.com/questions/69479400/get-run-id-after-triggering-a-github-workflow-dispatch-event)
- [How can I trigger a `workflow_dispatch` from the GitHub API?](https://stackoverflow.com/questions/70151645/how-can-i-trigger-a-workflow-dispatch-from-the-github-api)
- [Managing GitHub Actions settings for a repository](https://docs.github.com/github/administering-a-repository/managing-repository-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-repository)
- [GitHub Actions: how can I run a workflow created on a non-'master ...](https://stackoverflow.com/questions/63362126/github-actions-how-can-i-run-a-workflow-created-on-a-non-master-branch-from-t)
- [How to rerun a GitHub Action workflow from the command line and have ...](https://stackoverflow.com/questions/76464269/how-to-rerun-a-github-action-workflow-from-the-command-line-and-have-the-status)
- [GitHub Pipelines Log Retention: The Default, the Override, and the ...](https://www.runxbuild.com/blog/github-pipelines-log-retention/)
- [Workflow dispatch API now returns run IDs - GitHub Changelog](https://github.blog/changelog/2026-02-19-workflow-dispatch-api-now-returns-run-ids/)
- [github_action: Troubleshooting the REST APILearn how to diagnose and ...](https://www.getorchestra.io/guides/githubaction-troubleshooting-the-rest-apilearn-how)

## Outlines seen in the material

_No outlines - none of these pages is captured yet. `--max-scrapes <n>` captures the first n; their headings appear here._

