---
url: https://docs.github.com/en/rest/apps/installations
retrieved: 2026-10-13
command: firecrawl scrape https://docs.github.com/en/rest/apps/installations --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: REST API endpoints for GitHub App installations - GitHub Docs
---
[Skip to main content](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10#main-content)

[Skip to content](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10#main-content)

Collapse sidebar

Expand sidebar

In this articleRemove a repository from an app installation

The REST API is now versioned.For more information, see " [About API versioning](https://docs.github.com/rest/overview/api-versions)."

# REST API endpoints for GitHub App installations

Use the REST API to get information about GitHub App installations and perform actions within those installations.

## [About GitHub App installations](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#about-github-app-installations)

A GitHub App installation refers to the installation of the app on an organization or user account. For information on how to authenticate as an installation and limit access to specific repositories, see [Authenticating as a GitHub App installation](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation).

To list all GitHub App installations for an organization, see [REST API endpoints for organizations](https://docs.github.com/en/rest/orgs/orgs#list-app-installations-for-an-organization).

## [List repositories accessible to the app installation](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-app-installation)

List repositories that an app installation can access.

### [Fine-grained access tokens for "List repositories accessible to the app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-app-installation--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)

The fine-grained token does not require any permissions.

This endpoint can be used without authentication if only public resources are requested.

### [Parameters for "List repositories accessible to the app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-app-installation--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `per_page`integer<br>The number of results per page (max 100). For more information, see " [Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)."<br>Default: `30` |
| `page`integer<br>The page number of the results to fetch. For more information, see " [Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)."<br>Default: `1` |

Query parameters

### [HTTP response status codes for "List repositories accessible to the app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-app-installation--status-codes)

| Status code | Description |
| --- | --- |
| `200` | OK |
| `304` | Not modified |
| `401` | Requires authentication |
| `403` | Forbidden |

### [Code samples for "List repositories accessible to the app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-app-installation--code-samples)

#### Request example

get/installation/repositories

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/installation/repositories`

#### Response

- Example response

- Response schema


`Status: 200`

`{
"total_count": 1,
"repositories": [\
    {\
      "id": 1296269,\
      "node_id": "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",\
      "name": "Hello-World",\
      "full_name": "octocat/Hello-World",\
      "owner": {\
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
      },\
      "private": false,\
      "html_url": "https://github.com/octocat/Hello-World",\
      "description": "This your first repo!",\
      "fork": false,\
      "url": "https://api.github.com/repos/octocat/Hello-World",\
      "archive_url": "https://api.github.com/repos/octocat/Hello-World/{archive_format}{/ref}",\
      "assignees_url": "https://api.github.com/repos/octocat/Hello-World/assignees{/user}",\
      "blobs_url": "https://api.github.com/repos/octocat/Hello-World/git/blobs{/sha}",\
      "branches_url": "https://api.github.com/repos/octocat/Hello-World/branches{/branch}",\
      "collaborators_url": "https://api.github.com/repos/octocat/Hello-World/collaborators{/collaborator}",\
      "comments_url": "https://api.github.com/repos/octocat/Hello-World/comments{/number}",\
      "commits_url": "https://api.github.com/repos/octocat/Hello-World/commits{/sha}",\
      "compare_url": "https://api.github.com/repos/octocat/Hello-World/compare/{base}...{head}",\
      "contents_url": "https://api.github.com/repos/octocat/Hello-World/contents/{+path}",\
      "contributors_url": "https://api.github.com/repos/octocat/Hello-World/contributors",\
      "deployments_url": "https://api.github.com/repos/octocat/Hello-World/deployments",\
      "downloads_url": "https://api.github.com/repos/octocat/Hello-World/downloads",\
      "events_url": "https://api.github.com/repos/octocat/Hello-World/events",\
      "forks_url": "https://api.github.com/repos/octocat/Hello-World/forks",\
      "git_commits_url": "https://api.github.com/repos/octocat/Hello-World/git/commits{/sha}",\
      "git_refs_url": "https://api.github.com/repos/octocat/Hello-World/git/refs{/sha}",\
      "git_tags_url": "https://api.github.com/repos/octocat/Hello-World/git/tags{/sha}",\
      "git_url": "git:github.com/octocat/Hello-World.git",\
      "issue_comment_url": "https://api.github.com/repos/octocat/Hello-World/issues/comments{/number}",\
      "issue_events_url": "https://api.github.com/repos/octocat/Hello-World/issues/events{/number}",\
      "issues_url": "https://api.github.com/repos/octocat/Hello-World/issues{/number}",\
      "keys_url": "https://api.github.com/repos/octocat/Hello-World/keys{/key_id}",\
      "labels_url": "https://api.github.com/repos/octocat/Hello-World/labels{/name}",\
      "languages_url": "https://api.github.com/repos/octocat/Hello-World/languages",\
      "merges_url": "https://api.github.com/repos/octocat/Hello-World/merges",\
      "milestones_url": "https://api.github.com/repos/octocat/Hello-World/milestones{/number}",\
      "notifications_url": "https://api.github.com/repos/octocat/Hello-World/notifications{?since,all,participating}",\
      "pulls_url": "https://api.github.com/repos/octocat/Hello-World/pulls{/number}",\
      "releases_url": "https://api.github.com/repos/octocat/Hello-World/releases{/id}",\
      "ssh_url": "git@github.com:octocat/Hello-World.git",\
      "stargazers_url": "https://api.github.com/repos/octocat/Hello-World/stargazers",\
      "statuses_url": "https://api.github.com/repos/octocat/Hello-World/statuses/{sha}",\
      "subscribers_url": "https://api.github.com/repos/octocat/Hello-World/subscribers",\
      "subscription_url": "https://api.github.com/repos/octocat/Hello-World/subscription",\
      "tags_url": "https://api.github.com/repos/octocat/Hello-World/tags",\
      "teams_url": "https://api.github.com/repos/octocat/Hello-World/teams",\
      "trees_url": "https://api.github.com/repos/octocat/Hello-World/git/trees{/sha}",\
      "clone_url": "https://github.com/octocat/Hello-World.git",\
      "mirror_url": "git:git.example.com/octocat/Hello-World",\
      "hooks_url": "https://api.github.com/repos/octocat/Hello-World/hooks",\
      "svn_url": "https://svn.github.com/octocat/Hello-World",\
      "homepage": "https://github.com",\
      "language": null,\
      "forks_count": 9,\
      "stargazers_count": 80,\
      "watchers_count": 80,\
      "size": 108,\
      "default_branch": "master",\
      "open_issues_count": 0,\
      "is_template": true,\
      "topics": [\
        "octocat",\
        "atom",\
        "electron",\
        "api"\
      ],\
      "has_issues": true,\
      "has_projects": true,\
      "has_wiki": true,\
      "has_pages": false,\
      "has_downloads": true,\
      "archived": false,\
      "disabled": false,\
      "visibility": "public",\
      "pushed_at": "2011-01-26T19:06:43Z",\
      "created_at": "2011-01-26T19:01:12Z",\
      "updated_at": "2011-01-26T19:14:43Z",\
      "allow_rebase_merge": true,\
      "template_repository": null,\
      "temp_clone_token": "ABTLWHOULUVAXGTRYU7OC2876QJ2O",\
      "allow_squash_merge": true,\
      "allow_auto_merge": false,\
      "delete_branch_on_merge": true,\
      "allow_merge_commit": true,\
      "subscribers_count": 42,\
      "network_count": 0,\
      "license": {\
        "key": "mit",\
        "name": "MIT License",\
        "url": "https://api.github.com/licenses/mit",\
        "spdx_id": "MIT",\
        "node_id": "MDc6TGljZW5zZW1pdA==",\
        "html_url": "https://github.com/licenses/mit"\
      },\
      "forks": 1,\
      "open_issues": 1,\
      "watchers": 1,\
      "custom_properties": {\
        "environment": "production",\
        "service": "web"\
      }\
    }\
]
}`

## [Revoke an installation access token](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#revoke-an-installation-access-token)

Revokes the installation token you're using to authenticate as an installation and access this endpoint.

Once an installation token is revoked, the token is invalidated and cannot be used. Other endpoints that require the revoked installation token must have a new installation token to work. You can create a new token using the " [Create an installation access token for an app](https://docs.github.com/rest/apps/apps#create-an-installation-access-token-for-an-app)" endpoint.

### [Fine-grained access tokens for "Revoke an installation access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#revoke-an-installation-access-token--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)

The fine-grained token does not require any permissions.

This endpoint can be used without authentication if only public resources are requested.

### [HTTP response status codes for "Revoke an installation access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#revoke-an-installation-access-token--status-codes)

| Status code | Description |
| --- | --- |
| `204` | No Content |

### [Code samples for "Revoke an installation access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#revoke-an-installation-access-token--code-samples)

#### Request example

delete/installation/token

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -X DELETE \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/installation/token`

#### Response

`Status: 204`

## [List app installations accessible to the user access token](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-app-installations-accessible-to-the-user-access-token)

Lists installations of your GitHub App that the authenticated user has explicit permission (`:read`, `:write`, or `:admin`) to access.

The authenticated user has explicit permission to access repositories they own, repositories where they are a collaborator, and repositories that they can access through an organization membership.

You can find the permissions for the installation under the `permissions` key.

### [Fine-grained access tokens for "List app installations accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-app-installations-accessible-to-the-user-access-token--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)

The fine-grained token does not require any permissions.

### [Parameters for "List app installations accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-app-installations-accessible-to-the-user-access-token--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `per_page`integer<br>The number of results per page (max 100). For more information, see " [Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)."<br>Default: `30` |
| `page`integer<br>The page number of the results to fetch. For more information, see " [Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)."<br>Default: `1` |

Query parameters

### [HTTP response status codes for "List app installations accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-app-installations-accessible-to-the-user-access-token--status-codes)

| Status code | Description |
| --- | --- |
| `200` | You can find the permissions for the installation under the `permissions` key. |
| `304` | Not modified |
| `401` | Requires authentication |
| `403` | Forbidden |

### [Code samples for "List app installations accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-app-installations-accessible-to-the-user-access-token--code-samples)

#### Request example

get/user/installations

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/user/installations`

#### You can find the permissions for the installation under the `permissions` key.

- Example response

- Response schema


`Status: 200`

`{
"total_count": 2,
"installations": [\
    {\
      "id": 1,\
      "account": {\
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
      },\
      "access_tokens_url": "https://api.github.com/app/installations/1/access_tokens",\
      "repositories_url": "https://api.github.com/installation/repositories",\
      "html_url": "https://github.com/organizations/github/settings/installations/1",\
      "app_id": 1,\
      "target_id": 1,\
      "target_type": "Organization",\
      "permissions": {\
        "checks": "write",\
        "metadata": "read",\
        "contents": "read"\
      },\
      "events": [\
        "push",\
        "pull_request"\
      ],\
      "single_file_name": "config.yaml",\
      "has_multiple_single_files": true,\
      "single_file_paths": [\
        "config.yml",\
        ".github/issue_TEMPLATE.md"\
      ],\
      "repository_selection": "all",\
      "created_at": "2017-07-08T16:18:44-04:00",\
      "updated_at": "2017-07-08T16:18:44-04:00",\
      "app_slug": "github-actions",\
      "suspended_at": null,\
      "suspended_by": null\
    },\
    {\
      "id": 3,\
      "account": {\
        "login": "octocat",\
        "id": 2,\
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
      },\
      "access_tokens_url": "https://api.github.com/app/installations/1/access_tokens",\
      "repositories_url": "https://api.github.com/installation/repositories",\
      "html_url": "https://github.com/organizations/github/settings/installations/1",\
      "app_id": 1,\
      "target_id": 1,\
      "target_type": "Organization",\
      "permissions": {\
        "checks": "write",\
        "metadata": "read",\
        "contents": "read"\
      },\
      "events": [\
        "push",\
        "pull_request"\
      ],\
      "single_file_name": "config.yaml",\
      "has_multiple_single_files": true,\
      "single_file_paths": [\
        "config.yml",\
        ".github/issue_TEMPLATE.md"\
      ],\
      "repository_selection": "all",\
      "created_at": "2017-07-08T16:18:44-04:00",\
      "updated_at": "2017-07-08T16:18:44-04:00",\
      "app_slug": "github-actions",\
      "suspended_at": null,\
      "suspended_by": null\
    }\
]
}`

## [List repositories accessible to the user access token](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-user-access-token)

List repositories that the authenticated user has explicit permission (`:read`, `:write`, or `:admin`) to access for an installation.

The authenticated user has explicit permission to access repositories they own, repositories where they are a collaborator, and repositories that they can access through an organization membership.

The access the user has to each repository is included in the hash under the `permissions` key.

### [Fine-grained access tokens for "List repositories accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-user-access-token--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)

The fine-grained token must have the following permission set:

- "Metadata" repository permissions (read)

### [Parameters for "List repositories accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-user-access-token--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `installation_id`integerRequired<br>The unique identifier of the installation. |

Path parameters

| Name, Type, Description |
| --- |
| `per_page`integer<br>The number of results per page (max 100). For more information, see " [Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)."<br>Default: `30` |
| `page`integer<br>The page number of the results to fetch. For more information, see " [Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)."<br>Default: `1` |

Query parameters

### [HTTP response status codes for "List repositories accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-user-access-token--status-codes)

| Status code | Description |
| --- | --- |
| `200` | The access the user has to each repository is included in the hash under the `permissions` key. |
| `304` | Not modified |
| `403` | Forbidden |
| `404` | Resource not found |

### [Code samples for "List repositories accessible to the user access token"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#list-repositories-accessible-to-the-user-access-token--code-samples)

#### Request example

get/user/installations/{installation\_id}/repositories

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/user/installations/1/repositories`

#### The access the user has to each repository is included in the hash under the `permissions` key.

- Example response

- Response schema


`Status: 200`

`{
"total_count": 1,
"repositories": [\
    {\
      "id": 1296269,\
      "node_id": "MDEwOlJlcG9zaXRvcnkxMjk2MjY5",\
      "name": "Hello-World",\
      "full_name": "octocat/Hello-World",\
      "owner": {\
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
      },\
      "private": false,\
      "html_url": "https://github.com/octocat/Hello-World",\
      "description": "This your first repo!",\
      "fork": false,\
      "url": "https://api.github.com/repos/octocat/Hello-World",\
      "archive_url": "https://api.github.com/repos/octocat/Hello-World/{archive_format}{/ref}",\
      "assignees_url": "https://api.github.com/repos/octocat/Hello-World/assignees{/user}",\
      "blobs_url": "https://api.github.com/repos/octocat/Hello-World/git/blobs{/sha}",\
      "branches_url": "https://api.github.com/repos/octocat/Hello-World/branches{/branch}",\
      "collaborators_url": "https://api.github.com/repos/octocat/Hello-World/collaborators{/collaborator}",\
      "comments_url": "https://api.github.com/repos/octocat/Hello-World/comments{/number}",\
      "commits_url": "https://api.github.com/repos/octocat/Hello-World/commits{/sha}",\
      "compare_url": "https://api.github.com/repos/octocat/Hello-World/compare/{base}...{head}",\
      "contents_url": "https://api.github.com/repos/octocat/Hello-World/contents/{+path}",\
      "contributors_url": "https://api.github.com/repos/octocat/Hello-World/contributors",\
      "deployments_url": "https://api.github.com/repos/octocat/Hello-World/deployments",\
      "downloads_url": "https://api.github.com/repos/octocat/Hello-World/downloads",\
      "events_url": "https://api.github.com/repos/octocat/Hello-World/events",\
      "forks_url": "https://api.github.com/repos/octocat/Hello-World/forks",\
      "git_commits_url": "https://api.github.com/repos/octocat/Hello-World/git/commits{/sha}",\
      "git_refs_url": "https://api.github.com/repos/octocat/Hello-World/git/refs{/sha}",\
      "git_tags_url": "https://api.github.com/repos/octocat/Hello-World/git/tags{/sha}",\
      "git_url": "git:github.com/octocat/Hello-World.git",\
      "issue_comment_url": "https://api.github.com/repos/octocat/Hello-World/issues/comments{/number}",\
      "issue_events_url": "https://api.github.com/repos/octocat/Hello-World/issues/events{/number}",\
      "issues_url": "https://api.github.com/repos/octocat/Hello-World/issues{/number}",\
      "keys_url": "https://api.github.com/repos/octocat/Hello-World/keys{/key_id}",\
      "labels_url": "https://api.github.com/repos/octocat/Hello-World/labels{/name}",\
      "languages_url": "https://api.github.com/repos/octocat/Hello-World/languages",\
      "merges_url": "https://api.github.com/repos/octocat/Hello-World/merges",\
      "milestones_url": "https://api.github.com/repos/octocat/Hello-World/milestones{/number}",\
      "notifications_url": "https://api.github.com/repos/octocat/Hello-World/notifications{?since,all,participating}",\
      "pulls_url": "https://api.github.com/repos/octocat/Hello-World/pulls{/number}",\
      "releases_url": "https://api.github.com/repos/octocat/Hello-World/releases{/id}",\
      "ssh_url": "git@github.com:octocat/Hello-World.git",\
      "stargazers_url": "https://api.github.com/repos/octocat/Hello-World/stargazers",\
      "statuses_url": "https://api.github.com/repos/octocat/Hello-World/statuses/{sha}",\
      "subscribers_url": "https://api.github.com/repos/octocat/Hello-World/subscribers",\
      "subscription_url": "https://api.github.com/repos/octocat/Hello-World/subscription",\
      "tags_url": "https://api.github.com/repos/octocat/Hello-World/tags",\
      "teams_url": "https://api.github.com/repos/octocat/Hello-World/teams",\
      "trees_url": "https://api.github.com/repos/octocat/Hello-World/git/trees{/sha}",\
      "clone_url": "https://github.com/octocat/Hello-World.git",\
      "mirror_url": "git:git.example.com/octocat/Hello-World",\
      "hooks_url": "https://api.github.com/repos/octocat/Hello-World/hooks",\
      "svn_url": "https://svn.github.com/octocat/Hello-World",\
      "homepage": "https://github.com",\
      "language": null,\
      "forks_count": 9,\
      "stargazers_count": 80,\
      "watchers_count": 80,\
      "size": 108,\
      "default_branch": "master",\
      "open_issues_count": 0,\
      "is_template": true,\
      "topics": [\
        "octocat",\
        "atom",\
        "electron",\
        "api"\
      ],\
      "has_issues": true,\
      "has_projects": true,\
      "has_wiki": true,\
      "has_pages": false,\
      "has_downloads": true,\
      "archived": false,\
      "disabled": false,\
      "visibility": "public",\
      "pushed_at": "2011-01-26T19:06:43Z",\
      "created_at": "2011-01-26T19:01:12Z",\
      "updated_at": "2011-01-26T19:14:43Z",\
      "permissions": {\
        "admin": false,\
        "push": false,\
        "pull": true\
      },\
      "allow_rebase_merge": true,\
      "template_repository": null,\
      "temp_clone_token": "ABTLWHOULUVAXGTRYU7OC2876QJ2O",\
      "allow_squash_merge": true,\
      "allow_auto_merge": false,\
      "delete_branch_on_merge": true,\
      "allow_merge_commit": true,\
      "subscribers_count": 42,\
      "network_count": 0,\
      "license": {\
        "key": "mit",\
        "name": "MIT License",\
        "url": "https://api.github.com/licenses/mit",\
        "spdx_id": "MIT",\
        "node_id": "MDc6TGljZW5zZW1pdA==",\
        "html_url": "https://github.com/licenses/mit"\
      },\
      "forks": 1,\
      "open_issues": 1,\
      "watchers": 1\
    }\
]
}`

## [Add a repository to an app installation](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#add-a-repository-to-an-app-installation)

Add a single repository to an installation. The authenticated user must have admin access to the repository.

### [Fine-grained access tokens for "Add a repository to an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#add-a-repository-to-an-app-installation--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

The fine-grained token must have the following permission set:

- "GitHub App installation repository access" repository permissions (write)

### [Parameters for "Add a repository to an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#add-a-repository-to-an-app-installation--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `installation_id`integerRequired<br>The unique identifier of the installation. |
| `repository_id`integerRequired<br>The unique identifier of the repository. |

Path parameters

### [HTTP response status codes for "Add a repository to an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#add-a-repository-to-an-app-installation--status-codes)

| Status code | Description |
| --- | --- |
| `204` | No Content |
| `304` | Not modified |
| `403` | Forbidden |
| `404` | Resource not found |

### [Code samples for "Add a repository to an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#add-a-repository-to-an-app-installation--code-samples)

#### Request example

put/user/installations/{installation\_id}/repositories/{repository\_id}

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/user/installations/1/repositories/REPOSITORY_ID`

#### Response

`Status: 204`

## [Remove a repository from an app installation](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#remove-a-repository-from-an-app-installation)

Remove a single repository from an installation. The authenticated user must have admin access to the repository. The installation must have the `repository_selection` of `selected`.

To use a PAT (classic) with this endpoint, the `repo` scope is required

### [Fine-grained access tokens for "Remove a repository from an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#remove-a-repository-from-an-app-installation--fine-grained-access-tokens)

This endpoint works with the following fine-grained token types:

- [GitHub App user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

The fine-grained token must have the following permission set:

- "GitHub App installation repository access" repository permissions (write)

### [Parameters for "Remove a repository from an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#remove-a-repository-from-an-app-installation--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `installation_id`integerRequired<br>The unique identifier of the installation. |
| `repository_id`integerRequired<br>The unique identifier of the repository. |

Path parameters

### [HTTP response status codes for "Remove a repository from an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#remove-a-repository-from-an-app-installation--status-codes)

| Status code | Description |
| --- | --- |
| `204` | No Content |
| `304` | Not modified |
| `403` | Forbidden |
| `404` | Resource not found |
| `422` | Returned when the application is installed on `all` repositories in the organization, or if this request would remove the last repository that the application has access to in the organization. |

### [Code samples for "Remove a repository from an app installation"](https://docs.github.com/en/rest/apps/installations?apiVersion=2026-03-10\#remove-a-repository-from-an-app-installation--code-samples)

#### Request example

delete/user/installations/{installation\_id}/repositories/{repository\_id}

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -X DELETE \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/user/installations/1/repositories/REPOSITORY_ID`

#### Response

`Status: 204`

REST API endpoints for GitHub App installations - GitHub Docs
