import { createHash } from 'node:crypto';

export interface PolicyProject {
  id: string;
  trusted: boolean;
  trustRevision: number;
  policy: { revision: number; inference: 'local-only' | 'cloud-allowed'; research: 'off' | 'public-technical' | 'private-connected' };
}
export type ToolKind = 'read' | 'write' | 'command' | 'research';
export type RunMode = 'ask' | 'plan' | 'build' | 'research' | 'mission';

function assertActive(project: PolicyProject, signal?: AbortSignal) {
  if (signal?.aborted) throw new Error('RUN_CANCELLED');
  if (!project.trusted) throw new Error('PROJECT_UNTRUSTED');
}

export function assertToolPolicy(mode: RunMode, kind: ToolKind, project: PolicyProject, signal?: AbortSignal): void {
  assertActive(project, signal);
  if ((kind === 'write' || kind === 'command') && mode !== 'build' && mode !== 'mission') throw new Error('MODE_RESTRICTED');
  if (kind === 'research' && project.policy.research === 'off') throw new Error('RESEARCH_DISABLED');
}

export function assertInferencePolicy(project: PolicyProject, locality: 'local' | 'external', signal?: AbortSignal): void {
  assertActive(project, signal);
  if (locality === 'external' && project.policy.inference !== 'cloud-allowed') throw new Error('CLOUD_NOT_ALLOWED');
}

interface OperationIdentity { id: string; projectId: string; inputHash: string; policyRevision: number; trustRevision: number }
interface ApprovalIdentity { operationId: string; projectId: string; inputHash: string; policyRevision: number; trustRevision: number; decision: 'allow' | 'deny' | 'pending' }
export function approvalMatches(operation: OperationIdentity, approval: ApprovalIdentity, project: PolicyProject): boolean {
  return project.trusted && approval.decision === 'allow'
    && operation.id === approval.operationId && operation.projectId === project.id && approval.projectId === project.id
    && operation.inputHash === approval.inputHash
    && operation.policyRevision === approval.policyRevision && operation.policyRevision === project.policy.revision
    && operation.trustRevision === approval.trustRevision && operation.trustRevision === project.trustRevision;
}

/** Hash only JSON data; reject lossy coercions and cycles instead of deduplicating different inputs. */
export function canonicalHash(value: unknown): string {
  const ancestors = new Set<object>();
  function serialize(item: unknown): string {
    if (item === null) return 'null';
    if (typeof item === 'string' || typeof item === 'boolean') return JSON.stringify(item);
    if (typeof item === 'number' && Number.isFinite(item)) return JSON.stringify(item);
    if (typeof item !== 'object' || ancestors.has(item)) throw new Error('INVALID_CANONICAL_INPUT');
    if (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) throw new Error('INVALID_CANONICAL_INPUT');
    ancestors.add(item);
    let result: string;
    if (Array.isArray(item)) {
      if (Object.keys(item).length !== item.length) throw new Error('INVALID_CANONICAL_INPUT');
      result = `[${item.map(serialize).join(',')}]`;
    } else {
      const record = item as Record<string, unknown>;
      result = `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${serialize(record[key])}`).join(',')}}`;
    }
    ancestors.delete(item);
    return result;
  }
  return createHash('sha256').update(serialize(value)).digest('hex');
}
