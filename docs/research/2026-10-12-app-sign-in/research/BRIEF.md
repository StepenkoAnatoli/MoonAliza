# Brief - Can the MoonAliza Electron desktop app sign users in to GitHub, to Claude with a Claude.ai subscription account, and to OpenAI Codex with Sign in with ChatGPT - or must third-party apps use API keys

Reviewed by: agent

Sources: `research/` (8 captures, E-01..E-08, all retrieved 2026-10-12 with `firecrawl-cli`,
complete, chain of 8 ledger entries; one 7-page run and one 1-page run, 8 Firecrawl credits in
total). Every claim below names the E-row that carries it; each E-row's URL and verbatim quotes
are in `research/EVIDENCE.md`.

**This is the phase-1 to phase-2 handoff. Gate: PASS** (`preflight` exit 0, `handoff` exit 0).
Ten unknowns: eight CLOSED, two KNOWN-UNKNOWN with day-one steps (U-9, U-10). The gate's eight
warnings are all corroboration warnings (each answer rests on one owner's pages). They are
accepted: each question asks what that owner itself allows, and a second, non-owner source cannot
grant a permission the owner did not.

Whoever you are - another agent, a different model, or a person - read this file first. If
something here is not enough to build from, name the missing fact rather than guessing it.

## Intent

The user asked "Can we make the app be able to login to GitHub/codex/Claude?" Three sign-ins,
three purposes (contract: `research/DISCOVERY.md`, "Build intent"):

1. **GitHub**, so the agent can read the user's repositories, private ones included. Today
   `read_github` (`src/shared/github.ts`) reads public repositories only, with no credentials.
2. **Claude**, so the user's Claude.ai Free/Pro/Max subscription pays for model calls instead of
   an Anthropic API key (today: an `anthropic` profile with a credential in the vault,
   `src/shared/contracts.ts:24-26`, `src/main/index.ts:50`).
3. **OpenAI/Codex**, so the user's ChatGPT plan pays for model calls the way Codex CLI's "Sign in
   with ChatGPT" does, instead of a Platform API key.

## What we verified

### Answer per service

| Service | Third-party desktop sign-in for this use | Evidence |
|---|---|---|
| GitHub | **Allowed**, and documented for desktop apps | E-01, E-02, E-03, E-08 |
| Claude (Claude.ai subscription) | **Not allowed** - API keys required; one carve-out (the unmodified Claude Code binary) | E-04, E-05 |
| OpenAI (Sign in with ChatGPT) | **Not stated** - documented only for OpenAI's own clients; terms neither permit nor expressly forbid it | E-06, E-07 |

### GitHub (U-1..U-4, U-10)

- **Flow.** Both OAuth apps and GitHub Apps support the OAuth device flow (RFC 8628). It must be
  switched on in the app's settings, otherwise the token request fails with
  `device_flow_disabled`, and it needs only the client ID: "The `client_secret` is not needed for
  the device flow." (E-01). For GitHub Apps, GitHub names desktop apps as device-flow users: "CLI
  tools, simple Raspberry Pis, and desktop applications should use the device flow." (E-03).
  Device and user codes expire after 900 s; poll no faster than `interval` (default 5 s), and each
  `slow_down` adds 5 s (E-01, E-03). The alternative is the web flow with a loopback redirect
  (`http://127.0.0.1:<port>/path`, any port; use 127.0.0.1 or ::1, not `localhost`). GitHub
  calls it "useful for native applications running on a desktop computer", and PKCE S256 is
  "strongly recommended", but the code exchange requires the client secret (E-01, lines 86-110,
  394-404).
- **Private repositories.** For an OAuth app the only scope is `repo`, which grants full
  read *and write* to public and private repositories (and some organization resources). The
  scope table lists no read-only scope for private code (E-02). A GitHub App has no scopes: "A
  GitHub App user access token only has permissions that both the user and the app have.", on
  repositories both can reach (E-03), so read-only access to code is possible. The captured pages
  do not name the permission that covers repository contents: confirm it on GitHub's GitHub App
  permissions page when registering the app.
- **Token lifetimes.** Expiring tokens last 8 hours (`expires_in` 28800), and the refresh token
  lasts 6 months (`refresh_token_expires_in` 15897600). For GitHub Apps this is the default but
  "currently an optional feature and are subject to change" (E-03). For OAuth apps it is opt-in,
  per app or per sign-in with `offline_access`; otherwise the token is long-lived (E-01).
  Refreshing a device-flow token needs no client secret (E-01, line 341). At most ten tokens per
  user/app/scope, and ten new ones per hour; beyond that GitHub revokes the oldest (unused first)
  or prompts the user to re-authorize (E-01).
- **Rate limits.** Device flow: 50 code submissions per hour per app (E-01). API calls made with
  the user's token count against that user's 5,000 requests/hour, shared with every other app
  and PAT acting for them (15,000 for apps owned or approved by a GitHub Enterprise Cloud
  organization). Secondary limits: 100 concurrent requests, 900 points/minute per REST endpoint,
  80 content-creating requests/minute and 500/hour, 2,000 OAuth token requests/hour. Exceeding one
  returns 403/429; honour `retry-after`. These "are subject to change without notice" (E-08).

### Claude (U-5, U-6)

- **Not allowed.** Anthropic's Claude Code legal and compliance page: "Anthropic does not permit
  third-party developers to offer Claude.ai login into their own applications, or to route
  requests through Free, Pro, or Max plan credentials on behalf of their users", and "developers
  may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a
  Claude account must complete through Anthropic's own flow." Subscription OAuth "is intended
  exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and
  is designed to support ordinary use of Claude Code and other native Anthropic applications."
  Anthropic may enforce "without prior notice" (E-04). The Agent SDK overview says the same,
  "Unless previously approved" (E-05).
- **Required instead.** Products, including those built on the Agent SDK, "should use API key
  authentication through Claude Console or a supported cloud provider" (E-04, E-05), under the
  Commercial Terms of Service (E-05).
- **The one carve-out.** A product may preinstall or run **the unmodified Claude Code binary**.
  The conditions: the Commercial Terms apply; the binary's sign-in methods stay intact; and the
  product does not pay for, resell or intermediate usage, so each end user authenticates with
  their own key or subscription (E-04, lines 33-36). Then: "Nor does it prevent an end user from
  signing in to the unmodified Claude Code binary with their own Claude subscription" (E-04,
  line 64). The product must also keep its own name and branding (E-04 line 38, E-05 line 81).

### OpenAI / Codex (U-7, U-8, U-9)

- **How Codex does it.** "Sign in with ChatGPT for subscription access" or "Sign in with an API
  key for usage-based access". The ChatGPT path is a browser flow that returns credentials to
  Codex over a localhost callback, with an opt-in device-code beta. Tokens refresh automatically
  and are cached in `~/.codex/auth.json` (plaintext) or the OS credential store (E-06). The page
  documents this only for OpenAI's own ChatGPT desktop app, Codex CLI, IDE extension and Codex
  cloud. With an API key, "Codex uses standard API pricing instead of included ChatGPT plan
  credits", and "For general OpenAI API calls, continue to use Platform API keys." (E-06).
- **Terms of Use** (effective 2026-01-01): "You may not share your account credentials or make
  your account available to anyone else". The prohibited uses include "Automatically or
  programmatically extract data or Output" and circumventing "any rate limits or restrictions"
  (E-07).
- **Whether a third-party app may use Sign in with ChatGPT: not stated** on either owner page
  (U-9, KNOWN-UNKNOWN). No permission is inferred from this silence.

## Contradictions and how they were resolved

- **None between sources.** One discrepancy is noted, not resolved: the page requested at
  `openai.com/policies/row-terms-of-use/` (rest of world) names OpenAI OpCo, LLC as the
  contracting party (E-07, lines 24 and 173). It does not change any answer here, but a
  jurisdiction-specific reading should re-check which terms apply to the user.
- **Codex docs moved host.** E-06 was requested at `developers.openai.com/codex/auth`. The
  capture's title is "Authentication | ChatGPT Learn" and its links point to `learn.chatgpt.com`.
  It is OpenAI's own page either way.

## Known unknowns

- **U-9 - OpenAI's position on third-party Sign in with ChatGPT.** Day one, on the collector
  machine: collect (1) the Codex docs index (`learn.chatgpt.com/llms.txt`) and any page on
  third-party clients or a sign-in developer programme; (2) `openai.com/policies/service-terms/`;
  (3) if neither says, ask OpenAI support in writing. Until an owner page says yes, ship OpenAI as
  API key only.
- **U-10 - when GitHub revokes a long-lived OAuth token on its own.** Collect
  `docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation`.
  This is avoidable by using expiring tokens, which the design below does.
- **Not a blocking unknown, but unconfirmed:** the exact GitHub App permission name for read-only
  repository contents. Read it off the app-registration screen when the app is created.

## Decision

- **GitHub: build it.** Register a **GitHub App** (fine-grained, read-only contents, expiring
  user tokens), not an OAuth app, because an OAuth app can only get the read-write `repo` scope
  for private code. Use the **device flow**: GitHub recommends it for desktop apps, and it ships
  no client secret inside the Electron binary. Store the access token and refresh token in the
  existing safeStorage vault, refresh before the 8-hour expiry, and re-run the device flow when
  the 6-month refresh token lapses or a refresh returns `bad_refresh_token`. Budget the agent
  against the user's shared 5,000/hour.
- **Claude: do not build a Claude.ai sign-in.** It is prohibited (E-04, E-05). Keep the Anthropic
  API-key profile. The only compliant subscription route is optional and separate: let the user
  run the **unmodified Claude Code binary**, signing in through Anthropic's own flow and leaving
  its auth methods intact, under the Commercial Terms. It would be a different integration (a
  subprocess tool, not an inference profile), and it needs the product owner's agreement to the
  Commercial Terms first.
- **OpenAI: do not build Sign in with ChatGPT now.** Permission is not stated (U-9). Keep the
  OpenAI API-key profiles. Reopen only if U-9's day-one step finds an owner page permitting it.

## Next steps

1. **First build step:** create the GitHub App registration: device flow enabled, expiring user
   tokens on, read-only repository contents permission, no client secret in the app. Then add a
   main-process device-flow client: `POST https://github.com/login/device/code`, show `user_code`
   and `verification_uri`, and poll `POST https://github.com/login/oauth/access_token` honouring
   `interval`/`slow_down`. Its tests use a fake GitHub on port 0 for `authorization_pending`,
   `slow_down`, `expired_token`, `access_denied` and `device_flow_disabled` (E-01 error table).
   Tokens go to the vault and never to the engine, logs, renderer or files in clear (the repo's
   token invariant).
2. Extend `read_github` to send the user token for private repositories, and map 403/429 with
   `retry-after` to `GITHUB_RATE_LIMIT`.
3. In the provider settings UI, state plainly that Claude and OpenAI use API keys, and why for
   Claude (Anthropic's terms).
4. Run U-9's day-one collection before any OpenAI subscription sign-in work. Decide separately,
   with the product owner, whether the Claude Code subprocess route is wanted.
