import { expect, test } from 'vitest';
import { GitHubReader } from '../src/main/github';
import { SIGNED_OUT, type GitHubCredential } from '../src/main/github-credential';
import { githubRepositories, parseGitHubInput } from '../src/shared/github';

const sha = 'a'.repeat(40);
const url = 'https://github.com/example/project';
const allowed = ['example/project'];
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test('lists a public repository and reads paged text at the same pinned commit without auth', async () => {
  const calls: string[] = [];
  const reader = new GitHubReader(async (target, init) => {
    calls.push(target); expect(init.redirect).toBe('manual'); expect(init.credentials).toBe('omit');
    expect(new Headers(init.headers).has('Authorization')).toBe(false);
    if (target.includes('/commits/')) return json({ sha });
    expect(new URL(target).searchParams.get('ref')).toBe(sha);
    if (target.includes('/contents/README.md')) return json({ type: 'file', path: 'README.md', size: 13, encoding: 'base64', content: Buffer.from('one\ntwo\nthree').toString('base64') });
    return json([{ type: 'file', name: 'README.md', path: 'README.md', size: 13 }]);
  });
  const signal = new AbortController().signal;
  expect(JSON.parse(await reader.read({ url }, allowed, signal))).toMatchObject({ kind: 'directory', commit: sha, entries: [{ path: 'README.md' }] });
  expect(JSON.parse(await reader.read({ url, path: 'README.md', startLine: 2, lineCount: 1 }, allowed, signal))).toMatchObject({ kind: 'file', commit: sha, text: 'two', startLine: 2, endLine: 2, totalLines: 3, truncated: true });
  expect(calls.filter(call => call.includes('/commits/'))).toHaveLength(1);
  expect(calls.every(call => new URL(call).hostname === 'api.github.com')).toBe(true);
});

test.each(['http://github.com/example/project', 'https://github.com.evil.test/example/project', 'https://token@github.com/example/project', 'https://github.com/example/project?token=secret', 'https://github.com/example/project/blob/main/%2e%2e/private', 'https://127.0.0.1/example/project'])('rejects unsafe URL %s before any request', async url => {
  let called = false; const reader = new GitHubReader(async () => { called = true; return json({}); });
  await expect(reader.read({ url }, allowed, new AbortController().signal)).rejects.toThrow(); expect(called).toBe(false);
});

test('repository scope is derived only from supplied text URLs and cannot be expanded by tool inputs', async () => {
  expect(githubRepositories(['Read [this](https://github.com/example/project).', 'https://github.com/other/repo/blob/main/a.ts'])).toEqual(['example/project', 'other/repo']);
  let called = false; const reader = new GitHubReader(async () => { called = true; return json({}); });
  await expect(reader.read({ url: 'https://github.com/other/repo' }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_SCOPE_REQUIRED'); expect(called).toBe(false);
});

test.each([[302, 'GITHUB_REDIRECT'], [404, 'GITHUB_NOT_FOUND'], [403, 'GITHUB_FORBIDDEN'], [429, 'GITHUB_RATE_LIMIT']])('HTTP %s is classified without echoing response content', async (status, code) => {
  const reader = new GitHubReader(async () => json({ message: 'sensitive server message' }, status as number));
  await expect(reader.read({ url }, allowed, new AbortController().signal)).rejects.toThrow(code as string);
});

test('rejects oversized response before decoding JSON', async () => {
  const reader = new GitHubReader(async () => new Response('x', { headers: { 'content-length': '3000000' } }));
  await expect(reader.read({ url }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_TOO_LARGE');
});

test.each([
  { type: 'symlink', target: '../elsewhere' },
  { type: 'file', submodule_git_url: 'https://example.test/private', size: 1 },
  { type: 'file', size: 9999999 },
  { type: 'file', size: 1, encoding: 'base64', content: 'AA==' },
])('refuses unsupported file payload without following content links', async body => {
  let calls = 0; const reader = new GitHubReader(async () => ++calls === 1 ? json({ sha }) : json({ path: 'file.txt', ...body }));
  await expect(reader.read({ url, path: 'file.txt' }, allowed, new AbortController().signal)).rejects.toThrow(); expect(calls).toBe(2);
});

test('Stop discards a late response even when transport ignores abort', async () => {
  const stop = new AbortController();
  const reader = new GitHubReader(async () => { stop.abort(); return json({ sha }); });
  await expect(reader.read({ url }, allowed, stop.signal)).rejects.toThrow('RUN_CANCELLED');
});

test('blob URL path and explicit slash-containing ref are kept separate from the API route', () => {
  expect(parseGitHubInput({ url: url + '/blob/main/src/app.ts' })).toMatchObject({ repository: 'example/project', ref: 'main', path: 'src/app.ts' });
  expect(parseGitHubInput({ url, ref: 'feature/new', path: 'src/app.ts' })).toMatchObject({ ref: 'feature/new', path: 'src/app.ts' });
});


test('stream size is bounded even without a Content-Length header', async () => {
  const reader = new GitHubReader(async () => new Response(new Uint8Array(2_097_153)));
  await expect(reader.read({ url }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_TOO_LARGE');
});

test('403 rate-limit exhaustion is distinguished from authentication refusal', async () => {
  const reader = new GitHubReader(async () => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }));
  await expect(reader.read({ url }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_RATE_LIMIT');
});

test('a response for another path is rejected and sensitive paths cause no request', async () => {
  let calls = 0; const reader = new GitHubReader(async () => ++calls === 1 ? json({ sha }) : json({ type: 'file', path: 'wrong.txt', size: 1, encoding: 'base64', content: 'YQ==' }));
  await expect(reader.read({ url, path: '.env' }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_PATH_EXCLUDED'); expect(calls).toBe(0);
  await expect(reader.read({ url, path: 'file.txt' }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_UNSUPPORTED_FILE');
});

// GitHub sign-in, U3 pins (docs/specification/github-sign-in.md 7.1, 7.2 and L-10; REQUIREMENTS F-13, F-14, T-5, DC-13),
// committed on the unchanged reader before the credential seam. Fixtures are built from E-15 shapes, not a capture.
// Two AbortSignals compare equal under toEqual, so the init pin compares everything but `signal` by deep equality, checks the
// exact key list, and checks `signal` by behaviour: Stop must abort it.
const TODAY_HEADERS = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'MoonAliza-public-repository-reader' };
const TODAY_INIT = { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', headers: TODAY_HEADERS };
const TODAY_KEYS = ['method', 'redirect', 'credentials', 'cache', 'signal', 'headers'];
const sentinel = () => `sentinel-${crypto.randomUUID()}`;
/** A body that records whether anything read it: with highWaterMark 0 the stream pulls only when a reader asks for bytes. */
function trackedResponse(text: string, status: number, headers: Record<string, string> = {}) {
  const bytes = new TextEncoder().encode(text); const state = { pulls: 0 }; let offset = 0;
  const body = new ReadableStream<Uint8Array>({ pull(controller) {
    state.pulls++; controller.enqueue(bytes.subarray(offset, offset + 16_384)); offset += 16_384; if (offset >= bytes.length) controller.close();
  } }, { highWaterMark: 0 });
  return { response: new Response(body, { status, headers }), state };
}
/** Every message and stack along an error's cause chain. */
function errorTexts(error: unknown): string[] {
  const texts: string[] = [];
  for (let current = error, depth = 0; current instanceof Error && depth < 10; current = current.cause, depth++) texts.push(current.message, current.stack ?? '');
  return texts;
}
async function rejection(promise: Promise<unknown>): Promise<Error> {
  try { await promise; } catch (error) { expect(error).toBeInstanceOf(Error); return error as Error; }
  throw new Error('expected a rejection');
}
function expectTodayInit(init: RequestInit) {
  const { signal, ...rest } = init;
  expect(rest).toStrictEqual(TODAY_INIT);
  expect(Object.keys(init)).toEqual(TODAY_KEYS);
  expect(Object.keys(init.headers as Record<string, string>)).toEqual(Object.keys(TODAY_HEADERS));
  expect(signal).toBeInstanceOf(AbortSignal);
}

test('U3 pin: signed out, every request carries today\'s init, with the same keys and a signal that Stop aborts', async () => {
  const inits: RequestInit[] = []; const targets: string[] = [];
  const reader = new GitHubReader(async (target, init) => {
    targets.push(target); inits.push(init);
    return target.includes('/commits/') ? json({ sha }) : json([{ type: 'file', name: 'README.md', path: 'README.md', size: 13 }]);
  });
  const stop = new AbortController();
  await reader.read({ url }, allowed, stop.signal);
  expect(targets.map(target => new URL(target).hostname)).toEqual(['api.github.com', 'api.github.com']);
  for (const init of inits) { expectTodayInit(init); expect(init.signal!.aborted).toBe(false); }
  stop.abort();
  for (const init of inits) expect(init.signal!.aborted).toBe(true);
});

test('U3 pin: Stop aborts the signal of a signed-out request while it is in flight', async () => {
  const stop = new AbortController(); const seen: boolean[] = [];
  const reader = new GitHubReader(async (_target, init) => {
    expectTodayInit(init); seen.push(init.signal!.aborted); stop.abort(); seen.push(init.signal!.aborted);
    return json({ sha });
  });
  await expect(reader.read({ url }, allowed, stop.signal)).rejects.toThrow('RUN_CANCELLED');
  expect(seen).toEqual([false, true]);
});

test.each([
  ['a 302 to another host', 302, { location: 'https://elsewhere.example/moved' }, 'GITHUB_REDIRECT'],
  ['a 404', 404, {}, 'GITHUB_NOT_FOUND'],
  ['a 401', 401, {}, 'GITHUB_FORBIDDEN'],
  ['a 403', 403, {}, 'GITHUB_FORBIDDEN'],
  ['a 403 naming permissions only', 403, { 'x-accepted-github-permissions': 'contents=read' }, 'GITHUB_FORBIDDEN'],
  ['a 429', 429, {}, 'GITHUB_RATE_LIMIT'],
  ['a 429 with retry-after', 429, { 'retry-after': '60' }, 'GITHUB_RATE_LIMIT'],
  ['a 403 with x-ratelimit-remaining 0', 403, { 'x-ratelimit-remaining': '0' }, 'GITHUB_RATE_LIMIT'],
  ['a 403 with retry-after', 403, { 'retry-after': '60' }, 'GITHUB_RATE_LIMIT'],
  ['a rate-limit 403 that also names permissions', 403, { 'x-ratelimit-remaining': '0', 'x-accepted-github-permissions': 'contents=read' }, 'GITHUB_RATE_LIMIT'],
  ['a 500', 500, {}, 'GITHUB_UNAVAILABLE'],
] as const)('U3 pin: signed out, %s gives its reason after one request, with no body read and no body text in the error', async (_name, status, headers, code) => {
  const marker = sentinel(); const targets: string[] = [];
  const { response, state } = trackedResponse(JSON.stringify({ message: `Resource not accessible by integration ${marker}` }), status, headers);
  const reader = new GitHubReader(async target => { targets.push(target); return response; });
  const error = await rejection(reader.read({ url }, allowed, new AbortController().signal));
  expect(error.message).toBe(code);
  expect(targets).toHaveLength(1); expect(new URL(targets[0]!).hostname).toBe('api.github.com');
  for (const text of errorTexts(error)) expect(text).not.toContain(marker);
  expect(state.pulls).toBe(0);
});

// GitHub sign-in, U3 signed-in reads (docs/specification/github-sign-in.md 7.1, 7.2, 3.4; REQUIREMENTS F-13, F-14, F-16, S-4,
// T-5). The credential is a fake of U5's send(): it signs with a marker built at run time and reports authenticated. Fixtures are
// built from E-01/E-02/E-15 shapes, not a capture.
const INTEGRATION = 'Resource not accessible by integration';
const tokenMarker = () => ['ghu', Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('hex')].join('_');
/** U5's send() as the reader sees it: one signed request, authenticated, and a count of calls. */
function signedIn(marker: string) {
  const calls = { send: 0 };
  const credential: GitHubCredential = { async send(request) { calls.send++; return { response: await request(`Bearer ${marker}`), authenticated: true }; } };
  return { credential, calls };
}
const readme = (target: string) => target.includes('/commits/') ? json({ sha })
  : target.includes('/contents/README.md') ? json({ type: 'file', path: 'README.md', size: 13, encoding: 'base64', content: Buffer.from('one\ntwo\nthree').toString('base64') })
  : json([{ type: 'file', name: 'README.md', path: 'README.md', size: 13 }]);
function expectSignedInit(init: RequestInit, marker: string) {
  const { signal, headers, ...rest } = init; const named = headers as Record<string, string>;
  const { Authorization, ...others } = named;
  expect({ ...rest, headers: others }).toStrictEqual(TODAY_INIT);
  expect(Object.keys(init)).toEqual(TODAY_KEYS);
  expect(Object.keys(named)).toEqual([...Object.keys(TODAY_HEADERS), 'Authorization']);
  expect(Authorization).toBe(`Bearer ${marker}`);
  expect(signal).toBeInstanceOf(AbortSignal);
}

test('signed in, every request is today\'s init plus Authorization only, to api.github.com only, with a signal Stop aborts', async () => {
  const marker = tokenMarker(); const { credential, calls } = signedIn(marker); const inits: RequestInit[] = []; const targets: string[] = [];
  const reader = new GitHubReader(async (target, init) => { targets.push(target); inits.push(init); return readme(target); }, credential);
  const stop = new AbortController();
  expect(JSON.parse(await reader.read({ url }, allowed, stop.signal))).toMatchObject({ kind: 'directory', commit: sha });
  expect(JSON.parse(await reader.read({ url, path: 'README.md' }, allowed, stop.signal))).toMatchObject({ kind: 'file', text: 'one\ntwo\nthree' });
  expect(calls.send).toBe(3); expect(targets.map(target => new URL(target).origin)).toEqual(Array(3).fill('https://api.github.com'));
  for (const init of inits) { expectSignedInit(init, marker); expect(init.signal!.aborted).toBe(false); }
  stop.abort();
  for (const init of inits) expect(init.signal!.aborted).toBe(true);
});

test('signed in, the request is dispatched synchronously inside send() and Stop aborts it in flight', async () => {
  const marker = tokenMarker(); const stop = new AbortController(); let dispatched = 0; const seen: boolean[] = [];
  const credential: GitHubCredential = { async send(request) {
    const pending = request(`Bearer ${marker}`); seen.push(dispatched === 1);
    return { response: await pending, authenticated: true };
  } };
  const reader = new GitHubReader(async (_target, init) => {
    dispatched++; expectSignedInit(init, marker); seen.push(init.signal!.aborted); stop.abort(); seen.push(init.signal!.aborted);
    return json({ sha });
  }, credential);
  await expect(reader.read({ url }, allowed, stop.signal)).rejects.toThrow('RUN_CANCELLED');
  expect(seen).toEqual([false, true, true]);
});

test('the default and SIGNED_OUT credentials send today\'s init, with no Authorization', async () => {
  const inits: RequestInit[] = [];
  for (const reader of [new GitHubReader(async (target, init) => { inits.push(init); return readme(target); }), new GitHubReader(async (target, init) => { inits.push(init); return readme(target); }, SIGNED_OUT)])
    await reader.read({ url }, allowed, new AbortController().signal);
  expect(inits).toHaveLength(4); for (const init of inits) expectTodayInit(init);
});

test('signed in, a 302 is GITHUB_REDIRECT after one request, and the Location host receives nothing', async () => {
  const marker = tokenMarker(); const { credential } = signedIn(marker); const targets: string[] = [];
  const reader = new GitHubReader(async target => { targets.push(target); return new Response(null, { status: 302, headers: { location: 'https://elsewhere.example/moved' } }); }, credential);
  await expect(reader.read({ url }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_REDIRECT');
  expect(targets).toHaveLength(1); expect(new URL(targets[0]!).hostname).toBe('api.github.com');
  expect(targets.some(target => new URL(target).hostname === 'elsewhere.example')).toBe(false);
});

const padded = (before: number, phrase: string, after = 0) => 'x'.repeat(before) + phrase + 'x'.repeat(after);
test.each<{ name: string; status: number; headers: Record<string, string>; body: string; code: string }>([
  { name: 'a 403 with x-ratelimit-remaining 0 and the integration body', status: 403, headers: { 'x-ratelimit-remaining': '0' }, body: INTEGRATION, code: 'GITHUB_RATE_LIMIT' },
  { name: 'a 403 with retry-after and the integration body', status: 403, headers: { 'retry-after': '60' }, body: INTEGRATION, code: 'GITHUB_RATE_LIMIT' },
  { name: 'a rate-limit 403 that also names permissions', status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-accepted-github-permissions': 'contents=read' }, body: INTEGRATION, code: 'GITHUB_RATE_LIMIT' },
  { name: 'a 429 with retry-after', status: 429, headers: { 'retry-after': '60' }, body: '', code: 'GITHUB_RATE_LIMIT' },
  { name: 'a 429', status: 429, headers: {}, body: INTEGRATION, code: 'GITHUB_RATE_LIMIT' },
  { name: 'a 403 with only the integration body', status: 403, headers: {}, body: INTEGRATION, code: 'GITHUB_PERMISSION_MISSING' },
  { name: 'a 403 with the integration phrase ending at 64 KiB', status: 403, headers: {}, body: padded(65_536 - INTEGRATION.length, INTEGRATION, 6_000), code: 'GITHUB_PERMISSION_MISSING' },
  { name: 'a 403 with neither', status: 403, headers: {}, body: '{"message":"Forbidden"}', code: 'GITHUB_FORBIDDEN_SIGNED_IN' },
  { name: 'a 403 naming permissions only', status: 403, headers: { 'x-accepted-github-permissions': 'contents=read' }, body: '{"message":"Forbidden"}', code: 'GITHUB_FORBIDDEN_SIGNED_IN' },
  { name: 'a 70 KiB 403 with the phrase after 64 KiB', status: 403, headers: {}, body: padded(65_536, INTEGRATION, 4_096), code: 'GITHUB_FORBIDDEN_SIGNED_IN' },
  { name: 'a 404', status: 404, headers: {}, body: INTEGRATION, code: 'GITHUB_NOT_FOUND_SIGNED_IN' },
  { name: 'an authenticated 401, which send() never returns (spec 7.2 step 6)', status: 401, headers: {}, body: INTEGRATION, code: 'GITHUB_UNAVAILABLE' },
  { name: 'a 500', status: 500, headers: {}, body: INTEGRATION, code: 'GITHUB_UNAVAILABLE' },
])('signed in, $name gives $code, with no body text in the error', async ({ status, headers, body, code }) => {
  const marker = sentinel(); const { credential } = signedIn(tokenMarker()); const targets: string[] = [];
  const { response, state } = trackedResponse(`${body} ${marker}`, status, headers);
  const reader = new GitHubReader(async target => { targets.push(target); return response; }, credential);
  const error = await rejection(reader.read({ url }, allowed, new AbortController().signal));
  expect(error.message).toBe(code); expect(targets).toHaveLength(1);
  for (const text of errorTexts(error)) expect(text).not.toContain(marker);
  // Only an authenticated 403 that is not a rate limit reads its body, at most 64 KiB, and releases it.
  expect(state.pulls).toBe(code === 'GITHUB_PERMISSION_MISSING' || code === 'GITHUB_FORBIDDEN_SIGNED_IN' ? Math.min(4, Math.ceil(new TextEncoder().encode(`${body} ${marker}`).length / 16_384)) : 0);
  expect(response.body!.locked).toBe(false);
});

test('signed in, Stop during the bounded 403 body read gives RUN_CANCELLED', async () => {
  const stop = new AbortController(); const { credential } = signedIn(tokenMarker());
  const body = new ReadableStream<Uint8Array>({ pull(controller) { stop.abort(); controller.enqueue(new TextEncoder().encode(INTEGRATION)); } }, { highWaterMark: 0 });
  const reader = new GitHubReader(async () => new Response(body, { status: 403 }), credential);
  await expect(reader.read({ url }, allowed, stop.signal)).rejects.toThrow('RUN_CANCELLED');
  expect(body.locked).toBe(false);
});

// U3-R1: a signed-in 403 whose body fails part-way, as a reset connection does, is still a refusal, and Stop still wins over the
// failed read. The error holds no body text and the body is released. Built from E-15 shapes, not a capture.
/** A 403 whose body sends `text` on its first pull (none when empty), then runs `before` and fails. */
function failingResponse(text: string, before: () => void) {
  let sent = !text;
  const body = new ReadableStream<Uint8Array>({ pull(controller) {
    if (!sent) { sent = true; controller.enqueue(new TextEncoder().encode(text)); return; }
    before(); controller.error(new Error('ECONNRESET'));
  } }, { highWaterMark: 0 });
  return new Response(body, { status: 403 });
}
test.each<{ name: string; text: string; stops: boolean; code: string }>([
  { name: 'Stop, then a reset', text: '{"message":"Forb', stops: true, code: 'RUN_CANCELLED' },
])('signed in, a 403 body that fails part-way ($name) gives $code, with no body text in the error and the body released', async ({ text, stops, code }) => {
  const marker = sentinel(); const stop = new AbortController(); const { credential } = signedIn(tokenMarker()); const targets: string[] = [];
  const response = failingResponse(text && `${text} ${marker}`, () => { if (stops) stop.abort(); });
  const reader = new GitHubReader(async target => { targets.push(target); return response; }, credential);
  const error = await rejection(reader.read({ url }, allowed, stop.signal));
  expect(error.message).toBe(code); expect(targets).toHaveLength(1);
  for (const line of errorTexts(error)) expect(line).not.toContain(marker);
  expect(response.body!.locked).toBe(false);
});

test.each(['GITHUB_RENEWAL_UNAVAILABLE', 'GITHUB_RATE_LIMIT', 'GITHUB_SIGN_IN_REQUIRED'])('no fallback: the credential\'s %s passes through and nothing is fetched', async code => {
  let fetched = 0;
  const reader = new GitHubReader(async () => { fetched++; return json({ sha }); }, { async send() { throw new Error(code); } });
  const error = await rejection(reader.read({ url }, allowed, new AbortController().signal));
  expect(error.message).toBe(code); expect(error.cause).toBeUndefined(); expect(fetched).toBe(0);
});

test('no fallback: after a signed request the credential refuses, and the read is never repeated without the token', async () => {
  const marker = tokenMarker(); const inits: RequestInit[] = [];
  const credential: GitHubCredential = { async send(request) {
    const response = await request(`Bearer ${marker}`); await response.body?.cancel(); throw new Error('GITHUB_SIGN_IN_REQUIRED');
  } };
  const reader = new GitHubReader(async (_target, init) => { inits.push(init); return new Response('{}', { status: 401 }); }, credential);
  await expect(reader.read({ url }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_SIGN_IN_REQUIRED');
  expect(inits).toHaveLength(1); expectSignedInit(inits[0]!, marker);
});

test('a credential failure that is not a reason becomes GITHUB_UNAVAILABLE, and Stop or the deadline map as today', async () => {
  const unavailable = new GitHubReader(async () => json({ sha }), { async send() { throw new Error('ENCRYPTION_UNAVAILABLE'); } });
  await expect(unavailable.read({ url }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_UNAVAILABLE');
  const stop = new AbortController();
  const stopped = new GitHubReader(async () => json({ sha }), { async send(_request, signal) {
    stop.abort(); expect(signal.aborted).toBe(true); throw new Error('GITHUB_RENEWAL_UNAVAILABLE');
  } });
  await expect(stopped.read({ url }, allowed, stop.signal)).rejects.toThrow('RUN_CANCELLED');
});

test('reruns with a credential: scope and sensitive paths refuse before send(), while an allowed read is signed', async () => {
  const marker = tokenMarker(); const { credential, calls } = signedIn(marker); const inits: RequestInit[] = [];
  const reader = new GitHubReader(async (target, init) => { inits.push(init); return readme(target); }, credential);
  await expect(reader.read({ url: 'https://github.com/other/repo' }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_SCOPE_REQUIRED');
  await expect(reader.read({ url, path: '.env' }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_PATH_EXCLUDED');
  for (const unsafe of ['http://github.com/example/project', 'https://token@github.com/example/project', 'https://github.com/example/project/blob/main/%2e%2e/private'])
    await expect(reader.read({ url: unsafe }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_INVALID_URL');
  expect(calls.send).toBe(0); expect(inits).toHaveLength(0);
  await reader.read({ url }, allowed, new AbortController().signal);
  expect(calls.send).toBe(2); expect(inits).toHaveLength(2); for (const init of inits) expectSignedInit(init, marker);
});

test.each([
  ['a declared length over the bound', () => new Response('x', { headers: { 'content-length': '3000000' } }), 'GITHUB_TOO_LARGE'],
  ['a stream over the bound', () => new Response(new Uint8Array(2_097_153)), 'GITHUB_TOO_LARGE'],
  ['a response for another path', () => json({ type: 'file', path: 'wrong.txt', size: 1, encoding: 'base64', content: 'YQ==' }), 'GITHUB_UNSUPPORTED_FILE'],
  ['an oversized file', () => json({ type: 'file', path: 'file.txt', size: 9999999 }), 'GITHUB_UNSUPPORTED_FILE'],
] as const)('reruns with a credential: %s is refused after a signed request', async (_name, answer, code) => {
  const marker = tokenMarker(); const { credential } = signedIn(marker); const inits: RequestInit[] = [];
  const reader = new GitHubReader(async (target, init) => { inits.push(init); return target.includes('/commits/') ? json({ sha }) : answer(); }, credential);
  await expect(reader.read({ url, path: 'file.txt' }, allowed, new AbortController().signal)).rejects.toThrow(code);
  expect(inits).toHaveLength(2); for (const init of inits) expectSignedInit(init, marker);
});

test('rerun with a credential: Stop discards a late signed response even when the transport ignores abort', async () => {
  const marker = tokenMarker(); const { credential } = signedIn(marker); const stop = new AbortController(); const inits: RequestInit[] = [];
  const reader = new GitHubReader(async (_target, init) => { inits.push(init); stop.abort(); return json({ sha }); }, credential);
  await expect(reader.read({ url }, allowed, stop.signal)).rejects.toThrow('RUN_CANCELLED');
  expect(inits).toHaveLength(1); expectSignedInit(inits[0]!, marker);
});

// GitHub sign-in, U3 X-3 (docs/specification/github-sign-in.md 7.3; REQUIREMENTS S-2): with `redact`, a file's decoded text is
// redacted before the 200-line and 16,000-character cuts, so a vault secret that straddles the cut never leaves as a prefix that
// main's final exact-value redaction (src/main/index.ts:122) cannot match.
const fileAnswer = (content: string) => async (target: string) => target.includes('/commits/') ? json({ sha })
  : json({ type: 'file', path: 'file.txt', size: Buffer.byteLength(content), encoding: 'base64', content: Buffer.from(content).toString('base64') });
const exactRedactor = (secret: string) => async (text: string) => text.split(secret).join('[redacted]');
const fragments = (value: string) => Array.from({ length: value.length - 7 }, (_, index) => value.slice(index, index + 8));

test('pre-redaction: a vault secret straddling the 16,000-character cut does not appear in part', async () => {
  const secret = tokenMarker(); const redact = exactRedactor(secret);
  const content = 'a'.repeat(16_000 - 20) + secret + 'b'.repeat(100);
  const reader = new GitHubReader(fileAnswer(content), signedIn(tokenMarker()).credential, redact);
  const output = await redact(await reader.read({ url, path: 'file.txt' }, allowed, new AbortController().signal));
  for (const fragment of fragments(secret)) expect(output).not.toContain(fragment);
  const result = JSON.parse(output) as { text: string; truncated: boolean; totalLines: number };
  expect(result.text).toBe('a'.repeat(16_000 - 20) + '[redacted]' + 'b'.repeat(10)); expect(result.truncated).toBe(true); expect(result.totalLines).toBe(1);
});

test('pre-redaction: a redaction failure inside the reader is GITHUB_UNAVAILABLE, and no text is returned', async () => {
  let redactions = 0;
  const reader = new GitHubReader(fileAnswer('plain text'), SIGNED_OUT, async () => { redactions++; throw new Error('REDACTION_UNAVAILABLE'); });
  await expect(reader.read({ url, path: 'file.txt' }, allowed, new AbortController().signal)).rejects.toThrow('GITHUB_UNAVAILABLE');
  expect(redactions).toBe(1);
});
