import { createHash, createPublicKey, verify } from 'node:crypto';
import { z } from 'zod';
import { ArtifactSpecSchema } from './download';
import { safeArtifactPath } from './artifact-files';
const Id = z.string().min(1).max(128).regex(/^[a-z0-9][a-z0-9_-]*$/);
const Version = z.string().regex(/^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/);
const Base64 = z.string().min(4).max(2 * 1024 ** 2).refine(value => Buffer.from(value, 'base64').toString('base64') === value);
const EnvelopeSchema = z.object({ schemaVersion: z.literal(1), keyId: Id, algorithm: z.literal('Ed25519'), payload: Base64, signature: Base64.refine(value => Buffer.from(value, 'base64').length === 64) }).strict();
export type SignedCatalogue = z.infer<typeof EnvelopeSchema>;
const Artifact = ArtifactSpecSchema.extend({ id: Id, role: z.enum(['runtime', 'runtime-manifest', 'model-manifest', 'model-blob', 'lab-receipt', 'evidence']) });
const PayloadSchema = z.object({
  schemaVersion: z.literal(1), id: Id, sequence: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  app: z.object({ min: Version, maxExclusive: Version }).strict(), issuedAt: z.iso.datetime(), expiresAt: z.iso.datetime(),
  artifacts: z.array(Artifact).min(1).max(4096),
  runtimes: z.array(z.object({ id: Id, artifactId: Id, manifestId: Id, executable: z.string().refine(safeArtifactPath), backends: z.array(z.enum(['cpu', 'cuda', 'vulkan', 'rocm'])).min(1).max(4), maxExpandedBytes: z.number().int().min(1).max(100 * 1024 ** 3), maxEntries: z.number().int().min(1).max(100000) }).strict()).min(1).max(32),
  configurations: z.array(z.object({ runtimeId: Id, modelManifestId: Id, modelBlobIds: z.array(Id).min(1).max(512), labReceiptId: Id, evidenceId: Id }).strict()).min(1).max(256),
}).strict();
export type Catalogue = z.infer<typeof PayloadSchema>;
export type CatalogueTrust = { trustedKeys: Readonly<Record<string, string>>; appVersion: string; minimumSequence: number; now?: Date };
function compare(a: string, b: string) { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i]! - y[i]!; return 0; }
function freeze<T>(value: T): T { if (value && typeof value === 'object') { for (const nested of Object.values(value)) freeze(nested); Object.freeze(value); } return value; }

/** Verify the signed bytes before interpreting destinations, versions or identities. */
export function verifyCatalogue(input: unknown, options: CatalogueTrust): { payload: Catalogue; digest: string; envelope: SignedCatalogue } {
  const parsed = EnvelopeSchema.safeParse(input); if (!parsed.success) throw new Error('CATALOGUE_INVALID');
  const envelope = parsed.data; const bytes = Buffer.from(envelope.payload, 'base64');
  try {
    const pem = Object.hasOwn(options.trustedKeys, envelope.keyId) ? options.trustedKeys[envelope.keyId] : undefined;
    if (!pem) throw new Error('Untrusted key');
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ed25519' || !verify(null, Buffer.concat([Buffer.from('MoonAliza activation set v1\0'), bytes]), key, Buffer.from(envelope.signature, 'base64'))) throw new Error('Invalid signature');
  } catch (error) { throw new Error('CATALOGUE_SIGNATURE', { cause: error }); }
  let payload: Catalogue;
  try {
    payload = PayloadSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
    const artifacts = new Map(payload.artifacts.map(item => [item.id, item])); const runtimes = new Map(payload.runtimes.map(item => [item.id, item]));
    if (artifacts.size !== payload.artifacts.length || runtimes.size !== payload.runtimes.length) throw new Error('Duplicate identity');
    const role = (id: string, kind: string) => artifacts.get(id)?.role === kind;
    for (const runtime of payload.runtimes) if (!role(runtime.artifactId, 'runtime') || !role(runtime.manifestId, 'runtime-manifest') || new Set(runtime.backends).size !== runtime.backends.length) throw new Error('Invalid runtime');
    for (const config of payload.configurations) if (!runtimes.has(config.runtimeId) || !role(config.modelManifestId, 'model-manifest') || !config.modelBlobIds.every(id => role(id, 'model-blob')) || new Set(config.modelBlobIds).size !== config.modelBlobIds.length || !role(config.labReceiptId, 'lab-receipt') || !role(config.evidenceId, 'evidence')) throw new Error('Incomplete configuration');
  } catch (error) { throw new Error('CATALOGUE_INVALID', { cause: error }); }
  if (!Number.isSafeInteger(options.minimumSequence) || options.minimumSequence < 0 || payload.sequence < options.minimumSequence) throw new Error('CATALOGUE_ROLLBACK');
  const now = (options.now ?? new Date()).getTime();
  if (!Number.isFinite(now) || Date.parse(payload.expiresAt) <= now || Date.parse(payload.issuedAt) > now + 300000 || Date.parse(payload.issuedAt) >= Date.parse(payload.expiresAt)) throw new Error('CATALOGUE_EXPIRED');
  if (!Version.safeParse(options.appVersion).success || compare(payload.app.min, payload.app.maxExclusive) >= 0 || compare(options.appVersion, payload.app.min) < 0 || compare(options.appVersion, payload.app.maxExclusive) >= 0) throw new Error('CATALOGUE_INCOMPATIBLE');
  return freeze({ payload, digest: createHash('sha256').update(bytes).digest('hex'), envelope });
}
