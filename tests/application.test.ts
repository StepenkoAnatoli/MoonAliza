import { existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { EventSchema } from '../src/shared/events';
import { Store } from '../src/engine/store';
import { Application } from '../src/engine/application';

const roots: string[] = []; const stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'moonzila-app-')); roots.push(root);
  const store = new Store(join(root, 'state.sqlite')); stores.push(store);
  const at = new Date().toISOString();
  store.putProject({ id: 'p1', rootPath: root, pathLabel: root, name: 'Example', trusted: true, trustRevision: 1, policy: { revision: 1, inference: 'local-only', research: 'off' }, missing: false, createdAt: at });
  store.putProfile({ id: 'profile1', name: 'Local', kind: 'ollama', endpoint: 'http://127.0.0.1:11434', model: 'test', contextTokens: 8192, outputTokens: 512, locality: 'local', revision: 1, revisionId: 'v1', createdAt: at, updatedAt: at });
  const app = new Application(store, { infer: async () => ({ content: 'Answer', outcome: 'complete' }), publish: () => {} });
  return { store, app, root };
}
const request = (method: string, params: unknown, id: string) => ({ protocolVersion: 1, clientRequestId: id, method, params });

test('large tool results remain saved and can be paged without overflowing the model request', async () => {
  const { store, root } = fixture();
  writeFileSync(join(root, 'large.txt'), 'A'.repeat(25000) + 'TAIL_EVIDENCE');
  let steps = 0; let reference = '';
  const app = new Application(store, { publish() {}, async infer(_run, messages, _signal, tools) {
    steps++;
    if (steps === 1) return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'large-read', name: 'read_file', input: { path: 'large.txt' } }] };
    if (steps === 2) {
      const excerpt = JSON.parse(messages.at(-1)!.content); reference = excerpt.resultId;
      expect(excerpt.compacted).toBe(true); expect(reference).toBeTruthy();
      expect(messages.at(-1)!.content.length).toBeLessThan(5000);
      expect(tools?.some(tool => tool.name === 'read_tool_result')).toBe(true);
      return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'retrieve', name: 'read_tool_result', input: { resultId: reference, offset: 24000, length: 2048 } }] };
    }
    expect(messages.at(-1)!.content).toContain('TAIL_EVIDENCE');
    return { content: 'Retrieved the end of the original result.', outcome: 'complete', usage: { inputTokens: 712, outputTokens: 15 } };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: 'Read the large file.' }, 'start')) as { run: { id: string } };
  await app.whenIdle();
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(steps).toBe(3);
  expect(store.listMessages(session.id).find(m => m.id === reference)?.content).toContain('A'.repeat(25000));
  const history = await app.handle(request('session.read', { sessionId: session.id }, 'read')) as { context: { compactedToolResults: number }; usage: { inputTokens: number }; failure: unknown };
  expect(history.context.compactedToolResults).toBeGreaterThan(0); expect(history.usage.inputTokens).toBe(712); expect(history.failure).toBeNull();
});

test('an oversized prompt fails before inference and persists an actionable context report', async () => {
  const { store } = fixture(); let invoked = false;
  const app = new Application(store, { publish() {}, async infer() { invoked = true; return { content: '', outcome: 'complete' }; } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  await app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: '漢'.repeat(18000) }, 'start'));
  await app.whenIdle();
  expect(invoked).toBe(false);
  const result = await app.handle(request('session.read', { sessionId: session.id }, 'read')) as { context: { estimatedInputTokens: number; inputBudgetTokens: number }; failure: { code: string; message: string } };
  expect(result.failure.code).toBe('CONTEXT_LIMIT'); expect(result.failure.message).toContain('Model profiles');
  expect(result.context.estimatedInputTokens).toBeGreaterThan(result.context.inputBudgetTokens);
});

test('an unverified local Ollama fails the run with an actionable message, never retried', async () => {
  // Guard: the engine maps LOCAL_MODEL_UNVERIFIED to its own message, the whole of it (mutations: drop the failures
  // entry, drop a remedy step such as the server.json setting or restarting Ollama).
  const { store } = fixture(); let calls = 0;
  const app = new Application(store, { publish() {}, async infer() { calls++; throw new Error('LOCAL_MODEL_UNVERIFIED'); } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  await app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: 'hello' }, 'start'));
  await app.whenIdle();
  expect(calls).toBe(1);
  const result = await app.handle(request('session.read', { sessionId: session.id }, 'read')) as { failure: { code: string; message: string; retry: string } };
  expect(result.failure).toMatchObject({ code: 'LOCAL_MODEL_UNVERIFIED', retry: 'never' });
  // The message is the spec's, word for word (docs/specification/more-models.md, Phase 1 design 2, "The engine shows:"):
  // every refusal reads true - cloud on, an Ollama without /api/status, or one not running (review U2-R4) - and it names
  // every remedy step. The engine writes the apostrophe typographically, as its other messages do.
  expect(result.failure.message.replace(/\u2019/g, "'")).toBe('Moonzila could not confirm that this Ollama keeps prompts on this computer, and this conversation is local only. Ollama can send prompts to ollama.com cloud models unless its cloud features are off. Check that Ollama is running and up to date, turn off its cloud features (set OLLAMA_NO_CLOUD=1, or "disable_ollama_cloud": true in Ollama\'s server.json), restart Ollama, then try again.');
});

test('result retrieval cannot cross conversation boundaries or rerun an operation', async () => {
  const { store } = fixture(); let steps = 0;
  const at = new Date().toISOString();
  store.putSession({ id: 'private-session', projectId: 'p1', title: 'Private', createdAt: at, updatedAt: at });
  store.appendMessage({ id: 'other-result', sessionId: 'private-session', role: 'tool', toolCallId: 'original', toolName: 'run_command', content: 'PRIVATE_OBSERVATION', createdAt: at });
  const app = new Application(store, { publish() {}, async infer(_run, messages) {
    if (++steps === 1) return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'attempt', name: 'read_tool_result', input: { resultId: 'other-result' } }] };
    expect(messages.at(-1)?.content).toContain('NOT_FOUND'); expect(JSON.stringify(messages)).not.toContain('PRIVATE_OBSERVATION');
    return { content: 'Result unavailable.', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: 'Retrieve' }, 'start')) as { run: { id: string } };
  await app.whenIdle(); expect(steps).toBe(2); expect(store.getRun(run.id)?.status).toBe('completed');
});

test('cloud policy blocks network admission and persists no user prompt', async () => {
  const { store } = fixture(); const saved = store.getProfile('profile1')!;
  store.putProfile({ ...saved, endpoint: 'https://provider.example/v1', kind: 'openai-compatible', locality: 'external', revisionId: 'cloud-revision', revision: 2 });
  let calls = 0; const app = new Application(store, { publish() {}, async infer() { calls++; return { content: 'bad', outcome: 'complete' }; } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  await expect(app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: 'private' }, 'start'))).rejects.toThrow('CLOUD_NOT_ALLOWED');
  expect(calls).toBe(0); expect(store.listMessages(session.id)).toHaveLength(0);
});

test('project list exposes public DTOs and durable session creation replays once', async () => {
  const { app, store } = fixture();
  expect(JSON.stringify(await app.handle(request('project.list', {}, 'list')))).not.toContain('rootPath');
  const created = await app.handle(request('session.create', { projectId: 'p1', title: 'First task' }, 'create'));
  expect(await app.handle(request('session.create', { projectId: 'p1', title: 'First task' }, 'create'))).toEqual(created);
  expect(store.listSessions('p1')).toHaveLength(1);
});

test('a real stored run reaches a terminal state and retains the conversation', async () => {
  const { app, store } = fixture();
  const { session } = await app.handle(request('session.create', { projectId: 'p1', title: 'Chat' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, mode: 'ask', profileId: 'profile1', prompt: 'Hello' }, 'start')) as { run: { id: string } };
  await app.whenIdle();
  expect(store.getRun(run.id)?.status).toBe('completed');
  expect(store.listMessages(session.id).map(message => message.content)).toEqual(['Hello', 'Answer']);
  expect(store.events(run.id, 0, 100).events.at(-1)?.type).toBe('run.completed');
});

test('revoked project trust prevents a new run without storing a user message', async () => {
  const { app, store } = fixture();
  const { session } = await app.handle(request('session.create', { projectId: 'p1', title: 'Chat' }, 'create')) as { session: { id: string } };
  await app.handle(request('project.revokeTrust', { projectId: 'p1' }, 'revoke'));
  await expect(app.handle(request('run.start', { sessionId: session.id, mode: 'ask', profileId: 'profile1', prompt: 'Hello' }, 'start'))).rejects.toThrow('PROJECT_UNTRUSTED');
  expect(store.listMessages(session.id)).toHaveLength(0);
});

test('Stop aborts the pending model request and persists cancelled rather than completed', async () => {
  const { store } = fixture();
  let admitted!: () => void; const started = new Promise<void>(resolve => { admitted = resolve; });
  const app = new Application(store, { publish: () => {}, infer: async (_run, _messages, signal) => {
    admitted();
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('RUN_CANCELLED')), { once: true }));
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, mode: 'ask', profileId: 'profile1', prompt: 'Hello' }, 'start')) as { run: { id: string } };
  await started;
  await app.handle(request('run.cancel', { runId: run.id }, 'stop')); await app.whenIdle();
  expect(store.getRun(run.id)?.status).toBe('cancelled');
  expect(store.listMessages(session.id)).toHaveLength(1);
});

test('forget removes project registration while retaining its folder and independent app settings', async () => {
  const { app, store } = fixture();
  const root = store.getProject('p1')!.rootPath;
  await app.handle(request('project.forget', { projectId: 'p1' }, 'forget'));
  expect(store.listProjects()).toEqual([]);
  expect(existsSync(root)).toBe(true);
  const result = await app.handle(request('settings.read', {}, 'settings')) as { settings: { theme: string } };
  expect(result.settings.theme).toBe('system');
});

test('Build reads a real file, pauses for approval, applies once and continues with its tool result', async () => {
  const { store, root } = fixture(); const data = join(root, 'private-app-data'); mkdirSync(data);
  writeFileSync(join(root, 'hello.txt'), 'before');
  let ready!: () => void; const awaiting = new Promise<void>(resolve => { ready = resolve; }); let steps = 0;
  const app = new Application(store, {
    publish(event) { if (event.type === 'approval.required') ready(); },
    async infer(_run, messages, _signal, tools) {
      expect(tools?.some(tool => tool.name === 'edit_file')).toBe(true);
      steps++;
      if (steps === 1) return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'read-1', name: 'read_file', input: { path: 'hello.txt' } }] };
      if (steps === 2) { expect(messages.at(-1)?.content).toContain('before'); return { content: 'I will update hello.txt.', outcome: 'tool_calls', toolCalls: [{ id: 'edit-1', name: 'edit_file', input: { path: 'hello.txt', search: 'before', replacement: 'after' } }] }; }
      expect(messages.at(-1)?.content).toContain('"applied":true');
      return { content: 'Updated hello.txt.', outcome: 'complete' };
    },
  }, { dataDirectory: data });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, mode: 'build', profileId: 'profile1', prompt: 'Change before to after in hello.txt' }, 'start')) as { run: { id: string } };
  await awaiting;
  expect(readFileSync(join(root, 'hello.txt'), 'utf8')).toBe('before');
  const { operations } = await app.handle(request('approval.list', { runId: run.id }, 'pending')) as { operations: import('../src/shared').Operation[] };
  const op = operations[0]!;
  await app.handle(request('approval.decide', { operationId: op.id, projectId: op.projectId, inputHash: op.inputHash, policyRevision: op.policyRevision, trustRevision: op.trustRevision, decision: 'allow' }, 'approve'));
  await app.whenIdle();
  expect(readFileSync(join(root, 'hello.txt'), 'utf8')).toBe('after');
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(steps).toBe(3);
  expect(store.listMessages(session.id).filter(m => m.role === 'tool')).toHaveLength(2);
});

test('Ask cannot execute an unoffered write tool, even when a provider returns one', async () => {
  const { store, root } = fixture(); const data = join(root, 'private-app-data'); mkdirSync(data);
  const app = new Application(store, { publish() {}, async infer() { return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'bad', name: 'write_file', input: { path: 'new.txt', content: 'bad' } }] }; } }, { dataDirectory: data });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, mode: 'ask', profileId: 'profile1', prompt: 'Hello' }, 'start')) as { run: { id: string } };
  await app.whenIdle(); expect(store.getRun(run.id)?.status).toBe('failed'); expect(existsSync(join(root, 'new.txt'))).toBe(false);
});

test.each(['exited', 'unknown'] as const)('reviewed command records %s outcome before deciding whether the model can continue', async status => {
  const { store, root } = fixture(); let steps = 0; let executions = 0;
  let ready!: () => void; const awaiting = new Promise<void>(resolve => { ready = resolve; });
  const app = new Application(store, {
    publish(event) { if (event.type === 'approval.required') ready(); },
    async prepareCommand() { return { executable: 'C:/Tools/node.exe', args: ['check.js'], cwd: root, env: {}, timeoutMs: 1000, maxOutputBytes: 60000, files: [{ path: 'C:/Tools/node.exe', sha256: '0'.repeat(64) }], environmentPolicy: 'ordinary-windows-v1' }; },
    async executeCommand(runId, operationId) {
      executions++; expect(store.getOperation(operationId)?.status).toBe('started'); expect(store.getRun(runId)?.status).toBe('running');
      expect(store.listApprovals(operationId)[0]?.decision).toBe('allow');
      return { status, code: status === 'exited' ? 7 : null, output: 'CHECK FAILED', truncated: false, timedOut: false, cancelled: false };
    },
    async infer(_run, messages, _signal, tools) {
      steps++; expect(tools?.some(tool => tool.name === 'run_command')).toBe(true);
      if (steps === 1) return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'cmd', name: 'run_command', input: { program: 'node', args: ['check.js'] } }] };
      expect(JSON.parse(messages.at(-1)!.content).code).toBe(7);
      return { content: 'The check failed with exit code 7.', outcome: 'complete' };
    },
  }, { dataDirectory: join(root, 'data') });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, mode: 'build', profileId: 'profile1', prompt: 'Run the check' }, 'start')) as { run: { id: string } };
  await awaiting; expect(executions).toBe(0);
  const { operations } = await app.handle(request('approval.list', { runId: run.id }, 'pending')) as { operations: import('../src/shared').Operation[] }; const op = operations[0]!;
  const preview = await app.handle(request('approval.read', { projectId: 'p1', operationId: op.id }, 'preview')) as { kind: string; args: string[] };
  expect(preview.kind).toBe('command'); expect(preview.args).toEqual(['check.js']);
  const approved = request('approval.decide', { operationId: op.id, projectId: op.projectId, inputHash: op.inputHash, policyRevision: op.policyRevision, trustRevision: op.trustRevision, decision: 'allow' }, 'approve');
  await app.handle(approved); await app.handle(approved); await app.whenIdle();
  expect(executions).toBe(1); expect(steps).toBe(status === 'unknown' ? 1 : 2);
  expect(store.getOperation(op.id)?.status).toBe(status === 'unknown' ? 'unknown' : 'completed');
  expect(store.getRun(run.id)?.status).toBe(status === 'unknown' ? 'failed' : 'completed');
  expect(store.listMessages(session.id).find(message => message.role === 'tool')?.content).toContain('CHECK FAILED');
});


test.each([
  ['https://github.com/example/project', 'NOT_IMPLEMENTED'],
  ['github.com/example/project', 'NOT_FOUND'],
  ['absent-directory', 'NOT_FOUND'],
  ['../outside', 'PATH_OUTSIDE_PROJECT'],
  ['.env', 'FORBIDDEN'],
])('local search reports the actual failure for %s to model and UI', async (path, expectedCode) => {
  const { store } = fixture(); let step = 0;
  const app = new Application(store, { publish() {}, async infer() {
    if (++step === 1) return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'search-failure', name: 'search_text', input: { path, query: 'test' } }] };
    return { content: 'Observed the tool result.', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'plan', prompt: 'Inspect this repository.' }, 'start')) as { run: { id: string } };
  await app.whenIdle();
  expect(store.getRun(run.id)?.status).toBe('completed');
  const result = JSON.parse(store.listMessages(session.id).find(m => m.role === 'tool')!.content);
  expect(result.error).toBe(expectedCode);
  expect(store.latestRunEvent(session.id, 'tool.failed')).toMatchObject({ error: { code: expectedCode, message: result.message } });
  expect(result.message).not.toContain(store.getProject('p1')!.rootPath);
});

// More models Phase 2, U0 (docs/specification/more-models-phase2.md sections 1, 2 and 8; REQUIREMENTS-P2 F-1, F-2, S-2, T-6).
// The markers are base64-alphabet only, so JSON never escapes them at any depth, and they sit only in the state's thinking
// text and signature: its text and tool_use input become the stored content and calls by design. The state is under 1 KiB,
// so a row holding it fits on one page and a scan cannot miss a marker split across overflow pages.
const THINKING_MARKER = 'VGhpbmtpbmdNYXJrZXJQaGFzZTJVMA';
const SIGNATURE_MARKER = 'U2lnbmF0dXJlTWFya2VyUGhhc2UyVTA';
const markedState = {
  format: 'anthropic-messages@1', appendOnly: true,
  data: JSON.stringify({ content: [{ type: 'thinking', thinking: THINKING_MARKER, signature: SIGNATURE_MARKER }, { type: 'tool_use', id: 'state-list', name: 'list_files', input: { path: '.' } }] }),
};

test('a tool step\'s provider state goes back on the next step of its run and never reaches disk, events or session.read', async () => {
  // Guards: the strip in message() (mutation: store the value as given); the carry at the tool step (mutation: build the
  // assistant message without providerState); the scan itself (mutation: copy the state into the message.created
  // payload's content string, which EventSchema still accepts - the scan must go red).
  const { store, root } = fixture(); const published: unknown[] = []; let steps = 0;
  const app = new Application(store, { publish(event) { published.push(event); }, async infer(_run, messages) {
    steps++;
    if (steps === 1) return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'state-list', name: 'list_files', input: { path: '.' } }], providerState: markedState };
    const assistant = messages.find(message => message.role === 'assistant' && message.toolCalls?.length);
    expect(assistant?.providerState).toEqual(markedState);
    return { content: 'Listed.', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const { run } = await app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: 'List the files.' }, 'start')) as { run: { id: string } };
  await app.whenIdle();
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(steps).toBe(2);
  for (const name of ['state.sqlite', 'state.sqlite-wal', 'state.sqlite-shm']) {
    const file = join(root, name); if (!existsSync(file)) continue;
    const bytes = readFileSync(file);
    expect(bytes.includes(Buffer.from(THINKING_MARKER)), name).toBe(false);
    expect(bytes.includes(Buffer.from(SIGNATURE_MARKER)), name).toBe(false);
  }
  const read = JSON.stringify(await app.handle(request('session.read', { sessionId: session.id }, 'read')));
  for (const text of [read, JSON.stringify(published)]) {
    expect(text).not.toContain(THINKING_MARKER); expect(text).not.toContain(SIGNATURE_MARKER); expect(text).not.toContain('providerState');
  }
  const created = published.filter(event => (event as { type?: string }).type === 'message.created');
  expect(created.length).toBeGreaterThan(0);
  for (const event of created) expect(EventSchema.safeParse(event).success).toBe(true);
});

test('a protocol refusal from main, and the engine\'s own unoffered-call check, end the run with the widened message', async () => {
  // Spec section 6 and REQUIREMENTS-P2 F-23: one shared text for every cause of PROVIDER_PROTOCOL_ERROR, never retried.
  const widened = 'The provider returned a tool call or step Moonzila could not use safely: a tool call that was invalid or not offered, or output that contained a saved credential. Nothing from that step was run or saved.';
  for (const infer of [
    async () => { throw new Error('PROVIDER_PROTOCOL_ERROR'); },
    async () => ({ content: '', outcome: 'tool_calls' as const, toolCalls: [{ id: 'unoffered', name: 'not_a_tool', input: {} }] }),
  ]) {
    const { store } = fixture();
    const app = new Application(store, { publish() {}, infer });
    const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
    await app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: 'hello' }, 'start'));
    await app.whenIdle();
    const result = await app.handle(request('session.read', { sessionId: session.id }, 'read')) as { failure: { code: string; message: string; retry: string } };
    expect(result.failure).toEqual({ code: 'PROVIDER_PROTOCOL_ERROR', message: widened, retry: 'never' });
  }
});


// More models Phase 2, U1: local-only policy for an `anthropic` profile (docs/specification/more-models-phase2.md
// section 8; REQUIREMENTS-P2 S-3). Regression pins of today's behaviour: an `anthropic` revision is always `external`
// (spec section 7), and the existing admission, abort and revision checks keep it from sending a byte under local-only.
function cloud(store: Store, kind: 'anthropic' | 'openai-compatible', budget: { contextTokens: number; outputTokens: number } = { contextTokens: 8192, outputTokens: 512 }) {
  const project = store.getProject('p1')!; const saved = store.getProfile('profile1')!;
  store.putProject({ ...project, policy: { revision: 1, inference: 'cloud-allowed', research: 'off' } });
  store.putProfile({ ...saved, kind, endpoint: kind === 'anthropic' ? 'https://api.anthropic.com/v1' : 'https://provider.example/v1', locality: 'external', ...budget, revisionId: `${kind}-revision`, revision: 2 });
}

test.each([
  ['a local-only session', null],
  ['a session in a local-only project', 'p1'],
] as const)('an external anthropic revision is refused at run.start in %s, before any inference', async (_name, projectId) => {
  // S-3 (a). Guard (mutation): run.start skips assertConversationPolicy (application.ts, `run.start`); the run is then
  // admitted, so run.start no longer rejects (execute's own check fails it later, still without calling infer).
  const { store } = fixture(); const saved = store.getProfile('profile1')!;
  store.putProfile({ ...saved, kind: 'anthropic', endpoint: 'https://api.anthropic.com/v1', locality: 'external', revisionId: 'anthropic-revision', revision: 2 });
  let calls = 0; const app = new Application(store, { publish() {}, async infer() { calls++; return { content: 'bad', outcome: 'complete' }; } });
  const { session } = await app.handle(request('session.create', { projectId }, 'create')) as { session: { id: string; policy: { inference: string } } };
  if (projectId === null) expect(session.policy.inference).toBe('local-only');
  await expect(app.handle(request('run.start', { sessionId: session.id, profileId: 'profile1', mode: 'ask', prompt: 'private' }, 'start'))).rejects.toThrow('CLOUD_NOT_ALLOWED');
  await app.whenIdle();
  expect(calls).toBe(0); expect(store.listRuns(session.id)).toHaveLength(0); expect(store.listMessages(session.id)).toHaveLength(0);
});

test.each(['session', 'project'] as const)('a switch to local-only by %s.policy.update during an anthropic run cancels it with no further inference', async scope => {
  // S-3 (b). Two protections each cancel the run alone: the update's abort (session.policy.update) or cancelProject
  // (project.policy.update), and the revision comparison in assertConversationPolicy (policy.ts), reached when infer
  // returns. Guard (mutation): remove both; the run then fails with CLOUD_NOT_ALLOWED, reported as PROVIDER_ERROR.
  const { store } = fixture(); cloud(store, 'anthropic'); let calls = 0; const published: Array<{ type: string }> = [];
  let sessionId = '';
  const app: Application = new Application(store, { publish(event) { published.push(event); }, async infer() {
    calls++;
    if (scope === 'session') await app.handle(request('session.policy.update', { sessionId, expectedRevision: 0, inference: 'local-only' }, 'switch'));
    else await app.handle(request('project.policy.update', { projectId: 'p1', expectedRevision: 1, policy: { inference: 'local-only', research: 'off' } }, 'switch'));
    return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'after-switch', name: 'list_files', input: { path: '.' } }] };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  sessionId = session.id;
  const { run } = await app.handle(request('run.start', { sessionId, profileId: 'profile1', mode: 'ask', prompt: 'List the files.' }, 'start')) as { run: { id: string } };
  await app.whenIdle();
  expect(calls).toBe(1);
  expect(store.getRun(run.id)?.status).toBe('cancelled');
  const types = store.events(run.id, 0, 1000).events.map(event => event.type);
  expect(types).toContain('run.cancelled'); expect(types).not.toContain('run.failed'); expect(types).not.toContain('tool.started');
  expect(published.some(event => event.type === 'tool.started')).toBe(false);
  expect(store.listMessages(session.id).filter(message => message.role === 'tool')).toHaveLength(0);
});
