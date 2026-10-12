# MoonAliza rename: decisions (lead, 2026-10-12)

Task statement (user, 2026-10-12): "MoonAliza it is" - the product name goes back from Moonzila to MoonAliza, as its own pull
request after More models Phase 2 merges (merged as `2fb13ac`). Recorded rule (plan, "Product name: MoonAliza again"): change
what users see (product name, window titles, installer name, docs); keep `app.setName('MoonAliza')`, the installer `appId`
(`com.moonaliza.desktop`) and the update feed, so existing installs keep their data.

Inputs: the read-only scout (`reports/scout.json`: five area sweeps and a completeness critic over all 183 files that name
Moonzila) and the two October 4 commits that made the earlier rename: `e7cdd4a` (MoonAliza -> "Monnzila") and `5082167`
(spelling -> Moonzila). Every value those commits changed was MoonAliza (or `moonaliza`) before them, and all four release
tags (v0.6.0-dev.1 .. v0.8.1-dev.1) shipped productName MoonAliza, package name `moonaliza` and author MoonAliza.

## Decisions

Each decision was taken by the lead under the user's standing instructions ("merge as you decide just be careful", "dont
lower quality"); the user may overrule any of them.

| # | Decision | Why | Set aside |
|---|----------|-----|-----------|
| R-1 | Everything a user sees says MoonAliza: window title (`src/main/index.ts` and `src/renderer/index.html` together), UI text, aria labels, the composer label "Message MoonAliza", run-failure and IPC public messages, the startup error dialog, the Anthropic hint and data-use sentence. | The task. | - |
| R-2 | The three system prompts (`application.ts` Ask/Build and folder-free, `research-review.ts` REVIEW_SYSTEM_PROMPT) and the branched-conversation handoff label (`App.tsx`) say MoonAliza. | Otherwise the model introduces itself by the old name in a visible chat; this restores the pre-October-4 text. No byte- or hash-pinned recording contains them (scout: the live fixtures use the probe prompt "You are a test assistant..."). | Keeping the prompts: the model would name itself Moonzila. |
| R-3 | The GitHub User-Agents (`Moonzila-public-repository-reader`, `Moonzila-research-import`) and the utility-process `serviceName` go back to their MoonAliza values. | Restores the released values; nothing reads or pins them. | Keeping them: harmless but leaves the old name in network traffic. |
| R-4 | Packaging goes back to the released values: `productName` MoonAliza (package.json and electron-builder.yml), package `name` `moonaliza`, `author` MoonAliza, package-lock.json name lines; the Windows workflow's exe paths, `scripts/check-fuses.mjs` and `tests/check-fuses.test.ts` follow in the same commit. | The recorded rule puts the installer name in scope; every released install already has these values, so they get their own names back. `appId` and `app.setName` are untouched, so the install identity and `%APPDATA%\MoonAliza` do not change. | Keeping `moonzila` as the package name: it sets the updater cache folder and the exe's CompanyName, and differs from every release. |
| R-5 | Moonzila-era developer or CI installs (built since October 4; no release shipped one) get a note in the PR and README: an interactive upgrade nests the app in `...\Programs\Moonzila\MoonAliza\` and taskbar pins to `Moonzila.exe` break; uninstall then install keeps the app data (`deleteAppDataOnUninstall` is false). | Read from electron-builder 26.15.3's NSIS templates (scout, packaging sweep), not run on Windows: stated as expected. | A migration step in the installer: no released install needs it. |
| R-6 | Code comments that name the product say MoonAliza (src, scripts, e2e fixtures), one rule for all. | The October 4 rename treated comments as in scope. | Mixed comments. |
| R-7 | Test-only identifiers go back to the `moonaliza` values the October 4 rename replaced (temp-dir prefixes, the e2e cookie name, screenshot names, the sentinel, the collector-network global and the spec lines naming it, the test CA name, client refs, marker ids), in coupled sets, in their own commit; test data that is not a name (`# Moonzila` in provider-transport, "Moonzila local checkout", "Moonzila repository evidence") is renamed with its byte-exact mirrors in the same file. | The old name should survive only in dated records and the operator's key variable; a codebase that mixes the names invites partial replaces. Coupled pairs (github-tls.ts/github-tls.test.ts prefix; collector-network.cjs/research-journeys.spec.ts/research-journeys.md global) move together. | Keeping them: no product effect, but ~75 stale identifiers. |
| R-8 | The composer selector is updated in place (17 e2e lines, 21 in tests/workbench.test.tsx, scripts/check-live-provider.mjs) in the same commit as the label. | Lockstep group; a name-free selector is a separate test-shape change, not this task. | Switching to a test id first. |
| R-9 | Current docs rename their undated product references (README, HANDOFF, AGENTS.md, CONTEXT.md if any, docs/ARCHITECTURE.md, docs/development-status.md, docs/specification/*, current plan sections). Specs that tests quote word for word (more-models.md, more-models-phase2.md section 7, research-review-ui.md) change in the same commit as the source string they quote. | Current docs describe the product. | - |
| R-10 | Dated records are never rewritten: docs/orchestration/**, docs/research/**, docs/evidence/** (except R-11), dated user-request sentences and dated decisions written while the product was named Moonzila (for example "User request, October 4: add more models to Moonzila", decision 13's `Moonzila.exe`), commit history, and the user's saved environment variable `MOONZILA_ANTHROPIC_API_KEY` (renaming it means the user re-saves the key; kept, and noted). | Accurate at the time they were written. | Renaming them as product references. |
| R-11 | Records the October 4 rename falsified are restored from `e7cdd4a^`: the October 2 decision "keep MoonAliza" (plan section and HANDOFF), the `/home/user/moonaliza` cwd lines, `decisions.md` line 3, `development-status.md`, `github-url-reading.md`, `2026-09-24-moonaliza.md`, and `docs/evidence/model-store-runtime.json`'s changed lines; the four broken references (managed-provider.md, managed-scheduler.md file names; windows-ci.md branch name; HANDOFF.md `cd`) are fixed. The commit report says it undoes a rewrite. | Restoring the text as it was written serves the rule against rewriting records; the rename that changed them is what broke it. | Leaving falsified text in place. |
| R-12 | `docs/specification/decisions.md` gains decision 14 ("the product name is MoonAliza again, 2026-10-12"), listing exactly what goes back and what was never renamed; decision 12 gets a one-line "Superseded by decision 14" note (not rewritten); decision 13 stays as written. | Decisions are superseded, never edited. | - |
| R-13 | Saved user data (run.failed texts, branched handoff messages that say Moonzila) is not migrated. | It is user history; mixed naming there is harmless. | A data migration. |
| R-14 | The GitHub repository name (Selenic today) and its URLs are unchanged here; renaming the repository back is the user's action. | Outside the repository. | - |

## Commits (revert test)

1. Source, renderer, tests and e2e for R-1, R-2, R-3, R-6 (src and e2e-fixture comments), R-8, with the spec and README
   quotes of those strings (R-9's word-for-word specs) and `docs/ARCHITECTURE.md`.
2. Packaging (R-4): package.json, package-lock.json, electron-builder.yml, .github/workflows/windows.yml,
   scripts/check-fuses.mjs, tests/check-fuses.test.ts, scripts comments (R-6), and docs that name the exe path.
3. Test-only identifiers (R-7).
4. Docs (R-9 rest, R-10, R-11, R-12, R-5's README note) and this run's RUN.md.

Each lockstep group (composer label; productName; system prompt and anthropic-fake.ts; bridge messages and their test
copies; exact-text unit tests) stays inside one commit.
