---
url: https://docs.github.com/en/rest/credentials/revoke
retrieved: 2026-10-13
command: firecrawl scrape https://docs.github.com/en/rest/credentials/revoke --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Revocation - GitHub Docs
---
[Skip to main content](https://docs.github.com/en/rest/credentials/revoke?apiVersion=2026-03-10#main-content)

[Skip to content](https://docs.github.com/en/rest/credentials/revoke?apiVersion=2026-03-10#main-content)

Collapse sidebar

Expand sidebar

The REST API is now versioned.For more information, see " [About API versioning](https://docs.github.com/rest/overview/api-versions)."

# Revocation

Use the REST API to revoke credentials that you have found exposed on GitHub or elsewhere.

## [Revoke a list of credentials](https://docs.github.com/en/rest/credentials/revoke?apiVersion=2026-03-10\#revoke-a-list-of-credentials)

Submit a list of credentials to be revoked. This endpoint is intended to revoke credentials the caller does not own and may have found exposed on GitHub.com or elsewhere. It can also be used for credentials associated with an old user account that you no longer have access to. Credential owners will be notified of the revocation.

This endpoint currently accepts the following credential types:

- Personal access tokens (classic) (`ghp_`)
- Fine-grained personal access tokens (`github_pat_`)
- OAuth app access tokens (`gho_`)
- User-to-server tokens from GitHub Apps (`ghu_`)
- Refresh tokens from GitHub Apps (`ghr_`)

Revoked credentials may impact users on GitHub Free, Pro, & Team and GitHub Enterprise Cloud, and GitHub Enterprise Cloud with Enterprise Managed Users.
GitHub cannot reactivate any credentials that have been revoked; new credentials will need to be generated.

To prevent abuse, this API is limited to only 60 unauthenticated requests per hour and a max of 1000 tokens per API request.

Note

Any authenticated requests will return a 403.

### [Parameters for "Revoke a list of credentials"](https://docs.github.com/en/rest/credentials/revoke?apiVersion=2026-03-10\#revoke-a-list-of-credentials--parameters)

| Name, Type, Description |
| --- |
| `accept`string<br>Setting to `application/vnd.github+json` is recommended. |

Headers

| Name, Type, Description |
| --- |
| `credentials`array of stringsRequired<br>A list of credentials to be revoked, up to 1000 per request. |

Body parameters

### [HTTP response status codes for "Revoke a list of credentials"](https://docs.github.com/en/rest/credentials/revoke?apiVersion=2026-03-10\#revoke-a-list-of-credentials--status-codes)

| Status code | Description |
| --- | --- |
| `202` | Accepted |
| `422` | Validation failed, or the endpoint has been spammed. |
| `500` | Internal Error |

### [Code samples for "Revoke a list of credentials"](https://docs.github.com/en/rest/credentials/revoke?apiVersion=2026-03-10\#revoke-a-list-of-credentials--code-samples)

#### Request example

post/credentials/revoke

- cURL

- JavaScript

- GitHub CLI


Copy to clipboard curl request example

`curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
https://api.github.com/credentials/revoke \
  -d '{"credentials":["ghp_1234567890abcdef1234567890abcdef12345678","github_pat_0A1B2C3D4E5F6G7H8I9J0K_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456","gho_1234567890abcdef1234567890abcdef12345678","ghu_1234567890abcdef1234567890abcdef12345678","ghr_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"]}'`

#### Accepted

- Example response

- Response schema


`Status: 202`

Revocation - GitHub Docs
