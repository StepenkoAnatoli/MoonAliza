import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';

// GitHub sign-in, U0 (docs/specification/github-sign-in.md, "Tests the builders owe"; REQUIREMENTS T-1). Tests build their
// GitHub token markers at run time; no token-shaped literal is committed under src/, tests/ or e2e/. The pattern is assembled
// from parts so this file never matches itself.
const prefixes = ['ghp', 'gho', 'ghu', 'ghs', 'ghr'].map(prefix => `${prefix}_`);
const tokenShaped = new RegExp(`(?:${prefixes.join('|')})[A-Za-z0-9]{20,}|${['github', 'pat'].join('_')}_[A-Za-z0-9_]{20,}`);

async function sources(directory: string, out: string[] = []): Promise<string[]> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await sources(path, out); else if (/\.(ts|tsx|js|cjs|mjs|json)$/.test(entry.name)) out.push(path);
  }
  return out;
}

test('the pattern finds a token shape built at run time, and none built from fewer characters', () => {
  const body = 'A1b2C3d4E5f6G7h8I9j0K1l2';
  for (const prefix of prefixes) expect(tokenShaped.test(`${prefix}${body}`), prefix).toBe(true);
  expect(tokenShaped.test(`${['github', 'pat'].join('_')}_${body}_${body}`)).toBe(true);
  expect(tokenShaped.test(`${prefixes[2]}short`)).toBe(false);
});

test('no GitHub token-shaped literal is committed under src, tests or e2e', async () => {
  const files = [...await sources('src'), ...await sources('tests'), ...await sources('e2e')];
  expect(files.length).toBeGreaterThan(100);
  for (const file of files) expect(tokenShaped.test(await readFile(file, 'utf8')), file).toBe(false);
});
