---
url: https://docs.github.com/en/rest/actions/artifacts
retrieved: 2026-10-02
command: http-keyless scrape https://docs.github.com/en/rest/actions/artifacts
statusCode: 200
transport: http-keyless
completeness: partial
omitted: 2 sibling section(s) totalling ~30 words were outside the page's main content and are not in this capture
title: REST API endpoints for GitHub Actions artifacts - GitHub Docs
---
In this article

 The REST API is now versioned. For more information, see "[About API versioning](/rest/overview/api-versions)."



# REST API endpoints for GitHub Actions artifacts

 Use the REST API to interact with artifacts in GitHub Actions.



## [About artifacts in GitHub Actions](#about-artifacts-in-github-actions)

 You can use the REST API to download, delete, and retrieve information about workflow artifacts in GitHub Actions. Artifacts enable you to share data between jobs in a workflow and store data once that workflow has completed. For more information, see [Store and share data with workflow artifacts](/en/actions/tutorials/store-and-share-data).



## [List artifacts for a repository](#list-artifacts-for-a-repository)

 Lists all artifacts for a repository.

 Anyone with read access to the repository can use this endpoint.

 OAuth app tokens and personal access tokens (classic) need the `repo` scope to use this endpoint with a private repository.

### [Fine-grained access tokens for "List artifacts for a repository"](#list-artifacts-for-a-repository--fine-grained-access-tokens)

 This endpoint works with the following fine-grained token types :


- [GitHub App user access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

 The fine-grained token must have the following permission set:


- "Actions" repository permissions (read)

 This endpoint can be used without authentication or the aforementioned permissions if only public resources are requested.

### [Parameters for "List artifacts for a repository"](#list-artifacts-for-a-repository--parameters)

 Headers
| Name, Type, Description |
| `accept` string Setting to `application/vnd.github+json` is recommended. |

 Path parameters
| Name, Type, Description |
| `owner` string Required The account owner of the repository. The name is not case sensitive. |
| `repo` string Required The name of the repository without the `.git` extension. The name is not case sensitive. |

 Query parameters
| Name, Type, Description |
| `per_page` integer The number of results per page (max 100). For more information, see "[Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)." Default : `30` |
| `page` integer The page number of the results to fetch. For more information, see "[Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)." Default : `1` |
| `name` string The name field of an artifact. When specified, only artifacts with this name will be returned. |

### [HTTP response status codes for "List artifacts for a repository"](#list-artifacts-for-a-repository--status-codes)


| Status code | Description |
| `200` | OK |



### [Code samples for "List artifacts for a repository"](#list-artifacts-for-a-repository--code-samples)

#### Request example

 get /repos /{owner} /{repo} /actions /artifacts


- cURL
- JavaScript
- GitHub CLI

 Copy to clipboard curl request example

 `curl -L \
 -H "Accept: application/vnd.github+json" \
 -H "Authorization: Bearer <YOUR-TOKEN>" \
 -H "X-GitHub-Api-Version: 2026-03-10" \
 https://api.github.com/repos/OWNER/REPO/actions/artifacts`

#### Response


- Example response
- Response schema

 `Status: 200`

 `{
 "total_count": 2,
 "artifacts": [
 {
 "id": 11,
 "node_id": "MDg6QXJ0aWZhY3QxMQ==",
 "name": "Rails",
 "size_in_bytes": 556,
 "url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/11",
 "archive_download_url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/11/zip",
 "expired": false,
 "created_at": "2020-01-10T14:59:22Z",
 "expires_at": "2020-03-21T14:59:22Z",
 "updated_at": "2020-02-21T14:59:22Z",
 "digest": "sha256:cfc3236bdad15b5898bca8408945c9e19e1917da8704adc20eaa618444290a8c",
 "workflow_run": {
 "id": 2332938,
 "repository_id": 1296269,
 "head_repository_id": 1296269,
 "head_branch": "main",
 "head_sha": "328faa0536e6fef19753d9d91dc96a9931694ce3"
 }
 },
 {
 "id": 13,
 "node_id": "MDg6QXJ0aWZhY3QxMw==",
 "name": "Test output",
 "size_in_bytes": 453,
 "url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/13",
 "archive_download_url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/13/zip",
 "expired": false,
 "created_at": "2020-01-10T14:59:22Z",
 "expires_at": "2020-03-21T14:59:22Z",
 "updated_at": "2020-02-21T14:59:22Z",
 "digest": "sha256:cfc3236bdad15b5898bca8408945c9e19e1917da8704adc20eaa618444290a8c",
 "workflow_run": {
 "id": 2332942,
 "repository_id": 1296269,
 "head_repository_id": 1296269,
 "head_branch": "main",
 "head_sha": "178f4f6090b3fccad4a65b3e83d076a622d59652"
 }
 }
 ]
}`



## [Get an artifact](#get-an-artifact)

 Gets a specific artifact for a workflow run.

 Anyone with read access to the repository can use this endpoint.

 If the repository is private, OAuth tokens and personal access tokens (classic) need the `repo` scope to use this endpoint.

### [Fine-grained access tokens for "Get an artifact"](#get-an-artifact--fine-grained-access-tokens)

 This endpoint works with the following fine-grained token types :


- [GitHub App user access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

 The fine-grained token must have the following permission set:


- "Actions" repository permissions (read)

 This endpoint can be used without authentication or the aforementioned permissions if only public resources are requested.

### [Parameters for "Get an artifact"](#get-an-artifact--parameters)

 Headers
| Name, Type, Description |
| `accept` string Setting to `application/vnd.github+json` is recommended. |

 Path parameters
| Name, Type, Description |
| `owner` string Required The account owner of the repository. The name is not case sensitive. |
| `repo` string Required The name of the repository without the `.git` extension. The name is not case sensitive. |
| `artifact_id` integer Required The unique identifier of the artifact. |

### [HTTP response status codes for "Get an artifact"](#get-an-artifact--status-codes)


| Status code | Description |
| `200` | OK |



### [Code samples for "Get an artifact"](#get-an-artifact--code-samples)

#### Request example

 get /repos /{owner} /{repo} /actions /artifacts /{artifact_ id}


- cURL
- JavaScript
- GitHub CLI

 Copy to clipboard curl request example

 `curl -L \
 -H "Accept: application/vnd.github+json" \
 -H "Authorization: Bearer <YOUR-TOKEN>" \
 -H "X-GitHub-Api-Version: 2026-03-10" \
 https://api.github.com/repos/OWNER/REPO/actions/artifacts/ARTIFACT_ID`

#### Response


- Example response
- Response schema

 `Status: 200`

 `{
 "id": 11,
 "node_id": "MDg6QXJ0aWZhY3QxMQ==",
 "name": "Rails",
 "size_in_bytes": 556,
 "url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/11",
 "archive_download_url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/11/zip",
 "expired": false,
 "created_at": "2020-01-10T14:59:22Z",
 "expires_at": "2020-01-21T14:59:22Z",
 "updated_at": "2020-01-21T14:59:22Z",
 "digest": "sha256:cfc3236bdad15b5898bca8408945c9e19e1917da8704adc20eaa618444290a8c",
 "workflow_run": {
 "id": 2332938,
 "repository_id": 1296269,
 "head_repository_id": 1296269,
 "head_branch": "main",
 "head_sha": "328faa0536e6fef19753d9d91dc96a9931694ce3"
 }
}`



## [Delete an artifact](#delete-an-artifact)

 Deletes an artifact for a workflow run.
OAuth tokens and personal access tokens (classic) need the `repo` scope to use this endpoint.

### [Fine-grained access tokens for "Delete an artifact"](#delete-an-artifact--fine-grained-access-tokens)

 This endpoint works with the following fine-grained token types :


- [GitHub App user access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

 The fine-grained token must have the following permission set:


- "Actions" repository permissions (write)

### [Parameters for "Delete an artifact"](#delete-an-artifact--parameters)

 Headers
| Name, Type, Description |
| `accept` string Setting to `application/vnd.github+json` is recommended. |

 Path parameters
| Name, Type, Description |
| `owner` string Required The account owner of the repository. The name is not case sensitive. |
| `repo` string Required The name of the repository without the `.git` extension. The name is not case sensitive. |
| `artifact_id` integer Required The unique identifier of the artifact. |

### [HTTP response status codes for "Delete an artifact"](#delete-an-artifact--status-codes)


| Status code | Description |
| `204` | No Content |



### [Code samples for "Delete an artifact"](#delete-an-artifact--code-samples)

#### Request example

 delete /repos /{owner} /{repo} /actions /artifacts /{artifact_ id}


- cURL
- JavaScript
- GitHub CLI

 Copy to clipboard curl request example

 `curl -L \
 -X DELETE \
 -H "Accept: application/vnd.github+json" \
 -H "Authorization: Bearer <YOUR-TOKEN>" \
 -H "X-GitHub-Api-Version: 2026-03-10" \
 https://api.github.com/repos/OWNER/REPO/actions/artifacts/ARTIFACT_ID`

#### Response

 `Status: 204`



## [Download an artifact](#download-an-artifact)

 Gets a redirect URL to download an archive for a repository. This URL expires after 1 minute. Look for `Location:` in
the response header to find the URL for the download. The `:archive_format` must be `zip`.

 OAuth tokens and personal access tokens (classic) need the `repo` scope to use this endpoint.

### [Fine-grained access tokens for "Download an artifact"](#download-an-artifact--fine-grained-access-tokens)

 This endpoint works with the following fine-grained token types :


- [GitHub App user access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

 The fine-grained token must have the following permission set:


- "Actions" repository permissions (read)

### [Parameters for "Download an artifact"](#download-an-artifact--parameters)

 Headers
| Name, Type, Description |
| `accept` string Setting to `application/vnd.github+json` is recommended. |

 Path parameters
| Name, Type, Description |
| `owner` string Required The account owner of the repository. The name is not case sensitive. |
| `repo` string Required The name of the repository without the `.git` extension. The name is not case sensitive. |
| `artifact_id` integer Required The unique identifier of the artifact. |
| `archive_format` string Required |

### [HTTP response status codes for "Download an artifact"](#download-an-artifact--status-codes)


| Status code | Description |
| `302` | Found |
| `410` | Gone |



### [Code samples for "Download an artifact"](#download-an-artifact--code-samples)

#### Request example

 get /repos /{owner} /{repo} /actions /artifacts /{artifact_ id} /{archive_ format}


- cURL
- JavaScript
- GitHub CLI

 Copy to clipboard curl request example

 `curl -L \
 -H "Accept: application/vnd.github+json" \
 -H "Authorization: Bearer <YOUR-TOKEN>" \
 -H "X-GitHub-Api-Version: 2026-03-10" \
 https://api.github.com/repos/OWNER/REPO/actions/artifacts/ARTIFACT_ID/ARCHIVE_FORMAT`

#### Response

 `Status: 302`



## [List workflow run artifacts](#list-workflow-run-artifacts)

 Lists artifacts for a workflow run.

 Anyone with read access to the repository can use this endpoint.

 OAuth app tokens and personal access tokens (classic) need the `repo` scope to use this endpoint with a private repository.

### [Fine-grained access tokens for "List workflow run artifacts"](#list-workflow-run-artifacts--fine-grained-access-tokens)

 This endpoint works with the following fine-grained token types :


- [GitHub App user access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [GitHub App installation access tokens](/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Fine-grained personal access tokens](/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)

 The fine-grained token must have the following permission set:


- "Actions" repository permissions (read)

 This endpoint can be used without authentication or the aforementioned permissions if only public resources are requested.

### [Parameters for "List workflow run artifacts"](#list-workflow-run-artifacts--parameters)

 Headers
| Name, Type, Description |
| `accept` string Setting to `application/vnd.github+json` is recommended. |

 Path parameters
| Name, Type, Description |
| `owner` string Required The account owner of the repository. The name is not case sensitive. |
| `repo` string Required The name of the repository without the `.git` extension. The name is not case sensitive. |
| `run_id` integer Required The unique identifier of the workflow run. |

 Query parameters
| Name, Type, Description |
| `per_page` integer The number of results per page (max 100). For more information, see "[Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)." Default : `30` |
| `page` integer The page number of the results to fetch. For more information, see "[Using pagination in the REST API](https://docs.github.com/rest/using-the-rest-api/using-pagination-in-the-rest-api)." Default : `1` |
| `name` string The name field of an artifact. When specified, only artifacts with this name will be returned. |
| `direction` string The direction to sort the results by. Default : `desc` Can be one of : `asc`, `desc` |

### [HTTP response status codes for "List workflow run artifacts"](#list-workflow-run-artifacts--status-codes)


| Status code | Description |
| `200` | OK |



### [Code samples for "List workflow run artifacts"](#list-workflow-run-artifacts--code-samples)

#### Request example

 get /repos /{owner} /{repo} /actions /runs /{run_ id} /artifacts


- cURL
- JavaScript
- GitHub CLI

 Copy to clipboard curl request example

 `curl -L \
 -H "Accept: application/vnd.github+json" \
 -H "Authorization: Bearer <YOUR-TOKEN>" \
 -H "X-GitHub-Api-Version: 2026-03-10" \
 https://api.github.com/repos/OWNER/REPO/actions/runs/RUN_ID/artifacts`

#### Response


- Example response
- Response schema

 `Status: 200`

 `{
 "total_count": 2,
 "artifacts": [
 {
 "id": 11,
 "node_id": "MDg6QXJ0aWZhY3QxMQ==",
 "name": "Rails",
 "size_in_bytes": 556,
 "url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/11",
 "archive_download_url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/11/zip",
 "expired": false,
 "created_at": "2020-01-10T14:59:22Z",
 "expires_at": "2020-03-21T14:59:22Z",
 "updated_at": "2020-02-21T14:59:22Z",
 "digest": "sha256:cfc3236bdad15b5898bca8408945c9e19e1917da8704adc20eaa618444290a8c",
 "workflow_run": {
 "id": 2332938,
 "repository_id": 1296269,
 "head_repository_id": 1296269,
 "head_branch": "main",
 "head_sha": "328faa0536e6fef19753d9d91dc96a9931694ce3"
 }
 },
 {
 "id": 13,
 "node_id": "MDg6QXJ0aWZhY3QxMw==",
 "name": "Test output",
 "size_in_bytes": 453,
 "url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/13",
 "archive_download_url": "https://api.github.com/repos/octo-org/octo-docs/actions/artifacts/13/zip",
 "expired": false,
 "created_at": "2020-01-10T14:59:22Z",
 "expires_at": "2020-03-21T14:59:22Z",
 "updated_at": "2020-02-21T14:59:22Z",
 "digest": "sha256:cfc3236bdad15b5898bca8408945c9e19e1917da8704adc20eaa618444290a8c",
 "workflow_run": {
 "id": 2332942,
 "repository_id": 1296269,
 "head_repository_id": 1296269,
 "head_branch": "main",
 "head_sha": "178f4f6090b3fccad4a65b3e83d076a622d59652"
 }
 }
 ]
}`
