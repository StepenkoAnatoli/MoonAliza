import { expect, test } from 'vitest';
import type { Hardware, LabReceipt, MachineReceipt } from '../src/shared/contracts';
import { machineReceiptEligible, planProbeCandidates, selectLocal, type LocalCandidate, type SelectionContext } from '../src/models/select';

const GiB = 1024 ** 3;
const identity = { modelDigest: 'a'.repeat(64), runtimeDigest: 'b'.repeat(64), backend: 'cpu' as const, quantization: 'Q4_K_M', contextTokens: 4096, parallelism: 1 as const };
const lab: LabReceipt = { ...identity, id: 'lab', schemaVersion: 1, suiteVersion: 'moonaliza-coding-v1', quality: .9, toolsPassed: true, unauthorizedEffects: 0, writesAfterCancellation: 0, labHardwareFingerprint: 'lab-machine', qualifiedAt: '2026-09-01T00:00:00Z', evidenceDigest: 'c'.repeat(64) };
function candidate(id = 'small'): LocalCandidate { return { id, activationSetId: 'active', identity: { ...identity }, labReceipt: { ...lab }, installed: true, modelBytes: GiB, adapterIds: [] }; }
function context(): SelectionContext {
  const hardware: Hardware = { fingerprint: 'd'.repeat(64), runtimeIdentity: identity.runtimeDigest, totalRamBytes: 8 * GiB, availableRamBytes: 4 * GiB, cpu: { architecture: 'x64', name: 'test CPU', logicalProcessors: 4 }, adapters: [], warnings: [] };
  return { hardware, activationSetId: 'active', supportedBackends: ['cpu'], now: new Date('2026-09-28T00:00:00Z'), minimumContextTokens: 2048 };
}
function receipt(c = candidate()): MachineReceipt { return { ...c.identity, id: `machine-${c.id}`, schemaVersion: 1, receiptKind: 'machine', labReceiptId: c.labReceipt.id, activationSetId: 'active', hardwareFingerprint: 'd'.repeat(64), observedBackend: c.identity.backend, adapterIds: [...c.adapterIds], requiredRamBytes: 2 * GiB, requiredVramBytes: null, loadLatencyMs: 90000, firstTokenMs: 30000, tokensPerSecond: 4, toolsPassed: true, quality: .9, measuredAt: '2026-09-27T00:00:00Z' }; }

test('only a matching machine receipt selects a local configuration; lab evidence alone plans a probe', () => {
  const c = candidate(); const r = receipt();
  expect(selectLocal([c], [r], context())).toMatchObject({ status: 'selected', candidateId: 'small', receipt: r, installationRequired: false });
  expect(selectLocal([c], [], context())).toEqual({ status: 'probe-required', candidateIds: ['small'] });
  expect(planProbeCandidates([c], context()).map(item => item.id)).toEqual(['small']);
});

test.each([
  { modelDigest: 'f'.repeat(64) }, { runtimeDigest: 'f'.repeat(64) }, { backend: 'cuda' }, { observedBackend: 'cuda' },
  { quantization: 'Q8_0' }, { contextTokens: 2048 }, { parallelism: 2 }, { labReceiptId: 'foreign' }, { activationSetId: 'old' },
  { hardwareFingerprint: 'foreign' }, { adapterIds: ['unexpected'] }, { requiredVramBytes: 1 }, { requiredRamBytes: 0 },
  { toolsPassed: false }, { quality: .849 }, { loadLatencyMs: 90001 }, { firstTokenMs: 30001 }, { tokensPerSecond: 3.99 },
  { tokensPerSecond: Infinity }, { measuredAt: '2026-08-28T00:00:00Z' }, { measuredAt: '2026-09-29T00:00:00Z' },
])('rejects foreign, stale or failing machine evidence %j', change => {
  expect(machineReceiptEligible({ ...receipt(), ...change }, candidate(), context())).toBe(false);
});

test.each([
  { modelDigest: 'f'.repeat(64) }, { suiteVersion: 'unknown' }, { quality: .84 }, { toolsPassed: false },
  { unauthorizedEffects: 1 }, { writesAfterCancellation: 1 }, { qualifiedAt: '2026-09-29T00:00:00Z' },
])('rejects incompatible lab evidence before even planning a probe %j', change => {
  const c = candidate(); Object.assign(c.labReceipt, change);
  expect(planProbeCandidates([c], context())).toEqual([]);
  expect(selectLocal([c], [receipt()], context()).status).toBe('unavailable');
});

test('requalification invalidates machine evidence measured before the new lab receipt', () => {
  const c = candidate(); c.labReceipt.qualifiedAt = '2026-09-27T12:00:00Z';
  expect(machineReceiptEligible(receipt(c), c, context())).toBe(false);
});

test('RAM reserve uses the larger of 2 GiB and 15 percent, including the exact boundary', () => {
  const ctx = context();
  expect(machineReceiptEligible(receipt(), candidate(), ctx)).toBe(true);
  ctx.hardware!.availableRamBytes--;
  expect(machineReceiptEligible(receipt(), candidate(), ctx)).toBe(false);
  ctx.hardware!.totalRamBytes = 32 * GiB; ctx.hardware!.availableRamBytes = 7301444403;
  expect(machineReceiptEligible(receipt(), candidate(), ctx)).toBe(false);
  ctx.hardware!.availableRamBytes++;
  expect(machineReceiptEligible(receipt(), candidate(), ctx)).toBe(true);
});

test('missing, impossible or unmanaged hardware cannot qualify a local model or invent cloud fallback', () => {
  for (const change of [null, { ...context().hardware!, availableRamBytes: 9 * GiB }, { ...context().hardware!, runtimeIdentity: 'unmanaged' }]) {
    const ctx = { ...context(), hardware: change };
    expect(selectLocal([candidate()], [receipt()], ctx).status).toBe('unavailable');
  }
  const ctx = context(); ctx.hardware!.availableRamBytes = 2 * GiB;
  expect(selectLocal([candidate()], [receipt()], ctx)).toEqual({ status: 'unavailable', reason: 'host-reserve' });
});

test('unsupported backends, older activation sets and insufficient context are excluded', () => {
  const ctx = context(); ctx.supportedBackends = [];
  expect(planProbeCandidates([candidate()], ctx)).toEqual([]);
  ctx.supportedBackends = ['cpu']; ctx.minimumContextTokens = 8192;
  expect(planProbeCandidates([candidate()], ctx)).toEqual([]);
  ctx.minimumContextTokens = 2048; const c = candidate(); c.activationSetId = 'old';
  expect(selectLocal([c], [receipt()], ctx).status).toBe('unavailable');
});

test('GPU selection requires exact observed adapters and known capacity on each adapter', () => {
  const c = candidate('gpu'); c.identity.backend = 'cuda'; c.labReceipt.backend = 'cuda'; c.adapterIds = ['gpu-a', 'gpu-b'];
  const ctx = context(); ctx.supportedBackends.push('cuda');
  ctx.hardware!.adapters = ['gpu-a', 'gpu-b'].map(id => ({ id, name: id, vendorId: 4318, deviceId: 1, dedicatedBytes: 8 * GiB, availableBytes: 4 * GiB, driver: '1' }));
  const r = { ...receipt(c), requiredVramBytes: 4 * GiB, adapterIds: ['gpu-b', 'gpu-a'] };
  expect(machineReceiptEligible(r, c, ctx)).toBe(true);
  expect(machineReceiptEligible({ ...r, adapterIds: ['gpu-a', 'gpu-a'] }, c, ctx)).toBe(false);
  ctx.hardware!.adapters[0]!.availableBytes = null;
  expect(machineReceiptEligible(r, c, ctx)).toBe(false);
  expect(planProbeCandidates([c], ctx)).toEqual([]);
  expect(selectLocal([c, candidate()], [r, receipt()], ctx)).toMatchObject({ status: 'selected', candidateId: 'small' });
  ctx.hardware!.adapters[0]!.availableBytes = 3 * GiB; ctx.hardware!.adapters[1]!.availableBytes = 5 * GiB;
  expect(machineReceiptEligible(r, c, ctx)).toBe(false); // Summing free VRAM would incorrectly accept this.
  expect(machineReceiptEligible({ ...r, requiredVramBytes: null }, c, ctx)).toBe(false);
});

test('first probes prefer smaller installed lab-qualified candidates without inventing measured RAM', () => {
  const large = candidate('large'); large.modelBytes = 3 * GiB;
  const remote = candidate('download'); remote.installed = false; remote.modelBytes = GiB / 2;
  const small = candidate(); small.modelBytes = GiB;
  expect(planProbeCandidates([large, remote, small], context()).map(item => item.id)).toEqual(['small', 'download']);
  expect(selectLocal([large, remote, small], [], context())).toEqual({ status: 'probe-required', candidateIds: ['small', 'download'] });
});

test('quality dominates ranking, with installed preference within two percentage points and responsiveness breaking ties', () => {
  const a = candidate('a'), b = candidate('b'); b.identity.modelDigest = 'f'.repeat(64); b.labReceipt.modelDigest = b.identity.modelDigest; b.labReceipt.id = 'lab-b'; b.installed = false;
  const ra = receipt(a), rb = { ...receipt(b), quality: .92, firstTokenMs: 100 };
  expect(selectLocal([b, a], [rb, ra], context())).toMatchObject({ status: 'selected', candidateId: 'a' });
  rb.quality = .93;
  expect(selectLocal([a, b], [ra, rb], context())).toMatchObject({ status: 'selected', candidateId: 'b', installationRequired: true });
  b.installed = true; rb.quality = .9;
  expect(selectLocal([a, b], [ra, rb], context())).toMatchObject({ status: 'selected', candidateId: 'b' });
});

test('a newer failed measurement supersedes an earlier success for the same configuration', () => {
  const old = receipt(), latest = { ...receipt(), id: 'latest', measuredAt: '2026-09-27T12:00:00Z', toolsPassed: false };
  expect(selectLocal([candidate()], [old, latest], context())).toEqual({ status: 'probe-required', candidateIds: ['small'] });
  expect(selectLocal([candidate()], [latest, old], context()).status).toBe('probe-required');
});

test('ambiguous candidate identities and conflicting same-time evidence fail closed', () => {
  expect(selectLocal([candidate(), candidate()], [receipt()], context())).toEqual({ status: 'unavailable', reason: 'invalid-candidates' });
  expect(selectLocal([candidate()], [receipt(), { ...receipt(), id: 'conflict', toolsPassed: false }], context()).status).toBe('probe-required');
});
