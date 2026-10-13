---
url: https://docs.github.com/en/rest/apps/oauth-applications
retrieved: 2026-10-13
command: firecrawl scrape https://docs.github.com/en/rest/apps/oauth-applications --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: REST API endpoints for OAuth authorizations - GitHub Docs
---
[Skip to main content](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10#main-content)

[Skip to content](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10#main-content)

Collapse sidebar

Expand sidebar

In this article

The REST API is now versioned.For more information, see " [About API versioning](https://docs.github.com/rest/overview/api-versions)."

# REST API endpoints for OAuth authorizations

Use the REST API to interact with OAuth apps and OAuth authorizations of GitHub Apps

## [About OAuth apps and OAuth authorizations of GitHub Apps](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#about-oauth-apps-and-oauth-authorizations-of-github-apps)

You can use these endpoints to manage the OAuth tokens that OAuth apps or GitHub Apps use to access people's accounts on GitHub.

Tokens for OAuth apps have the prefix `gho_`, while OAuth tokens for GitHub Apps, used for authenticating on behalf of the user, have the prefix `ghu_`. You can use the following endpoints for both types of OAuth tokens.

## [Delete an app authorization](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-authorization)

OAuth and GitHub application owners can revoke a grant for their application and a specific user. You must provide a valid OAuth `access_token` as an input parameter and the grant for the token's owner will be deleted.
Deleting an application's grant will also delete all OAuth tokens associated with the application for the user. Once deleted, the application will have no access to the user's account and will no longer be listed on [the application authorizations settings screen within GitHub](https://github.com/settings/applications#authorized).

### [Basic authentication for "Delete an app authorization"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-authorization--basic-authentication)

You must use [Basic Authentication](https://docs.github.com/rest/authentication/authenticating-to-the-rest-api#using-basic-authentication) to use this endpoint. Use the application's `client_id` as the username and the `client_secret` as the password.

### [Parameters for "Delete an app authorization"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-authorization--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `client_id`stringRequired<br>The client ID of the GitHub app. |

Path parameters

| Name, Type, Description |
| --- |
| `access_token`stringRequired<br>The OAuth access token used to authenticate to the GitHub API. |

Body parameters

### [HTTP response status codes for "Delete an app authorization"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-authorization--status-codes)

| Status code | Description |
| --- | --- |
| `204` | No Content |
| `422` | Validation failed, or the endpoint has been spammed. |

### [Code samples for "Delete an app authorization"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-authorization--code-samples)

#### Request example

delete/applications/{client\_id}/grant

- cURL

- JavaScript


Copy to clipboard curl request example

`curl -L \
  -X DELETE \
  -H "Accept: application/vnd.github+json" \
  -u "<YOUR_CLIENT_ID>:<YOUR_CLIENT_SECRET>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/applications/Iv1.8a61f9b3a7aba766/grant \
  -d '{"access_token":"e72e16c7e42f292c6912e7710c838347ae178b4a"}'`

#### Response

`Status: 204`

## [Check a token](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#check-a-token)

OAuth applications and GitHub applications with OAuth authorizations can use this API method for checking OAuth token validity without exceeding the normal rate limits for failed login attempts. Authentication works differently with this particular endpoint. Invalid tokens will return `404 NOT FOUND`.

### [Basic authentication for "Check a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#check-a-token--basic-authentication)

You must use [Basic Authentication](https://docs.github.com/rest/authentication/authenticating-to-the-rest-api#using-basic-authentication) to use this endpoint. Use the application's `client_id` as the username and the `client_secret` as the password.

### [Parameters for "Check a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#check-a-token--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `client_id`stringRequired<br>The client ID of the GitHub app. |

Path parameters

| Name, Type, Description |
| --- |
| `access_token`stringRequired<br>The access\_token of the OAuth or GitHub application. |

Body parameters

### [HTTP response status codes for "Check a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#check-a-token--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `404` | Resource not found |
| `422` | Validation failed, or the endpoint has been spammed. |

### [Code samples for "Check a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#check-a-token--code-samples)

#### Request example

post/applications/{client\_id}/token

- cURL

- JavaScript


Copy to clipboard curl request example

`curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -u "<YOUR_CLIENT_ID>:<YOUR_CLIENT_SECRET>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/applications/Iv1.8a61f9b3a7aba766/token \
  -d '{"access_token":"e72e16c7e42f292c6912e7710c838347ae178b4a"}'`

#### Response

- Example response

- Response schema


`Status: 200`

`{
"id": 1,
"url": "https://api.github.com/authorizations/1",
"scopes": [\
    "public_repo",\
    "user"\
],
"token": "ghu_16C7e42F292c6912E7710c838347Ae178B4a",
"token_last_eight": "Ae178B4a",
"hashed_token": "25f94a2a5c7fbaf499c665bc73d67c1c87e496da8985131633ee0a95819db2e8",
"app": {
    "url": "https://example.com",
    "name": "my github app",
    "client_id": "Iv1.8a61f9b3a7aba766"
},
"note": "optional note",
"note_url": "http://optional/note/url",
"updated_at": "2011-09-06T20:39:23Z",
"created_at": "2011-09-06T17:26:27Z",
"fingerprint": "jklmnop12345678",
"expires_at": "2011-09-08T17:26:27Z",
"user": {
    "login": "octocat",
    "id": 1,
    "node_id": "MDQ6VXNlcjE=",
    "avatar_url": "https://github.com/images/error/octocat_happy.gif",
    "gravatar_id": "",
    "url": "https://api.github.com/users/octocat",
    "html_url": "https://github.com/octocat",
    "followers_url": "https://api.github.com/users/octocat/followers",
    "following_url": "https://api.github.com/users/octocat/following{/other_user}",
    "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
    "organizations_url": "https://api.github.com/users/octocat/orgs",
    "repos_url": "https://api.github.com/users/octocat/repos",
    "events_url": "https://api.github.com/users/octocat/events{/privacy}",
    "received_events_url": "https://api.github.com/users/octocat/received_events",
    "type": "User",
    "site_admin": false
}
}`

## [Reset a token](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#reset-a-token)

OAuth applications and GitHub applications with OAuth authorizations can use this API method to reset a valid OAuth token without end-user involvement. Applications must save the "token" property in the response because changes take effect immediately. Invalid tokens will return `404 NOT FOUND`.

### [Basic authentication for "Reset a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#reset-a-token--basic-authentication)

You must use [Basic Authentication](https://docs.github.com/rest/authentication/authenticating-to-the-rest-api#using-basic-authentication) to use this endpoint. Use the application's `client_id` as the username and the `client_secret` as the password.

### [Parameters for "Reset a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#reset-a-token--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `client_id`stringRequired<br>The client ID of the GitHub app. |

Path parameters

| Name, Type, Description |
| --- |
| `access_token`stringRequired<br>The access\_token of the OAuth or GitHub application. |

Body parameters

### [HTTP response status codes for "Reset a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#reset-a-token--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `422` | Validation failed, or the endpoint has been spammed. |

### [Code samples for "Reset a token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#reset-a-token--code-samples)

#### Request example

patch/applications/{client\_id}/token

- cURL

- JavaScript


Copy to clipboard curl request example

`curl -L \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -u "<YOUR_CLIENT_ID>:<YOUR_CLIENT_SECRET>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/applications/Iv1.8a61f9b3a7aba766/token \
  -d '{"access_token":"e72e16c7e42f292c6912e7710c838347ae178b4a"}'`

#### Response

- Example response

- Response schema


`Status: 200`

`{
"id": 1,
"url": "https://api.github.com/authorizations/1",
"scopes": [\
    "public_repo",\
    "user"\
],
"token": "ghu_16C7e42F292c6912E7710c838347Ae178B4a",
"token_last_eight": "Ae178B4a",
"hashed_token": "25f94a2a5c7fbaf499c665bc73d67c1c87e496da8985131633ee0a95819db2e8",
"app": {
    "url": "https://example.com",
    "name": "my github app",
    "client_id": "Iv1.8a61f9b3a7aba766"
},
"note": "optional note",
"note_url": "http://optional/note/url",
"updated_at": "2011-09-06T20:39:23Z",
"created_at": "2011-09-06T17:26:27Z",
"fingerprint": "jklmnop12345678",
"expires_at": "2011-09-08T17:26:27Z",
"user": {
    "login": "octocat",
    "id": 1,
    "node_id": "MDQ6VXNlcjE=",
    "avatar_url": "https://github.com/images/error/octocat_happy.gif",
    "gravatar_id": "",
    "url": "https://api.github.com/users/octocat",
    "html_url": "https://github.com/octocat",
    "followers_url": "https://api.github.com/users/octocat/followers",
    "following_url": "https://api.github.com/users/octocat/following{/other_user}",
    "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
    "organizations_url": "https://api.github.com/users/octocat/orgs",
    "repos_url": "https://api.github.com/users/octocat/repos",
    "events_url": "https://api.github.com/users/octocat/events{/privacy}",
    "received_events_url": "https://api.github.com/users/octocat/received_events",
    "type": "User",
    "site_admin": false
}
}`

## [Delete an app token](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-token)

OAuth or GitHub application owners can revoke a single token for an OAuth application or a GitHub application with an OAuth authorization.

### [Basic authentication for "Delete an app token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-token--basic-authentication)

You must use [Basic Authentication](https://docs.github.com/rest/authentication/authenticating-to-the-rest-api#using-basic-authentication) to use this endpoint. Use the application's `client_id` as the username and the `client_secret` as the password.

### [Parameters for "Delete an app token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-token--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `client_id`stringRequired<br>The client ID of the GitHub app. |

Path parameters

| Name, Type, Description |
| --- |
| `access_token`stringRequired<br>The OAuth access token used to authenticate to the GitHub API. |

Body parameters

### [HTTP response status codes for "Delete an app token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-token--status-codes)

| Status code | Description |
| --- | --- |
| `204` | No Content |
| `422` | Validation failed, or the endpoint has been spammed. |

### [Code samples for "Delete an app token"](https://docs.github.com/en/rest/apps/oauth-applications?apiVersion=2026-03-10\#delete-an-app-token--code-samples)

#### Request example

delete/applications/{client\_id}/token

- cURL

- JavaScript


Copy to clipboard curl request example

`curl -L \
  -X DELETE \
  -H "Accept: application/vnd.github+json" \
  -u "<YOUR_CLIENT_ID>:<YOUR_CLIENT_SECRET>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/applications/Iv1.8a61f9b3a7aba766/token \
  -d '{"access_token":"e72e16c7e42f292c6912e7710c838347ae178b4a"}'`

#### Response

`Status: 204`

REST API endpoints for OAuth authorizations - GitHub Docs
