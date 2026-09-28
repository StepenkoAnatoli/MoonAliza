import { expect, test } from 'vitest';
import { createBridge, isTrustedSender } from '../src/main/bridge';

const trusted = { webContentsId: 12, frameId: 44, url: 'file:///app/index.html', isMainFrame: true };
const authority = { webContentsId: 12, frameId: 44, url: 'file:///app/index.html' };
const request = { protocolVersion: 1, clientRequestId: 'request-1', method: 'project.list', params: {} };

test('only the expected top-level app frame can call the bridge', () => {
  expect(isTrustedSender(trusted, authority)).toBe(true);
  for (const changed of [{ webContentsId: 99 }, { frameId: 99 }, { url: 'file:///app/index.html?other' }, { isMainFrame: false }]) {
    expect(isTrustedSender({ ...trusted, ...changed }, authority)).toBe(false);
  }
});

test('invalid and untrusted requests never reach an application handler', async () => {
  let called = false;
  const invoke = createBridge(() => authority, async () => { called = true; return { projects: [] }; });
  await expect(invoke({ ...trusted, isMainFrame: false }, request)).rejects.toThrow('UNTRUSTED_SENDER');
  await expect(invoke(trusted, { ...request, params: { rootPath: 'C:\\' } })).rejects.toThrow('INVALID_REQUEST');
  expect(called).toBe(false);
});

test('unexpected private fields in a handler response cannot cross to the renderer', async () => {
  const invoke = createBridge(() => authority, async () => ({ projects: [], secret: 'private-value' }));
  const response = await invoke(trusted, request);
  expect(response.ok).toBe(false);
  expect(JSON.stringify(response)).not.toContain('private-value');
});

test('internal exception details are replaced by safe public errors', async () => {
  const invoke = createBridge(() => authority, async () => { throw new Error('API key top-secret failed at C:\\private'); });
  const response = await invoke(trusted, request);
  expect(response.ok).toBe(false);
  expect(JSON.stringify(response)).not.toContain('top-secret');
  expect(response.clientRequestId).toBe('request-1');
});

test('successful responses preserve request correlation', async () => {
  const invoke = createBridge(() => authority, async () => ({ projects: [] }));
  await expect(invoke(trusted, request)).resolves.toMatchObject({ protocolVersion: 1, clientRequestId: 'request-1', method: 'project.list', ok: true, result: { projects: [] } });
});
