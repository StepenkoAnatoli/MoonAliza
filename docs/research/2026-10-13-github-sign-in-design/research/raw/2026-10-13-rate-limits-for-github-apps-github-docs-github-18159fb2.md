---
url: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps
retrieved: 2026-10-13
command: firecrawl scrape https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: partial
omitted: only 1444 characters of main content were returned (below the 1500-character bar)
title: Rate limits for GitHub Apps - GitHub Docs
---
[Skip to main content](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps#main-content)

[Skip to content](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps#main-content)

Collapse sidebar

Expand sidebar

# Rate limits for GitHub Apps

Rate limits restrict the rate of traffic to GitHub.com, to help ensure consistent access for all users.

Copy markdown

GitHub sets a limit on the number of requests a GitHub App can make to the REST API within a specific time period. It also sets a limit on the point value of queries that a GitHub App can make to the GraphQL API within a specific time period. In addition to these primary rate limits, GitHub may also apply secondary rate limits. These limits help to prevent abuse and denial-of-service attacks, and ensure that the system remains available for all users.

The rate limit for GitHub Apps depends on whether the app authenticates with a user access token or an installation access token. It also depends on where the app is owned by or installed on a GitHub Enterprise Cloud organization.

For more information, see [Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) and [Rate limits and query limits for the GraphQL API](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api).
