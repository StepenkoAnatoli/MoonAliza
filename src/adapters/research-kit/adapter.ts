import { createHash, randomUUID } from 'node:crypto';
import { lstat, open, writeFile, readdir, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import { privateDirectory, serialized, missing } from '../../models/artifact-files';
import { spawnOwned, type OwnedResult } from '../../tools/commands';
import { BindingSchema, DigestSchema, FailureSchema, ManifestProjection, ReceiptSchema, ReportSchema, ResultSchema, StateSchema, type Binding, type Receipt, type Report, type Result } from './contracts';
import { inspectArchive, MAX_ARCHIVE } from './archive';
import inventory from './runtime-inventory.json';

export const VALIDATOR_REVISION = inventory.revision;
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const MAX_OUTPUT = 256 * 1024;
const ConfigSchema = z.object({ kitRoot: z.string(), nodePath: z.string(), nodeSha256: DigestSchema, storageRoot: z.string(), helperPath: z.string() }).strict();
export type ResearchConfig = z.infer<typeof ConfigSchema>;

/** These are trusted main-process installation inputs, never IPC request fields. */
export function validatorEnvironment(directory: string, source: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const system = Object.entries(source).find(([key]) => key.toLowerCase() === 'systemroot')?.[1];
  return { ...(system ? { SystemRoot: system } : {}), TEMP: directory, TMP: directory, TMPDIR: directory, HOME: directory, USERPROFILE: directory };
}
export function parseValidatorReport(run: OwnedResult): Report {
  if (run.timedOut) throw new Error('TIMEOUT');
  if (run.truncated || Buffer.byteLength(run.output) > MAX_OUTPUT) throw new Error('OUTPUT_LIMIT');
  if (run.cancelled) throw new Error('CANCELLED');
  if (run.status !== 'exited') throw new Error('VALIDATOR_OUTPUT');
  try {
    const report = ReportSchema.parse(JSON.parse(run.output));
    if (run.code !== { PASS: 0, FAIL: 1, INCOMPLETE: 2, BLOCKED: 3 }[report.status] || (report.status === 'PASS' && report.errors.length > 0) || (report.status !== 'PASS' && report.buildAuthorized)) throw new Error();
    return report;
  } catch { throw new Error('VALIDATOR_OUTPUT'); }
}
async function capturedFile(file: string, maximum: number): Promise<Buffer> {
  const info = await lstat(file); if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) throw new Error('ARTIFACT_INVALID');
  const handle = await open(file, 'r');
  try {
    const actual = await handle.stat(); if (!actual.isFile() || actual.nlink !== 1) throw new Error('ARTIFACT_INVALID');
    if (actual.size > maximum) throw new Error('INPUT_LIMIT');
    const bytes = Buffer.alloc(actual.size + 1); let offset = 0;
    while (offset < bytes.length) { const result = await handle.read(bytes, offset, bytes.length - offset, offset); if (!result.bytesRead) break; offset += result.bytesRead; }
    if (offset !== actual.size) throw new Error('ARTIFACT_INVALID');
    return bytes.subarray(0, offset);
  } finally { await handle.close(); }
}
async function removeOwned(root: string, target: string) {
  const inside = relative(resolve(root), resolve(target));
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('ARTIFACT_INVALID');
  await rm(target, { recursive: true, force: true });
}
const checkAbort = (signal?: AbortSignal) => { if (signal?.aborted) throw new Error('CANCELLED'); };

export class ResearchKit {
  private readonly config: ResearchConfig;
  private runtime: string | undefined;
  private readonly receipts = new Map<string, Receipt>();
  constructor(config: ResearchConfig) {
    this.config = ConfigSchema.parse(config);
    for (const path of [config.kitRoot, config.nodePath, config.storageRoot, config.helperPath]) if (!isAbsolute(path) || path.includes('\0')) throw new Error('INSTALLATION_INVALID');
  }
  private async prepare(signal?: AbortSignal) {
    if (this.runtime) return this.runtime;
    const root = await privateDirectory(this.config.storageRoot);
    const destination = await privateDirectory(join(root, 'runtime', randomUUID()));
    try {
      for (const file of inventory.files) {
        checkAbort(signal);
        const bytes = await capturedFile(join(this.config.kitRoot, file.path), file.size);
        if (bytes.length !== file.size || hash(bytes) !== file.sha256) throw new Error('INSTALLATION_INVALID');
        const target = join(destination, file.path); await privateDirectory(dirname(target)); await writeFile(target, bytes, { flag: 'wx' });
      }
      this.runtime = destination; return destination;
    } catch (error) {
      await removeOwned(root, destination); checkAbort(signal);
      if ((error as Error)?.message === 'CANCELLED') throw error;
      throw new Error('INSTALLATION_INVALID', { cause: error });
    }
  }
  private async inspectOwned(bytes: Buffer, clientRef: string, signal?: AbortSignal): Promise<Report> {
    checkAbort(signal); if (bytes.length > MAX_ARCHIVE) throw new Error('INPUT_LIMIT');
    BindingSchema.shape.clientRef.parse(clientRef);
    const runtime = await this.prepare(signal);
    const work = await privateDirectory(join(this.config.storageRoot, 'work', randomUUID()));
    try {
      const artifact = join(work, 'artifact.zip'); await writeFile(artifact, bytes, { flag: 'wx' });
      const temporary = await privateDirectory(join(work, 'temp'));
      const files = inventory.files.map(file => join(runtime, file.path));
      const expected = hash(bytes); const node = this.config.nodePath;
      const result = await spawnOwned({ executable: node, args: ['--max-old-space-size=256', join(runtime, 'bin/artifact.mjs'), 'validate', '--file', artifact, '--expect-client-ref', clientRef, '--json'], cwd: work, env: validatorEnvironment(temporary), timeoutMs: 60000, maxOutputBytes: MAX_OUTPUT }, signal, {
        helperPath: this.config.helperPath, readLocks: [node, artifact, ...files], stopOnOutputLimit: true,
        beforeStart: async () => {
          checkAbort(signal);
          if (hash(await capturedFile(node, 256 * 1024 ** 2)) !== this.config.nodeSha256) throw new Error('INSTALLATION_INVALID');
          for (let index = 0; index < files.length; index++) {
            checkAbort(signal); const file = inventory.files[index]!;
            if (hash(await capturedFile(files[index]!, file.size)) !== file.sha256) throw new Error('INSTALLATION_INVALID');
          }
          if (hash(await capturedFile(artifact, MAX_ARCHIVE)) !== expected) throw new Error('ARTIFACT_INVALID');
        },
      });
      checkAbort(signal); return parseValidatorReport(result);
    } finally { await removeOwned(this.config.storageRoot, work); }
  }
  /** Internal diagnostic boundary: raw external findings never cross renderer IPC. */
  inspect(bytes: Buffer, clientRef: string, signal?: AbortSignal) {
    // Copy on entry: the caller cannot change a shared Buffer while validation awaits I/O.
    if (bytes.length > MAX_ARCHIVE) return Promise.reject(new Error('INPUT_LIMIT'));
    const captured = Buffer.from(bytes);
    return serialized(this.config.storageRoot, () => this.inspectOwned(captured, clientRef, signal));
  }
  validate(file: string, input: Binding, signal?: AbortSignal): Promise<Result> {
    const binding = BindingSchema.parse(input);
    return serialized(this.config.storageRoot, async () => {
      try {
        checkAbort(signal); const bytes = await capturedFile(file, MAX_ARCHIVE);
        const manifestValue = await inspectArchive(bytes);
        const report = await this.inspectOwned(bytes, binding.clientRef, signal);
        if (report.status !== 'PASS') return ResultSchema.parse({ status: report.status, state: null, researchReady: false, receipt: null, error: 'ARTIFACT_INVALID' });
        const manifest = ManifestProjection.parse(manifestValue);
        for (const key of ['repository', 'ref', 'commit', 'workflow', 'workflowRunId', 'runAttempt'] as const) if (manifest.source[key] !== binding[key]) throw new Error('IDENTITY_MISMATCH');
        if (manifest.clientRef !== binding.clientRef || report.clientRef !== binding.clientRef || report.workflowRunId !== binding.workflowRunId || report.packageId !== manifest.packageId) throw new Error('IDENTITY_MISMATCH');
        const state = StateSchema.parse(manifest.state === 'HUMAN_REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : manifest.state);
        if (report.state !== state || report.buildAuthorized !== manifest.buildAuthorized || report.reviewedBy !== (manifest.review.by ?? 'undeclared')) throw new Error('ARTIFACT_INVALID');
        const researchReady = state === 'APPROVED_BRIEF' && manifest.kind === 'APPROVED_RESEARCH' && manifest.buildAuthorized && manifest.review.mapClassified && manifest.review.findingsReviewed && manifest.review.briefReviewed && manifest.gate.verdict === 'PASS' && manifest.gate.buildAuthorized && manifest.gate.blockingFindings.length === 0;
        if (manifest.buildAuthorized !== researchReady) throw new Error('ARTIFACT_INVALID');
        checkAbort(signal);
        const artifactSha256 = hash(bytes); const store = await privateDirectory(join(this.config.storageRoot, 'artifacts'));
        const destination = join(store, artifactSha256 + '.zip');
        try { if (hash(await capturedFile(destination, MAX_ARCHIVE)) !== artifactSha256) throw new Error('STALE_VERIFICATION'); }
        catch (error) {
          if (!missing(error)) throw error;
          let total = 0;
          for (const name of await readdir(store)) { const info = await lstat(join(store, name)); if (!info.isFile() || info.isSymbolicLink()) throw new Error('ARTIFACT_INVALID', { cause: error }); total += info.size; }
          if (total + bytes.length > 128 * 1024 ** 2) throw new Error('STORAGE_LIMIT', { cause: error });
          await writeFile(destination, bytes, { flag: 'wx' });
        }
        checkAbort(signal);
        const receipt = ReceiptSchema.parse({ id: randomUUID(), artifactSha256, artifactBytes: bytes.length, validatorRevision: VALIDATOR_REVISION, nodeSha256: this.config.nodeSha256, binding, state, researchReady });
        this.receipts.set(receipt.id, structuredClone(receipt));
        return ResultSchema.parse({ status: 'PASS', state, researchReady, receipt, error: null });
      } catch (error) {
        const failure = FailureSchema.safeParse((error as Error)?.message);
        return ResultSchema.parse({ status: 'BLOCKED', state: null, researchReady: false, receipt: null, error: signal?.aborted ? 'CANCELLED' : failure.success ? failure.data : 'ARTIFACT_INVALID' });
      }
    });
  }
  readVerified(id: string, current: Binding): Promise<Buffer> {
    const binding = BindingSchema.parse(current);
    return serialized(this.config.storageRoot, async () => {
      const receipt = this.receipts.get(id);
      if (!receipt || JSON.stringify(receipt.binding) !== JSON.stringify(binding)) throw new Error('STALE_VERIFICATION');
      try {
        const bytes = await capturedFile(join(this.config.storageRoot, 'artifacts', receipt.artifactSha256 + '.zip'), MAX_ARCHIVE);
        if (bytes.length !== receipt.artifactBytes || hash(bytes) !== receipt.artifactSha256) throw new Error('STALE_VERIFICATION');
        return bytes;
      } catch { this.receipts.delete(id); throw new Error('STALE_VERIFICATION'); }
    });
  }
  close(): Promise<void> {
    return serialized(this.config.storageRoot, async () => { this.receipts.clear(); if (this.runtime) { await removeOwned(this.config.storageRoot, this.runtime); this.runtime = undefined; } });
  }
}
