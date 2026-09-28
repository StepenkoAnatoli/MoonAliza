import { expect, test } from 'vitest';
import { normalizeBytes, normalizeHardware, probeHardware } from '../src/models/hardware';

const raw = () => ({ schemaVersion: 1, totalRamBytes: 8 * 1024 ** 3, availableRamBytes: 3 * 1024 ** 3, cpu: { architecture: 'x64', name: 'Fixture CPU', logicalProcessors: 8 }, adapters: [
  { id: 'gpu-a', name: 'GPU A', vendorId: 4318, deviceId: 111, dedicatedBytes: 12 * 1024 ** 3, availableBytes: null, driver: '1.0', software: false },
], warnings: [] });
test('preserves unknown memory and rejects loss of precision or impossible values', () => {
  expect(normalizeBytes(null)).toBeNull(); expect(normalizeBytes(12 * 1024 ** 3)).toBe(12 * 1024 ** 3);
  for (const value of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(() => normalizeBytes(value)).toThrow();
  expect(() => normalizeHardware({ ...raw(), availableRamBytes: 9 * 1024 ** 3 }, 'runtime-a')).toThrow();
});
test('hardware identity binds CPU, driver and runtime but excludes fluctuating free memory', () => {
  const first = normalizeHardware(raw(), 'runtime-a');
  expect(first.adapters[0]?.availableBytes).toBeNull(); expect(first.adapters[0]?.dedicatedBytes).toBe(12 * 1024 ** 3);
  expect(normalizeHardware({ ...raw(), availableRamBytes: 1 }, 'runtime-a').fingerprint).toBe(first.fingerprint);
  expect(normalizeHardware(raw(), 'runtime-b').fingerprint).not.toBe(first.fingerprint);
  const changed = raw(); changed.adapters[0]!.driver = '2.0';
  expect(normalizeHardware(changed, 'runtime-a').fingerprint).not.toBe(first.fingerprint);
  changed.cpu.name = 'Another CPU'; expect(normalizeHardware(changed, 'runtime-a').fingerprint).not.toBe(first.fingerprint);
});
test('normalizes multi-adapter order and excludes software adapters without inventing integrated VRAM', () => {
  const data = raw(); data.adapters.push({ ...data.adapters[0]!, id: 'integrated', name: 'Integrated GPU', dedicatedBytes: 0, driver: '1.0' });
  const first = normalizeHardware(data, 'runtime-a'); data.adapters.reverse();
  expect(normalizeHardware(data, 'runtime-a').fingerprint).toBe(first.fingerprint);
  data.adapters.push({ ...data.adapters[0]!, id: 'software', software: true });
  expect(normalizeHardware(data, 'runtime-a').adapters).toHaveLength(2);
  expect(first.adapters.find(a => a.id === 'integrated')?.availableBytes).toBeNull();
  data.adapters.push(data.adapters[0]!); expect(() => normalizeHardware(data, 'runtime-a')).toThrow();
});
test('native failures remain explicit without exposing process errors', async () => {
  const result = await probeHardware({ helperPath: 'Z:\\missing\\MoonAlizaHost.exe', runtimeIdentity: 'fixture' });
  expect(result.hardware).toBeNull(); expect(result.error).toBe('HARDWARE_UNAVAILABLE');
  expect(JSON.stringify(result)).not.toContain('Z:');
});
test('real Windows probe returns host RAM and preserves unsupported telemetry as unknown', async () => {
  const result = await probeHardware({ runtimeIdentity: 'native-test' });
  expect(result.hardware?.totalRamBytes).toBeGreaterThan(0);
  expect(result.hardware?.cpu.logicalProcessors).toBeGreaterThan(0);
  expect(result.hardware?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
});
