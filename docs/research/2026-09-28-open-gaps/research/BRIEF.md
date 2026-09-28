# Brief - MoonAliza open gaps: accurate context accounting across providers, native SQLite in the packaged Electron app, Research Kit redistribution rights

_Auto-drafted 2026-09-28 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require human/agent judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## Intent

MoonAliza's next stages need three facts its historical research left open or thin (HANDOFF.md, development-status.md, and the Research Kit's own preflight of `docs/handoff/work`): what each provider reports about token use, so `CONTEXT_LIMIT` can move from a serialized-character estimate to real accounting; how the pinned better-sqlite3 obtains a native binary that loads in the pinned Electron; and whether the Research Kit may be redistributed inside MoonAliza. Done means each is answered from fetched primary pages, so the builder can design context accounting, the packaging of SQLite and the kit-bundling decision without re-researching. This project does not change product code or the immutable snapshot under `docs/handoff/`.

## What we verified

| Claim | Source | Type |
|---|---|---|
| Ollama native /api/chat responses report `prompt_eval_count` (input tokens) and `eval_count` (output tokens) as integers; these are the exact counts for local models, but they arrive only after a request completes. | E-01 `docs.ollama.com` (U-01) | P |
| OpenAI Chat Completions: `usage` (CompletionUsage: prompt_tokens, completion_tokens) is optional; in streaming it appears only on the last chunk when `stream_options: {"include_usage": true}` is set. No pre-send count is offered on this object. | E-05 `platform.openai.com` (U-02) | P |
| Anthropic `count_tokens` accepts the same inputs as Messages (system, tools, images, PDFs) and returns total input tokens before sending; it is "an estimate", free but rate-limited per usage tier, and returns invalid_request_error for server tools, MCP connector and url/file image sources. | E-04 `platform.claude.com` (U-03) | P |
| better-sqlite3 13.0.3 package.json: ships `prebuilds/**` inside the npm package with per-platform exports (win32-x64 included), `gypfile: false`, no install script, depends on node-addon-api (Node-API), engines node >=22, license MIT - so `npm ci` compiles nothing and electron-builder must unpack the prebuilt .node from asar. | E-13 `raw.githubusercontent.com` (U-04) | P |
| The StepenkoAnatoli/Research-Kit repository page (captured 2026-09-28, main at 690497d) shows no detected license; the tree has no LICENSE/COPYING/NOTICE file. | E-11 `github.com` (U-05) | P |
| Electron's DEPS at tag v44.4.5 pins `node_version` v24.21.0 (Chromium 152.0.7977.130) - a second, independent reading of the fact the historical snapshot took from releases.electronjs.org. | E-12 `raw.githubusercontent.com` (U-06) | P |

## Contradictions and how they were resolved

- **Electron says recompile native modules (E-06); better-sqlite3 13.0.3 ships no compile
  step (E-13).** Not a real conflict: E-06 is about modules built against one Node ABI,
  while 13.0.3 builds on Node-API (node-addon-api) and ships its binaries in the package.
  No capture states that Node-API binaries load across Electron's ABI. MoonAliza's own
  Windows CI answers that instead: its `check-runtime.cjs` step loads SQLite in the Electron
  utility process on every push, and it passed on `main` at 49585e7 (run 36424753104). I
  trust that run over any document. It is not a kit capture, so it is cited here and not as
  an E-row.
- **The Electron release page (E-09) and DEPS (E-12).** No disagreement; the release page
  just does not state the Node version. DEPS is the file the build reads, so it is the owner.
- **Snapshot E-01 (releases.electronjs.org) and E-12 agree** on Node 24.21.0.

## Known unknowns

None. Every blocking unknown was closed with cited evidence.

## Decision

**Context accounting (Stage C).** No provider except Anthropic counts before sending, so
MoonAliza needs a hybrid:

1. Keep the conservative pre-send estimate.
2. After every response, record the provider's exact input count: `prompt_eval_count` for
   native Ollama, `usage.prompt_tokens` for OpenAI-compatible. Streams must send
   `stream_options.include_usage: true`, or no usage arrives (E-05, E-03).
3. Calibrate the next estimate from that recorded count.
4. Use Anthropic's `count_tokens` when that provider family lands (E-04).

Rules for the native Ollama path:
- **Window:** set `num_ctx` explicitly on each request (E-02). The OpenAI-compatible
  endpoint cannot set the window (E-03).
- **Truncation:** never send `truncate: true`. It drops history silently, including tool
  exchanges the plan requires to be kept.

**First build step.** Extend the provider result contract in `src/shared/` with an optional
`usage { inputTokens, outputTokens, exact: boolean }`. Fill it in both provider loops, and
test that a streamed OpenAI-compatible response without `include_usage` reports
`exact: false` and does not report 0.

**SQLite packaging.** No change. `npmRebuild: false` plus `asarUnpack` of
`node_modules/better-sqlite3/prebuilds/*.node` matches how 13.0.3 ships (E-13). Re-check
E-13 and E-08 when either pin moves: Electron 45 is ABI 150.

**Research Kit redistribution.** Do not bundle the kit into anything distributed to others
until its owner adds a license (E-10, E-11). That is the owner's decision, recorded as the
question in DISCOVERY.md.

**Out of scope:** product code changes, and the historical corpus under `docs/handoff/`.

## Next steps

1. Owner: choose a license for the Research Kit, or confirm MoonAliza stays personal-only
   (U-05).
2. Builder: the usage contract above, then accounting and calibration in
   `src/engine/application.ts`.
3. Verify this corpus on the builder machine from this directory:
   `node "$HOME/.agents/research-kit/bin/handoff.mjs"`, then `preflight.mjs`.
