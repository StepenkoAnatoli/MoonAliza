# Unit fix-x2-2: the vault must not leave an encrypted file that no index names when staging fails (X2-2, S3)

Worktree and branch: named in the launch prompt (created by the lead from the integration head `9234c50`). Conventions:
`briefs/common.md` (commit identity; the trailer names the model that writes the commit plus the Claude-Session line;
the five-part commit report; `docs/ARCHITECTURE.md` staged with any change under `src/`; never `--no-verify`; no push).
Node 24 at `/versions/node/v24.21.0/bin`. Checks: `npm run typecheck`, `npx eslint src/main/vault.ts tests/vault.test.ts`,
`npx vitest run tests/vault.test.ts tests/github-account-store.test.ts` (green at the start: 8 and 91 tests).

## The finding (adjudicated real by three independent lenses; `reports/calibration-2-extra-findings.md`, X2-2)

`Vault.saveStaged` (`src/main/vault.ts`, the block ending at `return ref` near line 92) encrypts the secret, writes and
fsyncs `<ref>.bin` with `open(..., 'wx', 0o600)`, sets the in-memory index entry `{ state: 'staged' }`, then awaits
`persist()`. When the persist throws (the index write or its rename: `ENOSPC`, `EIO`, a locked `index.json` on
Windows), `saveStaged` rejects without unlinking the file or dropping the memory entry. The caller never receives the
ref (`GitHubAccountStore.replace()` step 2 discards only refs `saveStaged` returned), `initialize()` and `reconcile()`
walk index entries only, and the on-disk index never names the ref: an encrypted token file that nothing will ever
delete is left in the vault directory. The in-memory entry also lingers until the process ends (a later successful
persist would then write a staged entry with no owner, which the next start's reconcile deletes - but the file only
then). It is U0 code on the sign-in's path, and the privacy invariant of this build is that no token outlives its
owner on disk.

## The lead's design decision

In `saveStaged`, on a failed `persist()`: delete the in-memory entry, unlink `<ref>.bin` tolerating `ENOENT`, and
rethrow the persist's error unchanged (the caller's `ReplaceFailure(false)` path and its message stay as they are).
Nothing else changes: not `initialize()`, not the serial queue, not the entry shape. Rejected: a sweep in
`initialize()` that deletes `.bin` files no index entry names (a second line of defence worth its own decision, but it
would also delete a file whose index persist is mid-rename on a crash, and the lead has not settled that; note it as
a follow-up in your report); writing the index before the file (the file must exist before an entry names it, or a
crash leaves a committed-looking entry with no secret, the REDACTION_UNAVAILABLE failure U2 already met).

## Tests, red first, with guard-removal proofs

- `tests/vault.test.ts`: a staging whose index persist fails leaves no file and no entry. Make `persist` fail on the
  instance, as `tests/github-account-store.test.ts`'s `failVaultDisk` does (`(vault as unknown as { persist: () =>
  Promise<void> }).persist = async () => { throw new Error('EIO'); }`, restored afterwards), call `saveStaged`, assert
  it rejects with that error, that the vault directory holds no new `.bin` (list it before and after), and that after
  restoring `persist` a later `saveStaged` + `commit` + `has` work and `reconcile(new Set([thatRef]))` leaves exactly
  one `.bin`. Red at HEAD: the directory holds one extra `.bin` after the failed call. Guard proof: the unlink removed
  leaves the file (red); the entry deletion removed leaves a staged entry that the next `reconcile` turns into a
  deleted file - assert on the entry through `reconcile`'s effect or through a second failed-then-restored cycle; say
  which.
- The store file stays green (`tests/github-account-store.test.ts`), including 'a staging failure throws
  ReplaceFailure(false) and leaves no entry' (which fails inside the spy before the real vault writes, so it does not
  cover this case: say so in the report, do not change it).
- `docs/ARCHITECTURE.md`: one clause on the U0 vault line.

## Report

Return: commits, tests [{name, red, green}], guards, checks (each with exit and counts, verified), stoppedAt,
mistakes (six fields or "nothing to report"), notes (the initialize() sweep follow-up among them). Do not touch any
file outside `src/main/vault.ts`, `tests/vault.test.ts`, `docs/ARCHITECTURE.md`.
