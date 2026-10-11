import { z } from 'zod';
import { validateEndpoint, type Fetcher, type ProviderKind } from './inference';

/**
 * Fail-closed locality for a user-run Ollama (docs/specification/more-models.md, Phase 1 design 2).
 * A loopback Ollama can serve cloud models that forward the prompt to ollama.com (wire E-28, E-29, E-31),
 * so under a local-only policy its endpoint host alone does not make it local: before every model step
 * main asks the server itself, and sends nothing to /api/chat unless it answers that cloud is disabled.
 */
export const STATUS_TIMEOUT_MS = 5_000;
export const STATUS_MAX_BYTES = 64 * 1024;

// StatusHandler's answer (wire E-31) as types.go declares it (wire E-30): { cloud: { disabled, source } };
// the same shape the managed runtime reads at startup (src/models/managed-ollama.ts). `source` is not read.
const StatusSchema = z.object({ cloud: z.object({ disabled: z.boolean() }) });

/** What infer() already holds for the run: the effective policy is the session's and the project's together. */
export interface LocalityContext {
  session: { policy: { inference: 'local-only' | 'cloud-allowed' } };
  project: { policy: { inference: 'local-only' | 'cloud-allowed' } } | null;
  profile: { kind: ProviderKind; endpoint: string };
}

/** Anything but cloud-allowed on both sides is local-only, as assertConversationPolicy reads them. */
function localOnly(context: LocalityContext): boolean {
  return context.session.policy.inference !== 'cloud-allowed' || (context.project !== null && context.project.policy.inference !== 'cloud-allowed');
}

/** Before each inference step: an `ollama` profile under a local-only policy must prove its cloud is off. Nothing else is asked. */
export async function verifyOllamaLocality(context: LocalityContext, fetcher: Fetcher, signal: AbortSignal): Promise<void> {
  if (context.profile.kind !== 'ollama' || !localOnly(context)) return;
  await assertOllamaLocal(context.profile.endpoint, fetcher, signal);
}

/**
 * Returns only when GET <endpoint>/api/status answers 200 with JSON whose cloud.disabled is true. Any other
 * status, shape or value, a body over 64 KiB or not JSON, a redirect, a network error or no answer within
 * 5 s throws LOCAL_MODEL_UNVERIFIED. The request carries no credential and no prompt, and its answer is never
 * taken from the session's HTTP cache, so every step hears from the server itself. A run cancelled
 * before or during the check throws RUN_CANCELLED instead.
 */
export async function assertOllamaLocal(endpoint: string, fetcher: Fetcher, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw new Error('RUN_CANCELLED');
  // The same base complete() posts /api/chat to: a trailing slash or path is normalised the same way.
  const base = validateEndpoint('ollama', endpoint).endpoint;
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(STATUS_TIMEOUT_MS)]);
  let disabled = false;
  try { disabled = await untilAborted(readStatus(`${base}/api/status`, fetcher, bounded), bounded); }
  catch { /* every failure is the same refusal, decided below */ }
  if (signal.aborted) throw new Error('RUN_CANCELLED');
  if (!disabled) throw new Error('LOCAL_MODEL_UNVERIFIED');
}

async function readStatus(url: string, fetcher: Fetcher, signal: AbortSignal): Promise<boolean> {
  // cache 'no-store': a cached cloud.disabled: true must never answer for an Ollama restarted with cloud on.
  const response = await fetcher(url, { method: 'GET', redirect: 'error', credentials: 'omit', cache: 'no-store', signal });
  // The redirect guard is redirect: 'error', which Electron's session.fetch enforces (its responses never report
  // `redirected`); this check only catches a fetcher that followed a redirect anyway and says so, as Node's fetch does.
  if (response.status !== 200 || response.redirected) { await response.body?.cancel().catch(() => undefined); return false; }
  const reader = response.body?.getReader();
  if (!reader) return false;
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', cancel, { once: true });
  // Headers that arrive after the bound, through a fetcher that ignores the signal: the listener above never fires.
  if (signal.aborted) { cancel(); return false; }
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > STATUS_MAX_BYTES) return false;
      chunks.push(chunk.value);
    }
  } finally { signal.removeEventListener('abort', cancel); cancel(); }
  // Defence in depth: untilAborted already rejects on this same signal, so this result would be discarded anyway.
  if (signal.aborted) return false;
  let data: unknown;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return false; }
  const parsed = StatusSchema.safeParse(data);
  return parsed.success && parsed.data.cloud.disabled === true;
}

/** Settles with `work`, or rejects once `signal` aborts, whether or not the fetcher honours the signal. */
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new Error('aborted'));
    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
