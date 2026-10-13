---
url: https://docs.github.com/en/rest/users/users
retrieved: 2026-10-13
command: firecrawl scrape https://docs.github.com/en/rest/users/users --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: REST API endpoints for users - GitHub Docs
---
[Skip to main content](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10#main-content)

[Skip to content](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10#main-content)

Collapse sidebar

Expand sidebar

In this article

The REST API is now versioned.For more information, see " [About API versioning](https://docs.github.com/rest/overview/api-versions)."

# REST API endpoints for users

Use the REST API to get public and private information about authenticated users.

## [Get the authenticated user](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-the-authenticated-user)

OAuth app tokens and personal access tokens (classic) need the `read:user` scope, or the broader `user` scope, for this endpoint to return the private user response. The private user response includes additional fields such as `private_gists`, `total_private_repos`, `owned_private_repos`, `disk_usage`, `collaborators`, and `two_factor_authentication`. Tokens without these scopes receive the public user response.

The private and public user response types are unrelated to the [private profile](https://docs.github.com/account-and-profile/concepts/personal-profile#private-profiles) setting. A token without scopes still authenticates as the token's owner, so values subject to private profile visibility, such as `followers` and `following`, may differ from an unauthenticated response.

### [Fine-grained access tokens for "Get the authenticated user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-the-authenticated-user--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

The fine-grained token does not require any permissions.

### [HTTP response status codes for "Get the authenticated user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-the-authenticated-user--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `304` | Not modified |
| `401` | Requires authentication |
| `403` | Forbidden |

### [Code samples for "Get the authenticated user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-the-authenticated-user--code-samples)

#### Request examples

Select the example typeExample 1: Status Code 200Example 2: Status Code 200

get/user

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/user`

#### Response with public and private profile information

- Example response

- Response schema


`Status: 200`

`{
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
"site_admin": false,
"name": "monalisa octocat",
"company": "GitHub",
"blog": "https://github.com/blog",
"location": "San Francisco",
"email": "octocat@github.com",
"hireable": false,
"bio": "There once was...",
"twitter_username": "monatheoctocat",
"public_repos": 2,
"public_gists": 1,
"followers": 20,
"following": 0,
"created_at": "2008-01-14T04:33:35Z",
"updated_at": "2008-01-14T04:33:35Z",
"private_gists": 81,
"total_private_repos": 100,
"owned_private_repos": 100,
"disk_usage": 10000,
"collaborators": 8,
"two_factor_authentication": true,
"plan": {
    "name": "Medium",
    "space": 400,
    "private_repos": 20,
    "collaborators": 0
}
}`

## [Update the authenticated user](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#update-the-authenticated-user)

**Note:** If your email is set to private and you send an `email` parameter as part of this request to update your profile, your privacy settings are still enforced: the email address will not be displayed on your public profile or via the API.

### [Fine-grained access tokens for "Update the authenticated user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#update-the-authenticated-user--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

The fine-grained token must have the following permission set:

- "Profile" user permissions (write)

### [Parameters for "Update the authenticated user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#update-the-authenticated-user--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `name`string<br>The new name of the user. |
| `email`string<br>The publicly visible email address of the user. |
| `blog`string<br>The new blog URL of the user. |
| `twitter_username`string or null<br>The new Twitter username of the user. |
| `company`string<br>The new company of the user. |
| `location`string<br>The new location of the user. |
| `hireable`boolean<br>The new hiring availability of the user. |
| `bio`string<br>The new short biography of the user. |

Body parameters

### [HTTP response status codes for "Update the authenticated user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#update-the-authenticated-user--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `304` | Not modified |
| `401` | Requires authentication |
| `403` | Forbidden |
| `404` | Resource not found |
| `422` | Validation failed, or the endpoint has been spammed. |

### [Code samples for "Update the authenticated user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#update-the-authenticated-user--code-samples)

#### Request example

patch/user

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/user \
  -d '{"blog":"https://github.com/blog","name":"monalisa octocat"}'`

#### Response

- Example response

- Response schema


`Status: 200`

`{
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
"site_admin": false,
"name": "monalisa octocat",
"company": "GitHub",
"blog": "https://github.com/blog",
"location": "San Francisco",
"email": "octocat@github.com",
"hireable": false,
"bio": "There once was...",
"twitter_username": "monatheoctocat",
"public_repos": 2,
"public_gists": 1,
"followers": 20,
"following": 0,
"created_at": "2008-01-14T04:33:35Z",
"updated_at": "2008-01-14T04:33:35Z",
"private_gists": 81,
"total_private_repos": 100,
"owned_private_repos": 100,
"disk_usage": 10000,
"collaborators": 8,
"two_factor_authentication": true,
"plan": {
    "name": "Medium",
    "space": 400,
    "private_repos": 20,
    "collaborators": 0
}
}`

## [Get a user using their ID](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user-using-their-id)

Provides publicly available information about someone with a GitHub account. This method takes their durable user `ID` instead of their `login`, which can change over time.

If you are requesting information about an [Enterprise Managed User](https://docs.github.com/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/about-enterprise-managed-users), or a GitHub App bot that is installed in an organization that uses Enterprise Managed Users, your requests must be authenticated as a user or GitHub App that has access to the organization to view that account's information. If you are not authorized, the request will return a `404 Not Found` status.

The `email` key in the following response is the publicly visible email address from your GitHub [profile page](https://github.com/settings/profile). When setting up your profile, you can select a primary email address to be public which provides an email entry for this endpoint. If you do not set a public email address for `email`, then it will have a value of `null`. You only see publicly visible email addresses when authenticated with GitHub. For more information, see [Authentication](https://docs.github.com/rest/guides/getting-started-with-the-rest-api#authentication).

The Emails API enables you to list all of your email addresses, and toggle a primary email to be visible publicly. For more information, see [Emails API](https://docs.github.com/rest/users/emails).

### [Fine-grained access tokens for "Get a user using their ID"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user-using-their-id--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

The fine-grained token does not require any permissions.

This endpoint can be used without authentication if only public resources are requested.

### [Parameters for "Get a user using their ID"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user-using-their-id--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `account_id`integerRequired<br>account\_id parameter |

Path parameters

### [HTTP response status codes for "Get a user using their ID"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user-using-their-id--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `404` | Resource not found |

### [Code samples for "Get a user using their ID"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user-using-their-id--code-samples)

#### Request examples

Select the example typeExample 1: Status Code 200Example 2: Status Code 200

get/user/{account\_id}

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/user/ACCOUNT_ID`

#### Default response

- Example response

- Response schema


`Status: 200`

`{
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
"site_admin": false,
"name": "monalisa octocat",
"company": "GitHub",
"blog": "https://github.com/blog",
"location": "San Francisco",
"email": "octocat@github.com",
"hireable": false,
"bio": "There once was...",
"twitter_username": "monatheoctocat",
"public_repos": 2,
"public_gists": 1,
"followers": 20,
"following": 0,
"created_at": "2008-01-14T04:33:35Z",
"updated_at": "2008-01-14T04:33:35Z"
}`

## [List users](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#list-users)

Lists all users, in the order that they signed up on GitHub. This list includes personal user accounts and organization accounts.

Note: Pagination is powered exclusively by the `since` parameter. Use the [Link header](https://docs.github.com/rest/guides/using-pagination-in-the-rest-api#using-link-headers) to get the URL for the next page of users.

### [Fine-grained access tokens for "List users"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#list-users--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

The fine-grained token does not require any permissions.

This endpoint can be used without authentication if only public resources are requested.

### [Parameters for "List users"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#list-users--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `since`integer<br>A user ID. Only return users with an ID greater than this ID. |
| `per_page`integer<br>The number of results per page (max 100). For more information, see " [Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)."<br>Default: `30` |

Query parameters

### [HTTP response status codes for "List users"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#list-users--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `304` | Not modified |

### [Code samples for "List users"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#list-users--code-samples)

#### Request example

get/users

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/users`

#### Response

- Example response

- Response schema


`Status: 200`

`[\
{\
    "login": "octocat",\
    "id": 1,\
    "node_id": "MDQ6VXNlcjE=",\
    "avatar_url": "https://github.com/images/error/octocat_happy.gif",\
    "gravatar_id": "",\
    "url": "https://api.github.com/users/octocat",\
    "html_url": "https://github.com/octocat",\
    "followers_url": "https://api.github.com/users/octocat/followers",\
    "following_url": "https://api.github.com/users/octocat/following{/other_user}",\
    "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",\
    "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",\
    "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",\
    "organizations_url": "https://api.github.com/users/octocat/orgs",\
    "repos_url": "https://api.github.com/users/octocat/repos",\
    "events_url": "https://api.github.com/users/octocat/events{/privacy}",\
    "received_events_url": "https://api.github.com/users/octocat/received_events",\
    "type": "User",\
    "site_admin": false\
}\
]`

## [Get a user](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user)

Provides publicly available information about someone with a GitHub account.

If the specified user has a [private profile](https://docs.github.com/account-and-profile/concepts/personal-profile#private-profiles), the `followers` and `following` values are `0` unless the request is authenticated as that user. A request authenticated as the specified user returns the actual values even if the token has no OAuth scopes.

The `events_url` value is a URI template. Replace `{/privacy}` with `/public` to retrieve only public events. Omit it to retrieve public events and, when authenticated as the user, private events. For more information, see " [List events for the authenticated user](https://docs.github.com/rest/activity/events#list-events-for-the-authenticated-user)."

If you are requesting information about an [Enterprise Managed User](https://docs.github.com/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/about-enterprise-managed-users), or a GitHub App bot that is installed in an organization that uses Enterprise Managed Users, your requests must be authenticated as a user or GitHub App that has access to the organization to view that account's information. If you are not authorized, the request will return a `404 Not Found` status.

The `email` key in the following response is the publicly visible email address from your GitHub [profile page](https://github.com/settings/profile). When setting up your profile, you can select a primary email address to be public which provides an email entry for this endpoint. If you do not set a public email address for `email`, then it will have a value of `null`. You only see publicly visible email addresses when authenticated with GitHub. For more information, see [Authentication](https://docs.github.com/rest/guides/getting-started-with-the-rest-api#authentication).

The Emails API enables you to list all of your email addresses, and toggle a primary email to be visible publicly. For more information, see [Emails API](https://docs.github.com/rest/users/emails).

### [Fine-grained access tokens for "Get a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

The fine-grained token does not require any permissions.

This endpoint can be used without authentication if only public resources are requested.

### [Parameters for "Get a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `username`stringRequired<br>The handle for the GitHub user account. |

Path parameters

### [HTTP response status codes for "Get a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `404` | Resource not found |

### [Code samples for "Get a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-a-user--code-samples)

#### Request examples

Select the example typeExample 1: Status Code 200Example 2: Status Code 200

get/users/{username}

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/users/USERNAME`

#### Default response

- Example response

- Response schema


`Status: 200`

`{
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
"site_admin": false,
"name": "monalisa octocat",
"company": "GitHub",
"blog": "https://github.com/blog",
"location": "San Francisco",
"email": "octocat@github.com",
"hireable": false,
"bio": "There once was...",
"twitter_username": "monatheoctocat",
"public_repos": 2,
"public_gists": 1,
"followers": 20,
"following": 0,
"created_at": "2008-01-14T04:33:35Z",
"updated_at": "2008-01-14T04:33:35Z"
}`

## [Get contextual information for a user](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-contextual-information-for-a-user)

Provides hovercard information. You can find out more about someone in relation to their pull requests, issues, repositories, and organizations.

The `subject_type` and `subject_id` parameters provide context for the person's hovercard, which returns more information than without the parameters. For example, if you wanted to find out more about `octocat` who owns the `Spoon-Knife` repository, you would use a `subject_type` value of `repository` and a `subject_id` value of `1300192` (the ID of the `Spoon-Knife` repository).

OAuth app tokens and personal access tokens (classic) need the `repo` scope to use this endpoint.

### [Fine-grained access tokens for "Get contextual information for a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-contextual-information-for-a-user--fine-grained-access-tokens)

This endpoint does not work with GitHub App user access tokens, GitHub App installation access tokens, or fine-grained personal access tokens.

### [Parameters for "Get contextual information for a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-contextual-information-for-a-user--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `username`stringRequired<br>The handle for the GitHub user account. |

Path parameters

| Name, Type, Description |
| --- |
| `subject_type`string<br>Identifies which additional information you'd like to receive about the person's hovercard. Can be `organization`, `repository`, `issue`, `pull_request`. **Required** when using `subject_id`.<br>Can be one of:`organization`,`repository`,`issue`,`pull_request` |
| `subject_id`string<br>Uses the ID for the `subject_type` you specified. **Required** when using `subject_type`. |

Query parameters

### [HTTP response status codes for "Get contextual information for a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-contextual-information-for-a-user--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `404` | Resource not found |
| `422` | Validation failed, or the endpoint has been spammed. |

### [Code samples for "Get contextual information for a user"](https://docs.github.com/en/rest/users/users?apiVersion=2026-03-10\#get-contextual-information-for-a-user--code-samples)

#### Request example

get/users/{username}/hovercard

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/users/USERNAME/hovercard`

#### Response

- Example response

- Response schema


`Status: 200`

`{
"contexts": [\
    {\
      "message": "Owns this repository",\
      "octicon": "repo"\
    }\
]
}`

REST API endpoints for users - GitHub Docs
