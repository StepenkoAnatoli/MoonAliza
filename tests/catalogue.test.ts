import { generateKeyPairSync, sign } from 'node:crypto';
import { expect, test } from 'vitest';
import { verifyCatalogue } from '../src/models/catalogue';
const keys = generateKeyPairSync('ed25519');
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const context = { trustedKeys: { fixture: publicKey }, appVersion: '0.5.0', minimumSequence: 1, now: new Date('2026-09-27T00:00:00Z') };
const digest = 'a'.repeat(64);
const artifact = (id: string, role: string) => ({ id, role, sha256: digest, sizeBytes: 4, url: `https://artifacts.example/${id}`, redirectHosts: [] });
function payload() { return { schemaVersion: 1, id: 'fixture-set', sequence: 2, app: { min: '0.5.0', maxExclusive: '1.0.0' }, issuedAt: '2026-09-26T00:00:00Z', expiresAt: '2026-10-26T00:00:00Z', artifacts: [artifact('runtime', 'runtime'), artifact('manifest', 'model-manifest'), artifact('weights', 'model-blob'), artifact('receipt', 'lab-receipt'), artifact('evidence', 'evidence'), artifact('runtime-files', 'runtime-manifest')], runtimes: [{ id: 'ollama', artifactId: 'runtime', manifestId: 'runtime-files', executable: 'ollama.exe', backends: ['cpu'], maxExpandedBytes: 16, maxEntries: 10 }], configurations: [{ runtimeId: 'ollama', modelManifestId: 'manifest', modelBlobIds: ['weights'], labReceiptId: 'receipt', evidenceId: 'evidence' }] }; }
function envelope(value: unknown) {
  const bytes = Buffer.from(JSON.stringify(value));
  return { schemaVersion: 1, keyId: 'fixture', algorithm: 'Ed25519', payload: bytes.toString('base64'), signature: sign(null, Buffer.concat([Buffer.from('MoonAliza activation set v1\0'), bytes]), keys.privateKey).toString('base64') };
}
test('accepts a signature bound to the exact catalogue bytes and returns immutable trusted metadata', () => {
  const result = verifyCatalogue(envelope(payload()), context);
  expect(result.payload.id).toBe('fixture-set'); expect(result.digest).toMatch(/^[a-f0-9]{64}$/);
  expect(() => { result.payload.artifacts[0]!.url = 'https://other.example'; }).toThrow();
});
test('rejects tampered bytes, unknown keys and signatures from another message domain before parsing payload', () => {
  const good = envelope(payload());
  expect(() => verifyCatalogue({ ...good, payload: Buffer.from('{bad json').toString('base64') }, context)).toThrow('CATALOGUE_SIGNATURE');
  expect(() => verifyCatalogue({ ...good, keyId: 'untrusted' }, context)).toThrow('CATALOGUE_SIGNATURE');
  expect(() => verifyCatalogue({ ...good, signature: sign(null, Buffer.from(good.payload, 'base64'), keys.privateKey).toString('base64') }, context)).toThrow('CATALOGUE_SIGNATURE');
});
test('rejects rollback, expired or future-dated metadata and unsupported application versions', () => {
  expect(() => verifyCatalogue(envelope(payload()), { ...context, minimumSequence: 3 })).toThrow('CATALOGUE_ROLLBACK');
  expect(() => verifyCatalogue(envelope(payload()), { ...context, now: new Date('2026-11-01T00:00:00Z') })).toThrow('CATALOGUE_EXPIRED');
  expect(() => verifyCatalogue(envelope(payload()), { ...context, now: new Date('2026-09-01T00:00:00Z') })).toThrow('CATALOGUE_EXPIRED');
  for (const version of ['0.4.9', '1.0.0', '0.5.0-beta', '01.5.0']) expect(() => verifyCatalogue(envelope(payload()), { ...context, appVersion: version })).toThrow('CATALOGUE_INCOMPATIBLE');
});
test('rejects incomplete sets, duplicate identities, incompatible artifact roles and dangerous executable paths', () => {
  const absent = payload(); absent.artifacts = absent.artifacts.filter(item => item.id !== 'receipt');
  const duplicate = payload(); duplicate.artifacts.push(duplicate.artifacts[0]!);
  const wrongRole = payload(); wrongRole.artifacts[3]!.role = 'model-blob';
  const wrongRuntime = payload(); wrongRuntime.configurations[0]!.runtimeId = 'missing';
  const traversal = payload(); traversal.runtimes[0]!.executable = '../outside.exe';
  for (const value of [absent, duplicate, wrongRole, wrongRuntime, traversal]) expect(() => verifyCatalogue(envelope(value), context)).toThrow('CATALOGUE_INVALID');
});
test('rejects extra fields, unsafe destinations and ambiguous base64 encodings even when signed', () => {
  expect(() => verifyCatalogue(envelope({ ...payload(), trustedKeys: { attacker: publicKey } }), context)).toThrow('CATALOGUE_INVALID');
  const unsafe = payload(); unsafe.artifacts[0]!.url = 'https://user:secret@example.com/archive';
  expect(() => verifyCatalogue(envelope(unsafe), context)).toThrow('CATALOGUE_INVALID');
  const good = envelope(payload()); expect(() => verifyCatalogue({ ...good, payload: good.payload + '\n' }, context)).toThrow('CATALOGUE_INVALID');
});
test('refuses reserved Windows executable basenames with whitespace before an extension', () => {
  const reserved = payload(); reserved.runtimes[0]!.executable = 'NUL .exe';
  expect(() => verifyCatalogue(envelope(reserved), context)).toThrow('CATALOGUE_INVALID');
});
