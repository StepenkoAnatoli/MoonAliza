import { expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { ownedHttpFixture } from './fixtures/owned-http';
import { ownedLoopbackFetcher } from '../src/models/owned-transport';

test('sends a bounded request only through a connection authenticated to its process instance', async () => {
  const f = await ownedHttpFixture();
  try {
    let checked = 0;
    const fetcher = ownedLoopbackFetcher(f.identity, f.info.port, { assertCurrent: () => { checked++; } });
    const response = await fetcher(`http://127.0.0.1:${f.info.port}/api/chat`, { method: 'POST', body: 'private project text' });
    expect(await response.json()).toEqual({ version: 'fixture', received: 'private project text' });
    expect(await readFile(f.body, 'utf8')).toBe('private project text'); expect(checked).toBeGreaterThanOrEqual(2);
  } finally { await f.close(); }
});

test('an unrelated process instance receives no HTTP headers or prompt bytes', async () => {
  const f = await ownedHttpFixture();
  try {
    const fetcher = ownedLoopbackFetcher({ ...f.identity, createdAt: '1' }, f.info.port, { assertCurrent: () => {} });
    await expect(fetcher(`http://127.0.0.1:${f.info.port}/api/chat`, { method: 'POST', body: 'private' })).rejects.toThrow('RUNTIME_OWNERSHIP');
    expect(await readFile(f.wire, 'utf8')).toBe('');
  } finally { await f.close(); }
});

test('a lease revoked during connection verification prevents all HTTP bytes', async () => {
  const f = await ownedHttpFixture();
  try {
    let checks = 0;
    const fetcher = ownedLoopbackFetcher(f.identity, f.info.port, { assertCurrent: () => { if (++checks > 1) throw new Error('STALE_LEASE'); } });
    await expect(fetcher(`http://127.0.0.1:${f.info.port}/api/chat`, { method: 'POST', body: 'private' })).rejects.toThrow('STALE_LEASE');
    expect(await readFile(f.wire, 'utf8')).toBe('');
  } finally { await f.close(); }
});

test('rejects other destinations, management routes and credential headers before connecting', async () => {
  const f = await ownedHttpFixture();
  try {
    const fetcher = ownedLoopbackFetcher(f.identity, f.info.port, { assertCurrent: () => {} });
    const base = `http://127.0.0.1:${f.info.port}`;
    for (const [url, init] of [
      ['http://127.0.0.1:1/api/chat', { method: 'POST' }], [`${base}/api/pull`, { method: 'POST' }],
      [`${base}/api/chat?secret=x`, { method: 'POST' }], [`${base}/api/chat`, { method: 'POST', headers: { Authorization: 'secret' } }],
      [`${base}/api/chat`, { method: 'POST', headers: { Host: 'external.example' } }], [`${base}/api/chat`, { method: 'POST', body: 'x'.repeat(8 * 1024 * 1024 + 1) }],
    ] as [string, RequestInit][]) await expect(fetcher(url, init)).rejects.toThrow('INVALID_OWNED_REQUEST');
    expect(await readFile(f.wire, 'utf8')).toBe('');
  } finally { await f.close(); }
});

test('redirects are rejected and oversized chunked responses are bounded', async () => {
  const f = await ownedHttpFixture();
  try {
    const fetcher = ownedLoopbackFetcher(f.identity, f.info.port, { assertCurrent: () => {} });
    await expect(fetcher(`http://127.0.0.1:${f.info.port}/api/tags`, { method: 'GET' })).rejects.toThrow('RUNTIME_REDIRECT');
    await expect(fetcher(`http://127.0.0.1:${f.info.port}/api/chat`, { method: 'POST', body: 'oversize' })).rejects.toThrow('PROVIDER_RESPONSE_TOO_LARGE');
  } finally { await f.close(); }
});

test('cancellation terminates a pending response, and an already aborted request sends nothing', async () => {
  const f = await ownedHttpFixture();
  try {
    const fetcher = ownedLoopbackFetcher(f.identity, f.info.port, { assertCurrent: () => {} }); const stop = new AbortController(); stop.abort();
    await expect(fetcher(`http://127.0.0.1:${f.info.port}/api/chat`, { method: 'POST', body: 'private', signal: stop.signal })).rejects.toThrow();
    expect(await readFile(f.wire, 'utf8')).toBe('');
    const pendingStop = new AbortController();
    const pending = fetcher(`http://127.0.0.1:${f.info.port}/api/chat`, { method: 'POST', body: 'slow', signal: pendingStop.signal });
    const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    for (let n = 0; n < 100 && await readFile(f.body, 'utf8') !== 'slow'; n++) await delay(20);
    expect(await readFile(f.body, 'utf8')).toBe('slow'); pendingStop.abort(); await rejection;
  } finally { await f.close(); }
});

test('cancellation during connection proof retains an abort classification for bounded startup retries', async () => {
  const f = await ownedHttpFixture(); const stop = new AbortController();
  try {
    const fetcher = ownedLoopbackFetcher(f.identity, f.info.port, { assertCurrent: () => { queueMicrotask(() => stop.abort()); } });
    await expect(fetcher(`http://127.0.0.1:${f.info.port}/api/version`, { signal: stop.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(await readFile(f.wire, 'utf8')).toBe('');
  } finally { await f.close(); }
});
