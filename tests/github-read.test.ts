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
