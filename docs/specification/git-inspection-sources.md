# Git inspection implementation notes — 2026-09-26

Official references checked:

- [Git command and environment reference](https://git-scm.com/docs/git): optional locks, lazy object fetches, replace objects, literal pathspecs and configuration environment.
- [Git configuration reference](https://git-scm.com/docs/git-config): fsmonitor can invoke a hook; includes load additional settings. `GIT_CONFIG` applies to the config command and does not disable repository config for other commands.
- [Git diff reference](https://git-scm.com/docs/git-diff): explicitly disable external diff and textconv helpers and ignore submodules.

Implementation: fixed status/diff/log argument templates, ordinary environment only, global/system config disabled, no optional locks, no lazy fetch, no replace objects, no pager, protocol access disabled. Local config accepts a deliberately small grammar and key allowlist. Unknown settings, config includes, executable settings, linked worktrees, alternate object stores, partial-clone pack markers, links and hardlinks are rejected. Inspection is bounded to 50,000 directory entries, 15 seconds of process execution and 60 KB of output.

Diff without a path returns statistics. A patch requires a validated non-sensitive file path; descendant paths are explicitly excluded because Git can otherwise treat a replaced/deleted directory name as a path prefix. Tests use real repositories and marker files to check these boundaries.

This does not isolate Git from a hostile program concurrently rewriting the repository. Handle-relative filesystem hardening remains open. Ordinary Git configurations outside the allowlist are reported as unsupported; the app does not silently relax inspection rules or convert the read tool to arbitrary execution.
