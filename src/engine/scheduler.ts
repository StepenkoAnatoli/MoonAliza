import { randomUUID } from 'node:crypto';

export interface LeaseToken { readonly epoch: string; readonly generation: number }
export interface InferenceLease { readonly token: LeaseToken; readonly signal: AbortSignal; assertCurrent(): void; heartbeat(): void }
export type StopReason = 'completed' | 'failed' | 'cancelled' | 'deadline' | 'heartbeat' | 'maintenance' | 'shutdown';
export interface SchedulerOptions { stopRuntime(reason: StopReason): Promise<void>; maxQueue?: number; cleanupTimeoutMs?: number }
export interface RunOptions { signal?: AbortSignal; queueTimeoutMs?: number; leaseTimeoutMs?: number; heartbeatTimeoutMs?: number }
export class LeaseFence {
  private readonly epoch = randomUUID();
  private generation = 0;
  private active: LeaseToken | undefined;
  private stopping = false;
  acquire(): LeaseToken {
    if (this.active) throw new Error('BUSY');
    if (this.generation === Number.MAX_SAFE_INTEGER) throw new Error('LEASE_GENERATION_EXHAUSTED');
    this.stopping = false;
    return this.active = Object.freeze({ epoch: this.epoch, generation: ++this.generation });
  }
  private requireHolder(token: LeaseToken) { if (!this.active || this.active !== token) throw new Error('STALE_LEASE'); }
  assertCurrent(token: LeaseToken): void { this.requireHolder(token); if (this.stopping) throw new Error('LEASE_STOPPING'); }
  beginStop(token: LeaseToken): void { this.requireHolder(token); this.stopping = true; }
  confirmStopped(token: LeaseToken): void {
    this.requireHolder(token); if (!this.stopping) throw new Error('LEASE_NOT_STOPPING'); this.active = undefined;
  }
}

type Result = { ok: true; value: unknown } | { ok: false; error: unknown };
type Entry = {
  kind: 'inference' | 'maintenance'; task: (lease: InferenceLease) => Promise<unknown>;
  resolve(value: unknown): void; reject(error: unknown): void;
  controller: AbortController; signal?: AbortSignal; onAbort(): void;
  cancelled: Promise<Result>; wakeCancellation(result: Result): void;
  done: Promise<void>; finish(): void;
  phase: 'queued' | 'running' | 'stopping' | 'done'; token?: LeaseToken;
  reason?: StopReason; error?: Error;
  queueTimer?: ReturnType<typeof setTimeout>; leaseTimer?: ReturnType<typeof setTimeout>; heartbeatTimer?: ReturnType<typeof setTimeout>;
  queueDeadline: number; leaseTimeoutMs: number; heartbeatTimeoutMs: number;
};
function limit(value: number, minimum = 1, maximum = 3_600_000) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error('INVALID_SCHEDULER_LIMIT'); return value;
}

/** One process-owned scheduler. The trusted owner must confirm actual runtime exit. */
export class InferenceScheduler {
  private readonly fence = new LeaseFence();
  private readonly queue: Entry[] = [];
  private readonly maxQueue: number;
  private readonly cleanupTimeoutMs: number;
  private readonly stopRuntime: SchedulerOptions['stopRuntime'];
  private active?: Entry;
  private maintenance = 0;
  private closed = false;
  private fault?: Error;
  private closing?: Promise<void>;

  constructor(options: SchedulerOptions) {
    this.maxQueue = limit(options.maxQueue ?? 16, 0, 128);
    this.cleanupTimeoutMs = limit(options.cleanupTimeoutMs ?? 30_000, 1, 120_000);
    if (typeof options.stopRuntime !== 'function') throw new Error('INVALID_RUNTIME_OWNER');
    this.stopRuntime = options.stopRuntime;
  }
  async run<T>(task: (lease: InferenceLease) => Promise<T>, options: RunOptions = {}): Promise<T> {
    return this.enqueue('inference', task, options);
  }
  async withRuntimeStopped<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return this.enqueue('maintenance', task, { signal });
  }
  private enqueue<T>(kind: Entry['kind'], task: (lease: InferenceLease) => Promise<T>, options: RunOptions): Promise<T> {
    if (this.fault) throw this.fault;
    if (this.closed) throw new Error('SCHEDULER_CLOSED');
    if (kind === 'inference' && this.maintenance) throw new Error('RUNTIME_MAINTENANCE');
    if (options.signal?.aborted) throw new Error('INFERENCE_CANCELLED');
    const queueTimeoutMs = limit(options.queueTimeoutMs ?? 60_000);
    const leaseTimeoutMs = limit(options.leaseTimeoutMs ?? 300_000);
    const heartbeatTimeoutMs = limit(options.heartbeatTimeoutMs ?? 60_000);
    if (this.active && this.queue.length >= this.maxQueue) throw new Error('INFERENCE_QUEUE_FULL');
    return new Promise<T>((resolve, reject) => {
      let wakeCancellation!: Entry['wakeCancellation']; let finish!: Entry['finish'];
      const entry: Entry = {
        kind, task, resolve: value => resolve(value as T), reject, controller: new AbortController(), signal: options.signal,
        cancelled: new Promise<Result>(done => { wakeCancellation = done; }), wakeCancellation: result => wakeCancellation(result),
        done: new Promise<void>(done => { finish = done; }), finish: () => finish(),
        phase: 'queued', queueDeadline: performance.now() + queueTimeoutMs, leaseTimeoutMs, heartbeatTimeoutMs,
        onAbort: () => this.cancel(entry, new Error('INFERENCE_CANCELLED'), 'cancelled'),
      };
      if (kind === 'maintenance') this.maintenance++;
      this.queue.push(entry);
      entry.signal?.addEventListener('abort', entry.onAbort, { once: true });
      entry.queueTimer = setTimeout(() => this.cancel(entry, new Error('INFERENCE_QUEUE_TIMEOUT'), 'deadline'), queueTimeoutMs);
      this.pump();
    });
  }
  private clearTimers(entry: Entry) {
    clearTimeout(entry.queueTimer); clearTimeout(entry.leaseTimer); clearTimeout(entry.heartbeatTimer);
  }
  private dispose(entry: Entry) {
    this.clearTimers(entry); entry.signal?.removeEventListener('abort', entry.onAbort);
    entry.phase = 'done'; if (entry.kind === 'maintenance') this.maintenance--; entry.finish();
  }
  private cancel(entry: Entry, error: Error, reason: StopReason) {
    if (entry.phase === 'done' || entry.error) return;
    entry.error = error; entry.reason = reason;
    // Revoke before dispatching abort listeners: those listeners can re-enter broker code.
    if (entry.token) { this.fence.beginStop(entry.token); entry.phase = 'stopping'; }
    entry.controller.abort(error); entry.wakeCancellation({ ok: false, error });
    if (!entry.token) {
      const index = this.queue.indexOf(entry); if (index >= 0) this.queue.splice(index, 1);
      this.dispose(entry); entry.reject(error);
    }
  }
  private rejectQueued(error: Error) {
    for (const entry of [...this.queue]) this.cancel(entry, error, 'shutdown');
  }
  private pump() {
    if (this.active || this.closed || this.fault) return;
    let entry = this.queue.shift();
    while (entry && performance.now() >= entry.queueDeadline) {
      this.cancel(entry, new Error('INFERENCE_QUEUE_TIMEOUT'), 'deadline'); entry = this.queue.shift();
    }
    if (!entry) return;
    this.active = entry; entry.phase = 'running'; clearTimeout(entry.queueTimer);
    entry.token = this.fence.acquire();
    void this.execute(entry);
  }
  private async stop(reason: StopReason) {
    const deadline = performance.now() + this.cleanupTimeoutMs;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        Promise.resolve().then(() => this.stopRuntime(reason)),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('RUNTIME_STOP_TIMEOUT')), this.cleanupTimeoutMs); }),
      ]);
      if (performance.now() >= deadline) throw new Error('RUNTIME_STOP_TIMEOUT');
    } catch (cause) {
      this.fault = new Error('RUNTIME_STOP_UNCONFIRMED', { cause }); this.rejectQueued(this.fault); throw this.fault;
    } finally { clearTimeout(timer); }
  }
  private async execute(entry: Entry) {
    const token = entry.token!; let stopped = false;
    const deadline = performance.now() + entry.leaseTimeoutMs;
    let heartbeatDeadline = performance.now() + entry.heartbeatTimeoutMs;
    let result: Result = { ok: false, error: new Error('INFERENCE_CANCELLED') };
    const assertCurrent = () => {
      this.fence.assertCurrent(token);
      const now = performance.now();
      if (now >= deadline) this.cancel(entry, new Error('INFERENCE_DEADLINE'), 'deadline');
      else if (now >= heartbeatDeadline) this.cancel(entry, new Error('INFERENCE_HEARTBEAT_TIMEOUT'), 'heartbeat');
      this.fence.assertCurrent(token);
    };
    const heartbeat = () => {
      assertCurrent(); clearTimeout(entry.heartbeatTimer); heartbeatDeadline = performance.now() + entry.heartbeatTimeoutMs;
      entry.heartbeatTimer = setTimeout(() => this.cancel(entry, new Error('INFERENCE_HEARTBEAT_TIMEOUT'), 'heartbeat'), entry.heartbeatTimeoutMs);
    };
    const lease: InferenceLease = Object.freeze({ token, signal: entry.controller.signal, assertCurrent, heartbeat });
    try {
      if (entry.kind === 'maintenance') {
        this.fence.beginStop(token); await this.stop('maintenance'); stopped = true;
        if (!entry.error) result = { ok: true, value: await entry.task(lease) };
      } else {
        if (!entry.error) {
          heartbeat(); entry.leaseTimer = setTimeout(() => this.cancel(entry, new Error('INFERENCE_DEADLINE'), 'deadline'), entry.leaseTimeoutMs);
          const work: Promise<Result> = Promise.resolve().then(() => { lease.assertCurrent(); return entry.task(lease); }).then(value => ({ ok: true, value }), error => ({ ok: false, error }));
          // A late result is consumed, but cannot publish or authorize a stale broker operation.
          result = await Promise.race([work, entry.cancelled]);
          if (!entry.error) assertCurrent();
        }
      }
    } catch (error) { result = { ok: false, error }; }
    this.fence.beginStop(token); entry.phase = 'stopping'; this.clearTimers(entry);
    entry.controller.abort(new Error('LEASE_FINISHED'));
    if (entry.kind === 'inference') {
      try { await this.stop(entry.reason ?? (result.ok ? 'completed' : 'failed')); stopped = true; }
      catch (error) { result = { ok: false, error }; }
    }
    if (stopped) this.fence.confirmStopped(token);
    if (this.fault) result = { ok: false, error: this.fault };
    else if (entry.error) result = { ok: false, error: entry.error };
    this.active = undefined; this.dispose(entry);
    if (result.ok) entry.resolve(result.value); else entry.reject(result.error);
    this.pump();
  }
  shutdown(): Promise<void> {
    if (this.closing) return this.closing;
    this.closed = true; const error = new Error('SCHEDULER_CLOSED'); this.rejectQueued(error);
    if (this.fault) return this.closing = Promise.reject(this.fault);
    const active = this.active;
    if (active) {
      this.cancel(active, error, 'shutdown');
      return this.closing = active.done.then(() => { if (this.fault) throw this.fault; });
    }
    return this.closing = this.stop('shutdown');
  }
}
