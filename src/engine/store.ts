import Database from 'better-sqlite3';
import { assertSupportedSchema, migrate } from './migrations';

export interface StoreProject {
  id: string; name: string; rootPath: string; pathLabel: string; trusted: boolean; trustRevision: number;
  policy: { revision: number; inference: 'local-only' | 'cloud-allowed'; research: 'off' | 'public-technical' | 'private-connected' };
  missing: boolean; createdAt: string;
}
export interface StoreSession { id: string; projectId: string; title: string; createdAt: string; updatedAt: string }
export interface StoreProfile {
  id: string; name: string; kind: 'openai-compatible' | 'openai-responses' | 'anthropic' | 'ollama'; endpoint: string; model: string;
  contextTokens: number; outputTokens: number; locality: 'local' | 'external'; secretRef?: string;
  revision: number; revisionId: string; createdAt: string; updatedAt: string;
}
export type StoreRunStatus = 'queued' | 'running' | 'awaiting_approval' | 'awaiting_review' | 'cancelling' | 'completed' | 'failed' | 'cancelled' | 'interrupted';
export interface StoreRun {
  id: string; sessionId: string; projectId: string; mode: 'ask' | 'plan' | 'research' | 'build' | 'mission';
  status: StoreRunStatus; profileId: string; profileRevisionId: string; policyRevision: number; trustRevision: number;
  createdAt: string; finishedAt?: string;
}
export interface StoreMessage {
  id: string; sessionId: string; runId?: string; role: 'system' | 'user' | 'assistant' | 'tool'; content: string;
  toolCallId?: string; toolName?: string; toolCalls?: Array<{ id: string; name: string; input: unknown; inputError?: string }>;
  partial?: boolean; createdAt: string;
}
export interface StoreEvent {
  schemaVersion: 1; engineEpoch: string; runId: string; seq: number; type: string; payload: unknown; at: number;
}
export interface StoreOperation {
  id: string; runId: string; projectId: string; kind: 'read' | 'write' | 'command' | 'research'; inputHash: string;
  policyRevision: number; trustRevision: number; status: 'prepared' | 'started' | 'completed' | 'failed' | 'unknown';
  input: unknown; result?: unknown; beforeRef?: string; afterRef?: string; snapshotRef?: string; createdAt: string; updatedAt: string;
}
export interface StoreApproval {
  id: string; operationId: string; projectId: string; inputHash: string; policyRevision: number; trustRevision: number;
  decision: 'allow' | 'deny'; createdAt: string;
}
export interface StoreMission { id: string; projectId: string; title: string; status: string; revision: number; state: unknown; createdAt: string; updatedAt: string }
export interface StoreResearch { id: string; projectId: string; runId?: string; status: string; state: unknown; createdAt: string; updatedAt: string }
export interface AcceptedRequestKey { method: string; clientRequestId: string; canonicalInputHash: string }
export interface AcceptedResult<T = unknown> { entityId: string; response: T; replayed: boolean }

type Row = Record<string, unknown>;
type Column = readonly [property: string, column: string, encoding?: 'json' | 'boolean'];
const projectColumns: Column[] = [['id','id'],['name','name'],['rootPath','root_path'],['pathLabel','path_label'],['trusted','trusted','boolean'],['trustRevision','trust_revision'],['policy','policy','json'],['missing','missing','boolean'],['createdAt','created_at']];
const sessionColumns: Column[] = [['id','id'],['projectId','project_id'],['title','title'],['createdAt','created_at'],['updatedAt','updated_at']];
const profileColumns: Column[] = [['id','id'],['name','name'],['kind','kind'],['endpoint','endpoint'],['model','model'],['contextTokens','context_tokens'],['outputTokens','output_tokens'],['locality','locality'],['secretRef','secret_ref'],['revision','revision'],['revisionId','revision_id'],['createdAt','created_at'],['updatedAt','updated_at']];
const runColumns: Column[] = [['id','id'],['sessionId','session_id'],['projectId','project_id'],['mode','mode'],['status','status'],['profileId','profile_id'],['profileRevisionId','profile_revision_id'],['policyRevision','policy_revision'],['trustRevision','trust_revision'],['createdAt','created_at'],['finishedAt','finished_at']];
const messageColumns: Column[] = [['id','id'],['sessionId','session_id'],['runId','run_id'],['role','role'],['content','content'],['toolCallId','tool_call_id'],['toolName','tool_name'],['toolCalls','tool_calls','json'],['partial','partial','boolean'],['createdAt','created_at']];
const operationColumns: Column[] = [['id','id'],['runId','run_id'],['projectId','project_id'],['kind','kind'],['inputHash','input_hash'],['policyRevision','policy_revision'],['trustRevision','trust_revision'],['status','status'],['input','input','json'],['result','result','json'],['beforeRef','before_ref'],['afterRef','after_ref'],['snapshotRef','snapshot_ref'],['createdAt','created_at'],['updatedAt','updated_at']];
const approvalColumns: Column[] = [['id','id'],['operationId','operation_id'],['projectId','project_id'],['inputHash','input_hash'],['policyRevision','policy_revision'],['trustRevision','trust_revision'],['decision','decision'],['createdAt','created_at']];
const missionColumns: Column[] = [['id','id'],['projectId','project_id'],['title','title'],['status','status'],['revision','revision'],['state','state','json'],['createdAt','created_at'],['updatedAt','updated_at']];
const researchColumns: Column[] = [['id','id'],['projectId','project_id'],['runId','run_id'],['status','status'],['state','state','json'],['createdAt','created_at'],['updatedAt','updated_at']];

function json(value: unknown): string {
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new TypeError('Persisted value must be JSON serializable');
  return encoded;
}

function decode<T>(row: unknown, columns: Column[]): T | undefined {
  if (!row) return undefined;
  const result: Row = {};
  for (const [property, column, encoding] of columns) {
    const value = (row as Row)[column];
    if (value !== null && value !== undefined) result[property] = encoding === 'json' ? JSON.parse(value as string) : encoding === 'boolean' ? value === 1 : value;
  }
  return result as T;
}

function pageLimit(limit: number, max = 1000): number {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > max) throw new RangeError(`Page limit must be between 1 and ${max}`);
  return limit;
}

/** Engine-private store. The application maps these records to renderer DTOs. */
export class Store {
  private readonly db: Database.Database;
  private readonly engineEpoch: string;
  constructor(path: string, options: { engineEpoch?: string } = {}) {
    this.engineEpoch = options.engineEpoch ?? 'standalone';
    this.db = new Database(path);
    try {
      assertSupportedSchema(this.db);
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = FULL');
      this.db.pragma('busy_timeout = 5000');
      migrate(this.db);
    } catch (error) { this.db.close(); throw error; }
  }

  close(): void { if (this.db.open) this.db.close(); }
  transaction<T>(work: () => T): T {
    return this.db.transaction(() => {
      const result = work();
      if (result && typeof (result as { then?: unknown }).then === 'function') throw new TypeError('Store transactions must be synchronous');
      return result;
    }).immediate();
  }

  private write(table: string, columns: Column[], record: object, upsert = false, key = 'id'): void {
    const input = record as Row;
    const values = columns.map(([property,,encoding]) => input[property] === undefined ? null : encoding === 'json' ? json(input[property]) : encoding === 'boolean' ? (input[property] ? 1 : 0) : input[property]);
    const names = columns.map(([,column]) => column);
    const conflict = upsert ? ` ON CONFLICT(${key}) DO UPDATE SET ${names.filter(name => name !== key).map(name => `${name}=excluded.${name}`).join(',')}` : '';
    this.db.prepare(`INSERT INTO ${table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})${conflict}`).run(...values);
  }
  private one<T>(table: string, columns: Column[], id: string): T | undefined { return decode<T>(this.db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id), columns); }
  private many<T>(query: string, columns: Column[], ...parameters: unknown[]): T[] { return this.db.prepare(query).all(...parameters).map(row => decode<T>(row, columns)!); }

  putProject(project: StoreProject): void { this.write('projects', projectColumns, project, true); }
  getProject(id: string): StoreProject | undefined { return this.one('projects', projectColumns, id); }
  listProjects(): StoreProject[] { return this.many('SELECT * FROM projects ORDER BY created_at,id', projectColumns); }
  deleteProject(id: string): void { this.transaction(() => { this.db.prepare('DELETE FROM projects WHERE id=?').run(id); }); }
  putSession(session: StoreSession): void { this.write('sessions', sessionColumns, session, true); }
  getSession(id: string): StoreSession | undefined { return this.one('sessions', sessionColumns, id); }
  listSessions(projectId: string): StoreSession[] { return this.many('SELECT * FROM sessions WHERE project_id=? ORDER BY updated_at DESC,id', sessionColumns, projectId); }
  deleteSession(id: string): void { this.transaction(() => { this.db.prepare('DELETE FROM sessions WHERE id=?').run(id); }); }

  putProfile(profile: StoreProfile): void {
    this.transaction(() => {
      const existing = this.getProfileRevision(profile.revisionId);
      if (existing) {
        const fields = profileColumns.map(([property]) => property);
        if (fields.some(field => (existing as unknown as Row)[field] !== (profile as unknown as Row)[field])) throw new Error('Profile revision is immutable');
      } else this.write('profile_revisions', profileColumns, profile);
      const current = this.getProfile(profile.id);
      if (current && current.revision > profile.revision) throw new Error('Profile revision cannot move backwards');
      this.db.prepare('INSERT INTO profiles(id,revision_id) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET revision_id=excluded.revision_id').run(profile.id, profile.revisionId);
    });
  }
  getProfile(id: string): StoreProfile | undefined { return decode(this.db.prepare('SELECT r.* FROM profiles p JOIN profile_revisions r ON r.revision_id=p.revision_id WHERE p.id=?').get(id), profileColumns); }
  getProfileRevision(id: string): StoreProfile | undefined { return decode(this.db.prepare('SELECT * FROM profile_revisions WHERE revision_id=?').get(id), profileColumns); }
  listProfiles(): StoreProfile[] { return this.many('SELECT r.* FROM profiles p JOIN profile_revisions r ON r.revision_id=p.revision_id ORDER BY r.name,r.id', profileColumns); }
  listSecretRefs(): string[] { return (this.db.prepare('SELECT DISTINCT secret_ref FROM profile_revisions WHERE secret_ref IS NOT NULL').all() as { secret_ref: string }[]).map(row => row.secret_ref); }
  deleteProfile(id: string): void { this.db.prepare('DELETE FROM profiles WHERE id=?').run(id); }

  putRun(run: StoreRun): void { this.write('runs', runColumns, run); }
  getRun(id: string): StoreRun | undefined { return this.one('runs', runColumns, id); }
  listRuns(sessionId: string): StoreRun[] { return this.many('SELECT * FROM runs WHERE session_id=? ORDER BY created_at,id', runColumns, sessionId); }
  appendEvent(runId: string, type: string, payload: unknown, patch?: { status?: StoreRunStatus; finishedAt?: string }): StoreEvent {
    return this.transaction(() => {
      const run = this.db.prepare('SELECT next_seq FROM runs WHERE id=?').get(runId) as { next_seq: number } | undefined;
      if (!run) throw new Error(`Run not found: ${runId}`);
      const event: StoreEvent = { schemaVersion: 1, engineEpoch: this.engineEpoch, runId, seq: run.next_seq, type, payload, at: Date.now() };
      this.db.prepare('INSERT INTO events(run_id,seq,schema_version,engine_epoch,type,payload,at) VALUES (?,?,?,?,?,?,?)').run(runId,event.seq,1,event.engineEpoch,type,json(payload),event.at);
      this.db.prepare('UPDATE runs SET next_seq=next_seq+1,status=COALESCE(?,status),finished_at=COALESCE(?,finished_at) WHERE id=?').run(patch?.status ?? null,patch?.finishedAt ?? null,runId);
      return event;
    });
  }
  append(runId: string, type: string, payload: unknown, patch?: { status?: StoreRunStatus; finishedAt?: string }): StoreEvent { return this.appendEvent(runId,type,payload,patch); }
  events(runId: string, after = 0, limit = 100): { events: StoreEvent[]; nextSeq: number; hasMore: boolean } {
    if (!Number.isSafeInteger(after) || after < 0) throw new RangeError('Event cursor must be a nonnegative integer');
    const rows = this.db.prepare('SELECT * FROM events WHERE run_id=? AND seq>? ORDER BY seq LIMIT ?').all(runId,after,pageLimit(limit)+1) as Row[];
    const hasMore = rows.length > limit;
    const events = rows.slice(0,limit).map(row => ({ schemaVersion: 1 as const, engineEpoch: row.engine_epoch as string, runId: row.run_id as string, seq: row.seq as number, type: row.type as string, payload: JSON.parse(row.payload as string) as unknown, at: row.at as number }));
    return { events, nextSeq: events.at(-1)?.seq ?? after, hasMore };
  }
  eventsAfter(runId: string, after = 0, limit = 100): StoreEvent[] { return this.events(runId,after,limit).events; }
  latestRunEvent(sessionId: string, type: string): unknown | null {
    const row = this.db.prepare('SELECT payload FROM events WHERE run_id=(SELECT id FROM runs WHERE session_id=? ORDER BY rowid DESC LIMIT 1) AND type=? ORDER BY seq DESC LIMIT 1').get(sessionId, type) as { payload: string } | undefined;
    return row ? JSON.parse(row.payload) as unknown : null;
  }
  toolResult(sessionId: string, id: string): StoreMessage | undefined {
    return this.many<StoreMessage>("SELECT * FROM messages WHERE session_id=? AND id=? AND role='tool'", messageColumns, sessionId, id)[0];
  }

  appendMessage(message: StoreMessage): StoreMessage {
    this.transaction(() => {
      this.write('messages',messageColumns,message);
      this.db.prepare('UPDATE sessions SET updated_at=MAX(updated_at,?) WHERE id=?').run(message.createdAt,message.sessionId);
    });
    return this.one<StoreMessage>('messages',messageColumns,message.id)!;
  }
  listMessages(sessionId: string, options: { limit?: number; offset?: number; latest?: boolean } = {}): StoreMessage[] {
    const offset = options.offset ?? 0;
    if (!Number.isSafeInteger(offset) || offset < 0) throw new RangeError('Message offset must be a nonnegative integer');
    const rows = this.many<StoreMessage>(`SELECT * FROM messages WHERE session_id=? ORDER BY rowid ${options.latest ? 'DESC' : 'ASC'} LIMIT ? OFFSET ?`,messageColumns,sessionId,pageLimit(options.limit ?? 1000),offset);
    return options.latest ? rows.reverse() : rows;
  }
  searchHistory(projectId: string, query: string, options: { sessionId?: string; limit?: number } = {}): StoreMessage[] {
    const terms = query.trim().split(/\s+/u).filter(Boolean);
    if (!terms.length) return [];
    const match = terms.map(term => `"${term.replaceAll('"','""')}"`).join(' AND ');
    return this.many('SELECT m.* FROM history_fts JOIN messages m ON m.rowid=history_fts.rowid JOIN sessions s ON s.id=m.session_id WHERE history_fts MATCH ? AND s.project_id=? AND (? IS NULL OR m.session_id=?) ORDER BY rank,m.rowid LIMIT ?',messageColumns,match,projectId,options.sessionId ?? null,options.sessionId ?? null,pageLimit(options.limit ?? 50));
  }
  putWireState(messageId: string, profileRevisionId: string, state: unknown): void {
    this.transaction(() => {
      const row = this.db.prepare('SELECT r.profile_revision_id FROM messages m JOIN runs r ON r.id=m.run_id WHERE m.id=?').get(messageId) as { profile_revision_id: string } | undefined;
      if (!row || row.profile_revision_id !== profileRevisionId) throw new Error('Native state profile revision does not match the message run');
      this.db.prepare('INSERT INTO provider_wire_state(message_id,profile_revision_id,state) VALUES (?,?,?)').run(messageId,profileRevisionId,json(state));
    });
  }
  getWireState(messageId: string, profileRevisionId: string): unknown {
    const row = this.db.prepare('SELECT profile_revision_id,state FROM provider_wire_state WHERE message_id=?').get(messageId) as { profile_revision_id: string; state: string } | undefined;
    if (!row) return undefined;
    if (row.profile_revision_id !== profileRevisionId) throw new Error('Native state profile revision mismatch');
    return JSON.parse(row.state) as unknown;
  }

  putOperation(operation: StoreOperation): void { this.write('operations',operationColumns,operation); }
  getOperation(id: string): StoreOperation | undefined { return this.one('operations',operationColumns,id); }
  listOperations(runId: string): StoreOperation[] { return this.many('SELECT * FROM operations WHERE run_id=? ORDER BY created_at,id',operationColumns,runId); }
  protectedSnapshotRefs(): Set<string> {
    const rows = this.db.prepare("SELECT before_ref,after_ref,snapshot_ref FROM operations WHERE kind='write' AND (status IN ('prepared','started') OR (status='unknown' AND json_extract(result,'$.recovery.acknowledgedAt') IS NULL) OR run_id IN (SELECT id FROM runs WHERE status IN ('queued','running','awaiting_approval','awaiting_review','cancelling')))").all() as Array<Record<string, string | null>>;
    return new Set(rows.flatMap(row => Object.values(row).filter((value): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value))));
  }
  updateOperation(id: string, patch: Partial<Pick<StoreOperation,'status'|'result'|'beforeRef'|'afterRef'|'snapshotRef'|'updatedAt'>>): StoreOperation {
    return this.transaction(() => {
      const existing = this.getOperation(id);
      if (!existing) throw new Error(`Operation not found: ${id}`);
      const updated = { ...existing, ...patch, updatedAt: patch.updatedAt ?? new Date().toISOString() };
      this.write('operations',operationColumns,updated,true);
      return updated;
    });
  }
  putApproval(approval: StoreApproval): void { this.write('approvals',approvalColumns,approval); }
  getApproval(id: string): StoreApproval | undefined { return this.one('approvals',approvalColumns,id); }
  listApprovals(operationId: string): StoreApproval[] { return this.many('SELECT * FROM approvals WHERE operation_id=? ORDER BY created_at,id',approvalColumns,operationId); }
  putMission(mission: StoreMission): void { this.write('missions',missionColumns,mission,true); }
  getMission(id: string): StoreMission | undefined { return this.one('missions',missionColumns,id); }
  listMissions(projectId: string): StoreMission[] { return this.many('SELECT * FROM missions WHERE project_id=? ORDER BY updated_at DESC,id',missionColumns,projectId); }
  putResearch(research: StoreResearch): void { this.write('research',researchColumns,research,true); }
  getResearch(id: string): StoreResearch | undefined { return this.one('research',researchColumns,id); }
  listResearch(projectId: string): StoreResearch[] { return this.many('SELECT * FROM research WHERE project_id=? ORDER BY updated_at DESC,id',researchColumns,projectId); }
  getSettings<T extends object = Record<string, unknown>>(): T {
    const row = this.db.prepare('SELECT value FROM settings WHERE id=1').get() as { value: string } | undefined;
    return (row ? JSON.parse(row.value) : {}) as T;
  }
  setSettings(settings: object): void { this.db.prepare('INSERT INTO settings(id,value) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').run(json(settings)); }

  lookupAcceptedRequest<T = unknown>(key: AcceptedRequestKey): AcceptedResult<T> | undefined {
    const row = this.db.prepare('SELECT * FROM accepted_requests WHERE client_request_id=?').get(key.clientRequestId) as { method: string; canonical_input_hash: string; entity_id: string; response: string } | undefined;
    if (!row) return undefined;
    if (row.method !== key.method || row.canonical_input_hash !== key.canonicalInputHash) throw new Error('Client request ID reused with a different method or input');
    return { entityId: row.entity_id, response: JSON.parse(row.response) as T, replayed: true };
  }
  acceptRequest<T>(key: AcceptedRequestKey, accept: () => { entityId: string; response: T }): AcceptedResult<T> {
    return this.transaction(() => {
      const previous = this.lookupAcceptedRequest<T>(key);
      if (previous) return previous;
      const result = accept();
      this.db.prepare('INSERT INTO accepted_requests(client_request_id,method,canonical_input_hash,entity_id,response,accepted_at) VALUES (?,?,?,?,?,?)').run(key.clientRequestId,key.method,key.canonicalInputHash,result.entityId,json(result.response),new Date().toISOString());
      return { ...result, replayed: false };
    });
  }

  recoverInterrupted(): { interruptedRunIds: string[]; unknownOperationIds: string[] } {
    return this.transaction(() => {
      const active = this.db.prepare("SELECT id FROM runs WHERE status IN ('queued','running','awaiting_approval','awaiting_review','cancelling') ORDER BY id").all() as { id: string }[];
      const operations = this.db.prepare("SELECT id,run_id FROM operations WHERE status='started' AND kind IN ('write','command','research') ORDER BY id").all() as { id: string; run_id: string }[];
      const now = new Date().toISOString();
      this.db.prepare("UPDATE operations SET status='failed',updated_at=? WHERE status='prepared' AND kind IN ('write','command')").run(now);
      for (const operation of operations) {
        this.updateOperation(operation.id,{ status:'unknown',updatedAt:now });
        this.appendEvent(operation.run_id,'operation.unknown',{ operationId:operation.id,reason:'engine_interrupted' });
      }
      for (const run of active) this.appendEvent(run.id,'run.interrupted',{ reason:'engine_interrupted' },{ status:'interrupted',finishedAt:now });
      return { interruptedRunIds: active.map(run => run.id), unknownOperationIds: operations.map(operation => operation.id) };
    });
  }
}
