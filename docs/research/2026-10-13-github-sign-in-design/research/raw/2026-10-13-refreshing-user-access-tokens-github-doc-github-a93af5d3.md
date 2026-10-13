---
url: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens
retrieved: 2026-10-13
command: firecrawl scrape https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Refreshing user access tokens - GitHub Docs
---
[Skip to main content](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens#main-content)

[Skip to content](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens#main-content)

Collapse sidebar

Expand sidebar

In this article

# Refreshing user access tokens

To enforce regular token rotation and reduce the impact of a compromised token, you can configure your GitHub App to use user access tokens that expire.

Copy markdown

## In this article

## [About user access tokens that expire](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens\#about-user-access-tokens-that-expire)

Note

User access tokens that expire are currently an optional feature and are subject to change. For more information, see [Expiring user-to-server access tokens for GitHub Apps](https://developer.github.com/changes/2020-04-30-expiring-user-to-server-access-tokens-for-github-apps).

To enforce regular token rotation and reduce the impact of a compromised token, you can configure your GitHub App to use user access tokens that expire. If your app uses user access tokens that expire, then you will receive a refresh token when you generate a user access token. The user access token expires after eight hours, and the refresh token expires after six months. For more information, see [Generating a user access token for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app).

You can use the refresh token to generate a new user access token and a new refresh token. Once you use a refresh token, that refresh token and the old user access token will no longer work.

If your refresh token expires before you use it, you can regenerate a user access token and refresh token by sending users through the web application flow or device flow. For more information, see [Generating a user access token for a GitHub App](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app).

To test and gradually roll out support for expiring tokens, you can opt in for an individual user authorization by requesting the `offline_access` scope. When you request `offline_access`, you will receive an expiring user access token and a refresh token even if your app is configured not to use expiring user access tokens.

The `scope` parameter does not grant permissions to a GitHub App. The only supported value is `offline_access`, which forces the user access token to expire.

## [Configuring your app to use user access tokens that expire](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens\#configuring-your-app-to-use-user-access-tokens-that-expire)

When you create your app, expiration of user access tokens is enabled unless you opt out. For more information, see [Registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app). You can also configure this setting after your app has been created.

1. In the upper-right corner of any page on GitHub, click your profile picture.

2. Navigate to your account settings.
   - For an app owned by a personal account, click **Settings**.
   - For an app owned by an organization:
     1. Click **Your organizations**.
     2. To the right of the organization, click **Settings**.
3. In the left sidebar, click **Developer settings**.

4. In the left sidebar, click **GitHub Apps**.

5. Next to the GitHub App that you want to modify, click **Edit**.

6. In the GitHub Apps settings sidebar, click **Optional Features**.

7. Next to "User-to-server token expiration", click **Opt-in** or **Opt-out**. This setting may take a couple of seconds to apply.

GitHub recommends that you opt in to this feature for improved security.


If you re-enable expiring user access tokens after you've already signed in users and gotten their access token, those pre-existing user access tokens will not expire. You should delete these tokens by using the `DELETE /applications/CLIENT_ID/token` endpoint or have the users reauthenticate so that they get an expiring token. For more information, see [REST API endpoints for OAuth authorizations](https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-token).

## [Refreshing a user access token with a refresh token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens\#refreshing-a-user-access-token-with-a-refresh-token)

1. Make a `POST` request to this URL, along with the following query parameters: `https://github.com/login/oauth/access_token`



| Query parameter | Type | Description |
| --- | --- | --- |
| `client_id` | `string` | **Required.** The client ID for your GitHub App. The client ID is different from the app ID. You can find the client ID on the settings page for your app. |
| `client_secret` | `string` | **Required** unless the user access token was generated using the device flow. The client secret for your GitHub App. |
| `grant_type` | `string` | **Required.** The value must be "refresh\_token". |
| `refresh_token` | `string` | **Required.** The refresh token that you received when you generated a user access token. |

2. GitHub will give a response that includes the following parameters:



| Response parameter | Type | Description |
| --- | --- | --- |
| `access_token` | `string` | The user access token. The token starts with `ghu_`. |
| `expires_in` | `integer` | The number of seconds until `access_token` expires. If the token doesn't expire, this parameter will be omitted. The value will always be `28800` (8 hours). |
| `refresh_token` | `string` | The refresh token. If the access token doesn't expire, this parameter will be omitted. The token starts with `ghr_`. |
| `refresh_token_expires_in` | `integer` | The number of seconds until `refresh_token` expires. If the access token doesn't expire, this parameter will be omitted. The value will always be `15897600` (6 months). |
| `scope` | `string` | The scopes that the token has. This value will always be an empty string. Unlike a traditional OAuth token, the user access token is limited to the permissions that both your app and the user have. |
| `token_type` | `string` | The type of token. The value will always be `bearer`. |
