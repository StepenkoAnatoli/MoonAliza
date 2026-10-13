import { afterEach, describe, expect, test } from 'vitest';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import fsp, { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Vault } from '../src/main/vault';
import { AccountFileSchema, GitHubAccountStore, ReplaceFailure, type GitHubAccount } from '../src/main/github-account-store';
import { atomicJson, serialized } from '../src/models/artifact-files';

// GitHub sign-in, U2: the account store (docs/specification/github-sign-in.md 3.6, 4, 6.7; "Tests the builders owe").
// Fixtures are built from E-01/E-02/E-15 shapes, not a capture. Token markers are generated at run time (T-1) in hex, so no
// encoding can hide one from a byte scan. The real Vault runs with the AES fake cryptor of tests/vault.test.ts:9-31.

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
const CLIENT = 'Iv1.u2-store-test';
const T0 = Date.UTC(2026, 9, 13, 10, 0, 0);
const marker = (prefix: 'ghu' | 'ghr') => `${prefix}_${randomBytes(24).toString('hex')}`;
interface Issued { access: string; refresh: string | null; accessExpiresInS: number | null; refreshExpiresInS: number | null }
const issued = (): Issued => ({ access: marker('ghu'), refresh: marker('ghr'), accessExpiresInS: 28_800, refreshExpiresInS: 15_897_600 });
const refsOf = (account: { accessRef: string; refreshRef: string | null } | null | undefined): string[] =>
  !account ? [] : account.refreshRef === null ? [account.accessRef] : [account.accessRef, account.refreshRef];

type Op = 'saveStaged' | 'commit' | 'tombstone' | 'remove' | 'has';
type Hook = (ref: string, count: number) => void | 'fail' | Promise<void>;
interface Call { op: Op; ref: string; revision: number; live: string | null; fileValid: boolean; retired: number }
function fileState(file: string): { revision: number; valid: boolean; retired: number } {
  try {
    const parsed = AccountFileSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
    return parsed.success ? { revision: parsed.data.revision, valid: true, retired: parsed.data.retiredRefs.length } : { revision: -1, valid: false, retired: -1 };
  } catch { return { revision: 0, valid: true, retired: 0 }; }   // no file yet
}
/** The real vault behind a recorder: each call logs the file's revision and the live ref at that moment, and can fail or wait. */
class SpyVault {
  readonly calls: Call[] = [];
  readonly persists: Promise<unknown>[] = [];
  store: GitHubAccountStore | undefined;
  private readonly hooks = new Map<Op, Hook>();
  private readonly afters = new Map<Op, (ref: string, count: number) => void>();
  private readonly counts = new Map<Op, number>();
  constructor(private readonly real: Vault, private readonly file: string) {}
  on(op: Op, hook?: Hook) { if (hook) this.hooks.set(op, hook); else this.hooks.delete(op); return this; }
  after(op: Op, hook?: (ref: string, count: number) => void) { if (hook) this.afters.set(op, hook); else this.afters.delete(op); return this; }
  ops(...ops: Op[]) { return this.calls.filter(call => ops.includes(call.op)).map(call => `${call.op}:${call.ref}`); }
  private enter(op: Op, ref: string) {
    const count = (this.counts.get(op) ?? 0) + 1; this.counts.set(op, count);
    const state = fileState(this.file);
    const call: Call = { op, ref, revision: state.revision, live: this.store?.current()?.accessRef ?? null, fileValid: state.valid, retired: state.retired };
    this.calls.push(call);
    return { call, count, action: this.hooks.get(op)?.(ref, count) };
  }
  async saveStaged(secret: string): Promise<string> {
    const { call, count, action } = this.enter('saveStaged', '');
    if (action === 'fail') throw new Error('EIO'); await action;
    const ref = await this.real.saveStaged(secret); call.ref = ref;
    this.afters.get('saveStaged')?.(ref, count); return ref;
  }
  async commit(ref: string): Promise<void> {
    const { count, action } = this.enter('commit', ref);
    if (action === 'fail') throw new Error('EIO'); await action;
    await this.real.commit(ref); this.afters.get('commit')?.(ref, count);
  }
  tombstone(ref: string): Promise<void> {   // synchronous like the real one: the entry is marked before this returns
    const { count, action } = this.enter('tombstone', ref);
    if (action === 'fail') return Promise.reject(new Error('EIO'));
    const persist = this.real.tombstone(ref).then(() => this.afters.get('tombstone')?.(ref, count));
    this.persists.push(persist.catch(() => {})); return persist;
  }
  async remove(ref: string): Promise<void> {
    const { count, action } = this.enter('remove', ref);
    if (action === 'fail') throw new Error('EBUSY'); await action;
    await this.real.remove(ref); this.afters.get('remove')?.(ref, count);
  }
  async has(ref: string): Promise<boolean> {
    const { action } = this.enter('has', ref);
    if (action === 'fail') throw new Error('EIO'); await action;
    return this.real.has(ref);
  }
}
function gate() { let open!: () => void; const promise = new Promise<void>(resolve => { open = resolve; }); return { promise, open }; }
/** The vault's index writes fail, as on a failing disk; a tombstone's synchronous part still runs (vault.ts:164-169). */
function failVaultDisk(vault: Vault): () => void {
  const target = vault as unknown as Record<string, unknown>;
  target.persist = async () => { throw new Error('EIO'); };
  return () => { delete target.persist; };
}
/** lstat fails with EBUSY for one path until the returned function runs. The node project runs files in one worker without isolation,
 *  so no vi.mock: lstat is swapped on the builtin and synced to every importer, as tests/review-workspace-layers.test.ts:16-24 does. */
function busyLstat(path: string): () => void {
  const realLstat = fsp.lstat;
  (fsp as { lstat: unknown }).lstat = (target: string) =>
    target === path ? Promise.reject(Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' })) : realLstat(target);
  syncBuiltinESMExports();
  return () => { (fsp as { lstat: unknown }).lstat = realLstat; syncBuiltinESMExports(); };
}

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });

async function harness(clientId = CLIENT, clock: () => number = () => T0) {
  const root = await mkdtemp(join(tmpdir(), 'moonaliza-github-store-')); roots.push(root);
  const data = join(root, 'data'); const file = join(data, 'github', 'account.json');
  const vault = new Vault(join(data, 'vault'), cryptor); await vault.initialize('epoch-1');
  const spy = new SpyVault(vault, file);
  const store = new GitHubAccountStore(file, spy, clientId, clock); spy.store = store;
  await store.open();
  let signOuts = 0; let snapshots = 0;
  return {
    root, data, file, vault, spy, store,
    /** A user sign-out as the service runs it (6.7): the count first, then the clear, both synchronously. */
    signOut() { signOuts++; return store.clear(() => true); },
    /** A sign-in admitted by the sign-out count (6.3, DC-4). */
    signInAdmit() { const s0 = signOuts; return () => signOuts === s0; },
    async signIn(tokens: Issued = issued()) {
      const account = await store.replace(tokens, T0, 'sign-in', this.signInAdmit()); if (!account) throw new Error('not admitted');
      return { account, tokens };
    },
    refreshAdmit(from: GitHubAccount) { return (live: GitHubAccount | null) => live?.accessRef === from.accessRef; },
    async refresh(from: GitHubAccount, tokens: Issued = issued()) { return { account: await store.replace(tokens, T0 + 60_000, 'refresh', this.refreshAdmit(from)), tokens }; },
    async read() { return existsSync(file) ? AccountFileSchema.parse(JSON.parse(await readFile(file, 'utf8'))) : null; },
    async bins(dir = data) { return (await readdir(join(dir, 'vault'))).filter(name => name.endsWith('.bin')).sort(); },
    /** The disk as a crash at this moment would leave it. */
    snapshot() { const dir = join(root, `crash-${++snapshots}`); cpSync(data, dir, { recursive: true }); return dir; },
    copy() { return this.snapshot(); },
    /** Every write of account.json fails from now on (a directory where atomicJson renames), until restoreWrites(). */
    breakWrites() { if (existsSync(file)) renameSync(file, `${file}.aside`); mkdirSync(join(file, 'blocker'), { recursive: true }); },
    restoreWrites() { rmSync(file, { recursive: true, force: true }); if (existsSync(`${file}.aside`)) renameSync(`${file}.aside`, file); },
  };
}
/** The next start, as index.ts runs it: open, the reconcile with the store's references, finishStartup. */
async function restart(dir: string, clientId = CLIENT) {
  const vault = new Vault(join(dir, 'vault'), cryptor); await vault.initialize('epoch-2');
  const file = join(dir, 'github', 'account.json'); const spy = new SpyVault(vault, file);
  const store = new GitHubAccountStore(file, spy, clientId, () => T0 + 3_600_000); spy.store = store;
  await store.open(); const references = store.references();
  await vault.reconcile(new Set(references)); await store.finishStartup();
  return { vault, spy, store, file, references };
}
/** A consistent start: the live account, the file and the vault agree, with no staged orphan and no retired ref left. */
async function expectConsistent(dir: string, expected: string[] | null) {
  const next = await restart(dir);
  const file = existsSync(next.file) ? AccountFileSchema.parse(JSON.parse(await readFile(next.file, 'utf8'))) : null;
  expect(refsOf(next.store.current())).toEqual(expected ?? []);
  expect(refsOf(file?.account)).toEqual(expected ?? []);
  expect(file?.retiredRefs ?? []).toEqual([]);
  const index = JSON.parse(await readFile(join(dir, 'vault', 'index.json'), 'utf8')) as { entries: Record<string, { state: string }> };
  expect(Object.keys(index.entries).sort()).toEqual([...(expected ?? [])].sort());
  expect(Object.values(index.entries).every(entry => entry.state === 'committed')).toBe(true);
  expect((await readdir(join(dir, 'vault'))).filter(name => name.endsWith('.bin')).sort()).toEqual((expected ?? []).map(ref => `${ref}.bin`).sort());
  for (const ref of expected ?? []) expect(await next.vault.has(ref)).toBe(true);
  return next;
}
const grantRead = (vault: Vault, ref: string) => {
  const binding = { epoch: 'epoch-1', purpose: 'github' as const, contextId: `github:read:${randomUUID()}`, secretRef: ref };
  return { binding, capability: vault.grant({ ...binding, expiresAt: Date.now() + 30_000 }) };
};

describe('write order (4.3)', () => {
  test('a refresh stages, writes the file, commits, sets live, retires the old refs, then rewrites the file', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const atCommit: unknown[] = [];
    h.spy.on('commit', () => { atCommit.push(JSON.parse(readFileSync(h.file, 'utf8'))); });
    h.spy.calls.length = 0;
    const { account: r } = await h.refresh(a);
    const [ra, rr] = refsOf(r); const [aa, ar] = refsOf(a);
    expect(h.spy.calls.map(({ op, ref, revision, live }) => [op, ref, revision, live])).toEqual([
      ['saveStaged', ra, 1, aa], ['saveStaged', rr, 1, aa],
      ['commit', ra, 2, aa], ['commit', rr, 2, aa],                               // the file names the new pair before any commit; live unchanged
      ['tombstone', aa, 2, ra], ['remove', aa, 2, ra], ['tombstone', ar, 2, ra], ['remove', ar, 2, ra],   // live moved only after commit
    ]);
    expect(atCommit[0]).toMatchObject({ revision: 2, account: { accessRef: ra, refreshRef: rr, clientId: CLIENT }, retiredRefs: [aa, ar] });
    expect(await h.read()).toMatchObject({ revision: 3, account: { accessRef: ra, refreshRef: rr }, retiredRefs: [] });
    expect(h.store.current()).toBe(r);
    expect(r).toMatchObject({ signInId: a.signInId, login: null, obtainedAt: T0 + 60_000, accessExpiresAt: T0 + 60_000 + 28_800_000 });
    expect(await h.bins()).toEqual([ra, rr].map(ref => `${ref}.bin`).sort());
  });

  test('a first sign-in writes once and retires nothing; a non-expiring token has one entry and null expiries', async () => {
    const h = await harness();
    const first = await h.store.replace({ access: marker('ghu'), refresh: null, accessExpiresInS: null, refreshExpiresInS: null }, T0, 'sign-in', () => true);
    expect(first).toMatchObject({ refreshRef: null, accessExpiresAt: null, refreshExpiresAt: null, obtainedAt: T0, login: null });
    expect(h.spy.ops('saveStaged', 'commit', 'tombstone', 'remove')).toEqual([`saveStaged:${first!.accessRef}`, `commit:${first!.accessRef}`]);
    expect(await h.read()).toMatchObject({ revision: 1, account: { accessRef: first!.accessRef, refreshRef: null, accessExpiresAt: null }, retiredRefs: [] });
    expect(await h.bins()).toEqual([`${first!.accessRef}.bin`]);
  });

  test('an admit that refuses at step 1 stages nothing', async () => {
    const h = await harness();
    expect(await h.store.replace(issued(), T0, 'sign-in', () => false)).toBeNull();
    expect(h.spy.calls).toEqual([]);
    expect(await h.read()).toBeNull();
  });

  // 3.6: replace answers null when not admitted and clear never throws, so an admit that throws refuses like one that returns false (U2-R12).
  test('an admit that throws refuses: replace returns null and stages nothing, and clear answers not-admitted without throwing', async () => {
    const h = await harness();
    const boom = () => { throw new Error('boom'); };
    expect(await h.store.replace(issued(), T0, 'sign-in', boom)).toBeNull();
    expect(h.spy.calls).toEqual([]); expect(await h.read()).toBeNull();
    const { account: a } = await h.signIn(); const before = await h.read();
    expect(await h.store.clear(boom)).toBe('not-admitted');
    expect(h.store.current()).toBe(a); expect(await h.read()).toEqual(before);
    expect(h.spy.ops('tombstone')).toEqual([]);
  });

  test('reads during replace keep working: live names committed refs until the new pair is committed (pre-mortem 1)', async () => {
    const h = await harness(); const { account: a, tokens } = await h.signIn();
    const seen: (string | boolean)[] = [];
    h.spy.on('commit', async () => {
      try {
        const { binding, capability } = grantRead(h.vault, h.store.current()!.accessRef);
        seen.push(await h.vault.withSecret(capability, binding, value => value === tokens.access)); h.vault.revokeContext(binding.contextId);
      } catch (error) { seen.push((error as Error).message); }
    });
    const { account: r, tokens: next } = await h.refresh(a);
    expect(seen).toEqual([true, true]);
    const { binding, capability } = grantRead(h.vault, r!.accessRef);
    expect(await h.vault.withSecret(capability, binding, value => value === next.access)).toBe(true);
  });
});

describe('failure kinds', () => {
  test('a staging failure throws ReplaceFailure(false) and leaves no entry', async () => {
    const h = await harness(); const { account: a } = await h.signIn(); const before = await h.read();
    h.spy.on('saveStaged', (_ref, count) => count === 4 ? 'fail' : undefined);   // the refresh token of the second replace
    const failure = await h.store.replace(issued(), T0, 'sign-in', () => true).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ReplaceFailure);
    expect(failure).toMatchObject({ written: false, message: 'ACCOUNT_STORE_FAILED' });
    expect(await h.bins()).toEqual(refsOf(a).map(ref => `${ref}.bin`).sort());
    expect(h.store.current()).toBe(a); expect(await h.read()).toEqual(before);
  });

  test('a file write failure throws ReplaceFailure(false), leaves no entry and keeps the previous account', async () => {
    const h = await harness(); const { account: a } = await h.signIn(); const before = await h.read();
    h.breakWrites();
    const failure = await h.refresh(a).catch((error: unknown) => error);
    h.restoreWrites();
    expect(failure).toBeInstanceOf(ReplaceFailure); expect(failure).toMatchObject({ written: false });
    expect(await h.bins()).toEqual(refsOf(a).map(ref => `${ref}.bin`).sort());
    expect(h.store.current()).toBe(a); expect(await h.read()).toEqual(before);
    await expectConsistent(h.copy(), refsOf(a));
  });

  test('tokens the file cannot hold (a refresh token without its expiry) throw ReplaceFailure(false) and leave no entry', async () => {
    const h = await harness();
    const failure = await h.store.replace({ ...issued(), refreshExpiresInS: null }, T0, 'sign-in', () => true).catch((error: unknown) => error);
    expect(failure).toMatchObject({ written: false, message: 'ACCOUNT_STORE_FAILED' });
    expect(await h.bins()).toEqual([]); expect(h.store.current()).toBeNull(); expect(await h.read()).toBeNull();
  });

  test('a refresh whose commit fails throws ReplaceFailure(true): the file names the new refs and live is unchanged', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    h.spy.on('commit', (_ref, count) => count === 3 ? 'fail' : undefined);
    const failure = await h.refresh(a).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ReplaceFailure);
    expect(failure).toMatchObject({ written: true, message: 'ACCOUNT_STORE_FAILED' });
    expect((failure as Error).message).not.toMatch(/^GITHUB_/);
    const file = await h.read();
    expect(file?.account?.accessRef).not.toBe(a.accessRef); expect(file?.retiredRefs).toEqual(refsOf(a));
    expect(h.store.current()).toBe(a);
  });
});

describe('a sign-in rolls back a failed commit under the same lock (DC-11, GS-3)', () => {
  // 'two': a refresh whose step-7 removals failed left the previous pair named, so the rollback must write back the retired refs
  // kept at step 4, not an empty list (U2-R11).
  test.each([[1, 'none'], [2, 'none'], [1, 'two'], [2, 'two']] as const)('commit %i failing with the rollback written (%s retired refs before): ReplaceFailure(false), the previous account live and named, the new refs removed', async (failing, retired) => {
    const h = await harness(); let { account: a } = await h.signIn(); let commits = 2;
    if (retired === 'two') {
      h.spy.on('remove', () => 'fail');                                       // the refresh's step 7 keeps the old pair named
      const { account: r } = await h.refresh(a); h.spy.on('remove'); a = r!; commits = 4;
    }
    const before = await h.read();
    expect(before?.retiredRefs).toHaveLength(retired === 'two' ? 2 : 0);
    h.spy.on('commit', (_ref, count) => count === commits + failing ? 'fail' : undefined);
    const failure = await h.store.replace(issued(), T0, 'sign-in', h.signInAdmit()).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(ReplaceFailure); expect(failure).toMatchObject({ written: false });
    expect(h.store.current()).toBe(a);
    // Three writes: step 4, the rollback naming the new refs as retired, and the write after their removal (U2-R11).
    expect(await h.read()).toMatchObject({ revision: before!.revision + 3, account: before!.account, retiredRefs: before!.retiredRefs });
    expect(await h.bins()).toEqual([...before!.retiredRefs, ...refsOf(a)].map(ref => `${ref}.bin`).sort());
    await expectConsistent(h.copy(), refsOf(a));
  });

  // The sign-in's first commit landed, so the on-disk index holds the new access ref committed; its second commit's index write fails.
  // 'index': the vault index keeps failing while the unlinks land, so a committed entry would be left without its file (vault.ts:187-188).
  // 'locked': the removals fail outright too (a Windows lock), so a committed entry would be left with its file and nothing naming it.
  // The rollback names the new refs as retired until their removal lands, as step 7 does, so the next start deletes them (U2-R11).
  test.each(['index', 'locked'] as const)('a rollback after a landed first commit, on a failing vault index (%s), names the new refs until they are gone: the next start redacts and is consistent', async mode => {
    const h = await harness(); const { account: a } = await h.signIn();
    let restore: (() => void) | undefined;
    h.spy.on('commit', (_ref, count) => { if (count === 4) { restore = failVaultDisk(h.vault); if (mode === 'locked') h.spy.on('remove', () => 'fail'); } });
    const failure = await h.store.replace(issued(), T0, 'sign-in', h.signInAdmit()).catch((error: unknown) => error);
    restore!(); h.spy.on('remove');
    expect(failure).toBeInstanceOf(ReplaceFailure); expect(failure).toMatchObject({ written: false });   // the rollback write landed
    expect(h.store.current()).toBe(a);
    const file = await h.read(); const dir = h.copy();
    const next = await restart(dir);
    await expect(next.vault.redact('plain text')).resolves.toBe('plain text');   // no committed entry outlived its file
    expect(refsOf(file?.account)).toEqual(refsOf(a));
    expect(file?.retiredRefs).toHaveLength(2); expect(file?.retiredRefs.some(ref => refsOf(a).includes(ref))).toBe(false);   // the new pair
    await expectConsistent(dir, refsOf(a));
  });

  test('a rollback whose write fails makes the new account live and returns it; a restart signs in with the same account', async () => {
    const h = await harness(); await h.signIn();
    h.spy.on('commit', (_ref, count) => { if (count === 3) { h.breakWrites(); return 'fail'; } });
    const next = await h.store.replace(issued(), T0, 'sign-in', h.signInAdmit());
    h.restoreWrites();
    expect(next).not.toBeNull(); expect(h.store.current()).toBe(next);
    expect(refsOf((await h.read())?.account)).toEqual(refsOf(next));
    // The known window (6.3): until the next start, the vault refuses a grant on the staged ref.
    expect(() => grantRead(h.vault, next!.accessRef)).toThrow('CREDENTIAL_CAPABILITY_DENIED');
    await expectConsistent(h.copy(), refsOf(next));
  });

  test('a rollback whose admit fails (a sign-out began) writes nothing and returns null; the sign-out leaves no account', async () => {
    const h = await harness(); await h.signIn();
    let atCommit = 0; let clear: Promise<unknown> | undefined;
    h.spy.on('commit', (_ref, count) => { if (count === 3) { atCommit = fileState(h.file).revision; clear = h.signOut(); return 'fail'; } });
    expect(await h.store.replace(issued(), T0, 'sign-in', h.signInAdmit())).toBeNull();
    expect(await clear).toBe('durable');
    // The clear writes twice (its steps 2 and 4); a rollback write would have added a third.
    expect(await h.read()).toMatchObject({ revision: atCommit + 2, account: null, retiredRefs: [] });
    expect(h.store.current()).toBeNull(); expect(await h.bins()).toEqual([]);
    await expectConsistent(h.copy(), null);
  });

  test('a writer queued behind it runs after the rollback: the file and live agree on the refreshed account (GS-3)', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    h.spy.on('commit', (_ref, count) => count === 3 ? 'fail' : undefined);   // the sign-in's first commit
    const signIn = h.store.replace(issued(), T0, 'sign-in', h.signInAdmit()).catch((error: unknown) => error);
    const refresh = h.refresh(a);                                             // waits on the lock behind the sign-in
    expect(await signIn).toBeInstanceOf(ReplaceFailure);
    const { account: r } = await refresh;
    await h.store.setLogin('no-such-sign-in', 'barrier');                    // anything queued after the refresh has run
    expect(r).not.toBeNull(); expect(h.store.current()).toBe(r);
    expect(refsOf((await h.read())?.account)).toEqual(refsOf(r));
    expect(await h.bins()).toEqual(refsOf(r).map(ref => `${ref}.bin`).sort());
    await expectConsistent(h.copy(), refsOf(r));
  });
});

describe('the retired list stays within 8 refs (DC-10)', () => {
  test('refreshes whose step-7 write fails keep the file valid with at most 8 retired refs, and a reopen still reads the account; a clear writes at most 8', async () => {
    const h = await harness(); let { account } = await h.signIn();
    let armed = false;
    h.spy.after('commit', (_ref, count) => { if (count % 2 === 0) armed = true; });
    h.spy.on('tombstone', () => { if (armed) { armed = false; h.breakWrites(); } });   // the first retirement of step 7
    const dropped: string[] = [];
    for (let round = 1; round <= 6; round++) {
      const before = await h.read();
      const { account: next } = await h.refresh(account); h.restoreWrites();
      expect(next).not.toBeNull(); account = next!;
      const file = await h.read();
      expect(file?.retiredRefs.length).toBe(Math.min(2 * round, 8));           // the step-7 write failed every time
      expect(refsOf(file?.account)).toEqual(refsOf(account));
      const listed = [...before!.retiredRefs, ...refsOf(before!.account)];
      dropped.push(...listed.slice(0, Math.max(0, listed.length - 8)));
      const reopened = await restart(h.copy());
      expect(refsOf(reopened.store.current())).toEqual(refsOf(account));
      if (round === 4) expect(file?.retiredRefs.length).toBe(8);
    }
    expect(dropped).toHaveLength(4);
    expect(h.spy.calls.every(call => call.fileValid && call.retired <= 8)).toBe(true);
    // A clear over the live pair and 8 retired refs: every file state it leaves holds at most 8.
    h.spy.calls.length = 0;
    expect(await h.signOut()).toBe('durable');
    expect(h.spy.calls.length).toBeGreaterThan(0);
    expect(h.spy.calls.every(call => call.fileValid && call.retired <= 8)).toBe(true);
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: [] });
    expect(await h.bins()).toEqual([]);
  });

  test('the refs the cap drops are tombstoned and removed, not only left out of the file (4.2)', async () => {
    const h = await harness(); let { account } = await h.signIn(); const first = refsOf(account);
    let inStep7 = false;
    h.spy.after('commit', (_ref, count) => { if (count % 2 === 0) inStep7 = true; });   // a refresh's second commit: step 7 follows
    h.spy.on('saveStaged', () => { inStep7 = false; });                                    // the next refresh begins
    h.spy.on('remove', () => (inStep7 ? 'fail' : undefined));                              // every step-7 removal fails (a Windows lock)
    for (let round = 1; round <= 5; round++) { const { account: next } = await h.refresh(account); expect(next).not.toBeNull(); account = next!; }
    const file = await h.read();
    expect(file?.retiredRefs).toHaveLength(8);                                             // rounds 1-4 retired 8 refs; round 5 dropped the first pair
    for (const ref of first) expect(file?.retiredRefs).not.toContain(ref);
    const index = JSON.parse(await readFile(join(h.data, 'vault', 'index.json'), 'utf8')) as { entries: Record<string, unknown> };
    for (const ref of first) { expect(await h.bins()).not.toContain(`${ref}.bin`); expect(index.entries[ref]).toBeUndefined(); }
    await expectConsistent(h.copy(), refsOf(account));
  });

  // The clear's own cap: a sign-out over the live pair and 8 retired refs drops the oldest pair from its file write, and removes it now,
  // so a 'durable' sign-out leaves no encrypted entry (4.2, 8.2's "deleted now") (U2-R12).
  test('a sign-out over the live pair and 8 retired refs whose files remain removes every file now, the dropped pair too', async () => {
    const h = await harness(); let { account } = await h.signIn(); const first = refsOf(account);
    let inStep7 = false;
    h.spy.after('commit', (_ref, count) => { if (count % 2 === 0) inStep7 = true; });   // a refresh's second commit: step 7 follows
    h.spy.on('saveStaged', () => { inStep7 = false; });                                    // the next refresh begins
    h.spy.on('remove', () => (inStep7 ? 'fail' : undefined));                              // every step-7 removal fails (a Windows lock)
    for (let round = 1; round <= 4; round++) { const { account: next } = await h.refresh(account); expect(next).not.toBeNull(); account = next!; }
    h.spy.on('remove'); h.spy.after('commit'); h.spy.on('saveStaged');
    const file = await h.read();
    expect(file?.retiredRefs).toHaveLength(8); expect(file?.retiredRefs.slice(0, 2)).toEqual(first);   // the clear's cap drops this pair
    for (const ref of first) expect(await h.bins()).toContain(`${ref}.bin`);
    expect(await h.signOut()).toBe('durable');
    expect(await h.bins()).toEqual([]);
    const index = JSON.parse(await readFile(join(h.data, 'vault', 'index.json'), 'utf8')) as { entries: Record<string, unknown> };
    expect(Object.keys(index.entries)).toEqual([]);
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: [] });
    await expectConsistent(h.copy(), null);
  });
});

describe('clear durability (DC-6, GS-11)', () => {
  test('durable when the tombstone persist succeeds and the file write fails; a restart reads no account', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    h.breakWrites();
    expect(await h.signOut()).toBe('durable');
    h.restoreWrites();
    expect(refsOf((await h.read())?.account)).toEqual(refsOf(a));             // the file never changed
    await expectConsistent(h.copy(), null);
  });

  test('durable when the file write succeeds and the tombstone persist fails; a restart reads no account and leaves no entry', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const restore = failVaultDisk(h.vault);
    expect(await h.signOut()).toBe('durable');
    restore();
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: refsOf(a) });   // their removal never reached the index
    await expectConsistent(h.copy(), null);
  });

  test('with both failing it retries once and returns not-durable; a restart with the on-disk index reads the account', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const restore = failVaultDisk(h.vault); h.breakWrites(); h.spy.on('remove', () => 'fail');
    expect(await h.signOut()).toBe('not-durable');
    restore(); h.restoreWrites();
    expect(h.spy.ops('tombstone')).toEqual([...refsOf(a), ...refsOf(a)].map(ref => `tombstone:${ref}`));   // the prologue, then one retry
    // The limit signOutIncomplete discloses (4.5): the next start reads the account again.
    await expectConsistent(h.copy(), refsOf(a));
  });

  test('a retry whose file write lands makes the clear durable', async () => {
    const h = await harness(); await h.signIn();
    const restore = failVaultDisk(h.vault); h.breakWrites();
    h.spy.on('tombstone', (_ref, count) => { if (count === 3) h.restoreWrites(); });   // the retry's first tombstone
    expect(await h.signOut()).toBe('durable');
    restore();
    expect((await h.read())?.account).toBeNull();
  });

  test('a retry whose tombstone persist lands makes the clear durable', async () => {
    const h = await harness(); await h.signIn();
    const restore = failVaultDisk(h.vault); h.breakWrites();
    h.spy.on('tombstone', (_ref, count) => { if (count === 3) restore(); });
    expect(await h.signOut()).toBe('durable');
    h.restoreWrites();
    await expectConsistent(h.copy(), null);
  });

  // DC-6's "either is enough": a prologue persist that landed carries the clear on its own (U2-R6).
  test('durable when the prologue\'s tombstone persist landed and every later write fails: no retry, and a restart reads no account', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const held = gate(); const lock = serialized(h.file, () => held.promise);   // the clear's locked part waits behind this
    const clear = h.signOut();
    await Promise.all(h.spy.persists);                                          // the prologue's tombstones reached disk
    const restore = failVaultDisk(h.vault); h.breakWrites(); h.spy.on('remove', () => 'fail');
    held.open(); await lock;
    expect(await clear).toBe('durable');
    restore(); h.restoreWrites(); h.spy.on('remove');
    expect(h.spy.ops('tombstone')).toEqual(refsOf(a).map(ref => `tombstone:${ref}`));   // the prologue's two only: no retry
    await expectConsistent(h.copy(), null);
  });

  test('a clear with no account and only retired refs is durable when its file write fails (U2-R6)', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    h.spy.on('remove', () => 'fail');
    expect(await h.signOut()).toBe('durable');
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: refsOf(a) });
    h.breakWrites();
    expect(await h.store.clear(() => true)).toBe('durable');                   // nothing names an account, so nothing can come back
    h.restoreWrites(); h.spy.on('remove');
    await expectConsistent(h.copy(), null);
  });

  test('GS-11: the tombstone persist succeeds and remove fails: durable, the file names the refs, and a restart deletes their files', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    h.spy.on('remove', () => 'fail');
    expect(await h.signOut()).toBe('durable');
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: refsOf(a) });
    expect(await h.bins()).toEqual(refsOf(a).map(ref => `${ref}.bin`).sort());
    await expectConsistent(h.copy(), null);
  });

  test('GS-11 on a failing vault disk: the refs stay named, so the next start deletes entries the index never saw tombstoned', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const restore = failVaultDisk(h.vault); h.spy.on('remove', () => 'fail');
    expect(await h.signOut()).toBe('durable');
    restore();
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: refsOf(a) });
    await expectConsistent(h.copy(), null);
  });

  // vault.remove drops the entry from memory before its persist (vault.ts:178-179). After a removal whose persist failed, a later
  // remove answers CREDENTIAL_NOT_TOMBSTONED while the on-disk index may still hold the entry committed, without its file (U2-R8).
  test('a ref whose earlier removal never reached the vault index stays named through a sign-out, so the next start can redact', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    let restore: (() => void) | undefined;
    h.spy.after('commit', (_ref, count) => { if (count === 4) restore = failVaultDisk(h.vault); });   // from the refresh's step 7 on
    await h.refresh(a);
    expect((await h.read())?.retiredRefs).toEqual(refsOf(a));                    // step 7 kept the old pair named
    expect(await h.signOut()).toBe('durable');                                   // the file write lands; the vault index still fails
    restore!();
    const file = await h.read(); const dir = h.copy();
    const next = await restart(dir);
    await expect(next.vault.redact('plain text')).resolves.toBe('plain text');  // no committed entry outlived its file (vault.ts:187-188)
    expect(file?.retiredRefs).toEqual(expect.arrayContaining(refsOf(a)));
    await expectConsistent(dir, null);
  });

  test('once a vault persist lands, a ref whose earlier removal failed counts as removed: a sign-out leaves no retired ref', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    let restore: (() => void) | undefined;
    h.spy.after('commit', (_ref, count) => { if (count === 4) restore = failVaultDisk(h.vault); });   // from the refresh's step 7 on
    await h.refresh(a);
    restore!();                                                                  // the vault index writes again
    expect((await h.read())?.retiredRefs).toEqual(refsOf(a));
    expect(await h.signOut()).toBe('durable');                                   // its tombstone persists land, recording the old pair's deletion
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: [] });
    await expectConsistent(h.copy(), null);
  });

  // A sign-out while a replace is past its step-4 write: the replace commits, its step-6 admit refuses, and the file names the
  // new pair, which the prologue never took. A prologue persist then records only the old pair, so it must not count (DC-6).
  for (const kind of ['sign-in', 'refresh'] as const) {
    test.each([
      ['every write fails', 'all', { result: 'not-durable', signedInNextStart: true }],
      ['only the account file and the removals fail', 'file', { result: 'durable', signedInNextStart: false }],
    ] as const)(`a sign-out racing a ${kind} past its file write, then a failing disk (%s): 'durable' only when the next start reads no account`, async (_name, failing, expected) => {
      const h = await harness(); const { account: a } = await h.signIn();
      const reached = gate(); const held = gate(); let clear: Promise<unknown> | undefined;
      h.spy.on('commit', (_ref, n) => { if (n === 3) { clear = h.signOut(); reached.open(); return held.promise; } });   // the replace's first commit
      let restore: (() => void) | undefined;
      // From the clear's step 1 (its first tombstone of a ref the prologue did not take), the disk fails.
      h.spy.on('tombstone', (_ref, n) => { if (n === 3) { if (failing === 'all') restore = failVaultDisk(h.vault); h.breakWrites(); h.spy.on('remove', () => 'fail'); } });
      const replace = h.store.replace(issued(), T0, kind, kind === 'sign-in' ? h.signInAdmit() : h.refreshAdmit(a));
      await reached.promise; await Promise.all(h.spy.persists);                 // the prologue's tombstones reached disk
      held.open();
      expect(await replace).toBeNull();                                         // step 6 refused: the file names the new pair
      const result = await clear;
      restore?.(); h.restoreWrites();
      const named = refsOf((await h.read())?.account);
      expect(named).toHaveLength(2); expect(named.some(ref => refsOf(a).includes(ref))).toBe(false);
      const next = await restart(h.copy());
      expect({ result, signedInNextStart: next.store.current() !== null }).toEqual(expected);
      if (expected.signedInNextStart) expect(refsOf(next.store.current())).toEqual(named);   // the limit 'not-durable' discloses (4.5)
    });
  }

  // The same race, where the clear's step-1 persists of the new pair land before the disk fails: those persists record every account
  // ref, so they carry the clear in its first round, with no retry (DC-6, U2-R2's rule) (U2-R12).
  test('a sign-out racing a refresh past its file write: its step-1 persists land, then every write fails: durable, no retry, no account at the next start', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const reached = gate(); const held = gate(); let clear: Promise<unknown> | undefined;
    h.spy.on('commit', (_ref, n) => { if (n === 3) { clear = h.signOut(); reached.open(); return held.promise; } });   // the refresh's first commit
    let restore: (() => void) | undefined;
    h.spy.on('tombstone', (_ref, n) => { if (n === 3) h.breakWrites(); });                 // the clear's step 1: its file write will fail
    h.spy.after('tombstone', (_ref, n) => { if (n === 4) { restore = failVaultDisk(h.vault); h.spy.on('remove', () => 'fail'); } });   // step 1's persists landed
    const replace = h.store.replace(issued(), T0, 'refresh', h.refreshAdmit(a));
    await reached.promise; await Promise.all(h.spy.persists);                   // the prologue's tombstones reached disk
    held.open();
    expect(await replace).toBeNull();                                           // step 6 refused: the file names the new pair
    const result = await clear;
    restore!(); h.restoreWrites(); h.spy.on('remove');
    const named = refsOf((await h.read())?.account);
    expect(named).toHaveLength(2); expect(named.some(ref => refsOf(a).includes(ref))).toBe(false);
    expect(result).toBe('durable');
    expect(h.spy.ops('tombstone')).toEqual([...refsOf(a), ...named].map(ref => `tombstone:${ref}`));   // the prologue and step 1: no retry
    await expectConsistent(h.copy(), null);
  });

  // A clear that reached disk nowhere leaves the account file naming a pair the on-disk index may still hold staged. Its files must
  // stay: the next start's reconcile commits a referenced staged entry only if its file is there (vault.ts:109-110) (U2-R7).
  test('a not-durable clear after a refresh whose commit failed on a full disk keeps the files: the next start signs in with the pair the file names', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    let restore: (() => void) | undefined;
    // The refresh's first commit: from here the vault index and the account file fail to write, while unlinks still land.
    h.spy.on('commit', (_ref, count) => { if (count === 3) { restore = failVaultDisk(h.vault); h.breakWrites(); } });
    const failure = await h.refresh(a).catch((error: unknown) => error);
    expect(failure).toMatchObject({ written: true });
    expect(await h.store.clear(live => live?.accessRef === a.accessRef)).toBe('not-durable');   // the service's clearIf (6.5, X-9)
    restore!(); h.restoreWrites();
    const named = refsOf((await h.read())?.account);
    expect(named).toHaveLength(2); expect(named.some(ref => refsOf(a).includes(ref))).toBe(false);
    await expectConsistent(h.copy(), named);                                    // the limit 'not-durable' discloses (4.5)
  });

  test('a not-durable sign-out of a sign-in whose rollback write failed on a full disk keeps the files: the next start signs in again', async () => {
    const h = await harness(); await h.signIn();
    let restore: (() => void) | undefined;
    h.spy.on('commit', (_ref, count) => { if (count === 3) { restore = failVaultDisk(h.vault); h.breakWrites(); } });   // the sign-in's first commit
    const next = await h.store.replace(issued(), T0, 'sign-in', h.signInAdmit());
    expect(next).not.toBeNull();                                                 // the store follows the file (4.3 step 5)
    expect(await h.signOut()).toBe('not-durable');
    restore!(); h.restoreWrites();
    expect(refsOf((await h.read())?.account)).toEqual(refsOf(next));
    await expectConsistent(h.copy(), refsOf(next));
  });

  test('a clear with nothing to clear is durable and writes nothing; an unadmitted clear changes nothing', async () => {
    const h = await harness();
    expect(await h.signOut()).toBe('durable'); expect(await h.read()).toBeNull();
    const { account: a } = await h.signIn(); const before = await h.read();
    expect(await h.store.clear(live => live?.accessRef === 'another-ref')).toBe('not-admitted');
    expect(h.store.current()).toBe(a); expect(await h.read()).toEqual(before);
  });
});

describe('open and finishStartup never throw (4.4, L-11)', () => {
  const valid = (ref: string) => ({ version: 1, revision: 3, account: { clientId: CLIENT, accessRef: ref, refreshRef: null, accessExpiresAt: null, refreshExpiresAt: null, obtainedAt: new Date(T0).toISOString(), login: null }, retiredRefs: [], updatedAt: new Date(T0).toISOString() });
  const cases: [string, (file: string) => Promise<void>, 'none' | 'rewritten' | 'unwritable'][] = [
    ['missing', async () => {}, 'none'],
    ['invalid JSON', file => writeFile(file, '{"version":1,"account"'), 'rewritten'],
    ['oversized', file => writeFile(file, JSON.stringify(valid(randomUUID())) + ' '.repeat(64 * 1024)), 'rewritten'],
    ['an extra key', file => writeFile(file, JSON.stringify({ ...valid(randomUUID()), token: 'x' })), 'rewritten'],
    ['an extra account key', file => { const value = valid(randomUUID()); return writeFile(file, JSON.stringify({ ...value, account: { ...value.account, scope: 'x' } })); }, 'rewritten'],
    ['a refresh ref without its expiry', file => { const value = valid(randomUUID()); return writeFile(file, JSON.stringify({ ...value, account: { ...value.account, refreshRef: randomUUID() } })); }, 'rewritten'],
    ['nine retired refs', file => writeFile(file, JSON.stringify({ ...valid(randomUUID()), retiredRefs: Array.from({ length: 9 }, () => randomUUID()) })), 'rewritten'],
    ['a directory', async file => { await mkdir(join(file, 'inner'), { recursive: true }); }, 'unwritable'],
  ];
  test.each(cases)('%s reads as no account', async (_name, plant, after) => {
    const h = await harness(); await mkdir(join(h.data, 'github'), { recursive: true }); await plant(h.file);
    const next = new GitHubAccountStore(h.file, h.spy, CLIENT);
    await expect(next.open()).resolves.toBeUndefined();
    expect(next.current()).toBeNull(); expect(next.references()).toEqual([]); expect(next.openedAppChanged()).toBe(false);
    await expect(next.finishStartup()).resolves.toBeUndefined();
    if (after === 'none') expect(existsSync(h.file)).toBe(false);
    if (after === 'rewritten') expect(await h.read()).toMatchObject({ account: null, retiredRefs: [] });
  });

  test('a vault that rejects every call does not stop startup', async () => {
    const h = await harness(); await h.signIn();
    await atomicJson(h.file, { ...(await h.read())!, retiredRefs: [randomUUID()] });
    for (const op of ['tombstone', 'has', 'remove', 'commit', 'saveStaged'] as const) h.spy.on(op, () => 'fail');
    const next = new GitHubAccountStore(h.file, h.spy, CLIENT);
    await expect(next.open()).resolves.toBeUndefined();
    await expect(next.finishStartup()).resolves.toBeUndefined();
    expect(next.current()).toBeNull();
  });
});

describe('startup checks (4.4)', () => {
  test('refs that are not committed read as no account', async () => {
    const h = await harness();
    await atomicJson(h.file, { version: 1, revision: 1, account: { clientId: CLIENT, accessRef: randomUUID(), refreshRef: null, accessExpiresAt: null, refreshExpiresAt: null, obtainedAt: new Date(T0).toISOString(), login: null }, retiredRefs: [], updatedAt: new Date(T0).toISOString() });
    await expectConsistent(h.copy(), null);
  });

  test('a half-present pair is dropped, and its committed entry is deleted by the next start', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const dir = h.copy(); rmSync(join(dir, 'vault', `${a.refreshRef}.bin`));
    const first = await restart(dir);
    expect(first.store.current()).toBeNull();
    expect(JSON.parse(await readFile(first.file, 'utf8'))).toMatchObject({ account: null, retiredRefs: [a.accessRef] });
    await expectConsistent(dir, null);
  });

  test('a half-present pair dropped while the vault disk fails stays named whole, so no committed entry outlives its file', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const dir = h.copy(); rmSync(join(dir, 'vault', `${a.refreshRef}.bin`));
    // The first start as restart() runs it, except that every vault index write fails during finishStartup.
    const vault = new Vault(join(dir, 'vault'), cryptor); await vault.initialize('epoch-2');
    const file = join(dir, 'github', 'account.json'); const spy = new SpyVault(vault, file);
    const store = new GitHubAccountStore(file, spy, CLIENT, () => T0 + 3_600_000); spy.store = store;
    await store.open(); await vault.reconcile(new Set(store.references()));
    const restore = failVaultDisk(vault); await store.finishStartup(); restore();
    expect(store.current()).toBeNull();
    const written = JSON.parse(await readFile(file, 'utf8')) as unknown;
    // The next start: redaction works, because no committed index entry is left without its file (vault.ts:187-188).
    const next = await restart(dir);
    await expect(next.vault.redact('plain text')).resolves.toBe('plain text');
    expect(written).toMatchObject({ account: null, retiredRefs: refsOf(a) });
    await expectConsistent(dir, null);
  });

  test('another non-empty client ID tombstones the refs, reads as no account and sets openedAppChanged (DC-15)', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const next = await restart(h.copy(), 'Iv1.another-app');
    expect(next.spy.ops('tombstone')).toEqual(refsOf(a).map(ref => `tombstone:${ref}`));
    expect(next.references).toEqual([]);
    expect(next.store.current()).toBeNull(); expect(next.store.openedAppChanged()).toBe(true);
    expect(JSON.parse(await readFile(next.file, 'utf8'))).toMatchObject({ account: null, retiredRefs: [] });
    expect((await readdir(join(next.file, '..', '..', 'vault'))).filter(name => name.endsWith('.bin'))).toEqual([]);
  });

  test('an empty client ID keeps the account and its refs (D-7); the same client ID keeps it with a new signInId', async () => {
    const h = await harness(); const { account: a } = await h.signIn(); const before = await h.read();
    const dev = await restart(h.copy(), '');
    expect(refsOf(dev.store.current())).toEqual(refsOf(a)); expect(dev.references).toEqual(refsOf(a));
    expect(dev.store.openedAppChanged()).toBe(false);
    expect(JSON.parse(await readFile(dev.file, 'utf8'))).toEqual(before);
    for (const ref of refsOf(a)) expect(await dev.vault.has(ref)).toBe(true);
    const same = await expectConsistent(h.copy(), refsOf(a));
    expect(same.store.current()?.signInId).not.toBe(a.signInId);
    expect(same.store.current()).toMatchObject({ accessExpiresAt: a.accessExpiresAt, refreshExpiresAt: a.refreshExpiresAt, obtainedAt: a.obtainedAt });
  });

  test('a retirement whose removal fails on a failing vault disk stays named, so the next start deletes it (4.3 step 7)', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    let restore: (() => void) | undefined;
    h.spy.after('commit', (_ref, count) => { if (count === 4) restore = failVaultDisk(h.vault); });   // from step 7 on
    h.spy.on('remove', () => 'fail');
    const { account: r } = await h.refresh(a);
    restore!(); h.spy.on('remove');
    expect(h.store.current()).toBe(r);
    expect(await h.read()).toMatchObject({ account: { accessRef: r!.accessRef }, retiredRefs: refsOf(a) });
    await expectConsistent(h.copy(), refsOf(r));
  });

  test('retired refs left by an interrupted retirement are tombstoned at open and deleted by the reconcile', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const { account: r } = await h.refresh(a);
    await atomicJson(h.file, { ...(await h.read())!, retiredRefs: refsOf(a) });   // as if step 7's removals had not run
    const next = await expectConsistent(h.copy(), refsOf(r));
    expect(next.spy.ops('tombstone')).toEqual(refsOf(a).map(ref => `tombstone:${ref}`));
  });

  test('a valid file that could not be read (an I/O error) reads as no account and is not rewritten, so the next start signs in (U2-R9)', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const dir = h.copy(); const file = join(dir, 'github', 'account.json'); const before = readFileSync(file, 'utf8');
    // The node project runs files in one worker without isolation, so no vi.mock: lstat is swapped on the builtin and synced to
    // every importer, as tests/review-workspace-layers.test.ts:16-24 does. It fails for this file during open() only.
    const realLstat = fsp.lstat;
    (fsp as { lstat: unknown }).lstat = (path: string) =>
      path === file ? Promise.reject(Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' })) : realLstat(path);
    syncBuiltinESMExports();
    const vault = new Vault(join(dir, 'vault'), cryptor); await vault.initialize('epoch-2');
    const store = new GitHubAccountStore(file, vault, CLIENT, () => T0 + 3_600_000);
    try { await store.open(); } finally { (fsp as { lstat: unknown }).lstat = realLstat; syncBuiltinESMExports(); }
    expect(store.current()).toBeNull();                                         // this start reads no account
    await vault.reconcile(new Set(store.references())); await store.finishStartup();
    expect(readFileSync(file, 'utf8')).toBe(before);                            // the valid file is kept
    await expectConsistent(dir, refsOf(a));
  });

  /** A start as restart() runs it, except that open() cannot read the account file (EBUSY). With keepBusy, lstat keeps failing for the
   *  file until the caller runs `restore`, which it must do in a finally. */
  async function unreadStart(dir: string, keepBusy = false) {
    const file = join(dir, 'github', 'account.json');
    const vault = new Vault(join(dir, 'vault'), cryptor); await vault.initialize('epoch-2');
    const store = new GitHubAccountStore(file, vault, CLIENT, () => T0 + 3_600_000);
    const restore = busyLstat(file);
    try { await store.open(); } finally { if (!keepBusy) restore(); }
    await vault.reconcile(new Set(store.references())); await store.finishStartup();
    return { file, vault, store, restore };
  }

  // Such a start shows no account, so the next step is a sign-in in the same session. It re-reads the file under the lock, so the pair
  // the file names is retired, not written over and left committed in the vault for good (the reconcile never deletes it) (U2-R13).
  test('a sign-in after a start that could not read a valid file re-reads it, so the pair it names is retired, not left in the vault', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const dir = h.copy(); const { file, vault, store } = await unreadStart(dir);
    expect(store.current()).toBeNull();
    const next = await store.replace(issued(), T0, 'sign-in', () => true);
    expect(next).not.toBeNull(); expect(store.current()).toBe(next);
    for (const ref of refsOf(a)) expect(await vault.has(ref)).toBe(false);     // retired at step 7, not left committed
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ revision: 3, account: { accessRef: next!.accessRef }, retiredRefs: [] });
    await expectConsistent(dir, refsOf(next));
  });

  test('a sign-in while the file still cannot be read fails with ReplaceFailure(false): its staged pair is removed and the file is kept', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const dir = h.copy(); const before = readFileSync(join(dir, 'github', 'account.json'), 'utf8');
    const { file, store, restore } = await unreadStart(dir, true);
    let failure: unknown;
    try { failure = await store.replace(issued(), T0, 'sign-in', () => true).catch((error: unknown) => error); } finally { restore(); }
    expect(failure).toBeInstanceOf(ReplaceFailure); expect(failure).toMatchObject({ written: false });
    expect(store.current()).toBeNull();
    expect(readFileSync(file, 'utf8')).toBe(before);
    expect(await h.bins(dir)).toEqual(refsOf(a).map(ref => `${ref}.bin`).sort());
    await expectConsistent(dir, refsOf(a));
  });

  // The re-read refuses only an I/O error: a file found invalid or missing by then holds no account, so the sign-in writes over it (U2-R13).
  test.each([['invalid', '{"version":1,"account"'], ['missing', null]] as const)('a file unread at open and %s at the sign-in\'s re-read holds no account: the sign-in writes over it', async (_name, content) => {
    const h = await harness(); const dir = h.copy(); const file = join(dir, 'github', 'account.json');
    if (content !== null) { await mkdir(join(dir, 'github'), { recursive: true }); await writeFile(file, content); }
    const { store } = await unreadStart(dir);
    expect(existsSync(file) ? readFileSync(file, 'utf8') : null).toBe(content);   // not rewritten at startup (U2-R9)
    const next = await store.replace(issued(), T0, 'sign-in', () => true);
    expect(next).not.toBeNull(); expect(store.current()).toBe(next);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ revision: 1, account: { accessRef: next!.accessRef }, retiredRefs: [] });
    await expectConsistent(dir, refsOf(next));
  });
});

describe('crash windows (S-7, 4.5)', () => {
  type Point = { name: string; arm: (h: Awaited<ReturnType<typeof harness>>, take: () => void) => void; expect: 'old' | 'new' };
  const points: Point[] = [
    { name: 'after staging, before the file write', arm: (h, take) => h.spy.after('saveStaged', (_ref, count) => { if (count === 4) take(); }), expect: 'old' },
    { name: 'after the file write, before commit', arm: (h, take) => h.spy.on('commit', (_ref, count) => { if (count === 3) take(); }), expect: 'new' },
    { name: 'between the two commits (a failed commit before its rollback)', arm: (h, take) => h.spy.on('commit', (_ref, count) => { if (count === 4) take(); }), expect: 'new' },
    { name: 'after commit, before retiring', arm: (h, take) => h.spy.on('tombstone', (_ref, count) => { if (count === 1) take(); }), expect: 'new' },
    { name: 'after retiring, before the step-7 write', arm: (h, take) => h.spy.after('remove', (_ref, count) => { if (count === 2) take(); }), expect: 'new' },
  ];
  for (const kind of ['sign-in', 'refresh'] as const) {
    test.each(points)(`${kind}: a crash $name`, async point => {
      const h = await harness(); const { account: a } = await h.signIn();
      let dir: string | undefined; point.arm(h, () => { dir = h.snapshot(); });
      const next = await h.store.replace(issued(), T0, kind, kind === 'sign-in' ? h.signInAdmit() : h.refreshAdmit(a));
      expect(dir).toBeDefined();
      await expectConsistent(dir!, point.expect === 'old' ? refsOf(a) : refsOf(next));
      await expectConsistent(h.copy(), refsOf(next));
    });
  }

  // Commit 2 failing means commit 1 landed: the on-disk index holds the new access ref committed, which the reconcile never deletes
  // unless the file names it (U2-R11).
  test.each([[1, 'both new refs still staged'], [2, 'the first commit landed']] as const)('a sign-in: a crash after its rollback write, before the new refs are removed (commit %i failed: %s)', async (failing, _what) => {
    const h = await harness(); const { account: a } = await h.signIn();
    h.spy.on('commit', (_ref, count) => count === 2 + failing ? 'fail' : undefined);
    let dir: string | undefined; h.spy.on('tombstone', (_ref, count) => { if (count === 1) dir = h.snapshot(); });
    await expect(h.store.replace(issued(), T0, 'sign-in', h.signInAdmit())).rejects.toBeInstanceOf(ReplaceFailure);
    await expectConsistent(dir!, refsOf(a));
  });

  test('a sign-out: a crash after the prologue\'s tombstones, before its locked part', async () => {
    const h = await harness(); await h.signIn();
    const held = gate(); const lock = serialized(h.file, () => held.promise);
    const clear = h.signOut();
    await Promise.all(h.spy.persists);
    const dir = h.snapshot(); held.open(); await lock;
    expect(await clear).toBe('durable');
    await expectConsistent(dir, null);
  });

  test.each([['after its file write, before the removals', 'on'], ['after the removals, before the last write', 'after']] as const)('a sign-out: a crash %s', async (_name, when) => {
    const h = await harness(); await h.signIn(); let dir: string | undefined;
    if (when === 'on') h.spy.on('remove', (_ref, count) => { if (count === 1) dir = h.snapshot(); });
    else h.spy.after('remove', (_ref, count) => { if (count === 2) dir = h.snapshot(); });
    expect(await h.signOut()).toBe('durable');
    await expectConsistent(dir!, null);
  });
});

describe('concurrency (L-6)', () => {
  const gates: [string, Op, number][] = [['after staging', 'saveStaged', 4], ['before commit', 'commit', 3], ['while retiring', 'remove', 1]];
  for (const kind of ['sign-in', 'refresh'] as const) {
    test.each(gates)(`a sign-out during a ${kind}'s replace (%s) leaves no live account and no orphan`, async (_name, op, count) => {
      const h = await harness(); const { account: a } = await h.signIn();
      const reached = gate(); const held = gate(); let clear: Promise<unknown> | undefined;
      h.spy.on(op, (_ref, n) => { if (n === count) { clear = h.signOut(); reached.open(); return held.promise; } });
      const replace = h.store.replace(issued(), T0, kind, kind === 'sign-in' ? h.signInAdmit() : h.refreshAdmit(a));
      await reached.promise; await Promise.all(h.spy.persists);                 // the prologue's tombstones land while replace waits
      held.open();
      await replace; expect(await clear).toBe('durable');
      if (op === 'saveStaged') expect(h.spy.ops('commit')).toEqual(refsOf(a).map(ref => `commit:${ref}`));   // refused at step 3: nothing committed
      expect(h.store.current()).toBeNull();
      expect((await h.read())?.account).toBeNull();
      expect(await h.bins()).toEqual([]);
      await expectConsistent(h.copy(), null);
    });
  }

  test('a clear whose prologue ran before a sign-in was admitted leaves the new account live and named (DC-4)', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const signIn = h.store.replace(issued(), T0, 'sign-in', h.signInAdmit());     // queued; its step 1 has not run yet
    const clear = h.store.clear(live => live?.accessRef === a.accessRef);        // an app clear of the old account
    expect(h.store.current()).toBeNull();
    const next = await signIn;
    expect(await clear).toBe('durable');
    expect(next).not.toBeNull(); expect(h.store.current()).toBe(next);
    expect(refsOf((await h.read())?.account)).toEqual(refsOf(next));
    expect(await h.bins()).toEqual(refsOf(next).map(ref => `${ref}.bin`).sort());
    await expectConsistent(h.copy(), refsOf(next));
  });

  test('the prologue revokes a grant synchronously', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    const { binding, capability } = grantRead(h.vault, a.accessRef);
    const clear = h.signOut();
    const denied = h.vault.withSecret(capability, binding, value => value);       // before anything is awaited
    expect(h.store.current()).toBeNull();
    expect(() => grantRead(h.vault, a.accessRef)).toThrow('CREDENTIAL_CAPABILITY_DENIED');
    await expect(denied).rejects.toThrow('CREDENTIAL_CAPABILITY_DENIED');
    expect(await clear).toBe('durable');
  });

  test('replaces are serialized per file: a second sign-in waits for the first, then retires it', async () => {
    const h = await harness();
    const reached = gate(); const held = gate();
    h.spy.on('commit', (_ref, count) => { if (count === 1) { reached.open(); return held.promise; } });
    const pending = h.store.replace(issued(), T0, 'sign-in', () => true);
    await reached.promise; const mark = h.spy.calls.length;                    // the first holds the lock, waiting at its commit
    const later = h.store.replace(issued(), T0, 'sign-in', () => true);
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(h.spy.calls.slice(mark)).toEqual([]);                                // the second has not touched the vault
    held.open();
    const [first, second] = await Promise.all([pending, later]);
    expect(h.store.current()).toBe(second);
    expect(await h.read()).toMatchObject({ revision: 3, account: { accessRef: second!.accessRef }, retiredRefs: [] });
    expect(await h.bins()).toEqual(refsOf(second).map(ref => `${ref}.bin`).sort());
    expect(refsOf(first).some(ref => refsOf(second).includes(ref))).toBe(false);
    await expectConsistent(h.copy(), refsOf(second));
  });

  test('setLogin for another sign-in is a no-op; after a refresh of the same sign-in it applies, and a later refresh keeps it (GS-10)', async () => {
    const h = await harness(); const { account: a } = await h.signIn(); const before = await h.read();
    await h.store.setLogin(randomUUID(), 'octo-cat');
    expect(h.store.current()?.login).toBeNull(); expect(await h.read()).toEqual(before);
    const { account: r } = await h.refresh(a);
    expect(r?.signInId).toBe(a.signInId);
    await h.store.setLogin(a.signInId, 'octo-cat');
    expect(h.store.current()).toMatchObject({ accessRef: r!.accessRef, login: 'octo-cat', signInId: a.signInId });
    expect((await h.read())?.account?.login).toBe('octo-cat');
    const { account: later } = await h.refresh(h.store.current()!);
    expect(later).toMatchObject({ login: 'octo-cat', signInId: a.signInId });
    expect((await h.read())?.account?.login).toBe('octo-cat');
    const { account: again } = await h.signIn();
    expect(again).toMatchObject({ login: null }); expect(again.signInId).not.toBe(a.signInId);
    await h.store.setLogin(a.signInId, 'octo-cat-2');
    expect(h.store.current()?.login).toBeNull();
  });

  test('setLogin refuses a login the file schema would reject, and after a sign-out, without throwing', async () => {
    const h = await harness(); const { account: a } = await h.signIn(); const before = await h.read();
    await expect(h.store.setLogin(a.signInId, '-not a login')).resolves.toBeUndefined();
    expect(h.store.current()?.login).toBeNull(); expect(await h.read()).toEqual(before);
    const login = h.store.setLogin(a.signInId, 'octo-cat'); const clear = h.signOut();
    await login; await clear;
    expect(h.store.current()).toBeNull(); expect((await h.read())?.account).toBeNull();
  });

  // After a refresh's ReplaceFailure(true) the file names the new pair and live the old one; the login would land on one and not the
  // other, so setLogin writes only while the file names live's pair. The service clears the account next (X-9) (U2-R10).
  test('setLogin after a refresh whose commit failed changes nothing: the file names a pair live does not', async () => {
    const h = await harness(); const { account: a } = await h.signIn();
    h.spy.on('commit', (_ref, count) => count === 3 ? 'fail' : undefined);      // the refresh's first commit
    await expect(h.refresh(a)).rejects.toMatchObject({ written: true });
    const before = await h.read();
    expect(before?.account?.accessRef).not.toBe(a.accessRef);
    await h.store.setLogin(a.signInId, 'octo-cat');
    expect(h.store.current()).toBe(a); expect(await h.read()).toEqual(before);
  });

  test('a sign-out that lands while setLogin is writing is not undone: no account in memory, in the file or in the vault (GS-10)', async () => {
    // The injected clock is read inside setLogin's write, before atomicJson, so the clear's prologue runs mid-write.
    let midWrite: (() => void) | undefined;
    const h = await harness(CLIENT, () => { const run = midWrite; midWrite = undefined; run?.(); return T0; });
    const { account: a } = await h.signIn();
    let clear: Promise<unknown> | undefined;
    midWrite = () => { clear = h.signOut(); };
    await h.store.setLogin(a.signInId, 'octo-cat');
    expect(clear).toBeDefined();
    expect(await clear).toBe('durable');
    expect(h.store.current()).toBeNull();
    expect(await h.read()).toMatchObject({ account: null, retiredRefs: [] });
    expect(await h.bins()).toEqual([]);
    await expectConsistent(h.copy(), null);
  });
});

describe('two vault entries and no token on disk (S-1, S-2)', () => {
  test('each token is its own vault entry, so redaction removes each one', async () => {
    const h = await harness(); const { tokens } = await h.signIn();
    const text = await h.vault.redact(`a ${tokens.access} b ${tokens.refresh} c`);
    expect(text).toBe('a [redacted] b [redacted] c');
  });

  test('the file and the vault directory hold no marker in UTF-8 or UTF-16LE; the login is the positive control', async () => {
    const h = await harness();
    const scan = async (dir: string, needle: string) => {
      const hits: string[] = [];
      const walk = async (path: string) => {
        for (const entry of await readdir(path, { withFileTypes: true })) {
          const child = join(path, entry.name);
          if (entry.isDirectory()) await walk(child);
          else { const bytes = await readFile(child); if (bytes.includes(Buffer.from(needle, 'utf8')) || bytes.includes(Buffer.from(needle, 'utf16le'))) hits.push(child); }
        }
      };
      await walk(dir); return hits;
    };
    // The scanner itself finds a planted marker in both encodings.
    const control = join(h.root, 'control'); await mkdir(control); const planted = marker('ghu');
    await writeFile(join(control, 'utf8'), planted, 'utf8'); await writeFile(join(control, 'utf16'), planted, 'utf16le');
    expect((await scan(control, planted)).length).toBe(2);
    const { account: a, tokens } = await h.signIn(); const { tokens: refreshed } = await h.refresh(a);
    await h.store.setLogin(a.signInId, 'octo-cat');
    const markers = [tokens.access, tokens.refresh!, refreshed.access, refreshed.refresh!];
    for (const needle of markers) expect(await scan(h.data, needle)).toEqual([]);
    expect(await scan(join(h.data, 'github'), 'octo-cat')).toEqual([h.file]);
    expect(Object.keys((await h.read())!.account!).sort()).toEqual(['accessExpiresAt', 'accessRef', 'clientId', 'login', 'obtainedAt', 'refreshExpiresAt', 'refreshRef']);
    await h.signOut();
    for (const needle of markers) expect(await scan(h.data, needle)).toEqual([]);
  });
});

// ---- U2-R15: the rollback's own cap (DC-10, 4.2). Ported by the lead from the third review's probes P13 and P14. ----
/** Four refreshes whose step-7 removals fail leave 8 retired refs (pre-mortem 5); returns the live account and every pair so far. */
async function eightRetired(h: Awaited<ReturnType<typeof harness>>) {
  let { account } = await h.signIn(); const pairs: string[][] = [refsOf(account)];
  let inStep7 = false;
  h.spy.after('commit', (_ref, count) => { if (count % 2 === 0) inStep7 = true; });
  h.spy.on('saveStaged', () => { inStep7 = false; });
  h.spy.on('remove', () => (inStep7 ? 'fail' : undefined));
  for (let round = 1; round <= 4; round++) { const { account: next } = await h.refresh(account); account = next!; pairs.push(refsOf(account)); }
  h.spy.on('remove'); h.spy.after('commit'); h.spy.on('saveStaged');
  return { account, pairs };
}
describe('a sign-in\'s rollback keeps retiredRefs within 8 (U2-R15)', () => {
  // Guard: the cap on the rollback's first write. Without it the write breaks the 8-ref schema, the store follows the file to the
  // new, still-staged pair (every grant refused) and step 7 removes the previous, working pair.
  test.each([1, 2])('commit %i of a sign-in fails over a file with 8 retired refs: ReplaceFailure(false), the previous account stands', async failing => {
    const h = await harness(); const { account } = await eightRetired(h);
    expect((await h.read())?.retiredRefs).toHaveLength(8);
    h.spy.on('commit', (_ref, count) => count === 10 + failing ? 'fail' : undefined);
    const result = await h.store.replace(issued(), T0, 'sign-in', h.signInAdmit()).catch((error: unknown) => error);
    expect(result).toBeInstanceOf(ReplaceFailure);
    expect(h.store.current()).toBe(account);
    expect(refsOf((await h.read())?.account)).toEqual(refsOf(account));
    await expectConsistent(h.copy(), refsOf(account));
  });
  // Guard: the cap retires what it drops. After a sign-out whose removals failed (account null, 8 retired), only the rollback's cap
  // drops the oldest pair; 4.2 says that writer removes it now.
  test('a failed sign-in over account null and 8 retired refs removes the pair its rollback drops', async () => {
    const h = await harness(); const { pairs } = await eightRetired(h);
    h.spy.on('remove', () => 'fail'); expect(await h.signOut()).toBe('durable'); h.spy.on('remove');
    const afterClear = await h.read(); expect(afterClear?.account).toBeNull(); expect(afterClear?.retiredRefs).toHaveLength(8);
    const dropped = afterClear!.retiredRefs.slice(0, 2);
    expect(dropped).toEqual(pairs[1]);
    h.spy.on('commit', (_ref, count) => count === 12 ? 'fail' : undefined);
    const result = await h.store.replace(issued(), T0, 'sign-in', h.signInAdmit()).catch((error: unknown) => error);
    expect(result).toBeInstanceOf(ReplaceFailure);
    for (const ref of dropped) expect(await h.bins()).not.toContain(`${ref}.bin`);
    await expectConsistent(h.copy(), null);
  });
});
