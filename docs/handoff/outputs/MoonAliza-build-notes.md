# MoonAliza 0.5 development build — 27 September 2026

Version **0.5.0 is installed** on this Windows PC. Open the MoonAliza Desktop or Start-menu shortcut. The full project remains in development.

Later source checkpoint on 27 September: the verified local-artifact backend now passes 262 tests, typecheck, lint and build, plus an actual portable Ollama download/extraction/owned-startup/Stop check. This work is not yet connected to the installed setup UI. See [the managed-artifact checkpoint](MoonAliza-managed-artifacts-checkpoint.md) for evidence and remaining integration work. The installed 0.5 details below remain its own release checkpoint.

Latest source checkpoint: the [managed Ollama provider subsystem](MoonAliza-managed-provider-checkpoint.md) is verified with **307 tests across 28 files**, native build, typecheck, lint and application build. Its real Ollama check confirms exact connected-socket ownership, cloud disabled, private inventory, owned Stop and queued port reuse. Model materialization, real qualification and main/setup integration remain underway; the installed version is still 0.5.0. The earlier [scheduler checkpoint](MoonAliza-scheduler-checkpoint.md) remains preserved separately.

Installed executable: `C:\Users\PC\AppData\Local\Programs\MoonAliza\MoonAliza.exe`.

## Ready to try

The **Hugging Face · Qwen3 4B** profile is saved in the installed app with the supplied credential encrypted by Windows. Its connection test passed. It uses `Qwen/Qwen3-4B-Instruct-2507:nscale` through the Hugging Face router. No new subscription or credits were purchased.

Open a project, review its trust prompt, then select **Allow cloud inference** in Project details to use this cloud profile. Ask and Plan can inspect files; Build proposes edits and commands for review. New projects start with local-only inference. Local Ollama profiles remain supported.

The live test used a generated project: the real model read a file, proposed the exact change, waited for approval, applied it, completed the run, and Undo restored the original bytes. The generated project and isolated test data were removed. This is a verified basic workflow, not a general coding-quality benchmark.

## New in 0.5

- **Local models** shows measured RAM, current available memory, CPU and graphics adapter details from the native Windows host.
- Missing GPU telemetry is shown as Unknown. Shared system memory is not presented as free GPU memory.
- **Check Ollama** inspects the existing default local service and its model inventory. It does not install, start, stop or modify that service.
- Available RAM is compared with a system reserve before model selection. A downloaded model is never automatically called qualified for coding.

This PC reports about **7.9 GiB physical RAM**, an Intel Pentium 4405U and Intel HD Graphics 510. During verification, available RAM was about **1.0 GiB**, below the **2.0 GiB reserve**. Available memory changes as other programs run. Local model installation and qualification are the next development stage; the working cloud connection does not require local inference memory.

## Verification

- **208 tests passed across 20 files**, with TypeScript and lint passing.
- **All five installed desktop journeys passed** with no failures, skips or retries: file review/apply/Undo/Stop; Git and commands/process-tree cancellation; hardware/local runtime readiness; recovery across restarts; encrypted profiles and saved history. Total: 135.61 seconds.
- Actual per-user **install → uninstall → reinstall** passed for 0.4. Uninstall preserved the saved SQLite database byte-for-byte, and reinstall restored the conversation.
- Actual **0.4 → 0.5 upgrade** preserved a saved conversation.
- Installed main, preload, engine, renderer, styles and native helper match the verified build outputs.
- A real Hugging Face adapter tool-call/result exchange passed, followed by the installed live-model edit and Undo check described above.
- The real token was absent from the temporary vault's plaintext. It was never written to source or printed in logs.

## Installer

`MoonAliza Setup 0.5.0.exe` is the current Windows x64 development installer. It is already installed on this PC; a reinstall is unnecessary for trying the app.

Size: **122,546,634 bytes**.

SHA-256: `858E07474CFDB0BC7732FBC0326BC3AF50F4FEDBB759C0F544A142A6299F3F50`

Windows Authenticode status: **NotSigned**. These checks cover this PC and do not establish a signed public release.

`MoonAliza-hardware.png` shows the actual installed hardware screen. `MoonAliza-live-edit.png` shows the review produced by the real model. Older installers remain alongside 0.5.

## Remaining full-project work

Managed local-model installation is in progress: the verified runtime/model artifact backend is implemented, while real candidate qualification, production runtime scheduling and setup integration remain. Streaming, additional provider families, token-aware context, skills, teams, missions, Research, diagnostics, updates, broader Windows qualification and signing remain in the plan.

File tools currently support bounded UTF-8 text and existing parent directories. Full defense against hostile concurrent filesystem changes and wider Git configurations remains unfinished. Approved commands run with the Windows account's access and are outside file Undo. Snapshot content has a shared 256 MiB budget; conversations, model files and filesystem allocation overhead have separate storage requirements.
