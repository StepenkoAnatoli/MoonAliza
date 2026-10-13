# User decisions and day-one checks

Answered 2026-10-13 (MANDATE.md, "The user's reply"): UD-2 read-only, UD-3 like local project files, GO MERGE; UD-1 open (the build ships with empty constants until the app is registered); UD-4..UD-6 as recommended.

## Decisions

### UD-1

Who registers and owns MoonAliza's GitHub App, and what are its name and Homepage URL? Only the owning account can create the app. The build needs the app's client ID and install URL (both public, neither a credential), and the day-one checks need the registered app.

Options:
- Your personal GitHub account (StepenkoAnatoli) owns it. The name is 'MoonAliza', or the nearest available name of at most 34 characters. The Homepage URL is https://github.com/StepenkoAnatoli/MoonAliza. The settings are those in F-23, and no client secret is generated. You send back the client ID and the install URL copied from the app's public page (Edit, Public page, Install), run the day-one checks DO-1..DO-16 with a second GitHub account, and ask GitHub Support the U-16 questions.
- A GitHub organization you create for MoonAliza owns it, with the same settings and the same follow-up.
- Register later: merge the sign-in with empty constants. The dialog says sign-in is not configured in this build, the e2e journey B is a visible skip and a release gate, and the app is registered before the first release that carries the feature.

Recommended: Your personal GitHub account (StepenkoAnatoli) owns it. The name is 'MoonAliza', or the nearest available name of at most 34 characters. The Homepage URL is https://github.com/StepenkoAnatoli/MoonAliza. The settings are those in F-23, and no client secret is generated. You send back the client ID and the install URL copied from the app's public page (Edit, Public page, Install), run the day-one checks DO-1..DO-16 with a second GitHub account, and ask GitHub Support the U-16 questions.

Why: This is the quickest way to a working sign-in that is tested end to end before the merge. The repository already lives under that account, and only the owning account can register the app (E-03). The name must be unique and at most 34 characters (E-03 l.53), so whether 'MoonAliza' is free is known only at registration. The install URL is copied, never derived from the name (R2-8, E-12 l.49-53). Whoever owns the app, its per-app limits may apply across every install (U-16). The research does not cover moving an app to an organization later, so option 2 is the one to pick if organization ownership matters. Option 3 lets the code merge first, but nobody can use the feature until registration, and the full Windows journey cannot run before then.

### UD-2

Is the GitHub connection read-only for private repository reading now, or the single shared connection the plan describes for research collection, private reading and the later write steps (docs/superpowers/plans/2026-10-02-research-jobs.md:426, :491)?

Options:
- Read-only now: Contents and Metadata read-only. The research collector keeps its pasted token, the plan's lines 426 and 491 get a correction note, and the write path is designed in its own task.
- Register with the broader permissions now: Actions read and write for the collector's dispatch, and Contents and Pull requests write for self-unblocking, so one connection serves every later step.
- Read-only now, and a second, separate GitHub App later for writes.

Recommended: Read-only now: Contents and Metadata read-only. The research collector keeps its pasted token, the plan's lines 426 and 491 get a correction note, and the write path is designed in its own task.

Why: Every read read_github makes needs only Contents read (E-05 l.1007-1036), and the plan's own step 1 asks for least privilege. The collector cannot share this token anyway: each refresh kills the old access token (E-02 l.36), a watch child holds its token for up to an hour (src/adapters/research-kit/collector.ts:50), and the collector needs Actions write. The cost is widening later: every installing owner must approve new permissions, and their installation keeps the old ones until they do (E-19 l.26-28, E-04 l.57). That is acceptable because no write feature exists yet. Option 3 keeps reading and writing permanently apart, at the cost of a second registration.

### UD-3

How is private repository text that the agent reads treated? Cloud-allowed conversations send it to the selected provider, and it is stored and full-text indexed with the conversation.

Options:
- Like local project files. It is allowed in any conversation where the user pasted the URL. A local-only conversation sends it nowhere; a cloud-allowed one sends it to the selected provider. Tool results stay in the conversation's history and search. Sign-out does not delete them; deleting the conversation removes them from MoonAliza. The GitHub dialog, the composer note, one clause in the cloud dialog and the spec say so, and no text claims erasure.
- Private reads only in local-only conversations: a cloud-allowed conversation is refused a private read.
- As the first option, plus deleting stored private-repository tool results at sign-out.

Recommended: Like local project files. It is allowed in any conversation where the user pasted the URL. A local-only conversation sends it nowhere; a cloud-allowed one sends it to the selected provider. Tool results stay in the conversation's history and search. Sign-out does not delete them; deleting the conversation removes them from MoonAliza. The GitHub dialog, the composer note, one clause in the cloud dialog and the spec say so, and no text claims erasure.

Why: It reuses the existing, tested policy: main checks the conversation's inference policy before and after every read (src/main/index.ts:113-121, src/engine/policy.ts:68-78), and local project files already follow these rules. Options 2 and 3 both need MoonAliza to know which repositories are private, which means an extra GitHub call per repository and a new policy rule. Option 3 also deletes user data, which is on the stop-list. The bytes of deleted conversations may remain in SQLite free pages or the WAL (secure_delete is not set), so the wording never says erased; secure_delete is recorded for later.

### UD-4

When signed in, does read_github send the token on every read, or only when a repository is not readable without it?

Options:
- Every read while signed in, with no unauthenticated fallback when the token cannot be used.
- Unauthenticated first, repeated with the token only after a 404.

Recommended: Every read while signed in, with no unauthenticated fallback when the token cannot be used.

Why: It is one request per read and one behaviour. Signed-in reads use the user's own 5,000 requests an hour instead of the 60 an hour per IP that unauthenticated requests get (prior E-08 l.40, l.46, l.60). The cost: GitHub sees the user's identity on public reads too, and the 5,000 is shared with the user's other apps and tokens; the dialog discloses both. Option 2 keeps public reads anonymous, but doubles the requests for private repositories and spends the anonymous allowance on each one. A fallback after a token failure would turn a renewal problem into a misleading 'not found'.

### UD-5

Which network stack carries the sign-in, the refresh and signed-in reads? Reviewed decision 4 (docs/specification/decisions.md:8) asks for an Electron network broker with the system proxy, but every GitHub call today uses Node's global fetch.

Options:
- Node's global fetch, late-bound in main for the sign-in and through the reader's per-run default for reads, as read_github and the verified import use today. The spec records that its Windows proxy and certificate behaviour is unverified and that this diverges from decision 4, and moving every GitHub call to the Electron broker together is recorded for later.
- Electron's providers session (system proxy and certificate checks, per decision 4) for the sign-in, the refresh and signed-in reads, while signed-out reads stay on global fetch.
- Move every GitHub call (reader, verified import, sign-in) to the Electron session now.

Recommended: Node's global fetch, late-bound in main for the sign-in and through the reader's per-run default for reads, as read_github and the verified import use today. The spec records that its Windows proxy and certificate behaviour is unverified and that this diverges from decision 4, and moving every GitHub call to the Electron broker together is recorded for later.

Why: Every existing GitHub call uses Node's fetch (src/main/github.ts:12, src/main/research-import.ts:69), and the GitHub e2e intercepts it there (e2e/github-reading.spec.ts:31-46). With one stack, sign-in cannot succeed on a network where reads then fail. Electron's session.fetch enforces redirect 'error' (docs/specification/more-models.md:123), so options 2 and 3 would change the reader's 3xx handling. They would also need a github.com TLS fake, which breaks a pinned test. The cost of option 1: a user whose network needs the Windows system proxy, or TLS inspection, may not reach GitHub, exactly as public reads today. Option 1 departs from a reviewed decision, which is why it is the user's call.

### UD-6

Conditional, decided only if day-one check DO-1 fails: if a token produced by a refresh cannot be refreshed again without a client secret, what does MoonAliza do?

Options:
- Ask the user to sign in again with the device flow whenever the access token expires (about every 8 hours of use).
- Turn off 'Expire user authorization tokens' in the registration, so tokens do not expire. This also needs one code change in the same commit: `REQUEST_OFFLINE_ACCESS` set to false, so step 1 stops sending `scope=offline_access`. That scope forces expiring tokens with a refresh token even when the registration turns expiry off (E-01 l.120, E-02 l.40-42). Accounts already signed in keep their expiring pair until they sign in again (DC-3).

Recommended: Ask the user to sign in again with the device flow whenever the access token expires (about every 8 hours of use).

Why: Shipping a client secret is ruled out (F-20, F-27). GitHub strongly recommends keeping token expiry on (E-03). A non-expiring token stays valid until it is revoked, which is worse for privacy, and the one-year-unused revocation is stated only for OAuth apps (E-09). Signing in again costs a device flow each time, and each one may count against a per-app cap (U-16). That is acceptable for the current single user, and it is revisited if the user base grows. The build needs no change for option 1. A failed second refresh clears the account and shows 'sign in again': at once for `bad_refresh_token`, `incorrect_client_credentials` (GitHub's answer for a wrong or missing client secret, E-01 l.256) or `unsupported_grant_type`, and after three identical answers for any other code, or for the same status with no code (DC-1, GS-2). A redirect, an unparseable body or a network failure only holds, because a captive portal or a proxy answers that way. Option 2 needs the one change named above (DC-3).

### OF-1 (resolved)

Approve 1 Firecrawl credit to collect GitHub's own device-flow tutorial, 'Building a CLI with a GitHub App' (linked from E-01 l.112), so the parameter placement of the device-flow and refresh requests (URL query or form body) is settled before the wire client is briefed? The run's 20-credit budget is spent, and raising it is the operator's decision (Research-Kit Rule 5).

**Resolved, 2026-10-13 (round 4).** The lead approved the credit (RUN.md, Decisions and assumptions). The page was collected into the design project as E-21: 1 credit, balance 257 before and 256 after, transport `firecrawl-cli`, completeness full.
- **What it settles.** GitHub's tutorial sends both device-flow requests' parameters form-encoded, with `Accept: application/json`, to URLs with no query string (E-21 l.300-304, l.315-322). That this is a form body is Ruby's standard library, an inference.
- **What it does not settle.** The tutorial makes no refresh request. The refresh is sent the same way, which is an inference that DO-1 checks, with DO-2 for reading a failure.
- **Where it is applied.** U1 is briefed with spec 5.1-5.2 and DR-9. Nothing is left for the user to decide here; the question and options below are kept for the record.

Options:
- Approve 1 credit; the lead collects the page into the design project, adds an E-row, and briefs U1 with the confirmed placement.
- Do not collect: U1 builds the form-body placement in one function, pinned by a test, and day-one check DO-2 confirms it with the registered app before release.

Recommended: Approve 1 credit; the lead collects the page into the design project, adds an E-row, and briefs U1 with the confirmed placement.

Why: The pages call the inputs 'query parameters' but use the same words for response fields (E-01 l.118, l.122, l.138, l.167), so the placement is not stated. A refresh token or device code in a URL is visible to anything that records URLs, and a body is not, which is why the design chose the body (DR-9). The design has no runtime fallback between placements, because a refresh token is single-use (E-02 l.36). If the guess is wrong, every sign-in fails in the field until one function changes. One credit settles it before any code depends on it; without it, the risk waits for the day-one check.

## Day-one checks

- DO-1 (U-4, verifier F-4): with the registered app, run the device flow, then refresh twice in a row with no client secret; both must succeed. E-02 l.79 exempts only tokens generated using the device flow, and is worded per token. If the second refresh fails, record its status and body (DC-1). Until checked, the build refreshes without a secret. A failed refresh's error clears the account, and the user is asked to sign in again: at once for `bad_refresh_token`, `incorrect_client_credentials` or `unsupported_grant_type`, and after three identical answers for any other code, or for the same status with no code (a 4xx with another body, or a 2xx without `access_token`), with doubling holds in between (DC-1, GS-2). A 3xx or an unparseable body only holds; if the second refresh fails that way, record it, because the account then stays held, not cleared. Staying signed in for six months is labelled as resting on this check, and a failure goes to UD-6 before release. UD-6's expiry-off option also needs `REQUEST_OFFLINE_ACCESS` set to false (DC-3).
- DO-2 (U-4; OF-1 resolved by E-21): the refresh's parameter placement. E-21 settles step 1 and the poll (a form-encoded body with `Accept: application/json` and no query string), but makes no refresh request. DO-1's first refresh shows whether the refresh accepts the same placement. If even that first refresh fails, record its status and body before reading anything into the secret exemption, because a wrong placement would fail it too. Until then, the build sends all three in the body, with no query string, from one function (oauthRequest) pinned by a test. It never falls back to the query form, because a refresh token is single-use (E-02 l.36).
- DO-3 (prior E-01 l.200-221; E-21 l.277-285): record the Content-Type and body shape of a device-code answer and a token answer sent with Accept: application/json. E-21 parses both as JSON, but no page states the Content-Type. Until then, the build parses JSON and form-encoded bodies by Content-Type, comparing case-insensitively before ';', and treats any other type as unparseable (transient).
- DO-4 (R2-3, V3-4, U-2): sign in first, then install the app on the user's own account with Only select repositories. Read a selected private repository with the existing token, then add another repository to the installation and read it. Repeat on an organization installation, and with a repository added by a repository admin, if one is available; otherwise record that the own-account result is assumed to carry over. Record whether each read works without a new sign-in, and how soon. Until then, every install or add route in the signed-in 404 text ends with 'if it still fails after the app is installed or given the repository, the user signs in to MoonAliza again'. That line is removed if reads work at once.
- DO-5 (U-5; GS-7): send a request with an access token past its expiry, to `GET /user` and to a private repository, and record each status (401, or 404 on a private repository). GitHub's tutorial expects a 401 on `GET /user` for an expired or revoked token (E-21 l.592, a tutorial, not a reference statement); a private read may still differ. Also, right after DO-1's first refresh, send `GET /user` and a private read with the access token that refresh retired, and record both statuses: the rotated-meanwhile retry acts on a 401 only, and E-02 l.36 says only that the old token "will no longer work". Until then, the build never knowingly sends an expired token: it refreshes when under 300 s are left, and refreshes first after a clock step back of more than 300 s. A 401 goes through the 401 rule. A 404 shows the signed-in 404 text, which ends with 'sign in again'; that includes a read in flight across a rotation, which is then not retried.
- DO-6 (U-4, R2-5): refresh once with an already-used refresh token, and record the status and body of bad_refresh_token. Until then, the build reads 'error' from the body at any HTTP status, after classifying rate limits first, and bad_refresh_token clears the account whatever the status.
- DO-7 (U-10, R2-2): read a private repository in three situations: on the user's own account before installing; in an organization where the user is a member but not an owner; and in a SAML organization without an active session. Record each status and its headers. In the SAML case, then start a SAML session and retry with the same token, recording whether it reaches the organization without a new sign-in. Until then, the 404 and 403 texts list the possibilities and claim none, and the SAML remedy has both steps: start a SAML session for the organization on GitHub, then sign in to MoonAliza again.
- DO-8 (R2-4): observe how github.com/login/oauth/access_token and /login/device/code answer when rate-limited (statuses, x-ratelimit-* headers, retry-after, body), from GitHub Support or a test account. Until then, the build applies E-15's REST rules as a precaution, classified before any error or success: a 429, a 403 with remaining 0, or a 403/429 with retry-after. It waits retry-after (at least 1 s), else the reset (at least 60 s, at most 1 h), else 60 s. A refresh is held until the wait passes, and for at least 30 s (DC-12); a poll waits at least its interval, and one whose wait would pass the deadline ends as rate-limited.
- DO-9 (U-16, KNOWN-UNKNOWN): ask GitHub Support three questions. Does the device flow's 50-submissions-per-hour cap (stated for OAuth apps, prior E-01 l.307) apply to GitHub Apps, and is it counted per app? Is the 2,000 OAuth access token requests per hour (prior E-08 l.95) counted per app or per user? Do polls and refreshes count toward it? Record the answers in DISCOVERY.md. Until then, the build assumes per-app counting: user-initiated starts only, one flow at a time, closing the dialog cancels, interval and slow_down honoured, rate limits classified first, and doubling holds after failed refreshes (DC-1). The 'expired' outcome text says GitHub may be limiting sign-ins. The spec records the arithmetic as a product risk: about 180 polls per sign-in left pending, and refreshes at about active users x 3 / 24 an hour, reaching 2,000 an hour at about 16,000 users active across a day.
- DO-10 (U-15): call GET https://api.github.com/user with the app's user token, and confirm the response carries 'login'. Until then, the login is read once, after storing (one-shot, outside the 401 rule). Any failure leaves login null, the sign-in stays, and the dialog shows 'Signed in to GitHub (account name unavailable)'.
- DO-11 (U-8, U-11): after registering with Any account, confirm that the app's public page shows an Install button to a second GitHub account. Until then, that Any account means public is recorded as an inference (E-14 l.20, E-03 l.93).
- DO-12 (E-01 l.128-132): record a live device-code answer: whether verification_uri equals https://github.com/login/device exactly, the user_code shape (8 characters with a hyphen), device_code length, expires_in, interval, and the app name and permissions GitHub's device page shows the user. Until then, the build accepts only the exact verification_uri (any other value ends the attempt as start-failed, fail closed). It accepts user codes matching alphanumeric groups joined by hyphens, at most 32 characters, and any printable device_code up to 1,024 characters. The phishing text asks the user to check that they are authorizing MoonAliza's GitHub App.
- DO-13 (R2-1, E-15 l.108): provoke a real permission 403 on a signed-in read (for example, an installation whose owner has not approved an updated permission, if available), and record whether the body contains 'Resource not accessible by integration' and whether X-Accepted-GitHub-Permissions accompanies it. Until then, a signed-in 403 with that body text is GITHUB_PERMISSION_MISSING. Any other signed-in 403 is GITHUB_FORBIDDEN_SIGNED_IN, whose text still leads with the permission cause. The header is never the test.
- DO-14 (R2-8, E-12 l.49-53): open the install URL copied from the app's public page, from the built app's Install on repositories button, and confirm that GitHub shows the app's installation page. Until then, the constant is empty and the dialog says sign-in is not configured. The constants test requires the shape https://github.com/apps/<name>/installations/new.
- DO-15 (E-10 l.145, U-6): confirm that a real sign-in's access and refresh tokens pass the shape check (ghu_ and ghr_ prefixes, header-safe characters, at most 16,384 characters), and that a refresh answer has the same shape, without recording any token value. Until then, the check assumes only the prefix and what a header can carry. A failed check stores nothing: a sign-in ends failed, and a 2xx refresh with a malformed access_token clears the account (fail closed).
- DO-16 (DC-2; U-4): refresh, then at once send `GET /user` and a private read with the new token. Repeat 20 times, and record each status and how long after the refresh it came. No captured page says when a new token is accepted, and DO-1 never uses one at once. Until then, a 401 on a token under 5 s old is resent with the same token after 1 s, then 2 s, with no refresh. A third 401 fails the read as renewal-unavailable and keeps the account. A 401 on a token under 30 s old never refreshes: it holds refreshes, and the third such 401 in a row clears the account (GS-1). If every one of the 20 reads succeeds at once, the guard can be removed.
