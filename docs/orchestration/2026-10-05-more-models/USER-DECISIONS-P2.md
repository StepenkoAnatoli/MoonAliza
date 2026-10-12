# Phase 2: decisions for the user

## Taken by the lead, as recommended (the user may overrule)

The user's instruction of 2026-10-11, "you have full access. continue", covers these; the lead took
each as the design recommended, and records it here so the user can overrule it. Overruling either of
the first two changes the design before the build starts (DR-7, DR-2).

1. **The workspace setting is deferred: only single-workspace Anthropic keys in Phase 2** (DR-7). The
   form and README say to use a key created for a single workspace (E-08 l.52). A multi-workspace key
   needs the `anthropic-workspace-id` setting, which is schema v5 (a `profile_revisions` column), after
   which older Moonzila builds cannot open the database; it is planned with Anthropic's compatible layer
   in Phase 4, or earlier if the user asks.
2. **Thinking replay (Mandate decision 5): append-only within a run, remedy A** (DR-2). Anthropic runs
   that offer tools keep half of the input budget for the run's own steps, so in a long conversation
   they see about half as much earlier history as other providers, even when the model never thinks; a
   run that outgrows the rest stops with a context-limit message instead of trimming its own earlier
   steps. Thinking from earlier runs is never replayed.
3. **One AGENTS.md invariant row is added** (D-2): "Provider state (adapter-owned model output:
   thinking, signatures, raw content blocks) lives only in a run's memory: never in the database,
   events, search index, renderer or logs, and never sent to a kind that does not own its format". It
   only narrows what the code may do. The later phase that persists state must change this row, and
   that change comes back to the user.

## Under the Mandate stop-list

| Stop-list item | This design |
|----------------|-------------|
| Scope beyond the task statement | Inside Phase 2 as stated ("the per-message provider-state slot, a per-kind request builder, and the Anthropic Messages adapter with its profile option"). It builds less than the wire brief's Decision step 2 (no workspace setting) and does not persist state; both are reductions (decision 1 above; DR-1). One change reaches past the new kind: the PROVIDER_PROTOCOL_ERROR message is the engine's one shared failure text (`src/engine/application.ts:393`), so its new wording applies to every provider kind, including the engine's own check of an invalid or unoffered tool call (`:370`), whose runs today show "The provider returned an invalid or unoffered tool call." and will show the new text, which still names that cause (item 2 below) |
| An invariant change not named | One row added, which narrows (decision 3 above), taken by the lead. Nothing is relaxed: the locality rule for `anthropic` (always external) and the state screen only narrow what reaches a vendor or the engine; the token row gains evidence. `credentials: 'omit'` on chat requests was recorded for this phase in Phase 1 (INV-5); it lands alone and stays only if the Electron check at the end of wave 1 shows no regression as the app ships (no `login` handler), the verdict recorded before the U4 and U5 briefs are written. As shipped, Electron cancels a proxy or server authentication challenge by default, so the check is expected to find no proxy or 401 path that works today; its verdict then says only that, not that proxy authentication is unaffected. If the check cannot run at all, the commit is not merged and INV-5 stays recorded for later. If it stays, users of a gateway that needs Windows-integrated sign-in or a client certificate may lose access (not testable here; named in the README) |
| Deleting user data | None. No migration, no table or column, `SCHEMA_VERSION` stays 4. A hypothetical `anthropic` profile saved through IPC before this phase on a loopback endpoint is refused until saved again; nothing is deleted |
| Metered collection | None. Remedy B (the beta header) is set aside precisely because it would first need two pages collected |
| Force-push | None planned |
| A prompt to a real vendor | None from the build: all tests use fakes built from the captures; the day-one probes run in a separate probe session with the user's key, as already arranged in RUN.md |

## Pending input the user already has in hand

- **The Anthropic key's variable name.** The probe session of 2026-10-11 found no Anthropic key in its
  environment, and RUN.md records that the user was asked which variable it was saved under. Day-one
  probes D1-D9 and D11-D16 wait on it. Phase 2 does not: it is built and merged against fakes (Mandate
  decision 7). The planned probes' worst-case spend is about US$2.97 under the US$3 cap, every request
  costed as if accepted, the one expected to be refused included; real spend should be far lower, and
  the conditional extras run only while actual spend leaves room for their worst case (`DAY-ONE-P2.md`).
- **Haiku 4.5 timing.** The cheap over-window probe (D2), the over-maximum `max_tokens` probe (D7) and
  D11 use claude-haiku-4-5-20251001, which retires "not sooner than 2026-10-15" (SL-E01 l.27). If it is
  gone before the key arrives, the over-window probe on a 1M model costs about 1.5M input tokens, about
  US$3 on Sonnet 5.5, the whole cap: that spend is the user's call when it comes up. The over-maximum
  probe then moves to Sonnet 5.5 (worst case about US$1.31) and runs only if the cap's remainder covers
  it.

## Conditional: would become a user decision only if a day-one probe says so

- **D6 refuses an earlier answer without its thinking.** Then every second Anthropic run in a session
  fails, and the only remedy is the `thinking-binding-controls-2026-08-01` header with `drop_block`. That
  needs the beta-headers and preserved-thinking pages collected first: metered collection, so the user
  decides. (Replaying stored answers would not help: the cross-run prefix cannot be kept.)
- **A multi-workspace key.** If the user's key spans several workspaces, the workspace setting must be
  built (decision 1 above): schema v5, after which older Moonzila builds cannot open the database.

## For information (the lead's choices, which the user may overrule)

1. **Test connection sends the profile's own maximum response** for Anthropic profiles instead of 32
   tokens, because thinking is always on for Fable 5.1 and Opus 5.5 and counts toward that limit. Input
   and output tokens are billed, thinking tokens as output tokens (E-13 l.48). The test never retries
   (it passes `retry: false`), and its 25 s timeout is unchanged, so a slow thinking model can fail the
   test although chat works (D7), and the form then shows only the generic "The operation could not be
   completed" text, as every Test connection failure does today.
2. **A secret in an Anthropic tool step fails the step** instead of being redacted: signed blocks cannot
   be edited without the next step being refused. The failure now reaches the user as
   PROVIDER_PROTOCOL_ERROR with a message naming that cause: "The provider returned a tool call or step
   Moonzila could not use safely: a tool call that was invalid or not offered, or output that contained
   a saved credential. Nothing from that step was run or saved." That message is shared by every
   provider kind and every cause of the code: the existing kinds' tool-call secret check gets it, and so
   does the engine's own check of an invalid or unoffered tool call, for every kind, in place of today's
   "The provider returned an invalid or unoffered tool call."
3. **An Anthropic step may take up to 10 minutes** (600 s) before it times out; the existing kinds keep
   120 s.
4. **An `anthropic` profile is always treated as cloud**, a loopback address included, because a local
   server such as Ollama can serve this API and forward to its cloud. Local-only users reach Ollama
   through the Ollama kind.
5. **The form's hint states Anthropic's data use** from the collected pages, in one sentence the README
   repeats and a test pins word for word: "Data use: Anthropic's commercial terms say it may not train
   models on your prompts and outputs; Claude Fable 5.1 requires 30-day retention and is not available
   under zero data retention unless Anthropic expressly authorizes it; if a chat or session is flagged,
   Anthropic may keep its inputs and outputs for up to 2 years; for how long other requests are kept,
   Anthropic's retention page refers to its commercial data retention policy, which Moonzila has not
   reviewed." That page also says conversation content "is not retained by default", but among its
   commitments for features that require storage, with Fable 5.1 and the other Covered Models excepted,
   so the hint does not repeat it and never says "not retained".
6. **Chat requests stop carrying the app session's cookies and saved sign-ins** (`credentials: 'omit'`,
   recorded for this phase in Phase 1), for every provider, if the Electron check at the end of wave 1
   shows nothing that works today breaking as the app ships; if the check cannot run at all, they keep
   carrying them for now. The cost the check cannot measure: a
   company gateway that needs Windows-integrated sign-in (at a proxy or at the server) or a client
   certificate may refuse chat requests; the README says so, and the change is one revertible commit.
