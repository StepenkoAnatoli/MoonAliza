import { z } from 'zod';
import { IdSchema, ResearchCollectorSchema, type MethodInput, type ResearchCollector } from '../shared';
import { canonicalHash } from '../engine/policy';
import { atomicJson, boundedJson, serialized } from '../models/artifact-files';
import type { Vault } from './vault';

const { repository, workflow, ref } = ResearchCollectorSchema.shape;
const SecretRef = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
const FileSchema = z.object({
  version: z.literal(1), revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER), repository, workflow, ref,
  secretRef: SecretRef.nullable(), retiredSecretRef: SecretRef.nullable(),
  lastRequest: z.object({ clientRequestId: IdSchema, inputHash: z.string().regex(/^[0-9a-f]{64}$/) }).strict().nullable(), updatedAt: z.string().max(64),
}).strict();
type CollectorFile = z.infer<typeof FileSchema>;
export interface CollectorConfig { revision: number; repository: string; workflow: string; ref: string; secretRef: string | null }
export interface CollectorSettingsHooks { busy(): boolean; credentialsChanged(): void; configChanged(): void }

/**
 * The collector target and its token reference, owned by main and kept outside the engine database. The token itself
 * lives only in the vault; this file holds an opaque reference. Saves are compare-and-set and replay by request id,
 * and the replay hash never covers the token.
 */
export class CollectorSettings {
  private value: CollectorFile | null = null;
  private hooks: CollectorSettingsHooks = { busy: () => false, credentialsChanged: () => {}, configChanged: () => {} };
  constructor(private readonly file: string, private readonly vault: Pick<Vault, 'saveStaged' | 'commit' | 'tombstone' | 'remove' | 'has'>, private readonly now = () => new Date().toISOString()) {}

  attach(hooks: CollectorSettingsHooks): void { this.hooks = hooks; }

  /** A missing or invalid file reads as "not configured". A token retired by an interrupted save is revoked now. */
  async open(): Promise<void> {
    try { this.value = FileSchema.parse(await boundedJson(this.file, 64 * 1024)); } catch { this.value = null; }
    if (this.value?.retiredSecretRef) await this.vault.tombstone(this.value.retiredSecretRef);
  }
  /** The vault references this file keeps alive, for the startup reconcile. */
  references(): string[] { return this.value?.secretRef ? [this.value.secretRef] : []; }
  /** After the reconcile has removed a retired token, the file stops naming it. */
  async finishStartup(): Promise<void> {
    await serialized(this.file, async () => {
      if (!this.value?.retiredSecretRef) return;
      const next = { ...this.value, retiredSecretRef: null }; await atomicJson(this.file, next); this.value = next;
    });
  }
  current(): CollectorConfig | null {
    if (!this.value) return null;
    const { revision, repository, workflow, ref, secretRef } = this.value;
    return { revision, repository, workflow, ref, secretRef };
  }
  async read(): Promise<{ collector: ResearchCollector | null }> { return { collector: this.value ? await this.publicValue(this.value) : null }; }

  save(params: MethodInput<'research.collector.save'>, clientRequestId: string): Promise<{ collector: ResearchCollector }> {
    return serialized(this.file, async () => {
      const inputHash = canonicalHash({ repository: params.repository, workflow: params.workflow, ref: params.ref, expectedRevision: params.expectedRevision ?? null, clearToken: params.clearToken ?? false, tokenSupplied: params.token !== undefined });
      const current = this.value;
      if (current?.lastRequest?.clientRequestId === clientRequestId) {
        if (current.lastRequest.inputHash !== inputHash) throw new Error('REQUEST_CONFLICT');
        return { collector: await this.publicValue(current) };
      }
      if ((current?.revision ?? 0) !== (params.expectedRevision ?? 0)) throw new Error('REQUEST_CONFLICT');
      if (current?.secretRef && current.repository !== params.repository && params.token === undefined && !params.clearToken) throw new Error('COLLECTOR_TOKEN_REQUIRED');
      const retargeted = current && (current.repository !== params.repository || current.workflow !== params.workflow || current.ref !== params.ref);
      if (retargeted && this.hooks.busy()) throw new Error('RUN_ACTIVE');
      if (current?.retiredSecretRef) await this.retire(current.retiredSecretRef);
      const staged = params.token === undefined ? null : await this.vault.saveStaged(params.token);
      const secretRef = staged ?? (params.clearToken ? null : current?.secretRef ?? null);
      const retired = current?.secretRef && current.secretRef !== secretRef ? current.secretRef : null;
      const next: CollectorFile = { version: 1, revision: (current?.revision ?? 0) + 1, repository: params.repository, workflow: params.workflow, ref: params.ref, secretRef, retiredSecretRef: retired, lastRequest: { clientRequestId, inputHash }, updatedAt: this.now() };
      try { await atomicJson(this.file, next); }
      catch (error) { if (staged) await this.vault.tombstone(staged).then(() => this.vault.remove(staged)).catch(() => {}); throw error; }
      this.value = next;
      if (staged) await this.vault.commit(staged);
      if (retired) {
        // Watches holding the old token stop first; tombstone then revokes any grant still outstanding.
        this.hooks.credentialsChanged();
        await this.retire(retired);
        const settled = { ...next, retiredSecretRef: null }; await atomicJson(this.file, settled); this.value = settled;
      }
      this.hooks.configChanged();
      return { collector: await this.publicValue(this.value) };
    });
  }

  private async retire(ref: string) {
    await this.vault.tombstone(ref);
    // An entry the startup reconcile already deleted has nothing left to remove.
    await this.vault.remove(ref).catch((error: Error) => { if (error.message !== 'CREDENTIAL_NOT_TOMBSTONED') throw error; });
  }
  private async publicValue(value: CollectorFile): Promise<ResearchCollector> {
    return ResearchCollectorSchema.parse({ revision: value.revision, repository: value.repository, workflow: value.workflow, ref: value.ref, tokenConfigured: value.secretRef !== null && await this.vault.has(value.secretRef) });
  }
}
