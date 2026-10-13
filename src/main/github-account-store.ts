import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { DateTimeSchema, GitHubLoginSchema } from '../shared';
import { atomicJson, boundedJson, missing, serialized } from '../models/artifact-files';
import type { Vault } from './vault';

/**
 * The GitHub sign-in's account (docs/specification/github-sign-in.md 3.6 and 4; DR-2), modelled on CollectorSettings. Each token
 * is its own vault entry; <userData>/github/account.json holds only the refs and non-secret metadata. Every mutation runs under
 * serialized(file), and the live account changes only synchronously, right after an admit check passes (L-6). The live account
 * names committed refs only, except after a sign-in whose rollback write failed (4.3 step 5), because the vault refuses grants
 * on staged refs (vault.ts:132).
 */
const SecretRef = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);   // as collector-settings.ts:8
const MAX_RETIRED = 8;   // DC-10
export const AccountFileSchema = z.object({
  version: z.literal(1),
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  account: z.object({
    clientId: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),          // the app that issued the tokens (public)
    accessRef: SecretRef, refreshRef: SecretRef.nullable(),
    accessExpiresAt: DateTimeSchema.nullable(),                     // null = non-expiring token (F-4)
    refreshExpiresAt: DateTimeSchema.nullable(),
    obtainedAt: DateTimeSchema,                                     // local receipt time, for the clock-step rule (6.4)
    login: GitHubLoginSchema.nullable(),
  }).strict().refine(a => (a.refreshRef === null) === (a.refreshExpiresAt === null) && (a.accessExpiresAt !== null || a.refreshRef === null)).nullable(),
  retiredRefs: z.array(SecretRef).max(MAX_RETIRED),
  updatedAt: DateTimeSchema,
}).strict();
type AccountFile = z.infer<typeof AccountFileSchema>;
type FileAccount = NonNullable<AccountFile['account']>;

export interface GitHubAccount { readonly accessRef: string; readonly refreshRef: string | null; readonly accessExpiresAt: number | null;
  readonly refreshExpiresAt: number | null; readonly obtainedAt: number; readonly login: string | null;
  readonly signInId: string }   // memory only, never in the file: new for a sign-in and at open(), copied by a refresh (GS-10)
/** written: whether account.json names the new refs when replace gives up. Not a GITHUB_ code (DC-7). */
export class ReplaceFailure extends Error { constructor(readonly written: boolean) { super('ACCOUNT_STORE_FAILED'); } }
/** 'durable': the clear reached disk (a tombstone persist or a file write), so the next start reads no account; the encrypted
 *  entries are deleted now, or by the next start's reconcile if a removal failed (GS-11). 'not-durable': neither did, after one retry (DC-6). */
export type ClearResult = 'not-admitted' | 'durable' | 'not-durable';
/** The shape of the wire module's IssuedTokens (spec 3.5), stated here so the store does not depend on the wire module. */
interface IssuedTokens { readonly access: string; readonly refresh: string | null; readonly accessExpiresInS: number | null; readonly refreshExpiresInS: number | null }
type Admit = (live: GitHubAccount | null) => boolean;

const iso = (ms: number) => new Date(ms).toISOString();
const refsOf = (account: { accessRef: string; refreshRef: string | null } | null | undefined): string[] =>
  !account ? [] : account.refreshRef === null ? [account.accessRef] : [account.accessRef, account.refreshRef];
const unique = (refs: readonly string[]) => refs.filter((ref, index) => refs.lastIndexOf(ref) === index);   // keeps the newest position
const sameList = (a: readonly string[], b: readonly string[] | undefined) => !!b && a.length === b.length && a.every((ref, i) => ref === b[i]);
// A caller's admit that throws refuses, like one that returns false.
const passes = (admit: Admit, live: GitHubAccount | null) => { try { return admit(live) === true; } catch { return false; } };
const toLive = (account: FileAccount, signInId: string): GitHubAccount => Object.freeze({
  accessRef: account.accessRef, refreshRef: account.refreshRef,
  accessExpiresAt: account.accessExpiresAt === null ? null : Date.parse(account.accessExpiresAt),
  refreshExpiresAt: account.refreshExpiresAt === null ? null : Date.parse(account.refreshExpiresAt),
  obtainedAt: Date.parse(account.obtainedAt), login: account.login, signInId,
});

export class GitHubAccountStore {
  private disk: AccountFile | null = null;     // what account.json holds: changed only by a write that landed (atomicJson renames last)
  private live: GitHubAccount | null = null;
  private appChanged = false;
  private startupWrite = false;                // finishStartup owes a write (4.4)

  constructor(private readonly file: string, private readonly vault: Pick<Vault, 'saveStaged' | 'commit' | 'tombstone' | 'remove' | 'has'>,
    private readonly clientId: string, private readonly clock: () => number = Date.now) {}

  /** Never throws (4.4). A missing, invalid, oversized or extra-key file reads as no account. */
  async open(): Promise<void> {
    await serialized(this.file, async () => {
      this.disk = null; this.live = null; this.appChanged = false; this.startupWrite = false;
      try { this.disk = AccountFileSchema.parse(await boundedJson(this.file, 64 * 1024)); }
      catch (error) { this.startupWrite = !missing(error); }
      const disk = this.disk; if (!disk) return;
      const doomed = [...disk.retiredRefs];
      let account = disk.account;
      // An account issued to another app is never sent to this app's token endpoint (DC-15). An empty client ID (not
      // configured, D-7) keeps the account: its refs stay alive and reads take the signed-out path.
      if (account && this.clientId !== '' && account.clientId !== this.clientId) { doomed.push(...refsOf(account)); account = null; this.appChanged = true; }
      if (doomed.length > 0) this.startupWrite = true;
      for (const ref of doomed) await this.tombstoneNow(ref);
      // Refs a crash left staged stay live here: references() keeps them, so the reconcile commits them (4.5).
      this.live = account && toLive(account, randomUUID());
    }).catch(() => {});
  }
  /** open() dropped an account issued to another client ID (4.4, DC-15). */
  openedAppChanged(): boolean { return this.appChanged; }
  /** The live account's refs, for the startup reconcile. */
  references(): string[] { return refsOf(this.live); }
  /** Never throws (4.4). Runs after the reconcile, which has deleted every tombstoned entry. */
  async finishStartup(): Promise<void> {
    await serialized(this.file, async () => {
      const live = this.live; const orphans: string[] = [];
      if (live) {
        const refs = refsOf(live); const committed = await Promise.all(refs.map(ref => this.committed(ref)));
        if (committed.includes(false)) {
          this.live = null; this.startupWrite = true;
          // Tombstoned now, so neither half of a half-present pair outlives the account: the reconcile never deletes a committed
          // entry, and a committed entry whose file is gone would make every redaction fail (vault.ts:187-188). A ref still
          // committed, or one whose tombstone did not reach disk (the index may still hold it committed without its file), stays
          // named, so the next start's open() tombstones it again.
          for (const [index, ref] of refs.entries()) { const recorded = await this.tombstoneNow(ref); if (committed[index] || !recorded) orphans.push(ref); }
        }
      }
      if (this.startupWrite && await this.tryWrite(this.live ? this.disk?.account ?? null : null, orphans)) this.startupWrite = false;
    }).catch(() => {});
  }
  current(): GitHubAccount | null { return this.live; }

  /**
   * Spec 4.3. null = not admitted. 'sign-in': login null and a new signInId; a failed commit rolls back here, under the same lock
   * (DC-11, GS-3). 'refresh': login and signInId copied from live under the lock (GS-10); a failed commit throws ReplaceFailure(true).
   */
  replace(issued: IssuedTokens, receivedAt: number, kind: 'sign-in' | 'refresh', admit: Admit): Promise<GitHubAccount | null> {
    return serialized(this.file, async () => {
      if (!passes(admit, this.live)) return null;                                                          // 1
      const staged: string[] = [];
      try {                                                                                                  // 2
        staged.push(await this.vault.saveStaged(issued.access));
        if (issued.refresh !== null) staged.push(await this.vault.saveStaged(issued.refresh));
      } catch { await this.discard(staged); throw new ReplaceFailure(false); }
      if (!passes(admit, this.live)) { await this.discard(staged); return null; }                            // 3
      const from = kind === 'refresh' ? this.live : null;   // read here, under the lock, never from the caller's snapshot (GS-10)
      const signInId = from?.signInId ?? randomUUID();
      const before = this.disk;                             // kept for a sign-in's rollback (step 5)
      let written: AccountFile;
      try {                                                                                                  // 4: the crash-recovery commit point
        const account: FileAccount = {
          clientId: this.clientId, accessRef: staged[0]!, refreshRef: staged[1] ?? null,
          accessExpiresAt: issued.accessExpiresInS === null ? null : iso(receivedAt + issued.accessExpiresInS * 1000),
          refreshExpiresAt: issued.refresh === null || issued.refreshExpiresInS === null ? null : iso(receivedAt + issued.refreshExpiresInS * 1000),
          obtainedAt: iso(receivedAt), login: from?.login ?? null,
        };
        const retired = await this.cap([...(before?.retiredRefs ?? []), ...refsOf(before?.account)], ref => this.retire(ref));
        written = await this.write(account, retired);
      } catch { await this.discard(staged); throw new ReplaceFailure(false); }
      try { for (const ref of staged) await this.vault.commit(ref); }                                       // 5
      catch {
        if (kind === 'refresh') throw new ReplaceFailure(true);
        if (!passes(admit, this.live)) return null;   // a sign-out has begun: its clear removes what the file names
        if (await this.tryWrite(before?.account ?? null, before?.retiredRefs ?? [])) { await this.discard(staged); throw new ReplaceFailure(false); }
        // The rollback write failed too: the file still names the new pair, so the store follows the file (step 6).
      }
      if (!passes(admit, this.live)) return null;                                                          // 6: a clear has begun; it removes what the file names
      const next = toLive(written.account!, signInId);
      this.live = next;
      // 7. A ref leaves retiredRefs only once its removal succeeded; open() and the reconcile finish the rest.
      if (written.retiredRefs.length > 0) {
        const failed: string[] = [];
        for (const ref of written.retiredRefs) if (!(await this.retire(ref))) failed.push(ref);
        await this.tryWrite(written.account, failed);
      }
      return next;
    });
  }

  /** Only while live?.signInId === signInId, so across refreshes of the same sign-in (GS-10). Never throws. */
  setLogin(signInId: string, login: string): Promise<void> {
    return serialized(this.file, async () => {
      const live = this.live; const account = this.disk?.account;
      if (!live || live.signInId !== signInId || !account || account.accessRef !== live.accessRef) return;
      if (!await this.tryWrite({ ...account, login }, this.disk?.retiredRefs ?? [])) return;
      if (this.live === live) this.live = Object.freeze({ ...live, login: this.disk?.account?.login ?? null });
    }).catch(() => {});
  }

  /** Spec 4.3. Never throws. The prologue is synchronous: it drops the live account and tombstones its refs, which revokes their grants. */
  clear(admit: Admit): Promise<ClearResult> {
    if (!passes(admit, this.live)) return Promise.resolve('not-admitted');
    const taken = refsOf(this.live); this.live = null;
    const persisted = taken.map(ref => this.tombstoneNow(ref));
    return serialized(this.file, () => this.clearLocked(taken, persisted)).catch((): ClearResult => 'not-durable');
  }

  private async clearLocked(taken: string[], persisted: Promise<boolean>[]): Promise<ClearResult> {
    // A newer sign-in won (DC-4): it was admitted after the prologue, its step 4 moved the refs the prologue took into
    // retiredRefs, and its step 7 retires them.
    if (this.live !== null) { await Promise.all(persisted); return 'durable'; }
    const disk = this.disk;
    const accountRefs = unique([...taken, ...refsOf(disk?.account)]);
    const all = unique([...(disk?.retiredRefs ?? []), ...accountRefs]);
    if (all.length === 0) return 'durable';                                                                  // nothing names an account
    // A prologue persist records only the refs the prologue took. When the file names an account ref it did not take (a replace
    // that committed after the prologue, then was refused at step 6), only step 1's persists count: they are queued after all of
    // step 1's synchronous marks, and a vault persist writes the whole index, so any one that lands records every account ref.
    const tombstoned = accountRefs.some(ref => !taken.includes(ref)) ? [] : [...persisted];
    for (const ref of all) if (!taken.includes(ref)) {                                                        // 1
      const persist = this.tombstoneNow(ref); if (accountRefs.includes(ref)) tombstoned.push(persist);
    }
    const kept = await this.cap(all, ref => this.removeTombstoned(ref));
    // Durability (DC-6): the next start reads no account once every account ref's tombstone or the null file reached disk.
    let reached = await this.tryWrite(null, kept);                                                            // 2
    if (accountRefs.length === 0 || (await Promise.all(tombstoned)).some(Boolean)) reached = true;
    if (!reached) {                                                                                           // retry both once
      const again = accountRefs.map(ref => this.tombstoneNow(ref));
      reached = await this.tryWrite(null, kept);
      if ((await Promise.all(again)).some(Boolean)) reached = true;
    }
    const failed: string[] = [];
    for (const ref of kept) if (!(await this.removeTombstoned(ref))) failed.push(ref);                        // 3
    // 4. Refs whose removal failed stay named, so the next start's open() tombstones them again and the reconcile deletes them (GS-11).
    if ((this.disk?.account !== null || !sameList(failed, this.disk?.retiredRefs)) && await this.tryWrite(null, failed)) reached = true;
    return reached ? 'durable' : 'not-durable';
  }

  /** Keeps a retired list within the schema's bound: the oldest refs beyond the newest 8 are dropped first (4.2, DC-10). */
  private async cap(refs: readonly string[], drop: (ref: string) => Promise<boolean>): Promise<string[]> {
    const list = unique(refs);
    for (const ref of list.slice(0, -MAX_RETIRED)) await drop(ref);
    return list.slice(-MAX_RETIRED);
  }
  private async write(account: FileAccount | null, retiredRefs: readonly string[]): Promise<AccountFile> {
    // Every write passes the schema the reader applies, so no writer can produce a file that drops the account on reopen.
    const next = AccountFileSchema.parse({ version: 1, revision: (this.disk?.revision ?? 0) + 1, account, retiredRefs, updatedAt: iso(this.clock()) });
    await atomicJson(this.file, next); this.disk = next; return next;
  }
  private async tryWrite(account: FileAccount | null, retiredRefs: readonly string[]): Promise<boolean> {
    try { await this.write(account, retiredRefs); return true; } catch { return false; }
  }
  /** Calls vault.tombstone synchronously, so its synchronous part (the entry marked, its grants revoked) runs before this returns. */
  private tombstoneNow(ref: string): Promise<boolean> {
    try { return this.vault.tombstone(ref).then(() => true, () => false); } catch { return Promise.resolve(false); }
  }
  // CREDENTIAL_NOT_TOMBSTONED after this store's own tombstone means the entry is already gone (collector-settings.ts:83-87).
  private async removeTombstoned(ref: string): Promise<boolean> {
    try { await this.vault.remove(ref); return true; } catch (error) { return (error as Error)?.message === 'CREDENTIAL_NOT_TOMBSTONED'; }
  }
  private async retire(ref: string): Promise<boolean> { await this.tombstoneNow(ref); return this.removeTombstoned(ref); }
  private async discard(refs: readonly string[]): Promise<void> { for (const ref of refs) await this.retire(ref); }
  private async committed(ref: string): Promise<boolean> { try { return await this.vault.has(ref); } catch { return false; } }
}
