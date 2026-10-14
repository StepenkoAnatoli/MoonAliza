import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspect } from 'node:util';
import { Vault, type CredentialBinding } from '../src/main/vault';
import { AccountFileSchema, GitHubAccountStore, type GitHubAccount } from '../src/main/github-account-store';
import { DEVICE_CODE_URL } from '../src/main/github-app';
import { lateFetch, type Fetcher } from '../src/main/github-credential';
import { GitHubReader } from '../src/main/github';
import { GitHubSignIn, type GitHubLimits } from '../src/main/github-signin';
import { ROUTES, codeAnswer, errorAnswer, fetcherFor, markers, startFakeGitHubOAuth, tokenAnswer, type FakeGitHubOAuth, type FakeReply, type FakeRequest, type Markers } from './fixtures/fake-github-oauth';

// GitHub sign-in, U5: the lifecycle service's refresh, send() and lifecycle (docs/specification/github-sign-in.md 2.4, 2.5, 3.4,
// 3.7, 6.4, 6.5, 6.7, 6.8; "Tests the builders owe", tests/github-signin-refresh.test.ts). Fixtures are built from E-01/E-02/E-15
// shapes, not a capture: every answer comes from the loopback fake's builders, and every token is a marker generated at run time
// (T-1). The real Vault runs with the AES fake cryptor of tests/vault.test.ts:9-31. The injected clock starts years away from
// real time, so a grant whose expiry came from it rather than from Date.now() would be refused (3.7, pre-mortem 3). Holds and
// expiries run on that clock; the fresh-token waits go through the injected sleep, which advances it. Only request timeouts and
// the quit bound run in real time, shrunk through `limits` (3.7). Unless a case says otherwise, the stored token is ten minutes
// old, older than transientHoldMs (GS-1). globalThis.fetch is never stubbed, except in the one late-binding test (17).

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
const CLIENT = 'Iv23-u5-refresh-test';
const INSTALL = 'https://github.com/apps/moonaliza-u5-test/installations/new';
const T0 = Date.UTC(2031, 2, 3, 4, 5, 6);   // years from real time: grants must use Date.now() (3.7)
const LOGIN = 'octo-cat';
const USER: FakeReply = { json: { login: LOGIN, id: 7 } };
const RESOURCE_URL = 'https://api.github.com/repos/o/r/contents/f';
const RESOURCES = 'api.github.com/repos/*';
const RESOURCE = 'api.github.com/repos/o/r/contents/f';
const OK: FakeReply = { json: { ok: true } };
const UNAUTHORIZED: FakeReply = { status: 401, json: { message: 'Bad credentials' } };
const SIGNED_IN = { state: 'signed-in', login: null, renewalHeld: false, lastOutcome: null } as const;
const ENDED = { state: 'signed-out', ended: 'sign-in-ended', signOutIncomplete: false, lastOutcome: null } as const;

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
/** The promise's outcome, or a failure naming the wait if it is still pending after ms of real time. */
async function within<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const late = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`still pending after ${ms} ms`)), ms); });
  try { return await Promise.race([promise, late]); } finally { clearTimeout(timer); }
}
const refsOf = (account: { accessRef: string; refreshRef: string | null } | null | undefined) => !account ? [] : account.refreshRef === null ? [account.accessRef] : [account.accessRef, account.refreshRef];

/** The injected clock and sleep (3.7). A sleep advances the clock by the wait and returns at once; while `gated`, it parks until
 *  wake() or its signal. Every wait and every signal is recorded. */
class Clock {
  t: number; gated = false;
  readonly waits: number[] = []; readonly signals: AbortSignal[] = [];
  private readonly parked: Array<{ wake: () => void }> = [];
  constructor(t0: number) { this.t = t0; }
  readonly now = () => this.t;
  readonly sleep = (ms: number, signal: AbortSignal): Promise<void> => {
    this.waits.push(ms); this.signals.push(signal);
    if (!this.gated) { this.t += ms; return Promise.resolve(); }
    return new Promise<void>(resolve => {
      const remove = () => { const index = this.parked.indexOf(entry); if (index >= 0) this.parked.splice(index, 1); };
      const entry = { wake: () => { remove(); this.t += ms; resolve(); } };
      this.parked.push(entry);
      signal.addEventListener('abort', () => { remove(); resolve(); }, { once: true });
    });
  };
  get sleeping() { return this.parked.length; }
}

type Op = 'commit' | 'withSecret';
type GrantInput = Parameters<Vault['grant']>[0];
/** The real vault behind optional hooks: a hook runs before the call and may wait or throw. It logs grants and decrypts by ref,
 *  never a secret. */
class HookedVault {
  readonly grants: Array<{ ref: string; contextId: string; purpose: string; expiresAt: number; at: number }> = [];
  readonly decrypts: string[] = [];
  private readonly hooks = new Map<Op, (ref: string) => unknown>();
  constructor(readonly real: Vault) {}
  on(op: Op, hook?: (ref: string) => unknown) { if (hook) this.hooks.set(op, hook); else this.hooks.delete(op); return this; }
  saveStaged(secret: string): Promise<string> { return this.real.saveStaged(secret); }
  async commit(ref: string): Promise<void> { await this.hooks.get('commit')?.(ref); return this.real.commit(ref); }
  tombstone(ref: string): Promise<void> { return this.real.tombstone(ref); }
  remove(ref: string): Promise<void> { return this.real.remove(ref); }
  has(ref: string): Promise<boolean> { return this.real.has(ref); }
  grant(binding: GrantInput): string {
    this.grants.push({ ref: binding.secretRef, contextId: binding.contextId, purpose: binding.purpose, expiresAt: binding.expiresAt, at: Date.now() });
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
  config?: { clientId: string; installUrl: string } | null;
  fetcher?: (inner: Fetcher) => Fetcher;
  limits?: Partial<GitHubLimits>;
}
interface Seed { accessLeftMs?: number; refreshLeftMs?: number; ageMs?: number; nonExpiring?: boolean }
const opened: Array<{ root: string; service: GitHubSignIn }> = [];
afterEach(async () => {
  for (const { root, service } of opened.splice(0)) { service.cancel(); await service.close(); await rm(root, { recursive: true, force: true }); }
});

async function harness(o: Options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'moonaliza-github-refresh-'));
  const vaultDir = join(root, 'vault'); const file = join(root, 'github', 'account.json');
  const real = new Vault(vaultDir, cryptor); await real.initialize('epoch-1');
  const vault = new HookedVault(real);
  const store = new GitHubAccountStore(file, vault, CLIENT);
  await store.open();
  const clock = new Clock(T0);
  const calls: string[] = [];
  const routed = fetcherFor(fake);
  const counted: Fetcher = (url, init) => { calls.push(url); return routed(url, init); };
  let epoch = 'epoch-1';
  const config = o.config === null ? undefined : o.config ?? { clientId: CLIENT, installUrl: INSTALL };
  const service = new GitHubSignIn({ store, vault, epoch: () => epoch, encryptionAvailable: () => true,
    fetcher: o.fetcher ? o.fetcher(counted) : counted, config, now: clock.now, sleep: clock.sleep,
    limits: { requestTimeoutMs: 2_000, quitWaitMs: 2_000, ...o.limits } });
  opened.push({ root, service });
  return {
    root, vaultDir, file, real, vault, store, clock, service, calls, counted,
    restartEngine(next: string) { epoch = next; real.setEpoch(next); },
    index(): Record<string, { state: string }> {
      try { return (JSON.parse(readFileSync(join(vaultDir, 'index.json'), 'utf8')) as { entries: Record<string, { state: string }> }).entries; } catch { return {}; }
    },
    bins(): string[] { return readdirSync(vaultDir).filter(name => name.endsWith('.bin')); },
    secretOf(ref: string): string { return cryptor.decryptString(readFileSync(join(vaultDir, `${ref}.bin`))); },
    fileJson() { return existsSync(file) ? AccountFileSchema.parse(JSON.parse(readFileSync(file, 'utf8'))) : null; },
    /** index.json and account.json as bytes, for the byte-identical checks. */
    bytes() { return { index: readFileSync(join(vaultDir, 'index.json')), file: readFileSync(file) }; },
    refreshes(): FakeRequest[] { return fake.to(ROUTES.token).filter(request => request.body.grant_type === 'refresh_token'); },
    /** An account signed in before the test (seeded through the store), `ageMs` old, named oldAccess and oldRefresh in the fake. */
    async seed(m: Pick<Markers, 'access' | 'refresh'>, s: Seed = {}): Promise<GitHubAccount> {
      const age = s.ageMs ?? 600_000; const accessLeft = s.accessLeftMs ?? 3_600_000; const refreshLeft = s.refreshLeftMs ?? 86_400_000;
      fake.register({ oldAccess: m.access, oldRefresh: m.refresh });
      const issued = s.nonExpiring ? { access: m.access, refresh: null, accessExpiresInS: null, refreshExpiresInS: null }
        : { access: m.access, refresh: m.refresh, accessExpiresInS: (age + accessLeft) / 1000, refreshExpiresInS: (age + refreshLeft) / 1000 };
      const account = await store.replace(issued, clock.t - age, 'sign-in', () => true);
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
    /** Every write of account.json fails from now on (a directory where atomicJson renames). */
    breakWrites() { if (existsSync(file)) renameSync(file, `${file}.aside`); mkdirSync(join(file, 'blocker'), { recursive: true }); },
    restoreWrites() { rmSync(file, { recursive: true, force: true }); if (existsSync(`${file}.aside`)) renameSync(`${file}.aside`, file); },
  };
}
type Harness = Awaited<ReturnType<typeof harness>>;
const newPair = (m: Markers) => fake.register({ newAccess: m.access, newRefresh: m.refresh });
/** A token endpoint that issues a fresh pair per refresh, named gen1Access, gen2Access, ..., and remembers when each was issued. */
function issuer(h: Harness) {
  const issued = new Map<string, number>(); let n = 0;
  return {
    reply: (): FakeReply => { const m = markers(); const name = `gen${++n}Access`; fake.register({ [name]: m.access }); issued.set(name, h.clock.t); return tokenAnswer(m); },
    issuedAt: (name: string | null) => name === null ? undefined : issued.get(name),
  };
}
/** An app clear lets its waiters go at once (6.4); its locked part then writes `account: null` and removes the entries. */
const reachesDisk = (h: Harness) => until(() => h.fileJson()?.account === null && Object.keys(h.index()).length === 0 && h.bins().length === 0, 'the clear to reach disk');
const outcomeOf = (result: { value?: { status: number; authenticated: boolean }; error?: unknown }) =>
  result.error ? (result.error as Error).message : `${result.value!.status}:${result.value!.authenticated ? 'signed-in' : 'signed-out'}`;

// ---- 1. the pre-check ----

test.each([[301_000, 0], [299_000, 1], [120_000, 1]])('1. with %i ms left on the access token a read makes %i refreshes, and a refreshed read carries the new token', async (left, count) => {
  const h = await harness(); const old = markers(); const next = markers();
  await h.seed(old, { accessLeftMs: left }); newPair(next);
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, tokenAnswer(next));
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(count);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual([count ? 'newAccess' : 'oldAccess']);
  if (count) {
    const [refresh] = h.refreshes();   // spec 5.1: client_id, grant_type, refresh_token in a form body; no client secret; no query
    expect(refresh).toMatchObject({ method: 'POST', host: 'github.com', path: '/login/oauth/access_token', queryKeys: [], authorization: 'none', clientSecret: false });
    expect(refresh!.bodyKeys.sort()).toEqual(['client_id', 'grant_type', 'refresh_token']);
    expect(refresh!.body).toEqual({ client_id: CLIENT, grant_type: 'refresh_token', refresh_token: old.refresh });
    const live = h.store.current()!;
    expect(h.secretOf(live.accessRef)).toBe(next.access); expect(h.secretOf(live.refreshRef!)).toBe(next.refresh);
    expect(h.fileJson()?.account?.accessRef).toBe(live.accessRef);
    expect(Object.keys(h.index()).sort()).toEqual(refsOf(live).sort());       // the old pair is retired
  }
  expect(h.service.status()).toEqual(SIGNED_IN);
});

test('1. the access token past expiry and the refresh token expired: cleared, GITHUB_SIGN_IN_REQUIRED, zero requests (F-6)', async () => {
  const h = await harness();
  await h.seed(markers(), { accessLeftMs: -60_000, refreshLeftMs: -1_000 });
  fake.always(RESOURCES, OK);
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(fake.requests).toHaveLength(0); expect(h.calls).toHaveLength(0);
  expect(h.store.current()).toBeNull(); expect(h.fileJson()?.account).toBeNull(); expect(h.index()).toEqual({});
  expect(h.service.status()).toEqual(ENDED);
});

test('1. the access token within the margin and the refresh token expired: the read is sent with the still-valid token', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: 100_000, refreshLeftMs: -1_000 });
  fake.always(RESOURCES, OK);
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(fake.to(ROUTES.token)).toHaveLength(0);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['oldAccess']);
  expect(h.store.current()).toBe(account);
});

// ---- 2, 3. single flight; persist before use ----

test('2. single flight: eight concurrent sends near expiry make exactly one refresh request, and all eight use the new token (L-1)', async () => {
  const h = await harness(); const next = markers(); const answer = gate();
  await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, async () => { await answer.promise; return tokenAnswer(next); });
  const reads = Array.from({ length: 8 }, () => h.read());
  await until(() => h.refreshes().length >= 1, 'the refresh');
  await tick(50);
  answer.open();
  expect(await Promise.all(reads)).toEqual(Array.from({ length: 8 }, () => ({ status: 200, authenticated: true })));
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(Array.from({ length: 8 }, () => 'newAccess'));
});

test('3. persist before use: when the first new-token request arrives, the file names the new refs and the vault holds them committed; a read that starts while they are committed waits for them (L-4)', async () => {
  const h = await harness(); const next = markers(); const checked: string[] = [];
  await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.answer(ROUTES.token, tokenAnswer(next));
  let during: Promise<{ value?: { status: number; authenticated: boolean }; error?: unknown }> | undefined;
  h.vault.on('commit', () => { during ??= settle(h.read()); });                 // between the file write and the commit (4.3 step 5)
  fake.always(RESOURCES, request => {
    if (request.authorizationMarker === 'newAccess' && checked.length === 0) {
      const account = h.fileJson()?.account; const index = h.index();
      if (!account || h.secretOf(account.accessRef) !== next.access || h.secretOf(account.refreshRef!) !== next.refresh) throw new Error('account.json does not name the new pair');
      for (const ref of refsOf(account)) if (index[ref]?.state !== 'committed') throw new Error('a new ref is not committed in the vault');
      checked.push('persisted');
    }
    return OK;
  });
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect((await during!).value).toEqual({ status: 200, authenticated: true });
  expect(fake.errors).toEqual([]); expect(checked).toEqual(['persisted']);
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['newAccess', 'newAccess']);
});

// ---- 4, 4b. refresh answers that end the account (DC-1, GS-2) ----

const CLEARING: Array<[string, number, 'sign-in-ended' | 'client-rejected']> = [
  ['bad_refresh_token', 200, 'sign-in-ended'], ['bad_refresh_token', 400, 'sign-in-ended'], ['bad_refresh_token', 401, 'sign-in-ended'],
  ['unsupported_grant_type', 200, 'sign-in-ended'], ['unsupported_grant_type', 400, 'sign-in-ended'],
  ['incorrect_client_credentials', 200, 'client-rejected'], ['incorrect_client_credentials', 401, 'client-rejected'],
];
test.each(CLEARING)('4. the refresh answer %s at %i clears the account after exactly one refresh request, ended %s', async (code, status, ended) => {
  const h = await harness(); const answer = gate();
  await h.seed(markers(), { accessLeftMs: 100_000 });
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, async () => { await answer.promise; return errorAnswer(code, status); });
  const first = settle(h.read());
  await until(() => h.refreshes().length === 1, 'the refresh');
  const joined = settle(h.read());                                              // a call that saw the account waits on the same refresh
  answer.open();
  expect((await first).error).toMatchObject({ message: 'GITHUB_SIGN_IN_REQUIRED' });
  expect((await joined).error).toMatchObject({ message: 'GITHUB_SIGN_IN_REQUIRED' });   // never an unauthenticated fallback (L-14)
  expect(h.refreshes()).toHaveLength(1); expect(fake.to(RESOURCE)).toHaveLength(0);
  expect(h.store.current()).toBeNull();                                          // the clear's prologue ran before the waiters left (6.4)
  expect(h.service.status()).toEqual({ state: 'signed-out', ended, signOutIncomplete: false, lastOutcome: null });
  await reachesDisk(h);
  // A read that starts after the clear is a signed-out read (3.4, 6.4 line 1, L-10): request(undefined) once, and no token request.
  expect(await h.read()).toEqual({ status: 200, authenticated: false });
  expect(fake.to(RESOURCE).map(request => request.authorization)).toEqual(['none']);
  expect(fake.to(ROUTES.token)).toHaveLength(1);
});

test.each([200, 400])('4. one unknown refresh error code three times in a row (at %i) clears the account after three refresh requests, the gaps between them growing', async status => {
  const h = await harness();
  await h.seed(markers(), { accessLeftMs: -60_000 });                          // past expiry: every read needs a refresh
  fake.always(RESOURCES, OK); fake.always(ROUTES.token, errorAnswer('some_new_code', status));
  const t0 = h.clock.t;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
  h.clock.t = t0 + 29_999; await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/); expect(h.refreshes()).toHaveLength(1);
  h.clock.t = t0 + 30_000; await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/); expect(h.refreshes()).toHaveLength(2);
  h.clock.t = t0 + 89_999; await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/); expect(h.refreshes()).toHaveLength(2);
  h.clock.t = t0 + 90_000; await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/); expect(h.refreshes()).toHaveLength(3);
  expect(h.service.status()).toEqual(ENDED);
  expect(fake.to(RESOURCE)).toHaveLength(0); expect(h.store.current()).toBeNull();
});

test('4. two unknown codes alternating never clear the account, while its hold doubles', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: -60_000 });
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, errorAnswer('first_code', 200), errorAnswer('second_code', 400), errorAnswer('first_code', 400),
    errorAnswer('second_code', 200), errorAnswer('first_code', 200), errorAnswer('second_code', 400));
  let hold = 30_000;
  for (let n = 1; n <= 6; n++) {
    await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
    expect(h.refreshes()).toHaveLength(n);
    h.clock.t += hold - 1; await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/); expect(h.refreshes()).toHaveLength(n);
    h.clock.t += 1; hold *= 2;
  }
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual(SIGNED_IN);
});

test('4. only consecutive identical answers count: one unknown code, a 500, then the same code twice keeps the account (DC-1, 6.5)', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: -60_000 });
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, errorAnswer('some_new_code', 200), { status: 500, json: { message: 'down' } }, errorAnswer('some_new_code', 400), errorAnswer('some_new_code', 200));
  const t0 = h.clock.t;
  for (const [n, at] of [[1, 0], [2, 30_000], [3, 90_000], [4, 210_000]] as const) {   // each read just after the hold before it (30 s, 60 s, 120 s)
    h.clock.t = t0 + at;
    await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);      // the fourth answer is only the second identical one in a row
    expect(h.refreshes()).toHaveLength(n);
  }
  expect(fake.to(RESOURCE)).toHaveLength(0);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

const NO_CODE: Array<[string, boolean, FakeReply]> = [
  ['a 401 with a JSON message', true, UNAUTHORIZED],
  ['a 2xx without access_token', true, { json: { token_type: 'bearer', scope: '' } }],
  ['a 302', false, { status: 302, headers: { location: 'https://portal.example/' } }],
  ['a 400 HTML page', false, { status: 400, headers: { 'content-type': 'text/html' }, text: '<html><body>proxy</body></html>' }],
];
test.each(NO_CODE)('4b. %s three times in a row, with no error code, clears the account: %s (GS-2)', async (_name, clears, reply) => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: -60_000 });
  fake.always(RESOURCES, OK); fake.always(ROUTES.token, reply);
  const t0 = h.clock.t;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  h.clock.t = t0 + 30_000; await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  h.clock.t = t0 + 90_000; await expect(h.read()).rejects.toThrow(clears ? /^GITHUB_SIGN_IN_REQUIRED$/ : /^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(h.refreshes()).toHaveLength(3); expect(fake.to(RESOURCE)).toHaveLength(0);
  if (clears) { expect(h.service.status()).toEqual(ENDED); expect(h.store.current()).toBeNull(); }
  else { expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true }); expect(h.store.current()).toBe(account); }
});

// ---- 5. transient failures and holds (DC-1, GS-4, GS-6) ----

const TRANSIENT: Array<[string, FakeReply]> = [
  ['a network error', { reset: true }],
  ['a hang past the timeout', { hang: true }],
  ['a 500', { status: 500, json: { message: 'down' } }],
  ['a 400 HTML page', { status: 400, headers: { 'content-type': 'text/html' }, text: '<html><body>proxy</body></html>' }],
  ['an unparseable body', { status: 200, headers: { 'content-type': 'application/json' }, text: '{"access_token":' }],
];
test.each(TRANSIENT)('5. %s: the vault index and the account file stay byte-identical, the read gets GITHUB_RENEWAL_UNAVAILABLE, and no resource request is sent', async (_name, reply) => {
  const h = await harness({ limits: { requestTimeoutMs: 150 } }); const account = await h.seed(markers(), { accessLeftMs: 100_000 });
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, reply);
  const before = h.bytes();
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(h.bytes()).toEqual(before);
  expect(fake.to(RESOURCE)).toHaveLength(0); expect(h.refreshes()).toHaveLength(1);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

test('5. holds: within the hold a call sends nothing at all; after it a refresh is tried again; the hold doubles and never exceeds an hour (DC-1)', async () => {
  const h = await harness(); await h.seed(markers(), { accessLeftMs: -60_000 });
  fake.always(RESOURCES, OK); fake.always(ROUTES.token, { status: 500, json: { message: 'down' } });
  let t = h.clock.t; let hold = 30_000; const holds: number[] = [];
  for (let failure = 1; failure <= 9; failure++) {
    await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
    expect(h.refreshes()).toHaveLength(failure);
    const sent = fake.requests.length; const called = h.calls.length;
    h.clock.t = t + hold - 1;
    await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
    expect([fake.requests.length, h.calls.length]).toEqual([sent, called]);
    expect(h.service.status()).toMatchObject({ state: 'signed-in', renewalHeld: true });
    holds.push(hold); t += hold; h.clock.t = t; hold = Math.min(hold * 2, 3_600_000);
  }
  expect(holds).toEqual([30_000, 60_000, 120_000, 240_000, 480_000, 960_000, 1_920_000, 3_600_000, 3_600_000]);
});

test('5. a successful refresh resets the failure count: a failure, a success, then a failure holds 30 s again, not 60 s (6.5 "Clearing the hold")', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: -60_000 }); newPair(next);
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, { status: 500, json: { message: 'down' } }, tokenAnswer(next), { status: 500, json: { message: 'down' } }, tokenAnswer(markers()));
  const t0 = h.clock.t;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);      // failure 1: a 30 s hold
  h.clock.t = t0 + 30_000; expect(await h.read()).toEqual({ status: 200, authenticated: true });   // the hold over: a refresh succeeds
  const t1 = h.clock.t + 28_800_000 + 60_000; h.clock.t = t1;                   // the new token past expiry
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);      // the first failure after a success: 30 s, not 60 s
  h.clock.t = t1 + 30_000; expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(4);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['newAccess', null]);
});

test('5. (GS-4) with a hold active and the access token 200 s from expiry, a read is sent with that token and no refresh is made', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: 210_000 });
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, { status: 500, json: { message: 'down' } });
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);      // the failing refresh holds
  h.clock.t += 10_000;
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['oldAccess']);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

test('5. (GS-6) decrypting the refresh token fails: GITHUB_RENEWAL_UNAVAILABLE, no token request, and a second read within the hold makes no decrypt attempt', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: -60_000 });
  fake.always(RESOURCES, OK);
  writeFileSync(join(h.vaultDir, `${account.refreshRef}.bin`), randomBytes(48));   // an undecryptable entry
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(fake.requests).toHaveLength(0);
  expect(h.vault.decrypts.filter(ref => ref === account.refreshRef)).toHaveLength(1);
  h.clock.t += 10_000;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(h.vault.decrypts.filter(ref => ref === account.refreshRef)).toHaveLength(1);
  expect(fake.requests).toHaveLength(0);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

// ---- 6, 7, 8. rate limits, malformed answers, persist failures ----

test('6. a rate-limited refresh keeps the vault and gives GITHUB_RATE_LIMIT; no refresh is sent until the wait passes, with renewalHeld true (L-13)', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: -60_000 }); newPair(next);
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, { status: 429, headers: { 'retry-after': '120' }, json: { message: 'slow down' } }, tokenAnswer(next));
  const before = h.bytes(); const t0 = h.clock.t;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RATE_LIMIT$/);
  expect(h.bytes()).toEqual(before);
  expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
  for (const at of [60_000, 119_999]) {
    h.clock.t = t0 + at;
    await expect(h.read()).rejects.toThrow(/^GITHUB_RATE_LIMIT$/);
    expect(fake.requests).toHaveLength(1);
  }
  h.clock.t = t0 + 120_000;
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(2); expect(h.service.status()).toEqual(SIGNED_IN);
});

test('6. (DC-12, GS-9) after a 429 with retry-after 0 the refresh holds 30 s, not 1 s: a read 2 s later sends nothing; one at 31 s refreshes', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: -60_000 }); newPair(next);
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, { status: 429, headers: { 'retry-after': '0' } }, tokenAnswer(next));
  const t0 = h.clock.t;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RATE_LIMIT$/);
  h.clock.t = t0 + 2_000;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RATE_LIMIT$/);
  expect(h.refreshes()).toHaveLength(1); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
  h.clock.t = t0 + 31_000;
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(2);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['newAccess']);
});

test.each([
  ['an access token with another prefix', (m: Markers) => tokenAnswer({ access: `gho_${m.access.slice(4)}`, refresh: m.refresh })],
  ['a refresh token holding a space', (m: Markers) => tokenAnswer({ access: m.access, refresh: `${m.refresh} x` })],
  ['an expiry without refresh_token_expires_in', (m: Markers) => tokenAnswer(m, { refresh_token_expires_in: undefined })],
])('7. a 2xx carrying %s clears the account (E-02 l.36)', async (_name, reply) => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: 100_000 });
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, reply(next));
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(h.service.status()).toEqual(ENDED); expect(h.store.current()).toBeNull();
  expect(fake.to(RESOURCE)).toHaveLength(0); expect(h.refreshes()).toHaveLength(1);
});

test('7. a single 2xx with no access_token keeps the account and holds', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: 100_000 });
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, { json: { token_type: 'bearer' } });
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

test.each(['the file write', 'the commit'] as const)('8. a persist failure after a successful refresh (%s) clears the account, and no request carries the old or the new token (X-9)', async where => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.always(RESOURCES, OK);
  if (where === 'the file write') fake.answer(ROUTES.token, () => { h.breakWrites(); return tokenAnswer(next); });
  else { fake.answer(ROUTES.token, tokenAnswer(next)); h.vault.on('commit', () => { throw new Error('EIO'); }); }
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(fake.to(RESOURCE)).toHaveLength(0);
  for (const request of fake.requests) expect(request.carries.filter(name => ['oldAccess', 'newAccess', 'newRefresh'].includes(name))).toEqual([]);
  expect(h.store.current()).toBeNull(); expect(h.service.status()).toEqual(ENDED);
  await until(() => Object.keys(h.index()).length === 0 && h.bins().length === 0, 'neither pair kept in the vault');
});

// ---- 9. engine restart ----

test('9. an engine restart between grant and use re-grants once, for the refresh and for the read; the refresh succeeds and the account is never cleared', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, tokenAnswer(next));
  const restarted = new Set<string>();
  h.vault.on('withSecret', ref => { if (!restarted.has(ref)) { restarted.add(ref); h.restartEngine(`epoch-${restarted.size + 1}`); } });
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.vault.grants.filter(grant => grant.contextId.startsWith('github:refresh:'))).toHaveLength(2);
  expect(h.vault.grants.filter(grant => grant.contextId.startsWith('github:read:'))).toHaveLength(2);
  expect(h.refreshes()).toHaveLength(1); expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['newAccess']);
  expect(h.service.status()).toEqual(SIGNED_IN);
  // Every grant: the github purpose, an expiry from Date.now() at most 30 s ahead, revoked after use (3.7, 3.8).
  for (const grant of h.vault.grants) {
    expect(grant.purpose).toBe('github'); expect(grant.contextId).toMatch(/^github:(read|refresh):[0-9a-f-]{36}$/);
    expect(grant.expiresAt - grant.at).toBeLessThanOrEqual(30_000); expect(grant.expiresAt).toBeGreaterThan(grant.at);
  }
  expect(h.vault.liveGrants()).toBe(0);
});

// ---- 10. the 401 rule (C-6, DC-2, GS-1) ----

test('10. a 401 leads to one refresh, then one retry with the new token, then success', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers()); newPair(next);
  fake.answer(ROUTES.token, tokenAnswer(next));
  fake.always(RESOURCES, request => request.authorizationMarker === 'oldAccess' ? UNAUTHORIZED : OK);
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['oldAccess', 'newAccess']);
  expect(h.service.status()).toEqual(SIGNED_IN);
});

test.each([[false], [true]])('10. a 401 after another call rotated the pair: no refresh by this call, one retry with the current token (that token at least 30 s old and refused too: %s)', async refused => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: 400_000 }); newPair(next);
  fake.answer(ROUTES.token, tokenAnswer(next));
  const held = gate(); let refuseNew = false;
  fake.always(RESOURCES, async request => {
    if (request.authorizationMarker === 'oldAccess') { await held.promise; return UNAUTHORIZED; }
    return refuseNew ? UNAUTHORIZED : OK;
  });
  const first = settle(h.read());
  await until(() => fake.to(RESOURCE).length === 1, 'the first call sent');
  h.clock.t += 101_000;                                                          // 299 s left: the second call refreshes
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(1);
  if (refused) { h.clock.t += 30_000; refuseNew = true; }
  held.open();
  const result = await first;
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['oldAccess', 'newAccess', 'newAccess']);
  if (refused) { expect(result.error).toMatchObject({ message: 'GITHUB_SIGN_IN_REQUIRED' }); expect(h.service.status()).toEqual(ENDED); }
  else { expect(result.value).toEqual({ status: 200, authenticated: true }); expect(h.service.status()).toEqual(SIGNED_IN); }
});

test('10. a read whose access ref is rotated between its grant and its decrypt, by another call\'s 401 and refresh, retries with the current pair and spends no budget: 200 with one refresh (6.4 withAccess step 4, "stale")', async () => {
  const h = await harness(); const next = markers(); const old = await h.seed(markers()); newPair(next);
  fake.answer(ROUTES.token, tokenAnswer(next));
  fake.always(RESOURCES, request => request.authorizationMarker === 'oldAccess' ? UNAUTHORIZED : OK);
  let b: Promise<{ value?: { status: number; authenticated: boolean }; error?: unknown }> | undefined;
  h.vault.on('withSecret', async ref => {
    if (b || ref !== old.accessRef) return;                                     // A has its grant on the old ref: start B, and wait for B's rotation
    b = settle(h.read());                                                       // B: a 401 on the old token, a refresh, a retry with the new one
    await until(() => h.store.current()?.accessRef !== old.accessRef && h.index()[old.accessRef] === undefined, 'the rotation');
  });
  expect(await h.read()).toEqual({ status: 200, authenticated: true });       // A: its grant was revoked with the old ref, so it never sent the old token
  expect((await b!).value).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker).sort()).toEqual(['newAccess', 'newAccess', 'oldAccess']);   // one 401 (B), two accepted
  expect(h.service.status()).toEqual(SIGNED_IN);
});

test('10. a non-expiring token answered 401 clears the account, with no refresh', async () => {
  const h = await harness(); await h.seed(markers(), { nonExpiring: true });
  fake.always(RESOURCES, UNAUTHORIZED);
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(fake.to(ROUTES.token)).toHaveLength(0); expect(fake.to(RESOURCE)).toHaveLength(1);
  expect(h.service.status()).toEqual(ENDED);
});

test('10. a 401 during a rate-limit hold, on a token sent because it was still valid (GS-4), starts no refresh: GITHUB_RATE_LIMIT, the account kept (L-13)', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: 210_000 });
  fake.always(RESOURCES, UNAUTHORIZED); fake.answer(ROUTES.token, { status: 429, headers: { 'retry-after': '120' } });
  await expect(h.read()).rejects.toThrow(/^GITHUB_RATE_LIMIT$/);               // the pre-check refresh is rate-limited: a 120 s hold
  expect(fake.to(RESOURCE)).toHaveLength(0);
  h.clock.t += 10_000;
  await expect(h.read()).rejects.toThrow(/^GITHUB_RATE_LIMIT$/);               // sent with the still-valid token, answered 401
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['oldAccess']);
  expect(h.refreshes()).toHaveLength(1);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

test('10. a 401 on a token whose refresh token has expired clears the account with no refresh request (6.4, T-4)', async () => {
  const h = await harness(); await h.seed(markers(), { refreshLeftMs: -1_000 });   // the access token valid for an hour more
  fake.always(RESOURCES, UNAUTHORIZED);
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(fake.to(RESOURCE)).toHaveLength(1); expect(fake.to(ROUTES.token)).toHaveLength(0);
  expect(h.store.current()).toBeNull(); expect(h.service.status()).toEqual(ENDED);
});

test('10. a pre-check refresh followed by a 401 on its token, with the clock stepped past transientHoldMs, clears the account (C-6)', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.answer(ROUTES.token, tokenAnswer(next));
  fake.always(RESOURCES, () => { h.clock.t += 31_000; return UNAUTHORIZED; });
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['newAccess']);
  expect(h.service.status()).toEqual(ENDED);
});

test('10. a call makes at most one refresh and one retry: a 401, a refresh, and a retry refused again clear the account', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers()); newPair(next);
  fake.answer(ROUTES.token, tokenAnswer(next));                                 // one answer: a second refresh would get the fake's 500
  fake.always(RESOURCES, request => { if (request.authorizationMarker === 'newAccess') h.clock.t += 31_000; return UNAUTHORIZED; });
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['oldAccess', 'newAccess']);
  expect(h.service.status()).toEqual(ENDED);
});

test('10. fresh-token guard (DC-2): a token 1 s old answered 401 twice, then 200, succeeds after waits of 1 s and 2 s, with no refresh', async () => {
  const h = await harness(); const account = await h.seed(markers(), { ageMs: 1_000 });
  fake.answer(RESOURCES, UNAUTHORIZED, UNAUTHORIZED, OK);
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.clock.waits).toEqual([1_000, 2_000]); expect(fake.to(ROUTES.token)).toHaveLength(0);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['oldAccess', 'oldAccess', 'oldAccess']);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual(SIGNED_IN);
});

test('10. fresh-token guard (DC-2): three 401s on a token under 5 s old give GITHUB_RENEWAL_UNAVAILABLE, keep the account and hold renewal', async () => {
  const h = await harness(); const account = await h.seed(markers(), { ageMs: 0 });
  fake.always(RESOURCES, UNAUTHORIZED);
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(h.clock.waits).toEqual([1_000, 2_000]); expect(fake.to(RESOURCE)).toHaveLength(3); expect(fake.to(ROUTES.token)).toHaveLength(0);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

test('10. a 401 on a token 10 s old sends no refresh and keeps the account (GS-1)', async () => {
  const h = await harness(); const account = await h.seed(markers(), { ageMs: 10_000 });
  fake.always(RESOURCES, UNAUTHORIZED);
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(h.clock.waits).toEqual([]); expect(fake.to(RESOURCE)).toHaveLength(1); expect(fake.to(ROUTES.token)).toHaveLength(0);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual({ ...SIGNED_IN, renewalHeld: true });
});

test('10. a refused new token (GS-1): reads 6 s apart for five minutes make at most 3 refresh requests, renewal held between them, and the account ends sign-in-ended', async () => {
  const h = await harness(); await h.seed(markers());
  const issue = issuer(h); fake.always(ROUTES.token, () => issue.reply()); fake.always(RESOURCES, UNAUTHORIZED);
  const outcomes: string[] = []; const held: boolean[] = []; const t0 = h.clock.t; let clearedAt = 0;
  for (const end = h.clock.t + 300_000; h.clock.t < end; h.clock.t += 6_000) {
    outcomes.push(outcomeOf(await settle(h.read())));
    const status = h.service.status();
    if (status.state === 'signed-in') held.push(status.renewalHeld); else clearedAt ||= h.clock.t;
  }
  // At most 3 refreshes; exactly 3 here: a hold of 30 s after each refused token, counted once per hold, the third clearing
  // (GS-1, Known limits 15: about 70 s or more).
  expect(h.refreshes()).toHaveLength(3);
  expect(held.length).toBeGreaterThan(0); expect(held.every(Boolean)).toBe(true);
  expect(outcomes.filter(outcome => outcome === 'GITHUB_SIGN_IN_REQUIRED')).toHaveLength(1);
  expect(clearedAt - t0).toBeGreaterThanOrEqual(60_000);
  expect(h.service.status()).toEqual(ENDED);
});

test('10. a slow new token (GS-1): the first read refreshes inside the margin, GitHub refuses the new token for 8 s, and reads 6 s apart recover after exactly one refresh', async () => {
  const h = await harness(); const account = await h.seed(markers(), { accessLeftMs: 100_000 });
  const issue = issuer(h); fake.always(ROUTES.token, () => issue.reply());
  fake.always(RESOURCES, request => { const at = issue.issuedAt(request.authorizationMarker); return at !== undefined && h.clock.t - at < 8_000 ? UNAUTHORIZED : OK; });
  const outcomes: string[] = [];
  for (let n = 0; n < 10; n++) { outcomes.push(outcomeOf(await settle(h.read()))); h.clock.t += 6_000; }
  expect(outcomes[0]).toBe('GITHUB_RENEWAL_UNAVAILABLE');
  expect(outcomes.slice(1)).toEqual(Array.from({ length: 9 }, () => '200:signed-in'));
  expect(h.refreshes()).toHaveLength(1);
  expect(h.store.current()?.accessRef).not.toBe(account.accessRef); expect(h.service.status()).toMatchObject({ state: 'signed-in' });
});

test('10. a slow new token in each of three refresh windows, each followed by an accepted read, never clears the account: an accepted token resets the refused count (GS-1, L-12 "in a row")', async () => {
  const h = await harness(); await h.seed(markers(), { accessLeftMs: 100_000 });
  const issue = issuer(h); fake.always(ROUTES.token, () => issue.reply());
  fake.always(RESOURCES, request => { const at = issue.issuedAt(request.authorizationMarker); return at !== undefined && h.clock.t - at < 8_000 ? UNAUTHORIZED : OK; });
  const outcomes: string[] = [];
  for (let window = 0; window < 3; window++) {
    outcomes.push(outcomeOf(await settle(h.read())));                           // a refresh, then its new token refused for 8 s: one refused token
    h.clock.t += 6_000;
    outcomes.push(outcomeOf(await settle(h.read())));                           // the same token, 9 s old, accepted
    h.clock.t += 28_800_000 - 200_000;                                           // into the next window: under the 300 s margin, past the hold
  }
  expect(outcomes).toEqual(Array.from({ length: 3 }, () => ['GITHUB_RENEWAL_UNAVAILABLE', '200:signed-in']).flat());
  expect(h.refreshes()).toHaveLength(3);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['gen1Access', 'gen1Access', 'gen1Access', 'gen1Access',
    'gen2Access', 'gen2Access', 'gen2Access', 'gen2Access', 'gen3Access', 'gen3Access', 'gen3Access', 'gen3Access']);   // three sends refused, one accepted, per window
  expect(h.service.status()).toMatchObject({ state: 'signed-in' });
});

// ---- 11, 12, 13. Stop, a deadline, sign-out and a new sign-in while a refresh is in flight (L-3, 2.5) ----

const SHA = 'c'.repeat(40);
const repository = (request: FakeRequest): FakeReply => request.path.includes('/commits/') ? { json: { sha: SHA } }
  : { json: { type: 'file', path: 'f', size: 3, encoding: 'base64', content: Buffer.from('one').toString('base64') } };

test('11. Stop mid-refresh: the reader gives RUN_CANCELLED at once, the refresh persists, and the next read uses the new pair with no refresh', async () => {
  const h = await harness(); const next = markers(); const answer = gate();
  const account = await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.always(RESOURCES, repository);
  fake.answer(ROUTES.token, async () => { await answer.promise; return tokenAnswer(next); });
  const reader = new GitHubReader(h.counted, h.service);
  const stop = new AbortController();
  const read = settle(reader.read({ url: 'https://github.com/o/r', path: 'f' }, ['o/r'], stop.signal));
  await until(() => h.refreshes().length === 1, 'the refresh');
  stop.abort();
  expect((await within(read, 1_000)).error).toMatchObject({ message: 'RUN_CANCELLED' });   // GitHub has not answered yet
  answer.open();
  await until(() => h.store.current()?.accessRef !== account.accessRef, 'the refresh to persist');
  expect(h.secretOf(h.store.current()!.accessRef)).toBe(next.access);
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(1);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['newAccess']);
});

test('11. a read deadline mid-refresh ends only the wait (the reader maps it to GITHUB_TIMEOUT), and the refresh persists', async () => {
  const h = await harness(); const next = markers();
  const account = await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, { ...tokenAnswer(next), delayMs: 500 });
  const deadline = AbortSignal.timeout(100); const started = Date.now();
  const sent = await settle(h.service.send(authorization => h.counted(RESOURCE_URL, { signal: deadline, headers: authorization ? { Authorization: authorization } : {} }), deadline));
  expect((sent.error as Error).name).toBe('TimeoutError'); expect(deadline.aborted).toBe(true);
  expect(Date.now() - started).toBeLessThan(450);
  await until(() => h.store.current()?.accessRef !== account.accessRef, 'the refresh to persist');
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(1); expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['newAccess']);
});

test('11. Stop during the fresh-token pause (DC-2) releases the read at once, before any resend: the pause races the read\'s signal (2.5)', async () => {
  const h = await harness(); await h.seed(markers(), { ageMs: 1_000 });
  fake.always(RESOURCES, UNAUTHORIZED); h.clock.gated = true;
  const stop = new AbortController();
  const read = settle(h.read(stop.signal));
  await until(() => h.clock.sleeping === 1, 'the pause');                     // the 401 on a 1 s old token: a 1 s pause before the resend
  stop.abort();
  expect((await within(read, 1_000)).error).toMatchObject({ name: 'AbortError' });
  expect(fake.to(RESOURCE)).toHaveLength(1); expect(h.clock.sleeping).toBe(0);
});

test('12. sign-out mid-refresh: the waiter rejects at once with GITHUB_SIGN_IN_REQUIRED, the refresh result is discarded, the file holds account null, and no later request carries a marker', async () => {
  const h = await harness(); const next = markers(); const answer = gate();
  await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.always(RESOURCES, OK);
  fake.answer(ROUTES.token, async () => { await answer.promise; return tokenAnswer(next); });
  const read = settle(h.read());
  await until(() => h.refreshes().length === 1, 'the refresh');
  const started = Date.now();
  const signedOut = h.service.signOut();
  expect((await within(read, 1_000)).error).toMatchObject({ message: 'GITHUB_SIGN_IN_REQUIRED' });
  expect(Date.now() - started).toBeLessThan(500);                               // before GitHub answers the refresh
  expect(await signedOut).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
  const after = fake.requests.length;
  expect(h.fileJson()?.account).toBeNull();
  expect(await h.read()).toEqual({ status: 200, authenticated: false });
  answer.open();
  await h.service.close();                                                       // waits for the refresh in flight to settle (6.8)
  expect(h.store.current()).toBeNull(); expect(h.index()).toEqual({}); expect(h.bins()).toEqual([]);
  expect(h.fileJson()?.account).toBeNull();
  for (const request of fake.requests.slice(after)) { expect(request.carries).toEqual([]); expect(request.authorization).toBe('none'); }
});

test('12. the sign-out prologue is synchronous: a grant taken before sign-out is denied after it, and a read whose grant was taken first sends nothing', async () => {
  const h = await harness(); const account = await h.seed(markers());
  const binding: CredentialBinding = { epoch: 'epoch-1', purpose: 'github', contextId: 'github:read:taken-before', secretRef: account.accessRef };
  const capability = h.real.grant({ ...binding, expiresAt: Date.now() + 10_000 });
  const signedOut = h.service.signOut();                                         // not awaited: only its synchronous part has run
  expect(h.vault.liveGrants()).toBe(0);
  let used = false;
  await expect(h.real.withSecret(capability, binding, () => { used = true; return 'x'; })).rejects.toThrow(/^CREDENTIAL_CAPABILITY_DENIED$/);
  expect(used).toBe(false);
  await signedOut;

  const other = await harness(); await other.seed(markers()); fake.always(RESOURCES, OK);
  let landed: Promise<unknown> | undefined;
  other.vault.on('withSecret', () => { landed ??= other.service.signOut(); });   // the read's grant is taken, then sign-out lands
  await expect(other.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);
  expect(fake.to(RESOURCE)).toHaveLength(0);
  expect(await landed).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
});

test('12. a sign-out during the fresh-token pause (DC-2) releases the read at once with GITHUB_SIGN_IN_REQUIRED, before any resend: the pause races accountChanged (2.5)', async () => {
  const h = await harness(); await h.seed(markers(), { ageMs: 1_000 });
  fake.always(RESOURCES, UNAUTHORIZED); h.clock.gated = true;
  const read = settle(h.read());
  await until(() => h.clock.sleeping === 1, 'the pause');
  const signedOut = h.service.signOut();
  expect((await within(read, 1_000)).error).toMatchObject({ message: 'GITHUB_SIGN_IN_REQUIRED' });
  expect(fake.to(RESOURCE)).toHaveLength(1); expect(h.clock.sleeping).toBe(0);
  expect(await signedOut).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
});

test('12. an app clear by another call during the fresh-token pause releases the pausing read at once: clearIf aborts accountChanged (6.4, 2.5)', async () => {
  const h = await harness(); await h.seed(markers(), { ageMs: 1_000, refreshLeftMs: 20_000 });
  fake.always(RESOURCES, UNAUTHORIZED); h.clock.gated = true;
  const a = settle(h.read());
  await until(() => h.clock.sleeping === 1, 'the pause');
  h.clock.t += 31_000;                                                           // the token 32 s old, its refresh token expired 11 s ago
  await expect(h.read()).rejects.toThrow(/^GITHUB_SIGN_IN_REQUIRED$/);         // B: a 401 with no refresh possible clears the account
  expect((await within(a, 1_000)).error).toMatchObject({ message: 'GITHUB_SIGN_IN_REQUIRED' });
  expect(fake.to(RESOURCE)).toHaveLength(2); expect(h.refreshes()).toHaveLength(0); expect(h.clock.sleeping).toBe(0);
  await reachesDisk(h); expect(h.service.status()).toEqual(ENDED);
});

test('13. a re-sign-in committing during a refresh: the refresh result is discarded, and its waiters continue with the new account', async () => {
  const h = await harness(); const signIn = markers(); const refreshed = markers();
  await h.seed(markers(), { accessLeftMs: 100_000 });
  fake.register({ access: signIn.access, refresh: signIn.refresh, device: signIn.device }); newPair(refreshed);
  fake.always(RESOURCES, OK); fake.answer(ROUTES.user, USER);
  const poll = gate(); const refresh = gate();
  fake.always(ROUTES.token, async request => {
    if (request.body.grant_type === 'refresh_token') { await refresh.promise; return tokenAnswer(refreshed); }
    await poll.promise; return tokenAnswer(signIn);
  });
  fake.answer(ROUTES.device, codeAnswer(signIn));
  expect(await h.service.start()).toMatchObject({ state: 'pending', committed: false, account: { login: null } });
  await until(() => fake.to(ROUTES.token).length === 1, 'the poll');
  const read = settle(h.read());
  await until(() => h.refreshes().length === 1, 'the refresh');
  poll.open();
  expect((await within(read, 3_000)).value).toEqual({ status: 200, authenticated: true });
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['access']);
  await until(() => h.service.status().state === 'signed-in', 'the login read');
  refresh.open();
  await h.service.close();                                                       // waits for the refresh in flight to settle (6.8)
  const live = h.store.current()!;
  expect(h.secretOf(live.accessRef)).toBe(signIn.access); expect(live.login).toBe(LOGIN);
  expect(Object.keys(h.index()).sort()).toEqual(refsOf(live).sort());
  for (const name of h.bins()) expect([refreshed.access, refreshed.refresh]).not.toContain(h.secretOf(name.slice(0, -4)));
});

test('13. a re-sign-in committing between the refresh\'s grant and its decrypt: the refresh sends nothing, its waiter continues with the new account, and no hold is put on it (6.5 withRefresh, "rotated meanwhile")', async () => {
  const h = await harness(); const signIn = markers(); const old = await h.seed(markers(), { accessLeftMs: 100_000 });
  fake.register({ access: signIn.access, refresh: signIn.refresh, device: signIn.device });
  fake.always(RESOURCES, OK); fake.answer(ROUTES.user, USER);
  const poll = gate();
  fake.always(ROUTES.token, async request => {
    if (request.body.grant_type === 'refresh_token') return tokenAnswer(markers());   // never reached: the refresh token is never decrypted
    await poll.promise; return tokenAnswer(signIn);
  });
  fake.answer(ROUTES.device, codeAnswer(signIn));
  expect(await h.service.start()).toMatchObject({ state: 'pending', committed: false });
  await until(() => fake.to(ROUTES.token).length === 1, 'the poll');
  h.vault.on('withSecret', async ref => {
    if (ref !== old.refreshRef) return;
    poll.open();                                                                // the refresh holds its grant: the sign-in commits now
    await until(() => h.store.current()?.accessRef !== old.accessRef && h.index()[old.refreshRef!] === undefined, 'the commit');
  });
  expect(await h.read()).toEqual({ status: 200, authenticated: true });       // the waiter left on accountChanged and sent with the new pair
  expect(h.refreshes()).toHaveLength(0);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['access']);
  await until(() => h.service.status().state === 'signed-in', 'the login read');
  await h.service.close();                                                       // waits for the refresh in flight to settle (6.8)
  expect(h.service.status()).toEqual({ state: 'signed-in', login: LOGIN, renewalHeld: false, lastOutcome: null });
});

// ---- 14-19. no ambient traffic; clock step; close(); late binding; signed out; the copy check ----

test('14. no ambient traffic: construct, open, reconcile, finishStartup, then ten simulated minutes and status reads send nothing (L-2)', async () => {
  const h = await harness(); await h.seed(markers(), { accessLeftMs: 100_000 });   // a refresh would be due at once
  const vault = new Vault(h.vaultDir, cryptor); await vault.initialize('epoch-start');
  const store = new GitHubAccountStore(h.file, vault, CLIENT); await store.open();
  const calls: string[] = [];
  const service = new GitHubSignIn({ store, vault, epoch: () => 'epoch-start', encryptionAvailable: () => true,
    fetcher: (url, init) => { calls.push(url); return h.counted(url, init); }, config: { clientId: CLIENT, installUrl: INSTALL }, now: h.clock.now, sleep: h.clock.sleep });
  await vault.reconcile(new Set(store.references())); await store.finishStartup();
  for (let minute = 0; minute < 10; minute++) { h.clock.t += 60_000; for (let n = 0; n < 10; n++) service.status(); await tick(5); }
  expect(service.status()).toMatchObject({ state: 'signed-in' });
  expect(calls).toEqual([]); expect(fake.requests).toHaveLength(0); expect(h.clock.waits).toEqual([]);
  await service.close();
});

test.each([[301_000, 1], [299_000, 0]])('15. the local clock %i ms behind obtainedAt makes %i refreshes before use', async (behind, count) => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { ageMs: 0 }); newPair(next);
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, tokenAnswer(next));
  h.clock.t -= behind;
  expect(await h.read()).toEqual({ status: 200, authenticated: true });
  expect(h.refreshes()).toHaveLength(count);
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual([count ? 'newAccess' : 'oldAccess']);
});

test('16. close() aborts a pending flow synchronously, before its first await resolves', async () => {
  const h = await harness(); const m = markers();
  h.clock.gated = true; fake.answer(ROUTES.device, codeAnswer(m));
  expect(await h.service.start()).toMatchObject({ state: 'pending' });
  await until(() => h.clock.sleeping === 1, 'the first wait');
  const closed = h.service.close();
  expect(h.clock.signals[0]!.aborted).toBe(true);
  expect(h.service.status()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
  await closed;
  await tick(20); expect(fake.to(ROUTES.token)).toHaveLength(0);
});

test('16. close() waits for a refresh in flight, which persists', async () => {
  const h = await harness(); const next = markers(); await h.seed(markers(), { accessLeftMs: 100_000 }); newPair(next);
  fake.always(RESOURCES, OK); fake.answer(ROUTES.token, { ...tokenAnswer(next), delayMs: 300 });
  const read = settle(h.read());
  await until(() => h.refreshes().length === 1, 'the refresh');
  await h.service.close();
  const live = h.store.current()!;
  expect(h.secretOf(live.accessRef)).toBe(next.access);
  expect(h.fileJson()?.account?.accessRef).toBe(live.accessRef); expect(h.index()[live.accessRef]?.state).toBe('committed');
  expect((await read).value).toEqual({ status: 200, authenticated: true });
});

test('16. a hung refresh releases close() at quitWaitMs', async () => {
  const h = await harness({ limits: { requestTimeoutMs: 4_000, quitWaitMs: 300 } });
  await h.seed(markers(), { accessLeftMs: 100_000 });
  fake.answer(ROUTES.token, { hang: true });
  void settle(h.read());
  await until(() => h.refreshes().length === 1, 'the refresh');
  const started = Date.now(); await h.service.close(); const elapsed = Date.now() - started;
  expect(elapsed).toBeGreaterThanOrEqual(250); expect(elapsed).toBeLessThan(2_000);
});

test('16. start and send after close are refused without a request, signed in or out', async () => {
  const h = await harness(); await h.seed(markers()); fake.always(RESOURCES, OK); fake.answer(ROUTES.device, codeAnswer(markers()));
  await h.service.close();
  expect(await h.service.start()).toEqual(SIGNED_IN);
  await expect(h.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  const out = await harness(); await out.service.close();
  expect(await out.service.start()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null });
  await expect(out.read()).rejects.toThrow(/^GITHUB_RENEWAL_UNAVAILABLE$/);
  expect(fake.requests).toHaveLength(0); expect([...h.calls, ...out.calls]).toEqual([]);
});

test('17. with lateFetch, a globalThis.fetch replaced after construction receives the call (section 10)', async () => {
  const h = await harness({ fetcher: () => lateFetch });
  const original = globalThis.fetch; const seen: string[] = [];
  try {
    globalThis.fetch = (async (input: string | URL | Request) => {
      seen.push(String(input));
      return new Response(JSON.stringify({ error: 'device_flow_disabled' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    expect(await h.service.start()).toEqual({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: 'disabled' });
  } finally { globalThis.fetch = original; }
  expect(seen).toEqual([DEVICE_CODE_URL]); expect(fake.requests).toHaveLength(0);
});

test('18. signed out, send calls request(undefined) exactly once and returns its response unauthenticated', async () => {
  const h = await harness(); const seen: Array<string | undefined> = []; const response = new Response('body');
  const sent = await h.service.send(async authorization => { seen.push(authorization); return response; }, new AbortController().signal);
  expect(seen).toEqual([undefined]); expect(sent.response).toBe(response); expect(sent.authenticated).toBe(false);
});

test('18. not configured with an account present (even past expiry): send calls request(undefined) once, and nothing is cleared or sent (D-7)', async () => {
  const h = await harness({ config: null }); const account = await h.seed(markers(), { accessLeftMs: -60_000 });
  const before = h.bytes(); const seen: Array<string | undefined> = [];
  const sent = await h.service.send(async authorization => { seen.push(authorization); return new Response('body'); }, new AbortController().signal);
  expect(seen).toEqual([undefined]); expect(sent.authenticated).toBe(false);
  expect(h.store.current()).toBe(account); expect(h.bytes()).toEqual(before); expect(fake.requests).toHaveLength(0);
  expect(h.service.status()).toEqual({ state: 'not-configured' });
});

test('18. signed in, send rethrows the request\'s own rejection and a local vault error on the access token unchanged, keeping the account with no hold (3.4, GS-6)', async () => {
  const h = await harness(); const account = await h.seed(markers());
  const own = new Error('the request failed');
  expect((await settle(h.service.send(async () => { throw own; }, new AbortController().signal))).error).toBe(own);
  writeFileSync(join(h.vaultDir, `${account.accessRef}.bin`), randomBytes(48));   // an undecryptable access entry
  let called = false;
  const local = (await settle(h.service.send(async () => { called = true; return new Response('x'); }, new AbortController().signal))).error as Error;
  expect(called).toBe(false); expect(local).toBeInstanceOf(Error); expect(local.message).not.toMatch(/^GITHUB_/);
  expect(h.store.current()).toBe(account); expect(h.service.status()).toEqual(SIGNED_IN); expect(fake.requests).toHaveLength(0);
});

test('19. copy check (R2-10, L-7): after a sign-in, a refresh, a 401 with its refresh and a sign-out, neither the service nor the store holds a marker', async () => {
  const h = await harness(); const first = markers(); const second = markers(); const third = markers();
  fake.register({ access: first.access, refresh: first.refresh, device: first.device, secondAccess: second.access, thirdAccess: third.access });
  fake.answer(ROUTES.device, codeAnswer(first));
  fake.answer(ROUTES.token, tokenAnswer(first, { expires_in: 200 }), tokenAnswer(second), tokenAnswer(third));   // the poll, then two refreshes
  fake.answer(ROUTES.user, USER);
  let refuse = false;
  fake.always(RESOURCES, request => { if (refuse && request.authorizationMarker === 'secondAccess') { refuse = false; return UNAUTHORIZED; } return OK; });
  await h.service.start();
  await until(() => h.service.status().state === 'signed-in', 'the sign-in');
  expect(await h.read()).toEqual({ status: 200, authenticated: true });       // inside the margin: the first refresh
  h.clock.t += 31_000; refuse = true;
  expect(await h.read()).toEqual({ status: 200, authenticated: true });       // a 401, the second refresh, the retry
  expect(fake.to(RESOURCE).map(request => request.authorizationMarker)).toEqual(['secondAccess', 'secondAccess', 'thirdAccess']);
  const secrets = [first.device, first.access, first.refresh, second.access, second.refresh, third.access, third.refresh];
  const held = () => [inspect(h.service, { depth: 20, showHidden: true }), inspect(h.store, { depth: 20, showHidden: true })]
    .flatMap(text => secrets.filter(secret => text.includes(secret)));
  expect(held()).toEqual([]);
  await h.service.signOut();
  expect(held()).toEqual([]);
});
