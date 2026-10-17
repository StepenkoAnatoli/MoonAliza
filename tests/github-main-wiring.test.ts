import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

// GitHub sign-in, U6: main wiring (docs/specification/github-sign-in.md 9, 10, 3.3; BREAKDOWN U6, T-8). src/main/index.ts is
// Electron's ready handler and has no harness, so the wiring is pinned from its source by whole lines, in the style of
// tests/ollama-locality.test.ts (infer()'s locality check). Line ends are normalised, so a CRLF checkout reads the same lines.
const source = readFileSync(new URL('../src/main/index.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** The text from `start` up to (not including) the next `end` after it. */
function span(start: string, end: string): string {
  const from = source.indexOf(start);
  expect(from, start).toBeGreaterThan(-1);
  const to = source.indexOf(end, from + 1);
  expect(to, end).toBeGreaterThan(from);
  return source.slice(from, to);
}
const lines = (text: string) => text.split('\n').map(line => line.trim());
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const count = (needle: string) => source.split(needle).length - 1;
const code = (line: string) => line !== '' && !line.startsWith('//');

// Regression pins (T-8): green on the code before the wiring and committed before it. Three unrelated source pins read these spans
// (tests/ollama-locality.test.ts:298-323, tests/anthropic-transport.test.ts:305-343, tests/provider-screen.test.ts:166-186), so
// the wiring adds nothing inside them. A deliberate later change to one of these spans updates its digest here, in the same commit,
// after running those three files.
test('T-8: nothing is added between async function infer( and async function readGitHub(', () => {
  const infer = span('async function infer(', 'async function readGitHub(');
  expect(infer.split('\n').length, 'lines in the span').toBe(24);
  expect(sha256(infer), 'the span is byte-for-byte as at 683e9cd').toBe('066589ce90065668d52e82035685402c62d985a0b601ad755b1fff624a437e57');
  expect(lines(infer).filter(line => /\bgithub(SignIn|Store)?\b/.test(line)), 'no sign-in name (github, githubSignIn, githubStore) in infer()').toEqual([]);
});

test('T-8: readGitHub() is unchanged (spec 9: `:110-123` is not changed)', () => {
  const read = span('async function readGitHub(', '// Research review (Task 5)');
  expect(sha256(read), 'readGitHub() is byte-for-byte as at 683e9cd').toBe('d605f321038e9dfbd05910f0f3ba8a51e2f86dbd751eb14f829258027b4188d1');
  expect(lines(read)).toContain('const result = await capability.github.read(input, context.repositories, capability.stop.signal);');
});

test("T-8: nothing is added inside case 'profile.test', up to the next case", () => {
  expect(sha256(span("case 'profile.test': {", "case '")), 'the case is byte-for-byte as at 683e9cd').toBe('b076a6b3cb8be557b2fd22393de508505c1f034bd7ff67972c45c76951c6bb5e');
});

test("the review run's reader (`:293`) stays signed out: a bare new GitHubReader(), no credential, no redact", () => {
  // Pre-mortem 3: the review reader must not get the credential. A review job reads no GitHub, and its run is admitted here, not
  // through policyRoute's admit, so only the admit line below may carry the sign-in.
  const review = lines(span("case 'research.review.start': {", "case '"));
  expect(review).toContain("if (!active.has(run.id) && ['queued', 'running'].includes(run.status)) active.set(run.id, { run, stop: new AbortController(), github: new GitHubReader() });");
  expect(review.filter(line => line.includes('GitHubReader('))).toHaveLength(1);
});

test('external.open is unchanged (spec 3.3: not used and not changed by the sign-in)', () => {
  expect(lines(source)).toContain("case 'external.open': await shell.openExternal(request.params.url); return { opened: true };");
});

// The wiring (spec 9). New behaviour: each of these is red on the code before the wiring.
test('module scope: let github: GitHubSignIn | undefined; sits beside collector', () => {
  const all = lines(source);
  expect(all[all.indexOf('let collector: CollectorSupervisor | undefined;') + 1]).toBe('let github: GitHubSignIn | undefined;');
});

test('the store and the service are built straight after the collector settings open, the service with fetcher: lateFetch', () => {
  // Pre-mortem 2: the service is built at startup, before an e2e patch of globalThis.fetch lands, so a captured fetch would let
  // the e2e reach the real github.com; lateFetch looks the global up per call (spec 10). The store opens before anything reads it.
  const all = lines(source).filter(code);
  const at = all.indexOf('await collectorSettings.open();');
  expect(at).toBeGreaterThan(-1);
  expect(all.slice(at + 1, at + 6)).toEqual([
    "const githubStore = new GitHubAccountStore(join(data, 'github', 'account.json'), vault, GITHUB_APP.clientId);",
    'await githubStore.open();',
    "const githubSignIn = new GitHubSignIn({ store: githubStore, vault, epoch: () => engine?.epoch ?? '',",
    'encryptionAvailable: () => safeStorage.isEncryptionAvailable(), fetcher: lateFetch });',
    'github = githubSignIn;',
  ]);
  expect(all).toContain("import { lateFetch } from './github-credential';");
  expect(count('new GitHubSignIn('), 'one service').toBe(1);
  expect(count('new GitHubAccountStore('), 'one store').toBe(1);
});

test('the reconcile set keeps the account refs, and githubStore.finishStartup() follows the collector settings', () => {
  const all = lines(source).filter(code);
  const reconcile = all.indexOf('await vault.reconcile(new Set([...references, ...collectorSettings.references(), ...githubStore.references()]));');
  expect(reconcile, 'the reconcile line, whole').toBeGreaterThan(-1);
  expect(count('vault.reconcile('), 'one reconcile').toBe(1);
  expect(all[reconcile + 1]).toBe('await collectorSettings.finishStartup();');
  expect(all[reconcile + 2]).toBe('await githubStore.finishStartup();');
});

test("the admit line gives a run's reader the credential and main's redaction; the review reader does not get them", () => {
  expect(lines(source)).toContain('admit: run => { active.set(run.id, { run, stop: new AbortController(), github: new GitHubReader(undefined, githubSignIn, text => vault.redact(text)) }); },');
  // The other reader is the review run's, pinned above as `new GitHubReader()`.
  expect(count('new GitHubReader('), 'two readers in main').toBe(2);
  expect(count('new GitHubReader()'), 'the review reader, bare').toBe(1);
});

test("handle(): the five github cases sit between case 'external.open' and default, in the contract's order", () => {
  const body = lines(span('async function handle(', 'window = new BrowserWindow(')).filter(code);
  const open = body.indexOf("case 'external.open': await shell.openExternal(request.params.url); return { opened: true };");
  expect(open).toBeGreaterThan(-1);
  expect(body.slice(open + 1, open + 7)).toEqual([
    "case 'github.account.read': return { account: githubSignIn.status() };",
    "case 'github.signIn.start': return { account: await githubSignIn.start() };",
    "case 'github.signIn.cancel': return { account: githubSignIn.cancel() };",
    "case 'github.signOut': return { account: await githubSignIn.signOut() };",
    "case 'github.open': await shell.openExternal(githubSignIn.openTarget(request.params.target)); return { opened: true };",
    "default: throw new Error('NOT_IMPLEMENTED');",
  ]);
  expect(body.filter(line => line.includes("case 'github.")), 'no other github case').toHaveLength(5);
});

test('shell.openExternal gets a URL from the renderer only through external.open; github.open passes only openTarget(...)', () => {
  // S-8: the renderer names a target, never a URL; main opens a constant (openTarget throws NOT_FOUND or NOT_IMPLEMENTED otherwise).
  const calls = lines(source).filter(line => line.includes('shell.openExternal('));
  expect(calls.map(line => line.match(/shell\.openExternal\(([^;]*)\);/)?.[1])).toEqual(['request.params.url', 'githubSignIn.openTarget(request.params.target)']);
});

test('before-quit: github?.close() starts first, before the abort loop and before any await, and the quit waits for it', () => {
  // Pre-mortem 4: close()'s synchronous part aborts a pending flow at once; awaiting anything first would let it poll on.
  const quit = lines(span("app.on('before-quit', event => {", '\n});')).filter(code);
  const closed = quit.indexOf('const githubClosed = github?.close().catch(() => {}) ?? Promise.resolve();');
  const abort = quit.indexOf('for (const item of active.values()) item.stop.abort();');
  const firstAwait = quit.findIndex(line => /\bawait\b/.test(line));
  expect(closed, 'the close line, whole').toBeGreaterThan(-1);
  expect(quit[closed - 1], 'straight after the quit is claimed').toBe('event.preventDefault(); quitting = true;');
  expect(abort).toBe(closed + 1);
  expect(firstAwait).toBeGreaterThan(abort);
  expect(quit.slice(abort + 1)).toEqual([
    'const currentEngine = engine;',
    'void Promise.all([(async () => {',
    'await collector?.close().catch(() => {});',
    'await review?.close().catch(() => {});',
    'await researchKit?.close().catch(() => {});',
    'await currentEngine.close();',
    '})(), githubClosed]).finally(() => app.quit());',
  ]);
  expect(count('github?.close()'), 'closed once').toBe(1);
});
