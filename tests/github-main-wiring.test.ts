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
