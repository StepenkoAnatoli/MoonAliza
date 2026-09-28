import { Agent, request } from 'node:http';
import { createConnection } from 'node:net';
import type { Fetcher } from '../main/inference';
import { inspectOwnedConnection, OwnedIdentitySchema, type OwnedIdentity } from '../tools/commands';

/** Trusted-main transport. Authenticate the established socket before admitting any HTTP bytes. */
export function ownedLoopbackFetcher(identity: OwnedIdentity, port: number, options: { assertCurrent(): void; helperPath?: string }): Fetcher {
  const owner = Object.freeze(OwnedIdentitySchema.parse(identity));
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('INVALID_CONNECTION');
  const origin = new URL(`http://127.0.0.1:${port}`).origin;
  return async (url, init) => {
    const target = new URL(url); const method = init.method ?? 'GET'; const headers = new Headers(init.headers);
    if (target.origin !== origin || target.username || target.password || target.search || target.hash ||
      !(method === 'GET' && ['/api/version', '/api/tags', '/api/ps', '/api/status'].includes(target.pathname) || method === 'POST' && target.pathname === '/api/chat') ||
      [...headers].some(([key, value]) => !['accept', 'content-type'].includes(key) || value !== 'application/json') ||
      init.credentials && init.credentials !== 'omit' || init.redirect && init.redirect !== 'error' ||
      init.body !== undefined && init.body !== null && typeof init.body !== 'string' || method === 'GET' && init.body ||
      typeof init.body === 'string' && Buffer.byteLength(init.body) > 8 * 1024 ** 2) throw new Error('INVALID_OWNED_REQUEST');
    const signal = AbortSignal.any([...(init.signal ? [init.signal] : []), AbortSignal.timeout(120000)]);
    signal.throwIfAborted(); options.assertCurrent();
    const socket = createConnection({ host: '127.0.0.1', port });
    const agent = new Agent({ keepAlive: false, maxSockets: 1 });
    // Never ask the agent to create a replacement connection or return a socket before proof.
    let supplied = false;
    agent.createConnection = () => { if (supplied) throw new Error('RUNTIME_CONNECTION_REUSE'); supplied = true; return socket; };
    let socketError: Error | undefined;
    const captureError = (error: Error) => { socketError = error; };
    socket.on('error', captureError);
    const abort = () => socket.destroy(Object.assign(new Error('RUNTIME_REQUEST_CANCELLED'), { name: 'AbortError' }));
    signal.addEventListener('abort', abort, { once: true });
    try {
      await new Promise<void>((done, reject) => {
        const connected = () => { socket.removeListener('error', failed); done(); };
        const failed = (error: Error) => { socket.removeListener('connect', connected); reject(error); };
        socket.once('connect', connected); socket.once('error', failed);
        if (signal.aborted) abort();
      });
      if (!socket.localPort || !await inspectOwnedConnection(owner, port, socket.localPort, { helperPath: options.helperPath, signal })) throw new Error('RUNTIME_OWNERSHIP');
      signal.throwIfAborted(); options.assertCurrent();
      if (socketError || socket.destroyed) throw new Error('RUNTIME_CONNECTION_CLOSED');
      return await new Promise<Response>((done, reject) => {
        const req = request(target, { method, agent, headers: { ...Object.fromEntries(headers), 'Accept-Encoding': 'identity', Connection: 'close' }, maxHeaderSize: 16384, signal }, response => {
          const fail = (error: Error) => { response.destroy(); req.destroy(); reject(error); };
          const status = response.statusCode ?? 0;
          if (status >= 300 && status < 400) { fail(new Error('RUNTIME_REDIRECT')); return; }
          if (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') { fail(new Error('RUNTIME_ENCODING')); return; }
          const chunks: Buffer[] = []; let bytes = 0;
          response.on('data', (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > 4 * 1024 ** 2) { fail(new Error('PROVIDER_RESPONSE_TOO_LARGE')); return; }
            chunks.push(chunk);
          });
          response.once('error', reject);
          response.once('end', () => {
            try {
              signal.throwIfAborted(); options.assertCurrent();
              done(new Response([204, 205, 304].includes(status) ? null : Buffer.concat(chunks), { status, headers: { 'Content-Type': 'application/json' } }));
            } catch (error) { reject(error); }
          });
        });
        req.once('error', reject); req.end(init.body ?? undefined);
      });
    } finally {
      signal.removeEventListener('abort', abort); agent.destroy(); socket.destroy();
    }
  };
}
