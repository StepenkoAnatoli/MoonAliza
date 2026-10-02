# Discovery Contract - Downloading a GitHub Actions run's artifacts over the REST API: listing a run's artifacts, the download redirect and how long its URL lives, the ZIP the bytes arrive in, the artifact's digest, size and expiry, and the limits on artifact size and count

Started 2026-10-02. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

MoonAliza's Stage E reconciler (docs/specification/research-kit-integration-review.md, item 2:
durable research jobs - dispatch correlation, polling, interrupted-run reconciliation,
artifact download) must fetch the Research-Kit artifact that a dispatched workflow run
uploaded, from a Windows desktop app that may have been closed and reopened since the
dispatch, and hand the bytes to the pinned offline validator. Done means a builder knows,
from the owner's pages: how a run's artifacts are listed and identified, how the bytes are
obtained (the endpoint, the redirect it answers with, how long that URL lives, and the
container the bytes arrive in), which token and permission that needs, what integrity field
the API offers to check the bytes against, when an artifact expires and what the API answers
afterwards, and the size, count and storage limits that bound what one run may upload. The
sibling project `2026-10-02-dispatched-run-reconciliation` closed dispatch, status polling,
retention of the run record and the polling rate limits; this one closes the download.

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
| U-01 | Which endpoint lists the artifacts of one run, and what does each artifact object carry (id, name, size, expiry, digest, run identity)? | The reconciler must find the artifact its job produced among a run's artifacts and record what identifies it; a wrong field set means a wrong or missing match. | CLOSED | E-01: list a run's artifacts by run id, filter by `name`, 100 per page; the object's `id`, `name`, `size_in_bytes`, `expired`, `expires_at`, `digest`, `workflow_run` |
| U-02 | How are an artifact's bytes obtained: the download endpoint, the redirect it answers with, how long the redirect URL stays valid, and the container format the bytes arrive in? | Decides whether the download is one request or two, how quickly the second must follow the first, and what the app must unpack before validation. | CLOSED | E-01, E-03, E-04: GET .../artifacts/{id}/zip answers 302 with a `Location` URL valid for one minute (410 once gone); the bytes are the zip upload-artifact made at upload |
| U-03 | Which token and permission does listing and downloading need, for a public and a private repository? | Fixes the credential the app holds for the job. | CLOSED | E-01: read access to list; `repo` scope for OAuth and classic tokens on a private repository; a fine-grained token with "Actions" repository permission (read), (write) only to delete |
| U-04 | Does the API expose a content digest for the artifact, and over which bytes is it computed? | A digest the app can verify is the difference between trusting the transport and verifying the bytes before the validator runs. | CLOSED | E-01, E-09, E-04: the object's `digest` is `sha256:<hex>`, computed by upload-artifact at upload over the zip it created - the same bytes the download returns |
| U-05 | When does an artifact expire, what sets that period, and what does the API return for an expired or deleted artifact? | Sets the deadline the reconciler must meet after a run completes, and how it tells "expired" from "never existed". | CLOSED | E-01, E-03, E-04, E-02, E-08: `expires_at` per artifact, set by `retention-days` (1 to 90) or the repository default; download answers 410 once gone; since 2026-09-24 expired artifacts are not listed; a deleted run deletes its artifacts |
| U-06 | What limits bound an artifact: maximum size per artifact, artifacts per run or job, and the storage quota the account pays against? | The producer side is MoonAliza's own workflow; a package over a limit is never downloadable, so the limits shape what the workflow may upload. | CLOSED | E-04, E-05, E-06: 500 artifacts per job; artifact storage per plan (500 MB on GitHub Free), billed hourly in GB-hours beyond the quota; no per-artifact byte maximum is stated by the owner's pages |
| U-07 | Which rate limits apply to listing and downloading artifacts with a user token? | Caps the cadence of a reconciler that may have many jobs to catch up on after a restart. | CLOSED | E-07: 5,000 requests per hour per user token; GITHUB_TOKEN 1,000 per hour per repository; secondary limits on bursts |
| U-08 | Must the one-minute download URL be fetched with the token, and does that fetch count against the REST rate limit? | Decides whether the token may travel to a host other than api.github.com, and whether a catch-up of many artifacts spends the hourly budget twice. | KNOWN-UNKNOWN | Day one, with MoonAliza's own run: GET the download endpoint, then fetch the `Location` URL once with and once without the Authorization header, comparing `x-ratelimit-remaining` before and after each; the owner's pages read here do not say (E-01, E-07) |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

Locked decisions for this project. Do not revisit these without the human.

- Collection is keyless (`http-keyless`, the machine's transport) and spends nothing;
  the owner's pages are named directly in `research/plan.json` after phase 0.
- The sibling project's closures (dispatch, run status, run-record retention, polling
  limits) are not repeated here, except the rate-limit page, re-captured so this corpus
  stands alone.
- MoonAliza's own workflow produces the artifact with the Research Kit's `collect.yml`;
  the producer side's upload action is read for its limits only.
