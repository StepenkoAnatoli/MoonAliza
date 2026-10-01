# Folder-free chat design

The user authorized saved general chat and explicit workspace transitions, and continuing implementation. This is an architectural change to the existing conversation engine, not a second chat engine.

## Decisions

Use nullable project identity on sessions and runs. A synthetic project with a fake filesystem root would misrepresent permissions; a second chat database would duplicate history, recovery and inference logic. Nullable identity keeps the existing engine and explicitly denies project tools without a real trusted project.

Each session has a revisioned inference policy. General chats default to local-only. Existing and newly created project sessions default to cloud-allowed at the session layer, preserving the independently enforced project restriction. Effective policy is the stricter of session and project. Runs bind both revisions; main and engine check both before inference, and policy updates cancel active work.

Workspace attachment/switching creates a new session. A review dialog shows an editable, bounded handoff text (empty by default for project-origin transitions), destination and privacy policy. Only explicitly submitted text crosses the boundary as a user message; no tools, approvals, operations, hidden context or provider continuation state transfer. Source history remains saved. The new session inherits the source session restriction and the source project's effective restriction. Users can explicitly change that restriction later. Navigation alone transfers nothing and clears drafts.

The initial screen supports Ask and Plan, saved history and model selection. Build requires a workspace. No research/network-browsing capability is implied. Open project retains its existing native selection and trust ceremony. Create project uses a native save/location dialog, creates one new directory under an inspected local parent, then presents the existing trust ceremony. Model output cannot select folders or create workspace tickets.

## Persistence and migration

Schema v2 rebuilds sessions/runs with nullable project_id, adds session policy and run session-policy revision, retains all existing identities and dependent data, and validates foreign keys before committing. Null composite foreign keys are insufficient: runs also reference session_id directly and triggers enforce matching session/project identity, including null. Session project identity is immutable; transitions branch. Existing message rowids and FTS tables remain untouched.

The migration follows SQLite's documented create/copy/drop/rename transaction with foreign keys disabled outside the transaction and restored in finally. References: [ALTER TABLE](https://www.sqlite.org/lang_altertable.html#otheralter), [foreign keys](https://www.sqlite.org/foreignkeys.html#compositefk). No writable_schema editing. Tests must use an actual v1 schema fixture and populated dependent rows.

## Acceptance

General chat persists after restart; local-only blocks external admission without saving/sending the rejected prompt. Explicit consent changes policy without sending. Stop and policy revocation cancel active inference. Unoffered tool calls fail without a journal or filesystem effect. Existing coding and recovery continue. Branches preserve the original, carry only reviewed text, and retain stricter policy. Real Electron journey covers no-folder chat, restart, workspace creation/trust, attachment and reviewed edit. Separate regression tests cover migration, deletion cascades, scope forgery and rollback.

## Self-review

No dummy roots or implicit model permissions. Branching resolves conflicting project identities in historical runs without rewriting audit history. Draft clearing avoids accidental disclosure when navigating. A cloud-enabled project cannot weaken the conversation restriction. Installer qualification follows source verification; no unsigned production claim.
