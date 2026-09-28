import { expect, test } from 'vitest';
import { assertToolPolicy, assertInferencePolicy, approvalMatches, canonicalHash } from '../src/engine/policy';

const project = { id: 'p1', trusted: true, trustRevision: 2,
  policy: { revision: 3, inference: 'local-only' as const, research: 'off' as const } };

test.each(['ask', 'plan', 'research'] as const)('%s cannot execute mutations or commands', mode => {
  expect(() => assertToolPolicy(mode, 'write', project)).toThrow('MODE_RESTRICTED');
  expect(() => assertToolPolicy(mode, 'command', project)).toThrow('MODE_RESTRICTED');
});

test('research needs a separate project permission even in Build mode', () => {
  expect(() => assertToolPolicy('build', 'research', project)).toThrow('RESEARCH_DISABLED');
  expect(() => assertToolPolicy('build', 'research', { ...project, policy: { ...project.policy, research: 'public-technical' } })).not.toThrow();
});

test('revoked trust prevents reads as well as writes', () => {
  expect(() => assertToolPolicy('ask', 'read', { ...project, trusted: false })).toThrow('PROJECT_UNTRUSTED');
});

test('local-only refuses an external provider and permits a verified local provider', () => {
  expect(() => assertInferencePolicy(project, 'external')).toThrow('CLOUD_NOT_ALLOWED');
  expect(() => assertInferencePolicy(project, 'local')).not.toThrow();
});

test('a stopped run admits no new read or inference request', () => {
  const stop = new AbortController();
  stop.abort();
  expect(() => assertToolPolicy('build', 'read', project, stop.signal)).toThrow('RUN_CANCELLED');
  expect(() => assertInferencePolicy(project, 'local', stop.signal)).toThrow('RUN_CANCELLED');
});

test('approval binds proposed content, project, trust and policy revision', () => {
  const operation = { id: 'op-1', projectId: 'p1', inputHash: 'hash-a', policyRevision: 3, trustRevision: 2 };
  const approval = { operationId: 'op-1', projectId: 'p1', inputHash: 'hash-a', policyRevision: 3, trustRevision: 2, decision: 'allow' as const };
  expect(approvalMatches(operation, approval, project)).toBe(true);
  expect(approvalMatches({ ...operation, inputHash: 'hash-b' }, approval, project)).toBe(false);
  expect(approvalMatches(operation, approval, { ...project, trustRevision: 4 })).toBe(false);
  expect(approvalMatches(operation, { ...approval, projectId: 'p2' }, project)).toBe(false);
  expect(approvalMatches(operation, { ...approval, decision: 'deny' }, project)).toBe(false);
});

test('canonical identities ignore object key order but retain content and array order', () => {
  expect(canonicalHash({ b: 2, a: 1 })).toBe(canonicalHash({ a: 1, b: 2 }));
  expect(canonicalHash({ a: 'one' })).not.toBe(canonicalHash({ a: 'two' }));
  expect(canonicalHash([1, 2])).not.toBe(canonicalHash([2, 1]));
  expect(() => canonicalHash({ notValid: undefined })).toThrow('INVALID_CANONICAL_INPUT');
});
