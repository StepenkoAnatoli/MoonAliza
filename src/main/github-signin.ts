import { randomUUID } from 'node:crypto';
import type { GitHubAccountStatus, GitHubOpenTarget } from '../shared/github-account';
import { DEVICE_PAGE_URL, GITHUB_APP, REQUEST_OFFLINE_ACCESS, isConfigured } from './github-app';
import type { GitHubAccount, GitHubAccountStore } from './github-account-store';
import type { CredentialError, Fetcher, GitHubCredential, GitHubSend } from './github-credential';
import { fetchLogin, requestDeviceCode, requestToken, type IssuedTokens, type TokenResult } from './github-oauth';
import type { CredentialBinding, Vault } from './vault';

/**
 * The GitHub sign-in's lifecycle service (docs/specification/github-sign-in.md 2, 3.7, 6). It owns the two state machines, the
 * account machine (A0..A4, read from the store) and the flow machine (F0..F5, `flow` below), and all of the sign-in's GitHub network
 * work: the device flow, the single-flight refresh, GET /user and the authenticated send() that read_github uses. status() is a
 * pure projection of the two (2.3); nothing else changes sign-in state.
 *
 * - No ambient traffic (L-2): a request is caused only by start(), a poll of a live flow, the login read after a commit point, or a
 *   send() from a read. Nothing runs at construction, on a timer or on status().
 * - A token is handled only inside one vault.withSecret callback, which dispatches its request synchronously (3.8, L-7); a refresh
 *   answer's pair goes straight to the store, and every request after it decrypts the committed entry (persist before use, L-4).
 * - send() originates only CREDENTIAL_ERRORS; the request's own rejection and a local vault error on the access token pass through
 *   unchanged (3.4, GS-6). Every error is a bare code, with no cause (DC-9).
 */
export interface GitHubLimits { requestTimeoutMs: number; maxBodyBytes: number; refreshMarginMs: number; grantMs: number;
  transientHoldMs: number; rateLimitFloorMs: number; rateLimitCeilingMs: number; maxTransientPolls: number;
  maxCodeLifetimeMs: number; quitWaitMs: number; clockSkewMs: number;
  maxSameRefreshError: number; freshTokenMs: number; freshRetryMs: number }   // DC-1; DC-2
export const GITHUB_LIMITS: Readonly<GitHubLimits> = { requestTimeoutMs: 20_000, maxBodyBytes: 65_536, refreshMarginMs: 300_000,
  grantMs: 30_000, transientHoldMs: 30_000, rateLimitFloorMs: 60_000, rateLimitCeilingMs: 3_600_000, maxTransientPolls: 3,
  maxCodeLifetimeMs: 1_800_000, quitWaitMs: 25_000, clockSkewMs: 300_000,
  maxSameRefreshError: 3, freshTokenMs: 5_000, freshRetryMs: 1_000 };
export interface GitHubSignInDeps {
  store: GitHubAccountStore; vault: Pick<Vault, 'grant' | 'withSecret' | 'revokeContext'>;
  epoch(): string;                                       // () => engine?.epoch ?? '' (the collector's pattern, src/main/index.ts:147)
  encryptionAvailable(): boolean;                        // () => safeStorage.isEncryptionAvailable()
  fetcher: Fetcher;                                      // required: index.ts passes lateFetch; a test that forgets the fake fails to compile
  config?: { clientId: string; installUrl: string; offlineAccess?: boolean };   // default GITHUB_APP; tests inject; never a setting, environment variable or file
                                                         // offlineAccess defaults to REQUEST_OFFLINE_ACCESS: a test seam, not a setting (GS-5)
  now?(): number; sleep?(ms: number, signal: AbortSignal): Promise<void>; limits?: Partial<GitHubLimits>;
  monotonic?(): number;                                  // a reading in ms that no clock step moves; default performance.now(). Holds are timed on it (U5-R13)
}

type Outcome = NonNullable<Extract<GitHubAccountStatus, { state: 'signed-out' }>['lastOutcome']>;
type Ended = NonNullable<Extract<GitHubAccountStatus, { state: 'signed-out' }>['ended']>;
type HoldReason = Extract<CredentialError, 'GITHUB_RATE_LIMIT' | 'GITHUB_RENEWAL_UNAVAILABLE'>;
/** F1 'requesting', F2 'waiting', F3 'polling', F4 'storing' (the commit point), F5 'login' (2.2). */
type Stage = 'requesting' | 'waiting' | 'polling' | 'storing' | 'login';
interface Flow {
  readonly controller: AbortController;
  stage: Stage;
  userCode: string; codeExpiresAt: number;
  /** Lives only here, and only until the flow reaches its commit point or ends (L-7). */
  deviceCode: string | null;
  /** The commit point's store write, which close() waits for (6.8). */
  storing: Promise<unknown> | null;
}
interface Budget { refreshed: boolean; retried: boolean; fresh: number }   // C-6, DC-2 (6.4)

const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';
const DENIED = 'CREDENTIAL_CAPABILITY_DENIED';
const iso = (ms: number) => new Date(ms).toISOString();
const denied = (error: unknown) => (error as Error | undefined)?.message === DENIED;
// A poll's error code to the flow's outcome (6.2, 3.9). A Map, so no code GitHub sends can name an inherited property.
const POLL_OUTCOMES = new Map<string, Outcome>([['expired_token', 'expired'], ['token_expired', 'expired'], ['incorrect_device_code', 'restart'],
  ['bad_verification_code', 'restart'], ['access_denied', 'denied'], ['device_flow_disabled', 'disabled'], ['incorrect_client_credentials', 'client-rejected'],
  ['unsupported_grant_type', 'grant-unsupported'], ['unverified_user_email', 'email-unverified']]);
/** A poll's slow_down interval counts only when it is valid as step 1's is (5.5): an integer from 1 to 300 seconds. */
const validIntervalS = (value: number | null) => value !== null && Number.isInteger(value) && value >= 1 && value <= 300;

/** Waits ms of real time; resolves early, never rejects, when the signal aborts. Tests inject their own (3.7). */
function realSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
  });
}

type Raced<T> = { kind: 'done'; value: T } | { kind: 'aborted' } | { kind: 'changed' };
/** 2.5: a read waits on work, its own signal and accountChanged, whichever comes first; an abort seen when the work settles wins
 *  over its value, so no waiter goes on with a token after a sign-out or a replacement. Listeners are removed once it settles. */
function race<T>(work: Promise<T>, signal: AbortSignal, changed: AbortSignal): Promise<Raced<T>> {
  return new Promise<Raced<T>>((resolve, reject) => {
    if (signal.aborted) { resolve({ kind: 'aborted' }); return; }
    if (changed.aborted) { resolve({ kind: 'changed' }); return; }
    const detach = () => { signal.removeEventListener('abort', onAbort); changed.removeEventListener('abort', onChanged); };
    const onAbort = () => { detach(); resolve({ kind: 'aborted' }); };
    const onChanged = () => { detach(); resolve({ kind: 'changed' }); };
    signal.addEventListener('abort', onAbort, { once: true });
    changed.addEventListener('abort', onChanged, { once: true });
    const interrupted = (): Raced<T> | null => signal.aborted ? { kind: 'aborted' } : changed.aborted ? { kind: 'changed' } : null;
    work.then(value => { detach(); resolve(interrupted() ?? { kind: 'done', value }); },
      (error: unknown) => { detach(); const stop = interrupted(); if (stop) resolve(stop); else reject(error); });
  });
}

export class GitHubSignIn implements GitHubCredential {
  private readonly store: GitHubAccountStore;
  private readonly vault: GitHubSignInDeps['vault'];
  private readonly fetcher: Fetcher;
  private readonly clientId: string;
  private readonly installUrl: string;
  private readonly configured: boolean;
  private readonly offlineAccess: boolean;
  private readonly limits: Readonly<GitHubLimits>;
  private readonly now: () => number;
  private readonly monotonic: () => number;
  private readonly sleep: (ms: number, signal: AbortSignal) => Promise<void>;

  // Flow machine (2.2) and the projection's memory-only fields (2.3).
  private flow: Flow | null = null;
  private lastOutcome: Outcome | null = null;
  private endedReason: Ended | null = null;
  private signOutIncomplete = false;
  // Account machine bookkeeping (6.4, 6.5). The account itself is the store's live account.
  private generation = 0;
  private signOuts = 0;
  private hold: { setAt: number; lengthMs: number; reason: HoldReason } | null = null;   // setAt: a monotonic reading, so no wall-clock step moves the hold (holdActive)
  private failures = 0;
  private sameError: { key: string; count: number } | null = null;
  private freshRejects = 0;
  private inflight: { from: string; promise: Promise<GitHubAccount> } | null = null;
  private accountChanged = new AbortController();
  private closing = false;

  constructor(private readonly deps: GitHubSignInDeps) {
    this.store = deps.store; this.vault = deps.vault; this.fetcher = deps.fetcher;
    const config = deps.config ?? GITHUB_APP;
    this.clientId = config.clientId; this.installUrl = config.installUrl; this.configured = isConfigured(config);
    this.offlineAccess = deps.config?.offlineAccess ?? REQUEST_OFFLINE_ACCESS;   // GS-5
    this.limits = { ...GITHUB_LIMITS, ...deps.limits };
    this.now = deps.now ?? Date.now;
    this.monotonic = deps.monotonic ?? (() => performance.now());
    this.sleep = deps.sleep ?? realSleep;
    if (this.store.openedAppChanged()) this.endedReason = 'app-changed';         // 4.4, DC-15
  }

  /** 2.3: synchronous, pure, no I/O. */
  status(): GitHubAccountStatus {
    if (!this.configured) return { state: 'not-configured' };
    const live = this.store.current(); const flow = this.flow;
    if (flow && flow.stage !== 'requesting') {                                   // F1 projects as the state before it
      return { state: 'pending', userCode: flow.userCode, codeExpiresAt: iso(flow.codeExpiresAt),
        committed: flow.stage === 'storing' || flow.stage === 'login', account: live ? { login: live.login } : null };
    }
    if (live) return { state: 'signed-in', login: live.login, renewalHeld: this.holdActive(), lastOutcome: this.lastOutcome };
    return { state: 'signed-out', ended: this.endedReason, signOutIncomplete: this.signOutIncomplete, lastOutcome: this.lastOutcome };
  }

  /** 6.1. Outcomes are status data, never thrown; only the two preconditions throw, before any request. */
  async start(): Promise<GitHubAccountStatus> {
    if (!this.configured) throw new Error('NOT_IMPLEMENTED');
    if (!this.deps.encryptionAvailable()) throw new Error('ENCRYPTION_UNAVAILABLE');
    const current = this.flow;
    if (this.closing || (current && (current.stage === 'storing' || current.stage === 'login'))) return this.status();   // DC-5
    if (current) this.drop(current);                                             // a new start replaces it, with no outcome
    this.lastOutcome = null; this.endedReason = null; this.signOutIncomplete = false;
    const flow: Flow = { controller: new AbortController(), stage: 'requesting', userCode: '', codeExpiresAt: 0, deviceCode: null, storing: null };
    this.flow = flow;
    let answer: Awaited<ReturnType<typeof requestDeviceCode>>;
    try { answer = await requestDeviceCode(this.fetcher, this.clientId, this.offlineAccess, flow.controller.signal, this.limits, this.now); }
    catch { answer = { kind: 'failed' }; }                                        // the wire never rejects; kept total anyway
    if (this.flow !== flow) return this.status();                                // cancelled or replaced: the answer is discarded
    if (answer.kind !== 'code') {
      this.end(flow, answer.kind === 'rate-limited' ? 'rate-limited' : answer.kind === 'error' && answer.code === 'device_flow_disabled' ? 'disabled'
        : answer.kind === 'error' && answer.code === 'incorrect_client_credentials' ? 'client-rejected' : 'start-failed');
      return this.status();
    }
    const receivedAt = this.now();
    const lifetimeMs = Math.min(answer.expiresInS * 1000, this.limits.maxCodeLifetimeMs);
    flow.stage = 'waiting'; flow.userCode = answer.userCode; flow.deviceCode = answer.deviceCode; flow.codeExpiresAt = receivedAt + lifetimeMs;
    void this.poll(flow, answer.intervalS, lifetimeMs);
    return this.status();
  }

  /** 6.6: aborts a flow before its commit point; a no-op from it (DC-5). */
  cancel(): GitHubAccountStatus {
    const flow = this.flow;
    if (flow && flow.stage !== 'storing' && flow.stage !== 'login') { this.drop(flow); this.lastOutcome = 'cancelled'; }
    return this.status();
  }

  /** 6.7: local only. Its synchronous part runs before any await; disk errors are reported as signOutIncomplete, never thrown. */
  async signOut(): Promise<GitHubAccountStatus> {
    this.generation++; this.signOuts++;
    const flow = this.flow; if (flow) this.drop(flow);                           // at any stage, F4 and F5 included; no outcome
    this.hold = null; this.failures = 0; this.sameError = null; this.freshRejects = 0; this.endedReason = null;
    this.renewAccountChanged();                                                  // waiters leave at once
    const cleared = this.store.clear(() => true);                                // its prologue tombstones both refs, revoking their grants
    this.signOutIncomplete = (await cleared) === 'not-durable';                  // DC-6
    return this.status();
  }

  /** 3.7: the device page only while pending; the install page only when configured. Main opens the constant, never a response value. */
  openTarget(target: GitHubOpenTarget): string {
    if (target === 'device') { if (this.status().state === 'pending') return DEVICE_PAGE_URL; throw new Error('NOT_FOUND'); }
    if (target === 'install') { if (this.configured) return this.installUrl; throw new Error('NOT_IMPLEMENTED'); }
    throw new Error('NOT_FOUND');
  }

  /** 6.8: the synchronous part aborts the flow and refuses new work; then waits for a refresh in flight, or a commit point being
   *  stored, at most quitWaitMs. A commit point is never interrupted (6.3). */
  async close(): Promise<void> {
    this.closing = true;
    const flow = this.flow;
    const work: Promise<unknown>[] = [];
    if (flow) {
      if (flow.stage === 'storing' || flow.stage === 'login') { flow.controller.abort(); if (flow.storing) work.push(flow.storing); }
      else this.drop(flow);
    }
    if (this.inflight) work.push(this.inflight.promise);
    if (work.length === 0) return;
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([Promise.allSettled(work), new Promise<void>(resolve => { timer = setTimeout(resolve, this.limits.quitWaitMs); })]);
    clearTimeout(timer);
  }

  /** 6.4 and 3.4. */
  async send(request: (authorization: string | undefined) => Promise<Response>, signal: AbortSignal): Promise<GitHubSend> {
    if (this.closing) throw new Error('GITHUB_RENEWAL_UNAVAILABLE');             // refused without a request (6.8)
    const first = this.store.current();
    if (!this.configured || !first) return { response: await request(undefined), authenticated: false };   // L-10, D-7
    const budget: Budget = { refreshed: false, retried: false, fresh: 0 };
    let account = await this.usable(first, signal, budget);
    for (;;) {
      const sent = await this.withAccess(account, request);
      if (sent === 'stale') { account = await this.usable(this.current(), signal, budget); continue; }
      if (sent.status !== 401) { this.freshRejects = 0; return { response: sent, authenticated: true }; }   // the token was accepted (GS-1)
      await sent.body?.cancel().catch(() => {});
      const age = this.now() - account.obtainedAt;                              // negative when the clock stepped back past the issue time: not a fresh token (6.8)
      if (age >= 0 && age < this.limits.freshTokenMs && budget.fresh < 2) {     // DC-2: a just-issued token, until DO-16
        account = await this.pause(this.limits.freshRetryMs * 2 ** budget.fresh++, account, signal); continue;   // the same token again: 1 s, then 2 s
      }
      const current = this.current();
      if (current.accessRef !== account.accessRef && !budget.retried) { budget.retried = true; account = current; continue; }   // rotated meanwhile (E-02 l.36)
      if (age >= 0 && age < this.limits.transientHoldMs) return this.freshRejected(account);   // GS-1: always throws
      if (budget.retried) { await this.clearIf(account.accessRef); throw new Error('GITHUB_SIGN_IN_REQUIRED'); }   // the retry still got 401
      if (account.accessExpiresAt === null || budget.refreshed || !this.refreshPossible(account, this.now())) {   // non-expiring 401; C-6
        await this.clearIf(account.accessRef); throw new Error('GITHUB_SIGN_IN_REQUIRED');
      }
      if (this.holdActive()) throw new Error(this.hold!.reason);                 // L-13; the account is kept
      budget.refreshed = true; budget.retried = true;
      account = await this.waitRefresh(account, signal);
    }
  }

  // ---- the flow (6.2, 6.3) ----

  /** 6.2. Detached; never rejects. Every path waits at least `interval` before the next poll, and no poll goes out at or after the deadline. */
  private async poll(flow: Flow, intervalS: number, lifetimeMs: number): Promise<void> {
    try {
      const signal = flow.controller.signal;
      let interval = intervalS * 1000; let nextWait = interval; let transient = 0; let polls = 0;
      const maxPolls = Math.ceil(lifetimeMs / 1000 / intervalS) + 2;               // L-9
      for (;;) {
        await this.sleep(nextWait, signal).catch(() => {});                       // the first poll waits `interval` (E-01 l.132)
        if (signal.aborted || this.flow !== flow) return;
        if (this.now() >= flow.codeExpiresAt || polls >= maxPolls) { this.end(flow, 'expired'); return; }   // after every wake: timers drift across sleep
        polls++; flow.stage = 'polling';
        const answer = await requestToken(this.fetcher, { client_id: this.clientId, device_code: flow.deviceCode!, grant_type: DEVICE_GRANT }, signal, this.limits, this.now)
          .catch((): TokenResult => ({ kind: 'transient' }));
        if (signal.aborted || this.flow !== flow) return;                         // an answer after Cancel is discarded (F-10)
        flow.stage = 'waiting'; nextWait = interval;
        // F4, the commit point. A tail call: this frame, which held the pair, ends here (L-7).
        if (answer.kind === 'tokens') return this.commitAndLogin(flow, answer.tokens, answer.receivedAt);
        if (answer.kind === 'transient') { if (++transient > this.limits.maxTransientPolls) { this.end(flow, 'failed'); return; } continue; }
        transient = 0;                                                            // only consecutive transient polls count (L-9)
        if (answer.kind === 'rate-limited') {                                     // R2-4
          if (this.now() + answer.waitMs >= flow.codeExpiresAt) { this.end(flow, 'rate-limited'); return; }
          nextWait = Math.max(answer.waitMs, interval); continue;
        }
        if (answer.kind !== 'error') { this.end(flow, 'failed'); return; }       // malformed or unusable: nothing stored (F-4)
        if (answer.code === 'authorization_pending') continue;
        if (answer.code === 'slow_down') {                                        // E-01 l.132, l.157
          interval = Math.max(interval + 5000, validIntervalS(answer.intervalS) ? answer.intervalS! * 1000 : 0); nextWait = interval; continue;
        }
        this.end(flow, POLL_OUTCOMES.get(answer.code) ?? 'failed'); return;
      }
    } catch {
      if (this.flow === flow && flow.stage !== 'storing' && flow.stage !== 'login') this.end(flow, 'failed');
      else if (this.flow === flow) this.flow = null;
    }
  }

  /** 6.3: the commit point, then the login read. Never rejects. Not an async function: a suspended async frame keeps its `tokens`
   *  parameter reachable for the whole login read (F5), so the pair is held only by commitPoint's frame, which ends with the store's
   *  write (L-7). */
  private commitAndLogin(flow: Flow, tokens: IssuedTokens, receivedAt: number): Promise<void> {
    return this.commitPoint(flow, tokens, receivedAt)                           // the pair is the store's from here, and unused after this call
      .then(account => account ? this.readLogin(flow, account) : undefined)
      .catch(() => { if (this.flow === flow) this.flow = null; });
  }

  /** 6.3 step 1-2. Admitted against the sign-out count taken here, so only a user sign-out refuses it (DC-4). null: no account. */
  private async commitPoint(flow: Flow, tokens: IssuedTokens, receivedAt: number): Promise<GitHubAccount | null> {
    flow.stage = 'storing'; flow.deviceCode = null;
    const s0 = this.signOuts;
    const storing = this.store.replace(tokens, receivedAt, 'sign-in', () => this.signOuts === s0);
    flow.storing = storing.catch(() => {});
    let account: GitHubAccount | null;
    try { account = await storing; }
    catch {
      // ReplaceFailure(false), the store's only throw here: the file names the previous account (or none), never written, or rolled
      // back under the same lock (DC-11, GS-3). The previous account is untouched (F-10).
      if (this.flow === flow) { this.flow = null; this.lastOutcome = 'failed'; }
      return null;
    } finally { flow.storing = null; }
    if (account === null || this.flow !== flow) { if (this.flow === flow) this.flow = null; return null; }   // a sign-out won: no outcome (6.7)
    // A returned account is the commit point reached, also after a failed commit whose rollback write failed too (DC-11).
    this.generation++; this.renewAccountChanged();
    this.hold = null; this.failures = 0; this.sameError = null; this.freshRejects = 0; this.endedReason = null;
    flow.stage = 'login';
    return account;
  }

  /** 6.3 step 3-4: one-shot, outside the 401 rule; a grant denied by an engine restart is re-granted once; any failure leaves login null. */
  private async readLogin(flow: Flow, account: GitHubAccount): Promise<void> {
    const signal = flow.controller.signal;
    let login: string | null = null;
    for (let attempt = 0; attempt < 2 && !signal.aborted; attempt++) {
      const contextId = 'github:user:' + randomUUID();
      const binding: CredentialBinding = { epoch: this.deps.epoch(), purpose: 'github', contextId, secretRef: account.accessRef };
      try {
        const capability = this.vault.grant({ ...binding, expiresAt: Date.now() + this.limits.grantMs });   // the vault's clock, never now() (3.7)
        login = await this.vault.withSecret(capability, binding, token => fetchLogin(this.fetcher, 'Bearer ' + token, signal, this.limits));
        break;
      } catch (error) { if (!denied(error)) break; }
      finally { this.vault.revokeContext(contextId); }
    }
    if (login !== null && !signal.aborted) await this.store.setLogin(account.signInId, login);   // by signInId, so across refreshes (GS-10)
    if (this.flow === flow) this.flow = null;                                    // the flow ends with no outcome
  }

  /** Ends a flow: aborts it, drops the device code, and records the outcome while it is still the current flow. */
  private end(flow: Flow, outcome: Outcome): void {
    flow.deviceCode = null;
    if (this.flow !== flow) return;
    this.flow = null; this.lastOutcome = outcome;
  }
  /** Aborts a flow with no outcome. From the commit point the store write still completes (6.3). */
  private drop(flow: Flow): void {
    flow.controller.abort(); flow.deviceCode = null;
    if (this.flow === flow) this.flow = null;
  }

  // ---- the account (6.4, 6.5) ----

  private current(): GitHubAccount {
    const live = this.store.current(); if (!live) throw new Error('GITHUB_SIGN_IN_REQUIRED'); return live;
  }
  /** A hold is active for its length of real time from when it was set, measured on the monotonic clock, which no wall-clock step
   *  moves: a backward step neither stretches a hold (a day's step would otherwise hold a day) nor cancels it (GitHub may still be
   *  limiting: E-15 l.36, L-13), and the forward correction that usually follows a step cannot shorten it either, as it could a
   *  hold re-anchored on the wall clock (U5-R7, U5-R11, U5-R13). The one cost: a system sleep, through which the monotonic clock may
   *  stand still, over-holds by at most the hold's own length, an hour at the ceiling (6.8). Nothing here writes, so status() stays
   *  a pure projection (2.3). */
  private holdActive(): boolean {
    const hold = this.hold;
    return hold !== null && this.monotonic() - hold.setAt < hold.lengthMs;
  }
  /** Starts a hold of lengthMs of real time now (6.5). */
  private setHold(lengthMs: number, reason: HoldReason): void {
    this.hold = { setAt: this.monotonic(), lengthMs, reason };
  }
  /** A refresh token that can still be used: present and unexpired, or the local clock stepped back past the skew bound (6.4). */
  private refreshPossible(account: GitHubAccount, t: number): boolean {
    return account.refreshRef !== null && account.refreshExpiresAt !== null && (account.refreshExpiresAt > t || t < account.obtainedAt - this.limits.clockSkewMs);
  }

  /** 6.4 `usable`: the expiry pre-check. No request carries a token past expiry or inside the margin when a refresh is possible (L-5). */
  private async usable(account: GitHubAccount, signal: AbortSignal, budget: Budget): Promise<GitHubAccount> {
    const t = this.now();
    if (account.accessExpiresAt === null) return account;                       // 1: non-expiring
    const skewed = t < account.obtainedAt - this.limits.clockSkewMs;            // 2: the clock stepped back more than 300 s
    if (!skewed && account.accessExpiresAt - t > this.limits.refreshMarginMs) return account;   // 3
    const refreshable = this.refreshPossible(account, t);
    if (refreshable && !this.holdActive() && !budget.refreshed) {               // 4: at most one refresh per call (L-14)
      budget.refreshed = true; return this.waitRefresh(account, signal);
    }
    if (account.accessExpiresAt > t) return account;                            // 5: still valid, under the margin (GS-4)
    if (refreshable) throw new Error(this.holdActive() ? this.hold!.reason : 'GITHUB_RENEWAL_UNAVAILABLE');   // 6: L-13; the account is kept
    await this.clearIf(account.accessRef);                                       // 7: both expired; no request (F-6)
    throw new Error('GITHUB_SIGN_IN_REQUIRED');
  }

  /** 6.4 `withAccess`: one grant per use, revoked in finally; the request dispatched synchronously inside withSecret (L-7). */
  private async withAccess(account: GitHubAccount, request: (authorization: string | undefined) => Promise<Response>): Promise<Response | 'stale'> {
    for (let attempt = 0; ; attempt++) {
      const contextId = 'github:read:' + randomUUID();
      const binding: CredentialBinding = { epoch: this.deps.epoch(), purpose: 'github', contextId, secretRef: account.accessRef };
      let dispatched = false; let failure: unknown;
      try {
        const capability = this.vault.grant({ ...binding, expiresAt: Date.now() + this.limits.grantMs });
        return await this.vault.withSecret(capability, binding, token => { dispatched = true; return request('Bearer ' + token); });
      } catch (error) { failure = error; } finally { this.vault.revokeContext(contextId); }
      if (dispatched || !denied(failure)) throw failure;                         // the request's own rejection or a local vault error, unchanged (GS-6)
      const live = this.store.current();
      if (!live) throw new Error('GITHUB_SIGN_IN_REQUIRED');                    // signed out: nothing was sent (F-11)
      if (live.accessRef !== account.accessRef) return 'stale';                 // rotated: no budget is spent
      if (attempt > 0) throw new Error('GITHUB_RENEWAL_UNAVAILABLE');           // denied twice: never a sign-out (F-7(c))
    }                                                                            // otherwise an engine restart cleared the grants: one new grant
  }

  /** 6.4 `waitRefresh`: the read's own signal and accountChanged end only its waiting, never the refresh (L-3). */
  private async waitRefresh(account: GitHubAccount, signal: AbortSignal): Promise<GitHubAccount> {
    const changed = this.accountChanged.signal;
    const refresh = this.refreshSingleFlight(account);
    refresh.catch(() => {});                                                     // an abandoned refresh never raises an unhandled rejection
    const raced = await race(refresh, signal, changed);
    if (raced.kind === 'done') return raced.value;
    if (raced.kind === 'aborted') throw signal.reason ?? new Error('ABORTED');
    return this.current();                                                       // cleared or replaced: re-read; budget.refreshed stays true
  }

  /** 6.4 `pause`: the fresh-token wait, raced like waitRefresh. Returns the account to resend with. */
  private async pause(ms: number, account: GitHubAccount, signal: AbortSignal): Promise<GitHubAccount> {
    const changed = this.accountChanged.signal;
    const raced = await race(this.sleep(ms, AbortSignal.any([signal, changed])).catch(() => {}), signal, changed);
    if (raced.kind === 'aborted') throw signal.reason ?? new Error('ABORTED');
    return raced.kind === 'changed' ? this.current() : account;
  }

  /** 6.4 `freshRejected` (GS-1): a 401 on a token under transientHoldMs old never refreshes and never clears at once. Always throws. */
  private async freshRejected(account: GitHubAccount): Promise<never> {
    if (this.holdActive()) throw new Error(this.hold!.reason);                  // counted once per hold; the account is kept
    if (++this.freshRejects >= this.limits.maxSameRefreshError) { await this.clearIf(account.accessRef); throw new Error('GITHUB_SIGN_IN_REQUIRED'); }
    return this.failed();
  }

  /** 6.4 `clearIf`: never removes a newer sign-in. The store's prologue, and so the admit, is synchronous. */
  private clearIf(ref: string, reason: Ended = 'sign-in-ended'): Promise<unknown> {
    let admitted = false;
    const cleared = this.store.clear(live => (admitted = live?.accessRef === ref));
    if (admitted) { this.generation++; this.endedReason = reason; this.renewAccountChanged(); }
    return cleared;
  }
  private renewAccountChanged(): void {
    const old = this.accountChanged; this.accountChanged = new AbortController(); old.abort();
  }

  /** 6.5: at most one refresh request in flight per account (L-1); cleared only after its persist has settled. */
  private refreshSingleFlight(from: GitHubAccount): Promise<GitHubAccount> {
    if (this.inflight?.from === from.accessRef) return this.inflight.promise;   // join
    const live = this.store.current();
    if (!live) return Promise.reject(new Error('GITHUB_SIGN_IN_REQUIRED'));
    if (live.accessRef !== from.accessRef) return Promise.resolve(live);        // already rotated
    if (this.closing) return Promise.reject(new Error('GITHUB_RENEWAL_UNAVAILABLE'));
    const entry = { from: from.accessRef, promise: this.renew(live) };
    this.inflight = entry;
    void entry.promise.catch(() => {}).finally(() => { if (this.inflight === entry) this.inflight = null; });
    return entry.promise;
  }

  /** 6.5 `renew`: on its own timeout only (L-3). Persisted before any caller uses the new pair (L-4). */
  private async renew(from: GitHubAccount): Promise<GitHubAccount> {
    const g0 = this.generation;
    const timeout = AbortSignal.timeout(this.limits.requestTimeoutMs);
    const answer = await this.withRefresh(from, timeout);
    if (!('kind' in answer)) return answer;                                     // rotated meanwhile: the current account
    // The answer is about `from`. If the store has moved on while GitHub answered, so has the account: this one check is the guard
    // against a late answer (U5-R10, U5-R12). A sign-in commit, a sign-out or a clear each leaves the store with no live account or
    // another access ref before anything awaits, and a ref is never staged twice, so a live `from` here is still the account the
    // answer is about; no generation check can see anything this one does not (U5-R14).
    const live = this.store.current();
    if (!live) throw new Error('GITHUB_SIGN_IN_REQUIRED');                     // cleared meanwhile: its waiters have left on accountChanged
    if (live.accessRef !== from.accessRef) return live;                        // rotated meanwhile: the waiter goes on with the current account; nothing is held or counted
    if (answer.kind !== 'error' && answer.kind !== 'unusable') this.sameError = null;   // only consecutive identical answers count: before the kinds are dispatched, so a success resets it too (6.5, U5-R16)
    if (answer.kind === 'tokens') return this.adopt(answer.tokens, answer.receivedAt, from, g0);   // a tail call: this frame, which held the pair, ends (L-7)
    if (answer.kind === 'malformed') { await this.clearIf(from.accessRef); throw new Error('GITHUB_SIGN_IN_REQUIRED'); }   // GitHub issued a pair, so the old one is dead (E-02 l.36)
    if (answer.kind === 'error' && (answer.code === 'bad_refresh_token' || answer.code === 'unsupported_grant_type')) {   // any status (F-7(a), R2-5, DC-1)
      await this.clearIf(from.accessRef); throw new Error('GITHUB_SIGN_IN_REQUIRED');
    }
    if (answer.kind === 'error' && answer.code === 'incorrect_client_credentials') {   // E-01 l.256; DC-1
      await this.clearIf(from.accessRef, 'client-rejected'); throw new Error('GITHUB_SIGN_IN_REQUIRED');
    }
    switch (answer.kind) {
      case 'rate-limited':                                                       // R2-4, DC-12: at least transientHoldMs; the vault is kept
        this.setHold(Math.max(answer.waitMs, this.limits.transientHoldMs), 'GITHUB_RATE_LIMIT');
        throw new Error('GITHUB_RATE_LIMIT');
      case 'error': return this.sameOrFail(answer.code, from);                  // DC-1
      case 'unusable':                                                           // GS-2: a 3xx is a captive portal or a proxy, not GitHub refusing
        if (answer.status >= 300 && answer.status < 400) return this.failed();
        return this.sameOrFail('status:' + answer.status, from);
      case 'transient': return this.failed();                                    // F-7(b); the vault byte-identical
    }
  }

  /** 6.5, a refreshed pair: persisted before any caller uses it (L-4), admitted against the generation and the live access ref, under
   *  the store's lock, where the generation can still move after renew()'s live check (U5-R14 keeps this admit). */
  private async adopt(tokens: IssuedTokens, receivedAt: number, from: GitHubAccount, g0: number): Promise<GitHubAccount> {
    let next: GitHubAccount | null;
    try { next = await this.store.replace(tokens, receivedAt, 'refresh', live => this.generation === g0 && live?.accessRef === from.accessRef); }   // login and signInId copied under the lock (GS-10)
    catch { await this.clearIf(from.accessRef); throw new Error('GITHUB_SIGN_IN_REQUIRED'); }   // X-9: the old pair is dead, so never keep it
    if (next === null) return this.current();                                    // a sign-out or a new sign-in won
    this.generation++; this.hold = null; this.failures = 0;                      // freshRejects is kept (GS-1)
    return next;
  }

  /** The refresh token under a github:refresh grant (3.8). DENIED: the account gone, rotated, or an engine restart (one re-grant).
   *  Any other local error holds: nothing was sent (GS-6). */
  private async withRefresh(from: GitHubAccount, timeout: AbortSignal): Promise<TokenResult | GitHubAccount> {
    for (let attempt = 0; ; attempt++) {
      const contextId = 'github:refresh:' + randomUUID();
      const binding: CredentialBinding = { epoch: this.deps.epoch(), purpose: 'github', contextId, secretRef: from.refreshRef! };
      let dispatched = false; let failure: unknown;
      try {
        const capability = this.vault.grant({ ...binding, expiresAt: Date.now() + this.limits.grantMs });
        return await this.vault.withSecret(capability, binding, token => {
          dispatched = true;
          return requestToken(this.fetcher, { client_id: this.clientId, grant_type: 'refresh_token', refresh_token: token }, timeout, this.limits, this.now);
        });
      } catch (error) { failure = error; } finally { this.vault.revokeContext(contextId); }
      if (dispatched) return { kind: 'transient' };                             // the wire never rejects; kept total anyway
      if (!denied(failure)) return this.failed();                               // a local vault error holds: nothing was sent (GS-6)
      const live = this.store.current();
      if (!live) throw new Error('GITHUB_SIGN_IN_REQUIRED');
      if (live.accessRef !== from.accessRef) return live;                       // rotated meanwhile: the current account
      if (attempt > 0) return this.failed();                                    // denied twice
    }                                                                            // otherwise an engine restart cleared the grants: one new grant
  }

  /** The same answer maxSameRefreshError times in a row clears (DC-1, GS-2); otherwise it holds. */
  private async sameOrFail(key: string, from: GitHubAccount): Promise<never> {
    this.sameError = { key, count: this.sameError?.key === key ? this.sameError.count + 1 : 1 };
    if (this.sameError.count >= this.limits.maxSameRefreshError) { await this.clearIf(from.accessRef); throw new Error('GITHUB_SIGN_IN_REQUIRED'); }
    return this.failed();
  }

  /** A refresh failure that keeps the account: a hold of 30 s, 60 s, 120 s, ... at most rateLimitCeilingMs (DC-1). */
  private failed(): never {
    this.failures++;
    this.setHold(Math.min(this.limits.transientHoldMs * 2 ** (this.failures - 1), this.limits.rateLimitCeilingMs), 'GITHUB_RENEWAL_UNAVAILABLE');
    throw new Error('GITHUB_RENEWAL_UNAVAILABLE');
  }
}
