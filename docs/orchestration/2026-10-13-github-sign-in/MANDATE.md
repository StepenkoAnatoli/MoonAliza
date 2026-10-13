# Mandate: GitHub sign-in

**Status: approved.** Presented 2026-10-13; the user replied the same day (below). The task is architectural and AGENTS.md carries no standing auto-build mandate, so the build waited for this reply.

## What was researched and what it proved

The research spent 21 Firecrawl credits across two Research-Kit projects. Both pass `preflight` and `handoff`:
- `docs/research/2026-10-12-app-sign-in`: 8 credits.
- `docs/research/2026-10-13-github-sign-in-design`: 13 credits, E-01..E-21, 15 unknowns CLOSED and 1 KNOWN-UNKNOWN. A refute-first verifier checked every round.

What it proved:
- **Device flow, no client secret:** a GitHub App can sign a desktop user in with the device flow and no client secret (E-01, E-03, E-21).
- **Read-only access:** **Contents: Read-only** plus **Metadata: Read-only** covers every read `read_github` makes (E-05, E-06, E-07).
- **Token lifetimes:** user tokens expire after 8 hours, and a refresh token lasts 6 months (E-01, E-02).
- **Refresh without a secret:** the first refresh needs none for a device-flow token (E-02 l.79). Whether every later refresh is also exempt is not stated, so it is day-one check DO-1.
- **Installation:** the token reaches only repositories where the app is installed. A private repository it cannot reach answers 404 (E-15).
- **Sign-out:** an app without a secret cannot revoke a token. The user revokes it in GitHub's settings (E-17).
- **Not stated anywhere:** whether GitHub caps device-flow sign-ins per app (U-16, a product risk).

## Design

The spec is `docs/specification/github-sign-in.md`; its decision records are in `DECISIONS.md` and its requirements in `REQUIREMENTS.md`. Three designs were judged, and the lifecycle-first design won. Two critic rounds followed, with no S1 or S2 left. In outline:
- **Main process:**
  - a lifecycle service with single-flight refresh and holds after failures;
  - the device-flow wire client;
  - an account store that keeps both tokens as separate vault values, so the existing exact-value redaction catches them.
- **Interface and errors:**
  - five request/response IPC methods;
  - no new push channel: the dialog polls;
  - no new public error codes;
  - five new `read_github` reasons.
- **The token never reaches** the engine, the database, events, logs, the renderer, argv or a file in clear. Byte-scan tests prove it.
- **Fixed-limit tests** run against a loopback fake GitHub. A Windows e2e journey runs when the app is configured.

Work breakdown (`BREAKDOWN.md`): U0 contracts (lead), U1 wire, U2 store, U3 reader and reasons, U4 renderer, U5 lifecycle service, U6 main wiring, U7 the token invariant through the engine, U8 Windows e2e, and U9 the app's public constants (lead, after UD-1).

**Not confirmed until the app is registered:** the day-one checks (`USER-DECISIONS.md`, "Day-one checks"). None of them blocks the merge. All of them come before the first release that carries the feature.

## Decisions for the user

1. **UD-1, the GitHub App: only you can register it.**
   - Recommended: register it on your account. Go to GitHub Settings > Developer settings > GitHub Apps > New GitHub App.
   - Name: MoonAliza, or the nearest available name of at most 34 characters.
   - Homepage URL: https://github.com/StepenkoAnatoli/MoonAliza.
   - No callback URL and no setup URL. Turn off *Request user authorization during installation*.
   - Keep *Expire user authorization tokens* on, and turn on *Enable Device Flow*.
   - Webhook: turn *Active* off.
   - Repository permissions: **Contents: Read-only** and **Metadata: Read-only**, nothing else.
   - Where it can be installed: *Any account*.
   - Do **not** generate a client secret.
   - Then send me the app's **Client ID** and the **install URL** from its public page. Both are public identifiers, not credentials.
   - Until then, the build can ship with the sign-in shown as "not configured in this build".
2. **UD-2, scope.**
   - Recommended: **read-only now**. The research collector keeps its pasted token, and the plan gets a correction note.
   - The write path (self-unblocking pull requests) is designed as its own task. Adding permissions later needs each installing owner's approval (E-19).
3. **UD-3, private repository text.**
   - Recommended: **like local project files**. It is allowed in any conversation where you paste the URL. A local-only conversation sends it nowhere. A cloud-allowed conversation sends it to the selected provider. Tool results stay in the conversation's history and search.

## Decisions the lead takes unless you overrule them

- **UD-4:** while signed in, every read sends the token, with no unauthenticated fallback.
- **UD-5:** Node's global fetch, as `read_github` uses today. Windows proxy and certificate behaviour is recorded as unverified.
- **UD-6 (only if DO-1 fails):** sign in again when the access token expires, about every 8 hours.

## Merge policy, budget, stop-list

- **Merge:** each unit merges under the AGENTS.md merge checks on the exact head:
  - the pinned Linux gate equals the baseline;
  - Windows CI is green;
  - every S1 and S2 is fixed and re-reviewed;
  - no review thread is waiting.
- **Budget:** the build needs no Firecrawl credits. The day-one checks need the registered app and your GitHub account.
- **Stop-list:**
  - scope beyond GitHub read-only sign-in;
  - any write permission;
  - shipping a client secret;
  - deleting user data;
  - a force-push;
  - sending anything to GitHub with your account without asking.

## Reply

Reply in one of three ways:
- **GO MERGE**: build, review and merge.
- **GO**: build and open the PR, but hold the merge.
- **STOP AFTER DESIGN**: build nothing.

Add your answers to UD-1..UD-3 to the reply. Any other reply is a correction to incorporate.

## The user's reply (2026-10-13)

> GO MERGE, read-only, private text like local files

- **GO MERGE:** build, review and merge each unit under the merge policy above.
- **UD-2:** read-only now. Contents and Metadata are read-only; the research collector keeps its pasted token; the plan gets a correction note; the write path is its own task.
- **UD-3:** private repository text is treated like local project files (as recommended above).
- **UD-1 is not answered yet:** the app is not registered. The build follows UD-1's third option: the sign-in ships with empty constants and says it is not configured in this build. U9 fills in the client ID and install URL when the user sends them, and the configured e2e journey (journey B) and the day-one checks wait for that.
- **UD-4..UD-6:** taken as recommended, as stated above; the user did not overrule them.
