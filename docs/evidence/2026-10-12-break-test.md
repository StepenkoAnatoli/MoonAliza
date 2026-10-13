# Break test, 2026-10-12

This is auto-build Stage 6 of the More models run (`docs/orchestration/2026-10-05-more-models/RUN.md`). It is one run of the `break-test` skill against `main` at `b5ce566`, which holds More models Phases 1-2 (merges `05221ad` and `2fb13ac`) and the MoonAliza rename (`b5ce566`). It ran on a Linux container in an unattended agent session.

What Phases 1-2 and the rename added or changed got the closest look:
- `src/main/inference.ts`, `provider-kind.ts`, `provider-stream.ts`, `provider-screen.ts`, `anthropic.ts` and `ollama-locality.ts`;
- `src/engine/context.ts` and `application.ts`;
- `tests/anthropic*.test.ts` and `tests/provider-*.test.ts`;
- `tests/fixtures/anthropic-live/` and its `.gitattributes` rule;
- `e2e/anthropic.spec.ts` and its fake.

Every statement about the build rests on a command that was run and on output that was read. Where something was not run, *Not probed* says so. The 2026-10-03 and 2026-10-04 reports' findings are not reported again. Their probes were re-run only where Phases 1-2 or the rename could have changed the result, and each re-run that held is listed as a null result.

## Overview

| Item | Value |
|------|-------|
| Stack | Electron 44.4.5, TypeScript 5.9.3, esbuild, vitest 5.0.1 (1542 tests in 75 files), Playwright e2e, Windows-only native helper |
| CI | `.github/workflows/windows.yml`, `windows-latest` only. Unchanged apart from the rename's executable names. |
| Gate used here | `npm run typecheck` · `npm run lint` · `npx vitest run --reporter=json` · `npm run build`. Failing tests are compared by name with the pinned 74-name baseline. `numTotalTests`, the failing files and the files with no results are compared too. |
| Gate duration | 13 to 14 min. The test step takes 769 to 824 s, of which 500 s is `research-review-main` (290 s) and `research-review-e2e` (209 s). The Phase 1-2 test files take about 20 s together. |
| Environment | Linux 6.18 container, 4 CPUs, 15 GB RAM, running as root. Node 24.21.0 / npm 11.19.0, the `.node-version` pin and the only Node installed. Only the C, C.utf8 and POSIX glibc locales are present. Node's ICU still follows `LANG`, checked here: `LANG=de_DE.UTF-8` formats 16384 as `16.384`. HTTPS goes through the session proxy. The environment sets `NODE_OPTIONS=--max-old-space-size=8192`, sets `NO_PROXY` to cover loopback, and holds provider keys. No test or build step reads those keys. |
| Baseline | 3 full gate runs on the untouched worktree. Each: typecheck, lint and build exit 0; 1542 tests, 1462 passed, 74 failed, 6 skipped (Windows-only). The failing names equal `baseline-failing.json`, with the same md5 all three times. 10 failing files, none empty, 0 intermittent. |
| Isolation | Default setup: worktree `wt/break-p12` on branch `break-test/2026-10-12`, from `b5ce566`. It has its own `npm ci`, so the user's `node_modules` was never written to. The kit pin was copied (read only) from the user's `.build/`. Probes ran in throwaway clones under one scratch directory. `npm ci` added entries to the shared `~/.npm` cache, and `~/.cache/electron` was only read. The user's checkout is clean at `5aba237` (`main-axuse`) before and after. |
| Commits | `4b39e52` F2 · the commit that adds this report (written by the lead from the break-tester's returned text, since a subagent may not write report files) |
| External facts | None closed through Research-Kit, so there is no kit project and 0 credits were spent (282 before and after, per `doctor`). Every cause and recommendation rests on behaviour observed by a command here. That includes Electron's: how its `session.fetch` and the main process's global `fetch` treat `NODE_USE_ENV_PROXY` was observed on Linux only (probe 5c), and on Windows it is *unverified*. Kit 0.9.5 is deployed. `doctor` at the repository root is **not** READY: 3 blockers, which is F1. |

## Findings

> **[F1] Research-Kit `doctor` at the repository root reports 3 blockers since Phase 2: test-only key-shaped strings** (Low, Likely)
> Repro: `node ~/.agents/research-kit/bin/doctor.mjs`, run from the repository root.
> Observed: `critical secret e2e/anthropic.spec.ts:13 matches openai-style-key - the key never belongs in this repository (Rule 6)`, the same for `tests/anthropic-transport.test.ts:54` and `tests/provider-screen.test.ts:43`, then `3 blocker(s) [role=collector, kit 0.9.5]`, exit 1.
> Control: at `05221ad` (main after Phase 1), the same command says `pass secret-scan no match: 8 credential patterns over 645 text file(s)` and `READY`.
> Cause: the kit's pattern `\bsk-[A-Za-z0-9_-]{16,}\b` (`lib/doctor.mjs:351`) matches three built test values: the e2e Anthropic fake's key, the transport test's key and the screen test's saved secret, each an `sk-ant-` prefix followed by more than 16 key characters (not quoted here, because this report would then match the same pattern). They were added by `0e96f1f` (U5), `42907f9` (U4) and `b1e8550` (U4). `doctor` reports only the first match per file; `provider-screen.test.ts:45` also matches. None is a credential. P4-40 made the repository root READY on purpose, by generating the TLS key at test time, and Phase 2 undid that. Every agent that runs the kit here now meets 3 blockers. The commit gate is not affected: the F2 commit passed with `research gate: allow`.
> Action: not fixed. The decision is the owner's (*Rejected fixes*, *Remaining risks* 1).

> **[F2] On a `core.autocrlf=true` checkout, the Anthropic probe evidence is no longer byte-exact and the fixture copies stop equalling their originals** (Low, Possible)
> Repro: `git clone -c core.autocrlf=true <repo> ../crlf && cd ../crlf && for f in tests/fixtures/anthropic-live/*; do cmp -s "$f" "docs/evidence/2026-10-12-anthropic-probes/$(basename "$f")" || echo "differs: $(basename "$f")"; done`
> Observed:
> - All 7 fixture copies differ from the evidence files that `tests/anthropic.test.ts:173-178` calls their byte-for-byte originals.
> - 27 of the 30 `*.response.raw` files no longer match the `responseBytes` in their `meta.json` (for example `D1-bearer.response.raw`: 1263 bytes against 1242).
> - 133 evidence files are checked out `w/crlf attr/`.
> - No new test failed: in the CRLF clone, the 17 byte-sensitive test files gave 630 tests and 20 failures, all of them baseline `research-kit` names. The full suite was not run on a CRLF clone.
> Cause: `3e88117` protected `tests/fixtures/anthropic-live/**` but not the evidence folder those fixtures copy. The tests only read the copies, plus D2 and D7, which have no line end, and they JSON-parse the request files. So nothing checked the originals.
> Action: fixed in commit `4b39e52`: `docs/evidence/2026-10-12-anthropic-probes/** -text -whitespace`.
> Verification:
> - the repro on a CRLF clone of the fix gives 7 of 7 equal, 0 of 30 sizes off, and 133 files `w/lf`;
> - on an LF checkout, `git add --renormalize .` stages nothing (on a CRLF clone it restages two docs that the index stores with CRLF, which predates F2 and is outside it);
> - the fast gate in the CRLF clone (`anthropic`, `anthropic-transport`, `provider-stream`, `handoff`) passes 300 of 300;
> - the final full gate, in the worktree, is identical to the baseline.

> **[F3] With Node's opt-in environment proxy and no loopback exception, 34 tests that use loopback fakes fail** (Low, Unlikely)
> Repro: `env -u NO_PROXY -u no_proxy NODE_USE_ENV_PROXY=1 HTTP_PROXY=http://127.0.0.1:9 HTTPS_PROXY=http://127.0.0.1:9 npx vitest run tests/ollama-locality.test.ts tests/research-journeys-network.test.ts`. Port 9 is a closed local port, so nothing leaves the machine.
> Observed: 47 tests, 13 passed, 34 failed.
> - `ollama-locality`: 32 of 39 failed, including `under local-only, a 404 (an Ollama without /api/status) refuses with LOCAL_MODEL_UNVERIFIED before any chat request`.
> - `research-journeys-network`: 2 failed, `with the opt-in, main's run read is answered by the loopback fake through its proxy, ...` and `the verified import accepts the routed run read ...`.
> - Run under the same settings, `research-collector-protocol`, `github-tls` and `github-read` passed. `managed-ollama` and `owned-transport` failed only their baseline names.
> Controls:
> - the same proxy settings without `NODE_USE_ENV_PROXY`: 47 of 47 passed;
> - `NODE_USE_ENV_PROXY=1` with the session's `NO_PROXY`, which lists loopback: `ollama-locality` 39 of 39;
> - every baseline run had `HTTPS_PROXY` set.
> Cause, observed directly: a plain Node 24.21.0 `fetch` to a loopback server returns 200 by default. With `NODE_USE_ENV_PROXY=1`, the proxy variables set and no `NO_PROXY`, it fails with `ECONNREFUSED 127.0.0.1 9`. `ollama-locality` reaches its fake through Node's global `fetch` (`tests/ollama-locality.test.ts:60`). Because the check turns every network error into `LOCAL_MODEL_UNVERIFIED` (`src/main/ollama-locality.ts:48-51`), these failures read as locality refusals, not as a proxy problem.
> Scope in the app: the app's loopback requests do not use the global `fetch`. The locality check, local inference and runtime inspection send through the `moonaliza-local` session, which is set to a direct connection (`src/main/index.ts:64-65`; used at `:97`, `:98` and `:223`). The managed runtime sends over its own socket (`src/models/owned-transport.ts:21-25`). Probe 5c observed the Electron side on Linux. In Electron 44.4.5 under the repro's settings, a loopback `session.fetch` returned 200, from a session set to `direct` and from a fresh partition session (`session.fromPartition('probe-providers')`, not `session.defaultSession`), while the main process's global `fetch` failed with `ECONNREFUSED`. Two app paths use the global `fetch`: the GitHub reader (`src/main/github.ts:12`, created at `src/main/index.ts:193`) and the verified import's run read (`src/main/research-import.ts:69`, created at `src/main/index.ts:149` with no fetcher passed). Both call `api.github.com`, not loopback, so the opt-in sends them through the configured proxy. On Linux, the loopback failure is therefore confined to the tests and the e2e harness they load (`e2e/fixtures/collector-network.cjs`). Electron on Windows was not run (*unverified*).
> Action: not fixed. Recommended: one clause in AGENTS.md's Install row: "with `NODE_USE_ENV_PROXY=1`, `NO_PROXY` must list 127.0.0.1". A test fetcher that bypasses the environment proxy would be the code-side alternative, but how to build one was not checked (*unverified*). The decision is the lead's.

## Applied fixes

| Commit | Finding | Files |
|--------|---------|-------|
| `4b39e52` | F2 | `.gitattributes` |

The final full gate in the worktree on this tree gave: typecheck, lint and build exit 0; 1542 tests, 1462 passed, 74 failed, 6 skipped. The failing names are the baseline's, with the same md5. 10 failing files, none without results. This is identical to all three baselines. It was run again at `4b39e52` after verification, with the same result (tests 771 s, failing-set md5 `40f3a9069a92a8d590b8b3917f9aceb2`).

## Rejected fixes

- **F1: writing the key-shaped test values in two parts, joined at run time.** Every runtime value would have stayed byte-identical. The session's permission policy refused the edit as weakening a security check, and it was never applied. Whether the repository's secret scan should see these values is the owner's decision, as the leaf key was on 2026-10-03.

## Remaining risks

1. **F1's decision** (Low, Likely; observed). The options:
   - (a) values that are not key-shaped. No code in `src/` treats `sk-` specially: `grep -rn "sk-" src` finds nothing.
   - (b) values generated at test time, as P4-40 did.
   - (c) accept the standing blocker and record it.
   Decision: the owner's.
2. **The context-budget tests are coupled to the production system prompt with a narrow margin** (Low, Possible; observed).
   - Repro: in a throwaway clone, add a probe-only line after the system prompt is built in `src/engine/application.ts` that lengthens or shortens `system.content` by `BT_DELTA` characters. Then run `BT_DELTA=<n> npx vitest run tests/application.test.ts`.
   - All 41 tests pass from 142 characters shorter to 1,250 characters longer.
   - At 143 shorter, `the reserve holds on every unfrozen step: after a first step with no provider state, step 2 freezes and the run fits` fails. At 512 shorter 2 tests fail, and at 1024 shorter 3 fail.
   - At 1,251 longer, `a frozen step that does not fit after cutting only its unsent results ends with CONTEXT_LIMIT and the frozen message` fails. At 2048 longer, the four `threeReads` tests fail (budget 5,787).
   - The Ask-mode prompt is about 1,200 characters. Removing about a ninth of its wording turns a test red with no change in behaviour, and a similar cut to the tool declarations would probably do the same (not measured separately).
   - `tests/context.test.ts` is not coupled this way. A `TMPDIR` of 198 characters with a space and `ü` had no effect.
   - Recommended: derive these budgets from the measured first request, as `context.test.ts` derives `half`, instead of fixed numbers. Decision: the owner's.
3. **F3's remedy** (Low, Unlikely; observed on Linux). Decision: the lead's.
4. **`tsc --noEmit` no longer fits a 512 MB V8 heap since Phase 2** (Low, Unlikely; observed).
   - Repro: `NODE_OPTIONS=--max-old-space-size=512 npx tsc --noEmit`.
   - It exits 134 with `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory` at `2fb13ac` and `b5ce566`.
   - It exits 0 at `05221ad` and `b490e50`, and at 576 MB on `b5ce566`.
   - The default heap limit on the first supported PC was not checked (*unverified*).
   - Lint, build and the whole test suite ran under the same cap with no new failure.
5. **`npm audit`: 10 advisories (8 moderate, 2 high), all development-only** (Low, Possible; observed).
   - `npm audit --omit=dev` finds 0.
   - New since 2026-10-04, with no package change: `source-map-js@1.2.1`, high (GHSA-68fv-2mgg-jv7q), via `vite > postcss` and `jsdom > css-tree`; and `sprintf-js@1.1.3`, moderate (GHSA-hp3w-g68c-fv3c), via `electron-builder > app-builder-lib > @electron/get > global-agent > roarr`.
   - npm reports a non-breaking fix for `http-cache-semantics` and `source-map-js`. The rest only through `electron-builder@26.5.0`, which it marks semver-major.
   - Decision: the owner's.
6. **The slowest Phase 2 unit test** (Low, Unlikely; *unverified* on Windows). `anthropic.test.ts`, "a start object whose extra field is nested too deep for JSON.stringify is refused", takes 2.35 to 2.94 s against a 15 s timeout. Its 200 KB body is delivered in 7-byte chunks. Windows CI was green on `459a2cd` (`docs/orchestration/2026-10-05-more-models/RUN.md`, the Phase 2 merge entry).

The 2026-10-04 risks stand. Its risk 1(b) is unchanged: the same 3 test names are shared, so 1542 tests give 1532 keys. Phase 2 added no shared names.

## Probe defects

- **The memory cap reached the type checker.** The seed-20261012 run's 512 MB cap applied to the whole gate, so `tsc` aborted (`typecheck=134`). That run's tests, lint and build are valid. Typecheck was then measured separately (risk 4). Control: typecheck passes in all three baselines.
- **The first `ulimit` check read the checking shell's own process.** An unanchored `pgrep -f` reported 20000. Corrected with `^node .*vitest run`, which showed 256 together with the intended TZ, LANG and heap settings.
- **F3's condition is a developer setting, not a probe artefact.** The failure follows only from the opt-in environment proxy and goes away when that is unset, so it is reported as a finding.

## Probes run

The focus set is `anthropic`, `anthropic-transport`, `provider-transport`, `provider-stream`, `provider-screen`, `ollama-locality`, `context`, `application` and `workbench`: 505 tests.

| # | Probe | Command | Result |
|---|-------|---------|--------|
| 0 | Baseline ×3 | the gate, in the worktree | 1542 / 1462 / 74 / 6, the identical set ×3 |
| 1 | Clean checkout | fresh clone, `npm ci --cache <empty>`, `node node_modules/electron/install.js` (from the cache), kit pin copied; run with probes 5 and 9 | `added 477 packages`; handoff check and kit preparation pass offline; gate at baseline |
| 2 | Install | `npm ci` in the worktree and in the clean clone | rc 0; the allowScripts warning is unchanged |
| 3 | Generated code | `generate-research-fixtures.mjs --inventory-only`; `capture-collector-golden.ts`; `git status --porcelain` | 15 reports reproduced; no tracked change; no `rk-generation-*` folders |
| 5 | Environment | `env -i PATH=… HOME=<empty> TMPDIR=… LANG=C.UTF-8` (with 1 and 9); a search for `process.env` | baseline; no new variables read; no provider key read |
| 5b | Environment proxy | the `NODE_USE_ENV_PROXY` variants | F3 |
| 5c | Electron under the environment proxy | the script below, run as `env -u NO_PROXY -u no_proxy [NODE_USE_ENV_PROXY=1] HTTP_PROXY=http://127.0.0.1:9 HTTPS_PROXY=http://127.0.0.1:9 http_proxy=http://127.0.0.1:9 https_proxy=http://127.0.0.1:9 xvfb-run -a node_modules/electron/dist/electron --no-sandbox <probe-dir>` (`--no-sandbox` because the session ran as root) | Electron 44.4.5, Node 24.21.0. Without the opt-in: 200 ×3. With it: direct session 200, fresh partition session 200, main global `fetch` `ECONNREFUSED` → F3's scope |
| 6 | Order | the full gate with `--sequence.shuffle --sequence.seed=1` and with `=20261012`; the focus set with seeds 2, 3, 5, 8, 13, 21, 34, 55, 89 and 20261012; each focus file alone | file order changed; baseline both; 10 of 10 runs at 505/505; each file passes alone |
| 7 | Flakiness | the focus set ×20; six timing files ×10 under `taskset -c 0` | 20 of 20 at 505; 10 of 10 at 468; the 5 s bound tests took 5011 to 5022 ms against bounds of 4900 to 9500 ms |
| 8 | Timezone, locale | full gates under Kiritimati with C, and St_Johns with de_DE; the focus set under Kiritimati/C, St_Johns/de_DE, Kathmandu/ar_EG, Lord_Howe/tr_TR, Pago_Pago/ja_JP and London/C.UTF-8 | baseline; 505/505 ×6. Retry and deadline arithmetic uses epoch milliseconds, and an HTTP-date `retry-after` is never parsed (a test pins this) |
| 8b | Line endings | a clone with `core.autocrlf=true` (699 files CRLF); handoff check, kit preparation, 17 byte-sensitive test files (not the full suite) | 630 tests, 20 failures, all baseline → F2 |
| 8c | Context margins | system prompt lengthened and shortened, with bisection; a long `TMPDIR` | risk 2; the path had no effect |
| 9 | Network | `unshare -rn` with loopback up; the offline control was confirmed with curl and Node `ENETUNREACH` | baseline |
| 10 | Filesystem | `git ls-files -s` (1251 files, all 100644); TMPDIR after each suite | only `node-compile-cache` is left |
| 11 | Limits | `ulimit -n 256` with a 512 MB heap (with 6 and 8); `tsc` at 512 and 576 MB on 4 commits | tests, lint and build at baseline; risk 4 |
| 12 | Dependencies | `npm audit` and `npm audit --omit=dev` | risk 5 |
| — | `doctor` | at the root and at `05221ad` | F1 |
| — | Rename | workflow, README, HANDOFF and AGENTS.md compared; `grep -rni moonzila` over the code; how the user-data folder is named | consistent; nothing left; the data folder comes from `app.setName('MoonAliza')` and is unchanged |

Probe 5c's script is kept outside the repository. Abridged here, with the same calls: `main.js` beside a `package.json` of `{"main":"main.js"}`, and loopback only.

```js
const { app, session } = require('electron');
const http = require('node:http');
const server = http.createServer((q, s) => s.end('ok'));
const attempt = f => f().then(r => r.status, e => String(e?.cause?.code ?? e?.code ?? e?.message));
app.whenReady().then(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/api/status`;
  const direct = session.fromPartition('probe-local'); await direct.setProxy({ mode: 'direct' });
  const plain = session.fromPartition('probe-providers');
  console.log(await attempt(() => direct.fetch(url)), await attempt(() => plain.fetch(url)), await attempt(() => fetch(url)));
  server.close(); app.quit();
});
```

## Not probed

- **Windows legs.** The native helper with its 74 tests and the 6 Windows-only tests; `check-runtime.cjs`; the e2e suite, including `e2e/anthropic.spec.ts` with its fake and its 30 s cold-start check; packaging and fuses; Electron's proxy behaviour (probe 5c ran on Linux only). U5's Linux run under xvfb reached "Trust and open" (`reports/p2-wave2-workflow.json`).
- **Other toolchains.** Only Node 24.21.0 is installed, and `engines` and `.npmrc` are unchanged.
- **Permission probes.** The session ran as root, for which permission bits are not enforced.
- **A faked wall clock at a DST change or a year boundary.** No `faketime` is installed here. The six-zone matrix stands in for it.
- **Electron's download from the network and kit preparation without a pin.** Both reach GitHub (*unverified*: read from the scripts, not observed); the cache and a copied pin stood in.
- **The full suite on a CRLF checkout.** Only the 17 byte-sensitive files ran there (probe 8b).
- **Live providers.** No request was sent to a vendor, and the keys were never read.

## Summary

On Linux the build stays reproducible after More models Phases 1-2 and the rename. Three baselines, a clean offline checkout with a minimal environment, and two shuffled full runs under far timezones, other locales and fd and heap limits all returned the identical 74-name set. On a CRLF checkout, the 17 byte-sensitive files (630 tests) failed only 20 baseline names; the full suite was not run there. Thirty repeats of the new tests, ten of them on one CPU, plus 16 further seeds and locales showed no flake.

There are three findings, all Low. F1, a `doctor` READY state that Phase 2 undid, needs the owner's decision. F2, evidence rewritten by a CRLF checkout, is fixed in `4b39e52`. F3, loopback tests broken by an opt-in Node proxy, is recorded with a recommendation. On Linux it does not reach the app's loopback requests (probe 5c). The most useful open item is the context tests' 143-character margin against the production prompt (risk 2).

Review with `git log --oneline b5ce566..break-test/2026-10-12` and `git diff b5ce566...break-test/2026-10-12`. Remove the worktree with `git worktree remove /home/user/task5-handoff/wt/break-p12` once merged.

## Revisions after verification

The verifier's review was corrected before this report was first committed:
- **V2:** the Summary no longer says the CRLF checkout returned the 74-name set, because only 17 files ran there. F2's "No test failed" now reads "No new test failed".
- **V3:** F3's statement about the app now cites the code paths and rests on probe 5c, which was added in the fix round. The External facts row says the same.
- **A citation corrected in passing:** the test's `fetch` in `tests/ollama-locality.test.ts` is at line 60, not 63.

The full gate was re-run at `4b39e52` and is identical to the baseline.

The re-verification's points were applied by the lead when committing this report:
- **N1:** F3 now names both app paths on the global `fetch` (the GitHub reader and the verified import's run read); both call `api.github.com`.
- **N2:** F1 no longer quotes the three key-shaped test values, which would have added a fourth `doctor` blocker.
- **N3:** probe 5c's second session is a fresh partition session, not Electron's `defaultSession`.
- **V5, V6:** the CRLF renormalize note, the citation for Windows CI on `459a2cd`, and the *unverified* label on the Electron download remark.
