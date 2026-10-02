# Sources

Every page this project has fetched, and what it was used for. `P` primary/official
carries the design, `S` secondary is context, `L` lead-only is a hint and never proof.

| URL | Type | Title | Retrieved | Used for |
|---|---|---|---|---|
| https://docs.github.com/en/rest/actions/artifacts | P | REST API endpoints for GitHub Actions artifacts - GitHub Docs | 2026-10-02 | U-01, U-02, U-03, U-04, U-05: list run artifacts, get an artifact, download an artifact (redirect, archive format), the artifact object and required permissions |
| https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts | P | Workflow artifacts - GitHub Docs | 2026-10-02 | U-02, U-05, U-06: what an artifact is, how it is stored and retained, and the limits the concept page states |
| https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts | P | Downloading workflow artifacts - GitHub Docs | 2026-10-02 | U-02: how artifacts are downloaded (UI, CLI, API) and in what container |
| https://raw.githubusercontent.com/actions/upload-artifact/main/README.md | P | readme-md | 2026-10-02 | U-04, U-06: the upload action's digest output, zip packaging, per-artifact size and per-job count limits |
| https://docs.github.com/en/actions/reference/limits | P | Actions limits - GitHub Docs | 2026-10-02 | U-06: the Actions limits reference (artifact size and count, storage) |
| https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions | P | GitHub Actions billing - GitHub Docs | 2026-10-02 | U-06: artifact storage quota per plan |
| https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api | P | Rate limits for the REST API - GitHub Docs | 2026-10-02 | U-07: primary and secondary rate limits for the REST calls the reconciler makes |
| https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api | P | Expired GitHub Actions artifacts no longer shown in UI and API - GitHub Changelog | 2026-10-02 | U-05: the owner's announcement that expired artifacts are no longer listed by the UI or the API - what a late reconciler sees |
| https://github.blog/changelog/2025-03-18-github-actions-now-supports-a-digest-for-validating-your-artifacts-at-runtime/ | P | GitHub Actions now supports a digest for validating your artifacts at runtime - GitHub Changelog | 2026-10-02 | U-04: the owner's announcement of the artifact digest - what it is computed over and who checks it |
