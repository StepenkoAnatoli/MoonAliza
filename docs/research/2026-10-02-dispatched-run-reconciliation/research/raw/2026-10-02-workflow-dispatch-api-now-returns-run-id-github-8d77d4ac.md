---
url: https://github.blog/changelog/2026-02-19-workflow-dispatch-api-now-returns-run-ids/
retrieved: 2026-10-02
command: http-keyless scrape https://github.blog/changelog/2026-02-19-workflow-dispatch-api-now-returns-run-ids/
statusCode: 200
transport: http-keyless
completeness: full
title: Workflow dispatch API now returns run IDs - GitHub Changelog
---
[Back to changelog](https://github.blog/changelog/)









 Improvement




	February 19, 2026 •
 1 minute read



# Workflow dispatch API now returns run IDs



























 When you trigger a workflow using the [GitHub Actions workflow dispatch API endpoint](https://docs.github.com/rest/actions/workflows#create-a-workflow-dispatch-event), you’ll now have the option to receive metadata in the response that helps you map your request to the corresponding workflow run. Previously, this endpoint returned only a `204 No Content` status code. Now, you can pass in a new optional boolean parameter, `return_run_details`, which will return a `200 OK` response containing the workflow ID, API URL, and workflow URL. If you do not pass in this parameter, it will continue to return the current `204 No Content` status code.

 This capability is also supported within the GitHub CLI, as of [v2.87.0](https://github.com/cli/cli/releases/tag/v2.87.0). If you trigger a workflow dispatch via `gh workflow run`, GitHub CLI will now return the URL for the created run along with the `gh run view` command for viewing that run.

 With this update, developers can easily identify which workflow runs originated from their API calls—no more extensive polling or building custom tracking solutions. This new parameter is currently available in the API, and the newest version of the GitHub CLI will also default `return_run_details` to `true`.

 Learn more about the workflow dispatch API in the [GitHub Actions documentation](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch).











 [actions](https://github.blog/changelog/2026/?label=actions)
 [client apps](https://github.blog/changelog/2026/?label=client-apps)



 Share
 Copied
 Shared



 [Back to changelog](https://github.blog/changelog/)









## Related Posts







### Oct.01 Release


 [GitHub Copilot can now interact with desktop apps with computer use](https://github.blog/changelog/2026-10-01-github-copilot-can-now-interact-with-desktop-apps)



 [client apps](https://github.blog/changelog/2026/?label=client-apps)
 [copilot](https://github.blog/changelog/2026/?label=copilot)

 ...
 +1
















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






















## Subscribe to our developer newsletter


 Discover tips, technical guides, and best practices in our biweekly newsletter just for devs.







	[Back to top](#start-of-content)
