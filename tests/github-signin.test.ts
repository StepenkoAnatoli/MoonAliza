import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspect } from 'node:util';
import { Vault, type CredentialBinding } from '../src/main/vault';
import { AccountFileSchema, GitHubAccountStore } from '../src/main/github-account-store';
import { DEVICE_PAGE_URL, REQUEST_OFFLINE_ACCESS } from '../src/main/github-app';
import type { Fetcher } from '../src/main/github-credential';
import { GitHubSignIn, type GitHubLimits } from '../src/main/github-signin';
import { GitHubAccountStatusSchema, type GitHubAccountStatus } from '../src/shared/github-account';
import { ROUTES, codeAnswer, errorAnswer, fetcherFor, markers, startFakeGitHubOAuth, tokenAnswer, type FakeGitHubOAuth, type FakeReply, type FakeRequest, type Markers } from './fixtures/fake-github-oauth';

// GitHub sign-in, U5: the lifecycle service's device flow (docs/specification/github-sign-in.md 2, 3.7, 6.1-6.3, 6.6, 6.7;
// "Tests the builders owe", tests/github-signin.test.ts). Fixtures are built from E-01/E-02/E-15 shapes, not a capture: every answer
// comes from the loopback fake's builders, and every token, refresh token and device code is a marker generated at run time (T-1).
// The real Vault runs with the AES fake cryptor of tests/vault.test.ts:9-31. The injected clock starts years away from real time,
// so a grant whose expiry came from it rather than from Date.now() would be refused (3.7, pre-mortem 3). Poll waits go through the
// injected sleep; nothing here waits in real time except on the loopback fake. globalThis.fetch is never stubbed.

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
const CLIENT = 'Iv23-u5-signin-test';
const INSTALL = 'https://github.com/apps/moonaliza-u5-test/installations/new';
const T0 = Date.UTC(2031, 2, 3, 4, 5, 6);   // years from real time: grants must use Date.now() (3.7)
const POLL_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
const LOGIN = 'octo-cat';
const USER: FakeReply = { json: { login: LOGIN, id: 7, name: 'a name', email: 'someone@example.invalid' } };
const RESOURCE_URL = 'https://api.github.com/repos/o/r/contents/f';
const RESOURCES = 'api.github.com/repos/*';
const RESOURCE = 'api.github.com/repos/o/r/contents/f';
const iso = (ms: number) => new Date(ms).toISOString();

let fake: FakeGitHubOAuth;
beforeAll(async () => { fake = await startFakeGitHubOAuth(); });
afterAll(async () => { await fake.close(); });
beforeEach(() => { fake.reset(); });

function gate() { let open!: () => void; const promise = new Promise<void>(resolve => { open = resolve; }); return { promise, open }; }
const tick = (ms = 30) => new Promise<void>(resolve => setTimeout(resolve, ms));
async function until(check: () => boolean | Promise<boolean>, what = 'the condition') {
  await vi.waitFor(async () => { if (!(await check())) throw new Error(`still waiting for ${what}`); }, { timeout: 5_000, interval: 2 });
}
const settle = <T>(promise: Promise<T>) => promise.then(value => ({ value, error: undefined }), (error: unknown) => ({ value: undefined, error }));
const pending = (status: GitHubAccountStatus) => status.state === 'pending';

/** The injected clock and sleep (3.7). A sleep advances the clock by step(ms) (the wait itself by default) and returns at once; while
 *  `gated`, it parks until wake() or its signal. Every wait and every signal is recorded. */
class Clock {
  t: number; gated = false; step: (ms: number) => number = ms => ms;
  readonly waits: number[] = []; readonly signals: AbortSignal[] = [];
  private readonly parked: Array<{ wake: () => void }> = [];
  constructor(t0: number) { this.t = t0; }
  readonly now = () => this.t;
  readonly sleep = (ms: number, signal: AbortSignal): Promise<void> => {
    this.waits.push(ms); this.signals.push(signal);
    if (!this.gated) { this.t += this.step(ms); return Promise.resolve(); }
    return new Promise<void>(resolve => {
      const remove = () => { const index = this.parked.indexOf(entry); if (index >= 0) this.parked.splice(index, 1); };
      const entry = { wake: () => { remove(); this.t += this.step(ms); resolve(); } };
      this.parked.push(entry);
      signal.addEventListener('abort', () => { remove(); resolve(); }, { once: true });
    });
  };
  get sleeping() { return this.parked.length; }
  wake() { this.parked[0]?.wake(); }
}

type Op = 'saveStaged' | 'commit' | 'withSecret' | 'grant';
type GrantInput = Parameters<Vault['grant']>[0];
/** The real vault behind optional hooks: a hook runs before the call and may wait (a gate) or throw (a failure). It logs grants and
 *  decrypts by ref, never a secret. */
class HookedVault {
  readonly grants: Array<{ ref: string; contextId: string; purpose: string; expiresAt: number; at: number }> = [];
  readonly decrypts: string[] = [];
  private readonly hooks = new Map<Op, (ref: string) => unknown>();
  constructor(readonly real: Vault) {}
  on(op: Op, hook?: (ref: string) => unknown) { if (hook) this.hooks.set(op, hook); else this.hooks.delete(op); return this; }
  async saveStaged(secret: string): Promise<string> { await this.hooks.get('saveStaged')?.(''); return this.real.saveStaged(secret); }
  async commit(ref: string): Promise<void> { await this.hooks.get('commit')?.(ref); return this.real.commit(ref); }
  tombstone(ref: string): Promise<void> { return this.real.tombstone(ref); }
  remove(ref: string): Promise<void> { return this.real.remove(ref); }
  has(ref: string): Promise<boolean> { return this.real.has(ref); }
  grant(binding: GrantInput): string {
    this.grants.push({ ref: binding.secretRef, contextId: binding.contextId, purpose: binding.purpose, expiresAt: binding.expiresAt, at: Date.now() });
    this.hooks.get('grant')?.(binding.secretRef);
    return this.real.grant(binding);
  }
  async withSecret<T>(capability: string, binding: CredentialBinding, operation: (secret: string) => T | Promise<T>): Promise<T> {
    this.decrypts.push(binding.secretRef);
    const hook = this.hooks.get('withSecret'); if (hook) await hook(binding.secretRef);
    return this.real.withSecret(capability, binding, operation);
  }
  revokeContext(contextId: string): void { this.real.revokeContext(contextId); }
  liveGrants(): number { return (this.real as unknown as { grants: Map<string, unknown> }).grants.size; }
}

interface Options {
  config?: { clientId: string; installUrl: string; offlineAccess?: boolean } | null;
  encryption?: boolean;
  storeClient?: string;
  fetcher?: (inner: Fetcher) => Fetcher;
  limits?: Partial<GitHubLimits>;
  store?: (file: string, vault: HookedVault, clientId: string) => GitHubAccountStore;
  root?: string;
}
const opened: Array<{ root: string; service: GitHubSignIn }> = [];
afterEach(async () => {
  for (const { root, service } of opened.splice(0)) { service.cancel(); await service.close(); await rm(root, { recursive: true, force: true }); }
});

async function harness(o: Options = {}) {
  const root = o.root ?? await mkdtemp(join(tmpdir(), 'moonaliza-github-signin-'));
  const vaultDir = join(root, 'vault'); const file = join(root, 'github', 'account.json');
  const real = new Vault(vaultDir, cryptor); await real.initialize('epoch-1');
  const vault = new HookedVault(real);
  const clientId = o.storeClient ?? CLIENT;
  const store = o.store ? o.store(file, vault, clientId) : new GitHubAccountStore(file, vault, clientId);
  await store.open();
  const clock = new Clock(T0);
  const calls: string[] = [];
  const routed = fetcherFor(fake);
  const counted: Fetcher = (url, init) => { calls.push(url); return routed(url, init); };
  let epoch = 'epoch-1';
  const config = o.config === null ? undefined : o.config ?? { clientId: CLIENT, installUrl: INSTALL };
  const service = new GitHubSignIn({ store, vault, epoch: () => epoch, encryptionAvailable: () => o.encryption ?? true,
    fetcher: o.fetcher ? o.fetcher(counted) : counted, config, now: clock.now, sleep: clock.sleep,
    limits: { requestTimeoutMs: 2_000, quitWaitMs: 2_000, ...o.limits } });
  opened.push({ root, service });
  const h = {
    root, vaultDir, file, real, vault, store, clock, service, calls,
    restartEngine(next: string) { epoch = next; real.setEpoch(next); },
    index(): Record<string, { state: string }> {
      try { return (JSON.parse(readFileSync(join(vaultDir, 'index.json'), 'utf8')) as { entries: Record<string, { state: string }> }).entries; } catch { return {}; }
    },
    /** index.json's bytes, or null while the vault has never persisted. */
    indexBytes(): Buffer | null { const path = join(vaultDir, 'index.json'); return existsSync(path) ? readFileSync(path) : null; },
    secretOf(ref: string): string { return cryptor.decryptString(readFileSync(join(vaultDir, `${ref}.bin`))); },
    async file_(): Promise<ReturnType<typeof AccountFileSchema.parse> | null> { return existsSync(file) ? AccountFileSchema.parse(JSON.parse(await readFile(file, 'utf8'))) : null; },
    /** The next start, as index.ts runs it: open, reconcile with the store's references, finishStartup. */
    async reopen() {
      const vault2 = new Vault(vaultDir, cryptor); await vault2.initialize('epoch-r');
      const store2 = new GitHubAccountStore(file, vault2, CLIENT); await store2.open();
      await vault2.reconcile(new Set(store2.references())); await store2.finishStartup();
      return { vault: vault2, store: store2 };
    },
    /** An account signed in before this test's flow (a "Sign in again" starting point), older than any hold. */
    async seed(m: Markers, accessLeftMs = 3_600_000) {
      fake.register({ oldAccess: m.access, oldRefresh: m.refresh });
      const age = 600_000;
      const account = await store.replace({ access: m.access, refresh: m.refresh, accessExpiresInS: (age + accessLeftMs) / 1000, refreshExpiresInS: (age + 86_400_000) / 1000 },
        clock.t - age, 'sign-in', () => true);
      if (!account) throw new Error('seed not admitted');
      return account;
    },
    /** One read through the credential, as the reader makes it (7.1): the fetcher is called synchronously inside send(). */
    async read(signal: AbortSignal = new AbortController().signal) {
      const sent = await service.send(authorization => counted(RESOURCE_URL, { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', signal,
        headers: authorization === undefined ? { Accept: 'application/vnd.github+json' } : { Accept: 'application/vnd.github+json', Authorization: authorization } }), signal);
      await sent.response.text();
      return { status: sent.response.status, authenticated: sent.authenticated };
    },
    /** Every write of account.json fails from now on (a directory where atomicJson renames), until restoreWrites(). */
    breakWrites() { if (existsSync(file)) renameSync(file, `${file}.aside`); mkdirSync(join(file, 'blocker'), { recursive: true }); },
    restoreWrites() { rmSync(file, { recursive: true, force: true }); if (existsSync(`${file}.aside`)) renameSync(`${file}.aside`, file); },
  };
  return h;
}
type Harness = Awaited<ReturnType<typeof harness>>;
const refsOf = (account: { accessRef: string; refreshRef: string | null } | null | undefined) => !account ? [] : account.refreshRef === null ? [account.accessRef] : [account.accessRef, account.refreshRef];
/** Names the markers so each request records which one it carries. */
function register(m: Markers, prefix = '') { fake.register({ [`${prefix}access`]: m.access, [`${prefix}refresh`]: m.refresh, [`${prefix}device`]: m.device }); }
/** Starts a flow whose step 1 answers with m's code (E-01 l.122-132 shape). */
async function begin(h: Harness, m: Markers, fields: Record<string, unknown> = {}) {
  register(m); fake.answer(ROUTES.device, codeAnswer(m, fields));
  const status = await h.service.start();
  expect(status).toMatchObject({ state: 'pending', userCode: m.userCode, committed: false });
  return status;
}
const ended = (h: Harness) => until(() => !pending(h.service.status()), 'the flow to end');
/** L-7: once a flow has ended or reached its commit point, neither the service nor the store holds its device code or a token. */
function expectNotHeld(h: Harness, ...all: Markers[]) {
  const text = inspect(h.service, { depth: 20, showHidden: true }) + inspect(h.store, { depth: 20, showHidden: true });
  for (const m of all) for (const secret of [m.access, m.refresh, m.device]) expect(text.includes(secret)).toBe(false);
}
/** No marker of any kind in a value that crosses to the renderer (S-1, F-21). */
function expectNoMarker(value: unknown, ...all: Markers[]) {
  const text = JSON.stringify(value);
  for (const m of all) for (const secret of [m.access, m.refresh, m.device]) expect(text.includes(secret)).toBe(false);
}

// ---- 1, 2, 2b: start ----

test('1. start refuses NOT_IMPLEMENTED when not configured and ENCRYPTION_UNAVAILABLE without encryption, before any request', async () => {
  for (const config of [null, { clientId: '', installUrl: INSTALL }, { clientId: CLIENT, installUrl: '' }]) {
    const h = await harness({ config });
    await expect(h.service.start()).rejects.toThrow(/^NOT_IMPLEMENTED$/);
    expect(h.service.status()).toEqual({ state: 'not-configured' });
  }
  const h = await harness({ encryption: false });
  await expect(h.service.start()).rejects.toThrow(/^ENCRYPTION_UNAVAILABLE$/);
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
  expect(fake.requests).toHaveLength(0); expect(h.calls).toHaveLength(0); expect(h.clock.waits).toEqual([]);
});

test('2. a step-1 failure ends with start-failed, disabled, client-rejected or rate-limited, and no poll follows', async () => {
  const m = markers();
  const cases: Array<[string, FakeReply, string]> = [
    ['device_flow_disabled at 200', errorAnswer('device_flow_disabled'), 'disabled'],
    ['device_flow_disabled at 400', errorAnswer('device_flow_disabled', 400), 'disabled'],
    ['incorrect_client_credentials at 200', errorAnswer('incorrect_client_credentials'), 'client-rejected'],
    ['incorrect_client_credentials at 401', errorAnswer('incorrect_client_credentials', 401), 'client-rejected'],
    ['a 429', { status: 429, headers: { 'retry-after': '30' } }, 'rate-limited'],
    ['a 403 with remaining 0', { status: 403, headers: { 'x-ratelimit-remaining': '0' }, json: { message: 'limited' } }, 'rate-limited'],
    ['another error code', errorAnswer('something_new'), 'start-failed'],
    ['a 500', { status: 500, json: { message: 'down' } }, 'start-failed'],
    ['a 404 without error', { status: 404, json: { message: 'Not Found' } }, 'start-failed'],
    ['a reset', { reset: true }, 'start-failed'],
    ['verification_uri with a trailing slash', codeAnswer(m, { verification_uri: `${DEVICE_PAGE_URL}/` }), 'start-failed'],
    ['verification_uri on another host', codeAnswer(m, { verification_uri: 'https://github.example/login/device' }), 'start-failed'],
    ['verification_uri over http', codeAnswer(m, { verification_uri: 'http://github.com/login/device' }), 'start-failed'],
    ['a user_code outside the schema', codeAnswer(m, { user_code: 'not a code' }), 'start-failed'],
  ];
  for (const [name, reply, outcome] of cases) {
    const h = await harness(); fake.reset(); fake.answer(ROUTES.device, reply);
    const status = await h.service.start();
    expect([name, status]).toEqual([name, { state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: outcome }]);
    await tick(10);
    expect([name, fake.to(ROUTES.device).length, fake.to(ROUTES.token).length, h.clock.waits]).toEqual([name, 1, 0, []]);
  }
});

test('2b. the step-1 scope follows the constant: {client_id} with offlineAccess false, {client_id, scope} by default (GS-5)', async () => {
  const off = await harness({ config: { clientId: CLIENT, installUrl: INSTALL, offlineAccess: false } });
  fake.answer(ROUTES.device, errorAnswer('device_flow_disabled'));
  await off.service.start();
  const byDefault = await harness();
  fake.answer(ROUTES.device, errorAnswer('device_flow_disabled'));
  await byDefault.service.start();
  const [first, second] = fake.to(ROUTES.device);
  expect(REQUEST_OFFLINE_ACCESS).toBe(true);
  expect(first!.bodyKeys.sort()).toEqual(['client_id']); expect(first!.body.client_id).toBe(CLIENT);
  expect(second!.bodyKeys.sort()).toEqual(['client_id', 'scope']); expect(second!.body).toEqual({ client_id: CLIENT, scope: 'offline_access' });
  for (const request of [first!, second!]) { expect(request.method).toBe('POST'); expect(request.queryKeys).toEqual([]); expect(request.clientSecret).toBe(false); }
});

// ---- 3-7: the poll loop ----

test('3. the first poll waits interval, polls stay at least interval apart, and slow_down adds 5 s or takes a larger interval', async () => {
  const h = await harness(); const m = markers(); const at: number[] = [];
  const poll = (reply: FakeReply) => () => { at.push(h.clock.t); return reply; };
  fake.answer(ROUTES.token, poll(errorAnswer('authorization_pending')), poll(errorAnswer('slow_down')), poll(errorAnswer('slow_down', 200, { interval: 30 })),
    poll(errorAnswer('slow_down', 400, { interval: 2 })), poll(tokenAnswer(m)));
  fake.answer(ROUTES.user, USER);
  await begin(h, m, { interval: 5 });
  await ended(h);
  expect(h.service.status()).toMatchObject({ state: 'signed-in', login: LOGIN, lastOutcome: null });
  expect(h.clock.waits).toEqual([5_000, 5_000, 10_000, 30_000, 35_000]);
  expect(at.map(t => t - T0)).toEqual([5_000, 10_000, 20_000, 50_000, 85_000]);
  for (const request of fake.to(ROUTES.token)) {
    expect(request.method).toBe('POST'); expect(request.queryKeys).toEqual([]); expect(request.clientSecret).toBe(false);
    expect(request.bodyKeys.sort()).toEqual(['client_id', 'device_code', 'grant_type']);
    expect(request.body).toEqual({ client_id: CLIENT, device_code: m.device, grant_type: POLL_GRANT });
  }
});

const TERMINAL: Array<[string, string]> = [
  ['expired_token', 'expired'], ['token_expired', 'expired'], ['incorrect_device_code', 'restart'], ['bad_verification_code', 'restart'],
  ['access_denied', 'denied'], ['device_flow_disabled', 'disabled'], ['incorrect_client_credentials', 'client-rejected'],
  ['unsupported_grant_type', 'grant-unsupported'], ['unverified_user_email', 'email-unverified'], ['a_code_nobody_documented', 'failed'],
  ['constructor', 'failed'], ['toString', 'failed'],
];
test.each(TERMINAL.flatMap(([code, outcome]) => [[code, 200, outcome], [code, 400, outcome]] as Array<[string, number, string]>))(
  '4. the poll answer %s at %i ends the flow %s and stores nothing', async (code, status, outcome) => {
    const h = await harness(); const m = markers();
    fake.answer(ROUTES.token, errorAnswer(code, status));
    await begin(h, m); await ended(h);
    expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: outcome });
    await tick(10);
    expect(fake.to(ROUTES.token)).toHaveLength(1); expect(fake.to(ROUTES.user)).toHaveLength(0);
    expect(h.index()).toEqual({}); expect(existsSync(h.file)).toBe(false); expect(h.store.current()).toBeNull();
    expectNotHeld(h, m);
  });

test('4b. a malformed or unusable poll answer ends the flow failed and stores nothing (F-4)', async () => {
  const cases: Array<[string, (m: Markers) => FakeReply]> = [
    ['a token with another prefix', m => tokenAnswer({ access: `gho_${m.access.slice(4)}`, refresh: m.refresh })],
    ['a token holding a space', m => tokenAnswer({ access: `${m.access} x`, refresh: m.refresh })],
    ['a refresh token with another prefix', m => tokenAnswer({ access: m.access, refresh: `ghx_${m.refresh.slice(4)}` })],
    ['a 2xx without access_token', () => ({ json: { token_type: 'bearer', scope: '' } })],
    ['a 302', () => ({ status: 302, headers: { location: 'https://elsewhere.example/' } })],
    ['a 401 with a message', () => ({ status: 401, json: { message: 'Bad credentials' } })],
  ];
  for (const [name, reply] of cases) {
    const h = await harness(); fake.reset(); const m = markers();
    fake.answer(ROUTES.token, reply(m));
    await begin(h, m); await ended(h);
    expect([name, h.service.status()]).toEqual([name, { state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: 'failed' }]);
    expect([name, h.index(), existsSync(h.file), fake.to(ROUTES.user).length]).toEqual([name, {}, false, 0]);
  }
});

test('5. a rate-limited poll waits, then resumes; a wait that would pass the deadline ends rate-limited with no further poll', async () => {
  const h = await harness(); const m = markers();
  fake.answer(ROUTES.token, { status: 429, headers: { 'retry-after': '20' }, json: { message: 'slow' } },
    { status: 403, headers: { 'x-ratelimit-remaining': '0' }, json: { message: 'limited' } }, errorAnswer('authorization_pending'), tokenAnswer(m));
  fake.answer(ROUTES.user, USER);
  await begin(h, m, { interval: 5, expires_in: 900 }); await ended(h);
  expect(h.service.status()).toMatchObject({ state: 'signed-in', lastOutcome: null });
  expect(h.clock.waits).toEqual([5_000, 20_000, 60_000, 5_000]);   // retry-after; the 60 s floor; then interval again

  const late = await harness(); const m2 = markers();
  fake.answer(ROUTES.token, { status: 429, headers: { 'retry-after': '120' }, json: { message: 'slow' } });
  await begin(late, m2, { interval: 5, expires_in: 60 }); await ended(late);
  expect(late.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: 'rate-limited' });
  await tick(10);
  expect(fake.to(ROUTES.token).filter(request => request.body.device_code === m2.device)).toHaveLength(1);
  expect(late.clock.waits).toEqual([5_000]);
});

test('6. a forward clock jump during a wait ends expired with no poll sent; a clock running backwards ends at maxPolls; the lifetime is capped', async () => {
  const h = await harness(); const m = markers();
  h.clock.step = ms => ms + 3_600_000;
  await begin(h, m, { expires_in: 900, interval: 5 }); await ended(h);
  expect(h.service.status()).toMatchObject({ state: 'signed-out', lastOutcome: 'expired' });
  expect(fake.to(ROUTES.token)).toHaveLength(0);

  const back = await harness(); const m2 = markers();
  back.clock.step = () => -1_000;
  fake.always(ROUTES.token, errorAnswer('authorization_pending'));
  await begin(back, m2, { expires_in: 60, interval: 5 }); await ended(back);
  expect(back.service.status()).toMatchObject({ state: 'signed-out', lastOutcome: 'expired' });
  expect(fake.to(ROUTES.token)).toHaveLength(Math.ceil(60 / 5) + 2);

  const capped = await harness(); const m3 = markers();
  capped.clock.gated = true;
  const status = await begin(capped, m3, { expires_in: 7_200 });
  expect(status).toMatchObject({ codeExpiresAt: iso(T0 + 1_800_000) });
  capped.service.cancel();
});

test('7. three consecutive transient polls continue; a fourth ends the flow failed', async () => {
  const transient: FakeReply[] = [{ status: 500, json: { message: 'down' } }, { reset: true }, { status: 200, headers: { 'content-type': 'application/json' }, text: '{"access_token":' }];
  const h = await harness(); const m = markers();
  fake.answer(ROUTES.token, ...transient, tokenAnswer(m)); fake.answer(ROUTES.user, USER);
  await begin(h, m); await ended(h);
  expect(h.service.status()).toMatchObject({ state: 'signed-in', lastOutcome: null });

  const four = await harness(); const m2 = markers();
  fake.answer(ROUTES.token, ...transient, { status: 503, json: { message: 'down' } });
  await begin(four, m2); await ended(four);
  expect(four.service.status()).toMatchObject({ state: 'signed-out', lastOutcome: 'failed' });
  expect(fake.to(ROUTES.token).filter(request => request.body.device_code === m2.device)).toHaveLength(4);

  const streak = await harness(); const m3 = markers();   // a non-transient answer ends the streak
  fake.answer(ROUTES.token, ...transient, errorAnswer('authorization_pending'), ...transient, { status: 502, json: {} });
  await begin(streak, m3); await ended(streak);
  expect(streak.service.status()).toMatchObject({ state: 'signed-out', lastOutcome: 'failed' });
  expect(fake.to(ROUTES.token).filter(request => request.body.device_code === m3.device)).toHaveLength(8);
});

// ---- 8: the commit point and the login ----

test('8. success stores two vault values with expiries at receipt plus seconds, then reads the login once with the new token', async () => {
  const h = await harness(); const m = markers();
  fake.answer(ROUTES.token, tokenAnswer(m)); fake.answer(ROUTES.user, USER);
  await begin(h, m, { interval: 5 }); await ended(h);
  const receivedAt = T0 + 5_000;
  const file = await h.file_();
  expect(file?.account).toEqual({ clientId: CLIENT, accessRef: expect.any(String), refreshRef: expect.any(String), accessExpiresAt: iso(receivedAt + 28_800_000),
    refreshExpiresAt: iso(receivedAt + 15_897_600_000), obtainedAt: iso(receivedAt), login: LOGIN });
  expect(h.secretOf(file!.account!.accessRef)).toBe(m.access); expect(h.secretOf(file!.account!.refreshRef!)).toBe(m.refresh);
  expect(Object.entries(h.index()).map(([ref, entry]) => [ref, entry.state]).sort()).toEqual(refsOf(file!.account).map(ref => [ref, 'committed']).sort());
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
  const [user] = fake.to(ROUTES.user);
  expect(fake.to(ROUTES.user)).toHaveLength(1);
  expect(user).toMatchObject({ method: 'GET', authorization: 'marker', authorizationMarker: 'access', queryKeys: [] });
  // The login read's grant: the github purpose, a github:user: context, an expiry from Date.now(), revoked afterwards (3.8).
  expect(h.vault.grants.filter(grant => grant.contextId.startsWith('github:user:'))).toEqual([
    { ref: file!.account!.accessRef, contextId: expect.stringMatching(/^github:user:[0-9a-f-]{36}$/), purpose: 'github', expiresAt: expect.any(Number), at: expect.any(Number) }]);
  for (const grant of h.vault.grants) { expect(grant.expiresAt - grant.at).toBeLessThanOrEqual(30_000); expect(grant.expiresAt).toBeGreaterThan(grant.at); }
  expect(h.vault.liveGrants()).toBe(0);
  expectNotHeld(h, m);
});

test('8b. a non-expiring token stores one entry with null expiries; a failed login read keeps the account with login null', async () => {
  const h = await harness(); const m = markers();
  fake.answer(ROUTES.token, tokenAnswer(m, { expires_in: undefined, refresh_token: undefined, refresh_token_expires_in: undefined }));
  fake.answer(ROUTES.user, { status: 500, json: { message: 'down' } });
  await begin(h, m); await ended(h);
  const file = await h.file_();
  expect(file?.account).toMatchObject({ refreshRef: null, accessExpiresAt: null, refreshExpiresAt: null, login: null });
  expect(Object.keys(h.index())).toEqual([file!.account!.accessRef]);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: null, renewalHeld: false, lastOutcome: null });
});

test('8c. the status stays pending with committed true, and the account in it, until the login read ends', async () => {
  const h = await harness(); const m = markers(); const login = gate();
  fake.answer(ROUTES.token, tokenAnswer(m));
  fake.answer(ROUTES.user, async () => { await login.promise; return USER; });
  await begin(h, m);
  await until(() => fake.to(ROUTES.user).length === 1, 'the login read');
  const during = h.service.status();
  expect(during).toEqual({ state: 'pending', userCode: m.userCode, codeExpiresAt: iso(T0 + 900_000), committed: true, account: { login: null } });
  expect(GitHubAccountStatusSchema.parse(during)).toEqual(during);
  login.open(); await ended(h);
  expect(h.service.status()).toMatchObject({ state: 'signed-in', login: LOGIN });
});

// ---- 9-11: Cancel, a new start, sign-out, Sign in again ----

test('9. Cancel during a wait aborts it and sends no further poll', async () => {
  const h = await harness(); const m = markers();
  h.clock.gated = true;
  await begin(h, m);
  await until(() => h.clock.sleeping === 1, 'the first wait');
  expect(h.service.cancel()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: 'cancelled' });
  expect(h.clock.signals[0]!.aborted).toBe(true);
  h.clock.gated = false; await tick(30);
  expect(fake.to(ROUTES.token)).toHaveLength(0); expect(h.clock.sleeping).toBe(0);
  expectNotHeld(h, m);
});

test('9b. Cancel while a poll is in flight discards its answer, even a success that arrives after the Cancel', async () => {
  const answered: string[] = []; const release = gate();
  // This fetcher does not pass the abort on, as when an answer is already on its way: the service's own discard must drop it.
  const h = await harness({ fetcher: inner => (url, init) => { const sent = inner(url, { ...init, signal: undefined }); void sent.then(() => answered.push(url), () => {}); return sent; } });
  const m = markers();
  fake.answer(ROUTES.token, async () => { await release.promise; return tokenAnswer(m); });
  fake.answer(ROUTES.user, USER);
  await begin(h, m);
  await until(() => fake.to(ROUTES.token).length === 1, 'the poll');
  const indexBefore = h.indexBytes();                                          // no vault write yet: index.json may not exist
  expect(h.service.cancel()).toMatchObject({ state: 'signed-out', lastOutcome: 'cancelled' });
  release.open();
  await until(() => answered.filter(url => url.endsWith('/access_token')).length === 1, 'the answer');
  await tick(60);
  expect(h.store.current()).toBeNull(); expect(existsSync(h.file)).toBe(false);
  expect(h.indexBytes()).toEqual(indexBefore);
  expect(readdirSync(h.vaultDir).filter(name => name.endsWith('.bin'))).toEqual([]);
  expect(fake.to(ROUTES.user)).toHaveLength(0);
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: 'cancelled' });
});

test('9c. from the commit point Cancel is a no-op: the login still arrives with no outcome, and a new start sends no request (DC-5)', async () => {
  const h = await harness(); const m = markers(); const login = gate();
  fake.answer(ROUTES.token, tokenAnswer(m));
  fake.answer(ROUTES.user, async () => { await login.promise; return USER; });
  await begin(h, m);
  await until(() => fake.to(ROUTES.user).length === 1, 'the login read');
  expect(h.service.cancel()).toMatchObject({ state: 'pending', committed: true });
  expect(await h.service.start()).toMatchObject({ state: 'pending', committed: true });
  expect(fake.to(ROUTES.device)).toHaveLength(1);
  login.open(); await ended(h);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
  expect(fake.to(ROUTES.device)).toHaveLength(1);
});

test('10. a new start cancels the pending flow with no outcome, and so does signOut; status() sends nothing', async () => {
  const h = await harness(); const a = markers(); const b = markers();
  h.clock.gated = true;
  await begin(h, a);
  await until(() => h.clock.sleeping === 1, 'the first wait');
  await begin(h, b);
  expect(h.clock.signals[0]!.aborted).toBe(true);
  expect(h.service.status()).toMatchObject({ state: 'pending', userCode: b.userCode });
  await until(() => h.clock.sleeping === 1, 'the second flow waiting');
  const before = fake.requests.length;
  for (let i = 0; i < 100; i++) h.service.status();
  expect(fake.requests).toHaveLength(before);
  expect(await h.service.signOut()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
  expect(h.clock.signals[1]!.aborted).toBe(true);
  h.clock.gated = false; await tick(30);
  expect(fake.to(ROUTES.token)).toHaveLength(0); expect(fake.requests).toHaveLength(before);
});

test('10b. an engine restart mid-flow has no effect, and the login read re-grants once when a restart lands between grant and use', async () => {
  const h = await harness(); const m = markers();
  h.clock.gated = true;
  fake.answer(ROUTES.token, tokenAnswer(m)); fake.answer(ROUTES.user, USER);
  await begin(h, m);
  await until(() => h.clock.sleeping === 1, 'the first wait');
  h.restartEngine('epoch-2');
  let restarts = 0;
  h.vault.on('withSecret', () => { if (restarts++ === 0) h.restartEngine('epoch-3'); });   // between the login read's grant and its use
  h.clock.gated = false; h.clock.wake(); await ended(h);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
  expect(h.vault.grants.filter(grant => grant.contextId.startsWith('github:user:'))).toHaveLength(2);
  expect(fake.to(ROUTES.user)).toHaveLength(1);
});

test('11. Sign in again: the old account is used during the flow and kept on cancel or failure; on success its refs are tombstoned and removed', async () => {
  const h = await harness(); const old = markers(); const account = await h.seed(old);
  fake.always(RESOURCES, { json: { ok: true } });
  h.clock.gated = true;
  const first = markers(); await begin(h, first);
  expect(h.service.status()).toMatchObject({ state: 'pending', account: { login: null } });
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(fake.to(RESOURCE).at(-1)).toMatchObject({ authorizationMarker: 'oldAccess' });
  expect(h.service.cancel()).toMatchObject({ state: 'signed-in', lastOutcome: 'cancelled' });
  expect(h.store.current()).toBe(account);

  h.clock.gated = false;
  const second = markers(); fake.answer(ROUTES.token, errorAnswer('access_denied'));
  await begin(h, second); await ended(h);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: null, renewalHeld: false, lastOutcome: 'denied' });
  expect(h.store.current()).toBe(account);

  const third = markers(); fake.answer(ROUTES.token, tokenAnswer(third)); fake.answer(ROUTES.user, USER);
  await begin(h, third); await ended(h);
  const now = h.store.current()!;
  expect(h.secretOf(now.accessRef)).toBe(third.access);
  expect(Object.keys(h.index()).sort()).toEqual(refsOf(now).sort());
  for (const ref of refsOf(account)) expect(existsSync(join(h.vaultDir, `${ref}.bin`))).toBe(false);
  expect((await h.file_())?.retiredRefs).toEqual([]);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
});

// ---- 12, 13: the status and the pages ----

test('12. every status during a flow parses with the schema and carries no marker (F-21, S-1)', async () => {
  const h = await harness(); const m = markers(); register(m);
  const seen: GitHubAccountStatus[] = []; const take = () => { seen.push(h.service.status()); };
  const step1 = gate(); const poll = gate(); const save = gate(); const login = gate();
  fake.answer(ROUTES.device, async () => { await step1.promise; return codeAnswer(m); });
  fake.answer(ROUTES.token, async () => { await poll.promise; return tokenAnswer(m); });
  fake.answer(ROUTES.user, async () => { await login.promise; return USER; });
  h.clock.gated = true;
  take();
  const started = h.service.start();
  await until(() => fake.to(ROUTES.device).length === 1, 'step 1'); take();                 // F1 projects as the state before it
  step1.open(); seen.push(await started);
  await until(() => h.clock.sleeping === 1, 'the wait'); take();                              // F2
  h.clock.gated = false; h.clock.wake();
  await until(() => fake.to(ROUTES.token).length === 1, 'the poll'); take();                 // F3
  let saves = 0; h.vault.on('saveStaged', async () => { if (saves++ === 0) await save.promise; });
  poll.open();
  await until(() => saves === 1, 'the commit point'); take();                                 // F4
  save.open();
  await until(() => fake.to(ROUTES.user).length === 1, 'the login read'); take();            // F5
  login.open(); await ended(h); take();
  expect(seen.map(status => status.state)).toEqual(['signed-out', 'signed-out', 'pending', 'pending', 'pending', 'pending', 'pending', 'signed-in']);
  expect(seen.map(status => status.state === 'pending' ? status.committed : null)).toEqual([null, null, false, false, false, true, true, null]);
  for (const status of seen) { expect(GitHubAccountStatusSchema.parse(status)).toEqual(status); expectNoMarker(status, m); }
  expect(JSON.stringify(seen)).not.toMatch(/verification_uri|interval|device_code|Ref"|clientId|Iv23/);
});

test('13. openTarget: the device page only while pending, else NOT_FOUND; the install URL only when configured, else NOT_IMPLEMENTED', async () => {
  const h = await harness(); const m = markers();
  expect(() => h.service.openTarget('device')).toThrow(/^NOT_FOUND$/);
  expect(h.service.openTarget('install')).toBe(INSTALL);
  h.clock.gated = true;
  await begin(h, m);
  expect(h.service.openTarget('device')).toBe(DEVICE_PAGE_URL);
  h.service.cancel();
  expect(() => h.service.openTarget('device')).toThrow(/^NOT_FOUND$/);
  const off = await harness({ config: null });
  expect(() => off.service.openTarget('install')).toThrow(/^NOT_IMPLEMENTED$/);
  expect(() => off.service.openTarget('device')).toThrow(/^NOT_FOUND$/);
  expect(fake.to(ROUTES.device)).toHaveLength(1);
});

// ---- 14-17: the commit point against refreshes, clears and sign-outs ----

test('14. a refresh that commits while the sign-in waits on the lock: the sign-in is still admitted and the refreshed pair is retired (DC-4)', async () => {
  const h = await harness(); const old = markers(); const signIn = markers(); const refreshed = markers();
  await h.seed(old, 200_000);                                                  // inside the 300 s margin: a read refreshes
  register(refreshed, 'new'); fake.always(RESOURCES, { json: { ok: true } }); fake.answer(ROUTES.user, USER);
  const poll = gate(); const held = gate(); let saves = 0; let holding = false;
  fake.always(ROUTES.token, async (request: FakeRequest) => {
    if (request.body.grant_type === 'refresh_token') return tokenAnswer(refreshed);
    await poll.promise; return tokenAnswer(signIn);
  });
  await begin(h, signIn);
  await until(() => fake.to(ROUTES.token).length === 1, 'the poll');
  h.vault.on('saveStaged', async () => { if (saves++ === 0) { holding = true; await held.promise; } });   // the refresh's replace holds the lock
  const read = settle(h.read());
  await until(() => holding, 'the refresh holding the lock');
  poll.open();
  await until(() => { const status = h.service.status(); return status.state === 'pending' && status.committed; }, 'the commit point');
  held.open();
  await ended(h);
  expect((await read).error).toBeUndefined();
  const live = h.store.current()!;
  expect(h.secretOf(live.accessRef)).toBe(signIn.access);
  expect(refsOf((await h.file_())?.account)).toEqual(refsOf(live));
  expect(Object.keys(h.index()).sort()).toEqual(refsOf(live).sort());       // the refreshed pair is retired and removed
  expect(fake.to(ROUTES.token).filter(request => request.body.grant_type === 'refresh_token')).toHaveLength(1);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
});

test('14b. bad_refresh_token clears the old account while the sign-in is at its commit point: the sign-in is still admitted, live and named (DC-4)', async () => {
  const h = await harness(); const old = markers(); const signIn = markers();
  await h.seed(old, 200_000);
  fake.answer(ROUTES.user, USER);
  fake.always(ROUTES.token, (request: FakeRequest) => request.body.grant_type === 'refresh_token' ? errorAnswer('bad_refresh_token', 400) : tokenAnswer(signIn));
  const held = gate(); let saves = 0; let holding = false;
  h.vault.on('saveStaged', async () => { if (saves++ === 0) { holding = true; await held.promise; } });   // the sign-in's replace, step 2
  await begin(h, signIn);
  await until(() => holding, 'the sign-in at its commit point');
  const read = settle(h.read());                                               // the refresh answers bad_refresh_token: an app clear
  await until(() => h.store.current() === null, 'the app clear\'s prologue');
  held.open();
  expect((await read).error).toMatchObject({ message: 'GITHUB_SIGN_IN_REQUIRED' });
  await ended(h);
  const live = h.store.current()!;
  expect(h.secretOf(live.accessRef)).toBe(signIn.access);
  expect(refsOf((await h.file_())?.account)).toEqual(refsOf(live));
  expect(Object.keys(h.index()).sort()).toEqual(refsOf(live).sort());
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
});

test.each(['saveStaged', 'commit'] as const)('14c. a sign-out while the sign-in is at its commit point (held at %s): nothing stays stored and no outcome is recorded', async op => {
  const h = await harness(); const m = markers(); const held = gate(); let holding = false; let calls = 0;
  fake.answer(ROUTES.token, tokenAnswer(m)); fake.answer(ROUTES.user, USER);
  h.vault.on(op, async () => { if (calls++ === 0) { holding = true; await held.promise; } });
  await begin(h, m);
  await until(() => holding, 'the commit point');
  const signOut = h.service.signOut();
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
  held.open();
  expect(await signOut).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
  await tick(30);
  expect(h.store.current()).toBeNull(); expect(h.index()).toEqual({});
  expect((await h.file_())?.account ?? null).toBeNull();
  expect(fake.to(ROUTES.user)).toHaveLength(0);
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
});

test('15. a failed commit during Sign in again with the rollback written keeps the old account and ends failed; a restart agrees (DC-11)', async () => {
  const h = await harness(); const old = markers(); const account = await h.seed(old);
  const m = markers(); fake.answer(ROUTES.token, tokenAnswer(m)); fake.answer(ROUTES.user, USER);
  let commits = 0; h.vault.on('commit', () => { if (commits++ === 0) throw new Error('EIO'); });
  await begin(h, m); await ended(h);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: null, renewalHeld: false, lastOutcome: 'failed' });
  expect(h.store.current()).toBe(account);
  expect(fake.to(ROUTES.user)).toHaveLength(0);
  const next = await h.reopen();
  expect(next.store.current()?.accessRef).toBe(account.accessRef);
});

test('15b. a failed commit whose rollback write fails too leaves the new account live with no outcome; reads are refused a grant until a restart, which signs in with it', async () => {
  const h = await harness(); await h.seed(markers());
  const m = markers(); fake.answer(ROUTES.token, tokenAnswer(m)); fake.answer(ROUTES.user, USER);
  let commits = 0; h.vault.on('commit', () => { if (commits++ === 0) { h.breakWrites(); throw new Error('EIO'); } });
  await begin(h, m); await ended(h);
  h.restoreWrites();
  const live = h.store.current()!;
  expect(h.secretOf(live.accessRef)).toBe(m.access);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: null, renewalHeld: false, lastOutcome: null });
  fake.always(RESOURCES, { json: { ok: true } });
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);    // a staged ref is refused a grant (6.3); the account is kept
  expect(h.store.current()).toBe(live);
  expect(fake.to(RESOURCE)).toHaveLength(0);
  const next = await h.reopen();
  expect(next.store.current()?.accessRef).toBe(live.accessRef);
});

test('15c. a refresh of the old account queued behind a failed sign-in commit runs after the rollback: file and live agree on the refreshed pair (GS-3)', async () => {
  const h = await harness(); const old = markers(); await h.seed(old, 200_000);
  const signIn = markers(); const refreshed = markers();
  fake.always(RESOURCES, { json: { ok: true } });
  fake.always(ROUTES.token, (request: FakeRequest) => request.body.grant_type === 'refresh_token' ? tokenAnswer(refreshed) : tokenAnswer(signIn));
  const replaces: string[] = []; const replace = h.store.replace.bind(h.store);
  h.store.replace = (...args) => { replaces.push(args[2]); return replace(...args); };
  const held = gate(); let commits = 0; let read: Promise<unknown> | undefined;
  h.vault.on('commit', async () => {
    if (commits++ !== 0) return;
    read = settle(h.read());                                                   // its refresh queues behind the sign-in on the lock
    await until(() => replaces.includes('refresh'), 'the refresh queued');
    await held.promise; throw new Error('EIO');
  });
  await begin(h, signIn);
  await until(() => commits === 1, 'the failing commit');
  held.open(); await ended(h);
  await read;
  expect(h.service.status()).toMatchObject({ state: 'signed-in', lastOutcome: 'failed' });
  const live = h.store.current()!;
  expect(h.secretOf(live.accessRef)).toBe(refreshed.access);
  expect(refsOf((await h.file_())?.account)).toEqual(refsOf(live));
  const next = await h.reopen();
  expect(next.store.current()?.accessRef).toBe(live.accessRef);
});

test('16. a file issued to another client ID starts signed-out with ended app-changed and no request (DC-15); start clears it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moonaliza-github-signin-'));
  const other = await harness({ root, storeClient: 'Iv1.another-app' }); await other.seed(markers());
  const h = await harness({ root });
  expect(h.store.openedAppChanged()).toBe(true);
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: 'app-changed', signOutIncomplete: false, lastOutcome: null });
  expect(h.calls).toHaveLength(0); expect(fake.requests).toHaveLength(0);
  h.clock.gated = true;
  await begin(h, markers());
  h.service.cancel();
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: 'cancelled' });
});

test('16b. a sign-out whose clear reaches no disk reports signOutIncomplete (DC-6), and the next start() clears it', async () => {
  const h = await harness(); await h.seed(markers());
  const target = h.real as unknown as Record<string, unknown>;
  target.persist = async () => { throw new Error('EIO'); };                   // the vault's index writes fail, as on a failing disk
  h.breakWrites();
  expect(await h.service.signOut()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: true, lastOutcome: null });
  delete target.persist; h.restoreWrites();
  h.clock.gated = true;
  await begin(h, markers());
  h.service.cancel();
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: 'cancelled' });
  expect(await h.service.signOut()).toMatchObject({ signOutIncomplete: false });
});

test.each(['before', 'after'] as const)('17. a refresh that commits while the login read is slow, %s setLogin runs: the login is set once both complete (GS-10)', async order => {
  const h = await harness(); const m = markers(); const refreshed = markers();
  register(refreshed, 'new'); fake.always(RESOURCES, { json: { ok: true } });
  const login = gate(); const refresh = gate();
  fake.answer(ROUTES.user, async () => { await login.promise; return USER; });
  fake.always(ROUTES.token, async (request: FakeRequest) => {
    if (request.body.grant_type !== 'refresh_token') return tokenAnswer(m, { expires_in: 200 });   // inside the margin: the next read refreshes
    if (order === 'after') await refresh.promise;
    return tokenAnswer(refreshed);
  });
  await begin(h, m);
  await until(() => fake.to(ROUTES.user).length === 1, 'the login read');
  const read = h.read();
  if (order === 'before') {
    await read;
    expect(h.secretOf(h.store.current()!.accessRef)).toBe(refreshed.access);
    login.open();
  } else {
    await until(() => fake.to(ROUTES.token).some(request => request.body.grant_type === 'refresh_token'), 'the refresh');
    login.open();
    await until(() => h.store.current()?.login === LOGIN, 'setLogin');
    refresh.open(); await read;
  }
  await ended(h);
  const live = h.store.current()!;
  expect(h.secretOf(live.accessRef)).toBe(refreshed.access);
  expect(live.login).toBe(LOGIN); expect((await h.file_())?.account?.login).toBe(LOGIN);
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
});
