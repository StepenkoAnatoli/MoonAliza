import { expect, test } from 'vitest';
import { assembleContext, continueContext, estimateInput, PREFIX_BOUND_KINDS, WHOLE_REPLAY_FORMATS, type ContextMessage } from '../src/engine/context';
import { PROVIDER_STATE_FORMATS } from '../src/engine/control';
import type { InferenceMessage } from '../src/main/inference';

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

// More models Phase 2, U1 (docs/specification/more-models-phase2.md section 3; REQUIREMENTS-P2 F-17).
test('the estimate counts an anthropic-messages@1 message as its state and other states with their message', () => {
  // Guards (mutations of estimateInput): count every message whole (the anthropic case goes red); project every state
  // whatever its format (the other-format case goes red).
  const formula = (messages: unknown[]) => Math.ceil(Buffer.byteLength(JSON.stringify({ messages, tools: [] }), 'utf8') / 2) + 256 + messages.length * 8;
  const call = { id: 'c1', name: 'read_file', input: { path: 'p'.repeat(3000) } };
  const data = JSON.stringify({ content: [{ type: 'thinking', thinking: '', signature: 's'.repeat(2000) }, { type: 'text', text: 't'.repeat(3000) }, { type: 'tool_use', ...call }] });
  const plain: InferenceMessage = { role: 'assistant', content: 't'.repeat(3000), toolCalls: [call] };
  const whole: InferenceMessage = { ...plain, providerState: { format: PROVIDER_STATE_FORMATS.anthropic, appendOnly: true, data } };
  const other: InferenceMessage = { ...plain, providerState: { format: 'other-dialect@1', appendOnly: true, data } };
  expect([...WHOLE_REPLAY_FORMATS]).toEqual(['anthropic-messages@1']);
  expect(estimateInput([system, whole], [])).toBe(formula([system, { role: 'assistant', providerState: data }]));
  expect(estimateInput([system, other], [])).toBe(formula([system, other]));
  expect(estimateInput([system, plain], [])).toBe(formula([system, plain]));
});

// More models Phase 2, U1: the history reserve and the frozen step (more-models-phase2.md section 3, rules 2 and 4;
// REQUIREMENTS-P2 F-15).
const turn = (n: number, size: number) => [{ role: 'user' as const, content: `u${n}`.padEnd(size, 'u') }, { role: 'assistant' as const, content: `a${n}`.padEnd(size, 'a') }];
const result = (id: string, fill: string): ContextMessage => ({ role: 'tool', toolCallId: id, toolName: 'read_file', resultId: `saved-${id}`, content: JSON.stringify({ path: `${id}.txt`, text: fill.repeat(10_000), truncated: false }) });
const calls = (content: string, ...ids: string[]): ContextMessage => ({ role: 'assistant', content, toolCalls: ids.map(id => ({ id, name: 'read_file', input: { path: `${id}.txt` } })), providerState: { format: PROVIDER_STATE_FORMATS.anthropic, appendOnly: true, data: JSON.stringify({ content: [{ type: 'thinking', thinking: '', signature: `sig-${content}` }] }) } });
const preview = (message: InferenceMessage | undefined) => JSON.parse(message!.content).preview as string;

test('only the anthropic kind is prefix-bound', () => {
  expect([...PREFIX_BOUND_KINDS]).toEqual(['anthropic']);
});

test('the history reserve keeps system, history and current within half the input budget, counting tools and current', () => {
  // Guards (mutations of assembleContext): ignore historyReserve (reserve 0); estimate the reserve without the tools; or
  // without current. Each keeps more history than half the budget allows. Dropping every turn is caught by the
  // minimality check: one more turn would not fit in half.
  const tools = [{ name: 'tool', description: 'd'.repeat(6000), parameters: {} }];
  const history = Array.from({ length: 12 }, (_, n) => turn(n, 2000));
  const current = [{ role: 'user' as const, content: 'read it' }, calls('one', 'c1'), result('c1', 'R')];
  const input = { system, history, current, tools, contextTokens: 30_000, outputTokens: 2_000 };
  const plain = assembleContext(input); const reserved = assembleContext({ ...input, historyReserve: true });
  const half = Math.floor((30_000 - 2_000) / 2);
  expect(plain.fits).toBe(true); expect(reserved.fits).toBe(true);
  expect(plain.state.estimatedInputTokens).toBeGreaterThan(half);
  expect(reserved.state.estimatedInputTokens).toBeLessThanOrEqual(half);
  expect(estimateInput(reserved.messages, tools)).toBe(reserved.state.estimatedInputTokens);
  const kept = history.slice(reserved.state.omittedHistoryMessages / 2);
  expect(reserved.messages.slice(1, 1 + kept.length * 2)).toEqual(kept.flat());
  const oneMore = [system, ...history.slice(reserved.state.omittedHistoryMessages / 2 - 1).flat(), ...reserved.messages.slice(1 + kept.length * 2)];
  expect(estimateInput(oneMore, tools)).toBeGreaterThan(half);
  // Today's loops then run on the full budget: the current result keeps its 3,072-byte excerpt.
  expect(preview(reserved.messages.at(-1))).toHaveLength(3072);
  expect(reserved.state.inputBudgetTokens).toBe(28_000);
});

test('the history reserve keeps at most 500 messages, half the 1000-message cap', () => {
  // Guard (mutation): a reserve cap of 1000 messages; nothing is then dropped.
  const history = Array.from({ length: 300 }, (_, n) => turn(n, 4));
  const input = { system, history, current: [{ role: 'user' as const, content: 'next' }], tools: [], contextTokens: 1_000_000, outputTokens: 1000 };
  expect(assembleContext(input).messages).toHaveLength(602);
  const reserved = assembleContext({ ...input, historyReserve: true });
  expect(reserved.messages).toHaveLength(500); expect(reserved.state.omittedHistoryMessages).toBe(102);
  expect(reserved.messages[1]).toEqual(history[51]![0]);
});

test('a frozen step appends to the previous request, cuts only unsent results oldest first, and never shortens a sent one', () => {
  // Guards (mutations of continueContext): let the cut loop reach the previous request's results (the sent r1 is then
  // cut first); cut newest first (r3 instead of r2); count compactions from the added messages only.
  const prompt = { role: 'user' as const, content: 'read them' };
  const base = assembleContext({ system, history: [turn(0, 2000), turn(1, 10)], current: [prompt, calls('one', 'c1'), result('c1', 'R')], tools: [], contextTokens: 3_000, outputTokens: 0 });
  expect(base.state.omittedHistoryMessages).toBe(2); expect(base.state.compactedToolResults).toBe(1);
  const before = JSON.stringify(base.messages);
  const added = [calls('two', 'c2', 'c3'), result('c2', 'S'), result('c3', 'T')];
  const roomy = continueContext({ previous: base, added, tools: [], contextTokens: 1_000_000, outputTokens: 0 });
  expect(roomy.fits).toBe(true); expect(roomy.messages.slice(-2).map(preview).map(text => text.length)).toEqual([3072, 3072]);
  const budget = 4_800; // over with both new results at 3,072 bytes (5,560 estimated), within it once the older one is cut (4,014)
  expect(roomy.state.estimatedInputTokens).toBeGreaterThan(budget);
  const next = continueContext({ previous: base, added, tools: [], contextTokens: budget + 100, outputTokens: 100 });
  expect(next.fits).toBe(true);
  expect(next.messages.slice(0, base.messages.length).map(message => JSON.stringify(message))).toEqual(base.messages.map(message => JSON.stringify(message)));
  expect(JSON.stringify(base.messages)).toBe(before);
  expect(next.messages).toHaveLength(base.messages.length + 3);
  expect(next.messages[base.messages.length]).toEqual(added[0]);
  expect(preview(next.messages.at(-2))).toBe(''); expect(preview(next.messages.at(-1))).toHaveLength(3072);
  expect(preview(next.messages[base.messages.length - 1])).toHaveLength(3072);
  expect(next.messages.some(message => 'resultId' in message)).toBe(false);
  expect(next.state).toEqual({ estimator: 'utf8-estimate', estimatedInputTokens: estimateInput(next.messages, []), inputBudgetTokens: budget, contextTokens: budget + 100, reservedOutputTokens: 100, omittedHistoryMessages: 2, compactedToolResults: 3 });
  expect(next.state.estimatedInputTokens).toBeLessThanOrEqual(budget);
});

test('a frozen step that cannot fit by cutting its own results, or that exceeds 1000 messages, does not fit', () => {
  // Guard (mutation): continueContext returns fits true without the check; or omits the message cap.
  const prompt = { role: 'user' as const, content: 'read them' };
  const base = assembleContext({ system, history: [], current: [prompt, calls('one', 'c1'), result('c1', 'R')], tools: [], contextTokens: 1_000_000, outputTokens: 0 });
  const added = [calls('two', 'c2'), result('c2', 'S')];
  const tight = continueContext({ previous: base, added, tools: [], contextTokens: base.state.estimatedInputTokens + 100, outputTokens: 0 });
  expect(tight.fits).toBe(false); expect(preview(tight.messages.at(-1))).toBe('');
  expect(tight.messages.slice(0, base.messages.length)).toEqual(base.messages);
  const long = { messages: [system, ...Array.from({ length: 998 }, (_, n) => ({ role: n % 2 ? 'assistant' as const : 'user' as const, content: 'x' }))], state: base.state };
  expect(continueContext({ previous: long, added: [{ role: 'user', content: 'y' }], tools: [], contextTokens: 1_000_000, outputTokens: 0 }).fits).toBe(true);
  expect(continueContext({ previous: long, added: [{ role: 'user', content: 'y' }, { role: 'assistant', content: 'z' }], tools: [], contextTokens: 1_000_000, outputTokens: 0 }).fits).toBe(false);
});
