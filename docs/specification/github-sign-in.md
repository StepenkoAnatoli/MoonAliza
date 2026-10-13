# GitHub sign-in design

**Status: approved, not yet built.** The user's Mandate reply (2026-10-13, `docs/orchestration/2026-10-13-github-sign-in/MANDATE.md`): GO MERGE, read-only (UD-2), private text like local project files (UD-3). UD-1 is open: until the user registers the GitHub App, the build ships with empty constants and the sign-in says it is not configured in this build.

With GitHub sign-in, the user signs in to GitHub from MoonAliza using the device flow of a public GitHub App. The app has Contents: Read-only and Metadata: Read-only, issues expiring user tokens, and has no client secret anywhere. `read_github` can then read the user's **private** repositories, read-only.

**Inputs**
- Requirements: `docs/orchestration/2026-10-13-github-sign-in/REQUIREMENTS.md`. The rows this design corrected are marked there.
- Decisions: `DECISIONS.md` in the same folder. Work breakdown: `BREAKDOWN.md` in the same folder.
- Evidence: the design project `docs/research/2026-10-13-github-sign-in-design/research/` (E-01..E-21, U-1..U-16, BRIEF.md), and the prior project `docs/research/2026-10-12-app-sign-in/research/`.

**Citation conventions**
- **E-nn l.N** is line N of row E-nn's capture. **prior E-nn** is a row of the prior project.
- **R2-n** is a round-2 verifier finding (`reports/stage1-round2-workflow.json`). Where it differs from the brief, R2-n wins.
- **V3-n** is round-3 verifier finding S-n on the brief (workflow `github-sign-in-stages2-3`, `verify:r3`). Each one is applied below.
- **DC-n** is a design-critic finding (`reports/stages2-3-workflow.json`, `result.critic.findings`). Each one is resolved below, where the rule it changed is stated.
- **GS-n** is a final-pass critic finding (`reports/revise-workflow.json`, `result.critic.findings`). Each one is resolved below in the same way.
- **UD-n** is a user decision. This design states the recommended answer, and it changes where the Mandate picks another.
- Code lines are at `0815f42`. The research merge `d0df7e9` adds documents only.

**How this design was chosen.** Three designs were judged (minimal, lifecycle-first, privacy-first). Lifecycle won two of the three judgements, with totals of 118, 114 and 108.5 across the three judges. This design is lifecycle, plus the grafts and fixes recorded in `DECISIONS.md`. It includes the hold minimal lacked (judge 3 rated that gap fatal).

**What has not been confirmed.** Nothing has been sent to GitHub with a registered app.
- Every GitHub behaviour this design relies on and the corpus does not state appears in "Day one", together with what the build does until it is checked.
- None of those checks blocks the merge. All of them come before the first release that carries the feature (A-4).
- In particular, staying signed in for up to six months without a client secret rests on two things: the first refresh, which E-02 l.79 documents, and day-one check DO-1 for every refresh after it. Until DO-1 passes, "six months" is a reading of E-02 l.79, not a fact.

**Departures from the brief and from the requirements.** Each is decided below and recorded as a correction in REQUIREMENTS.md.

1. **A rate-limited refresh** fails the call as `GITHUB_RATE_LIMIT` (R2-4), not as the renewal reason that F-7(b) named. After any failed refresh, the account holds off further refreshes (section 6.5).
2. **Five new `read_github` reasons, not four.** A 403 on a signed-in read and a 403 on a signed-out read get different texts. The signed-out text never claims an app-permission cause it cannot have observed (section 7).
3. **Two refresh outcomes clear the account**, because the old pair is dead once a refresh is used (E-02 l.36):
   - a 2xx answer that carries an `access_token` failing the shape check;
   - a refreshed pair that cannot be persisted.

   The brief's rule that "a body that is neither a token nor a known error keeps the vault" still holds for a 2xx answer with no `access_token` at all, until the same answer comes three times in a row (GS-2).
4. **Closing the GitHub dialog cancels a pending sign-in**, until GitHub has confirmed the code (section 6.6).
5. **The account file also records `obtainedAt` and `clientId`** (section 4.2).
6. **The design critic's corrections** (DC-1..DC-16) change F-1..F-3, F-5..F-12, F-16, F-21, S-2, S-3, T-3..T-7, T-9, A-4 and D-3. Each changed row is marked "(DC-n)" in REQUIREMENTS.md.
7. **The final-pass corrections** (GS-1..GS-11) change F-6..F-8, F-10, F-12, S-4, T-3, T-4, T-9 and A-4, each marked "(GS-n)" in REQUIREMENTS.md.

### 1. Shape

| Item | Count | What |
|---|---|---|
| New source modules | 8 | `src/main/github-app.ts` (constants), `src/main/github-credential.ts` (the reader seam, types only), `src/shared/github-account.ts` (the status DTO), `src/main/github-oauth.ts` (the wire), `src/main/github-account-store.ts` (the account file and vault refs), `src/main/github-signin.ts` (the lifecycle service), `src/renderer/GitHubAccountPanel.tsx`, `src/renderer/github-text.ts` |
| Changed source files | 8 | `src/main/vault.ts`, `src/shared/params.ts`, `src/shared/index.ts`, `src/main/github.ts`, `src/shared/github.ts`, `src/engine/application.ts` (strings only), `src/main/index.ts`, `src/renderer/App.tsx` (plus `styles.css` if needed) |
| New IPC methods | 5 | all main-owned and request/response: `github.account.read`, `github.signIn.start`, `github.signIn.cancel`, `github.signOut`, `github.open` |
| New push channels, preload changes | 0 | the dialog polls the status read (F-21) |
| New public error codes (`ErrorCodeSchema`, `publicMessages`) | 0 | the new methods throw only `NOT_IMPLEMENTED`, `ENCRYPTION_UNAVAILABLE` and `NOT_FOUND`, which already have messages (`src/main/bridge.ts:40-42`), plus the existing `ENGINE_UNAVAILABLE` precondition (`src/main/index.ts:197`) |
| New `read_github` reasons (`GitHubErrorCodeSchema`) | 5 | `GITHUB_SIGN_IN_REQUIRED`, `GITHUB_RENEWAL_UNAVAILABLE`, `GITHUB_PERMISSION_MISSING`, `GITHUB_FORBIDDEN_SIGNED_IN`, `GITHUB_NOT_FOUND_SIGNED_IN` |
| Vault | +1 purpose | `github`, with grants capped at 30 s |
| Files on disk | +1 | `<userData>/github/account.json`, holding refs and non-secret metadata only |
| Engine protocol | 0 new messages | only the tool description and the system-prompt strings change |

### 2. The lifecycle model (src/main/github-signin.ts)

Main owns two orthogonal state machines: one for the **account** and one for the **flow**. A pure function projects the pair onto the status DTO. Nothing else changes sign-in state. One object, `GitHubSignIn`, owns all of the sign-in's GitHub network work: the device flow, the single-flight refresh, `GET /user`, and the authenticated `send()` that `read_github` uses.

#### 2.1 Account machine (A)

| State | Meaning | Status DTO |
|---|---|---|
| A0 NotConfigured | `GITHUB_APP.clientId` or `GITHUB_APP.installUrl` is empty (F-20) | `not-configured` |
| A1 SignedOut | No account; never signed in, or the user signed out | `signed-out`, `ended: null` |
| A2 Ended | No account, because **the app** cleared it (the L-12 cases) | `signed-out`, `ended:` the L-12 case's reason |
| A3 SignedIn | An account with refs, expiry times and a login | `signed-in` |
| A4 Refreshing | A3 plus exactly one refresh in flight | `signed-in` (the refresh is not shown) |

| From | Event | To | Side effects |
|---|---|---|---|
| startup | a valid file whose refs are committed (`vault.has`, `src/main/vault.ts:123-127`) and whose client ID matches | A3 | none; no network (L-2) |
| startup | the file is missing or invalid, or its refs are not committed | A1 | the file is rewritten to `account: null` at `finishStartup`; startup never stops (`src/main/index.ts:320`) |
| startup | the file names another non-empty client ID (4.4) | A2, `app-changed` | as the row above; no request (DC-15) |
| A1..A4 | a flow reaches its commit point (6.3) | A3 (new) | generation++; old refs retired; the result of an A4 refresh is discarded |
| A3 | `send()` finds under 300 s left on the access token, a valid refresh token and no hold | A4 | starts the single-flight refresh |
| A4 | the refresh succeeds, is persisted, and the generation is unchanged | A3 (new pair) | generation++; old pair retired; hold cleared |
| A4 | a refresh answer that ends the account (L-12, 6.5) | A2 | `clearIf` (6.4), with the reason L-12 names |
| A4 | the refresh is rate-limited | A3, held | hold until the wait passes, at least `transientHoldMs` (DC-12); waiters get `GITHUB_RATE_LIMIT` |
| A4 | a transient failure, an unknown `error`, an unusable answer, a local vault failure (GS-6), or the capability denied twice | A3, held | hold, doubling with each consecutive failure (6.5); waiters get `GITHUB_RENEWAL_UNAVAILABLE` |
| A3 | the access token is past expiry and the refresh token is expired or absent | A2 | `clearIf`; no request |
| A3 | a 401 under the 401 rule (6.4), on a token at least `transientHoldMs` old | A2 | `clearIf(accessRef)` |
| A3 | a 401 on a token under `transientHoldMs` old, with no hold active (6.4, GS-1) | A3, held, or A2 on the third in a row | no refresh; `failed()`, or `clearIf` |
| A1..A4 | `signOut()` | A1 | the flow is cancelled; local only (6.7) |
| any | engine restart (`src/main/index.ts:178`) | unchanged | grants are cleared by `setEpoch` (`src/main/vault.ts:55-58`); work that needs a grant re-grants once (F-7(c)) |
| any | `before-quit` | unchanged | the flow is aborted; an A4 refresh is waited for, bounded (6.8) |

#### 2.2 Flow machine (F)

| State | Entered by | Left by |
|---|---|---|
| F0 Idle | startup; any end | `start()` moves to F1 |
| F1 Requesting | `start()`, with step 1 in flight | a code moves to F2. A failure moves to F0 with `start-failed`, `disabled`, `client-rejected` or `rate-limited`. Cancel, sign-out, close or quit moves to F0 |
| F2 Waiting | a code was received, or a poll answered "continue" | a wake, then the deadline check, then F3 (or F0 with `expired`). Cancel, sign-out, a new start, dialog close or quit moves to F0 |
| F3 Polling | a token request is in flight | "continue" moves to F2. Tokens with a good shape move to F4. A terminal answer moves to F0 with its outcome. Cancel discards the answer (F0) |
| F4 Storing | the **commit point**: `store.replace` under the lock | done: the account is A3, then F5. Only a sign-out refuses the commit (6.3). From here on, Cancel, dialog close and a new `start()` are no-ops (6.6, DC-5) |
| F5 Login | `GET /user`, best effort (F-4) | F0. Only sign-out and quit abort it. A failure or an abort leaves `login: null` |

#### 2.3 Projection: `project(A, F, lastOutcome, hold)`

1. A0 projects as `not-configured`.
2. Otherwise, F2..F5 project as `pending`, with `{ userCode, codeExpiresAt, committed, account }`. `committed` is true in F4 and F5, once GitHub has confirmed the code (DC-5). `account` is `{ login }` while an account exists (during "Sign in again", and from the commit point on), and `null` otherwise. F4 and F5 stay `pending`, so the dialog's 1 Hz poll sees the login arrive.
3. Otherwise, A3 or A4 projects as `signed-in`, with `{ login, renewalHeld: now() < hold.until, lastOutcome }`.
4. Otherwise the state is `signed-out`, with `{ ended: A === A2 ? endedReason : null, signOutIncomplete, lastOutcome }`.

F1 projects as the state before it. `start()` resolves with the projected status once step 1 answers.

All of these live in memory only:
- `lastOutcome` is cleared by `start()` and set when a flow ends with an outcome.
- `endedReason` is set by `clearIf`, and at construction when `store.openedAppChanged()` (4.4). It is cleared by `start()`, by `signOut()` and by a sign-in commit. Its values: `sign-in-ended`, `app-changed` (DC-15) and `client-rejected` (DC-1).
- `signOutIncomplete` is set by `signOut()` (6.7, DC-6) and cleared by `start()`.

#### 2.4 Lifecycle invariants (each is checked by named tests)

- **L-1** At most one flow, and at most one refresh request in flight per account.
- **L-2** No ambient traffic. A GitHub request is caused only by one of:
  - `start()`;
  - a poll of a live flow;
  - the `GET /user` after a commit point;
  - a `send()` from a read.

  Nothing is sent at startup, on a timer, or on `status()` (F-6, F-21).
- **L-3** A refresh, once sent, ends only by its response or by its own 20 s timeout. None of these abort it: Stop, a read's deadline, an engine restart, sign-out, or quit. Sign-out only causes its result to be discarded.
- **L-4** Persist before use. No request carries a refreshed access token before the new pair is committed in the vault and named by the file. `vault.grant()` also refuses a ref that is not committed (`src/main/vault.ts:132`).
- **L-5** Expired tokens and sign-out.
  - No request carries an access token whose stored expiry, by the local clock, has passed or is within the 300 s margin, when a refresh is possible.
  - A token can still reach GitHub expired in two cases: it expired in flight, or the local clock stepped (V3-7). Those cases go through the 401 rule.
  - No request carries either token after `signOut()` resolves.
- **L-6** Every account mutation runs under `serialized(accountFile)` (`src/models/artifact-files.ts:59-63`) and is admitted against what it was based on (DC-4):
  - a refresh, against the generation and the live access ref it started from (6.5);
  - a sign-in, against the sign-out count taken when it reached its commit point, so only a user sign-out refuses it (6.3);
  - an app clear, against the live access ref (`clearIf`, 6.4);
  - a sign-out, unconditionally.

  The live account changes only synchronously, right after an admit check passes.
- **L-7** Where clear values may exist (DC-9).
  - `device_code` lives only in the flow object.
  - MoonAliza code receives a token only between receipt and `saveStaged`, and inside one `vault.withSecret` callback, whose request is dispatched synchronously (6.4). It keeps no reference to a token after the request carrying it settles: not in a field, a closure, an error or its `cause`, a cache, `process.env`, argv or a log.
  - Copies the runtime makes are out of scope, because JavaScript cannot clear them and no test can observe them. They include the init object and the header string while `fetch` runs, `fetch`'s own Request and Headers, socket and TLS buffers, and strings V8 has not yet collected.
  - What is tested: the byte scans (T-6); the copy check (refresh 19); a walker over every rejection's `message` and `cause` chain, which finds neither a marker nor any 8-character substring of one; and wire parse errors replaced without `cause` (5.3).
- **L-8** Quit waits for GitHub work for at most `quitWaitMs` (25 s).
- **L-9** No poll is sent at or after the code's deadline. The number of polls is bounded, and at most 3 consecutive transient polls are allowed.
- **L-10** Signed out or not configured, a read calls its fetcher once, with the same URL and the **same init object** it builds today (F-13). Its pin compares `signal` by behaviour, not by deep equality (DC-13, the read tests).
- **L-11** A missing or invalid account file reads as signed out and never stops startup.
- **L-12** The account is cleared only in these cases. Each app clear names the `ended` reason in brackets; a sign-out leaves `ended` null.
  - a refresh answering `bad_refresh_token` or `unsupported_grant_type` (`sign-in-ended`), or `incorrect_client_credentials` (`client-rejected`), at any status (DC-1);
  - a refresh answering the same unknown `error` code `maxSameRefreshError` (3) times in a row (`sign-in-ended`, DC-1), or the same status with an `unusable` answer other than a 3xx (`sign-in-ended`, GS-2);
  - a 2xx refresh that carries an `access_token` failing the shape check (`sign-in-ended`);
  - a persist failure after a refresh (`sign-in-ended`);
  - both tokens expired, with no request sent (`sign-in-ended`);
  - the 401 rule, on a token at least `transientHoldMs` (30 s) old (`sign-in-ended`, DC-2, GS-1);
  - a 401 on a token under `transientHoldMs` old, `maxSameRefreshError` times in a row with refreshes in between (`sign-in-ended`, GS-1);
  - `open()` finding another non-empty client ID (`app-changed`, DC-15);
  - sign-out.
- **L-13** No refresh request is sent while a hold is active.
- **L-14** A call makes at most one refresh and one retry under the 401 rule. Until DO-16, a 401 on a token under `freshTokenMs` old also allows at most two resends of the same token (6.4, DC-2). A 401 on a token under `transientHoldMs` old never starts a refresh (GS-1). Once a call has seen an account, it never falls back to an unauthenticated request.

#### 2.5 Who owns which signal

| Work | Runs on | Aborted by | Never aborted by |
|---|---|---|---|
| Step 1, waits and polls | `flow.controller`, combined per request with a 20 s timeout | Cancel, a new `start()`, `signOut()`, dialog close, `before-quit` (synchronously) | Stop, read deadline, engine restart |
| Commit point (F4) | none (local disk) | nothing | everything |
| `GET /user` (F5) | `flow.controller` combined with 20 s | sign-out, quit (the login stays unknown) | Cancel, dialog close, a new `start()` (all no-ops from F4, DC-5); engine restart (re-grants once) |
| Refresh request and persist | its own `AbortSignal.timeout(requestTimeoutMs)` only | its timeout | Stop, read deadline, engine restart, sign-out, quit |
| A read waiting for a refresh, or pausing before a fresh-token resend (6.4) | `Promise.race([refresh or pause, readSignal, accountChanged.signal])` | Stop gives `RUN_CANCELLED`; the 20 s deadline gives `GITHUB_TIMEOUT` (`src/main/github.ts:38`, `:79`); a clear or replacement re-reads the account (6.4) | none |
| A read's own request | the read signal (Stop combined with 20 s) | Stop, deadline | none |

`accountChanged` is an `AbortController`. It is aborted and replaced whenever the account is cleared or replaced by a sign-in. A refresh resolves its own waiters through its promise, and does not abort it.

### 3. Contracts

Frozen in U0 unless the subsection says a unit owns it.

#### 3.1 Constants (src/main/github-app.ts, U0; values by the lead after UD-1)

```ts
/** MoonAliza's GitHub App (UD-1): public identifiers, not credentials. No client secret exists for this app's use (F-20). */
export const GITHUB_APP: Readonly<{ clientId: string; installUrl: string }> = { clientId: '', installUrl: '' };
/** Copied from the app's public page (Edit, Public page, Install; E-12 l.49-53). Never derived from the app's name (E-03 l.53, R2-8). */
export const DEVICE_CODE_URL = 'https://github.com/login/device/code';      // E-01 l.118
export const TOKEN_URL = 'https://github.com/login/oauth/access_token';     // E-01 l.138, E-02 l.72
export const DEVICE_PAGE_URL = 'https://github.com/login/device';          // E-01 l.130: the only accepted verification_uri
export const USER_URL = 'https://api.github.com/user';                      // E-20 l.34-39, E-06 l.1231
/** Step 1 sends scope=offline_access (E-01 l.120). It forces expiring tokens even when the registration turns expiry off (E-02 l.40-42),
 *  so it flips to false only together with UD-6's "turn expiry off" fallback (DR-1, DC-3). */
export const REQUEST_OFFLINE_ACCESS = true;
export const isConfigured = (app: { clientId: string; installUrl: string }) => app.clientId !== '' && app.installUrl !== '';
```

- **Main only, with no Electron import.** The e2e imports this file. No model-facing text needs the install URL (7.4), so neither the engine nor the renderer bundle carries it.
- **Not configurable.** No value is a setting, an environment variable or a file (`docs/specification/research-journeys.md:11`).
- **Constants test** (`tests/github-app-constants.test.ts`) checks:
  - the two values are both empty or both set;
  - `clientId` matches `^[A-Za-z0-9._-]{1,64}$`;
  - `installUrl` matches `^https://github\.com/apps/[^/?#\s]+/installations/new$`;
  - `REQUEST_OFFLINE_ACCESS` is `true`. The failure message names UD-6, so turning it off needs this test changed in the same commit as the registration change (DC-3);
  - no file under `src/` contains the string `client_secret`, so comments write "client secret" with a space.

#### 3.2 Status DTO (src/shared/github-account.ts, U0; re-exported from src/shared/index.ts)

```ts
export const GitHubLoginSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/);              // '_' for enterprise-managed logins
export const GitHubUserCodeSchema = z.string().max(32).regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/);    // E-01 l.129: 8 characters with a hyphen; not assumed exactly (DO-12)
export const GitHubAttemptOutcomeSchema = z.enum(['cancelled', 'expired', 'restart', 'denied', 'disabled', 'client-rejected',
  'grant-unsupported', 'email-unverified', 'rate-limited', 'start-failed', 'failed']);
/** Why the app ended the account (L-12); null after a user sign-out. */
export const GitHubEndedSchema = z.enum(['sign-in-ended', 'app-changed', 'client-rejected']);
const PendingAccount = z.object({ login: GitHubLoginSchema.nullable() }).strict();
export const GitHubAccountStatusSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('not-configured') }).strict(),
  z.object({ state: z.literal('signed-out'), ended: GitHubEndedSchema.nullable(), signOutIncomplete: z.boolean(), lastOutcome: GitHubAttemptOutcomeSchema.nullable() }).strict(),
  z.object({ state: z.literal('pending'), userCode: GitHubUserCodeSchema, codeExpiresAt: DateTimeSchema, committed: z.boolean(), account: PendingAccount.nullable() }).strict(),
  z.object({ state: z.literal('signed-in'), login: GitHubLoginSchema.nullable(), renewalHeld: z.boolean(), lastOutcome: GitHubAttemptOutcomeSchema.nullable() }).strict(),
]);
export type GitHubAccountStatus = z.infer<typeof GitHubAccountStatusSchema>;
export const GitHubOpenTargetSchema = z.enum(['device', 'install']);
export type GitHubOpenTarget = z.infer<typeof GitHubOpenTargetSchema>;
```

The fields `ended`, `signOutIncomplete` and `committed` are defined by the projection (2.3).

The DTO never carries any of the following (F-21, S-1):
- a token;
- `device_code`;
- `verification_uri` (main opens a constant);
- `interval`;
- a vault ref;
- the client ID;
- any GitHub response text other than the validated `user_code` and `login`.

`login: null` means GitHub did not return the login (F-4).

#### 3.3 IPC methods (src/shared/params.ts, U0)

```ts
const githubAccountResult = z.object({ account: GitHubAccountStatusSchema }).strict();
'github.account.read':  method(Empty, githubAccountResult, 'main', 'read', 'authenticated'),
'github.signIn.start':  method(Empty, githubAccountResult, 'main', 'network', 'user-confirmed'),
'github.signIn.cancel': method(Empty, githubAccountResult, 'main', 'lifecycle', 'authenticated'),
'github.signOut':       method(Empty, githubAccountResult, 'main', 'write', 'user-confirmed'),
'github.open':          method(z.object({ target: GitHubOpenTargetSchema }).strict(), z.object({ opened: z.literal(true) }).strict(), 'main', 'native', 'user-confirmed'),
```

| Method | Effect | Can throw (all already mapped by `publicMessages`) |
|---|---|---|
| `github.account.read` | memory only; no request | nothing |
| `github.signIn.start` | waits for step 1 only (at most 20 s), then returns `pending` or the outcome | `NOT_IMPLEMENTED` when not configured; `ENCRYPTION_UNAVAILABLE` (`src/main/vault.ts:83`). Both are checked before any request (F-2) |
| `github.signIn.cancel` | aborts a pending flow before its commit point; a no-op otherwise (6.6) | nothing |
| `github.signOut` | local only (6.7). Disk errors are not thrown; `signOutIncomplete` reports a removal that reached no disk (DC-6) | nothing |
| `github.open` | `shell.openExternal` of a constant: `device` only while pending, `install` when configured | `NOT_FOUND` (device with no flow pending), `NOT_IMPLEMENTED` (install when not configured) |

- Every method also refuses while `!engine || !window`, with the existing `ENGINE_UNAVAILABLE` (`src/main/index.ts:197`).
- Any other throw becomes `INTERNAL_ERROR` (`src/main/bridge.ts:53-57`).
- Flow outcomes are **data** in the DTO, never thrown, because the preload passes only the error message on (`src/preload/index.ts:9`).
- The engine gets no sign-in message (F-22).
- `external.open` (`src/main/index.ts:300`) is not used and not changed.

#### 3.4 The credential seam (src/main/github-credential.ts, U0, types only)

```ts
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
/** Main's fetch, looked up per call: the service is built at startup, before an e2e patch of globalThis.fetch lands (section 10). */
export const lateFetch: Fetcher = (url, init) => globalThis.fetch(url, init);
export interface GitHubSend { response: Response; authenticated: boolean }
export interface GitHubCredential {
  /**
   * Sends one GitHub API request.
   * Signed out or not configured: calls request(undefined) exactly once and returns its response, authenticated: false.
   * Signed in: the expiry pre-check (joining or starting the single-flight refresh when due), then request(`Bearer ${token}`)
   * called synchronously inside vault.withSecret under a fresh 'github' grant, then the 401 rule (at most one refresh, one retry).
   * request must call its fetcher synchronously, before any await, and keep no copy of the authorization value.
   * signal ends only this caller's waiting; it never aborts a refresh.
   * Originates only members of CREDENTIAL_ERRORS, or rejects when signal aborts. It rethrows the request's own rejection and a local
   * vault error while decrypting the access token (ENCRYPTION_UNAVAILABLE, a missing or undecryptable entry) unchanged;
   * the reader maps those to GITHUB_UNAVAILABLE, as today (GS-6).
   */
  send(request: (authorization: string | undefined) => Promise<Response>, signal: AbortSignal): Promise<GitHubSend>;
}
export const SIGNED_OUT: GitHubCredential = { async send(request) { return { response: await request(undefined), authenticated: false }; } };
/** Every error send() originates (3.9 layer 3). G-19 parses each in GitHubErrorCodeSchema (DC-7). */
export const CREDENTIAL_ERRORS = ['GITHUB_SIGN_IN_REQUIRED', 'GITHUB_RENEWAL_UNAVAILABLE', 'GITHUB_RATE_LIMIT'] as const;
export type CredentialError = (typeof CREDENTIAL_ERRORS)[number];
```

The credential never sees the URL. The reader keeps its own fetcher and its own init (7.1).

#### 3.5 Wire API (src/main/github-oauth.ts; owned by U1, listed for review)

```ts
export interface WireLimits { requestTimeoutMs: number; maxBodyBytes: number; rateLimitFloorMs: number; rateLimitCeilingMs: number }
export type DeviceCodeResult =
  | { kind: 'code'; deviceCode: string; userCode: string; expiresInS: number; intervalS: number }
  | { kind: 'rate-limited'; waitMs: number }
  | { kind: 'error'; code: string }        // `error` at any status; code matches /^[a-z_]{1,64}$/, otherwise 'unknown'
  | { kind: 'failed' };                   // thrown, timeout, 3xx, non-2xx without error, oversize, unparseable, a bad field, verification_uri not the constant
export interface IssuedTokens { access: string; refresh: string | null; accessExpiresInS: number | null; refreshExpiresInS: number | null }
export type TokenResult =
  | { kind: 'tokens'; tokens: IssuedTokens; receivedAt: number }
  | { kind: 'rate-limited'; waitMs: number }
  | { kind: 'error'; code: string; intervalS: number | null }
  | { kind: 'malformed' }                 // 2xx whose access_token is present but fails the shape check, or whose expiry fields do
  | { kind: 'unusable'; status: number }  // 3xx, a non-2xx below 500 without `error`, or a 2xx without access_token; status keys the GS-2 count
  | { kind: 'transient' };                // thrown, timeout, 5xx, oversize, unparseable
/** 5.2: the only place client_id, scope, device_code, grant_type and refresh_token are placed. */
export function oauthRequest(url: string, params: Readonly<Record<string, string>>, signal: AbortSignal): { url: string; init: RequestInit };
export function rateLimitWait(response: Response, nowMs: number, limits: WireLimits): number | null;
export function headerSafeToken(value: unknown, prefix: 'ghu_' | 'ghr_'): value is string;
/** offlineAccess adds scope=offline_access; the service passes REQUEST_OFFLINE_ACCESS (3.1). */
export function requestDeviceCode(fetcher: Fetcher, clientId: string, offlineAccess: boolean, signal: AbortSignal, limits: WireLimits, now: () => number): Promise<DeviceCodeResult>;
export function requestToken(fetcher: Fetcher, params: Readonly<Record<string, string>>, signal: AbortSignal, limits: WireLimits, now: () => number): Promise<TokenResult>;
/** One GET /user; dispatches synchronously (call it inside withSecret); the 5.1 options (redirect 'manual', credentials 'omit',
 *  cache 'no-store', the caller's signal, which carries the 20 s timeout, GS-8); 64 KiB; keeps only `login`; any failure, a 3xx included, is null. */
export function fetchLogin(fetcher: Fetcher, authorization: string, signal: AbortSignal, limits: WireLimits): Promise<string | null>;
```

#### 3.6 Account store API (src/main/github-account-store.ts; owned by U2, listed for review)

```ts
export interface GitHubAccount { readonly accessRef: string; readonly refreshRef: string | null; readonly accessExpiresAt: number | null;
  readonly refreshExpiresAt: number | null; readonly obtainedAt: number; readonly login: string | null;
  readonly signInId: string }   // memory only, never in the file: new for a sign-in and at open(), copied by a refresh (GS-10)
/** written: whether account.json names the new refs when replace gives up. Not a GITHUB_ code (DC-7). */
export class ReplaceFailure extends Error { constructor(readonly written: boolean) { super('ACCOUNT_STORE_FAILED'); } }
/** 'durable': the clear reached disk (a tombstone persist or the file write), so the next start reads no account; the encrypted
 *  entries are deleted now, or by the next start's reconcile if a removal failed (GS-11). 'not-durable': neither write did, after one retry (DC-6). */
export type ClearResult = 'not-admitted' | 'durable' | 'not-durable';
export class GitHubAccountStore {
  constructor(file: string, vault: Pick<Vault, 'saveStaged' | 'commit' | 'tombstone' | 'remove' | 'has'>, clientId: string, clock?: () => number);
  open(): Promise<void>;            // never throws (4.4)
  openedAppChanged(): boolean;      // open() dropped an account issued to another client ID (4.4, DC-15)
  references(): string[];           // the live account's refs, for the startup reconcile
  finishStartup(): Promise<void>;   // never throws (4.4)
  current(): GitHubAccount | null;  // the live account
  // 4.3; null = not admitted. 'sign-in': login null, and a failed commit rolls back under the same lock (DC-11, GS-3).
  // 'refresh': login and signInId copied from live under the lock (GS-10); a failed commit throws ReplaceFailure(true).
  replace(issued: IssuedTokens, receivedAt: number, kind: 'sign-in' | 'refresh', admit: (live: GitHubAccount | null) => boolean): Promise<GitHubAccount | null>;
  setLogin(signInId: string, login: string): Promise<void>;   // only while live?.signInId === signInId, so across refreshes (GS-10); never throws
  clear(admit: (live: GitHubAccount | null) => boolean): Promise<ClearResult>;   // synchronous prologue (4.3); never throws
}
```

The store is modelled on `CollectorSettings` (`src/main/collector-settings.ts:23-91`).

#### 3.7 Service API and limits (src/main/github-signin.ts; owned by U5, listed for review)

```ts
export interface GitHubLimits { requestTimeoutMs: number; maxBodyBytes: number; refreshMarginMs: number; grantMs: number;
  transientHoldMs: number; rateLimitFloorMs: number; rateLimitCeilingMs: number; maxTransientPolls: number;
  maxCodeLifetimeMs: number; quitWaitMs: number; clockSkewMs: number;
  maxSameRefreshError: number; freshTokenMs: number; freshRetryMs: number }   // DC-1; DC-2
export const GITHUB_LIMITS: Readonly<GitHubLimits> = { requestTimeoutMs: 20_000, maxBodyBytes: 65_536, refreshMarginMs: 300_000,
  grantMs: 30_000, transientHoldMs: 30_000, rateLimitFloorMs: 60_000, rateLimitCeilingMs: 3_600_000, maxTransientPolls: 3,
  maxCodeLifetimeMs: 1_800_000, quitWaitMs: 25_000, clockSkewMs: 300_000,
  maxSameRefreshError: 3, freshTokenMs: 5_000, freshRetryMs: 1_000 };
export interface GitHubSignInDeps {
  store: GitHubAccountStore; vault: Pick<Vault, 'grant' | 'withSecret' | 'revokeContext'>;
  epoch(): string;                                       // () => engine?.epoch ?? '' (the collector's pattern, src/main/index.ts:147)
  encryptionAvailable(): boolean;                        // () => safeStorage.isEncryptionAvailable()
  fetcher: Fetcher;                                      // required: index.ts passes lateFetch; a test that forgets the fake fails to compile
  config?: { clientId: string; installUrl: string; offlineAccess?: boolean };   // default GITHUB_APP; tests inject; never a setting, environment variable or file
                                                         // offlineAccess defaults to REQUEST_OFFLINE_ACCESS: a test seam, not a setting (GS-5)
  now?(): number; sleep?(ms: number, signal: AbortSignal): Promise<void>; limits?: Partial<GitHubLimits>;
}
export class GitHubSignIn implements GitHubCredential {
  constructor(deps: GitHubSignInDeps);
  status(): GitHubAccountStatus;                         // synchronous, pure projection, no I/O
  start(): Promise<GitHubAccountStatus>;
  cancel(): GitHubAccountStatus;
  signOut(): Promise<GitHubAccountStatus>;
  openTarget(target: GitHubOpenTarget): string;          // DEVICE_PAGE_URL while pending, else NOT_FOUND; installUrl, else NOT_IMPLEMENTED
  send: GitHubCredential['send'];
  close(): Promise<void>;                                // its synchronous part aborts the flow and refuses new work
}
```

- **Limits.** These are constants. Tests shrink them through `limits`; no setting, environment variable or file reads them.
- **Grant clock.** A grant's `expiresAt` is always `Date.now() + grantMs`, never the injected `now()`, because `vault.grant` checks it against `Date.now()` (`src/main/vault.ts:131`, `:149`).
- **Request timeouts in tests.** `requestTimeoutMs` uses `AbortSignal.timeout`. Tests shrink it and run in real time (for example 50 ms against a hanging fake). They never drive it with fake timers, which cannot reach that timer.

#### 3.8 Vault purpose and grants (src/main/vault.ts, U0)

```ts
purpose: 'inference' | 'provider-test' | 'research' | 'provision' | 'github';                                        // :13
if ((binding.purpose === 'provider-test' || binding.purpose === 'research' || binding.purpose === 'github') && binding.expiresAt > Date.now() + 30_000) // :135
```

- **`src/shared/host.ts` is unchanged (DC-8).** Its `PurposeSchema` is the purpose of the engine's `network.request` (`HostMessageSchema`, `:4-9`), so adding `'github'` there would let the engine name a sign-in credential. A typecheck-level test asserts that `HostMessage['payload']['purpose']` is a subset of `CredentialBinding['purpose']` and does not include `'github'`.
- **One grant per use**, each with its own `contextId`: `github:read:<uuid>`, `github:refresh:<uuid>` or `github:user:<uuid>`.
  - It is never a bare `runId`, because `infer()` revokes run contexts (`src/main/index.ts:104`).
  - It is revoked in `finally` (the pattern of `src/main/research-import.ts:73-78`).
- **The grant only has to cover the decrypt.** `withSecret` checks before and after reading the file, then calls the operation synchronously (`src/main/vault.ts:157-161`). The fetcher call inside the operation is the first thing it does, so a tombstone cannot land between the second check and the dispatch.

#### 3.9 Error taxonomy

| Layer | What | Crosses |
|---|---|---|
| 1. Wire results | `DeviceCodeResult` and `TokenResult` (3.5) | nothing; internal to main; never carry response text |
| 2. Attempt outcomes | the 11 values of `GitHubAttemptOutcomeSchema` (table below) | renderer, as DTO data |
| 3. Credential errors thrown by `send()` | the members of `CREDENTIAL_ERRORS` (3.4), or the read signal's abort. The request's own rejection and a local vault error on the access token pass through unchanged, and the reader maps them as today (GS-6) | the engine, through the reader |
| 4. Reader reasons | `GitHubErrorCodeSchema` (`src/shared/github.ts:34`) gains five; `src/engine/control.ts:108` and the collapse at `src/main/engine.ts:60-61` read the same enum | the engine and the model |
| 5. Bridge codes | no new members; `NOT_IMPLEMENTED`, `ENCRYPTION_UNAVAILABLE`, `NOT_FOUND`, `ENGINE_UNAVAILABLE`, else `INTERNAL_ERROR` | renderer (message only) |
| 6. Vault and store codes | `CREDENTIAL_CAPABILITY_DENIED` (6.4: re-grant once, or the account is gone, or the ref went stale); `ENCRYPTION_UNAVAILABLE` or `INVALID_SECRET` from `saveStaged` (the flow ends `failed`; a refresh is a persist failure, 6.5); any error decrypting the refresh token (a refresh hold, `failed()`, 6.5, GS-6); `ACCOUNT_STORE_FAILED` (`ReplaceFailure`, 4.3); `REDACTION_UNAVAILABLE` unchanged | nothing new |

| Outcome | Cause |
|---|---|
| `cancelled` | Cancel, dialog close or a new start before the commit point |
| `expired` | `expired_token` or `token_expired`; the local deadline; the poll bound (E-01 l.160) |
| `restart` | `incorrect_device_code` or `bad_verification_code` (E-01 l.163, l.269) |
| `denied` | `access_denied` |
| `disabled` | `device_flow_disabled`, at step 1 or on a poll |
| `client-rejected` | `incorrect_client_credentials`, at step 1 or on a poll |
| `grant-unsupported` | `unsupported_grant_type` |
| `email-unverified` | `unverified_user_email` (E-01 l.285) |
| `rate-limited` | step 1 rate-limited, or a poll's wait would pass the deadline (R2-4) |
| `start-failed` | any other step-1 failure (F-2) |
| `failed` | an unknown `error`; a poll answer that is unusable or malformed; more than 3 consecutive transient polls; storing failed with the previous account kept (6.3) |

A sign-out while pending records no outcome (6.7).

| Reason (layer 4) | New | `githubFailure` code | retry |
|---|---|---|---|
| `GITHUB_SIGN_IN_REQUIRED` | yes | `UNAUTHORIZED` (exists, `src/shared/errors.ts:4`) | never |
| `GITHUB_RENEWAL_UNAVAILABLE` | yes | `NETWORK_ERROR` | `same-request` |
| `GITHUB_PERMISSION_MISSING` | yes | `FORBIDDEN` | never |
| `GITHUB_FORBIDDEN_SIGNED_IN` | yes | `FORBIDDEN` | never |
| `GITHUB_NOT_FOUND_SIGNED_IN` | yes | `NOT_FOUND` | never |
| `GITHUB_NOT_FOUND`, `GITHUB_RATE_LIMIT`, `GITHUB_FORBIDDEN` | existing, text rewritten | unchanged | never |

Without the enum entries, `src/main/engine.ts:60-61` would collapse the new reasons to `GITHUB_UNAVAILABLE`, and `src/shared/github.ts:48` would turn an unknown reason into a generic `NETWORK_ERROR`. Two guards pin this (DC-7):
- **G-19** (U3, `tests/github-text.test.ts`): every member of `CREDENTIAL_ERRORS` and each of the five new reasons parses in the enum. It is proved red in U3 by removing a member from the enum.
- **The source scan** (U6, `tests/github-reason-scan.test.ts`, after U3 and U5 are integrated): every `throw new Error('GITHUB_…')` literal in `src/main/github*.ts` parses in the enum. Store errors are not `GITHUB_` codes (`ACCOUNT_STORE_FAILED`), so the scan has no exception list.

### 4. Storage

#### 4.1 The vault

- **Two entries per expiring account**, each holding one token exactly as received: the access token and the refresh token. A non-expiring account has one entry (F-4).
- **Never one JSON blob.** `vault.redact` matches whole decrypted values (`src/main/vault.ts:183-195`), so a blob of both tokens would leave neither redacted (S-2).
- **During a rotation** the vault briefly holds up to four entries.
- **Staged entries are redacted too.** Only tombstoned entries are skipped (`:186`), so a freshly received pair is covered from the moment it is staged.

#### 4.2 The account file

The file is `<userData>/github/account.json`. It is written with `atomicJson`, which creates its private directory (`src/models/artifact-files.ts:49-56`), and read with `boundedJson(file, 64 KiB)` (`:40`).

```ts
const SecretRef = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);   // as collector-settings.ts:8
const AccountFileSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  account: z.object({
    clientId: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),          // the app that issued the tokens (public)
    accessRef: SecretRef, refreshRef: SecretRef.nullable(),
    accessExpiresAt: DateTimeSchema.nullable(),                     // null = non-expiring token (F-4)
    refreshExpiresAt: DateTimeSchema.nullable(),
    obtainedAt: DateTimeSchema,                                     // local receipt time, for the clock-step rule (6.4)
    login: GitHubLoginSchema.nullable(),
  }).strict().refine(a => (a.refreshRef === null) === (a.refreshExpiresAt === null) && (a.accessExpiresAt !== null || a.refreshRef === null)).nullable(),
  retiredRefs: z.array(SecretRef).max(8),
  updatedAt: DateTimeSchema,
}).strict();
```

- **What it holds.** Refs, times, the client ID and the login only. Never a token, `device_code` or `user_code` (S-1).
- **At most 8 retired refs (DC-10).** Every writer keeps `retiredRefs` within the schema's bound. If a list would exceed 8, the writer first tombstones and removes the oldest refs beyond the newest 8. It tolerates `CREDENTIAL_NOT_TOMBSTONED`, swallows other errors, and writes only the newest 8. A ref dropped that way is already tombstoned, so the next reconcile deletes it even if its removal failed. The dropped refs are always from earlier rotations, never the live account.
- **Where the account lives.** Only in this file: never in the engine database, the engine Settings or a model profile (F-5).
- **Protected location.** It lives under userData, which project commands cannot touch (`protectedRoots: [data]`, `src/main/index.ts:70`).

#### 4.3 Write orders

**`replace(issued, receivedAt, kind, admit)`** runs under `serialized(file)` and is used for a sign-in (`kind: 'sign-in'`) and for a refresh (`kind: 'refresh'`). Its steps, in order:

1. If `!admit(live)`, return `null`; nothing has been staged.
2. Run `saveStaged(access)`, then `saveStaged(refresh)` if there is a refresh token. On failure, tombstone and remove whatever was staged, then throw `ReplaceFailure(false)`.
3. If `!admit(live)`, tombstone and remove the staged refs and return `null`.
4. Write the file with `atomicJson`. The write is `{ revision + 1, account: next, retiredRefs: [the refs the file names now, plus its retiredRefs] }`, capped at 8 as 4.2 says, and `next.clientId` is this build's client ID. For a sign-in, `next.login` is null and `next.signInId` is new. For a refresh, both are copied from `live`, read here under the lock, never from the caller's snapshot (GS-10). Keep the file's previous `account` and `retiredRefs` in memory for a sign-in's rollback (step 5). On failure, tombstone and remove the staged refs, then throw `ReplaceFailure(false)` (as `src/main/collector-settings.ts:68-69` does). **This write is the crash-recovery commit point.**
5. Run `commit(access)` and `commit(refresh)`. On failure, a refresh throws `ReplaceFailure(true)`. A sign-in rolls back here, still under the lock, so no writer queued on the lock (a refresh of the old account, say) runs between the failed commit and the rollback (DC-11, GS-3):
   - if `!admit(live)`, a sign-out has begun: write nothing and return `null`. The sign-out's clear removes what the file names;
   - otherwise write the file back to the `account` and `retiredRefs` kept at step 4 (`revision + 2`). If that write succeeds, tombstone and remove the new refs, tolerating errors, and throw `ReplaceFailure(false)`: the file names the previous account, and `live` was never changed;
   - if that write fails, the file still names the new pair, so the store follows the file: it continues with step 6. This is the one case where `live` may name a ref the vault still holds staged: a commit that failed because its persist failed has already marked the entry committed in memory, but one that failed earlier has not.
6. Check `admit(live)` synchronously:
   - if it passes, set `live = next`;
   - if it fails, return `null`. A clear has begun (sign-out or the app's clear). Its locked part runs next and removes every ref the file names.
7. Retire the old refs: for each, `tombstone`, then `remove`, tolerating `CREDENTIAL_NOT_TOMBSTONED` (`src/main/collector-settings.ts:83-87`). Then write the file again with `retiredRefs` holding only the refs whose tombstone or removal failed; a ref leaves the list only once its removal succeeded. Failures here are swallowed, because `open()` and the reconcile finish the job from that list (lead's final pass: writing `[]` after a failed removal could orphan a committed entry).
8. Return `next`.

The live account therefore points at committed refs only, except after a sign-in whose rollback write failed (step 5). `vault.grant` refuses staged refs, so a pointer to staged refs would make every concurrent read fail.

**`setLogin(signInId, login)`** runs under the lock. It writes the file with `login` (`revision + 1`) and sets `live` to the same account with that login, only while `live?.signInId === signInId`. A refresh that committed during F5 keeps the sign-in's `signInId`, so the login still lands; one that commits after `setLogin` copies the login (GS-10).

**`clear(admit)`** never throws, and its first part is synchronous:
- **Synchronous prologue.** If `!admit(live)`, return `'not-admitted'`. Otherwise set `live = null` and call `vault.tombstone` on the live refs, keeping the returned persist promises. Their synchronous part revokes the refs' grants (`src/main/vault.ts:164-169`).
- **Then, under the lock:**
  - **A newer sign-in won (DC-4).** If `live` is not null here, a sign-in was admitted after the prologue (6.3). Its step 4 already moved the refs the prologue took into `retiredRefs`, and its step 7 retires them, so the locked part writes and removes nothing and returns `'durable'`.
  - **Otherwise:**
    1. Tombstone every ref the file names (account and retiredRefs) that is not already tombstoned.
    2. Write `{ account: null, retiredRefs: [those refs] }`, capped at 8 as 4.2 says.
    3. `remove` each ref.
    4. Write `retiredRefs` holding only the refs whose `remove` failed (usually none), so the next start's `open()` tombstones them again and the reconcile deletes them (GS-11).
- **Durability (DC-6).** Disk errors are not thrown. The clear has reached disk if any of the prologue's tombstone persists, or the step-2 write, succeeded. Either is enough, because the next start then reads no committed account (4.4, 4.5). If neither succeeded, retry both once. If neither succeeds then either, return `'not-durable'`; otherwise return `'durable'`. `'durable'` does not mean the encrypted entries are gone: a `remove` can fail on its own (a Windows file lock stops the unlink, `src/main/vault.ts:172-180`), and the next start deletes that entry (GS-11). The tombstones stay in the vault's memory, so any later successful vault persist in this session records them.
- **Signing out with no live account.** `clear(() => true)` still proceeds when `live` is already null. It then removes a pair that a concurrent `replace` committed and named in the file.

#### 4.4 Startup (src/main/index.ts:181-184)

1. **`open()`** never throws.
   - A missing, invalid, oversized or extra-key file reads as no account.
   - It tombstones `retiredRefs`.
   - If the file's `account.clientId` differs from a **non-empty** configured client ID, it tombstones the account's refs, reads as no account, and sets `openedAppChanged()`. The service then starts in A2 with `ended: 'app-changed'` (DC-15). An account issued to another app is never sent to this app's token endpoint.
   - If the configured client ID is empty (not configured, D-7), it keeps the account. Its refs stay alive, reads take the signed-out path, and nothing is wiped.
2. **The reconcile set** becomes `[...engine references, ...collectorSettings.references(), ...githubStore.references()]`. The reconcile commits staged entries that are referenced, and deletes tombstoned entries and unreferenced staged entries (`src/main/vault.ts:106-121`).
3. **`finishStartup()`** never throws. It writes the file when any of these hold:
   - `retiredRefs` was not empty;
   - the account was dropped;
   - the file was invalid;
   - a live ref is no longer committed (`vault.has`), in which case it also sets `live = null`.

No network request is made at startup; a test counts zero fetcher calls (L-2).

#### 4.5 Crash windows (S-7)

| Crash after | Next start |
|---|---|
| staging, before the file write | the staged refs are unreferenced, so the reconcile deletes them; the previous account (or none) stands. For a refresh, the pair GitHub issued is lost and the stored pair is dead (E-02 l.36). The next call gets 401 or `bad_refresh_token`, the account is cleared, and the user signs in again. **Known limit** |
| the file write, before commit | the refs are referenced, so the reconcile commits them; signed in with the new pair |
| commit, before retiring | `open()` tombstones `retiredRefs`, the reconcile deletes them, and `finishStartup` rewrites the file |
| a sign-in's failed commit, before its rollback writes (4.3 step 5) | as "the file write, before commit": signed in with the new pair. If the rollback wrote, the previous account stands |
| sign-out's tombstones, before its file write | the reconcile deletes the tombstoned entries; `finishStartup` sees refs that are not committed and writes `account: null` |
| a sign-out none of whose writes reached disk (`'not-durable'`) | unless a later vault persist in that session recorded the tombstones, the previous account stands, and the user is signed in again. The sign-out said so (`signOutIncomplete`, 8.2) |
| an invalid or missing file | signed out; startup continues |

**Known limit.** If the account file is lost by hand, its committed entries stay in the vault. The reconcile never deletes committed entries (`src/main/vault.ts:106-121`). They stay encrypted and redacted.

### 5. The wire (src/main/github-oauth.ts)

#### 5.1 Exact requests

Every request in the table below, the login read included (GS-8), uses:
- `redirect: 'manual'`, `credentials: 'omit'` and `cache: 'no-store'`. A 3xx is never followed, so the access token never reaches a `Location` host (S-4);
- the signal `AbortSignal.any([owner, AbortSignal.timeout(requestTimeoutMs)])`;
- a body read bounded at 64 KiB, checked against the declared `content-length` and while streaming. The body is always cancelled or released.

No request sends cookies, `client_secret` or `repository_id`.

| Purpose | Request | Headers | Parameters |
|---|---|---|---|
| Step 1 (E-01 l.118-120; E-21 l.300-304) | `POST DEVICE_CODE_URL` | `Accept: application/json`, `Content-Type: application/x-www-form-urlencoded`, `User-Agent: MoonAliza-github-sign-in` | `client_id`, plus `scope=offline_access` while `REQUEST_OFFLINE_ACCESS` (3.1) |
| Poll (E-01 l.138-146; E-21 l.315-322) | `POST TOKEN_URL` | same | `client_id`, `device_code`, `grant_type=urn:ietf:params:oauth:grant-type:device_code` |
| Refresh (E-02 l.72-79) | `POST TOKEN_URL` | same | `client_id`, `grant_type=refresh_token`, `refresh_token` |
| Login (E-20 l.34-39) | `GET USER_URL` | `Accept: application/vnd.github+json` (as E-21 l.582), `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: MoonAliza-github-sign-in`, `Authorization: Bearer <access>` | none |

- **`Accept: application/json`** on the three OAuth requests is what GitHub's own device-flow tutorial sends to both github.com endpoints (E-21 l.302, l.321). The OAuth-app page sends the same (prior E-01 l.200-221, l.266-277).
- **`Content-Type`.** E-21's code sets none and hands the form-encoded string to Ruby's `Net::HTTP.post`. That this is sent as an `application/x-www-form-urlencoded` body is Ruby's standard library, not stated on the page (an inference, E-21). MoonAliza sets that header explicitly.
- **Responses.** E-21 parses each response as JSON (l.277-285), but no page states the `Content-Type`, so responses are still parsed by their `Content-Type` (5.3, F-3, DO-3).

#### 5.2 Parameter placement (OF-1, resolved by E-21)

E-01 l.118 and l.138, and E-02 l.72, call the inputs "query parameters". But E-01 l.122 and l.167 use the same words for response fields, so the reference pages do not settle where the inputs go. GitHub's own tutorial does, for the device flow (E-21, collected in round 4 for OF-1). Its step 1 form-encodes `client_id` with `URI.encode_www_form` and posts it with `Accept: application/json` to a URL with no query string (E-21 l.300-304). Its poll does the same with `client_id`, `device_code` and `grant_type` (l.315-322).

**Decision: a form-encoded body**, with no query on the URL, for all three requests.
- **Step 1 and the poll** follow GitHub's working example (E-21). `scope` is not in that example (its step 1 sends only `client_id`), so it goes where `client_id` goes. That placement is an inference, and it matters only if the registration turns expiry off: while expiry is on, an app's user tokens expire and come with a refresh token without the scope (E-02 l.34).
- **The refresh** is not in E-21 (the tutorial makes no refresh request). It goes to the poll's endpoint (E-01 l.132, E-02 l.72), so it is sent the same way. That is an inference, checked by DO-1's two refreshes, with DO-2 for reading a failure (U-4).
- **Why a body anyway.** A refresh token or `device_code` in a URL would be visible to anything that records URLs. A body is not.
- **One placement point.** Only `oauthRequest` knows where parameters go.
- **Tests.** The fake accepts both placements and records which one arrived. A test pins the body placement and asserts that no OAuth URL has a query string.
- **No runtime fallback between placements.** A refresh token is single-use (E-02 l.36), so sending it in a second form could burn it.
- **If DO-1 or DO-2 shows that a refresh needs the query form,** the change stays inside `oauthRequest`, and the spec then records the URL exposure.

#### 5.3 One classifier for every OAuth response

Step 1, the poll and the refresh all use one classifier, applied in this order:

| Order | Condition | Result |
|---|---|---|
| 1 | the fetch threw, or the timeout fired | transient |
| 2 | 3xx (never followed) | step 1: `failed`; token: `unusable` with its status |
| 3 | 429; a 403 with `x-ratelimit-remaining: 0`; a 403 or 429 with `retry-after` (E-15 l.32-38, applied as a precaution, R2-4) | `rate-limited` with the wait from 5.4 |
| 4 | body over 64 KiB, or not parseable by its media type (compared case-insensitively before `;`): `application/json` as JSON; `application/x-www-form-urlencoded` or `text/plain` with `URLSearchParams`; any other type is unparseable; the result must be a flat object of strings and numbers | transient (step 1: `failed`) |
| 5 | the body has a string `error`, **at any HTTP status** (E-01 l.152; refresh-error status not stated, E-01 l.275, R2-5) | `error`, with the code bounded to `^[a-z_]{1,64}$` (otherwise `unknown`) and an optional integer `interval` |
| 6 | 2xx | the shape check (5.5) |
| 7 | 5xx | transient |
| 8 | any other non-2xx | step 1: `failed`; token: `unusable` with its status |

`error_description`, `error_uri` and every other field are dropped unread: never stored, returned, shown or opened.

A parse failure (row 4) is caught and replaced, with no `cause`. A JSON `SyntaxError` message quotes part of the body, and a token answer's body holds tokens (DC-9).

#### 5.4 The rate-limit wait

`rateLimitWait(response, now)` returns `null` unless the condition in row 3 holds. When it does, the wait is the first of these that applies:

1. `retry-after`, if it is an integer from 0 to 3,600: that many seconds.
2. If `x-ratelimit-remaining` is `'0'` and `x-ratelimit-reset` is a valid epoch less than an hour away: `max(rateLimitFloorMs, reset × 1000 − now)`.
3. Otherwise, `rateLimitFloorMs` (60 s).

The result is clamped to at least 1 s and at most `rateLimitCeilingMs`, so `retry-after: 0` still waits (DC-12). Callers add their own floors: a poll waits at least `interval` (6.2), and a refresh hold lasts at least `transientHoldMs` (6.5).

- **Clock skew.** `x-ratelimit-reset` is GitHub's absolute time, so the 60 s floor and the one-hour bound absorb local clock skew.
- **Ignored header.** `X-Accepted-GitHub-Permissions` is never read here.

#### 5.5 Shape checks

**Step 1 answer:**
- `verification_uri` must equal `DEVICE_PAGE_URL` **exactly**; any other value fails closed (F-2).
- `device_code` must match `^[\x21-\x7E]{1,1024}$`. No length is assumed; E-01 l.128 says 40.
- `user_code` must match `GitHubUserCodeSchema`.
- `expires_in` must be an integer of at least 1. The deadline is `receivedAt + min(expires_in × 1000, maxCodeLifetimeMs)`.
- `interval`, when present, must be an integer from 1 to 300. When absent it defaults to 5 (E-01 l.132).

**Token answer (F-4, E-10):**
- **Access token:** `access_token` must satisfy `headerSafeToken(·, 'ghu_')`.
- **What `headerSafeToken` checks:**
  - the value is a string longer than its prefix and at most 16,384 characters, which keeps it within the vault's 32 KiB bound;
  - every character is in `[\x21-\x7E\xA1-\xFF]`. That refuses control characters, whitespace and anything a header value cannot carry.
  - No other length or character set is assumed (E-10 l.145).
- **With `expires_in`:** it must be an integer of at least 1. `refresh_token` must then satisfy `headerSafeToken(·, 'ghr_')`, and `refresh_token_expires_in` must be an integer of at least 1. A form body's integers match `^\d{1,10}$`.
- **Without `expires_in`:** the token is non-expiring. It is stored with no expiry and no refresh token, any `refresh_token` is ignored, and it is never refreshed (E-01 l.173-178).
- **When the result is `malformed`:** `access_token` is present but a check fails.
- **When the result is `unusable`:** `access_token` is absent.

### 6. Sequences

#### 6.1 Start and step 1 (F-2)

1. If not configured, throw `NOT_IMPLEMENTED`. If `!encryptionAvailable()`, throw `ENCRYPTION_UNAVAILABLE`. Both checks happen before any request.
2. If `closing`, or the current flow has reached its commit point (F4 or F5), return `status()`. A confirmed sign-in finishes first (DC-5).
3. Abort a current flow, with no outcome recorded. Clear `lastOutcome`, `endedReason` and `signOutIncomplete`. Create `flow = { controller, attempt }` (F1).
4. Send `requestDeviceCode(fetcher, clientId, config.offlineAccess ?? REQUEST_OFFLINE_ACCESS, …)` and map the result (GS-5):
   - `code` moves to F2;
   - `rate-limited` ends the flow with `rate-limited`;
   - `error` with `device_flow_disabled` ends it with `disabled`;
   - `error` with `incorrect_client_credentials` ends it with `client-rejected`;
   - anything else ends it with `start-failed`.
5. If the flow is no longer current (cancelled or replaced), discard the answer.
6. Otherwise run the poll loop detached (`void this.poll(flow)`), and return `status()`, which is `pending`.

A status read, a renderer reload or a remount never calls `start` (F-2).

#### 6.2 Poll loop (F-3)

```
interval = intervalS*1000; nextWait = interval; transient = 0; polls = 0; maxPolls = ceil(lifetimeS / intervalS) + 2
loop:
  await sleep(nextWait, flow.signal); if flow.signal.aborted -> return                 // the first poll waits `interval` (E-01 l.132)
  if now() >= deadline or polls >= maxPolls -> end('expired')                          // after every wake: timers drift across sleep (Map)
  polls++; r = await requestToken(fetcher, { client_id, device_code, grant_type }, flow.signal)
  if flow.signal.aborted -> return                                                      // an answer after Cancel is discarded (F-10)
  nextWait = interval
  rate-limited(w): if now() + w >= deadline -> end('rate-limited') else nextWait = max(w, interval)      // R2-4
  error authorization_pending -> transient = 0; continue
  error slow_down -> interval = max(interval + 5000, bodyInterval*1000 when valid); nextWait = interval   // E-01 l.132, l.157
  error expired_token | token_expired -> end('expired');  incorrect_device_code | bad_verification_code -> end('restart')
  error access_denied -> 'denied';  device_flow_disabled -> 'disabled';  incorrect_client_credentials -> 'client-rejected'
  error unsupported_grant_type -> 'grant-unsupported';  unverified_user_email -> 'email-unverified';  any other -> 'failed'
  malformed | unusable -> end('failed')                                                  // nothing stored (F-4)
  transient -> if ++transient > maxTransientPolls end('failed') else continue            // network, 5xx, timeout, unparseable
  tokens -> F4 (6.3)
```

- Every path waits at least `interval` before the next poll.
- `device_code` is dropped when the flow ends (L-7).

#### 6.3 Commit point and login (F-4, F-5)

1. **The admit (DC-4).** At F4 entry, take `s0 = signOuts`, the count that `signOut()` increments synchronously (6.7). Run `store.replace(tokens, receivedAt, 'sign-in', () => signOuts === s0)`.
   - Only a user sign-out refuses the commit. Generation changes do not: a refresh that commits while `replace` waits for the lock is retired by step 7 of `replace`, and an app clear of the old account during "Sign in again" leaves the new account alone (4.3).
   - Quit does not interrupt F4. If the process exits mid-`replace`, 4.5's crash windows apply.
   - **Result `null`:** a sign-out won, before the file write or during a failed commit's rollback. Nothing is stored, or the sign-out's clear removes what was stored, and no outcome is recorded (6.7).
   - **Throws `ReplaceFailure(false)`:** the outcome is `failed`. The file names the previous account (or none): it was never written, or a failed commit was rolled back under the same lock (4.3 step 5, DC-11, GS-3). The previous account is untouched (F-10).
   - **Returns an account after a failed commit (DC-11):** the rollback write failed too, so the file still names the new pair, the store has made it live, and the next start signs in with it (4.5). The commit point is treated as reached: continue with step 2 below, with no outcome. Until the next start, a read on a ref the vault still holds staged is refused a grant. It fails as `GITHUB_RENEWAL_UNAVAILABLE` (6.4, `withAccess` step 4), and the account is kept.
2. On success:
   - generation++;
   - abort and replace `accountChanged`;
   - clear the hold, `failures`, `sameError`, `freshRejects` and `endedReason`.

   The old refs were retired inside `replace` (this is "Sign in again", F-10).
3. F5 reads the login. Under a `github:user:<uuid>` grant on the **new** access ref, inside `withSecret`, it runs `fetchLogin(fetcher, 'Bearer ' + token, AbortSignal.any([flow.signal, timeout]))`.
   - This read is one-shot and outside the 401 rule: no refresh, no retry, no clear (C-5).
   - A grant denied by an engine restart is re-granted once.
   - On success, run `store.setLogin(signInId, login)` with the committed account's `signInId`, so a refresh that commits during F5 does not lose the login (GS-10).
   - Any failure leaves `login: null`, and the sign-in stays (F-4, U-15).
4. The flow ends with no outcome, and the state projects as `signed-in`.

#### 6.4 `send()`: pre-check, sending and the 401 rule (F-6, F-8, F-13)

```
send(request, signal):
  if !configured or !store.current() -> return { response: await request(undefined), authenticated: false }   // L-10, D-7
  budget = { refreshed: false, retried: false, fresh: 0 }
  acct = await usable(store.current(), signal, budget)
  loop:
    sent = await withAccess(acct, request)                       // 'stale' | Response
    if sent === 'stale' -> acct = await usable(store.current() ?? throw SIGN_IN_REQUIRED, signal, budget); continue
    if sent.status !== 401 -> freshRejects = 0; return { response: sent, authenticated: true }   // the token was accepted (GS-1)
    await sent.body?.cancel().catch(() => {})
    if now() - acct.obtainedAt < freshTokenMs and budget.fresh < 2:                         // DC-2: a just-issued token, until DO-16
      acct = await pause(freshRetryMs * 2 ** budget.fresh++, acct, signal); continue        // the same token again: 1 s, then 2 s
    cur = store.current(); if !cur -> throw SIGN_IN_REQUIRED
    if cur.accessRef !== acct.accessRef and !budget.retried -> budget.retried = true; acct = cur; continue   // rotated meanwhile: no refresh (E-02 l.36)
    if now() - acct.obtainedAt < transientHoldMs -> freshRejected(acct)                    // GS-1: no refresh, no clear at once; always throws
    if budget.retried -> clearIf(acct.accessRef); throw SIGN_IN_REQUIRED                    // the retried call still got 401
    if acct.accessExpiresAt === null or budget.refreshed or !refreshValid(acct) -> clearIf(acct.accessRef); throw SIGN_IN_REQUIRED   // non-expiring 401; C-6
    if holdActive() -> throw hold.reason                                                    // L-13; the account is kept
    budget.refreshed = true; budget.retried = true
    acct = await waitRefresh(acct, signal)
```

**`usable(acct, signal, budget)`**, with `t = now()`:
1. If `acct.accessExpiresAt === null` (non-expiring), use the token.
2. Compute `skewed = t < acct.obtainedAt - clockSkewMs`, meaning the local clock stepped back by more than 300 s.
3. If `!skewed && acct.accessExpiresAt - t > refreshMarginMs`, use the token.
4. A refresh is due. If `acct.refreshRef !== null && (acct.refreshExpiresAt > t || skewed)` and no hold is active, set `budget.refreshed = true` and `return waitRefresh(acct, signal)`.
5. Otherwise, if `acct.accessExpiresAt > t`, use the token. It is still valid, though under the margin: a hold is active, so no refresh is possible now and L-5 allows it (GS-4), or its refresh token has expired.
6. Otherwise, if step 4's refresh was due but a hold is active, throw `hold.reason` and send nothing (L-13). The account is kept.
7. Otherwise run `clearIf(acct.accessRef)` and throw `GITHUB_SIGN_IN_REQUIRED`. **No request** is sent (F-6).

**`waitRefresh(acct, signal)`** is `race(refreshSingleFlight(acct), signal, accountChanged.signal)`.
- If `accountChanged` aborts, re-read `store.current()`. If there is none, throw `GITHUB_SIGN_IN_REQUIRED`; otherwise continue with the new account. `budget.refreshed` stays true, so a call never makes two refreshes.
- The shared promise has a no-op `catch` attached, so an abandoned refresh never raises an unhandled rejection.

**The fresh-token guard (DC-2).** No captured page says when a just-issued user token is accepted, and DO-1 never uses one at once. Until day-one check DO-16 shows that GitHub accepts a new token at once, a 401 on a token under `freshTokenMs` (5 s) old is not read as a dead token. Instead:
- **`pause(ms, acct, signal)`** races `sleep(ms)` against the read's signal and `accountChanged`, like `waitRefresh`. It returns `acct`, or the current account if `accountChanged` aborted (none: `GITHUB_SIGN_IN_REQUIRED`).
- **The resends** (the code above) are neither a refresh nor the 401 rule's retry, so the C-6 budget is unchanged, and they stay inside the read's 20 s deadline.
- **Why:** a routine refresh followed at once by its retry would otherwise wipe a valid, just-rotated pair if GitHub accepts new tokens with a delay. A lead outside the corpus points that way: GitHub's `@octokit/auth-app` retries 401s on installation tokens under 5 s old.
- **When the resends run out, and up to 30 s (GS-1).** A 401 on a token under `transientHoldMs` (30 s) old never starts a refresh and never clears the account at once. A token rotated meanwhile is still retried first with the current one: the rotation check now comes before it, once per call. Without this, every read more than 5 s later would refresh again, and each successful refresh would reset the hold, so a token GitHub refuses at once would cost one refresh per read and never reach "sign in again".

  ```
  freshRejected(acct):                       // GS-1; always throws
    if holdActive() -> throw hold.reason     // counted once per hold; the account is kept
    if ++freshRejects >= maxSameRefreshError -> clearIf(acct.accessRef); throw SIGN_IN_REQUIRED   // the third in a row
    failed()                                 // the doubling hold of 6.5; throws RENEWAL_UNAVAILABLE
  ```

  `freshRejects` survives the refreshes in between, because each refused token comes from one. It is reset only by a request whose token is answered other than 401, a sign-in commit or a sign-out.

**`withAccess(acct, request)`**:
1. Bind `{ epoch: deps.epoch(), purpose: 'github', contextId: 'github:read:' + randomUUID(), secretRef: acct.accessRef }`.
2. Take a grant with `expiresAt: Date.now() + grantMs`. Run `vault.withSecret(grant, binding, token => request('Bearer ' + token))`. The `request` callback invokes its fetcher synchronously, as its first statement (L-7).
3. In `finally`, run `revokeContext(contextId)`.
4. On `CREDENTIAL_CAPABILITY_DENIED`:
   - if the account is gone (signed out), throw `GITHUB_SIGN_IN_REQUIRED`; nothing was sent (F-11);
   - if `acct.accessRef` is no longer current, return `'stale'`; no budget is spent;
   - otherwise an engine restart cleared the grants (`src/main/index.ts:178`): take one new grant with the current epoch. If that is denied too, throw `GITHUB_RENEWAL_UNAVAILABLE`. **Never a sign-out** (F-7(c)).
5. Other errors pass through unchanged (3.4, GS-6): the request's own rejection, `ENCRYPTION_UNAVAILABLE`, or a missing or undecryptable entry. The reader maps them to `GITHUB_UNAVAILABLE` (or `RUN_CANCELLED` and `GITHUB_TIMEOUT` for an abort), as today (`src/main/github.ts:79-81`).

**`clearIf(ref, reason = 'sign-in-ended')`** is `store.clear(live => live?.accessRef === ref)`. When the clear is admitted, it also does generation++, sets `endedReason = reason`, and aborts `accountChanged`. It never removes a newer sign-in (4.3).

The access token goes only in the `Authorization` header, and only to the constructed `https://api.github.com` URL. Because `redirect: 'manual'` is set, a 3xx is never followed with it (S-4).

#### 6.5 Refresh: single flight and holds (F-6, F-7, F-9)

```
refreshSingleFlight(from):
  if inflight?.from === from.accessRef -> return inflight.promise                   // join (L-1)
  cur = store.current(); if !cur -> throw SIGN_IN_REQUIRED
  if cur.accessRef !== from.accessRef -> return cur                                  // already rotated
  if closing -> throw RENEWAL_UNAVAILABLE
  inflight = { from: from.accessRef, promise: renew(from) }                          // cleared only after persist has settled
renew(from):
  g0 = generation; timeout = AbortSignal.timeout(requestTimeoutMs)                   // its own signal (L-3)
  r = await withRefresh(from.refreshRef, token => requestToken(fetcher, { client_id, grant_type: 'refresh_token', refresh_token: token }, timeout))
       // a github:refresh:<uuid> grant; DENIED: account gone -> SIGN_IN_REQUIRED; rotated -> return current; else re-grant once; twice -> failed()
       // any other local error (ENCRYPTION_UNAVAILABLE, a missing or undecryptable entry) -> failed(): nothing was sent, but it holds (GS-6)
  if r is not error and not unusable -> sameError = null                             // only consecutive identical answers count
  rate-limited(w)          -> hold = { until: now() + max(w, transientHoldMs), reason: 'GITHUB_RATE_LIMIT' }; throw GITHUB_RATE_LIMIT   // R2-4, DC-12; vault kept
  error 'bad_refresh_token' | 'unsupported_grant_type' -> clearIf(from.accessRef) if generation === g0; throw SIGN_IN_REQUIRED       // any status (F-7(a), R2-5, DC-1)
  error 'incorrect_client_credentials' -> clearIf(from.accessRef, 'client-rejected') if generation === g0; throw SIGN_IN_REQUIRED   // E-01 l.256; DC-1
  error c (any other)      -> sameOrFail(c, from, g0)                               // DC-1
  unusable(s), s is 3xx    -> failed()                                              // a captive portal or proxy answers this way, not GitHub refusing (GS-2)
  unusable(s)              -> sameOrFail('status:' + s, from, g0)                   // a 4xx with another body, or a 2xx without access_token (GS-2)
  transient                -> failed()                                              // F-7(b); vault byte-identical
  malformed                -> clearIf(from.accessRef); throw SIGN_IN_REQUIRED       // inference from E-02 l.36: GitHub issued a pair, so the old one is dead
  tokens -> try next = await store.replace(tokens, receivedAt, 'refresh', live => generation === g0 && live?.accessRef === from.accessRef)   // login copied under the lock (GS-10)
            catch ReplaceFailure -> clearIf(from.accessRef); throw SIGN_IN_REQUIRED  // X-9: the old pair is dead, so never keep it
            if next === null -> return store.current() ?? throw SIGN_IN_REQUIRED     // sign-out or a new sign-in won
            generation++; hold = null; failures = 0; return next                      // persisted before any caller uses it (L-4); freshRejects is kept (GS-1)
sameOrFail(key, from, g0):                                                            // the same answer maxSameRefreshError times in a row clears (DC-1, GS-2)
  sameError = { key, count: sameError?.key === key ? sameError.count + 1 : 1 }
  if sameError.count >= maxSameRefreshError -> clearIf(from.accessRef) if generation === g0; throw SIGN_IN_REQUIRED
  failed()
failed():                                                                             // a refresh failure that keeps the account
  failures++; hold = { until: now() + min(transientHoldMs * 2 ** (failures - 1), rateLimitCeilingMs), reason: 'GITHUB_RENEWAL_UNAVAILABLE' }
  throw RENEWAL_UNAVAILABLE                                                           // 30 s, 60 s, 120 s, ... at most 1 h (DC-1)
```

- **The request.** `POST TOKEN_URL` with `client_id`, `grant_type=refresh_token` and `refresh_token`, and **no client secret**. E-02 l.79 exempts tokens "generated using the device flow". Whether a token produced by a refresh still counts is DO-1.
- **Why the error codes are classified (DC-1).** A refresh must never repeat forever against an answer that will not change. `incorrect_client_credentials` is GitHub's answer for a wrong or missing client secret (E-01 l.256), so it is the likely answer to the second secretless refresh if DO-1 fails, and to a suspended or deleted app. It ends the account as `client-rejected`, so the dialog can say GitHub refused the renewal. The cases are listed once, in L-12.
- **Why `unusable` counts, except a 3xx (GS-2).** A 4xx whose parseable body has no `error` (GitHub's JSON `message` form) or a 2xx without `access_token` would otherwise hold a dead account, with doubling holds, until the refresh token expires up to six months later. A 3xx at the token endpoint is the signature of a captive portal or a proxy, the case the critic itself called too aggressive to clear, so it holds like a transient failure. So does an unparseable body, an HTML page included: the classifier makes it `transient` (5.3 row 4), not `unusable`.
- **When refreshes happen.** Never at startup and never on a timer. A refresh runs only from `usable()` or from the 401 rule, so at most once per expiry window, plus once per hold period while failing. Never once per request: a 401 on a token under `transientHoldMs` old never starts one (GS-1).
- **Clearing the hold.** A hold, `failures` and `sameError` are cleared by a successful refresh, a sign-in commit, or a sign-out. `freshRejects` is cleared by a request whose token is answered other than 401, a sign-in commit, or a sign-out (GS-1).
- **Why the hold exists.** E-15 l.36 says not to retry until `retry-after` has passed. The page also warns that continuing while limited may get the integration banned, and one app serves every MoonAliza user (U-16).

#### 6.6 Cancel, Sign in again, dialog close (F-10)

- **Cancel** (F1..F3). Abort `flow.controller`, which stops the sleep and any poll in flight. Then set `flow = null` and the outcome `cancelled`. Nothing further is sent or stored.
  - An answer that arrives after Cancel is discarded.
- **From the commit point (F4, F5), Cancel is a no-op (DC-5).** It aborts nothing and records no outcome. The commit stands, and the login read finishes, so a user who approved on GitHub and then closed the dialog still gets the login. Only `signOut()` and quit abort F5 (2.5). A new `start()` is also a no-op until F5 ends (6.1).
- **Sign in again** while signed in. `start()` leaves the account untouched, and reads keep using it during the flow. On success, `replace` retires the old refs. On cancel or failure, the account is untouched (6.3).
- **Dialog close.** While the status is `pending` with `committed: false`, closing the GitHub dialog calls `github.signIn.cancel`, so an unconfirmed flow exists only while its dialog is open. The pending text says so (8.2). Once `committed` is true, the dialog neither shows that text nor calls cancel on close. Main's no-op covers a close that races the commit.
- **Renderer reload.** A reload is not a user action and cancels nothing (F-2). The flow then runs unseen until its code expires: at most `maxCodeLifetimeMs`, and at most `maxPolls` polls. Reopening the dialog shows it pending, and closing the dialog then cancels it. **Known limit.**

#### 6.7 Sign-out (F-11)

The synchronous part runs before any await:
1. generation++ and `signOuts`++.
2. Abort the flow at any stage, F4 and F5 included, with `lastOutcome` left null.
3. `hold = null`, `failures = 0`, `sameError = null`, `freshRejects = 0`, `endedReason = null`.
4. Abort and replace `accountChanged`, so waiters leave at once.
5. Run `store.clear(() => true)`. Its prologue sets the live account to null and tombstones both refs, which revokes their grants (`src/main/vault.ts:164-169`).

From this point:
- a read that has not yet decrypted fails as `GITHUB_SIGN_IN_REQUIRED` and **sends nothing**;
- `send()` sees no account;
- a refresh that answers later fails its admit and stores nothing;
- a sign-in in F4 fails its admit (6.3), and the clear's locked part removes whatever it stored (4.3).

Then `signOut()` awaits the clear (4.3) and sets `signOutIncomplete` to whether it returned `'not-durable'` (DC-6). It returns `status()`. Disk errors are never thrown.
- **The usual case (`'durable'`).** The tombstones or the file write reached disk. The dialog says MoonAliza stopped using the sign-in and deletes its copy now, or at the next start if a file cannot be deleted at once (8.2, GS-11).
- **Neither reached disk, even after the retry.** The dialog says so instead, because the next start may read the old account again (4.5). In this session the tokens are tombstoned, so nothing uses them.

**No network request is made:**
- not `DELETE /applications/{client_id}/token` or `/grant`, because both need the client secret (E-08);
- not `POST /credentials/revoke`, because it is meant for credentials the caller does not own and notifies the owner (E-11).

The renderer shows the help text in section 8.2.

**Known limit (R2-10).** Once tombstoned, the token values are no longer redacted (`src/main/vault.ts:186`), yet they stay valid on GitHub for up to 8 hours (access) and 6 months (refresh). No copy outlives its entry (L-7). The values could reappear in MoonAliza only from outside it.

#### 6.8 Lifecycle events

| Event | Device flow | Refresh in flight | Read waiting or sending |
|---|---|---|---|
| Stop (`run.cancel`, `src/main/index.ts:202`; terminal event, `:156`) | unaffected | continues and persists (L-3) | `RUN_CANCELLED` (`src/main/github.ts:79`); late results are discarded as today (`src/main/index.ts:121`) |
| The read's 20 s deadline (`src/main/github.ts:38`) | n/a | continues; the next read uses the new pair without refreshing | `GITHUB_TIMEOUT` |
| Policy change or trust revocation (`src/main/index.ts:205`, `:211`) | unaffected | continues | `RUN_CANCELLED` |
| Engine restart (`src/main/index.ts:178`; `src/main/engine.ts:37-38`, `:92`) | unaffected, since it needs no grant; `GET /user` re-grants once | unaffected once sent; a grant cleared before use is re-taken once (F-7(c)) | runs are aborted by `restarted`: `RUN_CANCELLED` |
| Sign-out | aborted at any stage; nothing stored, or the clear removes it (6.3) | its result is discarded (admit) | `GITHUB_SIGN_IN_REQUIRED`; nothing is sent after `signOut()` resolves |
| `before-quit` (`src/main/index.ts:324-336`) | aborted **synchronously** by `close()`'s first statement. Before F4, a code approved on GitHub is not stored; it stays authorized on GitHub, unused. A commit already in F4 is not interrupted (6.3) | `close()` waits for it, bounded by `quitWaitMs` (25 s: the 20 s timeout plus a local persist), in parallel with the existing closes | runs are aborted (`:327`) |
| Window close | `window-all-closed` leads to `app.quit` (`:323`), then the quit row | as quit | as quit |
| Dialog close | cancelled before the commit point; a no-op from it (6.6) | unaffected | unaffected |
| Renderer reload | unaffected (6.6) | unaffected | unaffected |
| System sleep | the timer fires late; the deadline check ends the flow `expired` with no poll | the timeout fires: renewal unavailable, vault kept. If GitHub had processed the request, the pair is dead, and the next call clears the account (S-7) | n/a |
| Clock steps forward | may end the flow early; GitHub's `expired_token` is authoritative anyway | an early refresh, which is harmless; a jump past the refresh expiry clears the account with no request (fails closed) | n/a |
| Clock steps back more than 300 s | the poll bound ends the flow | the skew rule refreshes before use (6.4) | an expired token may still reach GitHub: a 401 (what GitHub's tutorial expects for an expired or revoked token on `GET /user`, E-21 l.592) goes through the 401 rule; a 404 (plausible by analogy, E-15 l.75) shows the signed-in 404 text, which ends with "sign in again". **Known limit**, DO-5 |

### 7. read_github (src/main/github.ts, src/shared/github.ts, src/engine/application.ts)

#### 7.1 The request seam

```ts
constructor(private readonly fetcher: Fetcher = fetch, private readonly credential: GitHubCredential = SIGNED_OUT,
            private readonly redact?: (text: string) => Promise<string>) {}
private async request(route: string, signal: AbortSignal): Promise<unknown> {
  if (signal.aborted) throw new Error('RUN_CANCELLED');
  const url = `https://api.github.com${route}`;
  const init: RequestInit = { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', signal,
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'MoonAliza-public-repository-reader' } };  // today's literal (:15-16), unchanged
  const { response, authenticated } = await this.credential.send(authorization => this.fetcher(url, authorization === undefined ? init
    : { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: authorization } }), signal);
  // classification, 7.2
}
```

- **Signed out.** The fetcher gets the same URL and the **same init object** as today (L-10). `tests/github-read.test.ts:10-25` and `e2e/github-reading.spec.ts:36` stay unchanged and green.
- **Signed in.** The init is the signed-out init plus `Authorization` only. The User-Agent `MoonAliza-public-repository-reader` is kept (C-4); it is slightly inaccurate for a signed-in read, and that is recorded as a known limit.
- **Existing tests.** Tests that construct `new GitHubReader(fake)` keep working.
- **Construction sites.**
  - The admit site (`src/main/index.ts:193`) builds `new GitHubReader(undefined, githubSignIn, text => vault.redact(text))`.
  - The review site (`:293`) stays `new GitHubReader()`. Review runs never get `read_github` (`src/engine/application.ts:368-372`), so their reader carries no credential (least privilege).
- **No fallback.** There is no unauthenticated fallback: `send()` throws its `CREDENTIAL_ERRORS`, and the reader never repeats the request without the token (F-13).
- **Errors from `send()`.** Its `GITHUB_*` errors pass through the existing catch (`src/main/github.ts:80`). Stop and the deadline map as today (`:79`). Anything else it passes on unchanged, such as a fetch failure or `ENCRYPTION_UNAVAILABLE`, becomes `GITHUB_UNAVAILABLE` (`:81`), as today (3.4, GS-6).

#### 7.2 Classification order

This keeps today's order (`src/main/github.ts:19-23`):

1. **3xx** gives `GITHUB_REDIRECT`. It is never followed, so the token is never sent on.
2. **404** gives `authenticated ? GITHUB_NOT_FOUND_SIGNED_IN : GITHUB_NOT_FOUND`. A 404 is never a 403 or a 429, so checking it before rate limits is equivalent to F-14's order.
3. **A rate limit** gives `GITHUB_RATE_LIMIT`, as at `:21` today: a 429, a 403 with `x-ratelimit-remaining: 0`, or a 403 with `retry-after`. This holds even when `X-Accepted-GitHub-Permissions` is present.
4. **An authenticated 403.** Read at most 64 KiB of the body as non-fatal UTF-8, never echoed, and release it. If it contains `Resource not accessible by integration` (E-15 l.108), the reason is `GITHUB_PERMISSION_MISSING`. Otherwise it is `GITHUB_FORBIDDEN_SIGNED_IN`. `X-Accepted-GitHub-Permissions` is a hint only and is never the test (E-04 l.77, E-15 l.110).
5. **A signed-out 401 or 403** gives `GITHUB_FORBIDDEN`, as today, with no body read. An authenticated 401 never reaches the reader, because `send()` handles it.
6. **Any other non-OK status** gives `GITHUB_UNAVAILABLE`. The existing body bounds follow (`:24-31`).

The scope check (`:36`), the sensitive-path check (`:37`), the bounds (`:5-6`, `:59`, `:72`), the commit pin and the 20 s deadline are unchanged. `readGitHub` (`src/main/index.ts:110-123`) is not changed, and it still returns `vault.redact(result)` (`:122`).

#### 7.3 Pre-redaction before the cut (S-2)

When `redact` is given, the reader redacts the decoded file text **before** slicing to 200 lines and 16,000 characters (`src/main/github.ts:71-72`). A vault secret that straddles the cut can then no longer leave as a prefix that exact-value redaction cannot match. The research document reader already keeps this invariant for its 262,144-byte cut (AGENTS.md invariant row).

- The final `vault.redact` at `src/main/index.ts:122` stays.
- `REDACTION_UNAVAILABLE` inside the reader becomes `GITHUB_UNAVAILABLE`, the same outcome as today, where `src/main/engine.ts:60-61` collapses it.
- Tokens contain no newline, so line counts are unchanged.

#### 7.4 Reason texts (src/shared/github.ts:35-49)

These are model-facing and static.
- Each text is at most 2,048 characters (`src/shared/errors.ts:21`) and is pinned by a test.
- No text names a status other than the one that occurred, or a value the model cannot see (headers, times).
- No text contains a URL. Chat links are not opened, so the install path is the dialog's button.

| Reason | Text |
|---|---|
| `GITHUB_NOT_FOUND` (signed out) | "GitHub returned 404 to this read, which was made without a GitHub sign-in. The repository, ref or path may not exist, or the repository may be private. MoonAliza reads private repositories only after the user signs in to GitHub in MoonAliza (the GitHub button in the sidebar) and installs MoonAliza's GitHub App on them. Never ask the user to paste a token into chat." |
| `GITHUB_NOT_FOUND_SIGNED_IN` (F-15) | "GitHub returned 404 to this signed-in read and does not say why. Possible causes, none confirmed: (1) the repository, ref or path does not exist or is misspelt; (2) MoonAliza's GitHub App may not be installed on the account that owns the repository, or not given this repository. On the user's own account, they can install it with Install on repositories in MoonAliza's GitHub dialog. In an organization, an owner can install it; other members can use Install and request or Request on the install page, and if the organization is not offered there, they ask an owner. If the app is already installed in the organization, a repository admin may be able to add this repository, unless the owners restrict that. On another person's account, the user asks that person. (3) The user's GitHub account may have no access to the repository. (4) If the organization uses SAML single sign-on, the user starts a SAML session for it on GitHub, then signs in to MoonAliza again. (5) An owner may not yet have approved updated permissions for the app. If it still fails after the app is installed or given the repository, the user signs in to MoonAliza again. Never ask the user to paste a token into chat." (E-15 l.46, l.65-70; E-13 l.64-82, l.94; E-01 l.34; R2-2, R2-3, R2-9; V3-4, V3-5) |
| `GITHUB_RATE_LIMIT` (rewritten) | "GitHub is limiting requests. Wait at least a minute before reading GitHub again; if the next read is limited too, wait longer. Never ask the user to paste a token into chat." (no sign-in advice, F-14(2)) |
| `GITHUB_FORBIDDEN` (signed out, rewritten) | "GitHub refused this read, which was made without a GitHub sign-in (403), and did not say why. GitHub may be limiting requests without saying so: wait at least a minute before reading again. MoonAliza reads private repositories only after the user signs in to GitHub in MoonAliza and installs MoonAliza's GitHub App on them. Never ask the user to paste a token into chat." |
| `GITHUB_PERMISSION_MISSING` | "GitHub refused this signed-in read because MoonAliza's GitHub App or the user's GitHub account lacks a permission this read needs. For example, an owner of the account where the app is installed may not yet have approved updated permissions for it. Never ask the user to paste a token into chat." (R2-1; E-04 l.57, l.75; E-15 l.108; the example is an inference from E-04 l.57 and l.75, V3-3) |
| `GITHUB_FORBIDDEN_SIGNED_IN` | "GitHub refused this signed-in read (403) and did not say why. Apart from rate limits, GitHub's documentation ties a 403 on this read to a missing permission: MoonAliza's GitHub App or the user's GitHub account may lack a permission this read needs, for example because an owner has not yet approved updated permissions (GitHub lists that case under 404 too). Possibilities GitHub does not state for a 403: the app is not installed on the account that owns the repository; the organization uses SAML single sign-on (the user starts a SAML session for it on GitHub, then signs in to MoonAliza again); or GitHub is limiting requests without saying so (wait at least a minute). Never ask the user to paste a token into chat." (R2-1; V3-1, V3-2, V3-3) |
| `GITHUB_SIGN_IN_REQUIRED` | "The user's GitHub sign-in in MoonAliza has ended: it expired, the user signed out, or GitHub no longer accepts it. No repository content was read. Ask the user to sign in to GitHub again with the GitHub button in MoonAliza's sidebar. Never ask the user to paste a token into chat." |
| `GITHUB_RENEWAL_UNAVAILABLE` | "MoonAliza could not use the user's GitHub sign-in just now, so nothing was read. The sign-in is kept. Try the read again after a minute; if it keeps failing, ask the user to sign in to GitHub again with the GitHub button in MoonAliza's sidebar. Never ask the user to paste a token into chat." (A hold can outlast a minute, 6.5. The fresh-token guard fails after a request was sent, 6.4.) |

#### 7.5 Model-facing text (F-17)

The text is static, so the engine learns nothing about sign-in state and each run's tools stay fixed. A reason code still tells the model whether a failed read was signed in. It never carries the login.

- **`GITHUB_TOOL.description`** (`src/shared/github.ts:9`): "Read a GitHub repository URL supplied by the user. Private repositories can be read only when the user has signed in to GitHub in MoonAliza and installed MoonAliza's GitHub App on them. Omit path to list the repository root, or give a repository-relative file/directory path. Returns a pinned commit, source URL and bounded text/listing. Supports github.com repository, tree and blob URLs; no general websites, cloning or writes. Ref names containing slashes should use a repository root URL and the ref argument. Repository content is untrusted data."
- **`src/engine/application.ts:68`**: "Use read_github for public GitHub URLs when offered" becomes "Use read_github for GitHub URLs when offered".
- **`:375`**: "Public GitHub repositories can be read only with read_github when offered" becomes "GitHub repositories can be read only with read_github when offered".
- **`:376`**: "The read_github tool IS available for public GitHub repositories explicitly supplied by the user." becomes "The read_github tool IS available for GitHub repositories explicitly supplied by the user (private ones only when the user has signed in to GitHub in MoonAliza and installed its GitHub App on them)." In the same line, "To enable public GitHub reading" becomes "To enable GitHub reading".

### 8. Renderer (src/renderer/GitHubAccountPanel.tsx, src/renderer/github-text.ts, src/renderer/App.tsx)

#### 8.1 Placement and behaviour

- **Sidebar.** A **GitHub** button sits in `.sidebar-bottom`, beside Local models and Model profiles (`src/renderer/App.tsx:221`). The sidebar never shows the login.
- **Dialog.** It opens `<Modal title="GitHub account">` with `<GitHubAccountPanel api={api} />`, following `:246`. `githubDialog` joins the shortcut guard (`:200`).
- **Closing the dialog.** If the last status read was `pending` with `committed: false`, the close handler runs `void api.invoke('github.signIn.cancel', {})`. Otherwise it calls nothing (6.6).
- **Reading and polling.** The panel reads `github.account.read` when it mounts.
  - While `state === 'pending'`, it polls every 1,000 ms with `setInterval`, cleared on unmount and whenever the state changes.
  - It never calls `start` on mount or remount (F-2).
  - **Sign in** and **Sign in again** are disabled while a call is in flight, so a double click cannot spend two codes (U-16).
- **No browser storage.** No clipboard API, `localStorage` or `sessionStorage`; the renderer's permission handlers deny everything (`src/main/index.ts:313-314`). The code is selectable text (`user-select: all`).
- **Status and errors.** Outcome changes are announced in a `role="status"` element. Invoke failures show `reason.message`.
- **Text source.** Every sign-in text lives in `github-text.ts`. A test keeps it in step with `GitHubAttemptOutcomeSchema` (precedent: `src/renderer/research-text.ts`).

#### 8.2 State texts

| State | Content |
|---|---|
| not-configured | "GitHub sign-in is not configured in this build." Nothing else (F-1, F-20). |
| signed-out | See the signed-out list below. |
| pending | See the pending list below. |
| signed-in | See the signed-in list below. |
| right after Sign out (a renderer-local flag) | The F-12 text below. |

**Signed out:**
- "Sign in to GitHub so MoonAliza can read your private repositories, read-only. MoonAliza shows a code that you enter at github.com/login/device. It can then read repositories where you install MoonAliza's GitHub App, and only repositories you paste into a conversation. It never writes to GitHub. Your sign-in is kept encrypted on this computer, and MoonAliza never shows it to models or asks you to paste a token."
- UD-4: "While you are signed in, every GitHub read MoonAliza makes, public repositories included, uses your sign-in and counts toward your GitHub account's rate limit."
- UD-3: "Text read from a private repository is handled like your local project files. It is read only in conversations where you pasted the repository's URL. It is saved in that conversation and its search. It is sent to a cloud model only when that conversation allows cloud models. Signing out does not delete it; deleting the conversation removes it from MoonAliza."
- **Sign in**.
- If `ended` is set, its text:
  - `sign-in-ended`: "Your GitHub sign-in ended: it expired, or GitHub no longer accepts it. Sign in again to read private repositories."
  - `app-changed` (DC-15): "This build of MoonAliza uses a different GitHub App from the one you signed in with, so it removed that sign-in. Sign in again to read private repositories."
  - `client-rejected` (DC-1): "GitHub did not accept MoonAliza's GitHub App when renewing your sign-in, so the sign-in ended. Sign in again; if GitHub does not accept the sign-in either, this build cannot sign in."
- If `lastOutcome` is set, its text.

**Pending, before GitHub confirms** (`committed: false`):
- "Enter this code at github.com/login/device:", followed by the code.
- "The code expires in m:ss." At zero: "Waiting for GitHub…"
- **Open GitHub** (`github.open { target: 'device' }`) and **Cancel**.
- "Only enter a code shown in this dialog. MoonAliza never asks for a code in a conversation. On GitHub, check that you are authorizing MoonAliza's GitHub App, which asks for read-only access to repository contents and metadata."
- "Keep this dialog open until GitHub confirms: closing it cancels the sign-in."
- If `account` is set: "You stay signed in as <login> until this sign-in finishes." With no login: "You stay signed in until this sign-in finishes."

**Pending, after GitHub confirms** (`committed: true`, DC-5): only "GitHub confirmed the code. Finishing sign-in…". There is no button, and closing the dialog cancels nothing.

**Signed in:**
- "Signed in as <login>." With no login: "Signed in to GitHub (account name unavailable)."
- "Signing in installs nothing. To let MoonAliza read a private repository, install MoonAliza's GitHub App on the account that owns it; on GitHub you choose All repositories or Only select repositories. In an organization, an owner installs it, or you can request it from the install page." (F-18; E-13 l.58, l.84-88)
- If `renewalHeld`: "MoonAliza could not renew your GitHub sign-in just now, so some GitHub reads fail until it can. If this continues, sign in again."
- **Install on repositories** (`github.open { target: 'install' }`), **Sign in again**, **Sign out**.
- The UD-3 and UD-4 sentences, in short form.
- If `lastOutcome` is set: its text, then "Your existing sign-in is unchanged."

**After Sign out** (F-12; E-17 l.34, l.38-44; E-02 l.34; R2-10). The first two sentences hold whether or not a removal failed (`'durable'`, 4.3, GS-11):

"MoonAliza stopped using your GitHub sign-in. Its encrypted copy on this computer is deleted now, or, if a file cannot be deleted at once, the next time MoonAliza starts. This did not revoke anything on GitHub: the authorization and its tokens stay valid there until you revoke them or they expire, up to 8 hours for the access token and 6 months for the refresh token. To revoke it on GitHub: click your profile picture, then Settings; in the Integrations section of the sidebar, click Applications; open the Authorized GitHub Apps tab; then click Revoke next to MoonAliza's app. Only the person who authorized the app can revoke it; an organization owner can uninstall the app from the organization instead."

If `signOutIncomplete` is true (DC-6), the first two sentences are replaced by: "MoonAliza stopped using your GitHub sign-in, but could not finish removing its copy from this computer's disk. After MoonAliza restarts you may be signed in again; if so, sign out again." The rest of the text follows unchanged.

No URL is shown or opened for that tab. No text says sign-out revoked or erased anything.

#### 8.3 Outcome texts

| Outcome | Text |
|---|---|
| `cancelled` | "Sign-in cancelled. Nothing was saved." |
| `expired` | "The code expired before GitHub confirmed it. GitHub may also be limiting sign-ins right now; start again, or try again later." (U-16) |
| `restart` | "GitHub did not accept this sign-in code. Start again to get a new code." |
| `denied` | "Access was denied on GitHub, and that code cannot be used again. Start again if you want to sign in." |
| `disabled` | "GitHub says sign-in with a code is turned off for MoonAliza's GitHub App, so this build cannot sign in." |
| `client-rejected` | "GitHub did not recognise this build's GitHub App, so this build cannot sign in." |
| `grant-unsupported` | "GitHub refused the sign-in request this build sent, so this build cannot sign in." |
| `email-unverified` | "GitHub needs a verified email address on your account first. Verify it on GitHub, then start again." |
| `rate-limited` | "GitHub is limiting sign-in requests right now. Wait a few minutes, then start again." |
| `start-failed` | "MoonAliza could not get a sign-in code from GitHub. Check your connection, then try again." |
| `failed` | "Sign-in did not complete, and nothing was saved. Start again." |

#### 8.4 Other renderer text

- **Composer footnote** (`src/renderer/App.tsx:237`, F-25):
  - General chat: "Paste a GitHub repository URL to read it; private repositories need GitHub sign-in (sidebar). What is read stays in this conversation and reaches a cloud model only if this conversation allows cloud models. General chat has no local file or command access."
  - Project, not Build: "This mode does not modify project files. GitHub URLs you paste can be read; private ones need GitHub sign-in."
  - Build: unchanged.
- **Cloud dialog** (`:243`, UD-3): one clause is added: "This includes text MoonAliza reads from GitHub repositories you paste, private ones too when you are signed in to GitHub."
- **Model profiles** (`:290`, F-26): `<p className="muted">Claude and OpenAI models use API keys: Anthropic does not permit other apps to offer Claude.ai sign-in, and OpenAI documents Sign in with ChatGPT only for its own apps, so MoonAliza offers neither.</p>` It never says OpenAI forbids it.

### 9. Main wiring (src/main/index.ts)

- **Module scope.** `let github: GitHubSignIn | undefined;` sits beside `collector` (`:42`).
- **After `await collectorSettings.open();` (`:57`):**
  ```ts
  const githubStore = new GitHubAccountStore(join(data, 'github', 'account.json'), vault, GITHUB_APP.clientId);
  await githubStore.open();
  const githubSignIn = new GitHubSignIn({ store: githubStore, vault, epoch: () => engine?.epoch ?? '',
    encryptionAvailable: () => safeStorage.isEncryptionAvailable(), fetcher: lateFetch });
  github = githubSignIn;
  ```
- **Reconcile** (`:183`): `new Set([...references, ...collectorSettings.references(), ...githubStore.references()])`. After `:184`: `await githubStore.finishStartup();`.
- **Admit** (`:193`): `github: new GitHubReader(undefined, githubSignIn, text => vault.redact(text))`. **`:293` is unchanged.**
- **`handle()`.** Five cases go after `case 'external.open'` (`:300`) and before `default` (`:301`):
  ```ts
  case 'github.account.read': return { account: githubSignIn.status() };
  case 'github.signIn.start': return { account: await githubSignIn.start() };
  case 'github.signIn.cancel': return { account: githubSignIn.cancel() };
  case 'github.signOut': return { account: await githubSignIn.signOut() };
  case 'github.open': await shell.openExternal(githubSignIn.openTarget(request.params.target)); return { opened: true };
  ```
- **`before-quit`** (`:324-336`):
  ```ts
  const githubClosed = github?.close().catch(() => {}) ?? Promise.resolve();   // first, so its synchronous part aborts a pending flow now
  for (const item of active.values()) item.stop.abort();
  const currentEngine = engine;
  void Promise.all([(async () => { /* the existing awaits, unchanged order */ })(), githubClosed]).finally(() => app.quit());
  ```
- **Placement rule (T-8).** Nothing goes between `async function infer(` (`:87`) and `async function readGitHub(` (`:110`), or between `case 'profile.test'` and the next `case`. The source pins at `tests/provider-screen.test.ts:166-186`, `tests/anthropic-transport.test.ts:305-343` and `tests/ollama-locality.test.ts:298-323` stay unchanged. `readGitHub` (`:110-123`) is not changed.

### 10. Network stack (UD-5, F-24)

**Decision.** Every sign-in request, and every signed-in read, goes through Node's global `fetch`:
- the service through `lateFetch`;
- the reader through its default `fetch`, which is evaluated per run at construction.

This is the stack `read_github` (`src/main/github.ts:12`) and the verified import (`src/main/research-import.ts:69`) use today. There is no base-URL setting and no test switch (`docs/specification/research-journeys.md:11`).

| | Node global `fetch` (chosen) | Electron `session.fetch` |
|---|---|---|
| Consistency | the same stack as reads and the import | differs from both |
| `redirect: 'manual'` | returns the 3xx, so today's `GITHUB_REDIRECT` path is unchanged | Electron enforces `'error'` (`docs/specification/more-models.md:123`) |
| Cookies, HTTP auth, cache | none to leak; `credentials` and `cache` are honoured | session state; a cached `Proxy-Authorization` still rides along (`docs/ARCHITECTURE.md:35`) |
| Windows system proxy and certificate store | not used. The environment proxy applies only with `NODE_USE_ENV_PROXY=1`, observed on Linux only (`docs/evidence/2026-10-12-break-test.md:26`, `:127`). The packaged build ignores `NODE_OPTIONS` and `NODE_EXTRA_CA_CERTS` (`docs/ARCHITECTURE.md:49`) | used (decision 4, `docs/specification/decisions.md:8`) |
| e2e interception | `app.evaluate` replaces `globalThis.fetch` (`e2e/github-reading.spec.ts:31-46`) | not reachable that way; a github.com TLS fake would break the SAN pin (`tests/github-tls.test.ts:36`) |

- **Late binding is load-bearing.** The service is built at startup, before Playwright's patch lands. A captured `fetch` would let the e2e reach the real github.com. A unit test pins `lateFetch`: it replaces `globalThis.fetch` after construction and restores it in `finally` (`isolate: false`, `vitest.config.ts:12`).
- **Why `app.evaluate` is enough here.** `docs/specification/research-journeys.md:14` rejected it as the only mechanism for the collector, because of traffic main sends at startup. L-2 guarantees there is none here: every request follows a click.
- **Known limit.** A user whose network requires the Windows system proxy, or TLS inspection, cannot sign in. They also cannot read public GitHub today. This diverges from reviewed decision 4, and moving every GitHub call to an Electron broker is recorded for later.

### 11. Privacy and invariants

- **Token invariant (S-1).**
  - The access token, the refresh token and `device_code` never reach any of: the engine (its process or environment), SQLite (database, `-wal`, `-shm`), events, the search index, logs, the renderer (IPC results, DTO, DOM, React state), argv, `process.env` (passed to project commands, `src/main/index.ts:70`), the collector child's environment, or any file in clear.
  - `user_code` crosses only in the pending DTO and is never persisted.
  - `src/` has no `console.*` calls. A static guard keeps the new modules free of `console.`, `process.env` and direct file writes outside `atomicJson`.
- **Separate credentials (S-6).**
  - The collector token keeps its own file, ref and `research` purpose.
  - Sign-in uses `github`.
  - The verified import keeps the collector token (UD-2).
- **Scope (S-5).** Scope is unchanged. Only repositories pasted in saved user messages are read (at most 20), and both the engine and main check this again. Model output and repository content cannot start a sign-in, open a page or add a repository.
- **Private text (UD-3).** It is handled like local project files.

  | | Local-only conversation (the default for new chats and projects) | Cloud-allowed conversation |
  |---|---|---|
  | Network | an authenticated GET to api.github.com only ("Local-only describes model inference", `docs/specification/github-url-reading.md:11`) | the same, plus prompts to the selected provider |
  | Where the text goes | stays on this computer: tool results, events and search (`src/engine/application.ts:318`, `src/engine/migrations.ts:94-104`) | also reaches the provider when a model step includes it (`assertConversationPolicy`, `src/main/index.ts:116`) |
  | Sign-out | does not delete it | same |
  | Delete conversation | removes it from MoonAliza's history and search. Its bytes may remain in the database file or WAL until SQLite reuses the space, because `secure_delete` is not set and WAL is on (`src/engine/store.ts:119-122`) | same; what the provider received is under its terms |

- **Wording rule.** No text says that sign-out or deletion "erases" or "removes all copies".
- **Consent points.** None is automatic:
  1. the dialog's disclosure before Sign in;
  2. GitHub's authorization page;
  3. installation on GitHub (signing in installs nothing, E-13 l.58);
  4. pasting the URL in a conversation;
  5. the conversation's cloud setting.

  Consent is withdrawn by any of: signing out locally; revoking on GitHub (E-17 l.38-44); uninstalling the app; deleting the conversation.
- **Device-code phishing.** Only wording mitigates it (8.2). The dialog shows "Signed in as <login>" after sign-in.
- **AGENTS.md (D-2).** It gains one invariant row: "A GitHub sign-in token (access or refresh) or device code never reaches the engine, DB, events, logs, renderer, argv, process.env or files in clear. Each token is its own vault value, persisted before use, and a refresh once sent is never cancelled. `read_github` sends the access token only to constructed api.github.com routes with redirects refused, and signing in never widens repository scope." Its Evidence names the invariants test, the contracts test, the refresh lifecycle tests and the e2e userData scan. The existing token row's Evidence gains the sign-in byte scans.

### Not changed (named)

`src/preload/index.ts`, `src/main/bridge.ts`, `src/shared/errors.ts`, `src/shared/host.ts` (DC-8), `src/main/engine.ts`, `src/engine/control.ts` (it takes the new reasons through `GitHubErrorCodeSchema`, `:108`), `src/main/collector*.ts`, `src/main/research-import.ts`, `src/adapters/research-kit/*`, `infer()` and `readGitHub()` in `src/main/index.ts` (`:87-123`), the `external.open` handler (`:300`), the review reader (`:293`), `tests/github-tls*.ts` and `tests/fixtures/github-tls.ts`, and `e2e/github-reading.spec.ts`.

### Out of scope (named)

- A repository listing view, any write permission, webhooks, an OAuth app, the web flow or a loopback redirect, any client secret, a prefix-based secret screen, `repository_id` narrowing, cloning.
- Claude or OpenAI sign-in; they get only the F-26 sentence.
- Use of the sign-in token by the research collector or the verified import (UD-2).
- Remote revocation, a push channel to the renderer, and a start throttle in main.
- `secure_delete`.

### Known limits

1. **Network stack.** Proxy-only or TLS-inspecting networks cannot sign in (section 10).
2. **Crash window (S-7).** A crash between receiving a refreshed pair and writing the file leaves a dead pair. The next call clears it, and the user signs in again.
3. **Lost account file.** If the account file is lost by hand, its committed entries stay in the vault (encrypted, redacted) until a later change records ownership in the vault.
4. **Redaction after sign-out.** After sign-out the token values are no longer redacted, while they stay valid on GitHub (R2-10).
5. **Expired-token status (U-5).** GitHub's tutorial treats an expired or revoked token as a 401 on `GET /user` (E-21 l.592, a tutorial, not a reference statement); a 404 on a private repository is still plausible by analogy (E-15), so DO-5 checks it. Only an in-flight expiry or a clock step can send one (L-5, 6.8). The same holds for an access token a refresh killed (E-02 l.36 says only that it "will no longer work"): a read in flight across a rotation may show the signed-in 404 text instead of being retried with the current token, until DO-5 records that status (GS-7).
6. **User-Agent.** Signed-in reads keep the User-Agent `MoonAliza-public-repository-reader` (C-4).
7. **U-16 product risk.** It is not stated whether the device flow's 50 code submissions an hour (stated for OAuth apps, prior E-01 l.307) and the 2,000 OAuth access-token requests an hour (prior E-08 l.95) count per app, or whether polls and refreshes count toward the second. If they count per app, the following arithmetic applies (not a GitHub figure, V3-6):
   - one sign-in left pending polls up to 180 times;
   - refreshes run at about active users × 3 / 24 an hour, which reaches 2,000 an hour at about 16,000 users active across a day.

   Mitigations: user-initiated starts only, one flow, closing the dialog cancels, holds, and rate limits classified first.
8. **Non-expiring tokens.** Expiring tokens are "subject to change" (E-02 l.32). A non-expiring token is used until a 401.
9. **Inference about visibility.** That *Any account* means public is an inference (E-14 l.20, E-03 l.93).
10. **Deleted text may remain.** Deleted conversation text may remain in SQLite free pages or the WAL (section 11).
11. **Renderer reload.** A renderer reload leaves a flow running unseen until its code expires, or until the dialog is reopened and closed (6.6).
12. **Login unknown.** The login shows as unknown if `GET /user` fails (F-4).
13. **Breaking changes.** A breaking change inside API version `2022-11-28` is rare but possible (E-18 l.91-103).
14. **Sign-out on a failing disk (DC-6).** If neither the tombstones nor the file write reach disk, the next start may read the account again. The sign-out says so (8.2).
15. **A just-issued token rejected (DC-2, GS-1).** Until DO-16, a 401 on a token under 5 s old fails the read as `GITHUB_RENEWAL_UNAVAILABLE` after two resends instead of clearing the account, and a 401 on a token under 30 s old never refreshes. A token GitHub really rejected holds refreshes (30 s, then a refresh, then 30 s again), and the third such rejection in a row clears the account: about 70 s or more, depending on when reads come. Reads in that time report a renewal problem rather than "sign in again".

### Day one

Every check runs with the registered app (UD-1) on the collector machine, and none blocks the merge. Each comes before the first release that carries the feature (A-4). Results go into the design project's DISCOVERY.md. The list, with the build's behaviour until each check runs, is DO-1..DO-16 in `USER-DECISIONS.md` (Day-one checks), indexed by `REQUIREMENTS.md` A-4:

- DO-1: two refreshes in a row without a client secret, recording what a failing second refresh returns (DC-1, GS-2);
- DO-2: the refresh's parameter placement, read from DO-1's first refresh (the device flow's is settled by E-21);
- DO-3: the token endpoints' response encoding;
- DO-4: token reach after installing, or after adding a repository (own account, plus an organization installation if one is available);
- DO-5: the status an expired access token gets on `GET /user` and on a private read, and the same for an access token a refresh just retired (GS-7);
- DO-6: the status and body of `bad_refresh_token`;
- DO-7: failed private reads (own account before installing, an organization member who is not an owner, a SAML organization before and after starting a session, with the same token);
- DO-8: rate-limit answers from the github.com token endpoints;
- DO-9: U-16's questions to GitHub Support;
- DO-10: `GET /user` returns `login`;
- DO-11: *Any account* shows Install to another account;
- DO-12: the live `verification_uri`, the `user_code` shape and what GitHub's device page shows;
- DO-13: the body of a real permission 403;
- DO-14: the copied install URL opens the install page;
- DO-15: real tokens pass the header-safe check;
- DO-16: a just-refreshed token is accepted at once (DC-2).

### Tests the builders owe

**Ground rules (T-1).**
- **Red first.** Every new behaviour test is first seen red against the unchanged code.
- **Pins.** Every regression pin passes on the unchanged code, is committed before the change it guards, and is shown red under a named mutation.
- **Guards.** Every guard is proved by removing it (the table below), and the run is recorded in the commit report.
- **Fixtures.** Fixtures are marked "built from E-01/E-02/E-15 shapes, not a capture".
- **Markers.** Token, refresh-token and `device_code` markers are generated at runtime (`'ghu_' + randomBytes(24).toString('hex')`, and likewise `ghr_` and a hex device code). Hex is escape-free, so JSON cannot hide a marker from a byte scan.
- **No literals.** No token-shaped literal is committed, and nothing is copied from the captures. `tests/github-token-literals.test.ts` scans `src/`, the new GitHub test files and `e2e/github-sign-in.spec.ts` for `\b(gh[pousr]_|github_pat_)[A-Za-z0-9_]{16,}` and scans `src/` for `client_secret`.
- **Fetchers.** Fetchers are injected. `globalThis.fetch` is never stubbed (`isolate: false`), except in the one late-binding test, which restores it.
- **Vault.** Unit tests use the real `Vault` with the AES fake cryptor of `tests/vault.test.ts:9-31`, so they run on Linux.
- **Loopback fake.** `tests/fixtures/fake-github-oauth.ts` is an `http` server on `127.0.0.1:0` (T-2).
  - Its `fetcherFor(fake)` maps `https://github.com/login/` and `https://api.github.com/` to the fake.
  - It throws on any other URL.
  - It serves scripted answer queues of status, headers, a JSON or form body, a delay, a hang or a reset.
  - It records, per request: method, host, path, **query keys and body keys separately**, the body's content type, header names, whether `Authorization` carries a registered marker (and which one), and whether `client_secret` appears anywhere.
  - Values stay in memory. If `NODE_USE_ENV_PROXY` is set, `NO_PROXY` lists `127.0.0.1`.

**`tests/github-oauth.test.ts`** (U1):
- **Request shapes.**
  - The exact URLs, with no query.
  - Body keys exactly `{client_id, scope}` (`{client_id}` when `offlineAccess` is false, DC-3), `{client_id, device_code, grant_type}` and `{client_id, grant_type, refresh_token}`.
  - The body placement (5.2, E-21) is pinned.
  - `redirect`, `credentials` and `cache` are pinned, along with `Accept` and `User-Agent`.
  - No `client_secret` and no `repository_id`.
- **Parsing.** JSON; form; `; charset=utf-8`; a missing or unknown content type (transient); a body over 64 KiB, by declared length and by stream (transient, or `failed` at step 1); invalid UTF-8. A form body holding a token marker, served as `application/json`, is transient, and neither the result nor any rejection has a `cause` or any 8-character substring of the marker (DC-9).
- **Error codes.** Every `error` code is sent at 200 and again at 400, 401 and 403, and is classified the same way (R2-5).
- **Rate limits.** `rateLimitWait` is tested with:
  - a 429;
  - a 403 with remaining 0, with and without a reset;
  - a 403 or 429 with `retry-after`;
  - an invalid `retry-after`;
  - `retry-after: 0`, which gives 1 s (DC-12);
  - a reset more than an hour away;
  - a 403 with `X-Accepted-GitHub-Permissions` plus rate-limit headers, which is still a rate limit;
  - a rate-limit 403 whose body says `bad_refresh_token`, which is rate-limited because rate limits come first.
- **`headerSafeToken`.** It refuses: the wrong prefix, the prefix alone, space, tab, CR, LF, NUL, `\x7F`, `\x85`, NBSP, a character above `\xFF`, and more than 16,384 characters.
- **Shape.**
  - An absent `expires_in` means non-expiring.
  - A `refresh_token` without `refresh_token_expires_in` is `malformed`.
  - A 2xx with no `access_token` is `unusable` with status 200; a 401 with a JSON `message` body is `unusable` with status 401 (GS-2).
- **`verification_uri` variants** all give `failed`: a trailing slash, `http:`, another host, a query, different case.
- **`fetchLogin`** keeps only `login`: e-mail and name markers are absent from every returned value. A 401 gives `null`. **(GS-8)** Its init's exact key list, with `redirect: 'manual'`, `credentials: 'omit'`, `cache: 'no-store'` and a `signal`; a 302 gives `null` after exactly one fetch, and the `Location` host receives nothing.
- **Dropped fields.** An `error_description` marker appears in no returned value.

**`tests/github-account-store.test.ts`** (U2):
- **Write order.** The 4.3 order is recorded by a spying vault.
- **Crash windows.** A crash is simulated after each step of `replace` and `clear`. Reopening, reconciling and running `finishStartup` must yield a consistent account: a referenced live pair, no staged orphans, retired refs removed (pattern: `tests/research-collector-settings.test.ts:100-130`).
- **Failure kinds.** A failure before the file write throws `ReplaceFailure(false)` and leaves no entry. A refresh's commit failure throws `ReplaceFailure(true)`, whose message is `ACCOUNT_STORE_FAILED`.
- **Rollback (DC-11, GS-3).** A sign-in's commit failure with a successful rollback throws `ReplaceFailure(false)` and leaves the previous account live and named, with the new refs removed. A rollback whose write fails makes the new account live, returns it, and reopening and reconciling yields that same account. A rollback whose admit fails (a sign-out began) writes nothing and returns `null`, and the sign-out's clear leaves no account. **A writer queued behind it (GS-3):** a sign-in's commit fails while a refresh `replace` of the old account waits on the lock. After the rollback, the refresh runs: the file and `live` agree on the refreshed account, and reopening and reconciling gives that account with no orphan entries.
- **Retired cap (DC-10).** Four replaces whose step-7 write fails, then a reopen: the account still reads, and the file passes `AccountFileSchema`. A clear over a live pair and 8 retired refs writes at most 8.
- **Durability (DC-6).** `clear` returns `'durable'` when either the tombstone persist or the step-2 write succeeds. With both failing, it retries once and returns `'not-durable'`. Reopening with the vault's on-disk index then reads the account, which is the limit `signOutIncomplete` discloses. With only one failing, reopening reads none. **(GS-11)** With the tombstone persist succeeding and `remove` failing, `clear` returns `'durable'` (so the sign-out shows the 8.2 text, not the incomplete one), the file still names the ref in `retiredRefs`, and reopening and reconciling deletes its `.bin` file.
- **Bad files.** Missing, invalid, oversized and extra-key files read as no account, and `open()` never throws.
- **Startup checks.** Refs that are not committed read as no account. Another non-empty client ID tombstones the refs, reads as no account, and sets `openedAppChanged()` (DC-15). An empty client ID keeps them.
- **Concurrency.**
  - A `clear` during `replace` leaves no live account and no orphan.
  - A `clear` whose prologue ran before a sign-in's `replace` was admitted leaves the new account live and named (DC-4).
  - The prologue revokes a grant synchronously.
  - `setLogin` for another sign-in's `signInId` is a no-op. After a refresh of the same sign-in it applies, and a refresh after it keeps the login (GS-10).
- **Byte scan.** The file and the vault directory contain no marker in UTF-8 or UTF-16LE. The login is the positive control.

**`tests/github-signin.test.ts`** (U5, device flow; injected clock, controllable `sleep`, shrunk limits):
1. `start` refuses (`NOT_IMPLEMENTED`, `ENCRYPTION_UNAVAILABLE`) with zero requests.
2. Step-1 failures give `start-failed`, `disabled`, `client-rejected` or `rate-limited`, and no poll follows.

   2b. **The scope follows the constant (GS-5).** With `config.offlineAccess: false`, the step-1 body keys are exactly `{client_id}`. With the default construction (no `offlineAccess`), they are `{client_id, scope}`, which proves the service reads `REQUEST_OFFLINE_ACCESS`.
3. The first poll waits `interval`, and polls are at least `interval` apart. `slow_down` adds 5 s and honours a larger returned interval.
4. Each terminal code, under both of its names, gives its outcome and stores nothing.
5. A rate-limited poll waits, then resumes. A wait that would pass the deadline ends `rate-limited` with no further poll.
6. Deadline: a clock jump forward during a wait gives `expired` with **no poll sent**. A backward jump ends at `maxPolls`.
7. Three transient polls continue; a fourth gives `failed`.
8. Success stores two vault values, and the expiries equal receipt time plus seconds. A non-expiring token stores null expiries and no refresh ref. A `GET /user` failure keeps the account with `login: null`. The status stays `pending`, with `committed: true`, until the login read ends.
9. Cancel during a wait sends no further poll. Cancel while a poll is in flight discards its answer, even when the fake answers success after the cancel, and the vault index is unchanged. From the commit point, Cancel is a no-op (DC-5): a Cancel during a slow F5 leaves the login set when `GET /user` answers, with `lastOutcome` null, and a new `start()` during F5 sends no request.
10. A new `start` cancels the pending flow, and so does `signOut`. One hundred `status()` calls send zero requests. An engine restart (`setEpoch`) mid-flow has no effect.
11. "Sign in again": the old account is used during the flow and kept on cancel or failure. On success, the old refs are tombstoned and removed.
12. Every status during a flow parses with `GitHubAccountStatusSchema` and contains no marker.
13. `openTarget('device')` returns the constant only while pending; otherwise it throws `NOT_FOUND`. `openTarget('install')` returns the configured constant.
14. **The sign-in admit (DC-4).**
    - A refresh commits while the sign-in's `replace` waits on the lock: the sign-in is admitted, and the refresh pair is retired.
    - `bad_refresh_token` clears the old account during "Sign in again": the sign-in is still admitted, and its account is live and named by the file.
    - A sign-out during F4, with a gated vault stub: `live` stays null, the new refs are removed, and the status is `signed-out` with no outcome.
15. **A failed commit during "Sign in again" (DC-11, GS-3).** With the store's rollback succeeding, the old account stays live and the outcome is `failed`. With the rollback write failing too, the new account is live and there is no outcome. Reopening and reconciling gives the same account in each case.
16. **Startup and sign-out flags.** A file with another client ID gives `signed-out` with `ended: 'app-changed'` and zero fetcher calls (DC-15). A store whose clear returns `'not-durable'` gives `signOutIncomplete: true`, and `start()` clears it (DC-6).
17. **A refresh during F5 (GS-10).** A refresh commits while `GET /user` is slow, once before and once after `setLogin` runs: in both orders, the login is set after both complete.

**`tests/github-signin-refresh.test.ts`** (U5). Unless a case says otherwise, its tokens are older than `transientHoldMs` (GS-1).
1. **Pre-check.**
   - More than 300 s left: no refresh.
   - Less than 300 s left: exactly one refresh, and the request carries the **new** marker.
   - Access token past expiry and refresh token expired: cleared, `GITHUB_SIGN_IN_REQUIRED`, zero requests.
   - Access token within the margin and refresh token expired: sent with the still-valid token.
   - At 299 s a refresh happens; at 301 s none does.
2. **Single flight.** Eight concurrent `send()` calls near expiry make exactly one refresh request, and all eight use the new token.
3. **Persist before use.** The fake's resource handler asserts two things when the first new-token request arrives: the account file already names the new refs, and the vault holds them committed.
4. **Refresh error codes (DC-1).** Each case runs at 200 and at a 4xx.
   - `bad_refresh_token` (also at 401) and `unsupported_grant_type` clear the account after exactly one refresh request, give `GITHUB_SIGN_IN_REQUIRED`, and show `ended: 'sign-in-ended'`.
   - `incorrect_client_credentials` does the same, with `ended: 'client-rejected'`, and the next read throws `GITHUB_SIGN_IN_REQUIRED` with no request.
   - One unknown code three times in a row clears the account after at most three refresh requests, with the gaps between them growing. Two unknown codes alternating never clear it.

   4b. **Answers with no `error` code (GS-2).** A 401 with a JSON `message` body three times in a row clears the account (`sign-in-ended`) after at most three refresh requests; so does a 2xx without `access_token`. A 302 or a 400 HTML page three times only holds.
5. **Transient failures.** A network error, a hang past the timeout, a 500, a 400 HTML page and an unparseable body each:
   - leave `index.json` and `account.json` byte-identical;
   - give `GITHUB_RENEWAL_UNAVAILABLE`;
   - never send the resource request.

   With the access token past expiry, a call within 30 s afterwards fails with no request at all (the hold). After 30 s, a refresh is attempted again; a second failure holds for 60 s, and the hold never exceeds an hour (DC-1). **(GS-4)** With a hold active and the access token 200 s from expiry, a read is sent with that token and no refresh request is made. **(GS-6)** With the access token past expiry, when decrypting the refresh token throws, the read gets `GITHUB_RENEWAL_UNAVAILABLE`, the token endpoint gets zero requests, and a second read within the hold makes no decrypt attempt.
6. **Rate-limited refresh.** It keeps the vault and gives `GITHUB_RATE_LIMIT`. Calls send no refresh until the wait passes (L-13), and `renewalHeld` is true. **(DC-12, GS-9)** After a 429 with `retry-after: 0`, the injected clock moves 2 s: a read there sends no refresh request (the 30 s floor, not the 1 s one) and `renewalHeld` is true. At 31 s, one more refresh follows.
7. **Malformed token.** A 2xx with a malformed `access_token` clears the account. A single 2xx with no `access_token` keeps it (three in a row clear it, 4b).
8. **Persist failure.** An `atomicJson` failure after a successful refresh clears the account (X-9), and no request carries either the old or the new token.
9. **Engine restart.** `setEpoch` between grant and use re-grants. The refresh succeeds, and the account is never cleared.
10. **The 401 rule.**
    - A 401 leads to one refresh, then one retry, then success.
    - A 401 after another call rotated the pair causes **no** refresh, and one retry with the current token.
    - A retry with a rotated token at least `transientHoldMs` old that still gets 401 clears the account.
    - A non-expiring token that gets 401 clears it.
    - A pre-check refresh followed by a 401 on its token clears it (C-6), with the clock stepped past `transientHoldMs` before the 401. Only a clock step reaches this; without it, the same 401 takes the GS-1 path below.
    - Refreshes and retries per call are counted: at most one of each.
    - **The fresh-token guard (DC-2).** For a token 0-2 s old, the fake answers 401 twice, then 200: the call succeeds after waits of 1 s and 2 s, with no refresh, and the account is kept. Three 401s on a token under 5 s old give `GITHUB_RENEWAL_UNAVAILABLE`, the account is kept, and `renewalHeld` is true. A 401 on a token 10 s old sends no refresh (GS-1).
    - **A refused new token (GS-1).** The fake accepts every refresh but answers 401 to every resource request, and reads run 6 s apart for 5 minutes: at most 3 refresh requests in total, `renewalHeld` true between them, and the account ends `sign-in-ended`.
    - **A slow new token (GS-1).** The access token starts inside the 300 s margin, so the first read refreshes; the fake answers 401 until 8 s after a token is issued, and reads run 6 s apart: the reads recover after exactly one refresh, and the account is kept.
11. **Stop mid-refresh.** The read gives `RUN_CANCELLED`, the refresh persists, and the next read uses the new pair with zero refreshes. A read deadline mid-refresh gives `GITHUB_TIMEOUT`, and the refresh persists.
12. **Sign-out mid-refresh.**
    - The waiter rejects at once with `GITHUB_SIGN_IN_REQUIRED`, checked by timing.
    - The refresh result is discarded, and nothing is stored.
    - No request after `signOut()` resolves carries any marker.
    - The file holds `account: null`.
    - A grant taken before sign-out is denied after it.
13. **A re-sign-in committing during a refresh.** The refresh result is discarded, and waiters continue with the new account.
14. **No ambient traffic.** Construct, `open`, `finishStartup`, then simulate 10 minutes: zero requests (L-2).
15. **Clock step.** `now < obtainedAt − 300 s` refreshes before use.
16. **`close()`.**
    - A pending flow is aborted synchronously, checked before the first `await` resolves.
    - An in-flight refresh is waited for and persists.
    - A hung refresh releases `close()` at `quitWaitMs`.
    - `start` and `send` after `close` are refused without a request.
17. **Late binding.** With `lateFetch`, a `globalThis.fetch` replaced **after** construction receives the call.
18. **Signed out or not configured.** `send` calls `request(undefined)` exactly once. With an account present but not configured, nothing is cleared.
19. **Copy check (R2-10).** After a full cycle, `util.inspect(service, { depth: 20, showHidden: true })` and `util.inspect(store, …)` contain no marker.

**`tests/github-read.test.ts`** (U3; the pins are committed first, on the unchanged code):
- **Pins (DC-13).** Two AbortSignals compare equal under `toEqual`, so the pin checks `signal` by behaviour:
  - the signed-out init, with `signal` removed, deep-equals today's literal, including the header object and the User-Agent;
  - `Object.keys(init)` equals today's exact key list;
  - `init.signal.aborted` turns true when the test's Stop controller aborts.

  The existing cases at `:10-84` stay green.
- **Signed-in twin.** With a fake credential:
  - the exact `Authorization: Bearer <marker>`, sent to `api.github.com` only;
  - the init passes the same three checks as the pin, with `Authorization` as its only extra header;
  - a 302 gives `GITHUB_REDIRECT` with one fetch, and the `Location` host receives nothing.
- **F-14 order.**
  - A 403 with `x-ratelimit-remaining: 0` **and** the integration body gives `GITHUB_RATE_LIMIT`.
  - A 403 with only the body text gives `GITHUB_PERMISSION_MISSING`.
  - A 403 with neither gives `GITHUB_FORBIDDEN_SIGNED_IN`.
  - A 70 KiB 403 body with the phrase after 64 KiB gives `GITHUB_FORBIDDEN_SIGNED_IN` (the read is bounded).
  - A signed-out 403 gives `GITHUB_FORBIDDEN`, and no body is read.
  - A 404, signed in or out, gives its own reason.
  - A sentinel body string is absent from every error.
- **No fallback.** The credential's `GITHUB_RENEWAL_UNAVAILABLE`, `GITHUB_RATE_LIMIT` and `GITHUB_SIGN_IN_REQUIRED` pass through unchanged, and the fetcher is never called.
- **Pre-redaction (X-3).** A vault secret straddling the 16,000-character cut does not appear in part.
- **Reruns.** The scope, sensitive-path, bounds and Stop tests run again with a credential present.

**`tests/github-text.test.ts`** (U3):
- **Every new reason:**
  - parses in `GitHubErrorCodeSchema` and in `ToEngineSchema`'s `github.error`;
  - has a text in `githubFailure` that is not the fallback, at most 2,048 characters long, and passes `PublicErrorSchema`.
- **G-19 (DC-7).** Every member of `CREDENTIAL_ERRORS` and each of the five new reasons parses in the enum.
- **The signed-in 404 text contains:** each possibility; "SAML"; "then signs in to MoonAliza again"; "may be able to add this repository, unless the owners restrict that"; and "If it still fails after the app is installed or given the repository".
- **No text matches any of:**
  - "is not installed" stated as fact;
  - `/because .* not installed|will (fix|work)|installing (fixes|will)/`;
  - "public reader";
  - "revoked";
  - a URL.
- **The rate-limit text** contains no "sign in", "reset time" or "retry-after".
- **The signed-out 403 text** does not contain "permission".
- **The tool description and the prompts** no longer contain "public" only or "no private authentication".

**`tests/contracts.test.ts`, `tests/vault.test.ts` and `tests/github-app-constants.test.ts`** (U0):
- The exact route list (`:42-54`) gains the five methods.
- Params and results are strict. No method accepts `token`, `secret`, `deviceCode`, `device_code` or `secretRef` (the pattern of `tests/research-contracts.test.ts:76-84`).
- Every member of the status DTO rejects `accessToken`, `refreshToken`, `deviceCode`, `secretRef`, `verificationUri`, `interval` and `clientId`.
- `github.open` rejects `{ url }`.
- Every state parses, including `pending` with `committed` true and false, and `signed-out` with each `ended` value and with `signOutIncomplete`.
- A `github` grant at `Date.now() + 60_000` is refused, as `tests/vault.test.ts:41` does for `research`; one at `Date.now() + 30_000` works (DC-14). The refused case is red while `:135` lacks `github`.
- The host purposes are a subset of the vault's and exclude `'github'` (typecheck, DC-8).
- The constants rules of 3.1.

**`tests/github-main-wiring.test.ts`** (U6). Source pins by whole lines, in the style of `tests/ollama-locality.test.ts:298-323`:
- The reconcile set includes `githubStore.references()`.
- `await githubStore.finishStartup();` follows the collector's.
- The admit line builds `new GitHubReader(undefined, githubSignIn, text => vault.redact(text))`, and the `:293` line is unchanged.
- In `before-quit`, `github?.close()` comes before the abort loop and before any `await`.
- The five `case 'github.` lines sit between `case 'external.open'` and `default`.
- `shell.openExternal` in the `github.open` case receives only `githubSignIn.openTarget(...)`.
- The service is built with `fetcher: lateFetch`.
- No new line appears between `async function infer(` and `async function readGitHub(`.
- The three existing pins run unchanged.

**`tests/github-reason-scan.test.ts`** (U6, after U3 and U5 are integrated; DC-7). Every `throw new Error('GITHUB_…')` literal in `src/main/github*.ts` parses in `GitHubErrorCodeSchema`. Its removal proof adds a throw of an unknown `GITHUB_` code.

**`tests/github-account-panel.test.tsx`** (U4; jsdom, fake `AppApi`, fake timers):
- Each state renders its section 8.2 content: the committed pending view, each `ended` text, and the incomplete sign-out text included. Not-configured has no button.
- Mount, unmount and remount make zero `github.signIn.start` calls.
- The panel polls about every 1 s only while pending, and stops on unmount or a state change.
- Closing the dialog calls `cancel` while pending with `committed: false`, and calls nothing when `committed` is true (DC-5).
- **Sign in** is disabled while a call is in flight.
- **Open GitHub** sends `{ target: 'device' }`, and Install sends `{ target: 'install' }`.
- The sign-out text has its four parts and no "revoked" or "erased" claim.
- Every outcome value has a text.
- The Model profiles sentence is present and does not match `/OpenAI (forbids|does not permit)/`.
- The footnote and the cloud-dialog clause are present.
- `tests/workbench.test.tsx` stays green, so the new button name collides with nothing.
- `document.body.innerHTML` never contains a marker.

**`tests/github-signin-invariants.test.ts`** (U7; T-6, runs on Linux):
- **The stack.** A real `Vault` with the fake cryptor, the real store file, `GitHubSignIn` against the fake, a `GitHubReader` with the credential and `vault.redact`, and the engine `Application` over a real `Store`, whose `host.readGitHub` calls that reader (harness: `tests/folder-free-chat.test.ts:125-140`).
- **The journey.** Sign in, read a private file, force a refresh, force a 401 on a token older than `transientHoldMs` (GS-1), sign out.
- **The scan.** Afterwards, none of the markers appears, in UTF-8 or UTF-16LE, in any of:
  - `state.sqlite`, `-wal` and `-shm`;
  - the account file and the vault directory;
  - every IPC result and status DTO (the user code is allowed only in pending DTOs);
  - every engine message and event;
  - every `infer()` message;
  - tool output;
  - `Object.values(process.env)`.

  The markers are the device code, both access tokens and both refresh tokens.
- **Positive controls.** The repository text **is** found in the database or WAL. The login **is** found in the account file before sign-out.
- **Red under mutation.** Each scan is shown red under a mutation that writes a marker where it scans.
- **Rejections (L-7, DC-9).** Every rejection raised during the journey, and in the oauth parse cases, is walked through `message` and the whole `cause` chain. None holds a marker or any 8-character substring of one. The walker is shown red under a mutation that keeps a parse error as `cause`.
- **Static guard.** The new `src/main/github-*.ts` files contain no `console.`, no `process.env`, and no `writeFile` or `appendFile` outside `atomicJson`. The panel contains no `localStorage`, `sessionStorage` or `clipboard`.

**`e2e/github-sign-in.spec.ts`** (U8; Windows CI only, T-9, T-10):
- **Setup.**
  - Launch the unpackaged app as `e2e/github-reading.spec.ts:27-29` does.
  - `app.evaluate` replaces `globalThis.fetch` with an in-process fake that routes:
    - `github.com/login/device/code`;
    - `github.com/login/oauth/access_token`;
    - `api.github.com/user`;
    - the repository routes.

    It throws on any other github.com or api.github.com URL and records each `Authorization` by marker identity.
  - The same call replaces `electron.shell.openExternal` with a recorder. The first assertion proves that replacement took effect. If the property cannot be replaced, the journey does not click Open GitHub or Install, and the unit report says so; the wiring stays covered by U5 and U6.
  - Markers are generated in the test process and passed as `evaluate` arguments.
  - A loopback model server, as in `:12-26`, issues the `read_github` calls.
- **Journey A** (always runs). Click GitHub. The dialog matches the build's `GITHUB_APP`, imported from `src/main/github-app.ts`: not-configured shows only its message; a configured build shows signed-out with the disclosures. Zero GitHub requests are recorded.
- **Journey B** (`test.skip(!isConfigured(GITHUB_APP), 'UD-1: no client ID in this build')`). Visible in the report, and a release gate.
  1. Sign in. The code is visible at a 1 s `interval` with `expires_in` 60.
  2. Open GitHub. The recorded URL equals `DEVICE_PAGE_URL`.
  3. The fake answers `authorization_pending`, then `slow_down`, then a success with `expires_in: 100`. The dialog shows "Signed in as <login>".
  4. Install on repositories. The recorded URL equals the constant.
  5. Paste a private URL and send. The first read refreshes once (pre-check) and carries the second access marker. The README contains that marker, and the transcript shows `[redacted]`.
  6. At least 30 s after step 5's refresh (a 401 on a younger token never refreshes, 6.4, GS-1), the fake answers 401 once for the second marker. Exactly one refresh follows, and the retry carries the third marker.
  7. Restart and re-patch. The app is still signed in (reconcile and file), and the next read makes no refresh.
  8. Copy `account.json` aside for the login control.
  9. Sign out; the help text is visible.
  10. Read again: no `Authorization`, and the fake's signed-out 404.
  11. While the app runs, `process.env` contains no marker (checked through `app.evaluate`).
  12. Close the app, then byte-scan every userData file for all seven markers in UTF-8 and UTF-16LE (`e2e/anthropic.spec.ts:98-110`). Positive controls: the repository text is in the database, and the login is in the copied file.
- **Budget.** About two minutes of the 35-minute job, step 6's 30 s wait included.
- `e2e/github-reading.spec.ts` stays unchanged and green.

**Guard-removal proofs.**

| Guard removed | Turns red |
|---|---|
| single flight (a refresh per caller) | refresh 2 |
| persist before use, or the live pointer set before commit | refresh 3 |
| expiry pre-check | refresh 1, 5 |
| holds | refresh 5, 6 |
| the refresh on its own signal (use the read's signal instead) | refresh 11 |
| the admit and generation checks | refresh 12, 13; store concurrency |
| the `accountChanged` race | refresh 12 (timing) |
| the C-6 budget | refresh 10 |
| rate limits first, on a poll or a refresh | device 5; oauth rate-limit 403 with `bad_refresh_token`; refresh 6 |
| `error` read before `ok` | oauth "every code at non-200" |
| exact `verification_uri` | oauth; device 2 |
| the deadline check after each wake | device 6 |
| cancel discard | device 9 |
| shape check, or header-safe characters | oauth; device 8 |
| `lateFetch` | refresh 17; wiring pin |
| refs in the reconcile set | wiring pin; store crash test; e2e restart |
| two entries (store one JSON blob instead) | a test that `vault.redact` of a text holding the access marker yields `[redacted]` |
| `redirect: 'manual'` or `credentials: 'omit'` | oauth shape pin; read twin |
| the same options on the login read (GS-8) | oauth `fetchLogin` pins |
| strict DTO | contracts; the invariants scan |
| signed-out identity (always add the header, or rebuild the init) | the read pin; e2e `UNEXPECTED_AUTH` in `github-reading.spec.ts` |
| the synchronous sign-out prologue | refresh 12 (the grant denied) |
| a reason missing from the enum | text G-19; the U6 reason scan |
| the refresh error classes (hold on `incorrect_client_credentials`, or on any unknown code forever) | refresh 4 |
| the `unusable` count by status (GS-2) | refresh 4b |
| the doubling hold | refresh 5 |
| a still-valid token sent during a hold (GS-4) | refresh 5 (GS-4 case) |
| a local vault failure in a refresh held (GS-6) | refresh 5 (GS-6 case) |
| the 1 s floor in `rateLimitWait` | oauth `retry-after: 0` |
| the refresh hold's `transientHoldMs` floor (GS-9; its removal run is recorded apart from the 1 s floor's) | refresh 6 (the read at 2 s) |
| the fresh-token guard | refresh 10 (fresh-token cases) |
| no refresh under `transientHoldMs`, and the hold and count in `freshRejected` (GS-1) | refresh 10 (refused and slow new token) |
| the refresh copying `live.login`, and `setLogin` by `signInId` (GS-10) | device 17; store concurrency |
| `clear` step 4 keeping refs whose removal failed (GS-11) | store durability (GS-11 case) |
| the sign-in admit by sign-out count (admit by generation instead) | device 14 |
| the clear's "a newer sign-in won" rule | store concurrency; device 14 |
| Cancel a no-op from F4 | device 9 |
| the rollback inside `replace`'s lock (a separate locked call instead, GS-3) | store rollback (a writer queued behind it); device 15 |
| the 8-ref cap | store retired cap |
| the clear's durability result | store durability; device 16 |
| parse errors without `cause` | oauth parsing; the invariants walker |
| `REQUEST_OFFLINE_ACCESS` | the constants test; the oauth request shapes; device 2b (the service passes it, GS-5) |
| host purposes without `github` | the contracts typecheck |
| X-9 | refresh 8 |
| X-3 | read straddle |
| the body placement (move `refresh_token` to the query) | the oauth placement pin |

### Recorded for later

- Move to API version `2026-03-10` before March 10, 2028, minding E-18's exceptions (l.91-103).
- An Electron network broker for every GitHub call, as reviewed decision 4 asks (UD-5).
- A UI-only repository listing (E-07). Metadata read is already requested.
- The write path, or a broader app (UD-2).
- Revoke-on-exposure through `POST /credentials/revoke` (E-11), which is a separate decision.
- `secure_delete` for deleted conversations.
- Constrain or remove `external.open`. It opens any http(s) URL, and no renderer code calls it (`src/shared/params.ts:154`, `src/main/index.ts:300`).
- An owner tag in the vault index, so that orphaned committed entries can be found.
- Discarding a response body that arrives after sign-out.
- A start throttle, if U-16's answers show per-app limits bind.
- Renaming the User-Agent for signed-in reads.

### As built

The lead writes this section at integration, from the integrated diff. It records each day-one result as it arrives.
