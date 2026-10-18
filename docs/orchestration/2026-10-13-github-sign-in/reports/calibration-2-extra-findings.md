# Calibration run 2: extra findings for the integration review

Source: the 15 calibration-2 reviews of `src/main/github-account-store.ts` at `d3aaf21` (`wf_fe91e1d6-d78`), graded
per candidate, then the six recurring claims adjudicated by three independent lenses each (`wf_603131fc-773`; details in
`docs/orchestration/smartrouter/trace/calibration-2/lead-notes.md`, G-1). The claims were judged at `d3aaf21`; the
integration review must re-check each real one at the branch head (U2's later fixes `d0bb208`, `587d445`, `97b0b9e`
touched replace() and open(), not references() or the vault).

## Real (adjudicated 3/3)

- **X2-1 (S3) C-B: a crash between replace() step 4 (the file write naming the new, still-staged pair) and step 5
  (commit), followed by a start whose open() cannot read the file (an I/O error), loses the account.** open() leaves
  disk and live null, so `references()` returns [] and that start's `vault.reconcile` deletes the staged pair the file
  names as unreferenced; the next readable start finds the named refs gone and finishStartup drops the account (for a
  refresh, the retired old pair is deleted too). Spec 4.5 row 2 promises the opposite ("the refs are referenced, so the
  reconcile commits them"), and the U2-R9 test's comment promises that the next start signs in. Reproduced by three
  lenses with the real Vault and the real startup order. Raised by sonnet-medium (R-2), sonnet-xhigh (R-4), opus-high
  (R-5), opus-xhigh (R-3), opus-max (R-3). Candidate fix: when open() could not read the file, `references()` must not
  claim an empty set - either read the refs the unread file names once it is readable (the `unread` re-read of
  587d445 is in replace(), not in references()), or make the reconcile skip deletion of staged entries while the store's
  file is unread (a "reconcile-unsafe" flag the startup honours), with a red-first test of the double fault.
- **X2-2 (S3/S4) C-C: `vault.saveStaged` writes and fsyncs `<ref>.bin` and sets the in-memory entry before
  `persist()`; when the persist fails nothing unlinks the file**, the store never receives the ref so its step-2 discard
  cannot remove it, and `initialize()`/`reconcile()` walk index entries only: an encrypted token file no index names is
  left for good. Unit U0 (`src/main/vault.ts:87-91`), on replace()'s step-2 path; reachable (ENOSPC/EIO on the index
  write, a locked index.json on Windows). Raised by haiku-high (R-3), opus-max (R-4), sonnet-high (R-4, filed S4).
  Candidate fix: unlink the .bin (tolerating errors) and drop the memory entry when the persist throws in saveStaged,
  red-first; or have initialize() delete .bin files no index entry names.

## Not real (recorded so the integration review does not re-litigate them)

- C-A: `clear(() => true)` after an unreadable open answers 'durable' without writing (the file still names the
  account; the next start is signed in). Holds in code (3/3) but unreachable: the renderer offers Sign out only while
  signed in, clearIf refuses on live null, the app-changed path never calls clear. S4 contract hole; a one-line
  defensive fix (answer 'not-durable', or re-read, when disk is null) is reasonable but not owed. Seven candidates
  raised it; see G-1 for how the graders split on it.
- C-D: cap() ignores a failed removal (a dropped ref unnamed and committed). Mechanically true, but no flow leaves a
  dropped ref committed in the on-disk index: the natural paths record the tombstones first. S4 at most.
- C-E: a retired ref whose tombstone never reached disk is un-named by finishStartup. Needs a reconcile failure that
  startup survives; `index.ts` awaits the reconcile without a catch, so startup aborts first. Not reachable.
- C-F: setLogin dropped after a refresh whose commit failed. The store behaves so, HEAD pins it, and the service clears
  the account on any refresh ReplaceFailure, so no login is owed.
