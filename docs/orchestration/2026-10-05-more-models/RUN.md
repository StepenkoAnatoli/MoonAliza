# Run: more-models

| Field           | Value |
|-----------------|-------|
| Status          | ACTIVE |
| Started         | 2026-10-05 |
| Last checkpoint | 2026-10-11 - Phase 1 review fixes integrated; docs (D-1) committed |
| Engagement      | Full (provider adapters, downloads, signed catalogue, external services) |
| Working branch  | `main-axuse`, restarted from `main` @ `b490e50` (PR #37 merge) |
| Skills          | auto-build, lead-orchestrator, careful-coding, Research-Kit 0.9.5 |

## Auto-build stages
| Stage | Status | Artifact | Checkpoint |
|-------|--------|----------|------------|
| 0 Orient | DONE | this ledger; baseline below | 2026-10-05 |
| 1 Research | DONE: two corpora, preflight PASS and handoff OK each, briefs authored, adversarially verified | docs/research/2026-10-05-provider-wire-formats/research/BRIEF.md; docs/research/2026-10-05-coding-model-shortlist/research/BRIEF.md | 2026-10-10 |
| 2 Requirements | DONE (Phase 1) | REQUIREMENTS-P1.md | 2026-10-11 |
| 3 Design | DONE (phase plan; Phase 1 in full) | docs/specification/more-models.md | 2026-10-11 |
| 4 Mandate | DONE: user, 2026-10-11, "you have full access. continue"; the lead took the recommended option for each held question (no one approved them individually) | MANDATE.md | 2026-10-11 |
| 5 Build | ACTIVE: Phase 1 | units below | 2026-10-11 |
| 6 Harden | PENDING | - | - |
| 7 Audit | PENDING | - | - |
| 8 Deliver and merge | PENDING | - | - |
| 9 Validate and report | PENDING | - | - |

## Next action
Phase 1: integration review on `f1c4867` returned 2 S1 and 5 S2 (`reports/p1-integration-review.json`). Fixes integrated (`20fd0c7`, `ed5ccd0`, re-reviews PASS) and the lead's docs committed. Next: the pinned gate on the head, the PR, Windows CI, the merge. Gemini probes running in a child session; Anthropic probes wait on the key's variable name.

## Task statement
User, 2026-10-04: "Can we add more models to moonzila?" then "add it as its own task after Task 5. Yes". User, 2026-10-05: "continue"; chose "More models" as the next task and "I'll add a new key" for research collection.

Plan entry (docs/superpowers/plans/2026-10-02-research-jobs.md, "More models"): three directions, all in scope, order decided at the brainstorm: (1) more one-click local models in the managed catalogue; (2) native profile kinds for providers that are not OpenAI-compatible (for example Gemini's own API); (3) smarter selection ranking cloud and local models by cost and quality per task. Research first: which coding models are worth adding, judged on tool-calling reliability, licence, size and hardware, and price; a curated, tested shortlist, not a count. Constraints: about 1.15 GiB free memory on the user's PC, so local models that do not fit are not offered; cloud models stay behind the project's inference policy.

## Baseline
`main` @ `b490e50` has the same tree as `7c1923c` (`git diff` empty), whose pinned Linux gate is `/home/user/task5-handoff/results/p5-final-7c1923c`: typecheck, lint, build pass; 1121 tests, 74 failed, the same names as `/home/user/task5-handoff/baseline-failing.json`, 0 files without results. Windows CI green on `7c1923c` (runs 37237635914, 37237639148).

## Research-Kit
Kit 0.9.5 at `$HOME/.agents/research-kit`, role collector. `doctor` on MoonAliza, 2026-10-05: 1 blocker, `firecrawl-auth: not authenticated` (the session's keys were shredded at the end of Task 5, as the user asked). Transport without a key: `firecrawl-cli-anonymous`; the user chose a new key, not the keyless transport.
2026-10-05, later: the user uploaded a new key as a file outside the repository; each collecting command reads it from there inline (never echoed, never copied into a repository or a brief). `doctor`: READY, `firecrawl-cli` authenticated, 642 credits. Collection budget for this task: at most 100 credits across all topics, each plan dry-run first; anything beyond goes to the user.

## Decisions and assumptions
- 2026-10-05: the user picked More models over P4-23 and Self-unblocking, and a new key over keyless collection.
- 2026-10-05: classified architectural (new provider kinds, catalogue changes and selection touch contracts, the signed catalogue and the inference policy); the Mandate waits for the user, as the auto-build default for architectural tasks.

## Research outcome (2026-10-05..10)
| Corpus | Unknowns | Gate | Verification |
|--------|----------|------|--------------|
| `docs/research/2026-10-05-provider-wire-formats` | 20: 18 CLOSED, 2 KNOWN-UNKNOWN (U-05 Gemini over-window status and body; U-18 live probes per vendor key) | preflight PASS (0 warnings), handoff OK, 38 ledger entries | three adversarial verifiers; 13 material issues, then 2 more after run 4; all resolved per a fresh checker |
| `docs/research/2026-10-05-coding-model-shortlist` | 20: 12 CLOSED, 8 KNOWN-UNKNOWN (U-04, U-06, U-09, U-10, U-15, U-17, U-18, U-20), each with a day-one step | preflight PASS (1 warning the contract accepts: U-18), handoff OK, 38 ledger entries | three adversarial verifiers; 6 material issues, all resolved per a fresh checker |

Credits: this task's collection spent about 80 (76 pages and 2 searches by the two ledgers: runs 1-2 68, run 3 10, wire run 4 2), within the 100-credit budget; measured 642 before and 564 after run 3. On 2026-10-10 `doctor` reports 391: about 171 more were spent outside this task's ledgers between 2026-10-05 and 2026-10-10, which nothing here records or can attribute (other use of the same account is the likely cause). A shortlist run 4 (4 owner pages) was declined by the user on 2026-10-05; nothing was fetched, the plan file the interrupted command had written was removed, and the corpus records the decision.

## Units (Phase 1)
| Unit | Owns | Status | Commit | Model |
|------|------|--------|--------|-------|
| U0 contracts | `src/shared/errors.ts` (LOCAL_MODEL_UNVERIFIED), `src/engine/control.ts` (inference.error code), `inferenceErrorCode` in `src/main/inference.ts`, the engine's message in `src/engine/application.ts`, two red-first tests | DONE (lead): both tests red before, green after | this commit | lead |
| U1 stream robustness | `src/main/provider-stream.ts`, the OpenAI-shaped branch of `complete()` in `src/main/inference.ts`, `tests/provider-stream.test.ts` (and new finish-reason tests in `tests/provider-transport.test.ts`) | INTEGRATED, REVIEWED (round 1 FIX: U1-R1 S2 fixed; re-review ACCEPT; U1-R6 S3 fixed by the lead in `be71033`) | `4347144`, `03b54de` | session model |
| F1 review fix, stream | `src/main/inference.ts` (readStreamed), `tests/provider-stream.test.ts` | INTEGRATED, REVIEWED (re-review PASS, S4 notes only) | `20fd0c7` | session model |
| F2 review fix, locality | `src/main/ollama-locality.ts`, `tests/ollama-locality.test.ts`, `tests/application.test.ts` | INTEGRATED, REVIEWED (re-review PASS, S4 notes only) | `ed5ccd0` | session model |
| U2 Ollama locality | new `src/main/ollama-locality.ts`, its call in `infer()` in `src/main/index.ts`, `tests/ollama-locality.test.ts` | INTEGRATED, REVIEWED (round 1 FIX: U2-R1 S2 fixed; re-review ACCEPT; U2-R4, R5, R6/R7 by the lead in `be71033`) | `2cb7dc6`, `3ed4f59` | session model |

## Discovery (reports/discovery-1.json, five mappers and a critic, 2026-10-05)
- Only `openai-compatible` and `ollama` run; `anthropic` and `openai-responses` are declared but throw NOT_IMPLEMENTED (`src/main/inference.ts:142-143`), and the profile form offers only the two that run (`src/renderer/App.tsx:266`). The plan's "already reaches many models through profiles (ollama, openai-compatible, openai-responses, anthropic)" overstates what works.
- The managed local stack (signed catalogue, activation, managed Ollama, selector) is tested source with no production caller; `model.*` IPC falls to NOT_IMPLEMENTED; no production signing key, shipped catalogue, catalogue producer or qualification harness exists (HANDOFF.md:85-86). "More one-click local models" first needs that path built.
- On the user's PC (about 1.2 GB available, reserve max(2 GiB, 15% RAM)) the selector answers `host-reserve` for every model size: no local model can be offered there under the current policy.
- Selection: the user picks a profile per run; no price, quality or capability is stored per profile or catalogue entry.
- Critic: locality is derived from the endpoint host (loopback = local), which a user-run Ollama serving cloud models would defeat; recorded as a research unknown.

## Findings
| ID | Source | Severity | Finding | Disposition |
|----|--------|----------|---------|-------------|
| P1-U1-R1 | U1 unit review | S2 | no test that an event name belongs only to its own event | FIXED `03b54de` (test; guard proof) |
| P1-U1-R2 | U1 unit review | S3 | an empty-string finish_reason reads as no reason (incomplete) | KEPT, pinned by a test: the stream accumulator already skipped falsy reasons, so both paths agree |
| P1-U1-R6 | U1 re-review | S3 | the top-level error check's position before the no-choice return is unpinned | FIXED `be71033` (test; mutation red) |
| P1-U1-R7/R8 | U1 re-review | S4 | bare `data` lines and duplicate `event:` lines differ from the old reader in shapes no capture shows | RECORDED: no vendor capture sends them |
| P1-U2-R1 | U2 unit review | S2 | the infer() wiring guarded only by a text search | FIXED `3ed4f59` by a stricter source-text pin (the check is awaited before `complete()`); an `infer()` harness was set aside. Corrected 2026-10-11: this row first said "behavioural test" (integration review MM-P1-SPEC-6); the missing harness is recorded for later in the spec |
| P1-U2-R2/R3 | U2 unit review | S3 | the oversized-body test could not tell refusal from truncation; the status request's abort untested | FIXED `3ed4f59` |
| P1-U2-R4 | U2 unit review (routed to the lead) | S3 | a 404 or a connection error also refuses, but the message asserted cloud forwarding | FIXED `be71033`: message reworded to "could not confirm"; spec updated |
| P1-U2-R5 | U2 unit review | S4 | ARCHITECTURE said a cancelled run "stays RUN_CANCELLED"; across the boundary it crosses as PROVIDER_ERROR | FIXED `be71033` |
| P1-U2-R6/R7 | U2 reviews | S3 | the 5 s timing test allowed only 2 s of slack; Windows CI has run tests 12x slower (P5-27) | FIXED `be71033`: upper bound 9.5 s (still below a doubled 10 s), test timeout 20 s |
| P1-U2-R8/R9 | U2 re-review | S4 | body-cleanup paths after refusal untested; the 404 body text is not from a capture | RECORDED: the code never reads a non-200 body |
| MM-P1-SPEC-1, INV-2 | integration review | S1 | D-1 not met: no AGENTS.md locality row, no "as built" notes in the spec | FIXED by the lead (docs commit): AGENTS.md row with its scope; spec "As built (Phase 1)" |
| BRK-1 | integration review (breaker, in Electron) | S1 | the session HTTP cache can answer `/api/status` when it carries freshness headers, so a stale `disabled: true` passes | FIXED `ed5ccd0`: `cache: 'no-store'`, pinned by the exact-init test; shown in Electron 44.4.5 (all five cache-header cases refuse step 2 after, three passed before) |
| MM-P1-SPEC-2, INV-1, MUT-1, MUT-11 | integration review | S2 | `credentials: 'omit'` and `redirect: 'error'` unpinned; Electron sends session credentials without the first | FIXED `ed5ccd0`: exact request-init test, red without each of `credentials`, `redirect`, `cache` |
| MM-P1-SPEC-3 | integration review | S2 | README and no release note say a stock Ollama is now refused under local-only (the default) | FIXED by the lead: README sentence, `docs/development-status.md` section, spec as-built |
| MUT-2, MUT-9 | integration review | S2 / S4 | the trailing event without its blank line (and its event name) untested | FIXED `20fd0c7` (tests, guard proofs) |
| MUT-3, MUT-4/SPEC-4, MUT-5, MUT-6, MUT-7 | integration review | S3 | body-less 200; the 5 s and 64 KiB constants; connection close on overflow; `data:` without a space; the full message | FIXED `20fd0c7` (MUT-6), `ed5ccd0` (the rest), each with its mutation red |
| MM-P1-SPEC-5 | integration review | S3 | the openai-compatible loopback gap not named where the invariant is recorded | FIXED by the lead: AGENTS.md row, README, ARCHITECTURE, spec "Recorded for later" |
| MM-P1-SPEC-6 | integration review | S3 | this ledger overstated the U2-R1 fix | FIXED: row P1-U2-R1 corrected |
| MM-P1-SPEC-7, SPEC-8 | integration review | S4 | ARCHITECTURE said the managed runtime makes no status request (it does, at startup); test wording drifted | FIXED by the lead (docs commit) |
| BRK-2/INV-4, BRK-3/SPEC-9, INV-3, MUT-8, MUT-10, MUT-12..15 | integration review | S4 | late headers through a signal-ignoring fetcher; plain-JSON top-level error; comments; SSE edge pins | FIXED `20fd0c7` (BRK-3/SPEC-9: a plain JSON top-level error fails; MUT-8, 12-14), `ed5ccd0` (BRK-2/INV-4, INV-3, MUT-10, MUT-15 comment) |
| BRK-4, BRK-5, INV-5 | integration review | S4 | pre-existing: lone CR, quadratic split, chat requests without `credentials: 'omit'` | RECORDED for later in the spec (INV-5 goes to the Phase 2 request builder) |
| MUT-16 | integration review | S4 | control mutation survived as intended | none |
| MM-2 | lead | process | a command the user rejected had already written `plan-4.json` into the shortlist corpus before the rejection; no collection ran (ledger unchanged at 38 entries) | the file was removed on 2026-10-10 and the decision is recorded in the corpus |
| MM-3 | lead | process | two commit messages first stated wrong counts (17/3 instead of 18/2 unknowns; "four rows" instead of three rows and one half) | corrected before push from the contract's own rows |
| MM-1 | discovery | docs | the plan's "More models" entry says four profile kinds reach models; two are unimplemented | FIXED: dated correction under the entry, with pointers to the discovery and the two research projects |

## Log
- 2026-10-05: started. Branch restarted from `main` (`main-axuse` held only merged history). Discovery workflow launched: five read-only mappers (profiles, catalogue, selection, existing research, specs and tests) and a completeness critic.
- 2026-10-05: the user supplied a new Firecrawl key (upload); kit READY, 642 credits; budget 100 credits. Remind the user at the end to rotate it (it is in the conversation record).
- 2026-10-05: discovery returned (6 agents); saved `reports/discovery-1.json`. Research split into two projects: `docs/research/2026-10-05-provider-wire-formats` and `docs/research/2026-10-05-coding-model-shortlist`; planning workflow launched (no spend; researchers have no key).
- 2026-10-05: research plans drafted (wire formats: 18 unknowns, about 29 credits; shortlist: about 31 credits; no spend). Both plan reviews returned FIX (search-only sources typed S, guessed URLs, licences resting on Ollama's layer instead of the owner, an unknown no page can answer, the shortlist over one run's 25 pages). Fix round launched (workflow `more-models-plan-fixes`, up to two review rounds, no spend). Reviewer's account question for the day-one probes (which vendor keys the user will provide) held for the Mandate. Saved `reports/research-plan-1.json`.
- 2026-10-05: plan fixes: wire formats READY after round 1 (32 credits in two runs, conditional plan not run); shortlist FIX after round 2 on one material item (Gemini 3.5 Flash-Lite neither planned nor dismissed), applied by the lead (its model page, linked from the 2026-10-02 Gemini pricing capture line 444, added to run 1) with the scope wording. Saved `reports/research-plan-fixes.json`. Dry runs with the key: 64 named pages and 2 searches, about 68 credits. Collection started (four runs, sequential).
- 2026-10-05: user: "finish the phase. merge what needed, make sure no bugs and then stop". Scope of this finish: Stage 1 research to a passing gate and briefs for both corpora, verified, committed with ledgers and merged under the AGENTS.md merge checks; no design or build (the Mandate needs the user).
- 2026-10-05: collection done: wire formats 31 captured, 1 refused (openrouter.ai/docs/features/tool-calling, HTTP 404); shortlist 31 captured, 1 refused (ollama v0.34.4 ml/backend/ggml/ggml/src/CMakeLists.txt, HTTP 404). All captures by `firecrawl-cli`, graded full. Credits 642 -> 574 (68 spent; 32 left in this task's budget). Close-out workflow launched (researchers: quoted claims, statuses, preflight, BRIEF; conditional pages named only by copying links from captures).
- 2026-10-05: close-out round 1 (`reports/research-close-1.json`): both corpora mostly closed; 10 conditional pages whose triggers fired, each copied from a link inside a capture (checked by grep), collected as run 3 (10 credits). Verify round 1 (`reports/research-verify-1.json`): wire formats - 13 material and 18 minor issues raised by three adversarial verifiers, all resolved or soundly declined per a fresh checker; preflight PASS, handoff OK. Two rows (U-05, U-20) had been labelled KNOWN-UNKNOWN only because collection was closed though their owner pages are public and linked from captures; the lead collected both as run 4 (2 credits). Shortlist: its integrate step failed on an API overload (529) and is re-run. Credits: 80 spent in all (642 -> 562 expected).
- 2026-10-05: plan entry corrected (MM-1) and AGENTS.md Research-Kit facts brought current (0.9.5, CLI 1.25.3, eighteen projects).
- 2026-10-05: verify round 2 (`reports/research-verify-2.json`): wire formats - run 4 folded in, 2 material issues resolved, preflight PASS 0 warnings; shortlist - integrated after the 529 retry, 6 material issues resolved per a fresh checker, preflight PASS with the accepted U-18 warning. The lead proposed a shortlist run 4 (4 owner pages); the user declined it.
- 2026-10-10: resumed after five days; the uncommitted work was intact. Removed the declined `plan-4.json` (MM-2). Gates re-run: both PASS, handoff OK. Corpora committed with their ledgers (`2773ee7`, `71436b5`). The user asked to check two proposals (the SmartRouter Phase 6 advisory UI note and a Maintenance self-check plan); copies in `reports/inputs/`, review workflow launched against Moonzila b490e50 and SmartRouter 9b4bd68/ac59658 (cloned read-only). Found first: SmartRouter's handoff points to `docs/MOONZILA_ADVISORY_UI.md`, which exists neither at its head nor in its `v1.0.0-pilot` tag.
- 2026-10-10: ideas review returned (25 agents; `reports/2026-10-10-ideas-review.md`, raw verdicts in `reports/2026-10-10-ideas-review-workflow.json`). Advisory UI note: 24 claims VERIFIED, 39 PARTLY, 5 WRONG; recommendation - do not adopt it as an implementation spec, take its four plan-backed rules into direction 3 at the Mandate. Maintenance plan: its picture of Moonzila mostly accurate; recommendation - record its principles only if the user approves them, and split the work across Stage F2, a GitHub-run Full check, Self-unblocking and missions. The lead spot-checked citations (the `d7c00f9a` pin, SmartRouter's Phase 2 record, `application.ts:363`) and corrected two points: my statement that the note existed nowhere in SmartRouter was wrong (it is inside the committed release zip `tools/release/SmartRouter-v1.0.0-pilot.zip`), and the review's "ancestry does not reproduce" came from my own `--depth=1` tag fetch re-shallowing the clone (with full history, 9b4bd68 is an ancestor of ac59658, 33 commits). Plan gets an end section pointing to the review; nothing approved or built.
- 2026-10-11: user: "you have full access. continue". Stages 2-4: REQUIREMENTS-P1.md, docs/specification/more-models.md (phase plan, Phase 1 design), MANDATE.md (each held question answered with its recommended option; recorded as not individually approved). Phase 1 = stream robustness and fail-closed Ollama locality. U0 contracts by the lead, red-first.
- 2026-10-11: briefs written (`briefs/p1-common.md`, `p1-u1-builder.md`, `p1-u2-builder.md`); both builders launched in parallel worktrees off `304ba1e`, each followed by a refute-first unit review and up to two fix rounds (workflow `mm-phase1-build`).
- 2026-10-11: user saved a Gemini API key in the environment (not visible to this already-running session). A child session (`session_01GUk5QJ9mqqau5vNm8VnKsH`, same environment) runs the Gemini parts of wire U-18 probes (1)-(4), (8), (9), (11) and shortlist U-06 for gemini-3.8-flash, gemini-3.7-flash and gemini-3.5-flash-lite, synthetic prompts only, key never written; results to `docs/evidence/2026-10-11-gemini-probes.md` on branch `claude/gemini-probes-2026-10-11`, no merge by the child. Measurements do not become corpus E-rows (the kit admits fetched pages only); the spec and design cite the evidence file.
- 2026-10-11: user added an Anthropic API key. A second child session (`session_01GVZQRTcwkRWYGQrpj4V8qS`) runs the Anthropic parts of wire U-18 probes (1)-(3), (6), (8), (11) and shortlist U-06 for claude-sonnet-5-5 and claude-opus-5-5 (claude-fable-5-1 if budget allows), synthetic prompts only, spend capped at an estimated US$3, over-window probe on claude-haiku-4-5-20251001 (smallest window); results to `docs/evidence/2026-10-11-anthropic-probes.md` on branch `claude/anthropic-probes-2026-10-11`.
- 2026-10-11: build workflow returned (`reports/p1-build-workflow.json`): U1 and U2 each FIX in round 1 (one S2 each), fixed, ACCEPT on re-review. Integrated by cherry-pick (`4347144`, `03b54de`, `2cb7dc6`, `3ed4f59`); the lead's follow-ups in `be71033`.
- 2026-10-11: the Anthropic probe session found no Anthropic key in its environment (a request without one returned 401); its branch holds a gap note. The user was asked which variable name the key was saved under.
- 2026-10-11: integration review on `f1c4867` (spec, breaker in real Electron 44.4.5, invariants, mutation: `reports/p1-integration-review.json`). Pinned gate on `f1c4867`: typecheck, lint, build 0; 1180 tests, 74 failed, all baseline, 0 new, 0 empty. Findings dispositioned above; fix round launched in worktrees `mm-p1-fix1` and `mm-p1-fix2` off `f1c4867`.
- 2026-10-11: fix round returned (`reports/p1-fix-round.json`): fix1 and fix2 PASS on the first re-review, S4 notes only. The fix1 reviewer left the main checkout detached at `f1c4867` (same commit as `main-axuse`; the uncommitted docs untouched); the lead re-attached `main-axuse`. Cherry-picked as `20fd0c7` and `ed5ccd0`. S4 notes taken in the docs commit: test comments (Responses `"error": null`, E-31 citation, the spec citation for the no-reason rule, the application test's name, the source-count comment). Left as notes: `"error": false` unpinned (any non-null value fails, in both places); the late-headers fix shown on Node's fetch only.
