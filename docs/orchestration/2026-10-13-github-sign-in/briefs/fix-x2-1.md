# Unit fix-x2-1: a crash before commit followed by an unreadable start must not lose the account (X2-1, S3)

Worktree and branch: named in the launch prompt (created by the lead from the integration head `9234c50`). Conventions:
`briefs/common.md` (commit identity; the trailer names the model that writes the commit plus the Claude-Session line;
the five-part commit report; `docs/ARCHITECTURE.md` staged with any change under `src/`; never `--no-verify`; no push).
Node 24 at `/versions/node/v24.21.0/bin`. Checks: `npm run typecheck`, `npx eslint <changed files>`,
`npx vitest run tests/github-account-store.test.ts tests/vault.test.ts` (both files green at the start: 91 and 8 tests).

## The finding (adjudicated real by three independent lenses; `reports/calibration-2-extra-findings.md`, X2-1)

Spec 4.5 row 2: a crash between `replace()` step 4 (the file write that names the new, still-staged pair) and step 5
(commit) is recovered by the next start, because "the refs are referenced, so the reconcile commits them". That holds
only when `open()` can read the file. When the next start's `open()` fails with an I/O error (`EBUSY`, `EACCES`: an
errno code other than `ENOENT`; `src/main/github-account-store.ts:84` sets `unread`), `disk` and `live` stay null, so
`references()` (`:101`) returns `[]`, and `src/main/index.ts:195` passes a reconcile set without the pair. The vault's
reconcile (`src/main/vault.ts`, `reconcile()`) then deletes the staged pair as unreferenced. The next readable start
finds the named refs gone and `finishStartup()` drops the account (for a refresh, the old pair in `retiredRefs` is
tombstoned and deleted as well). The account is lost although the file was valid all along. The U2-R9 test's comment
("so the next start signs in") and the U2-R13 fix (which re-reads the file at the next sign-in) both assume the pair
survives that start; it does not.

## The lead's design decision (rejected alternatives are named so you do not re-derive them)

When the store could not read its file, its reference set is unknown, so that start's reconcile must not delete
unreferenced staged entries. Implement exactly this:

1. `GitHubAccountStore.unreadAtOpen(): boolean` - true while `unread` holds (set by `open()`, cleared by `reread()`).
   A one-line accessor beside `openedAppChanged()`; document it as "the file could not be read at open(), so
   `references()` is incomplete and the startup reconcile must keep staged entries".
2. `Vault.reconcile(committedReferences, options?: { keepStaged?: boolean })` (`src/main/vault.ts`): with
   `keepStaged: true`, an unreferenced staged entry is neither committed nor deleted (left as it is, file included);
   referenced staged entries are still committed and tombstoned entries still deleted; the persist still runs. The
   default (no option) is the current behaviour, byte for byte. This is an additive optional parameter on a U0
   frozen contract; the lead authorises this one change and no other to `vault.ts` in this unit.
3. `src/main/index.ts:195`: `await vault.reconcile(new Set([...]), { keepStaged: githubStore.unreadAtOpen() });`
   with one comment line saying why (the GitHub store's file could not be read, so its references are unknown).
4. `docs/ARCHITECTURE.md`: one clause on the U0 vault line (reconcile's `keepStaged` option) and one on the U2 line
   (an unread file keeps staged entries through that start). The spec amendment (4.4 step 2 and 4.5 row 2) is the
   lead's: propose the sentences in your report, do not edit `docs/specification/`.

Rejected: retrying the read at `open()` (does not cover a persistent `EACCES`, and `open()` must never block
startup); teaching `references()` to list the vault's staged entries (the store has no such view, and inventing one
widens the U0 contract more than an option); skipping the whole reconcile on an unread file (tombstoned entries from
a sign-out would then survive a start, the GS-11 promise).

## Tests, red first, with guard-removal proofs

- `tests/github-account-store.test.ts`, under `describe('crash windows (S-7, 4.5)')`: the double fault. Take the
  disk as a crash after step 4 and before the first commit leaves it (the existing crash-window tests show how the
  snapshot is taken at a chosen vault call; the harness's `h.snapshot()` / `h.copy()` and the `SpyVault`), then run a
  start whose `open()` cannot read the file (the lstat swap of the U2-R9 test; `busyLstat` and `unreadStart` exist in
  the file) **with the reconcile called as index.ts now calls it** (`keepStaged: store.unreadAtOpen()`), then a
  readable start: `expectConsistent(dir, refsOf(next))` - the new pair is committed and live. Red at HEAD with the
  option absent (the pair is deleted: expected `[]` to equal the two refs). Add the refresh variant (old pair in
  `retiredRefs`) as a second row if the harness makes it cheap. Guard proof: `keepStaged` dropped from the call, or
  the option ignored in `reconcile()`, makes the test red again.
- `tests/vault.test.ts`: `reconcile(set, { keepStaged: true })` keeps an unreferenced staged entry (entry and file)
  and still deletes a tombstoned one and commits a referenced staged one; `reconcile(set)` with no option deletes the
  unreferenced staged entry as today (the existing test 'reconciles staged committed references without deleting them
  after a crash' stays green).
- Pre-mortem, check and state each in the report: (a) a sign-in in the unread session: `reread()` makes `disk` the
  file naming the still-staged pair, and step 4 retires `before.account`'s refs - `tombstone` then `remove` on a
  staged entry must work (vault.ts `tombstone` sets the state on any entry; verify, and say so); (b) `finishStartup()`
  in the unread session must still not rewrite the file (U2-R9) and must not null a live account (live is null
  there); (c) `keepStaged` also keeps an engine's or collector's own crash-left staged entries for one extra start;
  say that it is one session and the next readable start deletes them.

## Report

Return: commits (sha and subject), tests [{name, red, green}], guards, checks (each command with its exit and
counts, marked verified), proposedSpecText (the 4.4 / 4.5 sentences), stoppedAt, mistakes (the six fields, or
"nothing to report"), notes. Do not touch any file outside `src/main/github-account-store.ts`, `src/main/vault.ts`,
`src/main/index.ts`, `tests/github-account-store.test.ts`, `tests/vault.test.ts`, `docs/ARCHITECTURE.md`.
