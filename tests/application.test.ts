import { existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { EventSchema } from '../src/shared/events';
import { Store } from '../src/engine/store';
import { Application } from '../src/engine/application';
import { estimateInput } from '../src/engine/context';
import { reviewWorkspacePath } from '../src/engine/research-review';
import type { Completion, InferenceMessage } from '../src/main/inference';
import type { ProviderState } from '../src/engine/control';
import type { Run } from '../src/shared';

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

// More models Phase 2, U1: append-only Anthropic runs (more-models-phase2.md section 3; REQUIREMENTS-P2 F-15, F-16, T-3).
// The states are built for these tests in the anthropic-messages@1 shape (the engine never parses them); markers are
// base64-alphabet only.
const FROZEN_TEXT = 'This task outgrew the selected model\'s context budget. This provider needs the earlier steps of a task sent back unchanged, so Moonzila could not shorten them while the task ran. Saved messages and any applied changes remain available; commands are not retried. Split the task into smaller requests, or open Model profiles to check the model\'s supported context and response reserve.';
const TODAY_TEXT = 'This request exceeds the selected model\'s context budget after reducing saved tool excerpts. Open Model profiles to check the model\'s supported context and response reserve, shorten the request, or start a fresh conversation. Saved messages and any applied changes remain available; commands are not retried.';
const plainQuotes = (text: string) => text.replace(/’/g, "'");
function thinkingState(appendOnly: boolean, signature: string, call: { id: string; path: string }, text: string): ProviderState {
  return { format: 'anthropic-messages@1', appendOnly, data: JSON.stringify({ content: [{ type: 'thinking', thinking: '', signature }, { type: 'text', text }, { type: 'tool_use', id: call.id, name: 'read_file', input: { path: call.path } }] }) };
}
function readStep(step: number, path: string, state?: { appendOnly: boolean; signature: string }): Completion {
  const call = { id: `read-${step}`, path }; const content = `Reading ${path}.`;
  return { content, outcome: 'tool_calls', toolCalls: [{ id: call.id, name: 'read_file', input: { path } }], ...(state ? { providerState: thinkingState(state.appendOnly, state.signature, call, content) } : {}) };
}
/** Earlier conversation in the run's session: whole turns of `size`-character messages, saved before the run. */
function seedHistory(store: Store, sessionId: string, turns: number, size = 2000) {
  const at = new Date().toISOString();
  for (let n = 0; n < turns; n++) for (const role of ['user', 'assistant'] as const) store.appendMessage({ id: `history-${n}-${role}`, sessionId, role, content: `${role} ${n} `.padEnd(size, role[0]), createdAt: at });
}
const historyCount = (messages: InferenceMessage[], prompt: string) => messages.findIndex(message => message.role === 'user' && message.content === prompt) - 1;
const resultPreview = (message: InferenceMessage) => JSON.parse(message.content).preview as string;
async function runOnce(app: Application, sessionId: string, prompt: string, id = 'start') {
  const { run } = await app.handle(request('run.start', { sessionId, profileId: 'profile1', mode: 'ask', prompt }, id)) as { run: { id: string } };
  await app.whenIdle(); return run;
}
async function failureOf(app: Application, sessionId: string) {
  return (await app.handle(request('session.read', { sessionId }, `read-${Math.random()}`)) as { failure: { code: string; message: string; retry: string } | null }).failure;
}
/**
 * Three tool steps reading files larger than the 3,072-byte excerpt, then an answer. `states[k]` is step k+1's
 * `appendOnly`, or undefined for a step whose completion carries no provider state.
 */
async function threeReads(states: ReadonlyArray<boolean | undefined>) {
  // Input budget 5,275 estimated tokens: a request holds two results at the excerpt but not three, so later steps cut.
  const { store, root } = fixture(); cloud(store, 'anthropic', { contextTokens: 5_787, outputTokens: 512 });
  for (const name of ['a', 'b', 'c']) writeFileSync(join(root, `${name}.txt`), name.toUpperCase().repeat(12_000));
  const requests: InferenceMessage[][] = []; const sent: Completion[] = [];
  const app = new Application(store, { publish() {}, async infer(_run, messages) {
    requests.push(JSON.parse(JSON.stringify(messages)) as InferenceMessage[]);
    const step = requests.length;
    if (step > 3) return { content: 'Read all three.', outcome: 'complete' };
    const appendOnly = states[step - 1];
    const output = readStep(step, `${'abc'[step - 1]}.txt`, appendOnly === undefined ? undefined : { appendOnly, signature: `U2lnbmF0dXJl${step}` });
    sent.push(output); return output;
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const run = await runOnce(app, session.id, 'Read the three files.');
  return { store, run, requests, sent, sessionId: session.id };
}
/** Requests 2 to 4 are each the previous request unchanged, compared as JSON message by message, then that step's call and result. */
function expectEachRequestAppends(requests: InferenceMessage[][], sent: Completion[]) {
  for (let k = 0; k < 3; k++) {
    const [before, after] = [requests[k]!, requests[k + 1]!];
    expect(after).toHaveLength(before.length + 2);
    expect(after.slice(0, before.length).map(message => JSON.stringify(message))).toEqual(before.map(message => JSON.stringify(message)));
    expect(after[before.length]).toEqual({ role: 'assistant', content: sent[k]!.content, toolCalls: sent[k]!.toolCalls, providerState: sent[k]!.providerState });
    expect(after[before.length + 1]).toMatchObject({ role: 'tool', toolCallId: `read-${k + 1}`, toolName: 'read_file' });
  }
}

test('once frozen, each request is the previous request plus the previous assistant message and its results', async () => {
  // T-3. Guard (mutation): assemble frozen steps with assembleContext, so its result-cutting loop runs under the freeze
  // (the already-sent first result is then cut at step 3 and the prefix changes).
  const { store, run, requests, sent, sessionId } = await threeReads([true, true, true]);
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(requests).toHaveLength(4);
  expectEachRequestAppends(requests, sent);
  // The budget forced cuts: the first result kept its excerpt once sent; the later ones were cut before they were sent.
  expect(requests[3]!.filter(message => message.role === 'tool').map(message => resultPreview(message).length)).toEqual([3072, 0, 0]);
  // The saved results are whole: only the requests carry excerpts.
  expect(store.listMessages(sessionId).filter(message => message.role === 'tool').map(message => message.content.length > 12_000)).toEqual([true, true, true]);
});

test.each([
  ['appendOnly false states', false],
  ['no provider state', undefined],
] as const)('the freeze holds for the rest of the run when later steps carry %s', async (_label, later) => {
  // T-3, spec section 3 rule 3 ("frozen for its remaining steps"; spec 5.4: a later tool_use step without thinking is
  // appendOnly false). Guard (mutation): `frozen = output.providerState?.appendOnly === true`, which unfreezes the run at
  // step 2; a later request then goes back through assembleContext, which cuts the already-sent first result.
  const { store, run, requests, sent } = await threeReads([true, later, later]);
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(requests).toHaveLength(4);
  expectEachRequestAppends(requests, sent);
  // The budget binds from step 3 on: the already-sent first result kept its excerpt, the later ones were cut unsent.
  expect(requests[3]!.filter(message => message.role === 'tool').map(message => resultPreview(message).length)).toEqual([3072, 0, 0]);
});

test('appendOnly false states keep today\'s trimming: an already-sent result is cut at a later step', async () => {
  // Guard (mutation): freeze on any provider state; the first result then stays at its excerpt and the second is cut.
  const { store, run, requests } = await threeReads([false, false, false]);
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(requests).toHaveLength(4);
  expect(resultPreview(requests[1]![3]!)).toHaveLength(3072);
  expect(requests[2]!.filter(message => message.role === 'tool').map(message => resultPreview(message).length)).toEqual([0, 3072]);
});

test('a frozen step that does not fit after cutting only its unsent results ends with CONTEXT_LIMIT and the frozen message', async () => {
  // Guards (mutations): assemble frozen steps with assembleContext (the sent first result is then cut too, the request
  // fits and infer is called a third time); choose the failure text without the frozen flag (today's text).
  const { store, root } = fixture(); cloud(store, 'anthropic', { contextTokens: 5_142, outputTokens: 512 });
  for (const name of ['a', 'b']) writeFileSync(join(root, `${name}.txt`), name.toUpperCase().repeat(12_000));
  let calls = 0; const contexts: Array<{ estimatedInputTokens: number; inputBudgetTokens: number; compactedToolResults: number }> = [];
  const app = new Application(store, { publish(event) { if (event.type === 'context.updated') contexts.push(event.payload as never); }, async infer() {
    calls++;
    if (calls === 1) return readStep(1, 'a.txt', { appendOnly: true, signature: 'U2lnbmF0dXJlMQ' });
    if (calls === 2) return readStep(2, 'b.txt', { appendOnly: true, signature: 'U2lnbmF0dXJl'.repeat(170) });
    return { content: 'unreachable', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const run = await runOnce(app, session.id, 'Read both files.');
  expect(calls).toBe(2); expect(store.getRun(run.id)?.status).toBe('failed');
  const failure = await failureOf(app, session.id);
  expect(failure?.code).toBe('CONTEXT_LIMIT'); expect(plainQuotes(failure!.message)).toBe(FROZEN_TEXT); expect(failure?.retry).toBe('never');
  expect(contexts.at(-1)!.estimatedInputTokens).toBeGreaterThan(contexts.at(-1)!.inputBudgetTokens);
});

test('with history near the full budget, an anthropic run of two tool steps succeeds because of the reserve', async () => {
  // Guard (mutation): reserve 0 (assembleContext without historyReserve); step 1 then keeps history up to the full budget
  // and step 2, frozen, cannot fit its first step's state and result: CONTEXT_LIMIT before the second infer call.
  const { store, root } = fixture(); cloud(store, 'anthropic', { contextTokens: 20_512, outputTokens: 512 });
  for (const name of ['a', 'b']) writeFileSync(join(root, `${name}.txt`), name.toUpperCase().repeat(12_000));
  const requests: InferenceMessage[][] = []; let tools: Parameters<typeof estimateInput>[1] = [];
  const app = new Application(store, { publish() {}, async infer(_run, messages, _signal, offered) {
    requests.push(JSON.parse(JSON.stringify(messages)) as InferenceMessage[]); tools = offered ?? [];
    if (requests.length === 1) return readStep(1, 'a.txt', { appendOnly: true, signature: 'U2lnbmF0dXJl'.repeat(500) });
    if (requests.length === 2) return readStep(2, 'b.txt', { appendOnly: true, signature: 'U2lnbmF0dXJl'.repeat(500) });
    return { content: 'Read both.', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  seedHistory(store, session.id, 9);
  const run = await runOnce(app, session.id, 'Read both files.');
  expect(await failureOf(app, session.id)).toBeNull(); expect(store.getRun(run.id)?.status).toBe('completed'); expect(requests).toHaveLength(3);
  expect(historyCount(requests[0]!, 'Read both files.')).toBeGreaterThan(0);
  expect(estimateInput(requests[0]!, tools)).toBeLessThanOrEqual(10_000);
  expect(requests[2]!.slice(0, requests[0]!.length)).toEqual(requests[0]);
});

test.each(['openai-compatible', 'ollama'] as const)('a %s run gets no reserve and still drops history mid-run', async kind => {
  // Guards (mutations): reserve for every kind (step 1 then keeps at most half the budget); freeze on every tool step
  // (history is then never dropped again, or the run fails).
  const { store, root } = fixture();
  if (kind === 'openai-compatible') cloud(store, kind, { contextTokens: 20_512, outputTokens: 512 });
  else store.putProfile({ ...store.getProfile('profile1')!, contextTokens: 20_512, revisionId: 'ollama-revision', revision: 2 });
  writeFileSync(join(root, 'a.txt'), 'A'.repeat(12_000));
  const requests: InferenceMessage[][] = []; let tools: Parameters<typeof estimateInput>[1] = [];
  const app = new Application(store, { publish() {}, async infer(_run, messages, _signal, offered) {
    requests.push(JSON.parse(JSON.stringify(messages)) as InferenceMessage[]); tools = offered ?? [];
    return requests.length === 1 ? readStep(1, 'a.txt') : { content: 'Read it.', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  seedHistory(store, session.id, 9);
  const run = await runOnce(app, session.id, 'Read the file.');
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(requests).toHaveLength(2);
  expect(estimateInput(requests[0]!, tools)).toBeGreaterThan(10_000);
  expect(historyCount(requests[1]!, 'Read the file.')).toBeLessThan(historyCount(requests[0]!, 'Read the file.'));
});

test('a tool-free anthropic run gets no history reserve', async () => {
  // Guard (mutation): reserve every prefix-bound run, tools or not; step 1 then keeps at most half the budget.
  const { store } = fixture(); cloud(store, 'anthropic', { contextTokens: 20_512, outputTokens: 512 });
  const requests: InferenceMessage[][] = []; const offered: unknown[] = [];
  const app = new Application(store, { publish() {}, async infer(_run, messages, _signal, tools) {
    requests.push(JSON.parse(JSON.stringify(messages)) as InferenceMessage[]); offered.push(tools);
    return { content: 'Answer.', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: null }, 'create')) as { session: { id: string } };
  await app.handle(request('session.policy.update', { sessionId: session.id, expectedRevision: 0, inference: 'cloud-allowed' }, 'cloud'));
  seedHistory(store, session.id, 9);
  const run = await runOnce(app, session.id, 'Summarize.');
  expect(store.getRun(run.id)?.status).toBe('completed'); expect(offered).toEqual([[]]);
  expect(estimateInput(requests[0]!, [])).toBeGreaterThan(10_000);
});

test('a later run\'s first request carries no provider state, and the earlier answer only as text', async () => {
  // F-15. Guard (mutation): carry the previous run's `current` into the next run's history.
  const { store } = fixture(); cloud(store, 'anthropic');
  const requests: InferenceMessage[][] = [];
  const app = new Application(store, { publish() {}, async infer(_run, messages) {
    requests.push(JSON.parse(JSON.stringify(messages)) as InferenceMessage[]);
    if (requests.length === 1) return { ...readStep(1, '.', { appendOnly: true, signature: 'Rmlyc3RSdW5TaWduYXR1cmU' }), toolCalls: [{ id: 'read-1', name: 'list_files', input: { path: '.' } }] };
    return { content: requests.length === 2 ? 'First answer.' : 'Second answer.', outcome: 'complete' };
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  await runOnce(app, session.id, 'First question.', 'first');
  expect(requests[1]!.some(message => message.providerState)).toBe(true);
  await runOnce(app, session.id, 'Second question.', 'second');
  const next = requests[2]!;
  expect(JSON.stringify(next)).not.toContain('providerState'); expect(JSON.stringify(next)).not.toContain('Rmlyc3RSdW5TaWduYXR1cmU');
  expect(next.slice(1)).toEqual([{ role: 'user', content: 'First question.' }, { role: 'assistant', content: 'First answer.' }, { role: 'user', content: 'Second question.' }]);
});

test.each([
  ['a frozen run', { appendOnly: true }, FROZEN_TEXT],
  ['a run whose state is not appendOnly', { appendOnly: false }, TODAY_TEXT],
  ['a run without provider state', undefined, TODAY_TEXT],
] as const)('a provider overflow in %s ends with CONTEXT_LIMIT and its message', async (_name, state, text) => {
  // F-16. Guards (mutations): choose the failure text without the frozen flag (the frozen case goes red); use the frozen
  // text for every CONTEXT_LIMIT (the other cases go red).
  const { store } = fixture(); cloud(store, 'anthropic'); let calls = 0;
  const app = new Application(store, { publish() {}, async infer() {
    if (++calls === 1) return { ...readStep(1, '.', state ? { ...state, signature: 'T3ZlcmZsb3dTaWc' } : undefined), toolCalls: [{ id: 'read-1', name: 'list_files', input: { path: '.' } }] };
    throw new Error('CONTEXT_LIMIT');
  } });
  const { session } = await app.handle(request('session.create', { projectId: 'p1' }, 'create')) as { session: { id: string } };
  const run = await runOnce(app, session.id, 'List the files.');
  expect(calls).toBe(2); expect(store.getRun(run.id)?.status).toBe('failed');
  const failure = await failureOf(app, session.id);
  expect(failure?.code).toBe('CONTEXT_LIMIT'); expect(plainQuotes(failure!.message)).toBe(text);
});

test('a frozen review run that overflows keeps REVIEW_CONTEXT_LIMIT and the review message', async () => {
  // F-16. Guard (mutation): apply the frozen text to review runs too.
  const root = mkdtempSync(join(tmpdir(), 'moonzila-app-review-')); roots.push(root);
  const data = join(root, 'data'); const project = join(root, 'project'); mkdirSync(data); mkdirSync(project);
  const store = new Store(join(data, 'state.sqlite')); stores.push(store);
  const at = new Date().toISOString();
  store.putProject({ id: 'p1', rootPath: project, pathLabel: project, name: 'Example', trusted: true, trustRevision: 1, policy: { revision: 1, inference: 'cloud-allowed', research: 'public-technical' }, missing: false, createdAt: at });
  store.putProfile({ id: 'profile1', name: 'Anthropic', kind: 'anthropic', endpoint: 'https://api.anthropic.com/v1', model: 'test', contextTokens: 32_768, outputTokens: 512, locality: 'external', revision: 1, revisionId: 'v1', createdAt: at, updatedAt: at });
  store.createResearch({ id: 'j1', projectId: 'p1', topic: 'Context limits', inputs: { queries: [], urls: [], preferDomains: [], depth: 'quick', maxPages: 8 }, clientRef: 'mz-j1', researchLevel: 'public-technical', policyRevision: 1, trustRevision: 1 }, { actor: 'user' });
  const advance = (to: 'dispatching' | 'collecting' | 'collected', patch: Record<string, unknown>) => store.transitionResearch({ researchId: 'j1', expectedRevision: store.getResearch('j1')!.revision, to, actor: 'main', cause: 'TEST_STEP', patch: patch as never });
  advance('dispatching', { target: { collectorRevision: 1, repository: 'owner/collector', workflow: 'collect.yml', ref: 'main' } });
  advance('collecting', { workflowRunId: '41' });
  advance('collected', { verification: { artifactSha256: 'a'.repeat(64), artifactBytes: 18127, validatorRevision: 'b'.repeat(40), nodeSha256: 'c'.repeat(64), state: 'REVIEW_IN_PROGRESS', jobRevision: 3, projectRevision: 1, repository: 'owner/collector', ref: 'main', workflow: 'collect.yml', commit: 'd'.repeat(40), runAttempt: 1, workflowRunId: '41', clientRef: 'mz-j1', downloadDigest: 'unverified' } });
  const workspace = reviewWorkspacePath(data, 'j1'); mkdirSync(join(workspace, 'research'), { recursive: true }); writeFileSync(join(workspace, 'research', 'BRIEF.md'), 'not drafted\n');
  let calls = 0; const events: Array<{ type: string; payload: unknown }> = [];
  const app = new Application(store, { publish(event) { events.push(event); }, async infer() {
    if (++calls === 1) return { ...readStep(1, '.', { appendOnly: true, signature: 'UmV2aWV3U2lnbmF0dXJl' }), toolCalls: [{ id: 'read-1', name: 'list_files', input: { path: '.' } }] };
    throw new Error('CONTEXT_LIMIT');
  } }, { dataDirectory: data });
  const { run } = await app.beginReview({ requestId: 'begin-1', researchId: 'j1', profileId: 'profile1', workspace: 'fresh' }) as { run: Run };
  await app.whenIdle();
  expect(calls).toBe(2); expect(store.getRun(run.id)?.status).toBe('failed');
  expect(store.getResearch('j1')).toMatchObject({ status: 'not_ready', failure: 'REVIEW_CONTEXT_LIMIT' });
  const failed = store.events(run.id, 0, 1000).events.find(event => event.type === 'run.failed')!;
  expect(failed.payload).toEqual({ error: { code: 'REVIEW_NOT_READY', message: 'The research review exceeded the selected model’s context budget. The research job is not ready.', retry: 'never' } });
});
