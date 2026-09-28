import { z } from 'zod';
import { BackendSchema, ConfigurationIdentitySchema, HardwareSchema, IdSchema, LabReceiptSchema, MachineReceiptSchema, type Backend, type ConfigurationIdentity, type Hardware, type MachineReceipt } from '../shared/contracts';

const CandidateSchema = z.object({ id: IdSchema, activationSetId: IdSchema, identity: ConfigurationIdentitySchema, labReceipt: LabReceiptSchema.strict(), installed: z.boolean(), modelBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), adapterIds: z.array(IdSchema).max(32) }).strict();
export type LocalCandidate = z.infer<typeof CandidateSchema>;
export interface SelectionContext { hardware: Hardware | null; activationSetId: string; supportedBackends: Backend[]; now: Date; minimumContextTokens?: number }
export type LocalSelection = { status: 'selected'; candidateId: string; receipt: MachineReceipt; installationRequired: boolean }
  | { status: 'probe-required'; candidateIds: string[] }
  | { status: 'unavailable'; reason: 'hardware-unavailable' | 'invalid-context' | 'invalid-candidates' | 'host-reserve' | 'no-qualified-configuration' };

const ContextSchema = z.object({ hardware: HardwareSchema.nullable(), activationSetId: IdSchema, supportedBackends: z.array(BackendSchema).max(4), now: z.date(), minimumContextTokens: z.number().int().min(512).max(2_000_000).default(512) }).strict();
type Context = z.infer<typeof ContextSchema> & { hardware: Hardware };
const sameIdentity = (a: ConfigurationIdentity, b: ConfigurationIdentity) => a.modelDigest === b.modelDigest && a.runtimeDigest === b.runtimeDigest && a.backend === b.backend && a.quantization === b.quantization && a.contextTokens === b.contextTokens && a.parallelism === b.parallelism;
const sameAdapters = (a: string[], b: string[]) => new Set(a).size === a.length && new Set(b).size === b.length && a.length === b.length && a.every(id => b.includes(id));
const reserve = (hardware: Hardware) => Number((BigInt(hardware.totalRamBytes) * 15n + 99n) / 100n > 2147483648n ? (BigInt(hardware.totalRamBytes) * 15n + 99n) / 100n : 2147483648n);
function checkedContext(input: SelectionContext): Context | null {
  const result = ContextSchema.safeParse(input); if (!result.success || !result.data.hardware) return null;
  const { hardware } = result.data;
  if (!hardware.totalRamBytes || hardware.availableRamBytes > hardware.totalRamBytes || new Set(hardware.adapters.map(a => a.id)).size !== hardware.adapters.length || hardware.adapters.some(a => a.availableBytes !== null && a.availableBytes > a.dedicatedBytes)) return null;
  return { ...result.data, hardware };
}
function candidates(input: readonly LocalCandidate[]): LocalCandidate[] | null {
  const result = z.array(CandidateSchema).max(256).safeParse(input);
  return result.success && new Set(result.data.map(c => c.id)).size === result.data.length ? result.data : null;
}
function labEligible(c: LocalCandidate, ctx: Context): boolean {
  const lab = c.labReceipt;
  return c.activationSetId === ctx.activationSetId && sameIdentity(c.identity, lab) && c.identity.runtimeDigest === ctx.hardware.runtimeIdentity
    && ctx.supportedBackends.includes(c.identity.backend) && Number.isSafeInteger(c.identity.contextTokens) && c.identity.contextTokens >= ctx.minimumContextTokens
    && lab.suiteVersion === 'moonaliza-coding-v1' && lab.quality >= .85 && lab.toolsPassed && lab.unauthorizedEffects === 0 && lab.writesAfterCancellation === 0
    && Date.parse(lab.qualifiedAt) <= ctx.now.getTime() && new Set(c.adapterIds).size === c.adapterIds.length
    && (c.identity.backend === 'cpu' ? c.adapterIds.length === 0 : c.adapterIds.length > 0 && c.adapterIds.every(id => ctx.hardware.adapters.some(a => a.id === id && a.availableBytes !== null && a.availableBytes > 0)));
}
function scopeMatches(r: MachineReceipt, c: LocalCandidate, ctx: Context): boolean {
  return sameIdentity(r, c.identity) && r.labReceiptId === c.labReceipt.id && r.activationSetId === ctx.activationSetId && r.hardwareFingerprint === ctx.hardware.fingerprint && sameAdapters(r.adapterIds, c.adapterIds);
}
function eligible(r: MachineReceipt, c: LocalCandidate, ctx: Context): boolean {
  const measured = Date.parse(r.measuredAt), age = ctx.now.getTime() - measured;
  if (!labEligible(c, ctx) || !scopeMatches(r, c, ctx) || r.observedBackend !== r.backend || age < 0 || age > 30 * 86400000 || measured < Date.parse(c.labReceipt.qualifiedAt)
    || !r.toolsPassed || r.quality < .85 || r.loadLatencyMs > 90000 || r.firstTokenMs > 30000 || r.tokensPerSecond < 4 || r.requiredRamBytes <= 0
    || r.requiredRamBytes > ctx.hardware.availableRamBytes - reserve(ctx.hardware)) return false;
  if (r.backend === 'cpu') return r.requiredVramBytes === null || r.requiredVramBytes === 0;
  // Receipts currently record total VRAM demand, not placement per adapter. Never sum capacities.
  return r.requiredVramBytes !== null && r.requiredVramBytes > 0 && c.adapterIds.every(id => {
    const free = ctx.hardware.adapters.find(a => a.id === id)?.availableBytes;
    return free !== null && free !== undefined && free >= r.requiredVramBytes!;
  });
}

/** Pure policy gate. Callers must obtain candidates from a verified activation and receipts from retained probe evidence. */
export function machineReceiptEligible(input: unknown, candidate: LocalCandidate, context: SelectionContext): boolean {
  const r = MachineReceiptSchema.strict().safeParse(input), c = CandidateSchema.safeParse(candidate), ctx = checkedContext(context);
  return !!(r.success && c.success && ctx && eligible(r.data, c.data, ctx));
}
function probes(items: LocalCandidate[], ctx: Context): LocalCandidate[] {
  const headroom = ctx.hardware.availableRamBytes - reserve(ctx.hardware); if (headroom <= 0) return [];
  // Disk bytes are only a conservative CPU admission filter, never a measured peak-memory receipt.
  return items.filter(c => labEligible(c, ctx) && (c.identity.backend !== 'cpu' || c.modelBytes <= headroom))
    .sort((a, b) => Number(b.installed) - Number(a.installed) || a.modelBytes - b.modelBytes || b.labReceipt.quality - a.labReceipt.quality || a.id.localeCompare(b.id));
}
export function planProbeCandidates(input: readonly LocalCandidate[], context: SelectionContext): LocalCandidate[] {
  const items = candidates(input), ctx = checkedContext(context); return items && ctx ? probes(items, ctx) : [];
}

/** No networking, probing or cloud fallback. Recheck resources under the inference lease immediately before use. */
export function selectLocal(input: readonly LocalCandidate[], receipts: readonly unknown[], context: SelectionContext): LocalSelection {
  const items = candidates(input); if (!items) return { status: 'unavailable', reason: 'invalid-candidates' };
  const ctx = checkedContext(context); if (!ctx) return { status: 'unavailable', reason: context.hardware === null ? 'hardware-unavailable' : 'invalid-context' };
  if (ctx.hardware.availableRamBytes <= reserve(ctx.hardware)) return { status: 'unavailable', reason: 'host-reserve' };
  if (receipts.length > 4096) return { status: 'unavailable', reason: 'invalid-context' };
  const parsed = receipts.flatMap(value => { const result = MachineReceiptSchema.strict().safeParse(value); return result.success ? [result.data] : []; });
  const qualified: { candidate: LocalCandidate; receipt: MachineReceipt }[] = [];
  for (const c of items) {
    const matching = parsed.filter(r => scopeMatches(r, c, ctx)).sort((a, b) => Date.parse(b.measuredAt) - Date.parse(a.measuredAt));
    const latest = matching[0]; if (!latest) continue;
    // Do not hide a newer failure behind an older success or choose between conflicting evidence.
    if (matching.some(r => Date.parse(r.measuredAt) === Date.parse(latest.measuredAt) && JSON.stringify(r) !== JSON.stringify(latest))) continue;
    if (eligible(latest, c, ctx)) qualified.push({ candidate: c, receipt: latest });
  }
  if (qualified.length) {
    const bestQuality = Math.max(...qualified.map(item => item.receipt.quality));
    // Compare against one global quality band to keep the ordering transitive and input-order independent.
    const comparable = qualified.filter(item => item.receipt.quality + .02 + Number.EPSILON >= bestQuality);
    comparable.sort((a, b) => Number(b.candidate.installed) - Number(a.candidate.installed) || b.receipt.quality - a.receipt.quality || a.receipt.firstTokenMs - b.receipt.firstTokenMs || b.receipt.tokensPerSecond - a.receipt.tokensPerSecond || a.receipt.loadLatencyMs - b.receipt.loadLatencyMs || a.candidate.id.localeCompare(b.candidate.id));
    const winner = comparable[0]!;
    return { status: 'selected', candidateId: winner.candidate.id, receipt: winner.receipt, installationRequired: !winner.candidate.installed };
  }
  const planned = probes(items, ctx);
  return planned.length ? { status: 'probe-required', candidateIds: planned.map(c => c.id) } : { status: 'unavailable', reason: 'no-qualified-configuration' };
}
