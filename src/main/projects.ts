import { randomUUID } from 'node:crypto';
import { realpath, stat } from 'node:fs/promises';
import { basename } from 'node:path';

interface Selection { rootPath: string; name: string; owner: number; expiresAt: number }

/** Native selections only. Never construct a ticket from a renderer-supplied path. */
export class ProjectTickets {
  private readonly entries = new Map<string, Selection>();
  constructor(private readonly isLocalFixedVolume: (path: string) => Promise<boolean>, private readonly now = Date.now) {}

  async issue(selectedPath: string, owner: number): Promise<{ ticket: string; name: string; pathLabel: string; expiresAt: number }> {
    const rootPath = await realpath(selectedPath);
    if (!(await stat(rootPath)).isDirectory()) throw new Error('PROJECT_DIRECTORY_REQUIRED');
    if (!await this.isLocalFixedVolume(rootPath)) throw new Error('PROJECT_VOLUME_UNSUPPORTED');
    for (const [key, value] of this.entries) if (value.expiresAt <= this.now()) this.entries.delete(key);
    if (this.entries.size >= 64) throw new Error('TOO_MANY_PROJECT_SELECTIONS');
    const ticket = randomUUID();
    const selection = { rootPath, name: basename(rootPath) || rootPath, owner, expiresAt: this.now() + 600_000 };
    this.entries.set(ticket, selection);
    return { ticket, name: selection.name, pathLabel: rootPath, expiresAt: selection.expiresAt };
  }

  consume(ticket: string, owner: number): { rootPath: string; name: string } {
    const selection = this.entries.get(ticket);
    if (!selection || selection.owner !== owner || selection.expiresAt <= this.now()) throw new Error('PROJECT_TICKET_INVALID');
    this.entries.delete(ticket);
    return { rootPath: selection.rootPath, name: selection.name };
  }

  revokeOwner(owner: number): void {
    for (const [key, value] of this.entries) if (value.owner === owner) this.entries.delete(key);
  }
}
