import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import type { Completion } from '../src/main/inference';
import type { ToolCall } from '../src/shared';
import { providerStateLeaves, screenCompletion } from '../src/main/provider-screen';
import { Vault } from '../src/main/vault';

// The state screen in main (docs/specification/more-models-phase2.md section 6; S-1, F-23; unit U4). infer() hands every
// completion to screenCompletion with the vault's own redact, so these tests use a real Vault (a test cryptor, temporary
// folder): what is redacted here is what infer() redacts. Every state below is built for the tests, not a capture.

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });

function cryptor() {
  const key = randomBytes(32);
  return {
    isEncryptionAvailable: () => true,
    encryptString(value: string) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv); const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); return Buffer.concat([iv, cipher.getAuthTag(), data]); },
    decryptString(value: Buffer) {
      const decipher = createDecipheriv('aes-256-gcm', key, value.subarray(0, 12)); decipher.setAuthTag(value.subarray(12, 28));
      return Buffer.concat([decipher.update(value.subarray(28)), decipher.final()]).toString('utf8');
    },
  };
}
/** A vault holding `secrets`, and its redact as infer() passes it. `broken`: every later decryption fails. */
async function vaultWith(secrets: string[], options: { broken?: boolean } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'moonzila-screen-')); roots.push(directory);
  const crypt = cryptor(); let broken = false;
  const vault = new Vault(directory, { ...crypt, decryptString: value => { if (broken) throw new Error('decrypt failed'); return crypt.decryptString(value); } });
  await vault.initialize('epoch-1');
  for (const secret of secrets) { const ref = await vault.saveStaged(secret); await vault.commit(ref); }
  broken = options.broken ?? false;
  return (text: string) => vault.redact(text);
}

// Built secrets, not real keys. ESCAPED holds `"` and `\`, which JSON text writes as `\"` and `\\`: a check of the JSON
// text cannot see it. SPLIT is found whole only once the two text blocks are joined.
const SECRET = 'sk-ant-api03-ScreenSecretValue0001';
const ESCAPED = 'sk-ant-api03-Quote"And\\Backslash0002';
const SPLIT = 'sk-ant-api03-SplitAcrossTwoBlocks0003';
const SECRETS = [SECRET, ESCAPED, SPLIT];

const call: ToolCall = { id: 'toolu_01', name: 'list_files', input: { path: '.' } };
type Block = Record<string, unknown>;
const thinking = (text = '', signature = 'U2NyZWVuU2lnbmF0dXJlMDE'): Block => ({ type: 'thinking', thinking: text, signature });
const textBlock = (text: string): Block => ({ type: 'text', text });
const toolUse = (input: ToolCall['input'] = call.input): Block => ({ type: 'tool_use', id: call.id, name: call.name, input, caller: { type: 'direct' } });
/** An Anthropic tool step as anthropicOutcome builds it: the calls, the text blocks joined, and the state from the blocks. */
function toolStep(blocks: Block[], calls = [call]): Completion {
  const content = blocks.filter(block => block.type === 'text').map(block => block.text).join('');
  return { content, outcome: 'tool_calls', toolCalls: calls, usage: { inputTokens: 10, outputTokens: 5 }, providerState: { format: 'anthropic-messages@1', appendOnly: blocks.some(block => block.type === 'thinking'), data: JSON.stringify({ content: blocks }) } };
}

async function failure(promise: Promise<unknown>): Promise<Error | undefined> {
  try { await promise; } catch (error) { return error as Error; }
  return undefined;
}

describe('a tool step whose state holds a saved credential fails with PROVIDER_PROTOCOL_ERROR (S-1)', () => {
  // Guards, each removed once (the runs are in the commit report): the state rule as a whole (mutation: skip step 2 of
  // screenCompletion; every row then passes, its credential redacted from the content at most, never refused); reading
  // leaves, not the JSON text (mutation: pass providerState.data itself through redact; rows 3 and 4, the escaped ones,
  // are then missed); the unredacted content (mutation: screen the leaves only; row 5, split across two blocks, is then
  // missed). Row 3 is the tool-input key: a plain key would also be refused by the tool-call rule, so its credential
  // holds `"` and `\`, which that rule's JSON text hides, and only the state rule can be what refuses it.
  const cases: Array<[string, Completion]> = [
    ['in a thinking leaf', toolStep([thinking(`I will reuse ${SECRET} later.`), textBlock('Listing.'), toolUse()])],
    ['in a text leaf', toolStep([thinking(), textBlock(`Using ${SECRET} to list.`), toolUse()])],
    // The canonical calls carry the same key, but their JSON text writes it escaped, so only the state's leaves see it.
    ['in a tool-input key, with `"` and `\\`', toolStep([thinking(), textBlock(''), toolUse({ [ESCAPED]: '.' })], [{ ...call, input: { [ESCAPED]: '.' } }])],
    ['with `"` and `\\`, in a thinking leaf', toolStep([thinking(`token ${ESCAPED}`), textBlock(''), toolUse()])],
    ['split across two text blocks', toolStep([thinking(), textBlock(`First half ${SPLIT.slice(0, 20)}`), textBlock(`${SPLIT.slice(20)} second half`), toolUse()])],
  ];
  test.each(cases)('%s', async (_name, step) => {
    const redact = await vaultWith(SECRETS);
    expect((await failure(screenCompletion(step, redact)))?.message).toBe('PROVIDER_PROTOCOL_ERROR');
  });

  test('the escaped and split cases are invisible to a check of the JSON text or of the leaves alone', async () => {
    // Shows the rows above test what they claim: the JSON text never holds ESCAPED as written, and no leaf holds SPLIT.
    const redact = await vaultWith(SECRETS);
    for (const step of [cases[2]![1], cases[3]![1]]) expect(await redact(step.providerState!.data)).toBe(step.providerState!.data);
    expect(await redact(JSON.stringify(cases[2]![1].toolCalls))).toBe(JSON.stringify(cases[2]![1].toolCalls));
    const split = cases[4]![1];
    expect(await redact(providerStateLeaves(split.providerState!.data))).toBe(providerStateLeaves(split.providerState!.data));
    expect(await redact(split.content)).not.toBe(split.content);
  });

  test('a credential in a tool-input key is found by the leaves, keys included', async () => {
    // The state's own keys are leaves too (mutation: walk values only; this test and row 3 go red).
    const data = JSON.stringify({ content: [{ type: 'tool_use', id: 'toolu_01', name: 'list_files', input: { [ESCAPED]: 1 } }] });
    expect(providerStateLeaves(data).split('\u0000')).toEqual(['content', 'type', 'tool_use', 'id', 'toolu_01', 'name', 'list_files', 'input', ESCAPED]);
  });

  test('a state whose data cannot be read as JSON is refused, not passed unscreened', async () => {
    // Fail closed: anthropicOutcome always writes JSON, so this cannot come from a stream (mutation: skip a state that
    // does not parse; it then passes the screen).
    const step = toolStep([thinking(), textBlock(''), toolUse()]);
    const redact = await vaultWith(SECRETS);
    expect((await failure(screenCompletion({ ...step, providerState: { ...step.providerState!, data: '{"content":[' } }, redact)))?.message).toBe('PROVIDER_PROTOCOL_ERROR');
  });
});

test('a credential in the tool calls of a step with no state fails with PROVIDER_PROTOCOL_ERROR (the rule moved from infer())', async () => {
  // The rule src/main/index.ts applied in infer() before this unit (the calls' JSON text through redact), kept for every
  // tool step, with or without state. Guard: remove it from screenCompletion (mutation: skip step 1); the call then
  // passes with its credential, and only the content is redacted.
  const redact = await vaultWith(SECRETS);
  const step: Completion = { content: 'Reading.', outcome: 'tool_calls', toolCalls: [{ ...call, input: { path: `C:/keys/${SECRET}.txt` } }] };
  expect((await failure(screenCompletion(step, redact)))?.message).toBe('PROVIDER_PROTOCOL_ERROR');
});

describe('everything else is as infer() did it before (no state)', () => {
  test('a final answer, and a tool step with no state, have their content redacted and nothing else changed', async () => {
    // Guard: the content redaction (mutation: return the output unchanged; the credential then reaches the engine).
    const redact = await vaultWith(SECRETS);
    const answer: Completion = { content: `The key is ${SECRET}.`, outcome: 'complete', usage: { inputTokens: 3, outputTokens: 4 } };
    expect(await screenCompletion(answer, redact)).toEqual({ content: 'The key is [redacted].', outcome: 'complete', usage: { inputTokens: 3, outputTokens: 4 } });
    const chatStep: Completion = { content: `Reading ${SECRET} first.`, outcome: 'tool_calls', toolCalls: [call] };
    expect(await screenCompletion(chatStep, redact)).toEqual({ content: 'Reading [redacted] first.', outcome: 'tool_calls', toolCalls: [call] });
  });

  test('a tool step whose state holds no credential leaves screenCompletion unchanged, its state byte for byte', async () => {
    // The state is never redacted in place: an edited block is a 400 on the next step (E-09 l.161; E-12 l.167).
    const redact = await vaultWith(SECRETS);
    const step = toolStep([thinking('No secrets here.'), textBlock('Listing the files.'), toolUse()]);
    const screened = await screenCompletion(step, redact);
    expect(screened).toEqual(step);
    expect(screened.providerState!.data).toBe(step.providerState!.data);
  });

  test('REDACTION_UNAVAILABLE propagates, with and without state', async () => {
    // A vault that cannot decrypt fails the first redact of each shape. Guard: nothing in the state rule swallows it
    // (mutation: treat a redact failure in step 2 as a refusal). The flaky redact below fails only from its second
    // call, which is the state rule's, so that mutation turns it into PROVIDER_PROTOCOL_ERROR and this test red.
    const broken = await vaultWith(SECRETS, { broken: true });
    for (const step of [{ content: 'Done.', outcome: 'complete' } as Completion, { content: '', outcome: 'tool_calls', toolCalls: [call] } as Completion, toolStep([thinking(), textBlock(''), toolUse()])]) {
      expect((await failure(screenCompletion(step, broken)))?.message, step.outcome + (step.providerState ? ' with state' : '')).toBe('REDACTION_UNAVAILABLE');
    }
    const redact = await vaultWith(SECRETS); let calls = 0;
    const flaky = async (text: string) => { calls += 1; if (calls > 1) throw new Error('REDACTION_UNAVAILABLE'); return redact(text); };
    expect((await failure(screenCompletion(toolStep([thinking(), textBlock(''), toolUse()]), flaky)))?.message).toBe('REDACTION_UNAVAILABLE');
    expect(calls).toBe(2);
  });
});

test('infer() returns its completion only through screenCompletion, after the model call, as its last statement', () => {
  // infer() is a closure inside Electron's ready handler and has no harness, so this is pinned from its source, by whole
  // lines (as tests/ollama-locality.test.ts pins its locality check): every edit sits after `const invoke =`, the
  // screen is the one return, and nothing after it can hand back an unscreened output. Mutations: return the output
  // unredacted (`return output;`), or the old inline rules; either way the pinned line is gone.
  const source = readFileSync(new URL('../src/main/index.ts', import.meta.url), 'utf8');
  const start = source.indexOf('async function infer(');
  expect(start).toBeGreaterThan(-1);
  const body = source.slice(start, source.indexOf('async function readGitHub(', start)).split('\n').map(line => line.trim()).filter(line => line !== '' && !line.startsWith('//'));
  const screen = body.indexOf('return screenCompletion(output, text => vault.redact(text));');
  const invoke = body.findIndex(line => line.startsWith('const invoke = '));
  const call = body.findIndex(line => line.startsWith('} else output = await invoke();'));
  expect(screen, 'the screen is a whole line').toBeGreaterThan(-1);
  expect(invoke).toBeGreaterThan(-1);
  expect(call).toBeGreaterThan(invoke);
  expect(screen, 'straight after the model call').toBe(call + 1);
  expect(body[screen + 1], 'the last statement of infer()').toBe('}');
  expect(body.filter(line => /\breturn\b/.test(line)), 'no other return').toEqual([body[screen]]);
  expect(source.split('screenCompletion(').length - 1, 'called once in main').toBe(1);
});
