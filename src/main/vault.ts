import { randomUUID } from 'node:crypto';
import { access, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export interface SecretCryptor {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}

export interface CredentialBinding {
  epoch: string;
  purpose: 'inference' | 'provider-test' | 'research' | 'provision';
  contextId: string;
  secretRef: string;
  profileRevisionId?: string;
}

interface Grant extends CredentialBinding { expiresAt: number }
interface VaultEntry { state: 'staged' | 'committed' | 'tombstoned'; createdAt: number }
interface VaultIndex { version: 1; entries: Record<string, VaultEntry> }
const opaqueReference = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Main-process only. Consumers receive a capability, never a credential retrieval API. */
export class Vault {
  private index: VaultIndex = { version: 1, entries: {} };
  private epoch = '';
  private readonly grants = new Map<string, Grant>();
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly directory: string, private readonly cryptor: SecretCryptor) {}

  async initialize(epoch: string): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    try {
      const bytes = await readFile(join(this.directory, 'index.json'));
      if (bytes.byteLength > 2 * 1024 * 1024) throw new Error('VAULT_CORRUPT');
      const parsed: unknown = JSON.parse(bytes.toString('utf8'));
      if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== 1 ||
        !('entries' in parsed) || !parsed.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) {
        throw new Error('VAULT_CORRUPT');
      }
      for (const [ref, entry] of Object.entries(parsed.entries)) {
        if (!opaqueReference.test(ref) || !entry || typeof entry !== 'object' ||
          !('state' in entry) || !['staged', 'committed', 'tombstoned'].includes(String(entry.state)) ||
          !('createdAt' in entry) || !Number.isFinite(entry.createdAt)) throw new Error('VAULT_CORRUPT');
      }
      this.index = parsed as VaultIndex;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    this.setEpoch(epoch);
  }

  setEpoch(epoch: string): void {
    this.epoch = epoch;
    this.grants.clear();
  }

  private serial<T>(action: () => Promise<T>): Promise<T> {
    const result = this.queue.then(action);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private secretPath(ref: string): string {
    if (!opaqueReference.test(ref)) throw new Error('INVALID_SECRET_REFERENCE');
    return join(this.directory, `${ref}.bin`);
  }

  private async persist(): Promise<void> {
    const temporary = join(this.directory, `${randomUUID()}.index.tmp`);
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(JSON.stringify(this.index), 'utf8');
      await handle.sync();
    } finally { await handle.close(); }
    await rename(temporary, join(this.directory, 'index.json'));
  }

  saveStaged(secret: string): Promise<string> {
    return this.serial(async () => {
      if (!this.cryptor.isEncryptionAvailable()) throw new Error('ENCRYPTION_UNAVAILABLE');
      if (!secret || Buffer.byteLength(secret, 'utf8') > 32_768) throw new Error('INVALID_SECRET');
      const ref = randomUUID();
      const encrypted = this.cryptor.encryptString(secret);
      const file = await open(this.secretPath(ref), 'wx', 0o600);
      try { await file.writeFile(encrypted); await file.sync(); }
      finally { await file.close(); }
      this.index.entries[ref] = { state: 'staged', createdAt: Date.now() };
      await this.persist();
      return ref;
    });
  }

  commit(ref: string): Promise<void> {
    return this.serial(async () => {
      const entry = this.index.entries[ref];
      if (!entry || entry.state === 'tombstoned') throw new Error('CREDENTIAL_UNAVAILABLE');
      await access(this.secretPath(ref));
      entry.state = 'committed';
      await this.persist();
    });
  }

  reconcile(committedReferences: ReadonlySet<string>): Promise<void> {
    return this.serial(async () => {
      for (const [ref, entry] of Object.entries(this.index.entries)) {
        if (entry.state === 'staged' && committedReferences.has(ref)) {
          await access(this.secretPath(ref));
          entry.state = 'committed';
        } else if (entry.state === 'tombstoned' || (entry.state === 'staged' && !committedReferences.has(ref))) {
          await unlink(this.secretPath(ref)).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== 'ENOENT') throw error;
          });
          delete this.index.entries[ref];
        }
      }
      await this.persist();
    });
  }

  async has(ref: string): Promise<boolean> {
    if (this.index.entries[ref]?.state !== 'committed') return false;
    try { await access(this.secretPath(ref)); return true; }
    catch { return false; }
  }

  grant(binding: Grant): string {
    if (binding.epoch !== this.epoch || !binding.contextId ||
      !Number.isFinite(binding.expiresAt) || binding.expiresAt <= Date.now() ||
      this.index.entries[binding.secretRef]?.state !== 'committed') {
      throw new Error('CREDENTIAL_CAPABILITY_DENIED');
    }
    if ((binding.purpose === 'provider-test' || binding.purpose === 'research') && binding.expiresAt > Date.now() + 30_000) {
      throw new Error('CREDENTIAL_CAPABILITY_DENIED');
    }
    const id = randomUUID();
    this.grants.set(id, { ...binding });
    return id;
  }

  revokeContext(contextId: string): void {
    for (const [id, grant] of this.grants) if (grant.contextId === contextId) this.grants.delete(id);
  }

  private authorized(capability: string, binding: CredentialBinding): boolean {
    const grant = this.grants.get(capability);
    return !!grant && grant.epoch === this.epoch && grant.expiresAt > Date.now() &&
      grant.epoch === binding.epoch && grant.purpose === binding.purpose &&
      grant.contextId === binding.contextId && grant.secretRef === binding.secretRef &&
      grant.profileRevisionId === binding.profileRevisionId &&
      this.index.entries[grant.secretRef]?.state === 'committed';
  }

  async withSecret<T>(capability: string, binding: CredentialBinding, operation: (secret: string) => T | Promise<T>): Promise<T> {
    if (!this.authorized(capability, binding)) throw new Error('CREDENTIAL_CAPABILITY_DENIED');
    const encrypted = await readFile(this.secretPath(binding.secretRef));
    if (!this.authorized(capability, binding)) throw new Error('CREDENTIAL_CAPABILITY_DENIED');
    if (!this.cryptor.isEncryptionAvailable()) throw new Error('ENCRYPTION_UNAVAILABLE');
    return operation(this.cryptor.decryptString(encrypted));
  }

  tombstone(ref: string): Promise<void> {
    // Invalidate access synchronously, before waiting for disk serialization.
    const entry = this.index.entries[ref];
    if (entry) entry.state = 'tombstoned';
    for (const [id, grant] of this.grants) if (grant.secretRef === ref) this.grants.delete(id);
    return this.serial(() => this.persist());
  }

  remove(ref: string): Promise<void> {
    return this.serial(async () => {
      if (this.index.entries[ref]?.state !== 'tombstoned') throw new Error('CREDENTIAL_NOT_TOMBSTONED');
      await unlink(this.secretPath(ref)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      });
      delete this.index.entries[ref];
      await this.persist();
    });
  }

  async redact(text: string): Promise<string> {
    const values: string[] = [];
    for (const [ref, entry] of Object.entries(this.index.entries)) {
      if (entry.state === 'tombstoned') continue;
      try { values.push(this.cryptor.decryptString(await readFile(this.secretPath(ref)))); }
      catch { throw new Error('REDACTION_UNAVAILABLE'); }
    }
    let result = text;
    for (const value of values.filter(Boolean).sort((a, b) => b.length - a.length)) {
      result = result.split(value).join('[redacted]');
    }
    return result;
  }
}
