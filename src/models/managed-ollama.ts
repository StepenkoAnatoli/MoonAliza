import { lstat, readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import type { InferenceLease } from '../engine/scheduler';
import { readBoundedJson, type Fetcher } from '../main/inference';
import { safeCommandEnvironment, spawnOwned, type OwnedIdentity, type OwnedResult } from '../tools/commands';
import { hashFile, privateDirectory, safeArtifactPath } from './artifact-files';
import { ownedLoopbackFetcher } from './owned-transport';
import { clearModelMetadata } from './model-store';

const Path = z.string().min(1).max(32768).refine(isAbsolute);
const InstallationSchema = z.object({
  directory: Path, executable: z.string().refine(safeArtifactPath), version: z.string().min(1).max(128), homeDirectory: Path, modelsDirectory: Path,
  files: z.array(z.object({ path: z.string().refine(safeArtifactPath), sha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).strict()).min(1).max(100000),
}).strict();
export type RuntimeInstallation = z.infer<typeof InstallationSchema>;
export interface ManagedOllamaSession { readonly endpoint: string; readonly identity: OwnedIdentity; readonly fetcher: Fetcher; readonly lease: InferenceLease }

async function verifyFiles(installation: RuntimeInstallation, signal: AbortSignal) {
  const expected = new Map(installation.files.map(file => [file.path.toLowerCase(), file]));
  if (expected.size !== installation.files.length || !installation.files.some(file => file.path === installation.executable)) throw new Error('RUNTIME_MANIFEST');
  await privateDirectory(installation.directory); const stack = ['']; let entries = 0;
  while (stack.length) {
    signal.throwIfAborted(); const folder = stack.pop()!; const path = join(installation.directory, folder);
    const info = await lstat(path); if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('RUNTIME_MANIFEST');
    for (const item of await readdir(path, { withFileTypes: true })) {
      if (++entries > installation.files.length * 16) throw new Error('RUNTIME_MANIFEST');
      const name = folder ? `${folder}/${item.name}` : item.name;
      if (item.isSymbolicLink() || !safeArtifactPath(name)) throw new Error('RUNTIME_MANIFEST');
      if (item.isDirectory()) { stack.push(name); continue; }
      const file = expected.get(name.toLowerCase()); if (!file || file.path !== name) throw new Error('RUNTIME_MANIFEST');
      const actual = await hashFile(join(installation.directory, name), file.sizeBytes, signal);
      if (actual.sha256 !== file.sha256 || actual.sizeBytes !== file.sizeBytes) throw new Error('RUNTIME_MANIFEST');
      expected.delete(name.toLowerCase());
    }
  }
  if (expected.size) throw new Error('RUNTIME_MANIFEST');
}
async function availablePort() {
  const server = createServer();
  await new Promise<void>((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = (server.address() as { port: number }).port;
  await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); return port;
}
export async function runtimeJson(session: ManagedOllamaSession, path: string, init: RequestInit = {}) {
  session.lease.assertCurrent();
  const response = await session.fetcher(`${session.endpoint}${path}`, { ...init, signal: AbortSignal.any([session.lease.signal, ...(init.signal ? [init.signal] : [])]), redirect: 'error', credentials: 'omit' });
  if (!response.ok) throw new Error(`PROVIDER_HTTP_${response.status}`);
  const data = await readBoundedJson(response); session.lease.assertCurrent(); return data;
}

/** Main-owned process controller. Installation identities must come from verified application metadata. */
export class ManagedOllamaRuntime {
  private current?: { stop: AbortController; result?: Promise<OwnedResult>; exited: boolean; prepared: Promise<void> };
  private fault?: Error;
  constructor(private readonly helperPath?: string) {}

  async start(input: RuntimeInstallation, lease: InferenceLease): Promise<ManagedOllamaSession> {
    lease.assertCurrent(); if (this.fault) throw this.fault; if (this.current) throw new Error('RUNTIME_BUSY');
    const installation = InstallationSchema.parse(input);
    const paths = [installation.directory, installation.homeDirectory, installation.modelsDirectory].map(path => resolve(path).toLowerCase());
    for (let a = 0; a < paths.length; a++) for (let b = a + 1; b < paths.length; b++) {
      const nested = (parent: string, child: string) => { const path = relative(parent, child); return !path || !path.startsWith('..') && !isAbsolute(path); };
      if (nested(paths[a]!, paths[b]!) || nested(paths[b]!, paths[a]!)) throw new Error('RUNTIME_STORAGE_OVERLAP');
    }
    let finishedPreparing!: () => void;
    const state = { stop: new AbortController(), result: undefined as Promise<OwnedResult> | undefined, exited: false, prepared: new Promise<void>(done => { finishedPreparing = done; }) }; this.current = state;
    const startup = AbortSignal.any([lease.signal, state.stop.signal, AbortSignal.timeout(60000)]);
    const abortStartup = () => state.stop.abort(); startup.addEventListener('abort', abortStartup, { once: true });
    try {
      await verifyFiles(installation, startup);
      const home = await privateDirectory(installation.homeDirectory); const models = await privateDirectory(installation.modelsDirectory);
      await clearModelMetadata(models, startup);
      const port = await availablePort(); startup.throwIfAborted(); lease.assertCurrent();
      const extra = { USERPROFILE: home, HOME: home, OLLAMA_HOST: `127.0.0.1:${port}`, OLLAMA_MODELS: models, OLLAMA_NO_CLOUD: '1', OLLAMA_NUM_PARALLEL: '1', OLLAMA_MAX_LOADED_MODELS: '1', OLLAMA_MAX_QUEUE: '1', OLLAMA_KEEP_ALIVE: '0' };
      const overridden = new Set(Object.keys(extra).map(key => key.toLowerCase()));
      const env = { ...Object.fromEntries(Object.entries(safeCommandEnvironment()).filter(([key]) => !overridden.has(key.toLowerCase()))), ...extra };
      let started!: (identity: OwnedIdentity) => void; let failed!: (error: Error) => void;
      const identity = new Promise<OwnedIdentity>((done, reject) => { started = done; failed = reject; });
      state.result = spawnOwned({ executable: join(installation.directory, installation.executable), args: ['serve'], cwd: installation.directory, env, timeoutMs: 300000, maxOutputBytes: 32768 }, AbortSignal.any([lease.signal, state.stop.signal]), { helperPath: this.helperPath, onStarted: started });
      void state.result.then(() => { state.exited = true; failed(new Error('RUNTIME_EXITED')); }, () => { state.exited = true; failed(new Error('RUNTIME_STARTUP_FAILED')); });
      const owner = await identity;
      const assertCurrent = () => { lease.assertCurrent(); startup.throwIfAborted(); if (state.exited || this.current !== state) throw new Error('RUNTIME_EXITED'); };
      // The startup deadline is only for readiness; ongoing requests use the lease and process lifetime.
      const session: ManagedOllamaSession = Object.freeze({ endpoint: `http://127.0.0.1:${port}`, identity: owner, lease, fetcher: ownedLoopbackFetcher(owner, port, { helperPath: this.helperPath, assertCurrent: () => { lease.assertCurrent(); if (state.exited || state.stop.signal.aborted || this.current !== state) throw new Error('RUNTIME_EXITED'); } }) });
      while (true) {
        assertCurrent();
        try {
          const data = z.object({ version: z.string() }).parse(await runtimeJson(session, '/api/version', { signal: AbortSignal.any([startup, AbortSignal.timeout(5000)]) }));
          if (data.version !== installation.version) throw new Error('RUNTIME_VERSION'); break;
        } catch (error) {
          assertCurrent();
          if (!['ECONNREFUSED', 'ECONNRESET', 'EPIPE'].includes((error as NodeJS.ErrnoException)?.code ?? '') && !(error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name))) throw error;
          await delay(100, undefined, { signal: startup });
        }
      }
      const status = z.object({ cloud: z.object({ disabled: z.boolean() }) }).parse(await runtimeJson(session, '/api/status', { signal: startup }));
      if (!status.cloud.disabled) throw new Error('RUNTIME_CLOUD');
      lease.heartbeat(); return session;
    } catch (error) { state.stop.abort(); throw error; }
    finally { startup.removeEventListener('abort', abortStartup); finishedPreparing(); }
  }

  async stop(): Promise<OwnedResult | null> {
    if (this.fault) throw this.fault;
    const state = this.current; if (!state) return null;
    state.stop.abort();
    try {
      await state.prepared;
      const result = state.result ? await state.result : null;
      if (result && result.status !== 'exited') throw new Error('RUNTIME_STOP_UNCONFIRMED');
      if (this.current === state) this.current = undefined;
      return result;
    } catch (cause) { this.fault = new Error('RUNTIME_STOP_UNCONFIRMED', { cause }); throw this.fault; }
  }
}
