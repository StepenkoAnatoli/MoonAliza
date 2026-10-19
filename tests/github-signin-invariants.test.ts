import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import Database from 'better-sqlite3';
import * as artifactFiles from '../src/models/artifact-files';
import { Vault } from '../src/main/vault';
import { GitHubAccountStore } from '../src/main/github-account-store';
import { DEVICE_PAGE_URL } from '../src/main/github-app';
import type { Fetcher, GitHubCredential } from '../src/main/github-credential';
import { GitHubReader } from '../src/main/github';
import { GitHubSignIn } from '../src/main/github-signin';
import { fetchLogin, requestDeviceCode, requestToken } from '../src/main/github-oauth';
import type { Completion, InferenceMessage } from '../src/main/inference';
import { Store } from '../src/engine/store';
import { Application } from '../src/engine/application';
import { MethodSpec, type MethodName, type MethodParams, type MethodResult } from '../src/shared';
import { githubFailure, githubRepositories } from '../src/shared/github';
import { ROUTES, codeAnswer, fetcherFor, markers, startFakeGitHubOAuth, tokenAnswer, type FakeGitHubOAuth, type FakeReply, type Markers } from './fixtures/fake-github-oauth';

// GitHub sign-in, U7: the token invariant through the engine (docs/specification/github-sign-in.md 11 S-1, 2.4 L-7, 3.4, 4; "Tests
// the builders owe", tests/github-signin-invariants.test.ts, T-6). Fixtures are built from E-01/E-02/E-15 shapes, not a capture:
// every answer comes from the loopback fake's builders, and every token, refresh token and device code is a hex marker generated
// at run time (T-1), so no escaping can hide one from a byte scan.
//
// The stack is the one main wires (spec 9): a real Vault with the AES fake cryptor of tests/vault.test.ts:9-31, the real account
// file, GitHubSignIn against the fake, a GitHubReader with that credential and vault.redact, and the engine Application over a real
// Store whose host.readGitHub calls the reader and redacts its result as main's readGitHub does (src/main/index.ts:110-123; harness
// as tests/folder-free-chat.test.ts:13-21). The IPC results are what main's five handle() cases return (spec 9), parsed against
// their method's result schema as the preload parses them. Clocks are injected (U5 as built): only step() moves the wall clock
// alone, and the fresh-token and poll waits go through the injected sleep. globalThis.fetch is never stubbed.

const KEY = randomBytes(32);
const cryptor = {
  isEncryptionAvailable: () => true,
  encryptString(value: string) {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', KEY, iv);
    const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return Buffer.concat([iv, cipher.getAuthTag(), data]);
  },
  decryptString(value: Buffer) {
    const decipher = createDecipheriv('aes-256-gcm', KEY, value.subarray(0, 12)); decipher.setAuthTag(value.subarray(12, 28));
    return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]).toString('utf8');
  },
};
const CLIENT = 'Iv23-u7-invariants-test';
const INSTALL = 'https://github.com/apps/moonaliza-u7-test/installations/new';
const T0 = Date.UTC(2031, 4, 6, 7, 8, 9);   // years from real time, as the U5 harnesses: grants must use Date.now() (3.7)
const LOGIN = 'octo-u7';
const OWNER = 'acme'; const REPO = 'private-u7';
const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
const REPOSITORY_ROUTES = 'api.github.com/repos/*';
const SHA = randomBytes(20).toString('hex');
const at = '2026-10-01T00:00:00.000Z';
type GitHubMethod = 'github.account.read' | 'github.signIn.start' | 'github.signIn.cancel' | 'github.signOut' | 'github.open';

let fake: FakeGitHubOAuth;
beforeAll(async () => { fake = await startFakeGitHubOAuth(); });
afterAll(async () => { await fake.close(); });
beforeEach(() => { fake.reset(); });

async function until(check: () => boolean, what: string) {
  await vi.waitFor(() => { if (!check()) throw new Error(`still waiting for ${what}`); }, { timeout: 5_000, interval: 2 });
}

/** The U5 harness clock (tests/github-signin-refresh.test.ts): a sleep advances both clocks and returns at once. */
class Clock {
  t: number;
  constructor(t0: number) { this.t = t0; }
  readonly now = () => this.t;
  readonly monotonic = () => this.t;
  readonly sleep = (ms: number): Promise<void> => { this.t += ms; return Promise.resolve(); };
}

/** The places S-1 names that a test can observe (spec "Tests the builders owe", the scan): the ten it lists, plus every other file
 *  under userData, since S-1 also forbids "any file in clear" and the guard allows atomicJson to any path (U7-R1). */
const TARGETS = ['state.sqlite', 'state.sqlite-wal', 'state.sqlite-shm', 'account file', 'vault directory', 'other userData files',
  'IPC results and DTOs', 'engine messages and events', 'infer messages', 'tool output', 'process.env', 'argv'] as const;
type Target = (typeof TARGETS)[number];
const FILE_TARGETS = new Set<Target>(['state.sqlite', 'state.sqlite-wal', 'state.sqlite-shm', 'account file', 'vault directory', 'other userData files']);
/** Targets the journey need not fill: the journey writes no file beyond the named ones, so this one is shown by its plant alone. */
const OPTIONAL_TARGETS = new Set<Target>(['other userData files']);
interface Captured { target: Target; label: string; bytes: Buffer }

/** A marker's base64 (or base64url) as it appears inside any longer encoded stream: one form per byte alignment, each cut to the
 *  characters that encode the marker's bytes alone, since the characters at either end also carry the neighbouring bytes. */
function base64Forms(value: string, encoding: 'base64' | 'base64url'): string[] {
  const bytes = Buffer.from(value, 'utf8');
  return [0, 1, 2].map(shift => Buffer.concat([Buffer.alloc(shift), bytes]).toString(encoding).slice(shift === 0 ? 0 : 4, Math.floor((shift + bytes.length) / 3) * 4));
}

/** Every marker's hits in the captured bytes, as UTF-8 and as UTF-16LE (e2e/anthropic.spec.ts:98-110), and in the reversible
 *  encodings a clear token could also take: base64, base64url and hex (U7-R3). */
function scan(captured: readonly Captured[], secrets: Readonly<Record<string, string>>): Record<Target, string[]> {
  const hits = Object.fromEntries(TARGETS.map(target => [target, [] as string[]])) as Record<Target, string[]>;
  const forms = Object.entries(secrets).map(([name, value]) => {
    const hex = Buffer.from(value, 'utf8').toString('hex');
    return { name, encoded: [
      { how: 'UTF-8', bytes: Buffer.from(value, 'utf8') },
      { how: 'UTF-16LE', bytes: Buffer.from(value, 'utf16le') },
      ...(['base64', 'base64url'] as const).flatMap(encoding => base64Forms(value, encoding).map(text => ({ how: encoding, bytes: Buffer.from(text, 'latin1') }))),
      ...[hex, hex.toUpperCase()].map(text => ({ how: 'hex', bytes: Buffer.from(text, 'latin1') })),
    ] };
  });
  for (const { target, label, bytes } of captured) {
    for (const { name, encoded } of forms) {
      for (const how of new Set(encoded.filter(form => bytes.includes(form.bytes)).map(form => form.how))) hits[target].push(`${name} in ${label} (${how})`);
    }
  }
  return hits;
}
const none = () => Object.fromEntries(TARGETS.map(target => [target, [] as string[]])) as Record<Target, string[]>;

/** L-7, DC-9: a rejection's message, stack, every other own property, and whole cause chain (and an AggregateError's members)
 *  hold no marker and no 8-character substring of one. Returns what it found. */
function walk(rejection: unknown, secrets: Readonly<Record<string, string>>): string[] {
  const found: string[] = []; const seen = new Set<unknown>();
  const pieces = Object.entries(secrets).flatMap(([name, value]) => Array.from({ length: value.length - 7 }, (_, i) => ({ name, piece: value.slice(i, i + 8) })));
  const visit = (value: unknown, path: string) => {
    if (value === undefined || value === null || seen.has(value)) return;
    seen.add(value);
    // A non-Error value is read whole (U7-R6): no depth, item or string-length cut, so nothing nested deep or late in it is skipped.
    const texts = value instanceof Error ? [value.message, value.stack ?? '']
      : [typeof value === 'string' ? value : inspect(value, { depth: Infinity, showHidden: true, maxArrayLength: Infinity, maxStringLength: Infinity })];
    for (const text of texts) for (const { name, piece } of pieces) if (text.includes(piece)) { found.push(`${path}: part of ${name}`); break; }
    // Any other own property of an Error, enumerable or not, symbol-keyed too (U7-R2): the engine records only the message, so a
    // token riding on a field of the rejection would otherwise pass every scan.
    if (value instanceof Error) {
      for (const key of Reflect.ownKeys(value)) {
        if (key === 'message' || key === 'stack' || key === 'cause' || (key === 'errors' && value instanceof AggregateError)) continue;
        visit((value as unknown as Record<PropertyKey, unknown>)[key], `${path}.${String(key)}`);
      }
    }
    if (value instanceof AggregateError) value.errors.forEach((member, i) => visit(member, `${path}.errors[${i}]`));
    if (typeof value === 'object' && 'cause' in value) visit((value as { cause: unknown }).cause, `${path}.cause`);
  };
  visit(rejection, 'rejection');
  return [...new Set(found)];
}

function call<M extends MethodName>(app: Application, method: M, params: MethodParams<M>): Promise<MethodResult<M>> {
  return app.handle({ protocolVersion: 1, clientRequestId: randomUUID(), method, params }) as Promise<MethodResult<M>>;
}

const plantedArgv: string[] = [];
let unhook: (() => void) | null = null;
const opened: Array<{ root: string; service: GitHubSignIn; store: Store }> = [];
afterEach(async () => {
  unhook?.(); unhook = null;
  delete process.env.MOONALIZA_U7_PLANTED;
  for (const value of plantedArgv.splice(0)) { const i = process.argv.indexOf(value); if (i >= 0) process.argv.splice(i, 1); }
  for (const { root, service, store } of opened.splice(0)) { service.cancel(); await service.close(); store.close(); await rm(root, { recursive: true, force: true }); }
});

/** U7-R9: atomicJson is swapped on its module object for the run, so each call's value is recorded before it is written, whatever
 *  the path and however briefly the file lives (a staging file removed inside one commit point is in no snapshot). The importers read
 *  the export at each call, so the swap reaches them; the value is kept in UTF-8 and UTF-16LE, as the other scans read it.
 *  U7-R16: privateDirectory is swapped too, and the name of every path a write or a directory is made at is recorded beside the value,
 *  in UTF-8 and UTF-16LE: a token in a file or directory name is in clear on disk, though no file holds it. */
function recordWrites(root: string, targetOf: (file: string) => Target): { writes: Captured[]; restore: () => void } {
  const writes: Captured[] = [];
  const realWrite = artifactFiles.atomicJson; const realDirectory = artifactFiles.privateDirectory;
  const shown = (path: string) => (path.startsWith(root + sep) ? relative(root, path).split(sep).join('/') : path);
  const recordName = (kind: string, path: string) => {
    const label = `${kind}: name ${shown(path)}`;
    writes.push({ target: targetOf(path), label, bytes: Buffer.from(shown(path), 'utf8') }, { target: targetOf(path), label, bytes: Buffer.from(shown(path), 'utf16le') });
  };
  const exported = (path: string, value: unknown) => {
    const json = JSON.stringify(value);
    const label = `atomicJson: ${shown(path)}`;
    writes.push({ target: targetOf(path), label, bytes: Buffer.from(json, 'utf8') }, { target: targetOf(path), label, bytes: Buffer.from(json, 'utf16le') });
    recordName('atomicJson', path);
    return realWrite(path, value);
  };
  const directory = (path: string) => { recordName('privateDirectory', path); return realDirectory(path); };
  const define = (name: 'atomicJson' | 'privateDirectory', value: unknown) =>
    Object.defineProperty(artifactFiles, name, { configurable: true, enumerable: true, writable: true, value });
  define('atomicJson', exported); define('privateDirectory', directory);
  return { writes, restore: () => { define('atomicJson', realWrite); define('privateDirectory', realDirectory); } };
}

/** Builds the stack, runs the journey and returns everything it saw. `pendingPlant`: the mutation test's plant for the pending window
 *  (U7-R5), written in clear to a file under userData as the device-code poll goes out and removed when its answer is back, so it
 *  is gone before the commit point and before any checkpoint snapshot. */
async function journey(options: { pendingPlant?: string } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'moonaliza-github-invariants-'));
  const vaultDir = join(root, 'vault'); const accountFile = join(root, 'github', 'account.json'); const database = join(root, 'state.sqlite');
  // Every file under userData (root), walked recursively, so a clear token in any file is found, not only in the named ones (U7-R1).
  const named = new Map<string, Target>([[database, 'state.sqlite'], [`${database}-wal`, 'state.sqlite-wal'], [`${database}-shm`, 'state.sqlite-shm'], [accountFile, 'account file']]);
  const targetOf = (file: string): Target => named.get(file) ?? (file.startsWith(vaultDir + sep) ? 'vault directory' : 'other userData files');
  const recorder = recordWrites(root, targetOf); unhook = recorder.restore;
  const vault = new Vault(vaultDir, cryptor); await vault.initialize('epoch-1');
  const accountStore = new GitHubAccountStore(accountFile, vault, CLIENT);
  await accountStore.open();
  const clock = new Clock(T0);

  // Markers: the device code, three access/refresh pairs (sign-in, the expiry refresh, the 401 refresh), and a pair that arrives
  // only inside an unparseable refresh answer (step 5, the parse case), which nothing may keep.
  const pairs: Markers[] = [markers(), markers(), markers()];
  const leaked = markers();
  const secrets: Record<string, string> = { device: pairs[0]!.device, leakedAccess: leaked.access, leakedRefresh: leaked.refresh };
  pairs.forEach((pair, i) => { secrets[`access${i + 1}`] = pair.access; secrets[`refresh${i + 1}`] = pair.refresh; });
  fake.register(secrets);
  const REPO_TEXT = 'repository-text-' + randomBytes(12).toString('hex');   // the positive control: private text that must persist

  const captured: Captured[] = [];
  const ipc: Array<{ method: GitHubMethod; result: unknown }> = [];
  const engine: unknown[] = [];          // app.handle responses and every published event
  const inferred: unknown[] = [];        // every infer() message list
  const outputs: string[] = [];          // every tool output (host results; the engine's own tool results are in its messages)
  const rejections: unknown[] = [];
  const envDuringRequests: string[] = [];
  const state = { reject401: null as string | null, servePublic: false };

  // The repository routes: signed out, a private repository is a 404 (E-15); signed in, the README holds the live pair, which the
  // reader's pre-redaction and main's final redaction must both cover (7.3), plus the repository text.
  const pairByName = new Map<string, Markers>(pairs.map((pair, i) => [`access${i + 1}`, pair]));
  const planted = { toolText: '' };
  fake.always(REPOSITORY_ROUTES, (request): FakeReply => {
    const pair = request.authorizationMarker ? pairByName.get(request.authorizationMarker) : undefined;
    if (!pair && !state.servePublic) return { status: 404, json: { message: 'Not Found' } };
    if (state.reject401 !== null && request.authorizationMarker === state.reject401) { state.reject401 = null; return { status: 401, json: { message: 'Bad credentials' } }; }
    if (request.path === `/repos/${OWNER}/${REPO}/commits/HEAD`) return { json: { sha: SHA } };
    if (request.path === `/repos/${OWNER}/${REPO}/contents/README.md`) {
      const bytes = Buffer.from(`# Private\n${REPO_TEXT}\naccess: ${pair?.access ?? ''}\nrefresh: ${pair?.refresh ?? ''}\n${state.servePublic ? planted.toolText : ''}\n`, 'utf8');
      return { json: { type: 'file', size: bytes.length, path: 'README.md', encoding: 'base64', content: bytes.toString('base64') } };
    }
    return { status: 404, json: { message: 'Not Found' } };
  });

  const routed = fetcherFor(fake);
  const pendingFile = join(root, 'github', 'account.json.pending.json');
  let pendingPlanted = false;
  // Every GitHub request also snapshots every file under userData (U7-R5): a device code exists only while the poll is out, and a
  // token is live only around its requests, so the checkpoints alone, all after the commit point, would miss a file that is written
  // in clear and removed again inside such a window. Bound to snapshot() once that is defined.
  let snapshotAt: (label: string) => void = () => {};
  const fetcher: Fetcher = (url, init) => {
    // While a request carries a token, the token is live: process.env and argv must not hold it now either.
    const values = [...Object.values(process.env), ...process.argv, ...process.execArgv].join('\n');
    for (const [name, value] of Object.entries(secrets)) if (values.includes(value)) envDuringRequests.push(name);
    const poll = options.pendingPlant !== undefined && !pendingPlanted && url.includes(ROUTES.token);
    if (poll) { pendingPlanted = true; mkdirSync(join(root, 'github'), { recursive: true }); writeFileSync(pendingFile, JSON.stringify({ deviceCode: options.pendingPlant })); }
    snapshotAt('request');
    const answer = routed(url, init);
    return poll ? answer.finally(() => rm(pendingFile, { force: true })) : answer;
  };
  const service = new GitHubSignIn({ store: accountStore, vault, epoch: () => 'epoch-1', encryptionAvailable: () => true, fetcher,
    config: { clientId: CLIENT, installUrl: INSTALL }, now: clock.now, monotonic: clock.monotonic, sleep: clock.sleep,
    limits: { requestTimeoutMs: 2_000, quitWaitMs: 2_000 } });
  // The credential as the reader holds it; it only records each rejection on its way through.
  const credential: GitHubCredential = { send: (request, signal) => service.send(request, signal).catch((error: unknown) => { rejections.push(error); throw error; }) };

  const store = new Store(database);
  opened.push({ root, service, store });
  store.putProfile({ id: 'local', name: 'Local', kind: 'ollama', endpoint: 'http://127.0.0.1:11434', model: 'test', contextTokens: 8192, outputTokens: 512, locality: 'local', revision: 1, revisionId: 'local-v1', createdAt: at, updatedAt: at });
  const app = new Application(store, {
    publish(event) { engine.push(event); },
    async readGitHub(runId, input, signal) {
      const run = store.getRun(runId)!;
      const repositories = githubRepositories(store.listMessages(run.sessionId, { latest: true }).filter(m => m.role === 'user').map(m => m.content));
      const reader = new GitHubReader(fetcher, credential, text => vault.redact(text));   // one reader per run, as main admits it
      try { const output = await vault.redact(await reader.read(input, repositories, signal)); outputs.push(output); return output; }
      catch (error) { rejections.push(error); throw error; }
    },
    async infer(_run, messages: InferenceMessage[]): Promise<Completion> {
      inferred.push(structuredClone(messages));
      if (messages.at(-1)?.role === 'tool') return { content: 'Read it.', outcome: 'complete' };
      return { content: '', outcome: 'tool_calls', toolCalls: [{ id: 'read-' + randomUUID(), name: 'read_github', input: { url: REPO_URL, path: 'README.md' } }] };
    },
  });
  const engineCall = async <M extends MethodName>(method: M, params: MethodParams<M>) => { const result = await call(app, method, params); engine.push(result); return result; };
  const { session } = await engineCall('session.create', { projectId: null });
  const converse = async (prompt: string) => {
    const { run } = await engineCall('run.start', { sessionId: session.id, profileId: 'local', mode: 'ask', prompt });
    await app.whenIdle();
    return run.id;
  };
  /** One of main's five handle() cases (spec 9), and its result as the preload checks it. */
  const handle = async (method: GitHubMethod, result: () => unknown) => {
    const value = await result();
    ipc.push({ method, result: value });
    return value;
  };
  /** Every entry under dir, directories too (U7-R16): a name holds a token as much as the bytes of a file do. */
  const entriesUnder = (dir: string): Array<{ path: string; file: boolean }> => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? [{ path, file: false }, ...entriesUnder(path)] : entry.isFile() ? [{ path, file: true }] : [];
  });
  const snapshot = (label: string) => {
    for (const { path: file, file: isFile } of entriesUnder(root)) {
      // The name is on disk in clear as the entry is (U7-R16): it is captured in UTF-8 and UTF-16LE, as the contents are.
      const name = relative(root, file).split(sep).join('/');
      captured.push({ target: targetOf(file), label: `${label}: name ${name}`, bytes: Buffer.from(name, 'utf8') },
        { target: targetOf(file), label: `${label}: name ${name}`, bytes: Buffer.from(name, 'utf16le') });
      if (!isFile) continue;
      // A request's snapshot can run while an atomic write's rename is in flight: a file gone between the listing and the read is
      // no longer on disk, so it is skipped rather than failing the run.
      let bytes: Buffer;
      try { bytes = readFileSync(file); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue; throw error; }
      captured.push({ target: targetOf(file), label: `${label}: ${name}`, bytes });
    }
  };
  snapshotAt = snapshot;
  const status = () => handle('github.account.read', () => ({ account: service.status() }));

  // 1. Sign in (6.1-6.3): the code, one poll, the commit point, GET /user.
  fake.answer(ROUTES.device, codeAnswer(pairs[0]!, { interval: 1, expires_in: 60 }));
  fake.answer(ROUTES.token, tokenAnswer(pairs[0]!));
  fake.answer(ROUTES.user, { json: { login: LOGIN, id: 7, email: 'octo-u7@example.invalid' } });
  await status();
  const started = await handle('github.signIn.start', () => service.start().then(account => ({ account })));
  await handle('github.open', async () => { expect(service.openTarget('device')).toBe(DEVICE_PAGE_URL); return { opened: true }; });
  await until(() => { const now = service.status(); return now.state === 'signed-in' && now.login === LOGIN; }, 'the sign-in and its login');
  await status();
  await handle('github.open', async () => { expect(service.openTarget('install')).toBe(INSTALL); return { opened: true }; });
  snapshot('signed in');

  // 2. Read a private file with the first token.
  await converse(`Read ${REPO_URL} please.`);
  await status(); snapshot('first read');

  // 3. Force a refresh: the access token is inside the 300 s margin, so the pre-check refreshes before the read (6.4).
  clock.t = accountStore.current()!.accessExpiresAt! - 100_000;
  fake.answer(ROUTES.token, tokenAnswer(pairs[1]!));
  await converse(`Again, ${REPO_URL}`);
  await status(); snapshot('expiry refresh');

  // 4. A 401 on a token older than transientHoldMs (GS-1): one refresh, one retry with the third token (6.4).
  clock.t += 60_000;
  state.reject401 = 'access2';
  fake.answer(ROUTES.token, tokenAnswer(pairs[2]!));
  await converse(`Once more, ${REPO_URL}`);
  await status(); snapshot('401 refresh');

  // 5. An oauth parse case inside the journey: the next refresh answer holds a token pair but is not JSON (5.3 row 4): transient,
  //    held, and the read fails with GITHUB_RENEWAL_UNAVAILABLE; nothing it carried may be kept anywhere.
  clock.t = accountStore.current()!.accessExpiresAt! - 100_000;
  fake.answer(ROUTES.token, { headers: { 'content-type': 'application/json' }, text: `${leaked.access}&refresh_token=${leaked.refresh}&expires_in=28800` });
  await converse(`And now ${REPO_URL}`);
  await status();
  const loginControl = readFileSync(accountFile, 'utf8');   // the login positive control: the file before sign-out
  snapshot('parse case');

  // 6. Sign out, then read signed out: no Authorization, the fake's signed-out 404 (L-10).
  await handle('github.signOut', () => service.signOut().then(account => ({ account })));
  await status();
  await converse(`Signed out now: ${REPO_URL}`);
  await handle('github.signIn.cancel', () => ({ account: service.cancel() }));
  snapshot('signed out');

  for (const run of store.listRuns(session.id)) engine.push(store.events(run.id, 0, 1000).events);
  engine.push(store.listMessages(session.id));

  /** Everything captured so far, as the scan reads it: the file snapshots plus the in-memory channels and process.env now. */
  const all = (): Captured[] => [
    ...captured,
    ...recorder.writes,
    { target: 'IPC results and DTOs', label: 'IPC results', bytes: Buffer.from(JSON.stringify(ipc), 'utf8') },
    { target: 'engine messages and events', label: 'engine', bytes: Buffer.from(JSON.stringify(engine), 'utf8') },
    { target: 'infer messages', label: 'infer()', bytes: Buffer.from(JSON.stringify(inferred), 'utf8') },
    { target: 'tool output', label: 'tool output', bytes: Buffer.from(JSON.stringify(outputs), 'utf8') },
    { target: 'process.env', label: 'process.env', bytes: Buffer.from(Object.values(process.env).join('\n'), 'utf8') },
    { target: 'argv', label: 'process.argv and execArgv', bytes: Buffer.from([...process.argv, ...process.execArgv].join('\n'), 'utf8') },
  ];
  return { root, vaultDir, accountFile, database, vault, accountStore, service, store, app, session, clock, pairs, leaked, secrets, REPO_TEXT,
    captured, ipc, engine, inferred, outputs, rejections, envDuringRequests, state, planted, started, loginControl, snapshot, converse, all, recorder };
}

test('T-6: through sign-in, a read, an expiry refresh, a 401 refresh, a parse failure and sign-out, no marker reaches any place S-1 names', async () => {
  const j = await journey();

  // The journey happened as written: each read carried the token the step names, and each refresh was one request.
  const reads = fake.requests.filter(request => request.host === 'api.github.com' && request.path.startsWith('/repos/'));
  expect(reads.map(request => request.authorizationMarker ?? request.authorization)).toEqual([
    'access1', 'access1',            // 2. the first read: commit, then contents
    'access2', 'access2',            // 3. refreshed by the pre-check, before any request
    'access2', 'access3', 'access3', // 4. the 401, one refresh, the retry
    'none',                          // 6. signed out (5. sent nothing: the refresh failed first)
  ]);
  expect(fake.to(ROUTES.token).map(request => request.body.grant_type === 'refresh_token' ? request.carries : 'poll')).toEqual(['poll', ['refresh1'], ['refresh2'], ['refresh3']]);
  expect(fake.to(ROUTES.user).map(request => request.authorizationMarker)).toEqual(['access1']);
  expect(fake.errors).toEqual([]);
  const failed = j.engine.flatMap(item => Array.isArray(item) ? item as Array<{ type?: string; payload?: { error?: { message: string } } }> : []).filter(event => event.type === 'tool.failed');
  expect(failed.map(event => event.payload?.error?.message)).toEqual([githubFailure('GITHUB_RENEWAL_UNAVAILABLE').message, githubFailure('GITHUB_NOT_FOUND').message]);

  // The scan (S-1): the device code, all three pairs and the unparsed pair, in no target, as UTF-8 or UTF-16LE.
  expect(scan(j.all(), j.secrets)).toEqual(none());
  expect(j.envDuringRequests).toEqual([]);
  // Every target was observed, so no scan passes for want of input (pre-mortem 1, 2): both WAL files existed with content.
  for (const target of TARGETS.filter(t => !OPTIONAL_TARGETS.has(t))) expect(j.all().filter(item => item.target === target && item.bytes.length > 0).length, target).toBeGreaterThan(0);

  // Positive controls: escaping cannot hide a hex marker, and the same scan finds text that is meant to persist.
  const files = (target: Target) => j.captured.filter(item => item.target === target);
  const holds = (target: Target, text: string) => files(target).some(item => item.bytes.includes(Buffer.from(text, 'utf8')));
  expect(holds('state.sqlite', j.REPO_TEXT) || holds('state.sqlite-wal', j.REPO_TEXT)).toBe(true);
  expect(j.loginControl).toContain(LOGIN);
  expect(holds('account file', LOGIN)).toBe(true);
  // Redaction did the work, not the fake: the README held the live pair at every signed-in read.
  expect(j.outputs.filter(output => output.includes(j.REPO_TEXT))).toHaveLength(3);
  for (const output of j.outputs) expect(output).toContain('access: [redacted]');

  // Every IPC result passes its method's strict schema unchanged, so nothing rides along unchecked (strict DTO).
  for (const { method, result } of j.ipc) expect(MethodSpec[method].result.parse(result), method).toEqual(result);
  // The user code crosses only in pending DTOs (S-1); the pending DTO was seen.
  const userCode = j.pairs[0]!.userCode;
  expect(j.started).toMatchObject({ account: { state: 'pending', userCode } });
  for (const { result } of j.ipc) {
    const text = JSON.stringify(result);
    if (!(result as { account?: { state?: string } }).account || (result as { account: { state: string } }).account.state !== 'pending') expect(text).not.toContain(userCode);
  }
  for (const target of TARGETS.filter(t => t !== 'IPC results and DTOs')) expect(scan(j.all().filter(item => item.target === target), { userCode })[target], target).toEqual([]);

  // Rejections (L-7, DC-9): every one raised during the journey, walked through message and cause chain.
  expect(j.rejections.map(error => (error as Error).message)).toEqual(['GITHUB_RENEWAL_UNAVAILABLE', 'GITHUB_RENEWAL_UNAVAILABLE', 'GITHUB_NOT_FOUND']);
  for (const rejection of j.rejections) expect(walk(rejection, j.secrets)).toEqual([]);

  // After the store closes, SQLite checkpoints the WAL into the database file: still nothing.
  j.store.close();
  const closed = readFileSync(j.database);
  expect(scan([{ target: 'state.sqlite', label: 'closed', bytes: closed }], j.secrets)).toEqual(none());
  expect(closed.includes(Buffer.from(j.REPO_TEXT, 'utf8'))).toBe(true);
});

test('T-6 mutation: each scan turns red when a marker is written where it scans', async () => {
  const pendingPlant = markers().device;   // device-code shaped (U7-R5)
  const j = await journey({ pendingPlant });
  expect(scan(j.all(), j.secrets)).toEqual(none());
  const plant = () => 'ghu_' + randomBytes(24).toString('hex');
  const planted: Record<Target, string> = Object.fromEntries(TARGETS.map(target => [target, plant()])) as Record<Target, string>;

  // The database file: written through SQLite, then checkpointed into the main file.
  const db = new Database(j.database);
  try {
    db.exec('CREATE TABLE planted (value TEXT)');
    db.prepare('INSERT INTO planted VALUES (?)').run(planted['state.sqlite']);
    db.pragma('wal_checkpoint(TRUNCATE)');
    // The WAL: a later write that no checkpoint has moved.
    db.prepare('INSERT INTO planted VALUES (?)').run(planted['state.sqlite-wal']);
  } finally { db.close(); }
  appendFileSync(`${j.database}-shm`, planted['state.sqlite-shm']);   // SQLite keeps no row text there: a raw write is the only plant
  appendFileSync(j.accountFile, planted['account file']);
  writeFileSync(join(j.root, 'github', 'planted.json'), JSON.stringify({ access: planted['other userData files'] }));   // a second atomicJson path (U7-R1)
  writeFileSync(join(j.vaultDir, 'planted.bin'), Buffer.from(planted['vault directory'], 'utf16le'));   // and the UTF-16LE scan
  // And the reversible encodings (U7-R3): base64 and base64url at the two byte alignments a lone encoding of the marker would miss,
  // and hex.
  const vaultPlant = Buffer.from(planted['vault directory'], 'utf8');
  writeFileSync(join(j.vaultDir, 'planted.b64'), Buffer.concat([randomBytes(1), vaultPlant, randomBytes(1)]).toString('base64'));
  writeFileSync(join(j.vaultDir, 'planted.b64url'), Buffer.concat([randomBytes(2), vaultPlant, randomBytes(2)]).toString('base64url'));
  writeFileSync(join(j.vaultDir, 'planted.hex'), vaultPlant.toString('hex'));
  // A name in clear (U7-R16): a directory under userData named with a marker. No file under it holds the marker, so only the name scan finds it.
  const namePlant = plant();
  mkdirSync(join(j.root, 'github', `planted-${namePlant}`));
  j.ipc.push({ method: 'github.account.read', result: { account: { state: 'signed-in', login: planted['IPC results and DTOs'], renewalHeld: false, lastOutcome: null } } });
  // Through the engine's own channels: a prompt reaches the engine's messages, events and infer(); a file text not in the vault
  // (so not redacted) reaches the tool output.
  j.state.servePublic = true;
  j.planted.toolText = planted['tool output'];
  await j.converse(`${planted['engine messages and events']} ${planted['infer messages']} ${REPO_URL}`);
  j.engine.push(j.store.listMessages(j.session.id));
  process.env.MOONALIZA_U7_PLANTED = planted['process.env'];
  process.argv.push(planted.argv); plantedArgv.push(planted.argv);   // S-1 names argv (U7-R4)
  j.snapshot('planted');
  // U7-R18: the recorder's own positive controls. (1) The swap reached a src importer: the account file's write went through the
  // swapped atomicJson. (2) A write and a directory made through the swapped exports outside userData, named and filled with
  // markers, are hits: nothing else scans outside userData, so with the swap removed both go silent.
  expect(j.recorder.writes.some(write => write.label === 'atomicJson: github/account.json')).toBe(true);
  const outside = await mkdtemp(join(tmpdir(), 'moonaliza-u7-outside-'));
  const recorded = { recValue: plant(), recName: plant() };
  try {
    await artifactFiles.atomicJson(join(outside, 'rec.json'), { value: recorded.recValue });
    await artifactFiles.privateDirectory(join(outside, `d-${recorded.recName}`));
    const seen = scan(j.recorder.writes, recorded)['other userData files'];
    expect(seen).toContain(`recValue in atomicJson: ${join(outside, 'rec.json')} (UTF-8)`);
    expect(seen).toContain(`recName in privateDirectory: name ${join(outside, `d-${recorded.recName}`)} (UTF-8)`);
  } finally { await rm(outside, { recursive: true, force: true }); }

  const hits = scan(j.all(), Object.fromEntries(TARGETS.map(target => [target, planted[target]])));
  for (const target of TARGETS) {
    expect(hits[target].filter(hit => hit.startsWith(`${target} in `)).length, `${target} is red under its plant`).toBeGreaterThan(0);
  }
  expect(hits['vault directory'].some(hit => hit.endsWith('(UTF-16LE)'))).toBe(true);
  expect(['base64', 'base64url', 'hex'].map(encoding => hits['vault directory'].some(hit => hit.endsWith(`(${encoding})`)))).toEqual([true, true, true]);
  expect(scan(j.captured, { namePlant })['other userData files']).toContain(`namePlant in planted: name github/planted-${namePlant} (UTF-8)`);
  // Every alignment, in both alphabets, between random neighbours: the cut forms find the marker wherever in the stream it starts.
  for (const shift of [0, 1, 2]) for (const encoding of ['base64', 'base64url'] as const) {
    const text = Buffer.concat([randomBytes(shift), vaultPlant, randomBytes(3)]).toString(encoding);
    expect(scan([{ target: 'vault directory', label: 'encoded', bytes: Buffer.from(text, 'latin1') }], { plant: planted['vault directory'] })['vault directory'], `${encoding} at ${shift}`)
      .toContain(`plant in encoded (${encoding})`);
  }
  // The pending window (U7-R5): a device code in clear on disk only while the poll is out, removed before the commit point, is found
  // by the snapshot each request takes, though no checkpoint snapshot ever sees the file.
  expect(scan(j.captured, { pending: pendingPlant })['other userData files']).toContain('pending in request: github/account.json.pending.json (UTF-8)');
  expect(j.captured.filter(item => item.label.endsWith('account.json.pending.json') && !item.label.includes(': name ')).map(item => item.label)).toEqual(['request: github/account.json.pending.json']);
  // File targets are scanned per file, the WAL apart from the database (pre-mortem 2).
  for (const target of FILE_TARGETS) expect(j.all().some(item => item.target === target && item.label.startsWith('planted'))).toBe(true);
  // The journey's own markers are still absent: the plants are what turned each scan red.
  expect(scan(j.all(), j.secrets)).toEqual(none());
});

test('L-7, DC-9: oauth parse failures holding markers reject nothing and leave no part of a marker in any rejection; the walker is red on a kept parse error', async () => {
  const m = markers(); const secrets = { access: m.access, refresh: m.refresh, device: m.device };
  fake.register(secrets);
  const limits = { requestTimeoutMs: 2_000, maxBodyBytes: 65_536, rateLimitFloorMs: 60_000, rateLimitCeilingMs: 3_600_000 };
  const routed = fetcherFor(fake);
  const json = { 'content-type': 'application/json' };
  const form = new URLSearchParams({ access_token: m.access, expires_in: '28800', refresh_token: m.refresh, refresh_token_expires_in: '15897600', token_type: 'bearer' }).toString();
  const tokenCases: FakeReply[] = [
    { headers: json, text: form },                                              // a form body served as JSON (the oauth test's case)
    { headers: json, text: `${m.access}&refresh_token=${m.refresh}` },          // a body that starts with a token: V8 quotes its head
    { headers: json, text: `{"access_token":"${m.access}","refresh_token":"${m.refresh}"` },   // truncated JSON
    { headers: json, text: Buffer.concat([Buffer.from(`{"access_token":"${m.access}`), Buffer.from([0xff, 0xfe]), Buffer.from('"}')]) },   // invalid UTF-8
    { headers: { 'content-type': 'text/html' }, text: `<p>${m.access}</p>` },  // an unknown type
    { headers: json, text: `${m.access} `.repeat(2_000) },                      // over 64 KiB
  ];
  // Each outcome is settled, then walked before anything else is asserted, so a rejection the wire should never raise is first
  // judged by the walker (the mutation proof below keeps a parse error as a cause).
  const settled: Array<{ value?: unknown; error?: unknown }> = [];
  const settle = (promise: Promise<unknown>) => promise.then(value => { settled.push({ value }); }, (error: unknown) => { settled.push({ error }); });
  for (const reply of tokenCases) {
    fake.answer(ROUTES.token, reply);
    await settle(requestToken(routed, { client_id: CLIENT, grant_type: 'refresh_token', refresh_token: m.refresh }, new AbortController().signal, limits, Date.now));
  }
  fake.answer(ROUTES.device, { headers: json, text: `${m.access}&device_code=${m.device}&user_code=${m.userCode}` });
  await settle(requestDeviceCode(routed, CLIENT, true, new AbortController().signal, limits, Date.now));
  fake.answer(ROUTES.user, { headers: json, text: `${m.access} {"login":"${LOGIN}"}` });
  await settle(fetchLogin(routed, 'Bearer ' + m.access, new AbortController().signal, limits));
  for (const outcome of settled) expect(walk(outcome.error ?? outcome.value, secrets)).toEqual([]);
  expect(settled).toEqual([...tokenCases.map(() => ({ value: { kind: 'transient' } })), { value: { kind: 'failed' } }, { value: null }]);
  expect(fake.requests).toHaveLength(tokenCases.length + 2);

  // The walker is shown red under the mutation 5.3 forbids: a parse error kept as the cause. V8's SyntaxError quotes the body's head.
  let parseError: unknown;
  try { JSON.parse(`${m.access}&refresh_token=${m.refresh}`); } catch (error) { parseError = error; }
  expect(walk(new Error('GITHUB_RENEWAL_UNAVAILABLE', { cause: parseError }), secrets)).toEqual(['rejection.cause: part of access']);
  // And it follows the whole chain, an AggregateError's members and a non-Error cause, down to an 8-character piece.
  const deep = new Error('A', { cause: new AggregateError([new Error('B', { cause: { note: `x${m.refresh.slice(20, 28)}x` } })], 'C') });
  expect(walk(deep, secrets)).toEqual(['rejection.cause.errors[0].cause: part of refresh']);
  expect(walk(new Error(`${m.device.slice(3, 10)}`), secrets)).toEqual([]);   // seven characters are not a finding
  // Any other property an Error carries is walked too, enumerable or not (U7-R2): a debugging field holding the token is a finding.
  expect(walk(Object.assign(new Error('X'), { detail: { auth: m.access } }), secrets)).toEqual(['rejection.detail: part of access']);
  expect(walk(Object.defineProperty(new Error('Y'), 'sent', { value: m.refresh, enumerable: false }), secrets)).toEqual(['rejection.sent: part of refresh']);
  // A non-Error value is read whole (U7-R6): a marker six levels down a plain-object cause, at index 120 of an array, in a Set, or
  // after 20,000 characters of a string is a finding, though inspect's defaults (depth 2, 100 items, 10,000 characters) cut each.
  expect(walk(new Error('Z', { cause: { a: { b: { c: { d: { e: { t: m.access } } } } } } }), secrets)).toEqual(['rejection.cause: part of access']);
  expect(walk(new Error('Z', { cause: { sent: Array.from({ length: 150 }, (_, i) => i === 120 ? m.refresh : 'x') } }), secrets)).toEqual(['rejection.cause: part of refresh']);
  expect(walk(new Error('Z', { cause: new Set(Array.from({ length: 150 }, (_, i) => i === 140 ? m.device : `n${i}`)) }), secrets)).toEqual(['rejection.cause: part of device']);
  expect(walk(new Error('Z', { cause: { body: 'y'.repeat(20_000) + m.access } }), secrets)).toEqual(['rejection.cause: part of access']);
});

/** S-1's static guard (spec 11). */
const NEW_MODULES = ['src/main/github-account-store.ts', 'src/main/github-app.ts', 'src/main/github-credential.ts', 'src/main/github-oauth.ts', 'src/main/github-signin.ts'];
const PANEL = 'src/renderer/GitHubAccountPanel.tsx';
// Any destructuring from process (env among it, at any nesting) and any import or require of process itself (U7-R7), beside
// process.env and process['env'];
// writev(Sync) and a handle's writev() beside write(Sync).
// Child processes and worker threads, by their module names and by the calls that spawn (U7-R10): a token in a child's argv or a worker's
// message reaches a place no scan reads. A child's env is reached through exec too, and through process.getBuiltinModule under a
// computed name (U7-R13), so both are findings.
const FORBIDDEN =/\bconsole\b|\bprocess\s*(?:\.|\[)\s*['"`]?env\b|\}\s*=\s*process\b|(?:\bfrom\s*|\b(?:require|import)\s*\(\s*)['"](?:node:)?process['"]|\b(?:writeFile|appendFile)(?:Sync)?\b|\bcreateWriteStream\b|(?<!\bthis\.|\basync |\bprivate )\bwrite(?:Sync)?\(|\bwritev(?:Sync)?\(|\bcopyFile(?:Sync)?\b|['"](?:node:)?(?:child_process|worker_threads)['"]|\b(?:spawn|exec|execFile|fork|execSync|spawnSync|execFileSync)\s*\(|\bgetBuiltinModule\b/g;
const moduleFindings = (source: string) => [...source.matchAll(FORBIDDEN)].map(match => match[0]);
/** The same findings with their line, so a red guard names the module and the line it found (U7-R10). */
const moduleLines = (source: string) => [...source.matchAll(FORBIDDEN)].map(match => `${source.slice(0, match.index ?? 0).split('\n').length}: ${match[0]}`);
/** U7-R11: atomicJson is called, never held. A reference taken at module load (`const persist = atomicJson`) keeps the real function,
 *  so a write through it is never recorded. Comments are stripped; an import clause is the only other place the name may stand.
 *  U7-R15: an import that renames it (`{ atomicJson as aj }`) and a namespace import of artifact-files (whose export is read under a
 *  computed name) hold the same function under another name, so each is a finding too. */
const withoutComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
// U7-R17: every export the recorder swaps is held to the same rule (privateDirectory is swapped since U7-R16), so a directory made
// through a reference taken at module load is a finding like a write through one. Known limit (U7-R19, S4): a string-named import
// specifier (`{ "atomicJson" as aj }`) and a dynamic import of artifact-files read under a computed name still pass; the fix that
// closes the whole by-reference class is recording at the fs or FileHandle level, set aside with U7-R11 and U7-R15.
const SWAPPED_EXPORTS = ['atomicJson', 'privateDirectory'] as const;
const atomicJsonByReference = (source: string) => {
  const code = withoutComments(source);
  const names = SWAPPED_EXPORTS.join('|');
  const renamed = [...code.matchAll(new RegExp(`\\b(?:${names})\\s+as\\b`, 'g'))].map(match => match[0]);
  const namespace = [...code.matchAll(/\bimport\s*\*\s*as\s+[\w$]+\s+from\s*['"`]\.\.\/models\/artifact-files['"`]/g)].map(match => match[0]);
  const stripped = code.replace(/\bimport\b[^{};]*\{[^}]*\}\s*from\b/g, '');
  return [...renamed, ...namespace, ...[...stripped.matchAll(new RegExp(`\\b(?:${names})\\b(?!\\s*(?:\\?\\.)?\\s*\\()`, 'g'))].map(match => match[0])];
};
/** U7-R12: the new modules import only what is listed here, today's imports and nothing else. A module not on the list (better-sqlite3,
 *  node:fs/promises, a dynamic import) is a finding until it is added on purpose, and a require or import with a computed name is one
 *  too, since its module cannot be read. A `from` after a dot (Buffer.from) is not an import. */
const ALLOWED_IMPORTS = ['node:crypto', 'zod', '../shared', '../shared/github-account', '../models/artifact-files', './github-app', './github-oauth',
  './github-credential', './github-account-store', './vault'];
const importFindings = (source: string) => {
  const code = withoutComments(source);
  return [
    ...[...code.matchAll(/(?<![.\w$])(?:from|import|require)\s*\(?\s*['"`]([^'"`]+)['"`]/g)].map(match => match[1]!).filter(name => !ALLOWED_IMPORTS.includes(name)),
    ...[...code.matchAll(/(?<![.\w$])(?:require|import)\s*\(\s*(?!['"`])/g)].map(match => `non-literal ${match[0].trim()}`),
  ];
};
const panelFindings = (source: string) => [...source.matchAll(/localStorage|sessionStorage|clipboard/g)].map(match => match[0]);

test('S-1 static guard: the new src/main/github-*.ts modules have no console, process.env or direct file write, and the panel no web storage or clipboard', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  // The guard reads every github-*.ts module there is, so a new one cannot escape it unnoticed.
  expect(readdirSync(join(root, 'src', 'main')).filter(name => /^github-.*\.ts$/.test(name)).map(name => `src/main/${name}`).sort()).toEqual(NEW_MODULES);
  for (const file of NEW_MODULES) expect(moduleLines(readFileSync(join(root, file), 'utf8')), file).toEqual([]);
  // atomicJson by reference (U7-R11): the recorder swaps the export on the module object, so only a call through it is recorded.
  for (const file of NEW_MODULES) expect(atomicJsonByReference(readFileSync(join(root, file), 'utf8')), `${file} atomicJson by reference`).toEqual([]);
  // The import allowlist (U7-R12): a write or a spawn through a module that is not on the list is a finding.
  for (const file of NEW_MODULES) expect(importFindings(readFileSync(join(root, file), 'utf8')), `${file} imports outside the allowlist`).toEqual([]);
  expect(panelFindings(readFileSync(join(root, PANEL), 'utf8'))).toEqual([]);
  // The guard's own control: each forbidden form is found.
  // Other spellings of the same forms are found too (U7-R4): a bracketed or destructured console, a bracketed env, the direct writes
  // writeSync and a handle's write(), and copyFile. The store's own private write() and its this.write() calls, which write through
  // atomicJson (the one write S-1 allows), are not findings.
  expect(moduleFindings(['console.info(x);', "console['log'](x);", 'const { log } = console;', 'const a = process.env.X;', "const b = process[ 'env' ].Y;",
    'await writeFile(p, b);', 'appendFileSync(p, b);', 'createWriteStream(p);', 'fs.writeSync(fd, b);', 'await fh.write(b);', 'await copyFile(p, q);',
    'copyFileSync(p, q);', 'written = await this.write(account, retired);', 'private async write(account, retiredRefs) {', 'private write(a) {',
    // The destructured and imported env, any import of process, and the gathered writes (U7-R7).
    'const { env } = process;', 'const { argv, env: e } = process;', 'const { env: { HOME } } = process;', "import { env } from 'node:process';", 'import * as p from "process";',
    "const q = require('node:process');", "const r = await import('process');", 'fs.writevSync(fd, bufs);', 'await fh.writev(bufs);',
    // The child processes and worker threads, by module and by call (U7-R10).
    "import { spawn } from 'node:child_process';", "spawnSync('git', [t]);", 'const w = require("worker_threads");', "exec('true', { env: { GH_TOKEN: t } }, cb);", "const g = (globalThis as any).process.getBuiltinModule(['child', 'process'].join('_'));"].join(' ')))
    .toEqual(['console', 'console', 'console', 'process.env', "process[ 'env", 'writeFile', 'appendFileSync', 'createWriteStream', 'writeSync(', 'write(', 'copyFile', 'copyFileSync',
      '} = process', '} = process', '} = process', "from 'node:process'", 'from "process"', "require('node:process'", "import('process'", 'writevSync(', 'writev(',
      "'node:child_process'", 'spawnSync(', '"worker_threads"', 'exec(', 'getBuiltinModule']);
  // The by-reference control (U7-R11): an import, a comment and a call are not findings; the held reference is.
  expect(atomicJsonByReference("import { atomicJson, removeFile } from '../models/artifact-files';\n// atomicJson renames last\nawait atomicJson(p, v);\nconst persist = atomicJson;")).toEqual(['atomicJson']);
  // U7-R15: a rename at the import is a finding (the alias is the reference), and so is a namespace import of the module.
  expect(atomicJsonByReference("import { atomicJson as aj } from '../models/artifact-files';\nconst p = aj;")).toEqual(['atomicJson as']);
  expect(atomicJsonByReference("import { privateDirectory } from '../models/artifact-files';\nawait privateDirectory(d);\nconst mk = privateDirectory;")).toEqual(['privateDirectory']);   // U7-R17
  expect(atomicJsonByReference("import { privateDirectory as pd } from '../models/artifact-files';\nconst mk = pd;")).toEqual(['privateDirectory as']);
  expect(atomicJsonByReference("import * as af from '../models/artifact-files';\nconst p = (af as any)['atomic' + 'Json'];")).toEqual(["import * as af from '../models/artifact-files'"]);
  // The import control (U7-R12): an allowed module and Buffer.from are not findings; a module off the list and a computed name are.
  expect(importFindings("import Database from 'better-sqlite3';\nconst fs = await import('node:fs/promises');\nconst x = require(name);\nimport { randomUUID } from 'node:crypto';\nconst h = Buffer.from('6869', 'hex');")).toEqual(['better-sqlite3', 'node:fs/promises', 'non-literal require(']);
  expect(panelFindings('localStorage.setItem(); sessionStorage.x; navigator.clipboard.writeText(code);')).toEqual(['localStorage', 'sessionStorage', 'clipboard']);
});
