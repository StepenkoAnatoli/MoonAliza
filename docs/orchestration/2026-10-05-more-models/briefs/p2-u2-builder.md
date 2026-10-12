# Builder brief: Phase 2, U2 transport seam (and the D10 Electron check)

Read `briefs/p2-common.md` first. Worktree: `/home/user/task5-handoff/wt/mm-p2-u2`, branch
`build/mm-p2-u2`, base `28395c5`.

**Scope:** BREAKDOWN-P2.md row U2 (authoritative), including its three commits and the end-of-wave D10
check. **Spec:** more-models-phase2.md section 4 (the seam, `checkTranscript`, `chatKind`, `post()`, the
deadline, retries, `validateEndpoint`, the `credentials: 'omit'` commit and its D10 gate), section 7 (the
locality bullet). **Requirements:** F-3, F-4, F-5, F-14 (the `post()` half and `retry: false`), F-18
(`validateEndpoint`), F-22, T-2, T-5.

**You own:** `src/main/inference.ts` except U0's lines (already committed) and U4's later runtime import and
table entry for `anthropic`; `tests/provider-transport.test.ts` except U0's block and tests; the Electron
check harness under `/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/p2-d10/`
(never committed); the "More models, Phase 2" paragraph of `docs/ARCHITECTURE.md` (your own sentences).
Note: U0 already updated the `inferenceErrorCode` doc comment; leave it.

**Commits:**
1. On the unchanged code: byte-exact request snapshots (`openai-compatible`, `ollama` plain and managed,
   with tools, multi-step); the F-4 order pins (each green here, red under the swap of its two checks); the
   transcript, tools and body-size no-fetch pins; the 120 s abort pin (fake timers, `AbortSignal.timeout`
   spied as spec section 4 says).
2. The seam: `checkTranscript` with the ownership refusal (red first), `chatKind(local)`, the kind table
   (`openai-compatible`, `ollama`; `anthropic` stays NOT_IMPLEMENTED until U4), `post()` with the retry
   hook and `retry`, per-kind refusal reading, the deadline from `AbortController` + `setTimeout(part.timeoutMs)`
   armed after every pre-check and cleared in `finally`, `validateEndpoint` labelling `anthropic` external
   (loopback and `http://127.0.0.1:11434/v1` included). Commit 1's pins pass unchanged.
3. `credentials: 'omit'` on every chat request, with its exact-init pin, alone. Its report names the known
   limit and the revert set (spec section 4, item 6).

**Then the D10 check** (spec section 4 and DAY-ONE-P2 D10; T-5): real Electron 44.4.5
(`/home/user/moonaliza/node_modules/electron/dist/electron`) under `xvfb-run -a ... --no-sandbox
--disable-gpu`, local fakes only, each case at commit 2 and with commit 3. The Phase 1 breaker's harness
pattern is in `/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/el/`
(cache.cjs; it bundles a module with esbuild and drives `session.fetch`). Write the expected outcome before
the run, record every outcome, and give the verdict from the as-shipped runs only, worded exactly as spec
section 4 says. If the check cannot run, say why; then commit 3 is not merged.

**Pre-mortem:** BREAKDOWN-P2 row U2 (six items: byte or order drift for existing kinds; the retry loop;
an untestable timeout; a proxy bypass giving a false pass; a harness-only difference; a verdict over-read).
