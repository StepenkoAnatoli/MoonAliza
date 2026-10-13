---
url: https://docs.github.com/en/apps/using-github-apps/approving-updated-permissions-for-a-github-app
retrieved: 2026-10-13
command: firecrawl scrape https://docs.github.com/en/apps/using-github-apps/approving-updated-permissions-for-a-github-app --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Approving updated permissions for a GitHub App - GitHub Docs
---
[Skip to main content](https://docs.github.com/en/apps/using-github-apps/approving-updated-permissions-for-a-github-app#main-content)

[Skip to content](https://docs.github.com/en/apps/using-github-apps/approving-updated-permissions-for-a-github-app#main-content)

Collapse sidebar

Expand sidebar

# Approving updated permissions for a GitHub App

When a GitHub App requests additional permissions, you can review what behavior the permissions will enable and decide whether to approve the permissions.

Copy markdown

Occasionally, a GitHub App that you have installed will request additional permissions. This may happen if the GitHub App owner wants the app to make additional API requests or respond to additional webhook events. For more information about what different permissions enable a GitHub App to do, see [Choosing permissions for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app).

When a GitHub App requests additional permissions, GitHub will notify you if the app is installed on your personal account or on an account that you own.

You can choose whether to accept the additional permissions. If you do not approve the additional permissions, the GitHub App will still retain its current permissions. The GitHub App may not function as expected if you do not approve the additional permissions.

If the app is authorized but not installed or if the GitHub App only requested additional account permissions, GitHub will not notify you. Instead, the GitHub App will prompt you to reauthorize the app in order to enable the new account permissions. For more information, see [Authorizing GitHub Apps](https://docs.github.com/en/apps/using-github-apps/authorizing-github-apps).
