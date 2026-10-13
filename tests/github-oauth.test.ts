import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';
import { DEVICE_CODE_URL, DEVICE_PAGE_URL, REQUEST_OFFLINE_ACCESS, TOKEN_URL, USER_URL } from '../src/main/github-app';
import type { Fetcher } from '../src/main/github-credential';
import { fetchLogin, headerSafeToken, oauthRequest, rateLimitWait, requestDeviceCode, requestToken, type WireLimits } from '../src/main/github-oauth';
import { DateTimeSchema } from '../src/shared/contracts';
import { GitHubUserCodeSchema } from '../src/shared/github-account';
import { ROUTES, codeAnswer, errorAnswer, fetcherFor, markers, startFakeGitHubOAuth, tokenAnswer, type FakeGitHubOAuth, type FakeReply, type Markers } from './fixtures/fake-github-oauth';

// GitHub sign-in, U1: the wire client (docs/specification/github-sign-in.md 3.5 and 5; "Tests the builders owe",
// tests/github-oauth.test.ts). Every answer is built from E-01/E-02/E-15 shapes, not a capture; markers are generated at run
// time. Requests go to the loopback fake through fetcherFor, or to an injected fetcher; globalThis.fetch is never stubbed.

const limits: WireLimits = { requestTimeoutMs: 5_000, maxBodyBytes: 65_536, rateLimitFloorMs: 60_000, rateLimitCeilingMs: 3_600_000 };
const quick: WireLimits = { ...limits, requestTimeoutMs: 50 };
const NOW = 1_800_000_000_000;
const now = () => NOW;
const CLIENT = 'Iv23-test-client';
const POLL_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
const UA = 'MoonAliza-github-sign-in';
const LOGIN_INIT_KEYS = ['cache', 'credentials', 'headers', 'method', 'redirect', 'signal'];
const OAUTH_INIT_KEYS = ['body', 'cache', 'credentials', 'headers', 'method', 'redirect', 'signal'];

let fake: FakeGitHubOAuth;
let fetcher: Fetcher;
beforeAll(async () => { fake = await startFakeGitHubOAuth(); fetcher = fetcherFor(fake); });
afterAll(async () => { await fake.close(); });
beforeEach(() => { fake.reset(); });

const live = () => new AbortController().signal;
const pollParams = (m: Markers) => ({ client_id: CLIENT, device_code: m.device, grant_type: POLL_GRANT });
const refreshParams = (m: Markers) => ({ client_id: CLIENT, grant_type: 'refresh_token', refresh_token: m.refresh });
const token = (params: Record<string, string>, l = limits, f = fetcher) => requestToken(f, params, live(), l, now);
const deviceCode = (offline = REQUEST_OFFLINE_ACCESS, l = limits, f = fetcher) => requestDeviceCode(f, CLIENT, offline, live(), l, now);
const settle = <T>(promise: Promise<T>) => promise.then(value => ({ value }), (error: unknown) => ({ error }));
function spy(inner: Fetcher = fetcher) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const wrapped: Fetcher = (url, init) => { calls.push({ url, init }); return inner(url, init); };
  return { calls, fetcher: wrapped };
}
const sorted = (keys: Iterable<string>) => [...keys].sort();
/** A stream that records whether it was cancelled, for "the body is always cancelled or released". */
function watchedBody(text: string) {
  const state = { cancelled: false };
  const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode(text)); }, cancel() { state.cancelled = true; } });
  return { state, body };
}
/** A pull-based stream of `total` bytes in 16 KiB pieces, with no content-length, so only the streaming bound can refuse it; it
 *  records how much was pulled and whether it was cancelled. */
function watchedStream(total: number) {
  const state = { cancelled: false, pulled: 0 };
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (state.pulled >= total) { controller.close(); return; }
      const size = Math.min(16_384, total - state.pulled); state.pulled += size;
      controller.enqueue(new Uint8Array(size).fill(0x20));
    },
    cancel() { state.cancelled = true; },
  });
  return { state, body };
}

/** Every 8-character piece of a marker, and every `cause`, found anywhere in an outcome: its own and non-enumerable keys, an
 *  Error's message and stack, and the whole cause chain (L-7, DC-9). */
function leaks(outcome: unknown, secrets: string[]): string[] {
  const found: string[] = []; const seen = new Set<object>();
  const piece = (text: string) => secrets.some(secret => { for (let i = 0; i + 8 <= secret.length; i++) if (text.includes(secret.slice(i, i + 8))) return true; return false; });
  const visit = (key: string, value: unknown) => {
    if (key === 'cause') found.push('a cause');
    if (typeof value === 'string' && piece(value)) found.push(`a marker piece at ${key || 'the root'}`);
    if (typeof value !== 'object' || value === null || seen.has(value)) return;
    seen.add(value);
    for (const inner of Reflect.ownKeys(value)) visit(String(inner), (value as Record<PropertyKey, unknown>)[inner]);
  };
  visit('', outcome);
  return found;
}

// ---- The loopback fake itself (T-2): U5 and U7 rely on what it records. ----

test('the fake: fetcherFor maps only the two GitHub origins and throws on any other URL before a request', async () => {
  for (const url of ['https://example.com/login/device/code', 'https://github.com/settings/apps', 'http://github.com/login/device/code', 'https://api.github.com:8443/user', 'https://someone@api.github.com/user', 'https://github.com.evil.test/login/device/code']) {
    expect(() => fetcher(url, { method: 'GET' }), url).toThrow('FAKE_GITHUB_UNROUTED');
  }
  expect(fake.requests).toEqual([]);
  fake.answer('api.github.com/elsewhere', { status: 204 });
  expect((await fetcher('https://api.github.com/elsewhere', { method: 'GET' })).status).toBe(204);
  expect(fake.requests.map(request => [request.host, request.path, request.unanswered])).toEqual([['api.github.com', '/elsewhere', false]]);
});

test('the fake: query keys and body keys are recorded apart, with the marker identity, and a client secret field anywhere is seen', async () => {
  const m = markers(); const field = ['client', 'secret'].join('_');
  fake.register({ access: m.access, refresh: m.refresh });
  fake.always(ROUTES.token, { json: {} });
  await fetcher(`${TOKEN_URL}?a=1`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${m.access}` }, body: `b=2&refresh_token=${m.refresh}` });
  await fetcher(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `${field}=x` });
  await fetcher(`${TOKEN_URL}?${field}=x`, { method: 'POST' });
  const [first, second, third] = fake.to(ROUTES.token);
  expect(first).toMatchObject({ method: 'POST', host: 'github.com', path: '/login/oauth/access_token', queryKeys: ['a'], bodyKeys: ['b', 'refresh_token'], authorization: 'marker', authorizationMarker: 'access', clientSecret: false });
  expect(sorted(first!.carries)).toEqual(['access', 'refresh']);
  expect(first!.headers).not.toHaveProperty('authorization');
  expect([second!.clientSecret, third!.clientSecret]).toEqual([true, true]);
  expect(second).toMatchObject({ queryKeys: [], bodyKeys: [field], authorization: 'none', carries: [] });
});

test('the fake: markers are generated per call with their prefixes, and an unqueued route answers 500 and is marked', async () => {
  const [a, b] = [markers(), markers()];
  expect(a.access).toMatch(/^ghu_[0-9a-f]{48}$/); expect(a.refresh).toMatch(/^ghr_[0-9a-f]{48}$/); expect(a.device).toMatch(/^[0-9a-f]{40}$/);
  expect(GitHubUserCodeSchema.safeParse(a.userCode).success).toBe(true);
  expect(new Set([a.access, a.refresh, a.device, b.access, b.refresh, b.device]).size).toBe(6);
  expect((await fetcher(USER_URL, { method: 'GET' })).status).toBe(500);
  expect(fake.requests[0]!.unanswered).toBe(true);
});

test('the fake: an answer function sees the record, a throwing handler is captured and answers 500, and a * route matches by prefix', async () => {
  fake.answer('api.github.com/repos/*', request => ({ status: 200, json: { path: request.path, seq: request.seq } }), () => { throw new Error('handler assertion'); });
  const first = await fetcher('https://api.github.com/repos/o/r/contents/README.md?ref=main', { method: 'GET' });
  expect(await first.json()).toEqual({ path: '/repos/o/r/contents/README.md', seq: 1 });
  expect((await fetcher('https://api.github.com/repos/o/r/commits/main', { method: 'GET' })).status).toBe(500);
  expect(fake.errors.map(error => (error as Error).message)).toEqual(['handler assertion']);
  expect(fake.requests.map(request => [request.path, request.queryKeys])).toEqual([['/repos/o/r/contents/README.md', ['ref']], ['/repos/o/r/commits/main', []]]);
});

// ---- Request shapes (5.1, 5.2, DC-3, E-21). ----

test('step 1: POST to the exact URL, no query, body keys {client_id, scope} while REQUEST_OFFLINE_ACCESS, and the pinned options', async () => {
  const m = markers(); fake.answer(ROUTES.device, codeAnswer(m));
  const traced = spy(); const owner = new AbortController();
  expect(await requestDeviceCode(traced.fetcher, CLIENT, REQUEST_OFFLINE_ACCESS, owner.signal, limits, now)).toMatchObject({ kind: 'code' });
  const [{ url, init }] = traced.calls as [{ url: string; init: RequestInit }];
  expect(url).toBe(DEVICE_CODE_URL); expect(new URL(url).search).toBe('');
  expect(sorted(Object.keys(init))).toEqual(OAUTH_INIT_KEYS);
  expect(init).toMatchObject({ method: 'POST', redirect: 'manual', credentials: 'omit', cache: 'no-store' });
  expect(init.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA });
  expect(init.body).toBe(new URLSearchParams({ client_id: CLIENT, scope: 'offline_access' }).toString());
  expect(init.signal).not.toBe(owner.signal); expect(init.signal!.aborted).toBe(false); owner.abort(); expect(init.signal!.aborted).toBe(true);
  const [seen] = fake.to(ROUTES.device);
  expect(seen).toMatchObject({ method: 'POST', host: 'github.com', queryKeys: [], contentType: 'application/x-www-form-urlencoded', authorization: 'none', clientSecret: false });
  expect(sorted(seen!.bodyKeys)).toEqual(['client_id', 'scope']);
  expect(seen!.body).toEqual({ client_id: CLIENT, scope: 'offline_access' });
  expect(seen!.headers).toMatchObject({ accept: 'application/json', 'user-agent': UA });
  expect(seen!.headerNames).not.toContain('cookie'); expect(seen!.headerNames).not.toContain('authorization');
  expect(seen!.bodyKeys).not.toContain('repository_id');
});

test('step 1 without offline access sends exactly {client_id} (DC-3)', async () => {
  fake.answer(ROUTES.device, codeAnswer(markers()));
  expect(await deviceCode(false)).toMatchObject({ kind: 'code' });
  expect(fake.to(ROUTES.device)[0]).toMatchObject({ queryKeys: [], bodyKeys: ['client_id'], body: { client_id: CLIENT } });
});

test.each([
  ['poll', (m: Markers) => pollParams(m), ['client_id', 'device_code', 'grant_type']],
  ['refresh', (m: Markers) => refreshParams(m), ['client_id', 'grant_type', 'refresh_token']],
] as const)('the %s: POST TOKEN_URL with no query, its exact body keys in a form body, and no client secret or repository_id', async (_name, params, keys) => {
  const m = markers(); fake.register({ refresh: m.refresh, device: m.device });
  fake.answer(ROUTES.token, tokenAnswer(m));
  const traced = spy();
  expect(await token(params(m), limits, traced.fetcher)).toMatchObject({ kind: 'tokens' });
  const [{ url, init }] = traced.calls as [{ url: string; init: RequestInit }];
  expect(url).toBe(TOKEN_URL); expect(url).not.toContain('?');
  expect(sorted(Object.keys(init))).toEqual(OAUTH_INIT_KEYS);
  expect(init).toMatchObject({ method: 'POST', redirect: 'manual', credentials: 'omit', cache: 'no-store' });
  expect(init.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA });
  const [seen] = fake.to(ROUTES.token);
  expect(seen).toMatchObject({ queryKeys: [], contentType: 'application/x-www-form-urlencoded', authorization: 'none', clientSecret: false, body: params(m) });
  expect(sorted(seen!.bodyKeys)).toEqual(keys);
  expect(seen!.headers).toMatchObject({ accept: 'application/json', 'user-agent': UA });
});

test('the placement pin (5.2, E-21): oauthRequest puts every parameter in a form body and leaves the URL without a query', async () => {
  const m = markers(); const signal = live();
  const built = oauthRequest(TOKEN_URL, refreshParams(m), signal);
  expect(built).toEqual({ url: TOKEN_URL, init: { method: 'POST', redirect: 'manual', credentials: 'omit', cache: 'no-store', signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA }, body: new URLSearchParams(refreshParams(m)).toString() } });
  expect(built.init.signal).toBe(signal);
  expect(built.url).not.toContain(m.refresh);
  fake.register({ refresh: m.refresh });
  fake.answer(ROUTES.token, tokenAnswer(m));
  await token(refreshParams(m));
  const [seen] = fake.to(ROUTES.token);
  expect(seen!.queryKeys).toEqual([]); expect(seen!.bodyKeys).toContain('refresh_token'); expect(seen!.carries).toEqual(['refresh']);
});

test('each request is dispatched synchronously, before the call returns (spec 3.8: inside withSecret, L-7)', () => {
  const m = markers(); let calls = 0;
  const pending: Fetcher = () => { calls++; return new Promise<Response>(() => {}); };
  void requestDeviceCode(pending, CLIENT, true, live(), limits, now); expect(calls).toBe(1);
  void requestToken(pending, refreshParams(m), live(), limits, now); expect(calls).toBe(2);
  void fetchLogin(pending, `Bearer ${m.access}`, live(), limits); expect(calls).toBe(3);
});

test('a fetcher that throws synchronously, a reset socket, a hang past the timeout and a stalled body are transient, or failed at step 1', async () => {
  const m = markers();
  const throwing: Fetcher = () => { throw new TypeError('bad header'); };
  expect(await token(pollParams(m), limits, throwing)).toEqual({ kind: 'transient' });
  expect(await deviceCode(true, limits, throwing)).toEqual({ kind: 'failed' });
  fake.answer(ROUTES.token, { reset: true }, { hang: true }, { ...tokenAnswer(m), hang: 'body' });
  fake.answer(ROUTES.device, { reset: true }, { hang: true });
  const started = Date.now();
  expect(await token(pollParams(m), quick)).toEqual({ kind: 'transient' });
  expect(await token(pollParams(m), quick)).toEqual({ kind: 'transient' });
  expect(await token(pollParams(m), quick)).toEqual({ kind: 'transient' });
  expect(await deviceCode(true, quick)).toEqual({ kind: 'failed' });
  expect(await deviceCode(true, quick)).toEqual({ kind: 'failed' });
  expect(Date.now() - started).toBeLessThan(5_000);
  const aborted = new AbortController(); aborted.abort();
  fake.answer(ROUTES.token, tokenAnswer(m));
  expect(await requestToken(fetcher, pollParams(m), aborted.signal, limits, now)).toEqual({ kind: 'transient' });
});

/** A 200 application/json answer whose body sends its first half, then fails: the read rejects after the headers, with no timer
 *  involved. A fresh stream per call; `pulls` reaches 2 only once the half was taken and the failure was raised. */
function failingBody(text: string) {
  const state = { pulls: 0 };
  const fetcher: Fetcher = async () => {
    const bytes = new TextEncoder().encode(text);
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        state.pulls++;
        if (state.pulls === 1) controller.enqueue(bytes.subarray(0, bytes.length >> 1)); else controller.error(new TypeError('terminated'));
      },
    });
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { state, fetcher };
}

test('a body whose read fails part-way, after the headers, is transient, failed at step 1, and null for fetchLogin, never a rejection', async () => {
  // The 5 s limit: no timer can end these requests first, so only readBounded's catch turns the failed read into a result.
  const m = markers();
  const tokenBody = failingBody(JSON.stringify(tokenAnswer(m).json));
  const stepOneBody = failingBody(JSON.stringify(codeAnswer(m).json));
  const loginBody = failingBody(JSON.stringify({ login: 'someone' }));
  const outcomes = [await settle(token(pollParams(m), limits, tokenBody.fetcher)), await settle(deviceCode(true, limits, stepOneBody.fetcher)),
    await settle(fetchLogin(loginBody.fetcher, `Bearer ${m.access}`, live(), limits))];
  expect(outcomes).toEqual([{ value: { kind: 'transient' } }, { value: { kind: 'failed' } }, { value: null }]);
  expect([tokenBody, stepOneBody, loginBody].map(({ state }) => state.pulls)).toEqual([2, 2, 2]);
});

test('an owner abort once the loopback headers are in, with the body stalled, is transient, failed at step 1, and null for fetchLogin', async () => {
  // The real fetch path under the 5 s limit. The wrapper records that the headers arrived before it aborts, so a slow round trip
  // that timed out first (row 1) fails this test instead of passing it.
  const m = markers();
  fake.answer(ROUTES.token, { ...tokenAnswer(m), hang: 'body' });
  fake.answer(ROUTES.device, { ...codeAnswer(m), hang: 'body' });
  fake.answer(ROUTES.user, { json: { login: 'someone' }, hang: 'body' });
  const abortAfterHeaders = () => {
    const owner = new AbortController(); const state = { headers: false };
    const wrapped: Fetcher = async (url, init) => { const response = await fetcher(url, init); state.headers = true; owner.abort(); return response; };
    return { owner, state, fetcher: wrapped };
  };
  const [poll, stepOne, login] = [abortAfterHeaders(), abortAfterHeaders(), abortAfterHeaders()];
  const outcomes = [await settle(requestToken(poll.fetcher, pollParams(m), poll.owner.signal, limits, now)),
    await settle(requestDeviceCode(stepOne.fetcher, CLIENT, true, stepOne.owner.signal, limits, now)),
    await settle(fetchLogin(login.fetcher, `Bearer ${m.access}`, login.owner.signal, limits))];
  expect([poll, stepOne, login].map(({ state }) => state.headers)).toEqual([true, true, true]);
  expect(outcomes).toEqual([{ value: { kind: 'transient' } }, { value: { kind: 'failed' } }, { value: null }]);
});

test('a short delay inside the timeout still answers', async () => {
  const m = markers(); fake.answer(ROUTES.token, { ...tokenAnswer(m), delayMs: 20 });
  expect(await token(pollParams(m), { ...limits, requestTimeoutMs: 2_000 })).toMatchObject({ kind: 'tokens' });
});

// ---- Parsing by media type (5.3 row 4, DC-9). ----

test.each([
  ['JSON', (m: Markers) => tokenAnswer(m)],
  ['JSON with ; charset=utf-8', (m: Markers) => ({ ...tokenAnswer(m), headers: { 'Content-Type': 'application/json; charset=utf-8' } })],
  ['JSON in another case, with parameters', (m: Markers) => ({ ...tokenAnswer(m), headers: { 'Content-Type': 'Application/JSON ; Charset=UTF-8' } })],
  ['a form body', (m: Markers) => ({ form: { access_token: m.access, expires_in: '28800', refresh_token: m.refresh, refresh_token_expires_in: '15897600', scope: '', token_type: 'bearer' } })],
  ['a form body; charset=utf-8', (m: Markers) => ({ form: { access_token: m.access, expires_in: '28800', refresh_token: m.refresh, refresh_token_expires_in: '15897600' }, headers: { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' } })],
  ['text/plain read as a form', (m: Markers) => ({ text: `access_token=${m.access}&expires_in=28800&refresh_token=${m.refresh}&refresh_token_expires_in=15897600`, headers: { 'content-type': 'text/plain; charset=utf-8' } })],
] as const)('a token answer as %s is parsed', async (_name, answer) => {
  const m = markers(); fake.answer(ROUTES.token, answer(m));
  expect(await token(pollParams(m))).toEqual({ kind: 'tokens', receivedAt: NOW, tokens: { access: m.access, refresh: m.refresh, accessExpiresInS: 28_800, refreshExpiresInS: 15_897_600 } });
});

test.each([
  ['no content type', (m: Markers) => ({ text: JSON.stringify(tokenAnswer(m).json) })],
  ['an unknown content type', (m: Markers) => ({ text: JSON.stringify(tokenAnswer(m).json), headers: { 'content-type': 'application/xml' } })],
  ['JSON-like media types that are not JSON', (m: Markers) => ({ text: JSON.stringify(tokenAnswer(m).json), headers: { 'content-type': 'application/jsonx' } })],
  ['an HTML page at 400', () => ({ status: 400, text: '<html><body>Bad request</body></html>', headers: { 'content-type': 'text/html' } })],
  ['invalid UTF-8', (m: Markers) => ({ text: Buffer.concat([Buffer.from(`{"access_token":"${m.access}","x":"`), Buffer.from([0xff, 0xfe]), Buffer.from('"}')]), headers: { 'content-type': 'application/json' } })],
  ['a JSON array', () => ({ json: [] })],
  ['a JSON null', () => ({ json: null })],
  ['a JSON string', () => ({ json: 'x' })],
  ['a JSON number', () => ({ json: 7 })],
  ['JSON true', () => ({ json: true })],
  ['a nested object', (m: Markers) => ({ json: { access_token: m.access, nested: { a: 1 } } })],
  ['a null member', (m: Markers) => ({ json: { access_token: m.access, scope: null } })],
  ['a boolean member', (m: Markers) => ({ json: { access_token: m.access, ok: true } })],
  ['an empty JSON body', () => ({ text: '', headers: { 'content-type': 'application/json' } })],
  ['a 500 with JSON and no error', () => ({ status: 500, json: { message: 'Server Error' } })],
  ['a 502 HTML page', () => ({ status: 502, text: '<html>bad gateway</html>', headers: { 'content-type': 'text/html' } })],
] as const)('%s is transient on a token request, and failed at step 1', async (_name, answer) => {
  const m = markers();
  fake.answer(ROUTES.token, answer(m)); fake.answer(ROUTES.device, answer(m));
  expect(await token(pollParams(m))).toEqual({ kind: 'transient' });
  expect(await deviceCode()).toEqual({ kind: 'failed' });
});

test('a body over 64 KiB is refused by its declared length and while streaming, and a body of exactly 64 KiB is read', async () => {
  const m = markers();
  const declared = watchedBody(JSON.stringify(tokenAnswer(m).json));
  const lying: Fetcher = async () => new Response(declared.body, { status: 200, headers: { 'content-type': 'application/json', 'content-length': String(65_537) } });
  expect(await token(pollParams(m), limits, lying)).toEqual({ kind: 'transient' });
  expect(declared.state.cancelled).toBe(true);
  const stepOne = watchedBody(JSON.stringify(codeAnswer(m).json));
  expect(await deviceCode(true, limits, async () => new Response(stepOne.body, { status: 200, headers: { 'content-type': 'application/json', 'content-length': '70000' } }))).toEqual({ kind: 'failed' });
  const big = (size: number) => { const base = JSON.stringify({ ...tokenAnswer(m).json as object, pad: '' }); return base.replace('"pad":""', `"pad":"${'p'.repeat(size - base.length)}"`); };
  expect(big(65_536).length).toBe(65_536);
  const exact: Fetcher = async () => {   // a declared length of exactly 64 KiB is not over the bound
    const response = new Response(big(65_536), { status: 200, headers: { 'content-type': 'application/json', 'content-length': '65536' } });
    expect(response.headers.get('content-length')).toBe('65536');
    return response;
  };
  expect(await token(pollParams(m), limits, exact)).toMatchObject({ kind: 'tokens' });
  fake.answer(ROUTES.token, { text: big(65_537), chunked: true, headers: { 'content-type': 'application/json' } }, { text: big(65_536), chunked: true, headers: { 'content-type': 'application/json' } });
  fake.answer(ROUTES.device, { text: big(70_000), chunked: true, headers: { 'content-type': 'application/json' } });
  expect(await token(pollParams(m))).toEqual({ kind: 'transient' });
  expect(await token(pollParams(m))).toMatchObject({ kind: 'tokens' });
  expect(await deviceCode()).toEqual({ kind: 'failed' });
});

test('a streamed body over 64 KiB with no content-length is cancelled when the streaming bound trips (5.1: always cancelled or released)', async () => {
  const m = markers();
  const streamed = (body: ReadableStream<Uint8Array>): Fetcher => async () => {
    const response = new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    expect(response.headers.get('content-length')).toBeNull();
    return response;
  };
  const tokenBody = watchedStream(200_000); const stepOneBody = watchedStream(200_000);
  expect(await token(pollParams(m), limits, streamed(tokenBody.body))).toEqual({ kind: 'transient' });
  expect(await deviceCode(true, limits, streamed(stepOneBody.body))).toEqual({ kind: 'failed' });
  for (const { state } of [tokenBody, stepOneBody]) {
    expect(state.pulled).toBeLessThan(200_000);   // refused mid-stream, so the cancel below reaches an open stream
    expect(state.cancelled).toBe(true);
  }
});

test('a parse failure leaves no cause and no piece of the token: a form body served as JSON, and a JSON body with a bare token (DC-9)', async () => {
  const m = markers();
  // Positive control: the walker finds a cause, and a marker piece inside a nested Error's message, as V8's SyntaxError would quote it.
  const planted = { error: new Error('wire', { cause: new SyntaxError(`Unexpected token 'g', "${m.access.slice(0, 10)}"... is not valid JSON`) }) };
  expect(leaks(planted, [m.access])).toEqual(expect.arrayContaining(['a cause', 'a marker piece at message']));
  const answers = [
    { text: `access_token=${m.access}&expires_in=28800&refresh_token=${m.refresh}&refresh_token_expires_in=15897600`, headers: { 'content-type': 'application/json' } },
    { text: `{"access_token":${m.access},"refresh_token":${m.refresh}}`, headers: { 'content-type': 'application/json' } },
    { text: `${m.refresh}&access_token=${m.access}`, headers: { 'content-type': 'application/json; charset=utf-8' } },
  ];
  for (const [index, answer] of answers.entries()) {
    fake.answer(ROUTES.token, answer);
    const outcome = await settle(token(refreshParams(m)));
    expect(outcome, `answer ${index}`).toEqual({ value: { kind: 'transient' } });
    expect(leaks(outcome, [m.access, m.refresh])).toEqual([]);
  }
});

// ---- One classifier (5.3): `error` at any status (R2-5), rate limits first (R2-4), unusable by status (GS-2). ----

const CODES = ['authorization_pending', 'slow_down', 'expired_token', 'token_expired', 'incorrect_device_code', 'bad_verification_code', 'access_denied',
  'device_flow_disabled', 'incorrect_client_credentials', 'unsupported_grant_type', 'unverified_user_email', 'bad_refresh_token', 'a_code_not_yet_named'];

test.each(CODES)('the error %s is classified the same at 200, 400, 401, 403, 500 and 503, on a token request and at step 1', async code => {
  for (const status of [200, 400, 401, 403, 500, 503]) {
    fake.answer(ROUTES.token, errorAnswer(code, status)); fake.answer(ROUTES.device, errorAnswer(code, status));
    expect(await token(pollParams(markers())), `${code} at ${status}`).toEqual({ kind: 'error', code, intervalS: null });
    expect(await deviceCode(), `${code} at ${status}, step 1`).toEqual({ kind: 'error', code });
  }
});

test('an error code is bounded to [a-z_]{1,64}, otherwise unknown; a non-string error is no error', async () => {
  for (const [sent, read] of [['Not-A-Code', 'unknown'], ['x'.repeat(65), 'unknown'], ['x'.repeat(64), 'x'.repeat(64)], ['code1', 'unknown'], ['', 'unknown'], ['bad refresh', 'unknown']]) {
    fake.answer(ROUTES.token, errorAnswer(sent!, 400)); fake.answer(ROUTES.device, errorAnswer(sent!, 200));
    expect(await token(pollParams(markers())), sent).toEqual({ kind: 'error', code: read, intervalS: null });
    expect(await deviceCode(), sent).toEqual({ kind: 'error', code: read });
  }
  fake.answer(ROUTES.token, { status: 400, json: { error: 7 } }, { status: 200, json: { error: 7 } });
  expect(await token(pollParams(markers()))).toEqual({ kind: 'unusable', status: 400 });
  expect(await token(pollParams(markers()))).toEqual({ kind: 'unusable', status: 200 });
});

test('an error answer carries an integer interval when it has one: a JSON number or a form string, nothing else', async () => {
  const cases: Array<[FakeReply, number | null]> = [
    [errorAnswer('slow_down', 200, { interval: 10 }), 10],
    [{ form: { error: 'slow_down', interval: '15' } }, 15],
    [errorAnswer('slow_down', 200, { interval: '10' }), null],
    [errorAnswer('slow_down', 200, { interval: 1.5 }), null],
    [{ form: { error: 'slow_down', interval: 'ten' } }, null],
    [errorAnswer('slow_down'), null],
  ];
  for (const [answer, intervalS] of cases) {
    fake.answer(ROUTES.token, answer);
    expect(await token(pollParams(markers()))).toEqual({ kind: 'error', code: 'slow_down', intervalS });
  }
});

test('dropped fields: error_description and error_uri appear in no result', async () => {
  const description = `description-${markers().device}`; const uri = `https://example.invalid/${markers().device}`;
  fake.answer(ROUTES.token, errorAnswer('access_denied', 400, { error_description: description, error_uri: uri }));
  fake.answer(ROUTES.device, errorAnswer('device_flow_disabled', 200, { error_description: description, error_uri: uri }));
  const results = [await settle(token(pollParams(markers()))), await settle(deviceCode())];
  expect(results).toEqual([{ value: { kind: 'error', code: 'access_denied', intervalS: null } }, { value: { kind: 'error', code: 'device_flow_disabled' } }]);
  expect(leaks(results, [description, uri])).toEqual([]);
});

const limited = (status: number, headers: Record<string, string> = {}) => new Response(null, { status, headers });
const resetIn = (seconds: number) => String(Math.floor(NOW / 1000) + seconds);

test.each([
  ['a 429', limited(429), 60_000],
  ['a 403 with remaining 0 and no reset', limited(403, { 'x-ratelimit-remaining': '0' }), 60_000],
  ['a 403 with remaining 0 and a reset 2 minutes away', limited(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(120) }), 120_000],
  ['a 403 with remaining 0 and a reset 30 s away (the floor)', limited(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(30) }), 60_000],
  ['a 403 with remaining 0 and a reset already past', limited(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(-30) }), 60_000],
  ['a 403 with remaining 0 and a reset more than an hour away', limited(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(3_601) }), 60_000],
  ['a 403 with remaining 0 and a reset exactly an hour away (the floor: less than an hour is required)', limited(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(3_600) }), 60_000],
  ['a 429 with a reset but remaining not 0 (the floor: the reset is read only at remaining 0)', limited(429, { 'x-ratelimit-remaining': '5', 'x-ratelimit-reset': resetIn(1_800) }), 60_000],
  ['a 403 with retry-after', limited(403, { 'retry-after': '30' }), 30_000],
  ['a 429 with retry-after', limited(429, { 'retry-after': '30' }), 30_000],
  ['retry-after before the reset', limited(429, { 'retry-after': '10', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(120) }), 10_000],
  ['retry-after 3600', limited(429, { 'retry-after': '3600' }), 3_600_000],
  ['retry-after 0, which still waits 1 s (DC-12)', limited(429, { 'retry-after': '0' }), 1_000],
  ['a 403 with retry-after 0 (DC-12)', limited(403, { 'retry-after': '0' }), 1_000],
  ['an invalid retry-after: a word', limited(429, { 'retry-after': 'soon' }), 60_000],
  ['an invalid retry-after: negative', limited(403, { 'retry-after': '-1' }), 60_000],
  ['an invalid retry-after: a fraction', limited(429, { 'retry-after': '1.5' }), 60_000],
  ['an invalid retry-after: over an hour', limited(429, { 'retry-after': '3601' }), 60_000],
  ['an invalid retry-after: an HTTP date', limited(429, { 'retry-after': 'Wed, 21 Oct 2026 07:28:00 GMT' }), 60_000],
  ['an invalid retry-after with a valid reset', limited(403, { 'retry-after': 'x', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(90) }), 90_000],
  ['a 403 with X-Accepted-GitHub-Permissions and rate-limit headers', limited(403, { 'x-accepted-github-permissions': 'contents=read', 'x-ratelimit-remaining': '0' }), 60_000],
] as const)('rateLimitWait: %s', (_name, response, waitMs) => {
  expect(rateLimitWait(response, NOW, limits)).toBe(waitMs);
});

test('rateLimitWait: not a rate limit without its condition, and clamped to the ceiling', () => {
  for (const response of [limited(403), limited(403, { 'x-ratelimit-remaining': '1' }), limited(403, { 'x-accepted-github-permissions': 'contents=read' }), limited(401, { 'retry-after': '5' }), limited(200, { 'retry-after': '5' }), limited(500, { 'x-ratelimit-remaining': '0' }), limited(400)]) {
    expect(rateLimitWait(response, NOW, limits)).toBeNull();
  }
  expect(rateLimitWait(limited(429, { 'retry-after': '3600' }), NOW, { ...limits, rateLimitCeilingMs: 10_000 })).toBe(10_000);
  expect(rateLimitWait(limited(429), NOW, { ...limits, rateLimitCeilingMs: 10_000 })).toBe(10_000);
});

test('rate limits come first: a rate-limit 403 whose body says bad_refresh_token is rate-limited, and the body is cancelled unread', async () => {
  const m = markers();
  fake.answer(ROUTES.token, { ...errorAnswer('bad_refresh_token', 403), headers: { 'x-ratelimit-remaining': '0' } }, { ...errorAnswer('slow_down', 429), headers: { 'retry-after': '0' } });
  fake.answer(ROUTES.device, { ...errorAnswer('device_flow_disabled', 403), headers: { 'retry-after': '7' } });
  expect(await token(refreshParams(m))).toEqual({ kind: 'rate-limited', waitMs: 60_000 });
  expect(await token(pollParams(m))).toEqual({ kind: 'rate-limited', waitMs: 1_000 });
  expect(await deviceCode()).toEqual({ kind: 'rate-limited', waitMs: 7_000 });
  const unread = watchedBody(JSON.stringify(errorAnswer('bad_refresh_token').json));
  expect(await token(refreshParams(m), limits, async () => new Response(unread.body, { status: 429, headers: { 'content-type': 'application/json' } }))).toEqual({ kind: 'rate-limited', waitMs: 60_000 });
  expect(unread.state.cancelled).toBe(true);
});

test('through the wire, x-ratelimit-reset is measured from the injected clock, not the wall clock (U5 runs far from real time)', async () => {
  const limit = { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': resetIn(120) }, json: { message: 'API rate limit exceeded' } };
  fake.answer(ROUTES.token, limit); fake.answer(ROUTES.device, limit);
  expect(await token(pollParams(markers()))).toEqual({ kind: 'rate-limited', waitMs: 120_000 });
  expect(await deviceCode()).toEqual({ kind: 'rate-limited', waitMs: 120_000 });
});

// ---- Token shape (5.5, F-4, E-01 l.173-178, E-10). ----

test.each([
  ['wrong prefix', (p: string) => (p === 'ghu_' ? 'ghr_' : 'ghu_') + 'a'.repeat(30)],
  ['the prefix alone', (p: string) => p],
  ['a space', (p: string) => `${p}abc def`],
  ['a tab', (p: string) => `${p}abc\tdef`],
  ['a CR', (p: string) => `${p}abc\rdef`],
  ['an LF', (p: string) => `${p}abc\ndef`],
  ['a NUL', (p: string) => `${p}abc\u0000def`],
  ['DEL (\\x7F)', (p: string) => `${p}abc\u007Fdef`],
  ['\\x85', (p: string) => `${p}abc\u0085def`],
  ['a no-break space (\\xA0)', (p: string) => `${p}abc\u00A0def`],
  ['a character above \\xFF', (p: string) => `${p}abc\u0100def`],
  ['an emoji', (p: string) => `${p}abc\u{1F600}def`],
  ['more than 16,384 characters', (p: string) => p + 'a'.repeat(16_385 - p.length)],
] as const)('headerSafeToken refuses %s', (_name, make) => {
  for (const prefix of ['ghu_', 'ghr_'] as const) expect(headerSafeToken(make(prefix), prefix)).toBe(false);
});

test('headerSafeToken accepts printable ASCII and \\xA1-\\xFF up to 16,384 characters, and refuses what is not a string', () => {
  for (const prefix of ['ghu_', 'ghr_'] as const) {
    expect(headerSafeToken(prefix + 'a', prefix)).toBe(true);
    expect(headerSafeToken(prefix + '!~\u00A1\u00FF' + 'Zz09', prefix)).toBe(true);
    expect(headerSafeToken(prefix + 'a'.repeat(16_384 - prefix.length), prefix)).toBe(true);
    for (const value of [undefined, null, 42, {}, ['x']]) expect(headerSafeToken(value, prefix)).toBe(false);
  }
});

test('a token answer without expires_in is non-expiring: no expiry and no refresh token, any refresh_token ignored', async () => {
  const m = markers();
  fake.answer(ROUTES.token, tokenAnswer(m, { expires_in: undefined, refresh_token_expires_in: undefined }), tokenAnswer(m, { expires_in: undefined, refresh_token: undefined, refresh_token_expires_in: undefined }));
  const expected = { kind: 'tokens', receivedAt: NOW, tokens: { access: m.access, refresh: null, accessExpiresInS: null, refreshExpiresInS: null } };
  expect(await token(pollParams(m))).toEqual(expected);
  expect(await token(pollParams(m))).toEqual(expected);
});

test.each([
  ['a refresh_token without refresh_token_expires_in', (m: Markers) => tokenAnswer(m, { refresh_token_expires_in: undefined })],
  ['expires_in without a refresh_token', (m: Markers) => tokenAnswer(m, { refresh_token: undefined })],
  ['expires_in 0', (m: Markers) => tokenAnswer(m, { expires_in: 0 })],
  ['expires_in as a fraction', (m: Markers) => tokenAnswer(m, { expires_in: 1.5 })],
  ['expires_in as a JSON string', (m: Markers) => tokenAnswer(m, { expires_in: '28800' })],
  ['expires_in negative', (m: Markers) => tokenAnswer(m, { expires_in: -1 })],
  ['refresh_token_expires_in 0', (m: Markers) => tokenAnswer(m, { refresh_token_expires_in: 0 })],
  ['a form expires_in with a sign', (m: Markers) => ({ form: { access_token: m.access, expires_in: '+28800', refresh_token: m.refresh, refresh_token_expires_in: '15897600' } })],
  ['a form expires_in of 11 digits', (m: Markers) => ({ form: { access_token: m.access, expires_in: '12345678901', refresh_token: m.refresh, refresh_token_expires_in: '15897600' } })],
  ['a JSON expires_in of 11 digits, the twin of the form bound', (m: Markers) => tokenAnswer(m, { expires_in: 10_000_000_000 })],
  ['a JSON refresh_token_expires_in of 11 digits', (m: Markers) => tokenAnswer(m, { refresh_token_expires_in: 10_000_000_000 })],
  ['an access token with the refresh prefix', (m: Markers) => tokenAnswer({ access: m.refresh, refresh: m.refresh })],
  ['an access token with a space', (m: Markers) => tokenAnswer({ access: `${m.access} x`, refresh: m.refresh })],
  ['an access token that is a number', (m: Markers) => tokenAnswer(m, { access_token: 7 })],
  ['an empty access token', (m: Markers) => tokenAnswer(m, { access_token: '' })],
  ['a refresh token with the access prefix', (m: Markers) => tokenAnswer({ access: m.access, refresh: m.access })],
] as const)('%s is malformed', async (_name, answer) => {
  const m = markers(); fake.answer(ROUTES.token, answer(m));
  expect(await token(refreshParams(m))).toEqual({ kind: 'malformed' });
});

test('an expiry of 10 digits is read in JSON as in a form body: the bound the two share keeps every expiry a valid date-time (5.5)', async () => {
  const m = markers(); const top = 9_999_999_999;
  fake.answer(ROUTES.token, tokenAnswer(m, { expires_in: top, refresh_token_expires_in: top }),
    { form: { access_token: m.access, expires_in: String(top), refresh_token: m.refresh, refresh_token_expires_in: String(top) } });
  const expected = { kind: 'tokens', receivedAt: NOW, tokens: { access: m.access, refresh: m.refresh, accessExpiresInS: top, refreshExpiresInS: top } };
  expect(await token(refreshParams(m))).toEqual(expected);
  expect(await token(refreshParams(m))).toEqual(expected);
  // Why JSON has the form's bound: 4.2 stores expiries as DateTimeSchema. Unbounded, a JSON expiry could be any safe integer:
  // 1e12 s lands past year 9999 (+033715-...), which the schema refuses, and 2^53 - 1 s makes toISOString throw.
  expect(DateTimeSchema.safeParse(new Date(NOW + top * 1_000).toISOString()).success).toBe(true);
  expect(DateTimeSchema.safeParse(new Date(NOW + 1e12 * 1_000).toISOString()).success).toBe(false);
  expect(() => new Date(NOW + Number.MAX_SAFE_INTEGER * 1_000).toISOString()).toThrow(RangeError);
});

test('an answer without access_token is unusable with its status: a 2xx, a 401 or 400 with a JSON message, a 404 (GS-2)', async () => {
  for (const [status, json] of [[200, { scope: '' }], [201, {}], [401, { message: 'Bad credentials' }], [400, { message: 'Problems parsing JSON' }], [404, { message: 'Not Found' }]] as const) {
    fake.answer(ROUTES.token, { status, json });
    expect(await token(refreshParams(markers())), String(status)).toEqual({ kind: 'unusable', status });
  }
});

test('a 3xx is never followed: unusable with its status for a token request, failed at step 1, and the Location receives nothing', async () => {
  const location = `${fake.origin}/github.com/login/elsewhere`;
  fake.answer(ROUTES.token, { status: 302, headers: { location }, json: { access_token: 'x' } }, { status: 307, headers: { location } });
  fake.answer(ROUTES.device, { status: 301, headers: { location } });
  expect(await token(pollParams(markers()))).toEqual({ kind: 'unusable', status: 302 });
  expect(await token(pollParams(markers()))).toEqual({ kind: 'unusable', status: 307 });
  expect(await deviceCode()).toEqual({ kind: 'failed' });
  expect(fake.requests.map(request => request.path)).toEqual(['/login/oauth/access_token', '/login/oauth/access_token', '/login/device/code']);
});

test('a token result keeps only the four token fields and the receipt time from the injected clock', async () => {
  const m = markers(); fake.answer(ROUTES.token, tokenAnswer(m, { extra: 'kept-nowhere', scope: 'repo' }));
  const result = await requestToken(fetcher, refreshParams(m), live(), limits, () => 1_234);
  expect(result).toEqual({ kind: 'tokens', receivedAt: 1_234, tokens: { access: m.access, refresh: m.refresh, accessExpiresInS: 28_800, refreshExpiresInS: 15_897_600 } });
  expect(JSON.stringify(result)).not.toContain('kept-nowhere');
});

// ---- Step-1 shape (5.5, F-2). ----

test('a step-1 answer gives the code, the user code, the lifetime and the interval, which defaults to 5', async () => {
  const m = markers();
  fake.answer(ROUTES.device, codeAnswer(m, { interval: 7 }), codeAnswer(m, { interval: undefined }), codeAnswer(m, { interval: 300, expires_in: 1 }),
    { form: { device_code: m.device, user_code: m.userCode, verification_uri: DEVICE_PAGE_URL, expires_in: '900', interval: '5' } });
  expect(await deviceCode()).toEqual({ kind: 'code', deviceCode: m.device, userCode: m.userCode, expiresInS: 900, intervalS: 7 });
  expect(await deviceCode()).toEqual({ kind: 'code', deviceCode: m.device, userCode: m.userCode, expiresInS: 900, intervalS: 5 });
  expect(await deviceCode()).toEqual({ kind: 'code', deviceCode: m.device, userCode: m.userCode, expiresInS: 1, intervalS: 300 });
  expect(await deviceCode()).toEqual({ kind: 'code', deviceCode: m.device, userCode: m.userCode, expiresInS: 900, intervalS: 5 });
});

test.each([
  ['a trailing slash', 'https://github.com/login/device/'],
  ['http:', 'http://github.com/login/device'],
  ['another host', 'https://gist.github.com/login/device'],
  ['a look-alike host', 'https://github.com.evil.test/login/device'],
  ['a query', 'https://github.com/login/device?code=1'],
  ['a fragment', 'https://github.com/login/device#x'],
  ['a different case in the path', 'https://github.com/login/Device'],
  ['a different case in the host', 'https://GitHub.com/login/device'],
  ['an upper-case scheme', 'HTTPS://github.com/login/device'],
  ['a port', 'https://github.com:443/login/device'],
  ['absent', undefined],
] as const)('a verification_uri with %s fails closed', async (_name, uri) => {
  fake.answer(ROUTES.device, codeAnswer(markers(), { verification_uri: uri }));
  expect(await deviceCode()).toEqual({ kind: 'failed' });
});

test.each([
  ['a device_code with a space', { device_code: 'abc def' }],
  ['an empty device_code', { device_code: '' }],
  ['a device_code over 1,024 characters', { device_code: 'd'.repeat(1_025) }],
  ['a device_code with a non-ASCII character', { device_code: 'abc\u00E9' }],
  ['a numeric device_code', { device_code: 12345 }],
  ['an absent device_code', { device_code: undefined }],
  ['a user_code with a space', { user_code: 'ABCD EFGH' }],
  ['a user_code over 32 characters', { user_code: 'A'.repeat(33) }],
  ['a user_code with a leading hyphen', { user_code: '-ABCD' }],
  ['an absent user_code', { user_code: undefined }],
  ['expires_in 0', { expires_in: 0 }],
  ['an absent expires_in', { expires_in: undefined }],
  ['expires_in as a JSON string', { expires_in: '900' }],
  ['a JSON expires_in of 11 digits', { expires_in: 10_000_000_000 }],
  ['interval 0', { interval: 0 }],
  ['interval 301', { interval: 301 }],
  ['interval as a fraction', { interval: 2.5 }],
  ['interval as a JSON string', { interval: '5' }],
] as const)('a step-1 answer with %s fails', async (_name, fields) => {
  fake.answer(ROUTES.device, codeAnswer(markers(), fields));
  expect(await deviceCode()).toEqual({ kind: 'failed' });
});

test('a step-1 device_code of 1,024 printable characters and a 32-character user code are accepted (no length assumed, DO-12)', async () => {
  const m = markers(); const long = '!'.repeat(1_000) + 'x'.repeat(24); const userCode = 'A1B2-'.repeat(6) + 'C3';
  fake.answer(ROUTES.device, codeAnswer(m, { device_code: long, user_code: userCode }));
  expect(await deviceCode()).toEqual({ kind: 'code', deviceCode: long, userCode, expiresInS: 900, intervalS: 5 });
});

test('step-1 answers other than a code: 404 without error, 500, and a 2xx without its fields all fail', async () => {
  fake.answer(ROUTES.device, { status: 404, json: { message: 'Not Found' } }, { status: 500, json: {} }, { json: {} });
  for (let i = 0; i < 3; i++) expect(await deviceCode()).toEqual({ kind: 'failed' });
});

// ---- GET /user (3.5, F-4, GS-8). ----

test('fetchLogin keeps only the login, and sends the 5.1 options with the access token in Authorization only', async () => {
  const m = markers(); const login = `octo-${m.device.slice(0, 8)}`; const email = `mail-${markers().device}@example.invalid`; const name = `name-${markers().device}`;
  fake.register({ access: m.access });
  fake.answer(ROUTES.user, { json: { login, id: 1, email, name, bio: name, plan: { name: 'free' } }, headers: { 'content-type': 'application/json; charset=utf-8' } });
  const traced = spy(); const owner = new AbortController();
  const result = await settle(fetchLogin(traced.fetcher, `Bearer ${m.access}`, owner.signal, limits));
  expect(result).toEqual({ value: login });
  expect(leaks(result, [email, name])).toEqual([]);
  const [{ url, init }] = traced.calls as [{ url: string; init: RequestInit }];
  expect(url).toBe(USER_URL);
  expect(sorted(Object.keys(init))).toEqual(LOGIN_INIT_KEYS);
  expect(init).toMatchObject({ method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store' });
  expect(init.headers).toEqual({ Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': UA, Authorization: `Bearer ${m.access}` });
  expect(init.signal).toBeInstanceOf(AbortSignal); expect(init.signal!.aborted).toBe(false); owner.abort(); expect(init.signal!.aborted).toBe(true);
  const [seen] = fake.to(ROUTES.user);
  expect(seen).toMatchObject({ method: 'GET', host: 'api.github.com', path: '/user', queryKeys: [], bodyKeys: [], authorization: 'marker', authorizationMarker: 'access', carries: ['access'], clientSecret: false });
  expect(seen!.headers).toMatchObject({ accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': UA });
});

test('fetchLogin: a 302 gives null after exactly one fetch, and the Location receives nothing (GS-8)', async () => {
  const m = markers(); fake.register({ access: m.access });
  fake.answer(ROUTES.user, { status: 302, headers: { location: `${fake.origin}/api.github.com/redirected` }, json: { login: 'someone' } });
  fake.always('api.github.com/redirected', { json: { login: 'redirected' } });
  const traced = spy();
  expect(await fetchLogin(traced.fetcher, `Bearer ${m.access}`, live(), limits)).toBeNull();
  expect(traced.calls).toHaveLength(1);
  expect(fake.requests.map(request => request.path)).toEqual(['/user']);
});

test('fetchLogin: the body of a non-2xx answer, a 302 included, gives null and is cancelled unread (5.1)', async () => {
  for (const status of [302, 401, 403, 500]) {
    const unread = watchedBody(JSON.stringify({ login: 'someone' }));
    const answer: Fetcher = async () => new Response(unread.body, { status, headers: { 'content-type': 'application/json' } });
    expect(await fetchLogin(answer, `Bearer ${markers().access}`, live(), limits), String(status)).toBeNull();
    expect(unread.state.cancelled, String(status)).toBe(true);
  }
});

test.each([
  ['a 401', { status: 401, json: { message: 'Bad credentials' } }],
  ['a 403', { status: 403, json: { login: 'someone' } }],
  ['a 500', { status: 500, json: { login: 'someone' } }],
  ['a login that is not a GitHub login', { json: { login: '-not a login' } }],
  ['a login that is a number', { json: { login: 42 } }],
  ['no login', { json: { id: 1 } }],
  ['an array', { json: [{ login: 'someone' }] }],
  ['a JSON null', { json: null }],
  ['a JSON string, itself a valid login', { json: 'someone' }],
  ['a body that is not JSON', { text: 'login=someone', headers: { 'content-type': 'application/json' } }],
  ['a body over 64 KiB', { json: { login: 'someone', pad: 'p'.repeat(65_536) }, chunked: true }],
  ['a reset', { reset: true }],
] as const)('fetchLogin: %s gives null', async (_name, answer) => {
  // The 5 s limit, not `quick`: a timeout also gives null, so under a short limit a slow round trip would pass a row whose guard is gone.
  fake.answer(ROUTES.user, answer);
  expect(await settle(fetchLogin(fetcher, `Bearer ${markers().access}`, live(), limits))).toEqual({ value: null });
});

test('fetchLogin: a hang past the timeout gives null (the one fetchLogin case run under the short limit)', async () => {
  fake.answer(ROUTES.user, { hang: true });
  expect(await settle(fetchLogin(fetcher, `Bearer ${markers().access}`, live(), quick))).toEqual({ value: null });
});

test('fetchLogin: a fetcher that throws synchronously gives null', async () => {
  expect(await fetchLogin(() => { throw new TypeError('bad header'); }, 'Bearer x', live(), limits)).toBeNull();
});
