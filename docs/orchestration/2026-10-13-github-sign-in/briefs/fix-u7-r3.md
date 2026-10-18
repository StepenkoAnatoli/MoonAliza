# Unit fix-u7-r3: U7 fix round 3 - U7-R9 and U7-R10 (both S3) from re-review 2

Worktree and branch: `/home/user/task5-handoff/wt/gsi-u7`, branch `build/gsi-u7`, HEAD `6833f3d` (eight U7 commits on
`683e9cd`; this brief is at `/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/fix-u7-r3.md`
and in the integration branch's run folder). Conventions: `docs/orchestration/2026-10-13-github-sign-in/briefs/common.md` in
the worktree, with one lead ruling that supersedes its line on model identifiers: the commit trailer names the model that
writes the commit (`Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` for you) plus the Claude-Session line; the
five-part commit report; never `--no-verify`; no push; tests only - U7 owns `tests/github-signin-invariants.test.ts` and its
fixtures, no `src/` change (so no map clause is owed). Node 24 at `/versions/node/v24.21.0/bin`. Run the file with a private
temp dir, as the reviewer did: `TMPDIR=$(mktemp -d) npx vitest run tests/github-signin-invariants.test.ts`; lint it with
`npx eslint tests/github-signin-invariants.test.ts`; `npm run typecheck`.

## U7-R9 (S3): two clear-file writes still pass T-6

(a) A token or device code written in clear and removed again with no GitHub request in between is missed, because the
per-request snapshot (U7-R5, commit 265cefc) runs only when a request goes out. (b) A clear write outside userData is
missed entirely, because the file scan walks `root` only, while the static guard lets `atomicJson` write to any path.
S-1 says "any file in clear". The reviewer's mutation P3 in `src/main/github-signin.ts` - import `atomicJson` from
`../models/artifact-files` and `rm` from `node:fs/promises`; in `commitPoint()`, after `flow.stage = 'storing';
flow.deviceCode = null;` (about line 295), add `const staging = (this as any).store.file + '.staging.json'; await
atomicJson(staging, { access: tokens.access, refresh: tokens.refresh }); await rm(staging, { force: true });` - leaves
the file green (4 passed). Mutation P4 (the same write to a path outside userData) likewise.

Fix (the reviewer prototyped it green on unchanged src and red under P3 and P4): record every `atomicJson` call's value,
whatever its path and however briefly the file lives - a test-side hook around `atomicJson` in `src/models/artifact-files`
(swap the export on the module object with `syncBuiltinESMExports`-style syncing as the lstat swap in
`tests/github-account-store.test.ts` does, or whatever the module's shape allows; do not change `src/`), serialised to
UTF-8 and UTF-16LE like the other scans, and fed into the T-6 marker scan. The expected failure text under P3:
`access1 in atomicJson: github/account.json.staging.json (UTF-8)`. Prove the hook load-bearing: with it removed, P3 and
P4 pass again (red-first the other way round: the mutation test is red on the unmutated hook-less harness? No - the
discipline here is: the new assertion must be green on unchanged src, and red under the named mutation; record both
runs with their counts and the failing message).

## U7-R10 (S3): a token in a child process's argv passes every test

S-1 names argv. T-6 scans only this process's `process.argv` and `execArgv`, and the static guard does not forbid
`child_process` in the new modules. The reviewer's mutation C1: `import { spawnSync } from 'node:child_process';` and,
in `commitPoint()` after line 295, `spawnSync('true', ['https://x-access-token:' + tokens.access +
'@github.com/acme/private-u7.git']);` - 4 passed.

Fix: add to the static guard's `moduleFindings` the alternatives `['"](?:node:)?(?:child_process|worker_threads)['"]` and
`\b(?:spawn|execFile|fork|execSync|spawnSync|execFileSync)\s*\(`; extend the guard's control string with
`import { spawn } from 'node:child_process';`, `spawnSync('git', [t]);` and `const w = require("worker_threads");` with
their expected hits; prove each new alternative load-bearing by removing it and seeing the control's expected hit
missing (as the U7-R4 and U7-R7 commits did for theirs). Under C1 the guard must be red with the module and line named.

## Out of scope

U7-R8 (S4, attribution) is the lead's and is settled by the ruling above; no commit touches it. No `src/` change; if a
fix needs one, stop and say so in `stoppedAt`.

## Report

Return: commits (one per finding), tests [{name, red, green}] (for each: green on unchanged src, red under the named
mutation with the message), guards, checks (typecheck, lint, the file's counts; each marked verified), stoppedAt,
mistakes (six fields or "nothing to report"), notes.
