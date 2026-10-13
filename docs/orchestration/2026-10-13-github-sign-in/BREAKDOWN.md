# GitHub sign-in work breakdown

## Rules for every unit

Every unit follows the run's common brief:
- **Isolation.** Its own worktree and branch, and only the files it owns.
- **Test-first.**
  - A new behaviour test is red on the unchanged code.
  - A regression pin is green on the unchanged code, committed before the change, and red under a named mutation.
  - Every guard has a removal proof.
- **Fixtures.** Marked "built from E-01/E-02/E-15 shapes, not a capture".
- **Markers.** Generated at runtime. No token-shaped literal is committed, and nothing is copied from the research captures.
- **No network.** Tests use the injected fetchers and the loopback fake, and `globalThis.fetch` is never stubbed except in the one late-binding test.
- **Commits.** One five-part commit per task.
- **Architecture notes.** `docs/ARCHITECTURE.md` is staged with every `src/` commit. U0 opens a "GitHub sign-in" paragraph; each unit appends only its own sentence; the lead resolves line conflicts on integration.
- **Node.** `export PATH=/versions/node/v24.21.0/bin:$PATH`.
- **Proof.** Anything that needs `safeStorage`, Electron or the native helper counts only from Windows CI on the exact head (T-10).

## Before U0 (lead)

- **Commit the research.** Commit both research projects with their ledgers (`git add -f docs/research/2026-10-13-github-sign-in-design/research/raw/.fetches.jsonl`). Confirm that `handoff.mjs` exits 0 with each project directory as the working directory (D-5). The design project is untracked at `d0df7e9`.
- **OF-1 (resolved).** Round 4 collected "Building a CLI with a GitHub App" (E-21, 1 credit, approved by the lead in RUN.md). U1 is briefed with spec 5.1-5.2: a form-encoded body with `Accept: application/json` and no query string. The refresh's placement is an inference that DO-1 and DO-2 check.
- **Record the run.** Commit REQUIREMENTS.md, DECISIONS.md, this file and the spec, then write the briefs.

## U0 frozen contracts (lead, before any builder starts)

### `src/main/github-app.ts` (new; values stay empty until UD-1, then U9)

```ts
/** MoonAliza's GitHub App (UD-1): public identifiers, not credentials. No client secret exists for this app's use (F-20). */
export const GITHUB_APP: Readonly<{ clientId: string; installUrl: string }> = { clientId: '', installUrl: '' };
export const DEVICE_CODE_URL = 'https://github.com/login/device/code';
export const TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const DEVICE_PAGE_URL = 'https://github.com/login/device';
export const USER_URL = 'https://api.github.com/user';
/** Flips to false only with UD-6's "turn expiry off" option (spec 3.1, DC-3). */
export const REQUEST_OFFLINE_ACCESS = true;
export const isConfigured = (app: { clientId: string; installUrl: string }) => app.clientId !== '' && app.installUrl !== '';
```

This file has no Electron import, because the e2e imports it.

### `src/main/github-credential.ts` (new, types and three constants only)

```ts
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export const lateFetch: Fetcher = (url, init) => globalThis.fetch(url, init);
export interface GitHubSend { response: Response; authenticated: boolean }
export interface GitHubCredential {
  /** Spec 3.4: signed out calls request(undefined) once; signed in pre-checks, decrypts per request, dispatches synchronously, applies the 401 rule. */
  send(request: (authorization: string | undefined) => Promise<Response>, signal: AbortSignal): Promise<GitHubSend>;
}
export const SIGNED_OUT: GitHubCredential = { async send(request) { return { response: await request(undefined), authenticated: false }; } };
/** Every error send() originates; G-19 parses each in GitHubErrorCodeSchema (DC-7). U5 originates only these; the request's own
 *  rejection and a local vault error on the access token pass through unchanged, and the reader maps them as today (spec 3.4, GS-6). */
export const CREDENTIAL_ERRORS = ['GITHUB_SIGN_IN_REQUIRED', 'GITHUB_RENEWAL_UNAVAILABLE', 'GITHUB_RATE_LIMIT'] as const;
export type CredentialError = (typeof CREDENTIAL_ERRORS)[number];
```

### `src/shared/github-account.ts` (new; re-exported from `src/shared/index.ts`)

```ts
export const GitHubLoginSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/);
export const GitHubUserCodeSchema = z.string().max(32).regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/);
export const GitHubAttemptOutcomeSchema = z.enum(['cancelled', 'expired', 'restart', 'denied', 'disabled', 'client-rejected',
  'grant-unsupported', 'email-unverified', 'rate-limited', 'start-failed', 'failed']);
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

### `src/shared/params.ts` (five `MethodSpec` entries, after `research.purge`)

```ts
const githubAccountResult = z.object({ account: GitHubAccountStatusSchema }).strict();
'github.account.read':  method(Empty, githubAccountResult, 'main', 'read', 'authenticated'),
'github.signIn.start':  method(Empty, githubAccountResult, 'main', 'network', 'user-confirmed'),
'github.signIn.cancel': method(Empty, githubAccountResult, 'main', 'lifecycle', 'authenticated'),
'github.signOut':       method(Empty, githubAccountResult, 'main', 'write', 'user-confirmed'),
'github.open':          method(z.object({ target: GitHubOpenTargetSchema }).strict(), z.object({ opened: z.literal(true) }).strict(), 'main', 'native', 'user-confirmed'),
```

Until U6, these methods answer `NOT_IMPLEMENTED` (`src/main/index.ts:301`).

### `src/main/vault.ts` (`:13` and `:135` only)

```ts
purpose: 'inference' | 'provider-test' | 'research' | 'provision' | 'github';
if ((binding.purpose === 'provider-test' || binding.purpose === 'research' || binding.purpose === 'github') && binding.expiresAt > Date.now() + 30_000) throw new Error('CREDENTIAL_CAPABILITY_DENIED');
```

`src/shared/host.ts` is not changed: its purposes are the engine's `network.request` purposes, and a typecheck test keeps `'github'` out of them (spec 3.8, DC-8).

### Frozen names (no code in U0)

- **Reader reasons.** U3 adds them to `GitHubErrorCodeSchema`: `GITHUB_SIGN_IN_REQUIRED`, `GITHUB_RENEWAL_UNAVAILABLE`, `GITHUB_PERMISSION_MISSING`, `GITHUB_FORBIDDEN_SIGNED_IN`, `GITHUB_NOT_FOUND_SIGNED_IN`.
- **Grant context IDs.** `github:read:<uuid>`, `github:refresh:<uuid>`, `github:user:<uuid>`.
- **Account file.** `<userData>/github/account.json`.
- **User-Agent for OAuth requests.** `MoonAliza-github-sign-in`.
- **Error codes.** No public code is added. The methods throw only `NOT_IMPLEMENTED`, `ENCRYPTION_UNAVAILABLE` and `NOT_FOUND`, plus the existing `ENGINE_UNAVAILABLE` precondition.
- **Store error.** `ReplaceFailure`'s message is `ACCOUNT_STORE_FAILED`, never a `GITHUB_` code (DC-7).

### Owned by one unit, so not frozen (listed for review)

- **U1, `src/main/github-oauth.ts`.** `WireLimits`, `DeviceCodeResult`, `IssuedTokens`, `TokenResult`, `oauthRequest`, `rateLimitWait`, `headerSafeToken`, `requestDeviceCode` (with its `offlineAccess` parameter), `requestToken`, `fetchLogin` (spec 3.5). Also `tests/fixtures/fake-github-oauth.ts`: the fake, plus `fetcherFor(fake)`, `markers()` and the per-request record (spec "Tests the builders owe"). U5 and U7 import the fixture read-only.
- **U2, `src/main/github-account-store.ts`.** `GitHubAccount` (with its in-memory `signInId`, GS-10), `ReplaceFailure`, `ClearResult` (`'durable'`, GS-11), `GitHubAccountStore` with `replace(…, kind, admit)` (a sign-in's rollback under the same lock, GS-3), `setLogin(signInId, login)` and `openedAppChanged()` (spec 3.6), with the write orders of spec 4.3.
- **U3, `src/main/github.ts`.** The constructor `(fetcher = fetch, credential = SIGNED_OUT, redact?)`, plus the texts in `src/shared/github.ts`.
- **U5, `src/main/github-signin.ts`.** `GitHubLimits`, `GITHUB_LIMITS`, `GitHubSignInDeps` (with the `config.offlineAccess` test seam, GS-5), `GitHubSignIn` (spec 3.7).

## Units

| Unit | Description | Owns | Depends on | Wave | Pre-mortem |
|------|-------------|------|------------|------|------------|
| U0 | Contracts (lead): the code blocks above. Tests: the exact route list gains five methods; strict params and results; no method accepts `token`, `secret`, `deviceCode`, `device_code` or `secretRef`; every DTO member rejects `accessToken`, `refreshToken`, `deviceCode`, `secretRef`, `verificationUri`, `interval`, `clientId`; `github.open` rejects `{ url }`; a contract case for every state, including pending with and without an account, with `committed` true and false, and signed-out with each `ended` value and `signOutIncomplete`; a `github` grant at `Date.now() + 60_000` denied and one at `+ 30_000` allowed (DC-14); the host purposes exclude `github` (typecheck, DC-8); the constants rules, `REQUEST_OFFLINE_ACCESS` included (DC-3); the token-literal and `client_secret` scan | `src/main/github-app.ts`, `src/main/github-credential.ts`, `src/shared/github-account.ts`, `src/shared/index.ts`, `src/shared/params.ts`, `src/main/vault.ts` (`:13`, `:135`), `tests/contracts.test.ts`, `tests/vault.test.ts`, `tests/github-app-constants.test.ts`, `tests/github-token-literals.test.ts`, ARCHITECTURE.md paragraph heading | research commit, Mandate | 0 | (1) A DTO change after builders start reworks U4 and U5: freeze here; change only by a lead note to every unit. (2) A purpose without its cap leaves `github` grants unbounded: the vault cap test, red when `:135` is left alone, with a 60 s margin so it is not flaky (DC-14). (3) The `client_secret` scan trips on a comment: comments write "client secret" with a space |
| U1 | Wire client: the exact requests; the body placement and `Accept` header of spec 5.1-5.2 (E-21) in `oauthRequest`; `scope` only when `offlineAccess` (DC-3); bounded body reads; parsing by media type, with parse errors replaced without `cause` (DC-9); the one classifier (spec 5.3, rate limits first, `error` at any status; `unusable` carries its status, GS-2); `rateLimitWait` with its 1 s floor (DC-12); `headerSafeToken`; step-1 and token shape checks with the exact `verification_uri`; `fetchLogin` keeping only `login`, with the 5.1 request options (GS-8). Plus the loopback fake | `src/main/github-oauth.ts`, `tests/github-oauth.test.ts`, `tests/fixtures/fake-github-oauth.ts` | U0 | 1 | (1) `application/json; charset=utf-8` not matched turns every success into transient: compare before `;`, case-insensitively, tested. (2) Checking `ok` before `error` makes a 400 `bad_refresh_token` transient forever (R2-5): every code is tested at 200 and non-200, and the guard is proved. (3) A both-ways fake hides a wrong placement: the placement pin; the device flow follows E-21, and DO-1 and DO-2 check the refresh's. (4) Real-timer waits exceed vitest's 15 s (`vitest.config.ts:5`): request timeouts shrunk to about 50 ms in real time; poll waits are the service's injected `sleep` |
| U2 | Account store: the strict file with at most 8 retired refs (DC-10); `open`, `openedAppChanged`, `references` and `finishStartup` (never throw; client-ID rule; D-7; DC-15); `replace` with the spec 4.3 order and `ReplaceFailure` (`ACCOUNT_STORE_FAILED`); a sign-in's rollback inside `replace`, under the same lock (DC-11, GS-3); a refresh copying the login under the lock, and `setLogin` by `signInId` (GS-10); `clear` with its synchronous prologue, its "a newer sign-in won" rule (DC-4), its durability result (DC-6), and step 4 keeping refs whose removal failed (GS-11); serialized per path | `src/main/github-account-store.ts`, `tests/github-account-store.test.ts` | U0 | 1 | (1) The live pointer set before commit makes concurrent reads fail (the vault refuses staged refs, `vault.ts:132`): a test reads during `replace`. (2) Commit before the file write, or retiring before commit, opens a crash window: each crash point is reopened and reconciled in a test. (3) An `open()` that throws on a bad file stops startup (`index.ts:320`): missing, invalid, oversized and extra-key cases. (4) A `clear` racing `replace` leaves an orphan, resurrects the account, or wipes a sign-in admitted after its prologue: interleaving tests with a gated vault stub. (5) A writer exceeds the 8-ref bound and its own reader drops the account: four replaces with failing step-7 writes, then a reopen. (6) A rollback run as a separate locked call lets a queued refresh write in between, and the file ends naming removed refs: the queued-writer store test (GS-3) |
| U3 | Reader, reasons and model text. Commit 1 (tests only, green on `0815f42`): the signed-out init pin (deep equality without `signal`, the exact key list, and Stop aborting `init.signal`, DC-13) and today's classification. Commit 2: the credential seam, the signed-in classification of spec 7.2 with the bounded 403 body read, the five reasons with their `githubFailure` texts (spec 7.4), and the tool description and prompt strings (`src/engine/application.ts:68`, `:375`, `:376`). Commit 3: pre-redaction before the cut (X-3), revertable alone | `src/main/github.ts`, `src/shared/github.ts`, `src/engine/application.ts` (lines 68, 375 and 376 only), `tests/github-read.test.ts`, `tests/github-text.test.ts` | U0 | 1 | (1) A tidy-up of `request()` changes one byte of the signed-out request and the e2e hits `UNEXPECTED_AUTH`: the pin lands first, and the signed-out branch passes the literal init object. A deep-equal pin alone would miss a dropped Stop signal (DC-13). (2) A reason missing from the enum collapses to `GITHUB_UNAVAILABLE` without a word (`engine.ts:60-61`): G-19 parses every member of `CREDENTIAL_ERRORS` and the five reasons, and is proved red here by removing a member (DC-7). (3) The 403 body read leaves the stream locked and the `finally` at `:32` throws: read through a reader, then cancel and release it. (4) A text overclaims a cause or a fix: the forbidden-phrase test, plus the V3 phrases required |
| U4 | Renderer: `GitHubAccountPanel` (four states, the confirmed-pending view, the three `ended` texts and the incomplete sign-out text; the 1 Hz poll only while pending; close calls cancel only while pending and not `committed` (DC-5); Sign in disabled in flight), `github-text.ts` (every text of spec 8.2 and 8.3), the sidebar button and modal, the shortcut guard, the footnote, the cloud-dialog clause, the F-26 sentence | `src/renderer/GitHubAccountPanel.tsx`, `src/renderer/github-text.ts`, `src/renderer/App.tsx`, `src/renderer/styles.css`, `tests/github-account-panel.test.tsx` | U0 (live use needs U6) | 1 | (1) The poll outlives pending or unmount, or a remount calls `start` and spends a device code (U-16): invokes counted by method under fake timers. (2) Outcome texts drift from the enum: a test iterates the enum. (3) The new button's name collides with an existing locator: `tests/workbench.test.tsx` run, exact names. (4) The sign-out text implies revocation: forbidden words "revoked" and "erased". (5) Closing the dialog after GitHub confirmed loses the login: a close with `committed: true` makes no invoke (DC-5) |
| U5 | Lifecycle service: both machines and the projection; start (the scope from `config.offlineAccess`, GS-5), poll loop, commit point (admitted by the sign-out count, DC-4; a failed commit rolled back by the store, DC-11, GS-3) and login read (`setLogin` by `signInId`, GS-10); Cancel and start as no-ops from F4 (DC-5); `send()` with the pre-check (a still-valid token sent during a hold, GS-4), `withAccess` (synchronous dispatch, the `stale` path, one re-grant), the 401 rule with the C-6 budget, the fresh-token guard (DC-2) and no refresh under 30 s, held and counted (GS-1); the single-flight refresh with the doubling hold, the refresh error classes and the clear cases (X-9, malformed 2xx, DC-1; the `unusable` count, GS-2; local vault failures held, GS-6); the `ended` reasons and `signOutIncomplete` (DC-1, DC-6, DC-15); `accountChanged`; sign-out; `close()`; `openTarget`. `send()` originates only `CREDENTIAL_ERRORS`; the request's own rejection and a local vault error on the access token pass through unchanged (GS-6) | `src/main/github-signin.ts`, `tests/github-signin.test.ts`, `tests/github-signin-refresh.test.ts` | U1, U2 (U3 for nothing at build time) | 2 | (1) A refresh on the read's signal is aborted by Stop after GitHub rotated the pair, silently signing the user out: refresh test 11, with the guard proof. (2) Waiters that do not race `accountChanged` send a fresh token after sign-out: refresh test 12 counts requests and times the rejection. (3) Grants computed from the injected `now()` are refused by the vault, which uses `Date.now()`: every grant uses `Date.now() + grantMs`, tested under a clock far from real time. (4) A rate-limited refresh re-sent on every read (judge 3's fatal flaw in minimal): refresh test 6, L-13. (5) Two refreshes in one call (a pre-check, then a 401): refresh test 10, C-6. (6) A 401 on a just-refreshed token wipes a valid pair: refresh test 10's fresh-token cases (DC-2). (7) A refresh error that is not `bad_refresh_token` holds forever: refresh test 4 (DC-1). (8) A refresh or app clear refuses a confirmed sign-in: device test 14 (DC-4). (9) A token GitHub refuses at once costs a refresh on every read and never clears: refresh test 10's refused-token case (GS-1) |
| U6 | Main wiring: construction after `:57`; the reconcile set; `finishStartup`; the admit reader with credential and `redact`; the five `handle()` cases after `external.open`; `before-quit`. Source pins in `tests/github-main-wiring.test.ts`. The reason scan of `throw` sites in `src/main/github*.ts` (DC-7) | `src/main/index.ts`, `tests/github-main-wiring.test.ts`, `tests/github-reason-scan.test.ts` | U3, U5 | 3 | (1) Code inside the pinned spans (`infer()` to `readGitHub(`, or the `profile.test` case) turns three unrelated pins red: the cases go after `:300`, the construction after `:57`, and all three pin files are run. (2) A captured `fetch` lets the e2e reach the real github.com: `fetcher: lateFetch` pinned. (3) The review reader at `:293` gets the credential: pinned unchanged. (4) `before-quit` awaits before aborting the flow: the pin requires `github?.close()` before the abort loop |
| U7 | The token invariant through the engine (T-6): real vault (fake cryptor), real store file, service against the fake, reader with credential and `redact`, engine `Application` over a real `Store`; the journey; scans of `state.sqlite`, `-wal`, `-shm`, the account file, the vault directory, every DTO and IPC result, every engine message, event and `infer()` message, tool output and `process.env`, with positive controls and mutation proofs; the walker over every rejection's `message` and `cause` chain (DC-9); the static guard on the new modules and the panel | `tests/github-signin-invariants.test.ts` | U3, U5 | 3 | (1) A marker hidden by escaping makes the scan pass falsely: hex markers plus positive controls (repository text in the database or WAL; login in the account file). (2) The WAL is not checkpointed: `-wal` and `-shm` scanned, and each scan shown red under a planted-marker mutation |
| U8 | Windows e2e: journey A always; journey B when configured (spec "Tests the builders owe"; its forced 401 comes at least 30 s after the refresh, DC-2, GS-1) | `e2e/github-sign-in.spec.ts` | U4, U6; journey B needs U9 | 4 | (1) `shell.openExternal` cannot be replaced from `app.evaluate`, and a browser opens on CI: the first assertion proves the stub, and otherwise the journey skips the two clicks and says so. (2) An unrouted GitHub URL reaches the real network: the patch throws on anything unrouted, and the run asserts none. (3) Each mistake costs a Windows CI round: reuse `e2e/github-reading.spec.ts` and `e2e/anthropic.spec.ts` patterns; the lead reads the spec before pushing. (4) A Linux pass proves nothing: merge only on a green Windows run of the exact head |
| U9 | Constants (lead): the client ID and the install URL copied from the app's public page, once UD-1 is answered | `src/main/github-app.ts` (values only) | U0, UD-1 | any, before U8's journey B | (1) A typed or derived install URL 404s for users (R2-8): pasted from the public page, opened once (DO-14), shape-tested. (2) A client secret pasted into the constant would ship: the shape test and the `client_secret` scan refuse it |
| Lead | Integration review (spec, invariants, mutation, breaker in real Electron on Windows CI); fixes for every S1 and S2. Docs: the spec's "As built"; `docs/specification/github-url-reading.md` (`:1`, `:3`, `:5`, `:9`, `:11`, `:13`; `:9` and `:11` rewritten for the signed-in path and pointing to `docs/specification/github-sign-in.md`, DC-16); ARCHITECTURE.md (line 38 corrected, the paragraph, the User-Agent names at `:48`); AGENTS.md (the D-2 invariant row and the token row's evidence); README (`:7`, `:22`, a sign-in paragraph, the F-26 sentence); HANDOFF.md:56; `docs/development-status.md`; the plan's correction notes at `research-jobs.md:426` and `:491` (UD-2) and "Recorded for later"; RUN.md; the DAY-ONE list | docs only | U0-U8 | 5 | (1) The as-built notes drift from the code: written from the integrated diff and checked by the spec reviewer. (2) A doc states a GitHub behaviour the corpus marks "not stated": each such sentence names its DO item. (3) A doc says sign-out revokes, or deletion erases: the F-12 and UD-3 wording quoted |

## Integration and gate

- **Order.**
  1. The research commit, then U0.
  2. U1, U2, U3 and U4 in any order; they own disjoint files.
  3. U5.
  4. U6 and U7.
  5. U8.

  U9 lands whenever UD-1 is answered, before U8's journey B. Each unit is one commit series, cherry-picked onto `main-axuse` and passed through the commit gate.
- **Revert test.**
  - U6 is the only commit that wires anything, so U0 through U5 each revert alone.
  - U3's third commit (X-3) reverts alone.
  - U9 reverts to "not configured".
- **Reason timing (F-16, DC-7).** The five reasons enter `GitHubErrorCodeSchema` in U3's commit 2, which produces three of them and passes the other two from its fake credential. G-19 parses `CREDENTIAL_ERRORS`, frozen in U0, so the codes U5 throws are proved in the enum before U5 exists. U6's reason scan then checks every `throw` site once U3 and U5 are integrated.
- **Linux gate.**
  - `npm run typecheck`, `npm run lint` and `npm run build` exit 0.
  - The full vitest JSON run has no failure outside the 74 baseline names (`/home/user/task5-handoff/baseline-failing.json`), no file without results, and `numTotalTests` compared.
  - The three source-pin files and `tests/workbench.test.tsx` are run explicitly.
- **Windows CI.** Green on the exact head: unit tests, the existing e2e journeys including the unchanged `e2e/github-reading.spec.ts`, and `e2e/github-sign-in.spec.ts`.
  - With UD-1's recommended answer, journey B runs before the merge.
  - If the Mandate picks "register later", journey B is a visible skip and a release gate.
- **Review.** Every S1 and S2 is fixed and re-reviewed, and the PR is mergeable with no thread waiting.
- **Day-one checks.** DO-1..DO-16 come before the first release that carries the feature, not before the merge (A-4).

## Traceability (requirement, unit, test)

Every requirement row maps to the unit that builds it and the test file that proves it. Spec "Tests the builders owe" lists the cases.

| Requirements | Unit | Tests |
|---|---|---|
| F-1, F-18, F-25, F-26 (dialog, install text, disclosures, F-26 sentence) | U4 | `tests/github-account-panel.test.tsx`; e2e journey A and B (U8) |
| F-2, F-3, F-4 (wire: requests, classifier, shapes, `GET /user`) | U1 | `tests/github-oauth.test.ts` |
| F-2, F-3, F-4, F-10 (flow: start, polls, commit, Cancel, Sign in again) | U5 | `tests/github-signin.test.ts` |
| F-5, F-10 (account file and write orders; a sign-in's rollback under the same lock, GS-3; the login across a refresh, GS-10) | U2 | `tests/github-account-store.test.ts` (rollback, concurrency); device tests 15 and 17 (U5) |
| F-6, F-7, F-8, F-9 (refresh, failures, 401 rule, lifecycle) | U5 | `tests/github-signin-refresh.test.ts` |
| F-11, F-12 (sign-out) | U5, U2, U4 | refresh test 12, device test 16, the store durability tests (the GS-11 case included), the panel's sign-out text |
| F-13, F-14, F-15, F-17 (signed-in reads, classification, texts, model text) | U3 | `tests/github-read.test.ts`, `tests/github-text.test.ts` |
| F-16 (reasons) | U3, U6 | `tests/github-text.test.ts` (G-19), `tests/github-reason-scan.test.ts` |
| F-19, F-22 (pages, IPC) | U0, U5, U6 | `tests/contracts.test.ts`, device test 13, `tests/github-main-wiring.test.ts` |
| F-20, F-23 (constants, registration) | U0, U9 | `tests/github-app-constants.test.ts`, `tests/github-token-literals.test.ts`; DO-11, DO-14 |
| F-21 (status DTO) | U0, U5 | `tests/contracts.test.ts`, device test 12 |
| F-24 (transport) | U5, U6 | refresh test 17, the wiring pin |
| F-27 (out of scope) | lead review | the integration review |
| S-1, S-2, S-6 (token invariant, redaction, separate credentials) | U7, U3, U5 | `tests/github-signin-invariants.test.ts`, the read straddle test, refresh test 19 |
| S-3 (grants) | U0, U5 | `tests/vault.test.ts`, refresh tests 9 and 12 |
| S-4, S-5 (destinations, scope) | U1, U3 | the oauth shape pins and the `fetchLogin` pins (GS-8), the read twin and reruns |
| S-7 (crash safety) | U2 | the store crash-window tests |
| S-8 (renderer network-less) | U6, U7 | the wiring pin (`shell.openExternal` gets only `openTarget`), the static guard on the panel |
| T-1, T-2 | all | the ground rules; `tests/fixtures/fake-github-oauth.ts` (U1) |
| T-3, T-4, T-5, T-6, T-7, T-8 | U5, U5, U3, U7, U0, U6 | the files above |
| T-9, T-10 | U8 | `e2e/github-sign-in.spec.ts` on Windows CI |
| A-1, A-2, A-3 | lead | the Linux gate and Windows CI on the exact head |
| A-4 | lead (UD-1 owner) | DO-1..DO-16, recorded in the design project's DISCOVERY.md |
| D-1..D-5 | every unit (D-1), lead | the lead's docs unit and the research commit |
