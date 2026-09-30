import { expect, test } from 'vitest';
import { assembleContext, estimateInput, type ContextMessage } from '../src/engine/context';

const system = { role: 'system' as const, content: 'Respect approvals.' };
test('dense Unicode counts encoded bytes rather than UTF-16 character length', () => {
  expect(estimateInput([{ role: 'user', content: '漢'.repeat(1000) }], [])).toBeGreaterThan(estimateInput([{ role: 'user', content: 'a'.repeat(1000) }], []) + 900);
});
test('history eviction removes a complete turn and never changes stored inputs', () => {
  const history = [[{ role: 'user' as const, content: 'old'.repeat(2500) }, { role: 'assistant' as const, content: 'old answer' }], [{ role: 'user' as const, content: 'recent' }, { role: 'assistant' as const, content: 'recent answer' }]];
  const before = structuredClone(history);
  const result = assembleContext({ system, history, current: [{ role: 'user', content: 'new' }], tools: [], contextTokens: 2048, outputTokens: 512 });
  expect(result.fits).toBe(true); expect(result.state.omittedHistoryMessages).toBe(2);
  expect(result.messages.map(m => m.content)).toEqual(['Respect approvals.', 'recent', 'recent answer', 'new']);
  expect(history).toEqual(before);
});
test('current call/result pairs, command failure facts and result identity survive compaction', () => {
  const current: ContextMessage[] = [{ role: 'user', content: 'check it' }, { role: 'assistant', content: '', toolCalls: [{ id: 'c1', name: 'run_command', input: { program: 'node' } }] }, { role: 'tool', toolCallId: 'c1', toolName: 'run_command', resultId: 'durable-result', content: JSON.stringify({ status: 'exited', code: 7, output: '漢'.repeat(4000), truncated: false, cancelled: false, timedOut: false }) }];
  const original = structuredClone(current);
  const result = assembleContext({ system, history: [], current, tools: [], contextTokens: 1536, outputTokens: 512 });
  expect(result.fits).toBe(true); expect(result.messages).toHaveLength(4);
  expect(result.messages[2]?.toolCalls?.[0]?.id).toBe(result.messages[3]?.toolCallId);
  expect(JSON.parse(result.messages[3]!.content)).toMatchObject({ resultId: 'durable-result', facts: { status: 'exited', code: 7, cancelled: false }, preview: '' });
  expect(current).toEqual(original); expect(result.messages.some(message => 'resultId' in message)).toBe(false);
});
test('an irreducible prompt is rejected and output reserve and declarations count toward the budget', () => {
  const result = assembleContext({ system, history: [], current: [{ role: 'user', content: 'x'.repeat(4000) }], tools: [{ name: 'tool', description: 'x'.repeat(3000), parameters: {} }], contextTokens: 4096, outputTokens: 2048 });
  expect(result.state.inputBudgetTokens).toBe(2048); expect(result.fits).toBe(false);
  expect(result.messages.at(-1)?.content).toHaveLength(4000);
});
