# Builder brief: Phase 2, U4 main wiring and the profile option

Read `briefs/p2-common.md` first. Worktree: `/home/user/task5-handoff/wt/mm-p2-u4`, branch `build/mm-p2-u4`,
base: `main-axuse` after U1, U2 and U3 are integrated (the lead names the commit when launching you).

**Scope:** BREAKDOWN-P2.md row U4 (authoritative). **Spec:** more-models-phase2.md sections 4 (registration),
5.8 (retries through `complete()`), 6 (the state screen, `profile.test`), 7 (the profile option, hint, README,
locality), 8. **Requirements:** F-5 (the `credentials` assertion), F-14 (through `complete()`), F-19, F-20,
F-23, S-1, S-3, and the U3 state refusal table run through `complete()` (F-11).

**The D10 verdict (U2, end of wave 1): commit 3 stays.** In real Electron 44.4.5, `credentials: 'omit'` kept
`Authorization` and dropped a planted cookie; no as-shipped proxy or 401 path worked at the parent, so the
verdict rests on that case alone. So: your exact-init test for `anthropic` asserts `credentials: 'omit'`, and
README gains the credentials sentence of spec section 4 (it concerns every kind), with the known limit
(Windows-integrated sign-in at a proxy or server, client certificates; and, recorded by the check,
`credentials: 'omit'` does not withhold a proxy authorization Chromium already cached).

**You own:** in `src/main/inference.ts` only the runtime `import { anthropicKind } from './anthropic'` line and
the kind table's `anthropic` entry (remove U2's temporary NOT_IMPLEMENTED pin test for `anthropic`, U2-R2-3,
in the same commit: it is the pin that says "until U4"); `src/main/provider-screen.ts` (new);
`src/main/index.ts`; `src/renderer/App.tsx`; `README.md`; `tests/provider-screen.test.ts` (new);
`tests/anthropic-transport.test.ts` (new); `tests/workbench.test.tsx`; your sentence in
`docs/ARCHITECTURE.md`.

**Live facts to honour** (docs/evidence/2026-10-12-anthropic-probes.md): Bearer works (D1); the over-window
body is `invalid_request_error` "prompt is too long: N tokens > M maximum" (D2); an over-maximum
`max_tokens` is a 400 naming the model's maximum (D7; Haiku 4.5's "64K" is 64,000); `profile.test` at the
profile's own `max_tokens` answered in about 1.3 s on all three 5.x models (D7). Use the recorded D2 body as
the `complete()`-level CONTEXT_LIMIT fixture, citing the evidence file.

**Tests owed:** the spec's "Tests the builders owe", Main (U4) and Renderer lists, every item, including
the data-use sentence pinned whole and "Haiku" and "not retained" absent from the hint.

**Pre-mortem:** BREAKDOWN-P2 row U4. Also: an edit before `const invoke =` in `infer()` (the Phase 1 source
pin, `tests/ollama-locality.test.ts`), and `profile.test` changing for the existing kinds.
