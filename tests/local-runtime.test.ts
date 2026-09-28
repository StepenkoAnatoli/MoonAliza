import { expect, test } from 'vitest';
import { inspectLocalRuntime } from '../src/models/local-runtime';
const digest = 'a'.repeat(64);
test('inspects only fixed local read endpoints and preserves model digests without claiming qualification', async () => {
  const requests: string[] = [];
  const result = await inspectLocalRuntime(async (url, init) => {
    requests.push(url); expect(init.method).toBe('GET'); expect(init.redirect).toBe('error'); expect(init.headers).toEqual({ Accept: 'application/json' });
    return Response.json(url.endsWith('/version') ? { version: '0.34.4' } : { models: [{ name: 'fixture:tiny', digest, size: 123456, details: { quantization_level: 'Q4_K_M' } }] });
  });
  expect(requests).toEqual(['http://127.0.0.1:11434/api/version', 'http://127.0.0.1:11434/api/tags']);
  expect(result.status).toBe('available'); expect(result.ownership).toBe('external'); expect(result.models[0]?.digest).toBe(digest);
  expect(result.models[0]?.qualified).toBe(false);
});
test('reports unreachable and incompatible runtimes without leaking errors', async () => {
  const unavailable = await inspectLocalRuntime(async () => { throw new Error('secret network detail'); });
  expect(unavailable.status).toBe('unavailable'); expect(JSON.stringify(unavailable)).not.toContain('secret');
  expect((await inspectLocalRuntime(async () => Response.json({ arbitrary: true }))).status).toBe('incompatible');
  expect((await inspectLocalRuntime(async () => new Response('', { status: 500 }))).status).toBe('incompatible');
});
test('rejects oversized bodies, invalid digests and truncated model lists instead of silently accepting them', async () => {
  expect((await inspectLocalRuntime(async () => new Response('x'.repeat(524289)))).status).toBe('incompatible');
  const fetcher = async (url: string) => Response.json(url.endsWith('/version') ? { version: '1' } : { models: [{ name: 'bad', digest: 'mutable-tag', size: 1 }] });
  expect((await inspectLocalRuntime(fetcher)).status).toBe('incompatible');
});
