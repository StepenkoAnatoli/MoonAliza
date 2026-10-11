// Fail-closed locality for a user-run Ollama (docs/specification/more-models.md, Phase 1 design 2;
// REQUIREMENTS-P1 F-5, F-6, S-1, T-1). A loopback fake stands in for Ollama: it serves /api/status and
// /api/chat and records every request, so "refused before the chat request" is read off what it saw.
import { afterEach, expect, test } from 'vitest';
import { createServer, type IncomingHttpHeaders, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import { readFileSync } from 'node:fs';
import { complete, type Fetcher, type InferenceMessage } from '../src/main/inference';
import { assertOllamaLocal, verifyOllamaLocality } from '../src/main/ollama-locality';

// Wire E-30 (docs/research/2026-10-05-provider-wire-formats/research/raw/2026-10-05-types-go-githubusercontent-4d8bd3e9.md,
// capture lines 877-885): `type CloudStatus struct { Disabled bool `json:"disabled"` Source string `json:"source"` }` inside
// `type StatusResponse struct { Cloud CloudStatus `json:"cloud"` }`. Wire E-31 (raw/2026-10-05-routes-go-githubusercontent-6669b9b0.md,
// capture lines 1939 and 2211-2218): GET /api/status is StatusHandler, which answers c.JSON(http.StatusOK, api.StatusResponse{...}).
// No captured page enumerates `source` (internalcloud.Status lives in another file), so it carries Go's zero value.
const statusBody = (disabled: unknown) => ({ cloud: { disabled, source: '' } });
// Wire E-30 (same capture, lines 525-556 and 204-214): ChatResponse { model, created_at, message { role, content }, done, done_reason }.
const chatAnswer = { model: 'llama3.2', created_at: '2026-10-05T00:00:00Z', message: { role: 'assistant', content: 'local answer' }, done: true, done_reason: 'stop' };

const PROMPT = 'private prompt: rename the billing module';
const messages: InferenceMessage[] = [{ role: 'user', content: PROMPT }];
type Inference = 'local-only' | 'cloud-allowed';
interface Seen { method: string; path: string; headers: IncomingHttpHeaders; body: string }
type Reply = (request: IncomingMessage, response: ServerResponse) => void;

const json = (status: number, data: unknown): Reply => (_request, response) => {
  response.statusCode = status; response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(data));
};
const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

/**
 * A loopback Ollama: GET .../api/status answers with `status`, POST .../api/chat with the E-30 chat answer.
 * `open` holds every connection that carried a request and has not closed yet.
 */
async function startOllama(status: Reply) {
  const seen: Seen[] = []; const open = new Set<Socket>(); const fake = { seen, open, status, endpoint: '' };
  const server = createServer((request, response) => {
    const socket = request.socket;
    if (!open.has(socket)) { open.add(socket); socket.once('close', () => open.delete(socket)); }
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const entry = { method: request.method ?? '', path: request.url ?? '', headers: request.headers, body: Buffer.concat(chunks).toString('utf8') };
      seen.push(entry);
      if (entry.path === '/redirected-status') return json(200, statusBody(true))(request, response);
      if (entry.method === 'GET' && entry.path.endsWith('/api/status')) return fake.status(request, response);
      if (entry.method === 'POST' && entry.path.endsWith('/api/chat')) { response.setHeader('Content-Type', 'application/x-ndjson'); response.end(`${JSON.stringify(chatAnswer)}\n`); return; }
      response.statusCode = 404; response.end('404 page not found');
    });
  });
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  fake.endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return fake;
}

const fetcher: Fetcher = (url, init) => fetch(url, init);
const context = (endpoint: string, session: Inference, project: Inference | null = null, kind: 'ollama' | 'openai-compatible' = 'ollama') => ({
  session: { policy: { inference: session } }, project: project === null ? null : { policy: { inference: project } },
  profile: { kind, endpoint, model: 'llama3.2', outputTokens: 64 },
});
/** One model step in the order infer() runs it (src/main/index.ts): the locality check, then complete(). */
async function step(item: ReturnType<typeof context>, signal = new AbortController().signal) {
  await verifyOllamaLocality(item, fetcher, signal);
  return complete(item.profile, messages, { fetcher, signal });
}
const paths = (seen: Seen[]) => seen.map(entry => `${entry.method} ${entry.path}`);
/** True once every connection that carried a request to `fake` has closed, false if one is still open at `deadline`. */
async function closedBy(fake: { open: Set<Socket> }, deadline: number) {
  while (fake.open.size > 0 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
  return fake.open.size === 0;
}
/** A fetcher whose request and body ignore the run's signal: only the reader's own cancel can end a stalled body. */
const unsignalled: Fetcher = (url, init) => fetch(url, { ...init, signal: null });

const padded = (bytes: number) => {
  const base = JSON.stringify(statusBody(true)).length;
  return JSON.stringify({ cloud: { disabled: true, source: 'x'.repeat(bytes - base) } });
};
const refusals: Array<[string, Reply]> = [
  ['a 404 (an Ollama without /api/status)', (_request, response) => { response.statusCode = 404; response.end('404 page not found'); }],
  ['a 500 that still says disabled', json(500, statusBody(true))],
  ['a 201 that still says disabled', json(201, statusBody(true))],
  ['disabled: false', json(200, statusBody(false))],
  ['cloud without disabled', json(200, { cloud: { source: '' } })],
  ['no cloud object', json(200, {})],
  ['disabled as the string "true"', json(200, statusBody('true'))],
  ['disabled as 1', json(200, statusBody(1))],
  ['JSON null', json(200, null)],
  ['a body that is not JSON', (_request, response) => { response.end('cloud disabled'); }],
  ['a body one byte over 64 KiB', (_request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(padded(64 * 1024 + 1)); }],
  // A valid answer first, in a chunk of its own, then whitespace past the bound: only refusing on overflow refuses this,
  // because the bytes read before the bound still parse as `disabled: true`.
  ['a valid answer followed by whitespace past 64 KiB', (_request, response) => {
    response.setHeader('Content-Type', 'application/json'); response.write(JSON.stringify(statusBody(true)));
    setTimeout(() => response.end(' '.repeat(65 * 1024)), 20);
  }],
  ['a 302 to an answer that says disabled', (_request, response) => { response.statusCode = 302; response.setHeader('Location', '/redirected-status'); response.end(); }],
  ['a network error', request => { request.socket.destroy(); }],
];

test.each(refusals)('under local-only, %s refuses with LOCAL_MODEL_UNVERIFIED before any chat request', async (_case, reply) => {
  const ollama = await startOllama(reply);
  await expect(step(context(ollama.endpoint, 'local-only'))).rejects.toThrow('LOCAL_MODEL_UNVERIFIED');
  expect(paths(ollama.seen)).toEqual(['GET /api/status']);
});

test('under local-only, cloud.disabled true lets the chat request through, after one status request', async () => {
  const ollama = await startOllama(json(200, statusBody(true)));
  await expect(step(context(ollama.endpoint, 'local-only'))).resolves.toMatchObject({ content: 'local answer', outcome: 'complete' });
  expect(paths(ollama.seen)).toEqual(['GET /api/status', 'POST /api/chat']);
});

test('a body of exactly 64 KiB is read whole and accepted', async () => {
  const ollama = await startOllama((_request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(padded(64 * 1024)); });
  await expect(assertOllamaLocal(ollama.endpoint, fetcher, new AbortController().signal)).resolves.toBeUndefined();
});

test('a redirect is never followed: the redirect target is not requested', async () => {
  const ollama = await startOllama((_request, response) => { response.statusCode = 307; response.setHeader('Location', '/redirected-status'); response.end(); });
  await expect(assertOllamaLocal(ollama.endpoint, fetcher, new AbortController().signal)).rejects.toThrow('LOCAL_MODEL_UNVERIFIED');
  expect(paths(ollama.seen)).toEqual(['GET /api/status']);
});

test('a fetcher that follows redirects regardless still gets a refusal for a redirected answer', async () => {
  const ollama = await startOllama((_request, response) => { response.statusCode = 302; response.setHeader('Location', '/redirected-status'); response.end(); });
  const following: Fetcher = (url, init) => fetch(url, { ...init, redirect: 'follow' });
  await expect(assertOllamaLocal(ollama.endpoint, following, new AbortController().signal)).rejects.toThrow('LOCAL_MODEL_UNVERIFIED');
  expect(paths(ollama.seen)).toEqual(['GET /api/status', 'GET /redirected-status']);
});

test.each<[string, Inference, Inference | null]>([
  ['the session is cloud-allowed and there is no project', 'cloud-allowed', null],
  ['the session and the project are both cloud-allowed', 'cloud-allowed', 'cloud-allowed'],
])('when %s, no status request is made', async (_case, session, project) => {
  // The fake would refuse (disabled: false): only the absence of a status request lets the step through.
  const ollama = await startOllama(json(200, statusBody(false)));
  await expect(step(context(ollama.endpoint, session, project))).resolves.toMatchObject({ outcome: 'complete' });
  expect(paths(ollama.seen)).toEqual(['POST /api/chat']);
});

test.each<[string, Inference, Inference | null]>([
  ['the session is local-only and the project cloud-allowed', 'local-only', 'cloud-allowed'],
  ['the session is cloud-allowed and the project local-only', 'cloud-allowed', 'local-only'],
  ['both are local-only', 'local-only', 'local-only'],
])('the effective policy is local-only when %s', async (_case, session, project) => {
  const ollama = await startOllama(json(200, statusBody(false)));
  await expect(step(context(ollama.endpoint, session, project))).rejects.toThrow('LOCAL_MODEL_UNVERIFIED');
  expect(paths(ollama.seen)).toEqual(['GET /api/status']);
});

test('an openai-compatible profile on loopback is not checked, even under local-only', async () => {
  const ollama = await startOllama(json(200, statusBody(false)));
  await expect(verifyOllamaLocality(context(ollama.endpoint, 'local-only', 'local-only', 'openai-compatible'), fetcher, new AbortController().signal)).resolves.toBeUndefined();
  expect(ollama.seen).toEqual([]);
});

test('every step of a run asks again: two steps make two status requests, and cloud turned on between steps refuses the next', async () => {
  const ollama = await startOllama(json(200, statusBody(true)));
  const item = context(ollama.endpoint, 'local-only');
  const signal = new AbortController().signal;
  await step(item, signal);
  await step(item, signal);
  expect(paths(ollama.seen)).toEqual(['GET /api/status', 'POST /api/chat', 'GET /api/status', 'POST /api/chat']);
  ollama.status = json(200, statusBody(false)); // Ollama restarted with its cloud features on.
  await expect(step(item, signal)).rejects.toThrow('LOCAL_MODEL_UNVERIFIED');
  expect(paths(ollama.seen).slice(4)).toEqual(['GET /api/status']);
});

test('the status request is a bare GET: no credential, no cookie, no body, no prompt text', async () => {
  const ollama = await startOllama(json(200, statusBody(true)));
  await step(context(ollama.endpoint, 'local-only'));
  const [status, chat] = ollama.seen;
  expect(status).toMatchObject({ method: 'GET', path: '/api/status', body: '' });
  expect(status!.headers.authorization).toBeUndefined();
  expect(status!.headers.cookie).toBeUndefined();
  expect(JSON.stringify(status)).not.toContain(PROMPT);
  expect(chat!.body).toContain(PROMPT); // the fake would have seen the prompt, had it been sent
});

test.each([
  ['a trailing slash', '/', '/api/status'],
  ['a trailing path', '/ollama', '/ollama/api/status'],
  ['a trailing path with a slash', '/ollama/', '/ollama/api/status'],
])('an endpoint with %s asks the same base the chat request uses', async (_case, suffix, expected) => {
  const ollama = await startOllama(json(200, statusBody(true)));
  await step(context(`${ollama.endpoint}${suffix}`, 'local-only'));
  expect(paths(ollama.seen)).toEqual([`GET ${expected}`, `POST ${expected.replace('/api/status', '/api/chat')}`]);
});

test('a run cancelled before the check sends nothing and is RUN_CANCELLED', async () => {
  const calls: string[] = [];
  const recording: Fetcher = async url => { calls.push(url); return Response.json(statusBody(true)); };
  const controller = new AbortController(); controller.abort();
  await expect(verifyOllamaLocality(context('http://127.0.0.1:11434', 'local-only'), recording, controller.signal)).rejects.toThrow('RUN_CANCELLED');
  expect(calls).toEqual([]);
});

test('a run cancelled while the status request is pending is RUN_CANCELLED at once, not LOCAL_MODEL_UNVERIFIED, and its connection closes', async () => {
  const ollama = await startOllama(() => { /* never answers */ });
  const controller = new AbortController();
  const started = Date.now();
  setTimeout(() => controller.abort(), 50);
  await expect(step(context(ollama.endpoint, 'local-only'), controller.signal)).rejects.toThrow('RUN_CANCELLED');
  expect(Date.now() - started).toBeLessThan(2000);
  expect(paths(ollama.seen)).toEqual(['GET /api/status']);
  expect(await closedBy(ollama, Date.now() + 500), 'the status request carries the run signal').toBe(true);
});

test('a run cancelled while the status body is still arriving closes the connection, even through a fetcher that ignores the signal', async () => {
  const ollama = await startOllama((_request, response) => { response.setHeader('Content-Type', 'application/json'); response.write('{"cloud":'); /* body never ends */ });
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 50);
  await expect(verifyOllamaLocality(context(ollama.endpoint, 'local-only'), unsignalled, controller.signal)).rejects.toThrow('RUN_CANCELLED');
  expect(await closedBy(ollama, Date.now() + 500), 'the reader is cancelled on abort').toBe(true);
});

test('every way of not answering ends as LOCAL_MODEL_UNVERIFIED at the 5 s bound, never later, and the status connection closes with it', async () => {
  const stall: Reply = (_request, response) => { response.setHeader('Content-Type', 'application/json'); response.write('{"cloud":'); /* body never ends */ };
  const silent = await startOllama(() => { /* no headers */ });
  const stalled = await startOllama(stall);
  const stalledUnsignalled = await startOllama(stall);
  const deaf: Fetcher = () => new Promise<Response>(() => { /* ignores the signal and never settles */ });
  const timed = async (run: () => Promise<unknown>) => {
    const started = Date.now();
    const outcome = await run().then(() => 'resolved', (error: Error) => error.message);
    const settled = Date.now();
    return { outcome, elapsed: settled - started, settled };
  };
  const results = await Promise.all([
    timed(() => step(context(silent.endpoint, 'local-only'))),
    timed(() => step(context(stalled.endpoint, 'local-only'))),
    timed(() => assertOllamaLocal(stalledUnsignalled.endpoint, unsignalled, new AbortController().signal)),
    timed(() => assertOllamaLocal('http://127.0.0.1:11434', deaf, new AbortController().signal)),
  ]);
  for (const [index, result] of results.entries()) {
    expect(result.outcome, `case ${index}`).toBe('LOCAL_MODEL_UNVERIFIED');
    expect(result.elapsed, `case ${index}`).toBeGreaterThanOrEqual(4900);
    // Slack for a slow runner (Windows CI has run a test 12 times slower than usual, P5-27); still below
    // the 10 s a doubled 5 s bound would show, so a wrong bound is caught.
    expect(result.elapsed, `case ${index}`).toBeLessThan(9500);
  }
  expect(paths(silent.seen)).toEqual(['GET /api/status']);
  expect(paths(stalled.seen)).toEqual(['GET /api/status']);
  // The refusal is not enough: the request itself must end, or every refused step leaves a socket open to a hung Ollama.
  const fakes = [silent, stalled, stalledUnsignalled];
  for (const [index, fake] of fakes.entries()) expect(await closedBy(fake, results[index]!.settled + 500), `case ${index} closed`).toBe(true);
}, 20_000);

test('infer() awaits the check as a statement of its own, straight after the policy and endpoint checks and before the model call, on the local session', () => {
  // infer() is a closure inside Electron's ready handler and has no harness; its order is pinned from its source, by whole
  // lines, so that the call cannot sit inside a try, a .then() or a function nobody awaits and still pass.
  const source = readFileSync(new URL('../src/main/index.ts', import.meta.url), 'utf8');
  const start = source.indexOf('async function infer(');
  expect(start).toBeGreaterThan(-1);
  const lines = source.slice(start, source.indexOf('async function readGitHub(', start)).split('\n').map(line => line.trim());
  const code = (line: string) => line !== '' && !line.startsWith('//');
  const call = 'await verifyOllamaLocality(context, (url, init) => localSession.fetch(url, init), capability.stop.signal);';
  const at = lines.indexOf(call);
  const endpointCheck = lines.findIndex(line => line.includes("throw new Error('INVALID_ENDPOINT')"));
  const invoke = lines.findIndex(line => line.startsWith('const invoke = '));
  expect(at, 'the call is a whole line').toBeGreaterThan(-1);
  expect(endpointCheck).toBeGreaterThan(-1);
  expect(lines.slice(0, at).filter(code).at(-1), 'the code line before the call').toBe(lines[endpointCheck]);
  expect(lines.slice(endpointCheck + 1, invoke).filter(code).filter(line => /\btry\b|\bcatch\b|\.then\(/.test(line)), 'nothing can catch or detach the refusal').toEqual([]);
  // And it sits in infer()'s own body, not in a block or callback opened earlier: every bracket opened since the signature is closed.
  const depth = [...lines.slice(1, at).filter(code).join('')].reduce((open, char) => open + ('{(['.includes(char) ? 1 : ')}]'.includes(char) ? -1 : 0), 0);
  expect(depth, 'brackets still open before the call').toBe(0);
  const policyCheck = lines.findIndex(line => line.includes('assertConversationPolicy('));
  expect(policyCheck).toBeGreaterThan(-1);
  expect(at).toBeGreaterThan(policyCheck);
  expect(at).toBeLessThan(invoke);
  expect(at).toBeLessThan(lines.findIndex(line => line.includes('vault.grant(')));
  expect(source.split('verifyOllamaLocality(').length - 1).toBe(1); // infer() only: not profile.test, not the managed runtime
});
