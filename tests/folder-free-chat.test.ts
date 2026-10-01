import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { afterEach, expect, test } from 'vitest';
import { Store } from '../src/engine/store';
import { Application } from '../src/engine/application';
import type { MethodName, MethodParams, MethodResult } from '../src/shared';

const roots: string[] = []; const stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
const at = '2026-10-01T00:00:00.000Z';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'moon-chat-')); roots.push(root);
  const path = join(root, 'state.sqlite'); const store = new Store(path); stores.push(store);
  store.putProfile({ id: 'local', name: 'Local', kind: 'ollama', endpoint: 'http://127.0.0.1:11434', model: 'test', contextTokens: 8192, outputTokens: 512, locality: 'local', revision: 1, revisionId: 'local-v1', createdAt: at, updatedAt: at });
  store.putProfile({ ...store.getProfile('local')!, id: 'cloud', locality: 'external', endpoint: 'https://example.com/v1', kind: 'openai-compatible', revisionId: 'cloud-v1' });
  store.putProject({ id: 'project', name: 'Project', rootPath: root, pathLabel: root, trusted: true, trustRevision: 1, policy: { revision: 1, inference: 'cloud-allowed', research: 'off' }, missing: false, createdAt: at });
  const app = new Application(store, { publish() {}, async infer(_run, _messages, _signal, tools) { expect(tools).toEqual([]); return { content: 'An ordinary answer', outcome: 'complete' }; } });
  return { store, app, path };
}
function call<M extends MethodName>(app: Application, method: M, params: MethodParams<M>): Promise<MethodResult<M>> {
  return app.handle({ protocolVersion: 1, clientRequestId: randomUUID(), method, params }) as Promise<MethodResult<M>>;
}
const start = (app: Application, sessionId: string, profileId = 'local') => call(app, 'run.start', { sessionId, profileId, mode: 'ask', prompt: 'Help me think through an idea.' });

test('folder-free conversation shares the engine, has no tools and survives reopening', async () => {
  const { store, app, path } = fixture();
  const { session } = await call(app, 'session.create', { projectId: null });
  expect(session.policy.inference).toBe('local-only');
  const { run } = await start(app, session.id); await app.whenIdle();
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(store.listOperations(run.id)).toEqual([]);
  store.close(); const reopened = new Store(path); stores.push(reopened);
  expect(reopened.listSessions(null).map(s => s.id)).toEqual([session.id]);
  expect(reopened.listMessages(session.id).at(-1)?.content).toBe('An ordinary answer');
  reopened.deleteSession(session.id); expect(reopened.getRun(run.id)).toBeUndefined();
});

test('chat cloud consent is explicit and revision bound; Build cannot run without a folder', async () => {
  const { store, app } = fixture(); const { session } = await call(app, 'session.create', { projectId: null });
  await expect(start(app, session.id, 'cloud')).rejects.toThrow('CLOUD_NOT_ALLOWED');
  expect(store.listMessages(session.id)).toEqual([]);
  await call(app, 'session.policy.update', { sessionId: session.id, expectedRevision: 0, inference: 'cloud-allowed' });
  expect(store.listMessages(session.id)).toEqual([]);
  await expect(call(app, 'session.policy.update', { sessionId: session.id, expectedRevision: 0, inference: 'cloud-allowed' })).rejects.toThrow('REQUEST_CONFLICT');
  await start(app, session.id, 'cloud'); await app.whenIdle();
  await expect(call(app, 'run.start', { sessionId: session.id, profileId: 'local', mode: 'build', prompt: 'Write a file' })).rejects.toThrow('PROJECT_REQUIRED');
});

test('a model cannot obtain file, saved-result, Git or write access in general chat', async () => {
  const { store } = fixture();
  for (const name of ['read_file', 'read_tool_result', 'git_status', 'write_file', 'run_command']) {
    const app = new Application(store, { publish() {}, async infer() { return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'bad-call', name, input: { path: 'private.txt' } }] }; } });
    const { session } = await call(app, 'session.create', { projectId: null }); const { run } = await start(app, session.id); await app.whenIdle();
    expect(store.getRun(run.id)?.status).toBe('failed'); expect(store.listOperations(run.id)).toEqual([]);
    expect(store.latestRunEvent(session.id, 'run.failed')).toMatchObject({ error: { code: 'PROVIDER_PROTOCOL_ERROR' } });
  }
});

test('branching copies only reviewed text and preserves the stricter source policy', async () => {
  const { app, store } = fixture(); const { session } = await call(app, 'session.create', { projectId: null });
  await start(app, session.id); await app.whenIdle();
  const { session: branch } = await call(app, 'session.branch', { sessionId: session.id, projectId: 'project', context: 'Reviewed idea only' });
  expect(branch.policy.inference).toBe('local-only');
  expect(store.listMessages(branch.id).map(m => m.content)).toEqual(['Reviewed idea only']);
  expect(store.listRuns(branch.id)).toEqual([]); expect(store.listMessages(session.id)).toHaveLength(2);
  await expect(start(app, branch.id, 'cloud')).rejects.toThrow('CLOUD_NOT_ALLOWED');
  const { session: empty } = await call(app, 'session.branch', { sessionId: branch.id, projectId: null, context: '' });
  expect(store.listMessages(empty.id)).toEqual([]); expect(empty.policy.inference).toBe('local-only');
});

test.each(['stop', 'policy'] as const)('%s cancels folder-free inference and discards a late completion', async action => {
  const { store } = fixture(); let release!: () => void; let entered!: () => void;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  const app = new Application(store, { publish() {}, async infer(_run, _messages, signal) {
    entered(); await new Promise<void>(resolve => { release = resolve; }); expect(signal.aborted).toBe(true);
    return { content: 'Late response must not be saved', outcome: 'complete' };
  } });
  const { session } = await call(app, 'session.create', { projectId: null });
  const { run } = await start(app, session.id); await waiting;
  await expect(call(app, 'session.branch', { sessionId: session.id, projectId: 'project', context: '' })).rejects.toThrow('RUN_ACTIVE');
  if (action === 'stop') await call(app, 'run.cancel', { runId: run.id });
  else await call(app, 'session.policy.update', { sessionId: session.id, expectedRevision: 0, inference: 'cloud-allowed' });
  release(); await app.whenIdle(); expect(store.getRun(run.id)?.status).toBe('cancelled');
  expect(store.listMessages(session.id).map(m => m.role)).toEqual(['user']);
});

test('null scope cannot evade relational integrity or mutate a saved conversation workspace', async () => {
  const { store, app } = fixture(); const { session } = await call(app, 'session.create', { projectId: null });
  const { run } = await start(app, session.id); await app.whenIdle();
  expect(() => store.putRun({ ...run, id: 'forged', sessionId: 'absent' })).toThrow('RUN_SCOPE_MISMATCH');
  expect(() => store.putRun({ ...run, id: 'forged', projectId: 'project' })).toThrow('RUN_SCOPE_MISMATCH');
  expect(() => store.putSession({ ...session, projectId: 'project' })).toThrow('SESSION_SCOPE_IMMUTABLE');
  const { session: projectSession } = await call(app, 'session.create', { projectId: 'project' });
  store.putProject({ ...store.getProject('project')!, policy: { revision: 2, inference: 'local-only', research: 'off' } });
  const branch = await call(app, 'session.branch', { sessionId: projectSession.id, projectId: null, context: 'Reviewed content' });
  expect(branch.session.policy.inference).toBe('local-only');
});

test('failed migration rolls back schema and rows instead of accepting broken references', () => {
  const root = mkdtempSync(join(tmpdir(), 'moon-v1-bad-')); roots.push(root); const path = join(root, 'state.sqlite');
  const db = new Database(path); db.exec(readFileSync(new URL('./fixtures/schema-v1.sql', import.meta.url), 'utf8'));
  db.pragma('foreign_keys = OFF'); db.exec(`INSERT INTO sessions VALUES ('dangling','absent','Old','${at}','${at}')`); db.close();
  expect(() => new Store(path)).toThrow('MIGRATION_FOREIGN_KEY_FAILURE');
  const check = new Database(path);
  expect(check.pragma('user_version', { simple: true })).toBe(1);
  expect(check.prepare('SELECT id FROM sessions').get()).toEqual({ id: 'dangling' });
  expect(check.prepare("SELECT name FROM pragma_table_info('sessions') WHERE name='policy'").get()).toBeUndefined(); check.close();
});

test('migration retains v1 identities, messages, events, FTS and approvals with foreign keys enforced', () => {
  const root = mkdtempSync(join(tmpdir(), 'moon-v1-')); roots.push(root); const path = join(root, 'state.sqlite');
  const db = new Database(path); db.exec(readFileSync(new URL('./fixtures/schema-v1.sql', import.meta.url), 'utf8'));
  db.exec(`INSERT INTO projects VALUES ('p','Project','C:/project','Project',1,1,'{"revision":1,"inference":"local-only","research":"off"}',0,'${at}');
    INSERT INTO sessions VALUES ('s','p','Old conversation','${at}','${at}');
    INSERT INTO profile_revisions VALUES ('v','m','Local','ollama','http://localhost:11434','test',8192,512,'local',NULL,1,'${at}','${at}');
    INSERT INTO profiles VALUES ('m','v');
    INSERT INTO runs VALUES ('r','s','p','build','completed','m','v',1,1,'${at}','${at}',2);
    INSERT INTO messages (id,session_id,run_id,role,content,created_at) VALUES ('msg','s','r','user','migration searchable','${at}');
    INSERT INTO events VALUES ('r',1,1,'epoch','run.completed','{}',1);
    INSERT INTO operations (id,run_id,project_id,kind,input_hash,policy_revision,trust_revision,status,input,created_at,updated_at) VALUES ('op','r','p','write','hash',1,1,'completed','{}','${at}','${at}');
    INSERT INTO approvals VALUES ('approval','op','p','hash',1,1,'allow','${at}');`); db.close();
  const migrated = new Store(path); stores.push(migrated);
  expect(migrated.listMessages('s')[0]?.content).toBe('migration searchable'); expect(migrated.events('r', 0, 100).events).toHaveLength(1);
  expect(migrated.listApprovals('op')).toHaveLength(1); expect(migrated.searchHistory('p', 'searchable')).toHaveLength(1);
  expect(migrated.getSession('s')?.policy.inference).toBe('cloud-allowed');
  const check = new Database(path); expect(check.pragma('foreign_key_check')).toEqual([]); check.close();
  migrated.deleteProject('p'); expect(migrated.getRun('r')).toBeUndefined(); expect(migrated.listApprovals('op')).toEqual([]);
});
