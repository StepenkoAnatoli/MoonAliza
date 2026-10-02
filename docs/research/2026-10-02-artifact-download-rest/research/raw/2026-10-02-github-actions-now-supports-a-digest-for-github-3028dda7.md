---
url: https://github.blog/changelog/2025-03-18-github-actions-now-supports-a-digest-for-validating-your-artifacts-at-runtime/
retrieved: 2026-10-02
command: http-keyless scrape https://github.blog/changelog/2025-03-18-github-actions-now-supports-a-digest-for-validating-your-artifacts-at-runtime/
statusCode: 200
transport: http-keyless
completeness: full
title: GitHub Actions now supports a digest for validating your artifacts at runtime - GitHub Changelog
---
[Back to changelog](https://github.blog/changelog/)









 Improvement




	March 18, 2025 •
 1 minute read



# GitHub Actions now supports a digest for validating your artifacts at runtime





















## Table of Contents





- [How it works](#how-it-works)

- [Where can I view the digest?](#where-can-i-view-the-digest)

- [Learn more](#learn-more)




 Menu. Currently selected: How it works











- [How it works](#how-it-works)

- [Where can I view the digest?](#where-can-i-view-the-digest)

- [Learn more](#learn-more)





















 Developers using [upload-artifact](https://github.com/actions/upload-artifact) and [download-artifact](https://github.com/actions/download-artifact) in their Actions workflows can now ensure the integrity of their artifacts with the new SHA256 digest. This feature automatically verifies that the artifact uploaded is identical to the one downloaded, providing security for Actions runs and ensuring the artifact remains unchanged.

## [How it works](#how-it-works)

 Whenever `upload-artifact` is used, it now computes and stores an output called `digest`. This is the SHA256 digest of the artifact uploaded during the run.

 When `download-artifact` is used to download that same artifact, it uses the same process to compute a digest for the downloaded file and compares the two digests to validate that they match.

 If a mismatch is detected, the run displays a warning in the UI and in the job logs. The workflow won’t fail if the digests don’t match, but this may change in a future release.

 **Note:** This functionality is only available with artifacts v4 or newer. It’s also not currently available on GitHub Enterprise Server.

## [Where can I view the digest?](#where-can-i-view-the-digest)

 The digest will appear in the logs of the workflow run under the “upload-artifact” step. They’ll also appear in the Artifact output that appears in the workflow run UI.

## [Learn more](#learn-more)

 To get started using the artifacts actions view our documentation on [storing and sharing data from a workflow](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow#downloading-or-deleting-artifacts).








## Table of Contents





- [How it works](#how-it-works)

- [Where can I view the digest?](#where-can-i-view-the-digest)

- [Learn more](#learn-more)




 Menu. Currently selected: How it works











- [How it works](#how-it-works)

- [Where can I view the digest?](#where-can-i-view-the-digest)

- [Learn more](#learn-more)


















 [actions](https://github.blog/changelog/2025/?label=actions)



 Share
 Copied
 Shared



 [Back to changelog](https://github.blog/changelog/)









## Related Posts







### Oct.01 Retired


 [GitHub Actions: macOS 14 runner image retirement](https://github.blog/changelog/2026-10-01-github-actions-macos-14-runner-image-retirement)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Oct.01 Retired


 [Actions retention now covers checks, runs, and statuses](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Oct.01 Release


 [Actions Runner Controller release 0.15.0](https://github.blog/changelog/2026-10-01-actions-runner-controller-release-0-15-0)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Sep.28 Retired


 [Self-hosted runner version enforcement date has moved](https://github.blog/changelog/2026-09-28-self-hosted-runner-version-enforcement-date-has-moved)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Sep.25 Improvement


 [Changes to query results in the GitHub Actions API and UI](https://github.blog/changelog/2026-09-25-changes-to-query-results-in-the-github-actions-api-and-ui)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Sep.24 Improvement


 [Expired GitHub Actions artifacts no longer shown in UI and API](https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Sep.23 Retired


 [Node 20 is no longer available in GitHub Actions](https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Sep.17 Improvement


 [Ubuntu 26 generally available and latest migration](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration)



 [actions](https://github.blog/changelog/2026/?label=actions)
















### Sep.17 Release


 [Workflow execution protections in GitHub Actions generally available](https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available)



 [actions](https://github.blog/changelog/2026/?label=actions)
 [supply chain security](https://github.blog/changelog/2026/?label=supply-chain-security)

 ...
 +1






















## Subscribe to our developer newsletter


 Discover tips, technical guides, and best practices in our biweekly newsletter just for devs.







	[Back to top](#start-of-content)
