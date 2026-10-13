import { expect, test } from 'vitest';
import { GitHubReader } from '../src/main/github';
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
