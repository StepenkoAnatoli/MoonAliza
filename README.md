# Moonzila

A Windows desktop coding assistant under active development. The full product plan includes local and API models, approved coding tools, research, skills, teams, and missions. The implementation follows working stages; the full scope is preserved in [the implementation plan](docs/superpowers/plans/2026-09-24-moonaliza.md).

**Continuing this project with another AI or a fresh checkout? Start with [HANDOFF.md](HANDOFF.md).** It maps the code, current state, next tasks, setup and verification. The repository includes the [research and working-history snapshot](docs/handoff/README.md), with exact-byte integrity checks and an inventory of all original workspace artifacts. No original chat or sibling folders are required.

The 0.8 development source supports public GitHub repository URL reading, saved general chat without a folder, explicit conversation privacy, reviewed workspace attachment/switching, trusted local projects, encrypted model profiles, Ask/Plan file and Git inspection, reviewed Build edits and commands, Stop, persistent history, crash recovery and local model readiness. Ollama, OpenAI-compatible and Anthropic API tool calling are implemented. Each write waits for an explicit before/after review; recorded file edits can be viewed and undone when the file still matches. Research, managed models, skills, teams, missions, and broader release qualification remain in progress.

## Run on Windows x64

Use Node.js 24 (the pinned build version is in `.node-version`) and npm. From this directory:

```powershell
npm ci
node node_modules/electron/install.js
npm run native:build
npm run dev
```

The native build downloads Zig 0.15.2 from its official distribution and verifies the pinned SHA-256 before extracting it into ignored `.tooling/`. It does not install a global compiler.

Start in **General chats**, add a model profile and send an ordinary question or plan without choosing a folder. Paste a public GitHub repository URL to list folders and read source files without a token. General chat has no local file or command access; other websites and private repositories are not supported yet. Use **Attach workspace** when you need coding tools: choose or create a folder, trust it, and review the text carried into a new conversation. The original stays saved. **Switch workspace** applies the same boundary to another project or a new general chat. You can also open a project directly and review its trust prompt. For an existing Ollama server, enter its loopback endpoint and the name of a tool-capable model already installed there. In a local-only conversation or project, Moonzila first asks that Ollama whether its cloud features are off (`/api/status`) and sends nothing when it cannot confirm it: turn them off (set `OLLAMA_NO_CLOUD=1`, or `"disable_ollama_cloud": true` in Ollama's server.json) and restart Ollama. An OpenAI-compatible profile on a loopback address is not checked this way. For OpenAI-compatible APIs, enter the provider's API base URL, model name, and credential. Set the context and response limits to values supported by the model. When a cloud profile is selected for a local-only conversation or project, **Review cloud access** explains the destination and asks for explicit permission before Send is enabled. Changing permission keeps the draft and does not send it. Use **Edit** in Model profiles to update the model/context limits; an existing encrypted key stays at its original endpoint unless explicitly replaced. API compatibility and actual model capability still require testing with your chosen provider.

For the Anthropic API, choose **Anthropic API** in Model profiles. Its endpoint is `https://api.anthropic.com/v1`, and the key is sent only as a Bearer token. Use an API key created for a single workspace: Moonzila sends no workspace header, so a key for several workspaces is not supported. An Anthropic profile always counts as cloud, even on a loopback address, so a local-only conversation or project refuses it before anything is sent. A local server that speaks this API can forward requests to a cloud (Ollama does for its cloud models), so an Ollama reached through this kind is treated as cloud too; for local-only work, use the Ollama kind. Within one task, the model's thinking is kept in memory and sent back unchanged with the task's later steps, as Anthropic requires; it is never shown or stored, and a later task does not reuse it. Thinking counts toward the maximum response, and a step can take several minutes (Moonzila waits up to 10 minutes for each). Once a step returns thinking, the task's earlier steps must be sent back unchanged, so Moonzila cannot shorten them for the rest of the task, and a long task can end with the context-limit message; split it into smaller requests. Moonzila stops an Anthropic step, rather than send it on, when any saved key appears in its text, thinking or tool calls; the match is exact text, so a short placeholder key saved for a local server (such as `ollama`) can stop steps that merely mention that word: leave the key blank where the server needs none. **Test connection** sends a short prompt with the profile's own maximum response and is never retried. Data use: Anthropic's commercial terms say it may not train models on your prompts and outputs; Claude Fable 5.1 requires 30-day retention and is not available under zero data retention unless Anthropic expressly authorizes it; if a chat or session is flagged, Anthropic may keep its inputs and outputs for up to 2 years; for how long other requests are kept, Anthropic's retention page refers to its commercial data retention policy, which Moonzila has not reviewed. Moonzila's Anthropic connection is tested against requests and responses recorded from the live API; the app itself has not yet been run against it.

Chat requests for every provider kind no longer carry the app session's cookies or saved sign-ins; the key travels only in its own header. A gateway that needs Windows-integrated sign-in (NTLM or Negotiate, at a proxy or at the server) or a client certificate may therefore refuse them. A proxy sign-in that the app's browser engine (Chromium) has already cached is still sent.

Long tool results remain saved in the conversation. The model receives marked excerpts and can request more with `read_tool_result` without repeating a command. Expand **Context estimate** to inspect the estimated input budget, response reserve and last provider-reported token usage. If the request still cannot fit, use **Review context settings** or **Start fresh with this request**; the latter prepares a draft and never sends automatically. Previous edits remain applied and available for review/Undo. See [context behavior and limits](docs/specification/context-recovery.md).

Development installers and their checksums are published as [GitHub prereleases](https://github.com/StepenkoAnatoli/MoonAliza/releases). Read the [0.8 development release record](docs/releases/0.8.1-dev.1.md) for validation and limits.

Open **Local models** to read this PC's physical RAM, current available RAM, CPU and graphics adapter details. Free GPU memory remains Unknown when the driver cannot supply a measurement that is matched to the adapter. The screen compares available RAM with the larger of a 2 GiB or 15% system reserve; it does not qualify a model by its download size. **Check Ollama** explicitly reads the existing default loopback service and lists installed model identities. This check never starts or stops that service or modifies its models. Hardware probe failure does not prevent use of model profiles.

After attaching or opening a workspace, choose Build and describe a file change. Review the before/after contents and select **Approve edit** or **Decline edit**. Stop cancels a pending review. Expand **Project changes** to inspect recorded changes or undo an unchanged edit after the run finishes. Existing parent directories and UTF-8 text files are supported; sensitive paths, links and app storage are excluded.

Build can also propose commands using installed Node, npm, Python, Git or Windows PowerShell. **Approve command** shows the resolved executable, literal arguments, working folder and timeout. npm runs through Node and its installed CLI; PowerShell starts without a profile. Commands run with your Windows account's access, can use the network, and are not covered by file Undo. App credential environment variables are not inherited. Stop waits for owned processes to terminate; ambiguous results stop the run without automatic retry. Exit status, timeout and output truncation are retained for the model.

**Recovery** lists interrupted edits and uncertain commands across the project. Inspect an interrupted file to compare its current contents with the recorded versions. Matching proposed contents resolves the edit; unchanged or conflicting contents remain uncertain until you acknowledge your review. Acknowledgement preserves the unknown outcome and never repeats the action. Build is blocked until unresolved outcomes are reviewed; Ask and Plan remain available.

**Undo snapshots** shows the shared 256 MiB snapshot budget. Pending edits, active runs and unresolved writes are protected. Older completed snapshots are evicted as needed, and the change list disables Undo when either version is unavailable. If protected data fills the budget, a new proposal fails before changing project files. Conversations, operation history and model storage are separate from this budget. See [recovery and snapshot behavior](docs/specification/recovery-storage.md).

Git status, summary/per-file diff, and recent log use fixed arguments without approval. Unsupported local configuration, linked worktrees, alternate object stores, links and overly large repositories are declined. See [Git inspection boundaries](docs/specification/git-inspection-sources.md).

## Verify

```powershell
node scripts/prepare-research-kit.mjs
node scripts/check-handoff.mjs
npm run typecheck
npm run lint
npm test
npm run build
node node_modules/electron/cli.js scripts/check-runtime.cjs
npm run test:e2e
```

Tests include real SQLite persistence, Windows Job Object process cleanup, file journals and conflict-safe undo, bounded Windows hardware inspection, local-runtime response validation, and desktop journeys. Automated inference journeys use deterministic local HTTP fixtures; they are not real model quality benchmarks. The native helper must be built before running tests.

Offline Research Kit tests use exact recorded producer ZIPs and the actual pinned external validator; preparation needs Git/network access but no provider credentials. See [offline validation and its limits](docs/specification/research-kit-offline.md). Research jobs, review UI and Build gating are later stages. [Folder-free chat](docs/specification/folder-free-chat.md) is the next recommended user-facing phase; current desktop conversations still require a project.

An optional live Hugging Face verifier, `node scripts/check-live-provider.mjs <installed-executable> <HF-token-file> [model:provider]`, uses a generated project and isolated app data. It checks encrypted profile storage, connection, real file-read/edit proposals, exact approval, completion and Undo, then removes its temporary data. Running it explicitly sends synthetic content to the named cloud provider and may use inference credits. It is excluded from ordinary tests and never prints the token. Version 0.5 passed this smoke check with `Qwen/Qwen3-4B-Instruct-2507:nscale`; larger coding qualification remains outstanding.

```powershell
npm run package:win
```

This produces a development NSIS installer in `release/`. A build without a configured signing identity is unsigned and is not a qualified public release. `package:release` requires signing. No provider keys belong in this repository; the app keeps encrypted credentials in its per-user data directory.

## Architecture and status

- Electron main owns native folder selection, credentials, model network requests and the command/Git broker.
- An isolated utility engine owns SQLite, durable requests, events and run lifecycle.
- A sandboxed React renderer uses validated request/response/event contracts.
- A Windows C++ helper creates commands suspended, assigns them to owned Job Objects, and waits for descendants to exit on Stop or owner death.
- File edit proposals retain before/after snapshots and approval identities. The engine pauses for review, records tool results and continues the model loop after an approved edit. Undo refuses to overwrite later user changes.

See [decisions](docs/specification/decisions.md), [source specification](docs/specification/source-plan.md), and [development status](docs/development-status.md) for the scope and remaining work.

Stage D2's verified artifact backend now has signed catalogue validation, streamed resumable downloads, bounded ZIP extraction and atomic set activation. It is not yet connected to the setup UI. [Artifact boundaries and measured runtime evidence](docs/specification/managed-artifacts.md) describe its requirements. The opt-in developer command `node --import tsx scripts/check-runtime-artifacts.ts` verifies the real pinned portable Ollama archive and owned startup/Stop; it downloads about 1.46 GB if uncached and uses about 1.93 GB of temporary extraction space. It does not download a model or qualify coding performance.

The [managed inference scheduler core](docs/specification/managed-scheduler.md) adds bounded FIFO admission, stale-holder fencing, queue/heartbeat/hard deadlines, awaited runtime cleanup, maintenance ownership and shutdown. The [managed Ollama provider subsystem](docs/specification/managed-provider.md) connects it to verified runtime startup, exact connected-socket ownership before prompt bytes, cloud-disabled private storage, explicit native chat limits, model/configuration checks and confirmed Stop. Its real Ollama verifier checks this production path and queues a follow-up lease that must find the old port released.

[Verified model storage and local selection](docs/specification/model-store-selection.md) now preserve exact model manifests, copy/hash shared blobs into activation staging, revalidate installed files and clear derived metadata before runtime startup. Local selection requires matching lab and machine evidence plus current measured memory headroom; unknown GPU memory cannot become a capacity estimate. The opt-in `node --import tsx scripts/check-model-store.ts` passed real pinned Qwen3 0.6B installation/inventory and owned Stop checks. It downloads about 523 MB if uncached and performs no model inference or coding qualification. Real qualification, production trust inputs and main/setup UI integration remain in progress; the installed app remains version 0.5.

Per-user installation, uninstall data preservation and reinstall were exercised with version 0.4 on the development PC. Upgrade to 0.5 preserved a saved conversation and all five installed desktop journeys passed. The verifier `scripts/check-installed.mjs` intentionally operates on an installed app's default data directory; it refuses to seed a nonempty project list and must only be used for explicit installation qualification.
