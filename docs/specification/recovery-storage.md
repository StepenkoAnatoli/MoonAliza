# Recovery and snapshot storage

Version 0.4 connects the approved stage B recovery workflow to the desktop. It does not claim full hostile-filesystem protection or a total application-data quota.

## Interrupted operations

At engine startup, active runs become interrupted. Prepared file and command operations become failed: they had no authorized effect in flight, and old approvals cannot be used after restart. Started effects become unknown. There is no automatic command or file mutation replay.

Recovery lists unknown and previously reviewed operations for the selected project, with unresolved items first and pagination. Each inspection or acknowledgement binds the original operation, project, input digest and permission revisions. Durable request identities make retries return the accepted response without repeating observation or mutation.

File inspection requires an idle, trusted project with the same trust revision and the normal sensitive-path, app-storage, link and file-size restrictions. It reads current bytes and compares hashes. Matching proposed contents changes the operation to completed. Matching original contents or neither version keeps it unknown: current bytes do not prove whether an action once occurred and was subsequently changed. Inspection never writes project files. A displayed observation includes its time and is not a guarantee about future contents.

Acknowledgement records the user's acceptance of the current state and leaves the original unknown status intact. It is permitted for old project trust revisions because it grants no filesystem authority. It releases snapshot protection only after active work ends. Commands cannot be reconciled from their current output or exit status; the user must inspect their effects and acknowledge uncertainty. The host waits for owned processes to settle before accepting recovery or new runs.

New Build tasks and history deletion are blocked while a project has unresolved unknown operations. Ask and Plan can still inspect the project. Recovery and undo hold an in-process maintenance lease so another run or deletion cannot begin during asynchronous file inspection.

## Snapshot retention

The default budget is 256 MiB of snapshot file content, shared across projects. Text files remain limited to 1 MiB each. Content digests deduplicate identical bytes. Complete before/after pairs are reserved under one serialized owner, and their journal references are recorded before another reservation may evict data. Undo holds the same owner while checking retained data and recording its reverse operation.

Pending, started, unacknowledged unknown and active-run write references are protected. Other snapshots are eligible for eviction, oldest file modification time first. An insufficient protected-data budget fails with a clear quota error before a new proposal or project mutation. Historical snapshots can expire; list and detail responses check availability and digest integrity, and Undo fails safely if a required snapshot is absent. Metadata and operation history remain in SQLite. This quota does not bound SQLite, conversations, logs, model artifacts or filesystem allocation overhead.

Snapshots are written to exclusive temporary files and fsynced before rename. Stale temporary files in the private snapshot directory are cleaned on the next serialized scan. Unexpected directory entries, links, hardlinks, oversized content and digest mismatches fail closed. Existing snapshots from an earlier version are counted; if they exceed the budget, the next reservation evicts eligible data or reports protected exhaustion.

## Verification scope

Tests exercise deduplication, exact usage, protected exhaustion, paired reservations, concurrent retention, corruption, expired Undo, cancelled pre-effect approvals, file reconciliation, stale authority and idempotent review. The desktop journey creates a real unknown command by terminating its owned helper after a test effect, restarts the app with journaled file-crash fixtures, checks conflict preservation and matching-content recovery, and verifies the command was executed only once. These are deterministic local fixtures, not real model qualification.
