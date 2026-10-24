# Brief - What does a GitHub App device-flow sign-in in the MoonAliza Electron app need on GitHub's side to read a user's private repositories read-only, refresh and end its tokens, and stay within GitHub's limits?

_Auto-drafted 2026-10-13 by `bin/brief.mjs` from the corpus (round 4), then authored by the reviewing
agent: the judged sections (contradictions, decision) are answered and the claims are grouped by
unknown below._

Reviewed by: agent

Sources: `research/` (21 captures, E-01..E-21, all on docs.github.com, all retrieved 2026-10-13
with `firecrawl-cli`; 20 graded complete and E-16 graded partial by length only - its stored source
holds the same short text; a chain of 21 ledger entries; four runs of 10, 2, 8 and 1 pages, 21
Firecrawl credits in total, balance 277 before and 256 after). Round 2 applied the round-1
verifier's findings F-1..F-9 and closed the completeness critic's external-fact gaps with eight more
owner pages (E-13..E-20). Round 3 applied the round-2 verifier's findings R2-1..R2-10 to the
contract, the evidence rows and this brief, with no new collection and no credits spent. Round 4
applied the brief verifier's residues S-1..S-7 and collected one owner page, GitHub's tutorial
"Building a CLI with a GitHub App" (E-21; 1 credit, balance 257 before and 256 after), used to settle
where the device-flow and refresh parameters go and which `Accept` header is sent (the design's open
fact OF-1). The brief check's fixes RC-1..RC-4 then also cite E-21 for how it handles an expired or
revoked token (U-5), with no new collection and no credits spent. Every claim below names the
E-row that carries it; each E-row's URL, line references and verbatim quotes are in
`research/EVIDENCE.md`.

**The prior project** is in this branch since merge commit d0df7e9:
`docs/research/2026-10-12-app-sign-in/` (from this project's folder, `../2026-10-12-app-sign-in/`).
"Prior E-xx" means a row of its `research/EVIDENCE.md`; the two cited here are prior E-01 (OAuth
app authorization, capture `research/raw/2026-10-12-authorizing-oauth-apps-github-docs-github-ce29d520.md`)
and prior E-08 (REST rate limits, capture
`research/raw/2026-10-12-rate-limits-for-the-rest-api-github-docs-github-4a04a6e2.md`), both
ledger-backed in that project.

**This is the phase-1 to phase-2 handoff. Gate: PASS** (`preflight` exit 0: 0 blocking, 12 checks
passing, 140 quotes found in their captures, a chain of 21 ledger entries that verifies; `handoff`
exit 0; both re-run after RC-1..RC-4 with this project's folder as the working directory).
Sixteen unknowns: fifteen CLOSED, one KNOWN-UNKNOWN with a day-one step (U-16: whether the device
flow's 50-per-hour cap and the 2,000-per-hour OAuth access token request limit count per app, and
whether polls and refreshes count toward the second). The gate's 15 warnings are all
`corroboration/one-voice` (each answer rests on GitHub's pages alone). They are accepted: every
question asks what GitHub's own API and settings do, and a non-GitHub page cannot overrule GitHub on
that.

Whoever you are - another agent, a different model, or a person - read this file first. If
something here is not enough to build from, name the missing fact rather than guessing it.

## Intent

MoonAliza (Electron + TypeScript desktop coding agent, Windows first) adds "Sign in to GitHub" so
`read_github` can read the user's **private** repositories, **read-only**. Today `read_github`
(`src/main/github.ts`) reads public repositories without credentials through
`GET /repos/{owner}/{repo}/commits/{ref}` and `GET /repos/{owner}/{repo}/contents/{path}`, sending
`X-GitHub-Api-Version: 2022-11-28`. The prior project fixed the shape: a **GitHub App** with the
**device flow**, read-only contents, expiring user tokens in the app's encrypted safeStorage vault,
**no client secret** in the binary. Claude.ai sign-in is not allowed and Sign in with ChatGPT is
not stated there; neither is designed here. This project collects the GitHub-side facts that
design needs (contract: `research/DISCOVERY.md`).

## What we verified

### Registration (U-8, U-1, U-14)

- **Settings** (E-03): Callback URL optional, and "If your app uses device flow instead of web
  application flow to generate a user access token, this field will be ignored." Keep **Expire
  user authorization tokens** selected (GitHub "strongly recommends" it; expiry is on unless the
  app opts out, E-02). Select **Enable Device Flow**. Deselect webhook **Active** for an app used
  only for authentication. Name at most 34 characters, unique on GitHub; a Homepage URL is entered;
  up to 100 apps per account.
- **Visibility** (E-14, E-03, E-12): a **public** app "any user on GitHub can install it and
  authorize it"; a **private** app "can only be installed on the account that owns the app. Only
  members of the organization that owns it can authorize it" (E-14 line 26). So the app must be
  public. The registration form's choice is *Only on this account* or *Any account*, linked to the
  public-or-private page (E-03 line 93); that *Any account* is the public setting is an
  **inference** from that link and the matching wording of E-14 line 20, not a GitHub sentence.
  Public apps get a landing page with an **Install** button (E-14 line 47).
- **Request user authorization (OAuth) during installation** starts the *web* flow right after
  installation (E-01, line 194), which needs a callback URL. Leave it off (an inference from E-01
  and E-03, not a GitHub statement).
- **Permissions** (U-1): request the repository permission **Contents: Read-only**. GitHub lists
  every read `read_github` needs under Contents with access `read` for user access tokens:
  `commits/{ref}`, `contents/{path}`, `git/trees/{tree_sha}`, `git/blobs/{file_sha}`, `readme`,
  `tarball/{ref}`, `zipball/{ref}` (E-05, lines 1007-1036). Also request **Metadata: Read-only**:
  `GET /user/installations/{installation_id}/repositories` requires it (E-07, line 465) and it
  covers `GET /repos/{owner}/{repo}` (E-05, line 1181). Levels are Read-only, Read & write, No
  access (E-03). Apps start with no permissions but a user token still reads public resources
  (E-04; "The app will always have at least read-only access to all public repositories on
  GitHub", E-13 line 84). Whether GitHub makes Metadata mandatory or adds it automatically is **not
  stated** (E-04, E-05); selecting it explicitly makes that moot.
- **Insufficient permissions** return **403**: "If your app makes a REST API request with
  insufficient permissions, the API will return a `403` response." (E-04 line 75); the error is
  named "Resource not accessible by integration", meaning "your token has insufficient permissions"
  (E-15 line 108). Apart from rate limits (E-15 line 32), this is the **only 403 cause** the
  captured pages document for a GitHub App token reading a repository (the 403 of E-11 line 43 is
  for any authenticated call to `POST /credentials/revoke`, not a read): the app's access to a
  repository is on GitHub's **404** checklist (E-15 line 68), and SAML has no stated status (E-01
  line 34). Unapproved updated permissions are on the same 404 checklist (E-15 line 70), but an
  installation keeps its old permissions until its owner approves (E-04 line 57), so a read that
  needs a newly requested permission may come back as a 403 instead - an **inference** from E-04
  lines 57 and 75: that cause may surface as either status. So may insufficient permissions
  themselves, since the same checklist also names the app's and the user's permissions (E-15 lines
  66-67; see Contradictions). GitHub says the `X-Accepted-GitHub-Permissions` header comes "in the
  REST API response" and lists the permissions an endpoint requires, comma-separated, with
  semicolons between alternative sets (E-04 line 77, E-15 lines 110-112). It is **not** described as
  appearing only on failures, so it is a hint, never the test for "missing permission"; the body
  text is GitHub's documented signal.
- **Changing permissions later** (U-14): GitHub notifies the owner of each account where the app is
  installed; until they approve, "the GitHub App will still retain its current permissions" and
  "may not function as expected" (E-19 lines 26-28; E-04 line 57). A user who only authorized the
  app is not notified (E-19 line 30). A user-token request can 404 until the user has approved
  updated permissions (E-15 line 70). A widened permission set reaches users one installing account
  owner at a time, so the read-only set should be the one shipped.

### Sign-in: the device flow (U-3, U-16)

- `POST https://github.com/login/device/code` with `client_id` (E-01, line 118). Add
  `scope=offline_access` to get an expiring token and refresh token even if the app's expiry
  setting were ever switched off; it is the only scope GitHub Apps accept (E-01 line 120, E-02).
- Response (E-01, lines 128-132): `device_code` (40 characters), `user_code` (8 characters with a
  hyphen), `verification_uri` = `https://github.com/login/device`, `expires_in` (default 900 s),
  `interval` (default 5 s). Show `user_code`, open `verification_uri` in the user's browser.
- Poll `POST https://github.com/login/oauth/access_token` with `client_id`, `device_code`,
  `grant_type=urn:ietf:params:oauth:grant-type:device_code` - **no client secret** (E-01, lines
  138-146). Optional `repository_id` narrows the token to one repository (E-01, line 147). Never
  poll faster than `interval`; `slow_down` adds 5 s and returns the new `interval` (E-01).
  GitHub defines `interval` as the wait before "you can make a new access token request (`POST
  https://github.com/login/oauth/access_token`) to complete the device authorization", and polling
  sooner means "you will hit the rate limit and receive a `slow_down` error" (E-01 line 132): every
  poll is an access token request, to the same endpoint a refresh uses (see Rate limits).
- **Errors.** While the code is pending, GitHub "will respond with a 200 status and an `error`
  response query parameter" (E-01, line 152). The HTTP status of the other error codes is **not
  stated**, and the page lists **no** error responses for step 1 (`/login/device/code`) at all.
  So the client reads `error` from the body whatever the status, and handles a step-1 failure
  (non-2xx, or a body with `error`) on its own path. Codes: `authorization_pending` (keep polling),
  `slow_down` (back off), `expired_token` (restart), `access_denied` (user cancelled; the code
  cannot be reused), `device_flow_disabled` (registration setting off),
  `incorrect_client_credentials`, `incorrect_device_code`, `unsupported_grant_type`, and from the
  troubleshooting section `bad_verification_code` and `unverified_user_email` (E-01). See
  Contradictions for two codes the page names twice.
- Success (E-01, lines 173-178): `access_token` (starts `ghu_`), `expires_in` always 28800 (8 h),
  `refresh_token` (starts `ghr_`), `refresh_token_expires_in` always 15897600 (6 months), `scope`
  an empty string, `token_type` `bearer`. "If the token doesn't expire, this parameter will be
  omitted" - a response without `expires_in` means a non-expiring token.
- **Where the parameters go, and the `Accept` header** (the design's open fact OF-1, settled for
  the device flow in round 4): E-01 calls the inputs "query parameters" (lines 118, 138) but uses
  the same words for the response fields (lines 122, 167), so the reference page does not settle
  it. GitHub's own device-flow tutorial does (E-21, lines 294-325). Step 1 is
  `uri = URI("https://github.com/login/device/code")`,
  `parameters = URI.encode_www_form("client_id" => CLIENT_ID)`,
  `headers = {"Accept" => "application/json"}` and `Net::HTTP.post(uri, parameters, headers)`; the
  poll sends `client_id`, `device_code` and `grant_type` the same way to
  `https://github.com/login/oauth/access_token`. So both device-flow requests send their inputs in
  a **form-encoded request body**, with **`Accept: application/json`** and **no query string**.
  That `Net::HTTP.post` sends them as an `application/x-www-form-urlencoded` body is Ruby's standard
  library, not stated on the page (an **inference**); whether the query placement also works is
  not stated. The tutorial parses each response as JSON ("When the response status is `200 OK` or
  `201 Created`, the function returns the parsed response body", line 277), which matches the
  OAuth-app page's `Accept: application/json` for the same two endpoints (prior E-01, lines 200-221
  and 266-277). The responses' `Content-Type` is not stated, so the client still parses
  form-encoded and JSON bodies by `Content-Type`. The tutorial makes no refresh request; see
  Staying signed in.
- **Device-flow limits** (U-16, KNOWN-UNKNOWN): "there is a rate limit of 50 submissions in an hour
  per application" is stated on the **OAuth-app** page only (prior E-01, line 307); no GitHub App
  page captured states a device-flow limit (E-01, E-16). If it applies per GitHub App, it caps
  sign-ins across every MoonAliza install in an hour. Separately, polls may count toward the
  2,000 OAuth access token requests per hour (see Rate limits). Day-one step in Known unknowns.

### Which repositories, who installs, and what a failed read returns (U-2, U-10, U-11)

- **Reach is the intersection** (E-01, E-04): "a user access token can only access resources that
  both the user and app can access"; repository permissions apply to repositories of the account
  where the app is installed (E-04).
- **Signing in installs nothing**: "You can install a GitHub App without authorizing the app.
  Similarly, you can authorize the app without installing the app." (E-13, line 58). The device
  flow authorizes; installation is a separate step on GitHub, where the installer picks *All
  repositories* or *Only select repositories* (E-13 lines 36, 84-88).
- **Reach after a later install is not stated**: E-01 states reach in the present tense only (line
  38), and no capture says whether a token issued **before** the app is installed on an account,
  or before a repository is added to an installation, reaches that repository afterwards without a
  new sign-in. The install path below depends on it, so it is a day-one check (Known unknowns), and
  until it is settled **every** install or add route the message names - on the user's own account
  and on an organization alike (Decision step 4) - adds "if it still fails after the app is
  installed or the repository added, sign in again".
- **Who may install** (E-13, lines 64-76): anyone on their own personal account; organization
  owners on their organization; repository admins in the organization that owns their repository
  when the app requests no organization permission and not "Repository administration" - true of a
  Contents-and-Metadata app - and only for the repositories they administer, unless the owners have
  switched that off. "If an organization owner has already installed an app, repository
  administrators can update the existing installation to give the app access to repositories that
  they administer" (line 70), whatever the app's permissions - unless the owners restrict it: "When
  this restriction is enabled, repository admins cannot install or add GitHub Apps for their
  repository and must instead request that organization owners install the desired app" (line 72).
  So a repository admin **may** be able to add a repository to an existing installation; if not,
  they ask an owner. Members and outside collaborators who
  cannot install can still pick the organization; "Instead of installing the app, GitHub will send
  a notification to the organization owner to request the organization owner to install the app"
  (line 74), shown as **Install and request** or **Request** (line 94), unless the organization's
  app access request policy blocks requests. The app manager role cannot install (line 76). The
  install location is "your personal account or an organization that you are a member of" (line
  82), so a collaborator on another person's *personal* repository has to ask that person (a reading
  of the option list). Lines 74 and 82 disagree about outside collaborators; see Contradictions.
- **Install link** (E-12, E-13 line 80): `https://github.com/apps/APP-NAME/installations/new`,
  where `APP-NAME` "is the name of the GitHub App" (E-12 line 53); a `state` query parameter can be
  added and is preserved through installation. How a name with capitals, spaces or special
  characters is written in that URL is **not stated**: E-03 line 53 describes a lowercased,
  hyphenated form of the name only as what "will be shown in the user interface when your app takes
  an action", not as the URL segment, and no capture uses the word "slug". GitHub's own route to the
  URL is the app's public page: Edit, **Public page**, then "Click **Install**. GitHub will bring you
  to the installation URL for your GitHub App." (E-12 lines 49-53). So the URL is copied from there,
  never derived from the name.
- **Listing** (E-07): `GET /user/installations` (no permission needed) and
  `GET /user/installations/{installation_id}/repositories` (Metadata read); both paginate with
  `per_page` up to 100 (default 30); each repository carries a `permissions` key. Adding a
  repository through the API needs a *write* permission and an admin user (E-07), so a read-only
  app sends the user to GitHub instead.
- **A failed private read** (U-10, E-15): for a private resource the request does not reach, GitHub
  returns `404 Not Found` "instead of a `403 Forbidden` response to avoid confirming the existence
  of private repositories" (line 46). For a 404 on an existing resource with a GitHub App user
  access token, GitHub's own checklist is: the app has the permission, the user has it, "The GitHub
  App has access to any repositories that the endpoint will affect", "The user has access to any
  repositories that the endpoint will affect", and "The user has approved any updated permissions
  for your GitHub App" (lines 65-70). A 404 therefore cannot say which; the client must not claim
  "not installed". Organizations with SAML SSO also hide resources, and GitHub's remedy has **two
  steps**: "instruct the user to start an active SAML session for their organization before
  reauthorizing" (E-01, line 34; status not stated). For MoonAliza that is: start a SAML session for
  the organization on GitHub, **then sign in to MoonAliza again** (that reauthorizing a device-flow
  app means running the device flow again is an inference). Whether the existing token reaches the
  organization once the session starts, without a new sign-in, is not stated (Known unknowns).

### Endpoints and the signed-in login (U-7, U-15, U-9)

- **Endpoints that accept the token** (E-06): `GET /repos/{owner}/{repo}/commits/{ref}`,
  `/contents/{path}`, `/git/trees/{tree_sha}`, `/git/blobs/{file_sha}`, `/tarball/{ref}`,
  `/zipball/{ref}`, the two listing endpoints, and `GET /user` (line 1231). Both endpoints
  `read_github` uses today are on the list and need only Contents read (E-05). Requests send
  `Authorization: Bearer <token>` (E-01, line 187) and a `User-Agent`: "Requests without a valid
  `User-Agent` header will be rejected" (E-15, line 159).
- **The login** (U-15, E-20): `GET /user` "works with" GitHub App user access tokens and "The
  fine-grained token does not require any permissions" (lines 34-39); statuses 200, 304, 401, 403;
  the example response carries `login` and `id` (lines 82-83). Whether a GitHub App user token gets
  the public or the private user response is not stated (line 28 names OAuth app tokens and
  classic PATs only); MoonAliza needs only `login`, expected in either, seen on day one.
- **API version** (U-9, closed in round 2, E-18): `2022-11-28` is supported until **March 10,
  2028**; `2026-03-10` has no end date (lines 109-112). A previous version stays supported at least
  24 months after a newer one (line 53); a retired version returns `410 Gone`, with `Deprecation`
  and `Sunset` headers beforehand (lines 65, 79-82); a version that does not exist returns `400`
  (E-15, line 153). Breaking changes, including "Changing authentication or authorization
  requirements", "will be released in a new API version" (E-18 lines 32, 42) - **except** the
  security, availability and low-usage exceptions GitHub lists (E-18 lines 91-103): GitHub may "in
  rare cases, introduce a breaking change to an existing version to protect users and platform
  integrity" (line 97), and "For certain services with very low usage, GitHub may deprecate
  functionality outside the standard versioning process" (line 103). So `2022-11-28` is the
  version to keep, but a break inside it is rare, not impossible.

### Staying signed in: refresh (U-4)

- `POST https://github.com/login/oauth/access_token` with `client_id`, `grant_type=refresh_token`,
  `refresh_token`; `client_secret` is "**Required** unless the user access token was generated
  using the device flow" (E-02, line 79).
- **Where the refresh parameters go is not stated**: E-02 calls them "query parameters" (line 72),
  and GitHub's tutorial makes no refresh request (E-21). A refresh goes to the same endpoint as the
  device-flow poll (E-01 line 132, E-02 line 72), so the client sends them the way E-21 sends the
  poll's - a form-encoded body with `Accept: application/json` and no query string. That is an
  **inference**, checked by the day-one test of two refreshes in a row (Known unknowns).
- **The exemption is worded per token.** The first refresh of a device-flow token is documented.
  Whether a token produced *by a refresh* still counts as "generated using the device flow" is
  **not stated**; the six-month sign-in rests on reading it that way, so it is a day-one check
  (Known unknowns) before the refresh scheduler ships.
- **Single use, both replaced**: "You can use the refresh token to generate a new user access token
  and a new refresh token. Once you use a refresh token, that refresh token and the old user access
  token will no longer work." (E-02, line 36)
- Failure: `bad_refresh_token` (invalid or expired) means a new device flow; a wrong grant type is
  `unsupported_grant_type` (E-01). An unused refresh token lapses after 6 months (E-02). The **HTTP
  status of refresh errors**, `bad_refresh_token` included, is **not stated** (E-01 line 275 gives
  none; E-02 lists no error responses), so a refresh response is read for `error` whatever its
  status, exactly as the device-flow poll is.
- Expiry is the default but "currently an optional feature and are subject to change" (E-02).

### Rate limits (U-12, U-16)

- A GitHub App's limit "depends on whether the app authenticates with a user access token or an
  installation access token" (E-16, line 27), and "When you make API requests with a user access
  token, the rate limits for user access tokens apply" (E-01, line 40). The numbers are on the REST
  rate-limit page (prior E-08): the signed-in user's own 5,000 requests/hour, shared with every app
  and token acting for that user (lines 46, 60); secondary limits, including "No more than 2,000
  OAuth access token requests per hour are allowed for GitHub Apps and OAuth apps" (line 95).
- **The 2,000 per hour and the device flow** (U-16): whether that limit counts **per app** or per
  user is **not stated**, and neither is whether device-flow polls - each "a new access token
  request" to `github.com/login/oauth/access_token` (E-01 line 132) - or refreshes count toward it.
  At the defaults (900 s code lifetime, 5 s interval, E-01 lines 131-132) one sign-in left pending
  can poll up to 180 times, so if polls count per app, about eleven sign-ins left pending for their
  whole lifetime in one hour would reach 2,000 across every MoonAliza user (arithmetic, not a GitHub
  figure). Refreshes add to that if they count: an access token lasts 8 hours (E-02 line 34), so a
  MoonAliza running all day refreshes about three times a day, and across all users that is about
  active users x 3 / 24 refreshes an hour, which reaches 2,000 at about 16,000 users active across a
  day (**arithmetic**, not a GitHub figure; it matters only if refreshes count toward the limit and
  the limit counts per app, neither stated). Both are part of U-16's product risk.
- **What a limit returns** (E-15, lines 32-38): a primary limit gives `403` or `429` with
  `x-ratelimit-remaining` `0` - wait until `x-ratelimit-reset` (UTC epoch seconds), and **no
  `retry-after` is promised**; a secondary limit gives `403` or `429` "and an error message that
  indicates that you exceeded a secondary rate limit" (exact wording not given); "If the
  `retry-after` response header is present", wait that long; "Otherwise, wait for at least one
  minute before retrying." So a secondary-limit 403 may carry neither header. E-15 describes the
  REST API; whether `github.com/login/oauth/access_token` answers a limit with the same statuses and
  headers is **not stated**, so the Decision applies the same classification to poll and refresh
  responses as a precaution.
- **Stated for OAuth apps, not for GitHub Apps**: the device flow's 50 submissions per hour per
  application (prior E-01 line 307; U-16) and the ten tokens per user/application/scope with ten new
  per hour, which sits under the heading "Token revoked due to excess of tokens for an OAuth app
  with the same scope" (E-09 line 78). Neither is stated for GitHub Apps; the design stays within
  the second anyway, and treats the first as a product risk.

### Ending a sign-in (U-5, U-13)

- **The app cannot revoke through the OAuth-authorization endpoints**: `DELETE
  /applications/{client_id}/token` and `DELETE /applications/{client_id}/grant` both require Basic
  authentication with `client_id` and `client_secret` (E-08). MoonAliza holds no secret.
- **The credential revocation API** `POST /credentials/revoke` takes **no** authentication (an
  authenticated call returns 403), accepts `ghu_` and `ghr_` among up to 1000 credentials per call,
  allows 60 requests/hour, returns 202, and "Credential owners will be notified of the revocation."
  GitHub states its purpose as credentials "the caller does not own and may have found exposed"
  (E-11, E-09).
- **A local sign-out leaves the grant live on GitHub**: since the app cannot revoke (E-08), once
  MoonAliza deletes its copies the authorization and both tokens stay valid on GitHub until the user
  revokes them there (E-17) or they expire - "The user access token expires after eight hours, and
  the refresh token expires after six months." (E-02 line 34). An inference from E-08 and E-02; the
  sign-out help text says so.
- **Where the user revokes** (U-13, E-17, lines 38-44): profile picture, **Settings**, the
  "Integrations" section, **Applications**, the **Authorized GitHub Apps** tab, then **Revoke** next
  to the app (or **Revoke all**). No direct URL is given (not stated). "The authorization can only be
  revoked by the person who authorized the GitHub App. Organization owners cannot revoke GitHub App
  authorizations for their members", but they can uninstall the app from the organization (line 34).
  Revoking "will revoke any tokens associated with the app" (E-09).
- **After revocation** a call with the revoked token gets `401 Bad Credentials` (E-01, line 44).
  The page gives that status for a **revoked** token only. For an **expired** GitHub App access
  token, GitHub's CLI tutorial treats an expired or revoked token as a 401 on `GET /user`: "handle
  the case where the token has expired or been revoked. Now, if you get a `401 Unauthorized`
  response, the CLI will prompt the user to run the `login` command." (E-21 line 592). That is a
  tutorial's handling, **not a reference statement**: the tutorial shows only an altered token,
  never an expired one (E-21 lines 818-824), and no reference page states the status. E-15 lists
  expired tokens among 404 causes for personal access tokens and installation tokens (lines 53-64)
  **and** for OAuth app user access tokens (line 75), but not on its GitHub App user-access-token
  list (lines 65-70); since "A user access token is a type of OAuth token" (E-01 line 36), a 404
  for an expired GitHub App token on a private repository is still plausible **by analogy** - not a
  statement about GitHub App tokens - so it stays a day-one check (Known unknowns). So a 401 alone
  does not mean "revoked", and an expired token could come back as a 404 that looks like a missing
  repository; the Decision never knowingly sends one; a token that expires in flight, or after a
  local clock change, can still reach GitHub (Known unknowns), and a 404 then gets the step-4
  message. GitHub also sends a `github_app_authorization` webhook, which "GitHub Apps cannot
  unsubscribe from" (E-01, line 44); MoonAliza has no webhook endpoint, so it will not receive it
  (an inference about MoonAliza; whether GitHub delivers it to an app with webhooks inactive is not
  stated).
- **GitHub revokes or expires on its own** (E-09): a token pushed to a public repository or gist;
  an OAuth token unused for one year (whether this covers GitHub App user tokens is not stated);
  the ten-token rule above (stated for OAuth apps); enterprise or organization owners revoking SSO
  authorizations; and the 8-hour expiry. A revoked or expired token cannot be restored (E-09).

### Token formats (U-6)

- Prefixes (E-10): `ghp_` classic PAT, `github_pat_` fine-grained PAT, `gho_` OAuth app token,
  **`ghu_` GitHub App user access token**, `ghs_` installation token, **`ghr_` GitHub App refresh
  token**; confirmed for `ghu_` and `ghr_` by the token responses (E-01, E-02), and for `ghu_` by
  E-08 (which names `gho_` and `ghu_`, not `ghr_`).
- Lengths are **not stated** for `ghu_`/`ghr_`. GitHub changed installation-token length in 2026
  (stateless `ghs_` format since April 27, 2026), warning apps that assume 40 characters, and gives
  the new format only as a placeholder of several parts after the prefix (E-10, line 145). A shape
  check therefore reads the prefix and assumes neither a length nor a character set after it.

## Contradictions and how they were resolved

- **Expired device code, two names** (E-01, line 160): the error-table row is `expired_token`, but
  its text says "you will see the `token_expired` error". Not resolvable from GitHub's page; the
  client treats **both** as "code expired, restart the flow".
- **Wrong device code, two names** (E-01): the table lists `incorrect_device_code` (line 163); the
  troubleshooting section says a wrong or expired `device_code` returns `bad_verification_code`
  (line 269). The client treats **both** as "restart the flow".
- **Who can pick an organization at install time** (E-13, verifier R2-9): line 74 says
  "Organization members and outside collaborators that cannot install an app on the organization
  can still select the organization during the install process", while line 82 offers only "your
  personal account or an organization that you are a member of" - and an outside collaborator is not
  a member. Not resolvable from the page. Resolved for the message: an outside collaborator is told
  to try the install page and, if the organization is not offered there, to ask an organization
  owner; the message promises neither outcome.
- **Client secret on refresh - no contradiction, but narrower than round 1 said**: E-01 marks
  `client_secret` **Required** in its tables (lines 79, 211), which belong to the web-flow and
  install-time code exchanges; the refresh page exempts tokens "generated using the device flow"
  (E-02, line 79). Trusted: E-02, the page that owns refresh. Round 1 wrote this as "a device-flow
  app refreshes with no secret"; the sentence is per token, so only the first refresh is documented
  and the rest is a day-one check (verifier F-4).
- **What a 401 means** (verifier F-1): round 1 read every 401 as "revoked" and cleared the vault.
  GitHub states 401 for a revoked token (E-01 line 44). For an expired one, GitHub's CLI tutorial
  treats an expired or revoked token as a 401 on `GET /user` (E-21 line 592) - a tutorial's
  handling, not a reference statement - and a 404 on a private repository is still plausible by
  analogy (E-15), so the status stays a day-one check (Known unknowns). Resolved in the Decision:
  expiry is checked before each request, a call is never sent with a token known to be expired, and
  a 401 triggers one refresh and one retry before the vault is cleared.
- **What a 403 means** (verifier F-3, R2-1): round 1 read `X-Accepted-GitHub-Permissions` on a 403
  as "missing permission"; round 2 then listed causes GitHub never ties to 403 and dropped the one it
  does. GitHub describes the header as part of REST API responses generally (E-04 line 77, E-15 line
  110), a rate-limit 403 need not carry `retry-after` (E-15 lines 32-38), and, apart from rate
  limits (E-15 line 32), the only 403 cause the captured pages document for an app token reading a
  repository is insufficient permissions (E-04 line 75, E-15 line 108). Round 3 counted unapproved
  updated permissions among the 404-only causes while using them as the 403 example (verifier S-3);
  they are on the 404 checklist (E-15 line 70) and may also surface as a 403 (an inference from E-04
  lines 57 and 75), so both statuses are allowed for them. The same holds for insufficient
  permissions themselves (brief check RC-4): GitHub ties them to a 403 (E-04 line 75) and also lists
  the app's and the user's permissions on its user-token 404 checklist (E-15 lines 66-67), so a
  missing permission may surface as either status.
  Resolved in the Decision: rate limits are recognised first, then a 403 is read as a missing
  permission, with the body text as GitHub's signal and the header as a hint; other causes are
  labelled as possibilities GitHub does not state for 403.
- **What a 404 means** (verifier F-2): round 1 read a 404 on a private-looking repository as "not
  installed". GitHub lists five things to check for such a 404 (E-15 lines 65-70), plus SAML
  (E-01 line 34). Resolved: the message names the possibilities and never one cause.
- **Round-2 misreadings, corrected in round 3** (verifier R2-5, R2-7): round 2 wrote that E-15 lists
  expired tokens as a 404 cause only for personal access tokens and installation tokens; it also
  lists them for OAuth app user access tokens (line 75). Round 2 wrote that breaking changes come
  "only" in a new version; E-18 lists exceptions (lines 91-103). Both corrected above and in the
  contract.
- **Two revocation APIs, different purposes - no contradiction**: E-08's endpoints need the client
  secret; E-11's needs none. E-11 is not used for routine sign-out, because GitHub describes it for
  credentials the caller does not own and notifies the owner.
- **API version - resolved in round 2**: every captured example sends `2026-03-10`, while
  `read_github` sends `2022-11-28`; E-18 shows `2022-11-28` supported until March 10, 2028. A
  version that does not exist returns `400` (E-15 line 153) and a retired one `410 Gone` (E-18 line
  65): two different cases, not a contradiction.
- **Limits stated for OAuth apps** (verifier F-6): round 1 applied the 50-per-hour device-flow cap
  and the ten-token rule to the GitHub App as fact. Both sit on OAuth-app pages or headings (prior
  E-01 line 307, E-09 line 78), and the GitHub App rate-limit page states neither (E-16). Labelled
  "stated for OAuth apps; not stated for GitHub Apps"; the cap is U-16.
- **Parameter placement and response encoding** (the design's OF-1, round 4): GitHub's reference
  pages call the inputs "query parameters" (E-01 lines 118, 138; E-02 line 72), while GitHub's own
  tutorial sends the device-flow inputs in a form-encoded body with `Accept: application/json` and
  no query string, and parses the response as JSON (E-21 lines 294-327). Both are GitHub's pages.
  Trusted for the placement: E-21, because it is GitHub's working code for these two endpoints,
  while the reference page uses the same phrase for response fields (E-01 lines 122, 167), which
  E-21 reads from the response body - so the phrase reads as loose wording (an inference). The
  refresh is not in E-21; it follows the poll by inference and is checked on day one. Response
  bodies are still parsed by `Content-Type` (JSON or form-encoded), since no page states it.

## Known unknowns

- **U-16 - do the device flow's 50-submissions-per-hour cap and the 2,000 OAuth access token
  requests per hour count per app, and do polls and refreshes count toward the 2,000?**
  (KNOWN-UNKNOWN.) Day one, by the product owner with the registered app, before release: ask GitHub
  Support (1) whether the device flow's code-submission limit applies to GitHub Apps and whether it
  counts per app, (2) whether the 2,000 OAuth access token requests per hour counts per app or per
  user, and (3) whether device-flow polls and refreshes count toward it; record the answers in
  DISCOVERY.md's U-16 row. Or, with a test account, submit codes for the registered app past 50 in
  one hour and record what github.com/login/device shows and what the poll returns. Until then
  assume both count per app: give `expired_token` a message that also says GitHub may be limiting
  sign-ins (try again later), classify poll and refresh responses for rate limits first, and record
  the expected sign-ins and refreshes per hour across all installs as a product risk.
- **Two refreshes in a row without a secret** (verifier F-4; U-4). Day one, with the registered
  app, before the refresh scheduler ships: run the device flow, then refresh twice in a row with
  no `client_secret`; both must succeed. The refresh parameters go in a form-encoded body with
  `Accept: application/json`, as E-21 sends the poll's (U-4); if even the first refresh fails,
  record its status and body before reading anything into the secret exemption, because a wrong
  placement would fail it too. If the second fails, the documented exemption covers only
  device-flow tokens, and the fallback is a product decision recorded before release: either the
  user signs in again with the device flow every 8 hours, or the registration deselects *Expire
  user authorization tokens* (which GitHub "strongly recommends" leaving selected, E-03) - never a
  shipped client secret.
- **Token reach after installing** (verifier R2-3, S-4; U-2, U-10). Day one, with the registered
  app, before the install message ships: sign in first; then install the app on the user's own
  account with *Only select repositories*; read a selected private repository with the existing
  token; then add another repository to the installation and read it with the same token. Where a
  test organization is available, repeat for the organization routes with a token issued before
  each change: an owner installs the app on the organization, then a repository admin adds a
  repository they administer to that installation. Record whether each read works without a new
  sign-in, and how soon after the change. If no organization is available, the own-account result
  is **assumed** to carry over to organizations (an assumption, not a GitHub statement), and the
  organization routes keep their sign-in-again line until an organization result is recorded.
  Until then every install or add route adds "if it still fails after the app is installed or the
  repository added, sign in again"; a route whose check shows reads work at once can drop it.
- Non-blocking, each with its check on day one with the registered app:
  - The status an **expired** access token gets (U-5): GitHub's tutorial treats an expired or
    revoked token as a 401 on `GET /user` (E-21 line 592, a tutorial, not a reference statement),
    and a 404 on a private repository is still plausible by analogy (E-15). Send a request with a
    token past its expiry, to `GET /user` and to a private repository, and record each status. The
    Decision never sends a token it knows to be expired (the pre-check refreshes when fewer than 5
    minutes remain, and a call whose pre-check refresh fails is failed without being sent), but a
    token can still reach GitHub expired - one that expires in flight, or after the local clock
    changes - and then either status reaches the error mapping; the check records which it is.
  - The HTTP status of **refresh errors** (U-4): refresh once with a refresh token already used,
    and record the status and body of `bad_refresh_token`; the client reads `error` whatever the
    status either way.
  - The **failed private read** in the field (U-10): read a private repository (a) on the user's own
    account before installing, (b) in an organization where the user is a member but not an owner,
    (c) in a SAML organization without an active session; record each status and its headers. For
    (c), then start a SAML session for the organization and retry with the **same** token, and
    record whether it reaches the organization without a new sign-in (verifier R2-2); the message
    says to sign in again either way.
  - *Any account* means public (U-8, U-11): after registering, the app's public page shows an
    **Install** button to another account (E-14 line 47).
  - `GET /user` returns `login` for the app's token (U-15).
  - The **response encoding** of the two github.com endpoints when sent `Accept: application/json`
    (U-3): E-21 parses JSON, but no page states the `Content-Type`; record it for a device-code
    answer and a token answer. Until then the client parses by `Content-Type`.
  - Whether Metadata is mandatory or added automatically (U-1): not stated; selected explicitly.
  - Whether the one-year-unused revocation applies to GitHub App user tokens (E-09): not stated;
    moot with expiring tokens, since an unused refresh token lapses after 6 months anyway (E-02).
  - Lengths and character sets of `ghu_`/`ghr_` tokens: not stated (E-10); the shape check reads
    the prefix only.
  - Expiring user tokens are "subject to change" (E-02): handle a token response without
    `expires_in` (a non-expiring token) explicitly rather than assuming 8 hours.
  - A direct URL for the Authorized GitHub Apps tab: not stated (E-17); the help text gives the
    navigation path.

## Decision

**Build the GitHub sign-in as a public GitHub App with the device flow, read-only.**

- **Registration** (by hand, once, by the account that will own the app): GitHub App, *Any
  account* (public); no callback URL; *Request user authorization during installation* off; no
  setup URL; *Expire user authorization tokens* on; *Enable Device Flow* on; webhook *Active* off;
  repository permissions **Contents: Read-only** and **Metadata: Read-only**, nothing else; no
  client secret generated for the app's use or shipped. The client ID (for the flow) and the app's
  **install URL** are the only app values the build needs, and neither is a credential. The product
  owner copies the install URL from the app's public page - Edit, **Public page**, **Install** (E-12
  lines 49-53) - and the build stores that URL as given; nothing derives it from the app's name (how
  a name is written in the URL is not stated, E-12 line 53, E-03 line 53). The device flow and
  refresh need the client ID with no secret (E-01, E-02). Which account owns the app, its name and
  its Homepage URL are the product owner's choice, not research.
- **Sign-in**: the device flow exactly as in U-3, with `scope=offline_access`, polling at
  `interval` and honouring `slow_down`. Both requests put their inputs in a form-encoded body with
  `Accept: application/json` and no query string, as GitHub's own tutorial does (E-21); the refresh
  does the same (an inference, U-4). The client reads `error` from the body whatever the HTTP
  status, and handles a step-1 failure (non-2xx or a body with `error` from `/login/device/code`)
  as its own case. Both names of each doubled error code are handled; every terminal error ends the
  attempt with a plain message, and `expired_token` also says GitHub may be limiting sign-ins (U-16).
  Each poll response is classified for rate limits **first**, as in Reading step 1 below (any 429;
  a 403 with `x-ratelimit-remaining: 0`; a 403 or 429 with `retry-after` or a secondary-limit
  message): a rate-limited poll waits as that step says and resumes polling while the device code
  is unexpired, and ends the attempt as `GITHUB_RATE_LIMIT` when the wait would pass `expires_in` (a
  design choice; whether this endpoint answers limits that way is not stated, E-15 describes the
  REST API).
- **Storage**: the access token and the refresh token are each stored as **their own vault value**,
  with both expiry times, so MoonAliza's existing exact-value vault redaction catches each one
  wherever it appears; never in the engine, logs, events, renderer, argv or files in clear (the
  repository's token invariant). The `ghu_`/`ghr_` prefixes are used **only** to validate the
  shape of the token response before storing it (prefix only, no length or character-set
  assumption, E-10). No prefix-based secret screen is added; the repository has none, and round 1's
  "add prefixes to the secret screen" is withdrawn (verifier F-8).
- **Refresh** (verifier F-1, adopted as written; R2-4 and R2-5 added; S-7 in round 4):
  - Check the access token's expiry **before every request** and refresh, **single-flight**, when
    **fewer than 5 minutes (300 s)** remain, with the expiry computed as the local time the token
    response was received plus `expires_in` (a design choice: GitHub states the 8-hour lifetime,
    E-01 line 174, E-02 line 34, and no margin). A call is **never knowingly sent with an expired
    token**.
  - A refresh response is classified for rate limits first (as in Reading step 1), then read for
    `error` from the body **whatever the HTTP status** (the status of refresh errors is not stated:
    E-01 line 275, E-02). Outcomes: success - persist the new pair, then use it; `bad_refresh_token`,
    with any status - clear the vault, sign-in required; rate-limited - **keep the vault** and fail
    the call as `GITHUB_RATE_LIMIT`; anything else (network error, timeout, 5xx, a body that is
    neither a token nor a known error) - **keep the vault** and fail the call with a retriable error,
    without sending it. These failure rules keep the expired-token status no reference page states
    (401 or 404, U-5) out of normal operation: an expired token is not sent knowingly. A token that
    expires in flight, or after a local clock change, can still reach GitHub (Known unknowns); a 401
    then takes the path below, and a 404 gets the step-4 message.
  - On a **401**, if the vault's refresh token is still within `refresh_token_expires_in`, refresh
    once and **retry the call once**. That refresh joins the **same single-flight** as the
    pre-check; if the vault's access token is no longer the one that got the 401 (another refresh
    rotated it meanwhile, E-02 line 36), skip the refresh and retry once with the current token.
    Clear the vault only when the refresh returns `bad_refresh_token`, or the retried call still
    returns 401.
  - Persist the new pair before using it, because the old pair is dead once the refresh succeeds
    (E-02); for the same reason a refresh, once sent, is not cancelled by a run's Stop or deadline
    (a design inference from E-02). A refresh whose response is lost after GitHub processed it leaves
    the vault holding a dead pair; the next refresh then gets `bad_refresh_token` and the user signs
    in again (an inference from E-02 line 36). Never refresh per request.
- **Reading and the error mapping** (verifier F-3, F-2, R2-1, R2-2, R2-3, R2-9, in this order;
  residues S-1..S-5 in round 4):
  1. **Rate limits first** (E-15 lines 32-38, prior E-08): any **429**; any **403 with
     `x-ratelimit-remaining: 0`** (wait until `x-ratelimit-reset`); any **403 or 429 with
     `retry-after` or a secondary-limit message** (wait `retry-after` seconds, else at least one
     minute) -> `GITHUB_RATE_LIMIT`. The same step classifies poll and refresh responses.
  2. **401** -> the refresh-once-and-retry path above; if it still fails, sign-in required.
  3. **403** otherwise -> **forbidden**, read first as the one 403 cause the captured pages document
     for a repository read once rate limits are excluded: **the app or your account lacks a
     permission this read needs** (E-04 line 75; E-15 line 108). One way that can happen is an
     installing owner who has not yet approved updated permissions - an **inference** from E-04
     lines 57 and 75 (and E-19 line 28), not a GitHub sentence; GitHub lists the same cause on its
     user-token 404 checklist (E-15 line 70), so it may surface as either status, and it is moot
     while MoonAliza ships its fixed read-only set. GitHub's documented signal is a body carrying
     "Resource not accessible by integration" (E-15 line 108); `X-Accepted-GitHub-Permissions` is a
     hint only (E-04 line 77, E-15 line 110). With that body text, the message names the missing
     permission and nothing else. Without it, the message leads with the missing permission and then
     lists, labelled as possibilities GitHub does not state for a 403: the app is not installed on
     the owning account (GitHub lists that as a 404 check, E-15 line 68); the organization uses SAML
     SSO - start a SAML session for the organization on GitHub, then sign in to MoonAliza again
     (E-01 line 34; status not stated); or a secondary limit GitHub did not label.
  4. **404** on a repository -> a message that lists the possibilities and claims none: it does not
     exist or the name is wrong; the app is not installed on the owning account, or not given this
     repository - on the user's own account, the install link; on an organization, if the app is
     already installed there a repository admin may be able to add this repository (E-13 line 70),
     unless the owners restrict it (line 72); if not, ask an owner, or use *Install and request* /
     *Request* on the install page (E-13 lines 74, 94), and if the organization is not offered
     there, ask an owner (E-13 line 82, see Contradictions); on another person's personal account,
     ask that person - and **every** one of these install or add routes ends with "if it still
     fails after the app is installed or the repository added, sign in again" until the day-one
     reach check settles it (U-2, Known unknowns); the user has no access; the organization uses
     SAML SSO - start a SAML session for the organization on GitHub, then sign in to MoonAliza again
     (E-01 line 34); or updated permissions are not yet approved (E-15 lines 46, 65-70; E-13; E-01
     line 34). A missing permission, also on that 404 checklist (E-15 lines 66-67; see
     Contradictions), is not listed: on the app's side it is moot for the fixed read-only set, which
     covers every read MoonAliza makes (E-05), and on the user's side it is the no-access case (a
     reading).
  `read_github` keeps sending `X-GitHub-Api-Version: 2022-11-28` (supported until March 10, 2028,
  E-18) and a `User-Agent` (E-15 line 159).
- **Signed-in login**: `GET /user` with the user token (no permission needed, E-20); show `login`.
- **"Repositories I can read"** - a **design choice, not a research claim**: if built, it is a
  UI-side view assembled in the main process from `GET /user/installations` and
  `GET /user/installations/{installation_id}/repositories` (E-07) and shown in the renderer only;
  it never reaches the engine or the model and never widens `read_github`'s scope.
- **Sign-out**: delete both tokens from the vault first, always; then the help text tells the user
  (a) that signing out of MoonAliza does **not** end the authorization on GitHub - it and its tokens
  stay valid there until the user revokes it or they expire, the access token up to 8 hours and the
  refresh token up to 6 months after issue (E-02 line 34); (b) where revoking happens on GitHub -
  Settings, Applications (under Integrations), the Authorized GitHub Apps tab, Revoke (E-17); and
  (c) that only they can revoke their authorization, while an organization owner can uninstall the
  app (E-17). Do not call `DELETE /applications/{client_id}/token` (needs the secret, E-08). Do not
  call `POST /credentials/revoke` for routine sign-out (E-11: for credentials the caller does not
  own, and the owner is notified); it remains available, unauthenticated, if MoonAliza ever detects
  its own token exposed - a separate decision. The builder confirms that **no copy of either token
  value outlives its vault entry**: MoonAliza's `vault.redact` (`src/main/vault.ts` lines 183-195)
  skips tombstoned entries, so once the tokens are deleted locally their still-valid values are no
  longer redacted anywhere (a reading of MoonAliza's code, not a GitHub fact).
- **Out of scope**: an OAuth app, the web flow and loopback redirect, any client secret, webhooks,
  any write permission, git clone, a prefix-based secret screen, and Claude or OpenAI sign-in.
- **Not answered here** (product decisions the completeness critic raised, not facts this corpus
  can settle): who owns and names the app; whether the connection stays read-only or is shared
  with research collection under broader permissions; how private code read through it is treated
  (cloud models, indexing, purging on sign-out, sending the token on public reads); the network
  stack for GitHub calls (global fetch versus an Electron session, which matters behind a corporate
  proxy); and how the renderer learns the device-flow status.

## Next steps

1. **First build step:** the main-process device-flow client - `POST
   https://github.com/login/device/code` (`client_id`, `scope=offline_access`), then polling `POST
   https://github.com/login/oauth/access_token` at `interval` - with tests against a fake GitHub
   listening on port 0. The fake returns HTTP 200 bodies for `authorization_pending`, `slow_down`
   (with a new `interval`), `expired_token` and `token_expired`, `incorrect_device_code` and
   `bad_verification_code`, `access_denied`, `device_flow_disabled`,
   `incorrect_client_credentials`, `unsupported_grant_type`, `unverified_user_email`; the same codes
   with **non-200** statuses; **step-1 failures** (an invalid `client_id`, `device_flow_disabled`
   at `/login/device/code`); a **rate-limited poll** (a 429; a 403 with `x-ratelimit-remaining: 0`;
   a 403 with `retry-after`) that waits and resumes, and one whose wait would pass `expires_in` and
   ends as `GITHUB_RATE_LIMIT`; a success with and without `expires_in`; a token response whose
   tokens lack the expected prefix; and both form-encoded and JSON bodies. Every request - step 1,
   the poll and the refresh - puts its inputs in a form-encoded body with `Accept: application/json`
   and no query string (E-21; for the refresh an inference, U-4), and a test pins that placement.
   Each token goes to the
   vault as its own value, and the tests assert that no token value appears in logs, events or
   tool output. In parallel, the product owner registers the app with the settings in the Decision
   and copies the install URL from its public page.
2. Refresh: the expiry pre-check, single-flight, atomic replacement, refresh-once-and-retry on 401,
   `bad_refresh_token`, a second 401, and a refresh that is not cancelled by Stop - one test per
   path - plus: `bad_refresh_token` returned with a **non-200** status (vault cleared); a
   **transient** refresh failure (network error, timeout, 5xx: vault kept, call failed as retriable,
   nothing sent with the expired token); a **rate-limited** refresh (vault kept,
   `GITHUB_RATE_LIMIT`); and a 401 that arrives after another call has already rotated the pair (no
   second refresh, one retry with the current token). Before it ships, the day-one check of two
   refreshes in a row without a secret.
3. `read_github` with the user token and the error mapping in the Decision's order, with tests for
   a primary-limit 403 without `retry-after`, a rate-limit 403 that also carries
   `X-Accepted-GitHub-Permissions`, a secondary-limit 403 or 429 with `retry-after`, a **403 whose
   body carries "Resource not accessible by integration" and no rate-limit headers** (missing
   permission, nothing else claimed), a 403 with neither header nor that text (missing permission
   first, other possibilities labelled, including the SAML two-step: start a SAML session for the
   organization on GitHub, then sign in to MoonAliza again), a 404 on a private-looking repository
   (possibilities listed, including the SAML two-step, the repository-admin route with its
   owner-restriction caveat, and the sign-in-again line on every install or add route), and a 401
   followed by refresh and retry.
4. The signed-in login (`GET /user`), and the UI-only repositories view if the product wants it.
5. Sign-out and its help text (E-17's path, and that the authorization stays valid on GitHub until
   revoked or expired), with a test that after sign-out no token value appears in the logs, events
   or files the app wrote, and a review that no module keeps its own copy of either value.
6. The day-one checks in Known unknowns with the registered app - two refreshes in a row, token
   reach after installing (own account, and organization routes where a test organization is
   available), the field statuses including SAML - and U-16's three questions to GitHub
   Support, before release.

<!-- fetchproof:brief-draft body=3eef5793aeee1808 inputs=d0b150cc3a9fdb78 gate=pass -->
