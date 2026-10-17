import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { GitHubErrorCodeSchema } from '../src/shared/github';

// GitHub sign-in, U6 (docs/specification/github-sign-in.md 3.9 layer 4, "Tests the builders owe"; DC-7, F-16). A reason that is
// thrown in main but missing from GitHubErrorCodeSchema is collapsed to GITHUB_UNAVAILABLE by src/main/engine.ts and turned into a
// generic NETWORK_ERROR by githubFailure, so the model would never see the text written for it. G-19 (tests/github-text.test.ts)
// parses CREDENTIAL_ERRORS; this scan reads every throw site in src/main/github*.ts once U3 and U5 are integrated. Store errors are
// not GITHUB_ codes (ACCOUNT_STORE_FAILED), so there is no exception list. Removal proof: add a throw of an unknown GITHUB_ code.
const directory = new URL('../src/main/', import.meta.url);
const files = readdirSync(directory).filter(name => /^github.*\.ts$/.test(name)).sort();
const sources = files.map(name => ({ name, text: readFileSync(new URL(name, directory), 'utf8') }));
const parses = (code: string) => GitHubErrorCodeSchema.safeParse(code).success;

test('the scan reads every src/main/github*.ts file, the reader and the lifecycle service among them', () => {
  // A glob that silently matched nothing would make both scans below pass on no input.
  expect(files).toEqual(expect.arrayContaining(['github.ts', 'github-signin.ts', 'github-credential.ts', 'github-oauth.ts', 'github-account-store.ts', 'github-app.ts']));
});

test("every throw new Error('GITHUB_…') literal in src/main/github*.ts parses in GitHubErrorCodeSchema", () => {
  const sites: { file: string; code: string }[] = [];
  for (const { name, text } of sources) {
    for (const match of text.matchAll(/throw\s+new\s+Error\(\s*(['"`])(GITHUB_[A-Za-z0-9_]*)\1/g)) sites.push({ file: name, code: match[2]! });
  }
  // Both throwing modules contribute: the reader's reasons and the service's credential errors.
  expect(sites.some(site => site.file === 'github.ts')).toBe(true);
  expect(sites.some(site => site.file === 'github-signin.ts')).toBe(true);
  expect(sites.filter(site => !parses(site.code))).toEqual([]);
});

test('every quoted GITHUB_ code in src/main/github*.ts parses too: ternary branches and rejected promises are throw sites as well', () => {
  // `throw new Error(authenticated ? 'GITHUB_NOT_FOUND_SIGNED_IN' : 'GITHUB_NOT_FOUND')` and `Promise.reject(new Error('GITHUB_…'))`
  // escape the literal pattern above; any quoted GITHUB_ code in these files is a reason main can hand the engine.
  const codes = new Set<string>();
  for (const { text } of sources) for (const match of text.matchAll(/(['"`])(GITHUB_[A-Za-z0-9_]*)\1/g)) codes.add(match[2]!);
  expect(codes.size).toBeGreaterThan(10);
  expect([...codes].filter(code => !parses(code))).toEqual([]);
});
