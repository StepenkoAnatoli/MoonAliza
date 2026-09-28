import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { z } from 'zod';
import { CpuSchema, HardwareAdapterSchema, HardwareSchema, type Hardware } from '../shared/contracts';
import { safeCommandEnvironment } from '../tools/commands';

const bytes = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const RawHardware = z.object({ schemaVersion: z.literal(1), totalRamBytes: bytes.positive(), availableRamBytes: bytes, cpu: CpuSchema, adapters: z.array(HardwareAdapterSchema.extend({ software: z.boolean() })).max(32), warnings: z.array(z.string().max(128)).max(32) }).strict();
export function normalizeBytes(value: number | null): number | null { return bytes.nullable().parse(value); }
export function normalizeHardware(value: unknown, runtimeIdentity: string): Hardware {
  const raw = RawHardware.parse(value);
  if (raw.availableRamBytes > raw.totalRamBytes || new Set(raw.adapters.map(adapter => adapter.id)).size !== raw.adapters.length || raw.adapters.some(adapter => adapter.availableBytes !== null && adapter.availableBytes > adapter.dedicatedBytes)) throw new Error('INVALID_HARDWARE_MEASUREMENT');
  const adapters = raw.adapters.filter(adapter => !adapter.software).map(({ software: _software, ...adapter }) => adapter).sort((a, b) => a.id.localeCompare(b.id));
  // Free memory changes from moment to moment. It must not change hardware identity.
  const fingerprint = createHash('sha256').update(JSON.stringify({ schemaVersion: 1, runtimeIdentity, cpu: raw.cpu, totalRamBytes: raw.totalRamBytes, adapters: adapters.map(({ availableBytes: _available, ...adapter }) => adapter) })).digest('hex');
  return HardwareSchema.parse({ fingerprint, runtimeIdentity, cpu: raw.cpu, totalRamBytes: raw.totalRamBytes, availableRamBytes: raw.availableRamBytes, adapters, warnings: raw.warnings });
}
export async function probeHardware(options: { helperPath?: string; runtimeIdentity: string }): Promise<{ hardware: Hardware | null; error: 'HARDWARE_UNAVAILABLE' | null }> {
  try {
    const { stdout } = await promisify(execFile)(options.helperPath ?? resolve('.build/native/MoonAlizaHost.exe'), ['--hardware'], { timeout: 12000, maxBuffer: 65536, windowsHide: true, env: safeCommandEnvironment() });
    return { hardware: normalizeHardware(JSON.parse(stdout), options.runtimeIdentity), error: null };
  } catch { return { hardware: null, error: 'HARDWARE_UNAVAILABLE' }; }
}
