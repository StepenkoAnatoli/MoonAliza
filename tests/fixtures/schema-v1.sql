-- Exact initialSchema SQL from MoonAliza f98cee387c6b8d5788e73a66736c21d40262bc7b src/engine/migrations.ts.
-- user_version=1 appended to model a database created by the pre-chat application.

CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, root_path TEXT NOT NULL,
  path_label TEXT NOT NULL, trusted INTEGER NOT NULL CHECK(trusted IN (0,1)),
  trust_revision INTEGER NOT NULL CHECK(trust_revision >= 0),
  policy TEXT NOT NULL CHECK(json_valid(policy)), missing INTEGER NOT NULL CHECK(missing IN (0,1)), created_at TEXT NOT NULL
) STRICT;
CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(id, project_id)
) STRICT;
CREATE INDEX sessions_project ON sessions(project_id, updated_at DESC);
CREATE TABLE profile_revisions (
  revision_id TEXT PRIMARY KEY NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL,
  kind TEXT NOT NULL, endpoint TEXT NOT NULL, model TEXT NOT NULL,
  context_tokens INTEGER NOT NULL CHECK(context_tokens > 0), output_tokens INTEGER NOT NULL CHECK(output_tokens > 0),
  locality TEXT NOT NULL CHECK(locality IN ('local','external')), secret_ref TEXT,
  revision INTEGER NOT NULL CHECK(revision > 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(id,revision), UNIQUE(id,revision_id)
) STRICT;
CREATE TABLE profiles (
  id TEXT PRIMARY KEY NOT NULL, revision_id TEXT NOT NULL UNIQUE,
  FOREIGN KEY(id,revision_id) REFERENCES profile_revisions(id,revision_id)
) STRICT;
CREATE TABLE runs (
  id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL, project_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('ask','plan','research','build','mission')),
  status TEXT NOT NULL CHECK(status IN ('queued','running','awaiting_approval','awaiting_review','cancelling','completed','failed','cancelled','interrupted')),
  profile_id TEXT NOT NULL, profile_revision_id TEXT NOT NULL,
  policy_revision INTEGER NOT NULL, trust_revision INTEGER NOT NULL,
  created_at TEXT NOT NULL, finished_at TEXT, next_seq INTEGER NOT NULL DEFAULT 1 CHECK(next_seq > 0),
  FOREIGN KEY(session_id,project_id) REFERENCES sessions(id,project_id) ON DELETE CASCADE,
  FOREIGN KEY(profile_id,profile_revision_id) REFERENCES profile_revisions(id,revision_id),
  UNIQUE(id,session_id), UNIQUE(id,project_id)
) STRICT;
CREATE INDEX runs_session ON runs(session_id, created_at);
CREATE TABLE messages (
  id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  run_id TEXT, role TEXT NOT NULL CHECK(role IN ('system','user','assistant','tool')),
  content TEXT NOT NULL, tool_call_id TEXT, tool_name TEXT, tool_calls TEXT CHECK(tool_calls IS NULL OR json_valid(tool_calls)),
  partial INTEGER CHECK(partial IS NULL OR partial IN (0,1)), created_at TEXT NOT NULL,
  FOREIGN KEY(run_id,session_id) REFERENCES runs(id,session_id) ON DELETE CASCADE
) STRICT;
CREATE INDEX messages_session ON messages(session_id,created_at);
CREATE TABLE provider_wire_state (
  message_id TEXT PRIMARY KEY NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  profile_revision_id TEXT NOT NULL REFERENCES profile_revisions(revision_id),
  state TEXT NOT NULL CHECK(json_valid(state))
) STRICT;
CREATE TABLE events (
  run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE, seq INTEGER NOT NULL CHECK(seq > 0),
  schema_version INTEGER NOT NULL CHECK(schema_version = 1), engine_epoch TEXT NOT NULL,
  type TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), at INTEGER NOT NULL,
  PRIMARY KEY(run_id,seq)
) STRICT;
CREATE TABLE operations (
  id TEXT PRIMARY KEY NOT NULL, run_id TEXT NOT NULL, project_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('read','write','command','research')),
  input_hash TEXT NOT NULL, policy_revision INTEGER NOT NULL, trust_revision INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('prepared','started','completed','failed','unknown')),
  input TEXT NOT NULL CHECK(json_valid(input)), result TEXT CHECK(result IS NULL OR json_valid(result)),
  before_ref TEXT, after_ref TEXT, snapshot_ref TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY(run_id,project_id) REFERENCES runs(id,project_id) ON DELETE CASCADE, UNIQUE(id,project_id)
) STRICT;
CREATE INDEX operations_run ON operations(run_id,created_at);
CREATE TABLE approvals (
  id TEXT PRIMARY KEY NOT NULL, operation_id TEXT NOT NULL, project_id TEXT NOT NULL,
  input_hash TEXT NOT NULL, policy_revision INTEGER NOT NULL, trust_revision INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('allow','deny')), created_at TEXT NOT NULL,
  FOREIGN KEY(operation_id,project_id) REFERENCES operations(id,project_id) ON DELETE CASCADE
) STRICT;
CREATE INDEX approvals_operation ON approvals(operation_id);
CREATE TABLE missions (
  id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL CHECK(revision > 0),
  state TEXT NOT NULL CHECK(json_valid(state)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX missions_project ON missions(project_id,updated_at DESC);
CREATE TABLE research (
  id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  run_id TEXT, status TEXT NOT NULL, state TEXT NOT NULL CHECK(json_valid(state)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY(run_id,project_id) REFERENCES runs(id,project_id) ON DELETE CASCADE
) STRICT;
CREATE INDEX research_project ON research(project_id,updated_at DESC);
CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL CHECK(json_valid(value))) STRICT;
CREATE TABLE accepted_requests (
  client_request_id TEXT PRIMARY KEY NOT NULL, method TEXT NOT NULL, canonical_input_hash TEXT NOT NULL,
  entity_id TEXT NOT NULL, response TEXT NOT NULL CHECK(json_valid(response)), accepted_at TEXT NOT NULL
) STRICT;
CREATE VIRTUAL TABLE history_fts USING fts5(content, content='messages', content_rowid='rowid', tokenize='unicode61');
CREATE TRIGGER messages_fts_insert AFTER INSERT ON messages BEGIN
  INSERT INTO history_fts(rowid,content) VALUES(new.rowid,new.content);
END;
CREATE TRIGGER messages_fts_delete AFTER DELETE ON messages BEGIN
  INSERT INTO history_fts(history_fts,rowid,content) VALUES('delete',old.rowid,old.content);
END;
CREATE TRIGGER messages_fts_update AFTER UPDATE ON messages BEGIN
  INSERT INTO history_fts(history_fts,rowid,content) VALUES('delete',old.rowid,old.content);
  INSERT INTO history_fts(rowid,content) VALUES(new.rowid,new.content);
END;

PRAGMA user_version = 1;
