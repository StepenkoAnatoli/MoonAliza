import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { DEVICE_CODE_URL, DEVICE_PAGE_URL, GITHUB_APP, REQUEST_OFFLINE_ACCESS, TOKEN_URL, USER_URL, isConfigured } from '../src/main/github-app';

// GitHub sign-in, U0 (docs/specification/github-sign-in.md 3.1; REQUIREMENTS F-20, F-23, T-7). The app's identifiers are public
// values copied from its public page once the user registers it (UD-1, U9); until then both stay empty and the sign-in reports
// "not configured". No client secret exists for this app's use.

test('the app identifiers are both empty or both set, and each has its shape', () => {
  expect(GITHUB_APP.clientId === '', 'clientId and installUrl are set together (U9)').toBe(GITHUB_APP.installUrl === '');
  expect(isConfigured(GITHUB_APP)).toBe(GITHUB_APP.clientId !== '');
  if (GITHUB_APP.clientId !== '') {
    expect(GITHUB_APP.clientId).toMatch(/^[A-Za-z0-9._-]{1,64}$/);
    expect(GITHUB_APP.installUrl).toMatch(/^https:\/\/github\.com\/apps\/[^/?#\s]+\/installations\/new$/);
  }
  expect(isConfigured({ clientId: 'Iv23-example', installUrl: '' })).toBe(false);
  expect(isConfigured({ clientId: '', installUrl: 'https://github.com/apps/example/installations/new' })).toBe(false);
  expect(isConfigured({ clientId: 'Iv23-example', installUrl: 'https://github.com/apps/example/installations/new' })).toBe(true);
});

test('the endpoints are the owner-documented constants (E-01, E-02, E-20)', () => {
  expect(DEVICE_CODE_URL).toBe('https://github.com/login/device/code');
  expect(TOKEN_URL).toBe('https://github.com/login/oauth/access_token');
  expect(DEVICE_PAGE_URL).toBe('https://github.com/login/device');
  expect(USER_URL).toBe('https://api.github.com/user');
});

test('step 1 asks for offline access; turning it off belongs with UD-6 and the registration change (DC-3)', () => {
  expect(REQUEST_OFFLINE_ACCESS, 'REQUEST_OFFLINE_ACCESS flips to false only with UD-6 "turn expiry off" and the registration change, in the same commit as this test').toBe(true);
});

test('no source file names a client secret field', async () => {
  const files: string[] = [];
  async function walk(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path); else if (/\.(ts|tsx|js|cjs|mjs|json|html|css)$/.test(entry.name)) files.push(path);
    }
  }
  await walk('src');
  expect(files.length).toBeGreaterThan(50);
  const field = ['client', 'secret'].join('_');
  for (const file of files) expect((await readFile(file, 'utf8')).includes(field), file).toBe(false);
});
