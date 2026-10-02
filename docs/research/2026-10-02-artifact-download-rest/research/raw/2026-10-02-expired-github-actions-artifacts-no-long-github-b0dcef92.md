---
url: https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api
retrieved: 2026-10-02
command: firecrawl scrape https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Expired GitHub Actions artifacts no longer shown in UI and API - GitHub Changelog
---
[Back to changelog](https://github.blog/changelog/)

Expired artifacts are no longer displayed in the GitHub Actions run summary or returned by the REST API. Previously, an expired artifact remained visible with an “Expired” pill, even though the underlying files had already been deleted from storage.

That leftover pill left some users unsure whether they were still being billed for storing artifacts that no longer existed. To remove that ambiguity, expired artifacts will not be shown when viewing run data, including:

- The list of artifacts on a workflow run summary page.
- The [list artifacts for a repository](https://docs.github.com/rest/actions/artifacts#list-artifacts-for-a-repository) and [get an artifact](https://docs.github.com/rest/actions/artifacts#get-an-artifact) REST API endpoints.

If you need to know which artifacts a workflow run produced after they’ve expired, you can still find that information in the run’s logs. This change doesn’t affect artifact retention settings or billing—it only changes how expired artifacts are displayed.

## Related Posts

### Oct.01Retired

[GitHub Actions: macOS 14 runner image retirement](https://github.blog/changelog/2026-10-01-github-actions-macos-14-runner-image-retirement)

[actions](https://github.blog/changelog/2026/?label=actions)

### Oct.01Retired

[Actions retention now covers checks, runs, and statuses](https://github.blog/changelog/2026-10-01-actions-retention-now-covers-checks-runs-and-statuses)

[actions](https://github.blog/changelog/2026/?label=actions)

### Oct.01Release

[Actions Runner Controller release 0.15.0](https://github.blog/changelog/2026-10-01-actions-runner-controller-release-0-15-0)

[actions](https://github.blog/changelog/2026/?label=actions)

### Sep.28Retired

[Self-hosted runner version enforcement date has moved](https://github.blog/changelog/2026-09-28-self-hosted-runner-version-enforcement-date-has-moved)

[actions](https://github.blog/changelog/2026/?label=actions)

### Sep.25Improvement

[Changes to query results in the GitHub Actions API and UI](https://github.blog/changelog/2026-09-25-changes-to-query-results-in-the-github-actions-api-and-ui)

[actions](https://github.blog/changelog/2026/?label=actions)

### Sep.23Retired

[Node 20 is no longer available in GitHub Actions](https://github.blog/changelog/2026-09-23-node-20-is-no-longer-available-in-github-actions)

[actions](https://github.blog/changelog/2026/?label=actions)

### Sep.17Improvement

[Ubuntu 26 generally available and latest migration](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration)

[actions](https://github.blog/changelog/2026/?label=actions)

### Sep.17Release

[Workflow execution protections in GitHub Actions generally available](https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available)

[actions](https://github.blog/changelog/2026/?label=actions) [supply chain security](https://github.blog/changelog/2026/?label=supply-chain-security)...
+1

### Sep.10Improvement

[Control GitHub Actions cache access with cache-mode](https://github.blog/changelog/2026-09-10-control-github-actions-cache-access-with-cache-mode)

[actions](https://github.blog/changelog/2026/?label=actions) [application security](https://github.blog/changelog/2026/?label=application-security) [supply chain security](https://github.blog/changelog/2026/?label=supply-chain-security)...
+2

## Subscribe to our developer newsletter

Discover tips, technical guides, and best practices in our biweekly newsletter just for devs.

Enter your email\*
Subscribe

By submitting, I agree to let GitHub and its affiliates use my information for personalized communications, targeted advertising, and campaign effectiveness. See the [GitHub Privacy Statement](https://github.com/site/privacy) for more details.

[Back to top](https://github.blog/changelog/2026-09-24-expired-github-actions-artifacts-no-longer-shown-in-ui-and-api/#start-of-content)

×
