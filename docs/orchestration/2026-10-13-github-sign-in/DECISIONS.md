# GitHub sign-in decisions (expensive to reverse)

This file holds one record per choice that would be costly to undo once it is built, shipped or relied on.

**Conventions**
- Citations follow `docs/specification/github-sign-in.md`:
  - E-nn l.N is a capture line of the design project's evidence;
  - prior E-nn is a row of the prior project;
  - R2-n is a round-2 verifier finding, and wins over the brief;
  - V3-n is round-3 verifier finding S-n;
  - DC-n is a design-critic finding (`reports/stages2-3-workflow.json`, `result.critic.findings`);
  - GS-n is a final-pass critic finding (`reports/revise-workflow.json`, `result.critic.findings`);
  - UD-n is a user decision.
- Requirement rows are in `REQUIREMENTS.md` and the units are in `BREAKDOWN.md`, both in this folder.
- A record tagged with a UD-n states the recommended answer. It changes if the Mandate picks another.

**How the design was chosen.**
- **Base design.** The synthesis started from the design two of the three judges rated best: lifecycle-first, scoring 39, 39 and 40 (total 118). Minimal scored 39, 38 and 37 (114); privacy-first scored 38.5, 34 and 36 (108.5).
- **Tie-break.** Judge 1 tied lifecycle and minimal and broke the tie for minimal. Judges 2 and 3 chose lifecycle.
- **Flaws fixed.** The synthesis fixed every flaw a judge named, including judge 3's fatal flaw in minimal (no hold after a rate-limited refresh), which lifecycle did not share.
- **Grafts.** It grafted the ideas the judges recommended from the other two designs. Where a graft was not taken, the record says why.
- **Round-3 residues.** The residues the round-3 verifier found in the brief (V3-1..V3-7) are applied in the texts and limits.
- **Design critic.** The critic's findings DC-1..DC-16 are resolved in the records below and in the spec. Each changed record names its DC-n.
- **Final pass.** The critic's findings GS-1..GS-11 are resolved the same way. Each changed record names its GS-n.

---

## DR-1. A public GitHub App with the device flow, Contents and Metadata read-only, and no client secret anywhere

**Rests on UD-1 and UD-2** (recommended answers). It changes if the Mandate picks another.

**Decision.**
- **Registration.** One public GitHub App (*Any account*):
  - repository permissions **Contents: Read-only** and **Metadata: Read-only**, nothing else;
  - *Expire user authorization tokens* on and *Enable Device Flow* on;
  - webhook *Active* off; no callback or setup URL; *Request user authorization during installation* off;
  - no client secret generated for the app's use, and none stored or shipped.
- **Sign-in.** The device flow with `scope=offline_access`. Whether to send the scope is a frozen main-only constant, `REQUEST_OFFLINE_ACCESS = true` in `src/main/github-app.ts`. It changes only together with the registration (DC-3, Risks).
- **What the build carries.** Two public constants in `src/main/github-app.ts`: the client ID, and the install URL copied from the app's public page. Both stay empty until UD-1 is answered, and the dialog says "not configured" until then.
- **Not shipped to other bundles.** The constants are main only: no model text needs the install URL, so neither the engine nor the renderer bundle carries it.

**Alternatives.**
- (a) An OAuth app. Its only private scope also grants write, so the prior project rejected it.
- (b) The web flow with a loopback redirect, which needs a client secret or a callback.
- (c) The broader permission set the plan names (Actions write and Contents write), so one connection serves the collector and later writes (UD-2 option 2).
- (d) A private app.
- (e) Constants in `src/shared` (the lifecycle design).
- (f) Deriving the install URL from the app's name.

**Why this wins.**
- **No secret.** Device-flow tokens refresh without a secret (E-02 l.79), so nothing secret ships in the binary. (b) cannot avoid shipping one.
- **Least privilege is cheap now and costly later.** Every read `read_github` makes needs only Contents read (E-05 l.1007-1036). Widening permissions later notifies each installing owner, and installations keep the old permissions until each owner approves (E-19 l.26-28, E-04 l.57). (c) also cannot serve the collector: each refresh kills the old access token (E-02 l.36) while a collector watch holds its token for up to an hour (`src/adapters/research-kit/collector.ts:50`).
- **A private app cannot serve other users.** It can be installed and authorized only by the owning account (E-14 l.26), which rules out (d).
- **The install URL must be copied, not derived.** How a name with capitals or spaces is written in the URL is not stated (E-12 l.53, E-03 l.53, R2-8), which rules out (f).
- **No reason to widen the bundles.** (e) puts public identifiers into the engine and renderer bundles for no reader (judge 2).

**Trade-offs.**
- A later write feature needs either a permission widening that reaches users one owner at a time, or a second app.
- The plan's lines `research-jobs.md:426` and `:491` get correction notes.

**Risks.**
- **Per-token exemption.** E-02 l.79 is worded per token. If the second refresh without a secret fails (DO-1), users sign in every 8 hours, or the owner turns expiry off (UD-6). The design never ships a secret.
- **The expiry-off fallback needs a code change (DC-3).** `scope=offline_access` forces expiring tokens with a refresh token even when the registration turns expiry off (E-01 l.120, E-02 l.40-42). So UD-6's second option also sets `REQUEST_OFFLINE_ACCESS` to false, in the same commit that records the registration change. The constants test pins the value, and the wire test pins the parameter. Accounts already signed in keep their expiring pair until they sign in again.
- **Per-app limits (U-16).** The 50 code submissions an hour and the 2,000 token requests an hour may count per app, across every install. This is recorded as a product risk with the arithmetic (V3-6), and it goes to GitHub Support (DO-9).
- **Visibility is inferred.** *Any account* meaning public is an inference (E-14 l.20, E-03 l.93). DO-11 checks it.

**Rests on.** F-20, F-23, F-27; E-01 l.118-120, E-02 l.40-42, l.79, E-03, E-04, E-05, E-12 l.49-53, E-14, E-19; R2-8; DC-3; UD-1, UD-2.

---

## DR-2. Storage: each token is its own vault value, and a main-owned file holds refs and metadata

**Decision.**
- **Vault.** The access token and the refresh token are two separate vault entries, under a new purpose `github` capped at 30 s.
- **The account file.** `<userData>/github/account.json` holds only the following, in a strict schema:
  - `version`, `revision`, `updatedAt`;
  - `clientId`;
  - both refs and `retiredRefs`;
  - both expiry times (local receipt time plus `expires_in`);
  - `obtainedAt`;
  - `login`.
- **Write order.** Stage, then the file (the crash-recovery commit point), then commit. The live pointer is set only after commit and only after a passing admit; the old refs are retired after that.
- **Bounded and reversible writes.** The file never names more than 8 retired refs: older ones are tombstoned and removed first (DC-10). A sign-in whose commit fails after the file write rewrites the file to the previous account, inside `replace` and under the same lock, so no queued writer runs in between (DC-11, GS-3). If that write fails too, the new account stands, because the next start would sign in with it anyway. A refresh copies the login under the lock, and the login read lands across refreshes of the same sign-in (GS-10).
- **Never in the engine.** Nothing goes in the engine database, the engine Settings or a model profile.

**Alternatives.**
- (a) One vault entry holding a JSON blob of both tokens.
- (b) A model profile, or a row in the engine database.
- (c) The file without `obtainedAt` or `clientId` (minimal).
- (d) Setting the live pointer at the file write instead of after commit.
- (e) A separate `rollback()` call after the failed `replace` (the synthesis as written, DC-11). A refresh of the old account already queued on the lock runs between the two, and the rollback then restores a file whose refs that refresh removed (GS-3).

**Why this wins.**
- **Redaction needs whole values.** `vault.redact` matches whole decrypted values (`src/main/vault.ts:183-195`), so (a) would leave neither token redacted anywhere (S-2).
- **Ref ownership stays in main.** (b) would put the refs into engine history, which the engine already treats as its own (`src/engine/store.ts:170`, the `vault.references` reconcile).
- **There is a proven precedent.** The `CollectorSettings` pattern is tested for every crash window (`tests/research-collector-settings.test.ts:100-130`).
- **`obtainedAt` is needed** for the clock-step rule. Without it, a clock set back more than five minutes would send an expired token.
- **`clientId` prevents a cross-app token** (privacy design). It stops a token issued to another app from being sent to this app's token endpoint, for example after a re-registration. An empty constant keeps the refs (D-7), so a development build never wipes the sign-in.
- **(d) would break reads.** The vault refuses grants on staged refs (`src/main/vault.ts:132`), so every concurrent read would fail between the file write and the commit.

**Trade-offs.**
- The store has a synchronous prologue in `clear`, plus the locked part, and tracks both the file state and the live account. It is more code than `CollectorSettings`.
- A rotation briefly holds four vault entries, and each one is decrypted on every `redact` call.

**Risks.**
- **S-7 crash window.** A crash after GitHub rotated the pair but before the file write leaves a dead pair. The next call clears it and the user signs in again. This is recorded as a known limit.
- **Orphaned entries.** A file removed by hand leaves committed entries that the reconcile never deletes (`src/main/vault.ts:106-121`). They stay encrypted and redacted, and a vault owner tag is recorded for later.
- **Redaction blast radius.** One undecryptable entry makes every `redact` throw `REDACTION_UNAVAILABLE` (`src/main/vault.ts:187-188`). This is unchanged, though there is more exposure. Sign-out removes the entry without decrypting it.

**Rests on.** F-5, S-1, S-2, S-3, S-7; `src/main/vault.ts:81-195`; `src/main/collector-settings.ts:23-91`; `src/models/artifact-files.ts:40-63` (`serialized` is a FIFO chain per key, `:59-63`); `src/main/index.ts:181-184`; DC-11, GS-3, GS-10.

---

## DR-3. One main-owned lifecycle service: two state machines, a generation, named signal owners, and a refresh that is never cancelled once sent

**Decision.**
- **One owner.** `GitHubSignIn` (`src/main/github-signin.ts`) owns the account machine and the flow machine. A pure projection maps them to the status DTO.
- **Admits.** Every account mutation runs under the file lock and is admitted against what it was based on (spec L-6). A refresh is admitted against the generation and its access ref. A sign-in is admitted against the count of user sign-outs since its commit point began, so a refresh or an app clear during the flow never refuses a sign-in the user already approved; only a sign-out does (DC-4).
- **The refresh's signal.** A refresh runs on its own 20 s timeout only. Stop, a read's deadline, an engine restart, sign-out and quit never abort it; they only cause its result to be discarded or awaited.
- **Waiters.** Reads waiting on a refresh race it against their own signal and an `accountChanged` controller, so a sign-out releases them at once.
- **Quit.** It waits for GitHub work for at most 25 s.
- **Invariants.** L-1..L-14 are each checked by named tests.

**Alternatives.**
- (a) State held in two classes with no explicit machines (minimal and privacy).
- (b) A refresh on the read's signal.
- (c) A refresh aborted by sign-out (privacy).
- (d) A background timer that refreshes before expiry.
- (e) Admitting a sign-in's commit against the generation, or only while the flow is current (DC-4).

**Why this wins.**
- **(b) loses the account.** Once GitHub issues a new pair the old one is dead (E-02 l.36), so a refresh aborted by Stop after its request left would lose both tokens and sign the user out without saying why. Every judge named this lifecycle as the feature's risk.
- **Small, testable pieces.** The machines and projection make the renderer contract testable without I/O. The signal-ownership table settles the critic's open gap (Stop, deadline, restart, quit, sign-out).
- **(c) gains nothing.** The refresh's answer is discarded by the admit check either way.
- **(d) adds ambient traffic.** It would send requests at startup or while idle, which the e2e harness cannot intercept reliably (`docs/specification/research-journeys.md:14`). It also spends per-app token requests for users who are not reading (U-16).
- **(e) is wrong both ways.** Against the generation, a "Sign in again" approved on GitHub is refused whenever the old account refreshes or is cleared during the flow, and that is common when a user signs in again because reads started failing. Against "the flow is current", a sign-out during the commit could leave the live pointer on removed refs.

**Trade-offs.**
- The service is heavier than minimal's two classes (judges: simplicity 6 against 9).
- An abandoned flow after a renderer reload runs unseen until its code expires.

**Risks.**
- **Waiters that ignore sign-out.** A waiter that does not race `accountChanged` would send with a fresh token after sign-out. Refresh test 12 counts the requests and times the rejection.
- **A late answer resurrecting the account.** Prevented by the admit checks after every await (store concurrency tests, refresh tests 12 and 13, device test 14).
- **Quit before persist.** Quit while a refresh persists is bounded at 25 s (refresh test 16).

**Rests on.** F-6, F-9, F-10, F-11; E-02 l.36; Critic (refresh lifecycle); DC-4; `src/main/index.ts:178`, `:324-336`; `src/main/collector.ts:162-171`; `src/main/vault.ts:55-58`.

---

## DR-4. The refresh policy: lazy, single-flight, held after failure, and clearing only in named cases

**Decision.**
- **When it runs.** Refresh only before a request that carries the token, when under 300 s of the access token is left (or the clock stepped back), and never at startup or on a timer. All callers share one in-flight refresh.
- **The 401 rule.**
  - If the token rotated meanwhile, retry once with no refresh.
  - Otherwise refresh once and retry once.
  - A call has one refresh-and-retry budget, shared with the pre-check (C-6). A 401 on a token this call's own refresh produced clears the account once that token is at least 30 s old, which in practice only a clock step reaches (GS-1).
  - **A just-issued token (DC-2).** Until DO-16 shows GitHub accepts a new token at once, a 401 on a token under 5 s old is resent with the same token after 1 s, then 2 s. A third 401 fails the call as `GITHUB_RENEWAL_UNAVAILABLE` and keeps the account.
  - **Up to 30 s, no refresh (GS-1).** A 401 on a token under 30 s old never starts a refresh and never clears at once: it holds refreshes like any failed refresh, and the third such 401 in a row, counted across the refreshes in between, clears the account. Only a 401 on an older token can clear it directly.
- **Failures.**
  - A rate-limited refresh keeps the vault, fails the call as `GITHUB_RATE_LIMIT` (R2-4), and holds every refresh until GitHub's wait passes: `retry-after` (at least 1 s), else the reset time, else 60 s; at most an hour, and never under 30 s (DC-12).
  - A transient failure, an unknown `error`, an unusable answer, or a local vault failure while decrypting the refresh token (GS-6) keeps the vault and fails the call as `GITHUB_RENEWAL_UNAVAILABLE`. The hold doubles with each consecutive failure: 30 s, 60 s, and so on, up to an hour (DC-1).
  - During a hold, a call whose access token is still valid, even inside the 300 s margin, is sent with it; only a call that needs a refresh fails at once (GS-4).
  - The account is cleared only in the spec's L-12 cases:
    - `bad_refresh_token`, `unsupported_grant_type` or `incorrect_client_credentials`, at any status (DC-1);
    - the same unknown `error` code three times in a row (DC-1), or the same status with an unusable answer other than a 3xx (GS-2);
    - a 2xx answer whose `access_token` fails the shape check;
    - a persist failure after a successful refresh (X-9);
    - both tokens expired (no request is sent);
    - the 401 rule, on a token at least 30 s old (GS-1);
    - a 401 on a token under 30 s old, three times in a row (GS-1);
    - sign-out;
    - another client ID at startup (DC-15).

**Alternatives.**
- (a) No hold (minimal): rejected as fatal by judge 3.
- (b) A rate limit counted as "transient" with the renewal reason (F-7(b) as written).
- (c) Keep the dead pair after a persist failure (lifecycle as written).
- (d) Keep the vault after a malformed 2xx (the brief's general rule).
- (e) Refresh on every 401 regardless of the call's earlier refresh (lifecycle as written, which allowed two refreshes in one call).
- (f) Hold for 30 s on every `error` except `bad_refresh_token`, with no limit (the synthesis as written, DC-1).
- (g) Clear on any 401 for a token this call's refresh produced, whatever its age (the synthesis as written, DC-2).
- (h) After the fresh-token resends run out, set no hold (the revision as written, GS-1).
- (i) Hold, never clear, on every answer without an `error` code (the revision as written, GS-2).

**Why this wins.**
- **(a) breaks GitHub's rule.** Without a hold, every read during a limit sends another POST to the token endpoint, against E-15 l.36 ("you should not retry your request until after that many seconds") and the warning that continuing while limited may get the integration banned. One app serves every user (U-16).
- **(b) gives the model the wrong advice.** Its text says "try again shortly", while only the rate-limit text tells the model to wait. R2-4 is explicit, and R2 wins over the brief.
- **(c) wastes a request.** It spends a request carrying a token GitHub has already killed (E-02 l.36), plus a refresh request to the shared endpoint, before reaching the same sign-out.
- **(d) is narrowed and labelled.** A 2xx carrying an `access_token` means GitHub issued a pair, so the old one is dead. That is an inference from E-02 l.36, labelled so in the spec. A 2xx with no `access_token` still keeps the vault, as the brief says.
- **(e) breaks the requirement.** F-8 allows "at most one refresh and one retry"; C-6 matches the critic's wording, "a call with a fresh token still gets 401".
- **(f) never reaches "sign in again".** `incorrect_client_credentials` is GitHub's answer for a wrong or missing client secret (E-01 l.256). So it is the likely answer to the second secretless refresh if DO-1 fails, and to a suspended or deleted app. Under (f), the dialog says "Signed in" while every read fails as "try again shortly". Meanwhile each active user sends a refresh that is certain to fail every 30 s to the shared per-app endpoint (U-16), and UD-6's fallback never reaches the user. The doubling hold applies to every failure that keeps the account, not only to unknown codes as the critic proposed. A refresh that fails again and again for any reason should back off, for the same U-16 reason.
- **(g) signs users out on a delay.** No captured page says when a refreshed user token becomes valid (E-01 l.44 covers revoked tokens only). If GitHub propagates new tokens with a delay, (g) wipes a valid, just-rotated pair about every 8 hours under load. A lead outside the corpus, GitHub's `@octokit/auth-app`, retries 401s on installation tokens under 5 s old for that reason. It is a lead only, so DO-16 checks user tokens.
- **(h) loops.** On the next read more than 5 s later the same token is no longer "fresh", so the 401 rule refreshes; the refresh succeeds, resets the hold, and its new token meets the guard again. Each read then costs one refresh on the shared per-app endpoint (U-16), and the account never reaches "sign in again". With a propagation delay over about 3 s and reads 5-8 s apart, every read rotates the pair before it propagates. The fix reuses `failed()` for the hold and the `maxSameRefreshError` limit for the count.
- **(i) holds a dead account for six months.** A 4xx with GitHub's JSON `message` body, or a 2xx without `access_token`, would hold with doubling holds until the refresh token expires, and the user would see "Signed in as <login>" while every read fails. A 3xx and an unparseable body (an HTML page) still only hold: at the token endpoint they are the signature of a captive portal or a proxy, which the critic itself judged too aggressive to clear on.

**Trade-offs.**
- **Reads during a hold.** Reads that need a refresh fail without trying, for the doubling hold (30 s at first, up to an hour) or for GitHub's wait; a read whose access token is still valid is sent with it (GS-4). The dialog shows `renewalHeld`, and a successful "Sign in again" clears the hold.
- **A fresh token GitHub really rejected** keeps the account until the third such rejection in a row, about 70 s or more, and reads in that time report a renewal problem rather than "sign in again" (GS-1).
- **False sign-out from a clock fault.** A local clock jump past six months clears the account without a request (fail closed).
- **A shape change ends sign-in.** If GitHub ever changes the token prefix, every refresh would clear the account and every sign-in would fail visibly. DO-15 checks real tokens first.

**Risks.**
- **Expired token at GitHub (U-5).** GitHub's tutorial treats an expired or revoked token as a 401 on `GET /user` (E-21 l.592, a tutorial, not a reference statement); a 404 on a private repository is still plausible by analogy (E-15). Only a clock step or an in-flight expiry can send one (V3-7); a 401 recovers and a 404 shows the signed-in text. DO-5 records which.
- **A token a refresh killed (GS-7).** The rotated-meanwhile retry acts on a 401 only, but E-02 l.36 says only that the old token "will no longer work". If such a token gets a 404 on a private repository, a read in flight across a rotation shows the signed-in 404 text instead of retrying. DO-5 records the status.
- **Refresh-error status not stated (U-4).** The classifier reads `error` at any status (R2-5), tested at 200 and non-200 (DO-6).
- **When a new token is accepted (DC-2).** Not stated. DO-16 records it, and the fresh-token guard can go once it passes.

**Rests on.** F-6, F-7, F-8; E-01 l.44, l.256, l.275; E-02 l.34, l.36, l.72-79; E-15 l.32-40; E-21 l.592; R2-4, R2-5; V1 F-1; V3-7; Critic (401 meaning); DC-1, DC-2, DC-12; GS-1, GS-2, GS-4, GS-6, GS-7.

---

## DR-5. The credential seam, and when the token is sent

**Rests on UD-4** (recommended answer).

**Decision.**
- **The seam.** `GitHubReader` gets a second constructor parameter, a `GitHubCredential` with a `SIGNED_OUT` default, and an optional third, `redact`. The credential's `send(request(authorization?), signal)` never sees the URL. The reader keeps its own fetcher and today's init literal.
- **Signed out or not configured.** The fetcher gets the same URL and the same init object as today.
- **Signed in.** The init gains `Authorization` and nothing else. The token is decrypted under a fresh 30 s `github` grant, and the request is dispatched synchronously inside `vault.withSecret`.
- **When the token is sent.** On every read while signed in, public repositories included. There is no unauthenticated fallback once a call has seen an account.
- **Least privilege for review runs.** The admit site at `src/main/index.ts:193` gets the credential; the review site at `:293` does not.

**Alternatives.**
- (a) `sender.send(url, init)` (minimal): the account owns the fetch for reads too.
- (b) Passing a token string to the reader.
- (c) A reader factory used at both sites (lifecycle as written).
- (d) Unauthenticated first, repeated with the token only after a 404 (UD-4 option 2).
- (e) A fallback to unauthenticated after a renewal failure.

**Why this wins.**
- **Byte identity stays obvious.** The request function keeps byte identity reviewable and trivially testable (judge 3), and leaves `new GitHubReader(fake)` tests unchanged (judge 1). The reader's per-run default `fetch` is also what the existing e2e patch reaches.
- **(b) leaks.** It holds the token in the reader beyond one request (S-2), and the value outlives its entry after sign-out (R2-10).
- **(c) over-grants.** It gives review runs, which never read GitHub, a credential (judge 2).
- **(d) doubles requests.** Private reads cost two requests, and each private read spends the 60-an-hour anonymous allowance per IP.
- **(e) misleads.** A renewal failure would look like "not found".
- **No race with sign-out.** Synchronous dispatch inside `withSecret` (privacy design) means no tombstone can land between the vault's second grant check and the request (`src/main/vault.ts:159-161`).

**Trade-offs.**
- **Public reads are identified.** GitHub sees the user's identity on public reads too, and those reads count toward the user's 5,000 an hour, which is shared with the user's other apps (prior E-08 l.60). The dialog discloses both.
- **The User-Agent stays.** Signed-in reads keep `MoonAliza-public-repository-reader` (C-4). This is recorded as a known limit.

**Risks.**
- **A refactor could change the signed-out request.** A pin committed first guards it, and so does the existing e2e `UNEXPECTED_AUTH` check (`e2e/github-reading.spec.ts:36`). The pin checks `signal` by behaviour (Stop aborts it) and the exact key list, because two AbortSignals compare equal under `toEqual` (DC-13).

**Rests on.** F-13, F-24, S-2, S-4, L-10, L-14; `src/main/github.ts:12-16`; `src/main/index.ts:193`, `:293`; `src/engine/application.ts:368-372`; `src/main/vault.ts:156-162`; UD-4.

---

## DR-6. The renderer contract: a strict discriminated status, polled; outcomes as data; no push channel and no new public codes

**Decision.**
- **Methods.** Five main-owned methods. `github.account.read` returns `{ account: GitHubAccountStatus }`, a strict discriminated union of these members:
  - `not-configured`;
  - `signed-out`, with `ended`, `signOutIncomplete` and `lastOutcome`. `ended` is the reason the app cleared the account (`sign-in-ended`, `app-changed` or `client-rejected`), or null after a user sign-out (DC-1, DC-15). `signOutIncomplete` reports a sign-out that reached no disk (DC-6);
  - `pending`, with `userCode`, `codeExpiresAt`, `committed` and `account`. `committed` is true once GitHub has confirmed the code (DC-5);
  - `signed-in`, with `login`, `renewalHeld` and `lastOutcome`.
- **Polling.** The dialog polls it at 1 Hz while pending. F4 and F5 project as `pending` with `committed: true` until the login read ends. From then on, closing the dialog cancels nothing, and main's cancel is a no-op (DC-5).
- **Outcomes.** Eleven outcome values are DTO data.
- **Errors.** The methods throw only `NOT_IMPLEMENTED`, `ENCRYPTION_UNAVAILABLE` and `NOT_FOUND`, which already have public messages.
- **Pages.** `github.open` takes an enum target, never a URL.

**Alternatives.**
- (a) A push channel, `moonaliza:github`.
- (b) A flat DTO with refines (minimal and privacy).
- (c) A new public `GITHUB_NOT_CONFIGURED` code (privacy).
- (d) Reusing `external.open` with a URL.
- (e) Outcomes thrown as errors.

**Why this wins.**
- **(a) costs a lot for nothing.** It is a second schema, more preload code and more contract tests. Pushes are dropped while no window exists (`src/main/index.ts:158`), and a read is needed after a reload anyway.
- **The union makes invalid states unrepresentable.** It can be tested by a pure projection, and the `ended` flag separates "the app cleared your sign-in" from "you signed out" (judges 1 and 2).
- **(c) adds a public code for nothing.** `NOT_IMPLEMENTED` already says "not available in this development build", and the dialog shows "not configured" before any call.
- **(d) is unsafe.** `external.open` accepts any http(s) URL (`src/shared/params.ts:154`), which breaks F-19.
- **(e) loses the code.** The preload passes only the message (`src/preload/index.ts:9`).

**Trade-offs.**
- **The method set is pinned.** Changing it later touches `tests/contracts.test.ts:42-54`.
- **A reload can hide a flow.** It leaves a flow running unseen until the dialog is reopened (spec 6.6).
- **A confirmed sign-in cannot be cancelled.** Once GitHub has confirmed the code, only Sign out undoes it. That is the point: a user who approved on GitHub and then closed the dialog keeps the sign-in and its login (DC-5).

**Risks.**
- **A refine could reject a legal state.** The bridge would then turn every read into `INTERNAL_ERROR`. The union needs no cross-field refine, and a contract test covers every state, including pending while signed in.

**Rests on.** F-1, F-19, F-21, F-22; `src/preload/index.ts:4-25`; `src/main/bridge.ts:11-57`; `src/main/index.ts:158`, `:197`, `:300`.

---

## DR-7. Engine-facing reasons: five new reasons, a split 403, and static model text

**Decision.**
- **New reasons.** `GitHubErrorCodeSchema` gains `GITHUB_SIGN_IN_REQUIRED`, `GITHUB_RENEWAL_UNAVAILABLE`, `GITHUB_PERMISSION_MISSING`, `GITHUB_FORBIDDEN_SIGNED_IN` and `GITHUB_NOT_FOUND_SIGNED_IN`. They are added in the reader unit's commit, which produces or passes all five. `src/engine/control.ts:108` and `src/main/engine.ts:60-61` read the same enum.
- **The 403 split.**
  - A signed-in 403 with "Resource not accessible by integration" is a missing permission.
  - A signed-in 403 without that text leads with the missing permission, then lists labelled possibilities, including the SAML two-step (V3-1).
  - A signed-out 403 claims no app-permission cause.
- **Text rules.**
  - The texts never name values the model does not see; the rate-limit text says "wait at least a minute".
  - They contain no URL.
  - They are written in the third person.
  - The tool description and the prompts are static.

**Alternatives.**
- (a) Four reasons with one state-neutral `GITHUB_FORBIDDEN` (minimal).
- (b) Texts that tell the model to wait for the reset time or the `retry-after` seconds (minimal and lifecycle as written).
- (c) An install URL interpolated into the 404 text (lifecycle).
- (d) A dynamic tool description that carries the sign-in state.

**Why this wins.**
- **(a) claims a cause GitHub never gave.** It tells the model that an unauthenticated 403 is most likely an app permission. GitHub documents that cause only for app tokens (E-04 l.75, E-15 l.108), and apart from rate limits only that one (V3-2). Three judges named this.
- **(b) points at nothing.** The engine port carries only a code (`src/engine/control.ts:108`).
- **(c) is useless.** Chat links are not opened, so the dialog's button is the install path.
- **(d) breaks prefix-bound replays.** Tools are fixed per run, and Anthropic runs replay against an unchanged prefix (more-models Phase 2).

**Trade-offs.**
- The reason code tells the model whether a failed read was signed in. It never tells the model the login.

**Risks.**
- **Silent collapse.** A reason missing from the enum collapses to `GITHUB_UNAVAILABLE` without a word. Two guards cover it (DC-7):
  - G-19 (U3) parses every member of the frozen `CREDENTIAL_ERRORS` tuple and the five new reasons;
  - U6's scan parses every `throw new Error('GITHUB_…')` literal in `src/main/github*.ts` once U3 and U5 are integrated.

  The store's own error is `ACCOUNT_STORE_FAILED`, so it is not mistaken for a reason.
- **GitHub could reword its error.** If "Resource not accessible by integration" changes, the case falls to `GITHUB_FORBIDDEN_SIGNED_IN`, which still leads with the permission cause (DO-13).

**Rests on.** F-14, F-15, F-16, F-17; E-01 l.34; E-04 l.57, l.75, l.77; E-13 l.64-94; E-15 l.32-38, l.46, l.65-70, l.108-112; R2-1, R2-2, R2-3, R2-9; V3-1..V3-5; DC-7.

---

## DR-8. Transport: Node's global fetch through a late-bound seam

**Rests on UD-5** (recommended answer).

**Decision.**
- **Which fetch.** Every sign-in request goes through `lateFetch`, which reads `globalThis.fetch` per call. Signed-in reads use the reader's default `fetch`, evaluated per run.
- **Required fetcher.** The new classes take a required `fetcher`, so a unit test that forgets its fake fails to compile.
- **What is recorded.** The spec records two things: Windows proxy and certificate behaviour is unverified, and the choice diverges from reviewed decision 4.

**Alternatives.**
- (a) Electron's providers session for sign-in and signed-in reads.
- (b) Moving every GitHub call to an Electron broker now.
- (c) A default fetcher captured at construction.

**Why this wins.**
- **One stack.** Every existing GitHub call uses Node's fetch (`src/main/github.ts:12`, `src/main/research-import.ts:69`). With one stack, sign-in cannot succeed on a network where reads then fail.
- **(a) and (b) change reader behaviour.** Electron enforces `redirect: 'error'` (`docs/specification/more-models.md:123`), which changes the reader's 3xx handling.
- **(a) and (b) are hard to test.** They are not reachable by the existing e2e patch (`e2e/github-reading.spec.ts:31-46`). A github.com TLS fake would break the SAN pin (`tests/github-tls.test.ts:36`).
- **(c) reaches the real network.** It captures the original fetch at startup, so the e2e would reach the real github.com.

**Trade-offs.**
- A user whose network requires the Windows system proxy, or TLS inspection, cannot sign in. They cannot read public GitHub today either.

**Risks.**
- **Node proxy behaviour.** It is observed on Linux only (`docs/evidence/2026-10-12-break-test.md:26`, `:127`). The packaged fuses ignore `NODE_EXTRA_CA_CERTS` (`docs/ARCHITECTURE.md:49`). An Electron broker for all GitHub calls is recorded for later.

**Rests on.** F-24; `docs/specification/decisions.md:8`; `docs/specification/research-journeys.md:11`, `:14`; UD-5.

---

## DR-9. Parameters in a form-encoded body with `Accept: application/json`, as GitHub's own tutorial sends them, placed by one function, with no runtime fallback

**Decision.**
- **One placement point.** `oauthRequest` is the only place `client_id`, `scope`, `device_code`, `grant_type` and `refresh_token` are placed.
- **The placement.** A form-encoded body (`application/x-www-form-urlencoded`), with no query string, for step 1, the poll and the refresh.
- **The header.** `Accept: application/json` on all three, and the response parsed by its `Content-Type`.
- **Pinned.** The fake records which placement arrived, and a test pins it.

**Alternatives.**
- (a) Query parameters, which is the literal reading of E-01 l.118 and l.138.
- (b) Try the body, then fall back to the query.

**Why this wins.**
- **GitHub's own example does it (OF-1, resolved in round 4).** The tutorial "Building a CLI with a GitHub App" (E-21, linked from E-01 l.112) form-encodes step 1's `client_id` and the poll's three parameters. It posts them with `Accept: application/json` to URLs with no query string (E-21 l.300-304, l.315-322). That Ruby's `Net::HTTP.post` sends this as a form-encoded body is Ruby's standard library, not stated on the page (an inference).
- **The reference pages do not settle it.** They use "query parameters" for response fields too (E-01 l.122, l.167), and E-21 reads those fields from the response body, so the phrase reads as loose wording.
- **Secrets stay out of URLs.** A refresh token or device code in a URL is visible to anything that records URLs: debug output, a plain-HTTP proxy hop, a future diagnostics export. A body is not (privacy design).
- **(b) can burn the token.** A refresh token is single-use (E-02 l.36), so sending it twice in two forms could burn it.

**Trade-offs.**
- If a refresh needs the query form, every refresh fails in the field until the one function changes.

**Risks.**
- **The refresh placement is an inference.** E-21 makes no refresh request. The refresh goes to the poll's endpoint (E-01 l.132, E-02 l.72), so it is sent the same way. DO-1's two refreshes confirm it, and DO-2 says how to read a failure of the first one. `scope`, absent from E-21's step 1, goes where `client_id` goes. That matters only if expiry is ever turned off (DR-1).

**Rests on.** OF-1 (resolved); E-21 l.277-285, l.300-304, l.315-322; E-01 l.112, l.118, l.122, l.132, l.138, l.167; E-02 l.36, l.72.

---

## DR-10. Sign-out: local, immediate, and honest about what it does not do

**Decision.**
- **Synchronous part, first.** Generation++ and the sign-out count++, abort the flow at any stage, clear the hold, abort `accountChanged`, set the live account to null, and tombstone both refs (which revokes their grants). The sign-out count refuses a sign-in that is committing at that moment (DR-3).
- **Then, under the lock.** Remove the refs and write `account: null`.
- **Observed, not swallowed (DC-6).** Sign-out never throws a disk error, but it checks whether either the tombstones or the file write reached disk, and retries both once if neither did. If neither does, the status carries `signOutIncomplete`. The dialog then says MoonAliza stopped using the sign-in but could not finish removing it, and that the user may be signed in again after a restart.
- **No network request.**
- **The help text.** It says four things: MoonAliza stopped using the sign-in, and its encrypted copy is deleted now or, if a file cannot be deleted at once, at the next start (GS-11: a removal can fail on its own after the clear reached disk, so "deleted its copy" alone could be false); the authorization and tokens stay valid on GitHub for up to 8 hours or 6 months; where to revoke (Settings, Applications, Authorized GitHub Apps, Revoke); and that only the authorizing person can revoke, while an organization owner can uninstall. No URL is shown, and no text claims revocation or erasure.

**Alternatives.**
- (a) `DELETE /applications/{client_id}/token` or `/grant`.
- (b) `POST /credentials/revoke` for the user's own tokens.
- (c) Sign-out fully under the lock, with no synchronous part.
- (d) Keeping a redaction-only vault entry after sign-out.
- (e) Swallowing disk errors and always saying the copy was deleted (the synthesis as written, DC-6).

**Why this wins.**
- **(a) needs the secret.** Both endpoints need the client secret (E-08).
- **(b) is the wrong tool.** GitHub describes it for credentials the caller does not own, and notifies the owner (E-11).
- **(c) is too slow.** Reads would keep using the token until the lock frees. The synchronous tombstone makes sign-out take effect at the click (F-11).
- **(d) keeps the secret.** It would leave the secret on disk after the user asked to remove it (privacy design).
- **(e) can claim a deletion that did not happen.** Both writes use temp-file-plus-rename on one volume, so a full disk or a Windows rename lock can fail both. The next start would then read the committed account again, while the dialog had said its copy was deleted. The critic's suggested text, "it will retry when MoonAliza restarts", is not used, because nothing records the intent across a restart. The text says what will actually happen.

**Trade-offs.**
- The tokens stay valid on GitHub, and after sign-out they are no longer redacted (R2-10). No copy outlives its entry (L-7, the copy-check test).

**Risks.**
- **Wording drift.** A text could drift into "revoked" or "erased". The panel test forbids both words.

**Rests on.** F-11, F-12; E-02 l.34; E-08; E-09; E-11; E-17 l.34, l.38-44; R2-10; DC-6; GS-11; `src/main/vault.ts:71-79`, `:164-186`; `src/models/artifact-files.ts:49-56`.

---

## DR-11. Private repository text is handled like local project files

**Rests on UD-3** (recommended answer).

**Decision.**
- **Where it is read.** Private text is read in any conversation where the user pasted the URL, under that conversation's existing inference policy.
- **Where it is kept.** In the conversation's history and search. Sign-out does not delete it; deleting the conversation removes it from MoonAliza.
- **Where it is disclosed.** The dialog, the composer footnote, one clause in the cloud dialog, and the spec all say so. No text claims erasure; `secure_delete` is not set.

**Alternatives.**
- (a) Private reads only in local-only conversations.
- (b) Deleting stored private tool results at sign-out.

**Why this wins.**
- **It reuses tested rules.** Main already checks the policy before and after every read (`src/main/index.ts:113-121`, `src/engine/policy.ts:68-78`), and tool results are already stored and indexed (`src/engine/application.ts:318`).
- **(a) and (b) cost a privacy probe.** Both need MoonAliza to know which repositories are private, which means an extra GitHub call per repository.
- **(b) deletes user data.** That is on the stop-list.

**Trade-offs.**
- **Cloud models see private text.** In cloud-allowed conversations the provider sees the private text the user asked about. This is disclosed.
- **Bytes may remain.** Deleted text may remain in SQLite free pages or the WAL (`src/engine/store.ts:119-122`). `secure_delete` is recorded for later.

**Risks.**
- **The disclosure could overclaim.** A wording rule and a test forbid "erases" and "removes all copies".

**Rests on.** F-25; `src/engine/migrations.ts:94-104`; `docs/specification/github-url-reading.md:11`; UD-3.

---

## Cheap to reverse (recorded in the spec, no separate record)

- **Limit values.** The 300 s margin, the 30 s first hold and its doubling, the 60 s rate-limit floor and one-hour ceiling, the 1 s minimum wait, 20 s per request, the 25 s quit wait, 3 consecutive transient polls, 3 identical refresh errors, the 5 s fresh-token age and its 1 s and 2 s resends, the 30 s age under which a 401 never refreshes (GS-1, reusing `transientHoldMs`), the 30-minute code cap, 64 KiB bodies, 8 retired refs, `maxPolls = ceil(lifetime / interval) + 2`. They are constants, and tests shrink them through `limits`. Their type uses `number` fields, which corrects lifecycle's literal number types; with those, `Partial<GitHubLimits>` could not shrink them.
- **Closing the dialog cancels the flow** (lifecycle D-5), until GitHub has confirmed the code (DC-5). Its pending text says so. A renderer reload is the known exception.
- **Pre-redaction before the 16,000-character cut** (privacy X-3). This is the research document reader's existing invariant. It needs one constructor parameter and is revertable alone. Judge 3 called it over-built; it was taken because private repositories are where secrets live (S-2).
- **The client-ID binding and D-7.** An account issued to another non-empty client ID is cleared at startup with no request, and the dialog shows it as ended (`app-changed`, DC-15). An empty constant keeps the refs.
- **`GET /user` is one-shot** and outside the 401 rule (C-5). It keeps only `login`. The login and user-code patterns are recorded; DO-12 observes the live shapes.
- **The User-Agent is kept for signed-in reads** (C-4), so the signed-in init is the signed-out init plus `Authorization`.
- **DTO fields.** `ended` (with its reason), `signOutIncomplete`, `committed` and `renewalHeld`; F4 and F5 project as `pending` (minimal), so the 1 Hz poll sees the login.
- **Texts.** The `githubFailure` texts, the `github-text.ts` texts (the three `ended` texts, the confirmed-pending text and the incomplete sign-out text included), the phishing sentence, the "keep this dialog open" sentence, the cloud-dialog clause, the footnote, and the F-26 sentence.
- **`REQUEST_OFFLINE_ACCESS`** stays true while the registration keeps expiry on (DR-1, DC-3).
- **Exact `verification_uri` match** (fail closed).
- **Header-safe token characters** `[\x21-\x7E\xA1-\xFF]` and the 16,384-character cap.
- **`GITHUB_RENEWAL_UNAVAILABLE` has retry `same-request`.**
- **Sign in is disabled while a call is in flight.**
- **The `stale` path** (minimal). A ref that rotated before dispatch retries on the current ref without spending the call's budget.

### Set aside (the graft was not taken)

- **Privacy's start throttle** (5 step-1 requests per 15 minutes). It would report `rate-limited` when GitHub said nothing. One flow, close-equals-cancel and user-initiated starts already bound it. It is recorded for later in case U-16's answers show per-app limits bind.
- **Privacy's `GITHUB_NOT_CONFIGURED` public code.** `NOT_IMPLEMENTED` serves, and the design keeps zero new public codes.
- **Privacy's monotonic-clock deadline.** The poll bound, the wall clock after every wake, and GitHub's `expired_token` suffice. How `performance.now` behaves across Windows sleep is not established.
- **A `PurposeSchema` in `src/shared/host.ts` that gains `'github'`** (the synthesis as written). That schema is the engine's `network.request` purpose, so the engine could name a sign-in credential. `host.ts` stays unchanged, and a typecheck test keeps `'github'` out of it (DC-8).
- **Privacy's X-4** (abort and discard a response body that arrives after sign-out). The request was authorized when sent, and the content is the user's own repository. It would add a third abort source to `read()`'s error mapping. It is recorded for later.
- **Privacy's X-2** (refuse `"` and `\` in tokens). The brief assumes no character set, and headers do not need the restriction. The JSON-escape gap in redaction is pre-existing for every vault secret.
- **A `token_type === bearer` check.** It is not in F-4, and a harmless variation would fail sign-in.
- **A sidebar indicator for a background flow.** It is replaced by close-equals-cancel.
- **Lifecycle's reader factory at the review site** (least privilege).
- **Constants in `src/shared`** (DR-1).
- **Minimal's state-neutral 403 text** (DR-7).
- **Minimal's refresh without a hold** (DR-4).
- **Lifecycle keeping the dead pair on persist failure** (DR-4).
- **A second refresh in one call** (DR-4).
- **Text pointing the model at headers it never sees** (DR-7).
- **Lifecycle's summary stating six months without a secret as fact.** It is now labelled as resting on DO-1.
