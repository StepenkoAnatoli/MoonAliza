# Auto-build report: more-models, Phases 1-2

**Summary:** MoonAliza handles OpenAI-shaped and Ollama streams more strictly, and refuses a user-run Ollama under local-only unless it reports its cloud features off (Phase 1). It also gained a native **Anthropic API** profile kind: provider state is replayed unchanged within a run and never stored (Phase 2). The run was resumed several times from its ledger after container restarts.

Merged:
- Phase 1: PR #39, `05221ad`.
- Phase 2: PR #40, `2fb13ac`.
- Stage 6 fixes: PR #42, `e85812b`.
- Stage 7 fixes: PR #43, `afcbd7a`.
- Stage 9 (this report): this pull request.

Phases 3-5 (OpenAI Responses, cloud presets, Gemini) have not started. They wait until after the independent-operation track (user, 2026-10-12).

## What was built and why this way

**Phase 1.** Two fixes:
- Streams fail closed on an error chunk, an error `finish_reason` or an unknown `finish_reason`, instead of saving a partial answer.
- Under local-only, a user-run Ollama is asked `GET /api/status` before each step. A bare request is sent: no credentials, no redirect, no cache.

**Phase 2.** The design (DECISIONS-P2.md) has four parts:
- a bounded provider-state slot, kept in memory only (DR-1);
- a per-kind request part with existing kinds restructured in place, so their requests stay byte-identical (DR-4);
- an Anthropic adapter that replays the accumulated blocks verbatim (DR-3);
- append-only ("frozen") Anthropic runs with a step-1 reserve (DR-2), so earlier steps are never edited.

The same design sets four rules:
- Anthropic is always external, loopback included (DR-5).
- A secret in provider state fails the step and is never redacted (DR-6).
- Only single-workspace keys are supported (DR-7).
- No `thinking`, beta header or sampling fields are sent (DR-8).

Three judges chose the minimal design (50/50/50). The durable design scored 44/44/43 and the adapter design 42.5/40/42.

## Files and components

| Unit | Files | Commits |
|------|-------|---------|
| P1 U0 contracts | `src/shared/errors.ts`, `src/engine/control.ts`, `src/main/inference.ts`, `src/engine/application.ts` | `304ba1e` |
| P1 U1 streams | `src/main/provider-stream.ts`, `src/main/inference.ts` | `4347144`, `03b54de`, `20fd0c7` |
| P1 U2 locality | `src/main/ollama-locality.ts`, `src/main/index.ts` | `2cb7dc6`, `3ed4f59`, `ed5ccd0` |
| P2 U0 contracts | `src/engine/control.ts`, `src/main/provider-kind.ts`, `src/main/anthropic.ts` skeleton | `28395c5` |
| P2 U1 engine | `src/engine/context.ts`, `src/engine/application.ts` | `cf546bb`..`47db017` |
| P2 U2 transport | `src/main/inference.ts` | `0337f69`..`ed70e78` |
| P2 U3 adapter | `src/main/anthropic.ts` | `90c7727`..`cc77893` |
| P2 U4 wiring | `src/main/provider-screen.ts`, `src/main/index.ts`, `src/renderer/App.tsx` | `b1e8550`..`bbc14aa` |
| P2 U5 e2e | `e2e/anthropic.spec.ts`, `e2e/fixtures/anthropic-fake.ts` | `0e96f1f`, `2d3fa59` |

Fixes after review:
- Phase 1 review fixes: `be71033`, `20fd0c7`, `ed5ccd0`, `3bba21c`.
- Phase 2 review fixes: `48dd054`, `23545c3`, `9113f3d`, `c540092`, `797123d`, `cd83bd3`, `459a2cd`.
- Stage 6 break-test fixes: `a6d59d3`, `41e35c8`.
- Stage 7 gap-audit fixes: FX-1 `ca469b2`, FX-2 `8377ebf`, FX-3 `9293d02`.
- Stage 7 fix round: `a17aa7a`, `76e941b`, `e5a8b42`, `ad2778b`, `16a27c8`, `f80020b`.
- Windows hook fix: `622df81`.
- Stage 9: `daa697a` (T-6 scan order).

## Research-to-implementation traceability

`TRACEABILITY.md` lists 49 requirements: 47 VERIFIED, 2 UNTESTED, 0 NOT MET.

The UNTESTED rows:
- **P2 T-4 (e2e journey and the no-cookie block).** Windows CI ran both and its log shows them passing (run 38338982156). They were not run here, because e2e needs the Windows native helper.
- **P2 T-5 (D10 Electron check).** The harness is not committed. Its recorded outcome supports keeping `credentials: 'omit'`. The step to re-run it is in the row.

The two A-1 rows (P1 and P2: "the merge checks held") were UNTESTED in the checked table. The lead closed them in Stage 9 by running the pinned gate on each merge tree.

## Tests performed

**Final gate.** Pinned Linux gate on the Stage 9 code head `c0b386a` (`results/s9-final-c0b386a`): typecheck, lint and build 0; 1572 tests, 1492 passed, 74 failed, 6 skipped; the failing set equals the baseline (74 of 74, 0 new, 0 missing), with 0 files without results. The report commit after it changes only `docs/orchestration/`. The gate on this pull request's exact head is recorded in the pull request. The tree of `afcbd7a` (as `622df81`): 1572 tests, 74 failed, all of them baseline names.

**Gates on the merge commits** (run in Stage 9):
- `05221ad`: typecheck, lint and build 0; 1195 tests, 74 failed, 74 of 74 baseline names, 0 new, 0 missing.
- `2fb13ac`: typecheck, lint and build 0; 1542 tests, 74 failed, 74 of 74 baseline names, 0 new, 0 missing.

**Unit tests.** 10 test files were re-run one at a time on `afcbd7a`: 604 tests, all passing. Guard removals m1-m7 were each red, then restored.

**Mutation testing:**
- Phase 1 integration: 75 mutations, 55 killed. The 20 survivors were fixed or recorded.
- Phase 2 integration: 124 of 128 killed.
- Unit reviews: every guard proof was re-run by its reviewer.
- Spot checks during the Stage 9 audit: 5 of 5 killed.

**Break test (Stage 6, on `b5ce566`).** Every run gave the same 74 failing names:
- three baselines;
- an offline clean checkout;
- shuffled runs under far timezones, other locales, and file-descriptor and memory limits.

30 repeats of the new tests, plus 16 seeds and locales, showed no flake. No credits were spent.

**Gap audit (Stage 7).** Two auditors and a refute-first verifier found 9 gaps; none were refuted. 5 credits were spent.

**Probes (Stage 9, by the four-dimension auditor):**
- The live D5 recordings run through the real `complete()`; the step-2 body was byte-identical.
- A real `Store`, `Application` and Anthropic run at three budget settings.

## Failures discovered and fixes applied

**S1 findings:**
- **P1-CI-1.** The e2e fakes did not answer `/api/status`, so Windows CI was red. No reviewer had read `e2e/`. Fixed in `3bba21c`.
- **BRK-1.** The Electron HTTP cache could answer the status check. Fixed in `ed5ccd0` (`cache: 'no-store'`).
- **MM-P1-SPEC-1.** The Phase 1 docs were missing. Fixed in `3251b8d`.

**S2 findings:**
- P1-U1-R1 and P1-U2-R1, MM-P1-SPEC-2/INV-1 (`credentials`/`redirect` unpinned), MM-P1-SPEC-3, MUT-2.
- P2-SPEC-1, P2-SPEC-2, P2-MUT-1.
- Stage 7 R1-1 (the incomplete-step text was false for a normal stop carrying a call).

Each was fixed red-first where it was code, and re-reviewed.

**Low and Medium findings:**
- **Stage 6 break test:** BT12-F2 (a CRLF checkout rewrote the probe evidence) was fixed in `a6d59d3`; BT12-F3 (a proxy environment) was documented in `41e35c8`.
- **Stage 7 gap audit:** GA-C1/B1, GA-C2, GA-C3 and GA-C4 were fixed. GA-B2/C5 was fixed in part: the hint now says the token fields need raising.

**Windows timing:**
- the cold start of `e2e/anthropic.spec.ts`, fixed in `459a2cd`;
- the hook timeout in `research-document.test.ts`, fixed in `622df81`.

**Stage 9 check (TR-1..TR-8).** All were corrected in TRACEABILITY.md. TR-3, the T-6 scan not being the first assertion, was a real deviation no review had recorded. Fixed in `daa697a`, red-first.

**The lead's own mistakes:**
- MM-2: a rejected command had already written a plan file. It was removed and nothing was collected.
- MM-3: two commit messages first stated wrong counts. Corrected before push.
- MM-P1-SPEC-6: the ledger overstated the U2-R1 fix. Corrected.
- The rename run's stale checkpoint line. Fixed in `8c96e17`.
- RUN.md's Stage 7 line gave 1562 tests, a count of distinct test names, while every other gate line uses vitest's total (1572 for that gate). Clarified in RUN.md.

## Remaining limitations and known risks

**Decisions waiting on the user:**
- **BT12-F1.** Key-shaped test values make Research-Kit `doctor` report 3 blockers.
- **GA-B2.** At the form's defaults (8,192 / 2,048 tokens), an Anthropic thinking tool task ends with CONTEXT_LIMIT after three tool results. The auditor reproduced this. Prefilling larger values costs more per step.

**Not verified anywhere yet:**
- The built app has never sent a live Anthropic request. The evidence is byte-equal bodies, recorded responses and an e2e fake.
- The 600 s deadline on a real long thinking step.

**Known gaps:**
- **Open route.** An `openai-compatible` profile on loopback gets no locality check, so local-only can be bypassed through Ollama's `/v1`. Recorded as a known limit.
- **P2-IR-4.** The inference vault grant lasts 125 s, but an Anthropic call can run 600 s.
- **P2-BRK-1.** Short placeholder vault values fail Anthropic tool steps. A known limit, documented.
- **GA-B3.** Connection errors and an in-stream overload are not retried.
- **GA-B4.** Overflow numbers are dropped.
- **Stage 6 risks:** BT12-R2 (narrow budget margins in tests), R4 (`tsc` needs more than a 512 MB heap), R5 (10 development-only advisories).

**S9-CI-1.** `tests/research-review-main.test.ts` failed once on Windows (run 38280249732 on `2fb13ac`) with "Hook timed out in 10000ms" in its `afterEach`. Its test body had passed.
- On Linux that cleanup takes 34 ms, so slowness does not explain the overrun, and raising the timeout could hide a real wait.
- The same tree passed in 3 other Windows runs.
- Not fixed. The next step is to time each close in that hook on Windows CI.

**KNOWN-UNKNOWNs.** The wire corpus has U-05 and U-18; the shortlist has 8. They concern Phases 3-5, and each carries its day-one step in its brief.

## Four-dimension scorecard

---

## SPEC — 8/10
Torn between 7 and 8. What would settle it is the user's decision on GA-B2 (whether Anthropic token values get prefilled). Every requirement in REQUIREMENTS-P1 (F-1..F-7, S-1) and REQUIREMENTS-P2 (F-1..F-23, S-1..S-5) that I exercised works; see the requirement IDs on the Verified lines under CORRECTNESS. The deductions are for product decisions and for behaviour outside those requirements.
1. [observed] With the form's defaults (context 8,192, response 2,048), the new Anthropic kind cannot do its main job. A thinking tool task ends with CONTEXT_LIMIT after two tool results. My probe (`scratchpad/probes/p3.ts`, real `Application` and real `complete()`, four reads of 10 KB files) made 3 model calls; the context estimates were 2158, 4033, 5909 and 6229 against a budget of 6144. The step-1 estimate of 2158 also leaves the history reserve (3072) about 900 tokens. This matches GA-C5 in RUN.md: history is dropped from the second run on (marked [inferred] in my reasoning). The only mitigation is hint text (`src/renderer/App.tsx` AnthropicHint, README). Prefilling values is still "DECISION NEEDED" in RUN.md (GA-B2/C5).
2. [observed] The locality guarantee covers only the `ollama` kind. Under local-only, an `openai-compatible` profile on loopback (for example Ollama's `/v1`) gets no status check: the probe showed `verifyOllamaLocality` making 0 requests. Yet F-18 made `anthropic` external on loopback for exactly this forwarding reason. So the task constraint "cloud models stay behind the project's inference policy" is still open through this route. It is recorded as a known limit (AGENTS.md row "Scope", `docs/specification/more-models.md` "Recorded for later"), but it is not closed.
3. [observed] Stage 7 changed behaviour of existing kinds beyond REQUIREMENTS-P1/P2:
   - An empty `stop` from openai-compatible or Ollama now fails the run (`STEP_EMPTY`, `src/engine/application.ts:408-410`); it used to complete.
   - Every partial answer gets a new "Incomplete answer" label (`src/renderer/App.tsx` MessageItem). A declined (`blocked`) answer gets the same label.
   - A step with more than 8 calls gets its own text.

   These are named here as additions. They were approved fixes from the gap audit, so this is not a request to remove them.
4. [observed] The ledger and status docs lag the merge:
   - `docs/orchestration/2026-10-05-more-models/RUN.md` on main still says "Last checkpoint 2026-10-12 - Phase 2 MERGED". It shows Stage 8 as PENDING and its next action as "PR with the Stage 7 fixes", but PR #43 is merged (afcbd7a).
   - `docs/development-status.md` stops at Phase 2 and has none of Stage 7's user-visible changes.

## DESIGN — 7/10
Torn between 7 and 8. The per-kind seam deserves praise: `KindPart` in `src/main/provider-kind.ts`, pure parts in `src/main/anthropic.ts`, the screen in `src/main/provider-screen.ts`, locality in `src/main/ollama-locality.ts`, and the contract refines in `src/engine/control.ts`. Phase 3 should be a new module plus one table entry. The deductions are below.
1. [observed] In `src/engine/application.ts`, the run-failure text has no single home. The catch block (l.443-449) takes it from three places: the one-line `failures` record (l.443), `FROZEN_CONTEXT_LIMIT` (l.45) and `STEP_ENDINGS` (l.56-64), which carries its own code mapping. The reasons travel as `Error` message strings (`'STEP_EMPTY'`, `'STEP_INCOMPLETE'`). One table of reason → {code, text, review text} would replace all three.
2. [observed] Facts about the Anthropic provider are restated in the engine. `PREFIX_BOUND_KINDS = {'anthropic'}` (`src/engine/context.ts:20`, used at `application.ts:388`) and `WHOLE_REPLAY_FORMATS` (`context.ts:48`) repeat what `anthropicKind` owns. A second prefix-bound kind would need edits in both engine and main.
3. [observed] The effective local-only policy is derived twice. `localOnly()` in `src/main/ollama-locality.ts:25` reimplements the reading that `assertConversationPolicy` and `assertInferencePolicy` in `src/engine/policy.ts` own.
4. [observed] In `src/engine/context.ts`, `assembleContext` and `continueContext` (l.66-102) duplicate the budget, the over-budget check, the cut loop and the `ContextState` construction.
5. [observed] `chatKind(local: boolean)` (`src/main/inference.ts:214`) passes a boolean through `chatMessages`, `body`, `readStreamed` and `chatOutcome`, so Ollama and OpenAI-compatible stay one part. This is the shape that existed before and was kept to guarantee byte-identical requests.

## CORRECTNESS — 7/10
Torn between 7 and 8. What would settle it is the built app sending one live Anthropic tool task.

Verified:
- **Test files (Node 24.21.0).** None of these files is in the 74-name baseline.
  - `tests/anthropic.test.ts`: 216/216 passed.
  - provider-transport, provider-stream, ollama-locality, provider-screen, anthropic-transport, context: 238/238 passed.
  - application, `workbench.test.tsx`, research-review-engine: 150/150 passed.
- **Typecheck and lint.** `tsc --noEmit` exited 0 with a 2 GB heap. `eslint` on the 13 changed source and test files exited 0.
- **Live recording, step 1** (P2 F-6, F-7, F-11, F-12; probe p1, real `complete()` with a fake fetcher). The live D5 step-1 recording gave `tool_calls` [get_weather {"city":"Rome"}, get_time {}], `appendOnly: true` and usage 528/183. The request was `POST https://api.anthropic.com/v1/messages` with `redirect: 'error'`, `credentials: 'omit'` and headers Content-Type, anthropic-version and Authorization: Bearer.
- **Live recording, step 2** (P2 F-8). The body built from the app's own state is byte-identical to the recorded body that the live API accepted.
- **Anthropic stream edge cases** (P2 F-9, F-10):
  - `end_turn` text → complete.
  - Empty `partial_json` → `{}`.
  - Split JSON is joined.
  - Bad JSON or a tool name not offered → PROVIDER_INVALID_RESPONSE.
  - `max_tokens` mid-tool, or `end_turn` carrying a `tool_use` → incomplete.
  - `refusal` → blocked.
  - `pause_turn` → PROVIDER_FINISH_FAILED.
  - No `message_stop` → incomplete.
  - An `error` event → PROVIDER_STREAM_ERROR.
  - An unknown event before `message_start` is ignored; a block before `message_start`, a mismatched event name, a changed `stop_reason` or a `server_tool_use` block in a tool stop → PROVIDER_INVALID_RESPONSE.
  - CRLF framing works, and bytes after `message_stop` are ignored.
- **Encoder refusals** (P2 F-3, F-8). Each of these → INVALID_INFERENCE_REQUEST before any fetch: an assistant tool step without state, a state whose call input was altered, state sent to openai-compatible, a transcript ending with an assistant message, and a system message mid-transcript.
- **Retries and refusals** (P2 F-13, F-14, F-22):
  - 529 then 200 → complete after 1004 ms, 2 fetches.
  - 429 without retry-after → PROVIDER_HTTP_429, 1 fetch.
  - 503 with `retry: false` → 1 fetch.
  - retry-after 700 s (past the 600 s deadline) → fails at once.
  - 400 "prompt is too long" → CONTEXT_LIMIT; 400 over-max `max_tokens` → PROVIDER_HTTP_400.
  - Stop during the wait → RUN_CANCELLED at 301 ms.
  - The `openai-responses` kind → NOT_IMPLEMENTED.
- **Credential screen** (P2 S-1; probe p2). A secret containing `"` inside thinking, a secret split across two text blocks, and a secret containing `"` in a chat tool input each → PROVIDER_PROTOCOL_ERROR. In a final answer the secret becomes `[redacted]`.
- **Chat kinds** (P1 F-1..F-4; Stage 7 FX-2):
  - An unknown or `error` finish_reason → PROVIDER_FINISH_FAILED; `model_length` → incomplete.
  - An error chunk after the 200 → PROVIDER_STREAM_ERROR; a plain-JSON `error` → PROVIDER_STREAM_ERROR; `error: null` parses normally.
  - A repeated terminal reason is accepted; a changed one fails.
  - Comment, `id:` and `retry:` lines are skipped.
  - Empty or whitespace tool arguments → `{}`.
- **Ollama locality** (P1 F-5, F-6, S-1):
  - The status request is `GET <endpoint>/api/status` with `redirect: 'error'`, `credentials: 'omit'` and `cache: 'no-store'`; a trailing slash is normalised.
  - Each of these → LOCAL_MODEL_UNVERIFIED: `disabled: false`, `disabled: "true"`, a 404, a 70 KB body, a fetch that throws, and a hanging server (refused at 5001 ms).
  - Under cloud-allowed, 0 requests are made. A local-only project overrides a cloud-allowed session.
- **Full engine path** (P2 F-2, F-15..F-17, T-3, T-6; probe p3, real `Store`, `Application` and Anthropic `complete()`):
  - At 64000/16000, 12 reads completed in 13 calls.
  - At 200000/32000, the run stopped at 24 calls on the pre-existing step budget.
  - Every request's messages begin with the previous request's messages; system and tools are unchanged across steps.
  - The signature marker is absent from `state.sqlite`, `-wal` and `-shm`.
  - At defaults the frozen-run failure message is shown.
- **Mutation spot checks** (scratch copy of afcbd7a, since deleted): 5 of 5 killed.
  - Strip removed → T-6 byte-scan test red.
  - Text-join check removed → encoder test red.
  - Content dropped from the state screen → split-blocks test red.
  - The empty-answer (`STEP_EMPTY`) check removed → 7 tests red.
  - `cache: 'no-store'` removed → exact-init test red.
- **CI** (P1/P2 A-1). The GitHub "desktop" workflow succeeded, two runs each, on the PR heads 3bba21c (Phase 1), 459a2cd (Phase 2) and 622df81 (Stage 7).

Could not run:
- `e2e/`. It needs a build into `dist/`, which would write into the checkout, and the Windows-only helper.
- Real Electron `session.fetch` behaviour: credential omission, the cache, proxies, and the D10 verdict. For these I relied on the reports.
- The live Anthropic API and a real Ollama. Vendor requests were forbidden.
- The packaged app.
- The full suite (instructed not to).
- Research-Kit `doctor` for BT12-F1. I did not run it, so nothing would be written in the checkout.

Unsure:
- Windows CI on the merge commit afcbd7a itself: its runs were still in progress during the audit.
- How the 600 s deadline behaves on a real long thinking step.
- The encoder passes an empty user message (`{"role":"user","content":""}`) through without refusing it. I did not establish whether the API accepts it, or whether any engine path produces it.

1. [observed] A thinking tool task at the form's defaults fails on its main path. Reproduction: probe p3 with profile `{contextTokens: 8192, outputTokens: 2048}` and four `read_file` steps of 10 KB each gives CONTEXT_LIMIT after model call 3 (estimates 2158 → 4033 → 5909 → 6229, budget 6144).
2. [observed] A rejected fetch (connection reset, DNS or TLS failure) is never retried: `post()` retries only `!response.ok`, and the fetcher's rejection at `src/main/inference.ts:183` propagates. An in-stream `overloaded_error` is never retried either: `readAnthropic` throws PROVIDER_STREAM_ERROR (`src/main/anthropic.ts:214`). Both are recorded as GA-B3.
3. [observed] The inference vault grant lasts 125 s (`src/main/index.ts:103`), but an `anthropic` call with its retries can run 600 s. The grant's expiry no longer bounds how long the key is in use (recorded as P2-IR-4).
4. [inferred] The app has never sent a live Anthropic request. Correctness of the real path rests on byte-equal request bodies, recorded responses and an e2e fake.

## QUALITY — 7/10
Estimated reducible size: ~8%, about 70 of roughly 920 added production lines. The bulk is in `ollama-locality.ts`, `anthropic.ts`, `application.ts` and `context.ts` (confidence: medium).
1. [observed] In `src/main/ollama-locality.ts`, one abort is guarded several ways:
   - The "Defence in depth" re-check (l.76-77) is one its own comment calls redundant.
   - `response.redirected` (l.59) guards a fetcher the app does not use.
   - `untilAborted` (l.85), the abort listener and the late-headers check all guard the same abort.

   About 15 of the module's 92 lines could go.
2. [observed] In `src/main/anthropic.ts`:
   - The early exits at l.297 (no `tool_use`) and l.301 (unsigned thinking) are equivalent mutants per the integration review (P2-MUT-3). `InferenceToolCallsSchema` and `parseAnthropicState` enforce both again.
   - The MAX_TEXT re-check at l.284 duplicates the reader's running cap.
   - `KNOWN_BLOCKS` (l.139) restates the keys of `BLOCK_FIELDS`.
3. [observed] In `src/engine/application.ts`, `STEP_ENDINGS.STEP_EMPTY.review` (l.60) is dead text; its own comment says it is never reached. `!output.toolCalls?.length` at l.408 cannot be true for a `complete` outcome, because `CompletionSchema` forbids calls there. The second state builder in `src/engine/context.ts` (about 8 lines) could also go.
4. [observed] Test and type hygiene:
   - Three key-shaped literals (`tests/provider-screen.test.ts:43,45`, `tests/anthropic-transport.test.ts:54`) make Research-Kit `doctor` report 3 blockers. This is BT12-F1, still open.
   - The `LIVE_SHA256` table is duplicated in `tests/anthropic.test.ts:191` and `tests/anthropic-transport.test.ts:35`.
   - `ManagedOllamaOptions` (`src/main/provider-kind.ts:11`) restates the inline options type of `complete()` (`src/main/inference.ts:274`).

## Leave alone
- `credentials: 'omit'` on every chat request, in `post()`. D10 verified it in Electron 44.4.5, and its limit is documented in the README.
- Replaying the state's content array verbatim, including live `caller` fields and never rebuilt, after the id/name/input and text checks. The step-2 body is byte-equal to the one the live API accepted.
- `anthropic` endpoints are external even on loopback.
- The locality check refuses a 404 or an old Ollama. That is fail-closed by design.
- Usage keeps the latest value and is never summed (live probes showed summing would be wrong).
- The Stage 7 failure texts never say "continue", because history drops partial answers.
- `.gitattributes` keeps `tests/fixtures/anthropic-live` and the probe evidence byte-exact; both are sha256-pinned.
- `continueContext`'s append-only freeze: the prefix property held at every step in probe p3.

## Next pass
Close GA-B2, then prove it live:
1. Get the user's decision on token values for the `anthropic` kind: either prefill them when the kind is selected, or warn or refuse at save below a minimum.
2. Run the built app once on Windows against the Anthropic API: Test connection, then a multi-step tool task with thinking.

This is the only main-flow failure reproduced here, and every new Anthropic profile left at the form's defaults hits it. The same run closes the largest correctness blind spot: the app itself has never sent a live request. It beats the design refactors, which change no behaviour, and the GA-B3 retry work, which is rarer and already recorded.

Probe scripts are in `/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/probes/` (`p1.ts`, `p2.ts`, `p3.ts`). `/home/user/moonaliza` is unchanged: `git status` is clean at afcbd7a.

---

**Lead's notes on the scorecard.** These come from the refute-first check. The scorecard above is unedited.
- **TR-5.** Windows CI on `afcbd7a` completed green after the audit: runs 38341173466 (main) and 38341185218 (main-axuse). So the "Unsure: Windows CI on the merge commit" item is settled.
- **TR-6(a).** The `!output.toolCalls?.length` conjunct is always true for `complete`, so it is redundant.
- **TR-6(b).** The default-budget failure comes after three tool results: the fourth request (estimate 6229) exceeds 6144.
- **TR-6(c).** The CI workflow is "Windows verification"; `desktop` is its job.
- **SPEC 4.** Fixed in this PR: RUN.md is current, and `docs/development-status.md` has a Stage 7 section.

## Final validation status

COMPLETE for Phases 1-2. Against the completion standard:
- **Requirements:** 47/49 VERIFIED, 2 UNTESTED (each names its environment and its step), 0 NOT MET.
- **Gate equals baseline on the merged head:** yes on the merge trees `05221ad`, `2fb13ac` and `afcbd7a` (as `622df81`) and on the Stage 9 code head `c0b386a`; this pull request's exact head is gated before its merge.
- **Break test:** DONE (Stage 6). **Gap audit:** DONE (Stage 7). **Four-dimension audit:** DONE (Stage 9).
- **S1 and Critical findings:** all fixed and re-reviewed.

The run stays ACTIVE for Phases 3-5.

## Decisions made without asking

The user's authorization was "you have full access. continue". Each of the following is reversible; the user may overrule any of them.
- The Mandate's held questions, each answered with its recommended option (MANDATE.md 1-7).
- The minimal Phase 2 design, chosen by the judges' scores.
- D10: `credentials: 'omit'` stays (commit 3).
- An empty answer in a review run is the review's final answer.
- Token values are not prefilled; a hint is shown instead (prefilling is the user's cost decision).
- Stage 9: T-6's scan was moved first rather than recorded as a deviation.
- The Windows hook timeout (S9-CI-1) was recorded, not raised.
- The scorecard was pasted unedited, with the corrections listed separately.

## Open items and decisions needed

1. **BT12-F1.** Choose (a) values that are not key-shaped (recommended), (b) values generated at test time, or (c) accept and record.
2. **GA-B2.** Should the Anthropic kind's token fields be prefilled (cost per step), or should the app warn or refuse below a minimum at save?
3. **One live run on Windows:** Test connection, then a multi-step tool task with thinking against the Anthropic API. This needs the user's key and machine.
4. **S9-CI-1.** Diagnose the intermittent Windows `afterEach` timeout.
5. **Next work, in the user's order:** GitHub sign-in (device flow), the independent-operation track, then More models Phases 3-5. Phase 3 needs an OpenAI Platform key for its probes.

## Run ledger

- **Ledger:** `docs/orchestration/2026-10-05-more-models/RUN.md`.
- **Mandate:** MANDATE.md, reply "you have full access. continue" (2026-10-11).
- **Research projects:**
  - `docs/research/2026-10-05-provider-wire-formats`
  - `docs/research/2026-10-05-coding-model-shortlist`
  - `docs/research/2026-10-12-gap-audit-more-models`
- **Stage reports:** `reports/stage6-break-test.json`, `reports/stage7-gap-audit.json`, `reports/stage7-fix-workflow.json`, `reports/stage9-workflow.json`.
