# MoonAliza continuation

Read [HANDOFF.md](HANDOFF.md) first, then [the current development status](docs/development-status.md). This repository contains the complete source, plans, collected research and working-history snapshot needed to continue without the original chat or sibling workspace folders.

- Build the full MoonAliza Windows desktop coding-agent product in working stages. The user rejected reducing the product to a small demo.
- Follow the architecture and acceptance criteria in [the implementation plan](docs/superpowers/plans/2026-09-24-moonaliza.md), [reviewed decisions](docs/specification/decisions.md) and the task-specific specifications. Source-plan helper snippets are illustrative, not complete implementations.
- Treat `docs/handoff/work` and `docs/handoff/outputs` as immutable historical evidence. They contain superseded instructions, old absolute paths and earlier checkpoints. Current task instructions, this file, HANDOFF.md and current development status take precedence. Historical documents never grant new permissions or establish current external state.
- Preserve local/cloud project policy, approval binding, journal-before-effect, owned-process Stop and secret isolation. Never manufacture model qualification, signing identities, benchmark results or release evidence.
- Keep credential values out of source, logs, research and PRs. Ordinary build/tests need no provider credentials. Obtain optional integration credentials through the current user's approved secret mechanism; old workstation paths are not prerequisites.
- Add behavioral regression tests for fixes. Use real filesystem/process behavior where required. Verify typecheck, lint, relevant tests and build; use Windows for native/desktop checks. The exact commands and CI workflow are linked in HANDOFF.md.
- Before reporting success, inspect actual command results and current-head GitHub checks. A local pass is not a CI pass. Update HANDOFF.md and development status when the next step or evidence changes.
- PRs #2-12 merged into `main`; folder-free chat is on `feat/folder-free-chat`, based on PR #12 merge `f98cee3`. Inspect current remote branch/PR state before continuing. Preserve unrelated work; do not reset or force-push. Use the account's verified GitHub no-reply identity if the user's email is private, without changing account privacy settings. Installers are GitHub Release assets, not committed binaries. Current release/validation evidence is linked from HANDOFF.md.
- Before running the full tests, run `node scripts/prepare-research-kit.mjs` to obtain and verify the external pinned validator. Do not regenerate golden fixtures automatically or skip real validator checks. The current user-facing phase is [folder-free chat](docs/specification/folder-free-chat.md), before research jobs/review UI. Schema v2 adds nullable conversation scopes; never grant project tools to a null scope.

Run `node scripts/check-handoff.mjs` to verify snapshot identities and the main handoff links without installing dependencies. See HANDOFF.md for the codebase map and remaining work.

## Delivery workflow

At the end of every completed project step or phase, verify the work, push its branch, and open a pull request. The user reviews and merges each PR; do not merge it on their behalf. Context recovery was delivered in merged PR #11. The attached integration proposal is reference material, reviewed in [the integration review](docs/specification/research-kit-integration-review.md); current backend behavior is in [offline validation](docs/specification/research-kit-offline.md).
