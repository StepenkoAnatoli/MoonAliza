---
url: https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api/
retrieved: 2026-10-02
command: http-keyless scrape https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api
statusCode: 200
transport: http-keyless
completeness: full
title: Expired GitHub Actions artifacts no longer shown in UI and API - GitHub Changelog
---
[Back to changelog](https://github.blog/changelog/)









 Improvement




	September 24, 2026 •
 1 minute read



# Expired GitHub Actions artifacts no longer shown in UI and API



























 Expired artifacts are no longer displayed in the GitHub Actions run summary or returned by the REST API. Previously, an expired artifact remained visible with an “Expired” pill, even though the underlying files had already been deleted from storage.

 That leftover pill left some users unsure whether they were still being billed for storing artifacts that no longer existed. To remove that ambiguity, expired artifacts will not be shown when viewing run data, including:



- The list of artifacts on a workflow run summary page.

- The [list artifacts for a repository](https://docs.github.com/rest/actions/artifacts#list-artifacts-for-a-repository) and [get an artifact](https://docs.github.com/rest/actions/artifacts#get-an-artifact) REST API endpoints.

 If you need to know which artifacts a workflow run produced after they’ve expired, you can still find that information in the run’s logs. This change doesn’t affect artifact retention settings or billing—it only changes how expired artifacts are displayed.











 [actions](https://github.blog/changelog/2026/?label=actions)



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
















### Sep.10 Improvement


 [Control GitHub Actions cache access with cache-mode](https://github.blog/changelog/2026-09-10-control-github-actions-cache-access-with-cache-mode)



 [actions](https://github.blog/changelog/2026/?label=actions)
 [application security](https://github.blog/changelog/2026/?label=application-security)
 [supply chain security](https://github.blog/changelog/2026/?label=supply-chain-security)

 ...
 +2






















## Subscribe to our developer newsletter


 Discover tips, technical guides, and best practices in our biweekly newsletter just for devs.







	[Back to top](#start-of-content)
