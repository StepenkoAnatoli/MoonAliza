# Brief - Downloading a GitHub Actions run's artifacts over the REST API: listing a run's artifacts, the download redirect and how long its URL lives, the ZIP the bytes arrive in, the artifact's digest, size and expiry, and the limits on artifact size and count

_Auto-drafted 2026-10-02 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require the reviewing agent's judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## Intent

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

## What we verified

| Claim | Source | Type |
|---|---|---|
| Artifacts are read through the REST API: a run's artifacts are listed with GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts (paged, at most 100 per page, filterable by `name`), one is read with GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}, and each object carries `id`, `name`, `size_in_bytes`, `expired`, `expires_at`, `digest` (`sha256:<hex>` in the example) and its `workflow_run`. The download is GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/zip: a 302 whose `Location` header holds the download URL, valid for one minute, and a 410 once the artifact is gone; the archive format must be `zip`. Anyone with read access may list; OAuth and classic tokens need the `repo` scope for a private repository, and a fine-grained token needs the "Actions" repository permission (read) to list and download, (write) only to delete. [quote: This URL expires after 1 minute.] | E-01 `docs.github.com` (U-01, U-02, U-03, U-04, U-05) | P |
| Artifacts are downloaded from the run's summary page, with `gh run download RUN_ID` (`-n NAME` for one or several by name), or over the REST API, and only before they expire. [quote: You can download archived artifacts before they automatically expire.] | E-03 `docs.github.com` (U-02, U-05) | P |
| upload-artifact (v7) zips what it uploads by default (`archive: true`; with `archive: false` one file is uploaded as it is and its name becomes the artifact's), takes `retention-days` within 1 to 90, and outputs `artifact-id`, `artifact-url` and `artifact-digest`, the SHA-256 digest of the artifact. The size shown for an artifact is the size of the zip the action creates during upload, and the Digest column is the SHA256 digest of what was uploaded - so the digest is over the zip the download returns. Limits: 500 artifacts per job, and the account's shared storage quota, recalculated every 6 to 12 hours; no per-artifact byte maximum is stated. [quote: Within an individual job, there is a limit of 500 artifacts that can be created for that job.] | E-04 `raw.githubusercontent.com` (U-02, U-04, U-05, U-06) | P |
| Since 2025-03-18 upload-artifact computes and stores a `digest` output, the SHA256 digest of the artifact uploaded during the run, and download-artifact recomputes it over the downloaded file and warns on a mismatch without failing the run. [quote: This is the SHA256 digest of the artifact uploaded during the run.] | E-09 `github.blog` (U-04) | P |
| An artifact is data a workflow shares between jobs and keeps after the run; GitHub's upload-artifact and download-artifact actions produce and consume them, and when a workflow run is deleted - from the UI, the REST API or the CLI - every artifact of that run is deleted from storage with it. [quote: When a workflow run is deleted all artifacts associated with the run are also deleted from storage.] | E-02 `docs.github.com` (U-05) | P |
| Since 2026-09-24 an expired artifact is no longer shown in the run summary nor returned by the REST API's list-artifacts and get-artifact endpoints; before, it stayed visible with an "Expired" pill after its files had been deleted from storage. The run's logs still name what it produced, and retention settings and billing are unchanged - so a reconciler that comes back late sees the artifact missing, not expired. [quote: Expired artifacts are no longer displayed in the GitHub Actions run summary or returned by the REST API.] | E-08 `github.blog` (U-05) | P |
| The Actions limits reference bounds artifact storage per plan for GitHub-hosted runners - 500 MB on GitHub Free, beside 2,000 minutes and 10 GB of cache - and states that GitHub Support cannot raise storage limits; it names no per-artifact size cap. [quote: GitHub Support **cannot** increase storage limits for GitHub Actions.] | E-05 `docs.github.com` (U-06) | P |
| For private repositories each account has a plan quota of free minutes, artifact storage and cache storage for GitHub-hosted runners; storage beyond it is billed on an hourly accrual, measured in GB-hours over the month, and minutes stay free for public repositories. [quote: Storage charges accrue every hour based on your actual usage throughout the month] | E-06 `docs.github.com` (U-06) | P |
| REST requests made with a user token count against that user's 5,000 requests per hour; an installation token gets the installation's limit of at least 5,000 per hour, GITHUB_TOKEN 1,000 per hour per repository, and an unauthenticated client 60; secondary limits bound concurrency and bursts on top. The storage URL a download redirects to is not api.github.com, and the page does not say whether fetching it counts. [quote: All of these requests count towards your personal rate limit of 5,000 requests per hour.] | E-07 `docs.github.com` (U-07) | P |

## Contradictions and how they were resolved

None between the sources on what they both state. Two things are worth saying so the
builder does not read a gap as a disagreement. First, the digest: the REST object carries
`digest` as `sha256:<hex>` (E-01, in the example - the page's response-schema field notes
are not rendered into the capture), the changelog says upload-artifact computes it over
the artifact uploaded during the run (E-09), and the action's README says the size shown
is the size of the zip the action creates and the Digest column is the digest of what was
uploaded (E-04). Read together, the digest is over the zip, which is what the download
returns, and nothing contradicts that - but no page says what the field holds for an
artifact uploaded without the action or before 2025-03-18, so the reconciler treats a
missing digest as "unverified", never as "verified". Second, expiry: the how-to says an
artifact can be downloaded until it expires (E-03), the REST download answers 410 once it
is gone (E-01), and since 2026-09-24 an expired artifact is neither listed nor returned by
get (E-08; the changelog names no status code - expect 404). These agree, and together
they mean a late reconciler meets an absent artifact, not an `expired: true` object.
Every unknown rests on the owner's pages, captured whole through Firecrawl. U-01, U-03 and
U-07 rest on one page each (the reference itself), which the gate flags as single-source.

## Known unknowns

- **U-08** - Must the one-minute download URL be fetched with the token, and does that fetch count against the REST rate limit?
  - Day-one verification: Day one, with MoonAliza's own run: GET the download endpoint, then fetch the `Location` URL once with and once without the Authorization header, comparing `x-ratelimit-remaining` before and after each; the owner's pages read here do not say (E-01, E-07)

## Decision

Build the download as the second half of the reconciler the sibling brief
(`2026-10-02-dispatched-run-reconciliation`) designed, binding the artifact's identity
before its bytes:

1. **Find the artifact by name under the run id.** `GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts?name=<name>`
   (E-01), with the run id the sibling's dispatch recorded; persist `id`, `size_in_bytes`,
   `expires_at` and `digest` with the job before any download. An empty list for a
   completed run is "gone" once `expires_at` would have passed or the run is older than
   the repository's retention (E-08, and the sibling's E-06); otherwise it is "not
   produced", and the run's conclusion and logs say why.
2. **Download in two requests, inside one minute.** `GET .../actions/artifacts/{id}/zip`
   with the token - a fine-grained token with Actions read, or a classic token with
   `repo` for a private repository - answers 302 with `Location` (E-01); fetch that URL
   at once, streaming to a temporary file, because it is valid for one minute, and read a
   410 as "expired between the list and the download". Until U-08 is verified on day one,
   send the token only to api.github.com: fetch the `Location` URL without it, retry once
   with it on 401 or 403, and record which worked.
3. **Verify the bytes before unpacking.** Compare the file's length with `size_in_bytes`
   and its SHA-256 with `digest` (E-01, E-04, E-09); a missing digest is "unverified", a
   mismatch is a failed download, never a warning. The file is the zip upload-artifact
   created (E-04); inside it is the Research-Kit artifact the workflow produced, which
   goes to the pinned validator untouched (integration review, item 6).
4. **Bound what the workflow uploads, and fetch it as part of the job.** 500 artifacts
   per job and the plan's storage quota - 500 MB on GitHub Free, billed hourly beyond it
   (E-04, E-05, E-06); one artifact per job with a short `retention-days` keeps storage
   flat, and the fetch belongs to the job because the artifact is gone at `expires_at`
   (E-03, E-08).
5. **Keep the catch-up inside the rate limit.** Two REST calls per artifact (list,
   download) on top of the sibling's polls, against 5,000 requests per hour for a user
   token (E-07); whether the `Location` fetch counts is U-08.

Out of scope: `download-artifact` inside workflows, artifact attestations, and GitHub
App installation tokens (MoonAliza uses a user token).

First build step: add the artifact fields (`id`, `size_in_bytes`, `expires_at`,
`digest`) to the dispatched-job record and the list-by-name call that fills them once a
run completes; write the test that asserts a completed job records its artifact's id and
digest before any download is attempted.

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "$HOME/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=bd8344550c5147f9 inputs=385e5a0639eaf411 gate=pass -->
