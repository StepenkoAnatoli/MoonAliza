// Probe driver: node run.mjs <step>. Steps follow the order of the probe brief.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, nativeBody, replayContent, send, spent } from './probe-lib.mjs';

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-5-5';
const OPUS = 'claude-opus-5-5';
const FABLE = 'claude-fable-5-1';

const OK = [{ role: 'user', content: 'Reply with OK.' }];
const SYSTEM = 'You are a test assistant. Use the tools when the user asks for them.';
const TOOLS = [
  {
    name: 'get_weather', description: 'Get the current weather for a city.',
    input_schema: { type: 'object', properties: { city: { type: 'string', description: 'City name' } }, required: ['city'] },
  },
  { name: 'get_time', description: 'Get the current UTC time. Takes no arguments.', input_schema: { type: 'object', properties: {} } },
];
const D5_PROMPT = 'Call get_weather for Paris and call get_time, then tell me both results in one sentence.';
const RESULTS = { get_weather: 'Paris: 18 C, cloudy.', get_time: '14:05 UTC' };

function toolResults(content) {
  return content.filter((b) => b.type === 'tool_use')
    .map((b) => ({ type: 'tool_result', tool_use_id: b.id, content: RESULTS[b.name] ?? 'unknown tool' }));
}

/** D5 two-step round trip; returns both metas. */
async function roundTrip(prefix, model, { system = SYSTEM, prompt = D5_PROMPT, maxTokens = 4096 } = {}) {
  const messages = [{ role: 'user', content: prompt }];
  const s1 = await send({ id: `${prefix}-step1`, model, body: nativeBody({ model, maxTokens, system, messages, tools: TOOLS }), worstInput: 2000 });
  if (s1.status !== 200 || s1.facts?.stopReason !== 'tool_use') return { s1 };
  const content = replayContent(s1.facts);
  const messages2 = [...messages, { role: 'assistant', content }, { role: 'user', content: toolResults(content) }];
  const s2 = await send({ id: `${prefix}-step2`, model, body: nativeBody({ model, maxTokens, system, messages: messages2, tools: TOOLS }), worstInput: 10000 });
  return { s1, s2, messages2 };
}

const steps = {
  async 1() {
    // D2: about 1.5x Haiku 4.5's 200K window of synthetic filler.
    const lines = [];
    for (let i = 0; i < 20000; i++) lines.push(`Line ${String(i).padStart(5, '0')}: the quick brown fox jumps over the lazy dog.`);
    const filler = lines.join('\n');
    const content = `${filler}\n\nReply with OK.`;
    await send({
      id: 'D2-over-window', model: HAIKU,
      body: nativeBody({ model: HAIKU, maxTokens: 64, messages: [{ role: 'user', content }] }),
      worstInput: 400000,
      bodyForRecord: nativeBody({ model: HAIKU, maxTokens: 64, messages: [{ role: 'user', content: `<filler: 20000 lines "Line NNNNN: the quick brown fox jumps over the lazy dog.", ${Buffer.byteLength(filler)} UTF-8 bytes, sha256 ${createHash('sha256').update(content).digest('hex')} of the whole content, then "\\n\\nReply with OK.">` }] }),
    });
    // D7 over-maximum: max_tokens 70,000 above Haiku 4.5's 64K maximum; costed as accepted.
    await send({ id: 'D7-over-max-haiku', model: HAIKU, body: nativeBody({ model: HAIKU, maxTokens: 70000, messages: OK }), worstInput: 2000, worstOutput: 65536 });
    // D11: the D5 round trip on Haiku 4.5, thinking omitted.
    await roundTrip('D11-haiku', HAIKU);
  },
  async 2() {
    // D1: Bearer on Sonnet 5.5; on a 401 the same with x-api-key.
    const d1 = await send({ id: 'D1-bearer', model: SONNET, body: nativeBody({ model: SONNET, maxTokens: 64, messages: OK }), worstInput: 2000 });
    if (d1.status === 401) await send({ id: 'D1-x-api-key', model: SONNET, auth: 'x-api-key', body: nativeBody({ model: SONNET, maxTokens: 64, messages: OK }), worstInput: 2000 });
    // D4: the same prompt non-streamed.
    await send({ id: 'D4-non-streamed', model: SONNET, body: nativeBody({ model: SONNET, maxTokens: 64, messages: OK, stream: false }), worstInput: 2000 });
  },
  async 3() {
    for (const [p, m] of [['D5-sonnet', SONNET], ['D5-opus', OPUS], ['D5-fable', FABLE]]) {
      const r = await roundTrip(p, m);
      if (r.messages2) writeFileSync(join(DIR, `${p}-step2.messages.json`), JSON.stringify(r.messages2, null, 2) + '\n');
    }
    // D5(f): Sonnet step 2 replayed under a system prompt changed by one character.
    const m2 = JSON.parse(readFileSync(join(DIR, 'D5-sonnet-step2.messages.json'), 'utf8'));
    const system = SYSTEM.replace(/\.$/, '!');
    await send({ id: 'D5f-sonnet-changed-system', model: SONNET, body: nativeBody({ model: SONNET, maxTokens: 4096, system, messages: m2, tools: TOOLS }), worstInput: 10000 });
  },
  async '3b'(models = process.argv[3] ?? 'sonnet') {
    // D5 with a prompt that invites thinking, so thinking blocks, signatures and their replay can be seen.
    const prompt = 'Think step by step before using any tool: which is larger, 17 x 23 or 19 x 21? If the first is larger, '
      + 'call get_weather for Paris, otherwise for Rome. Also call get_time. Then answer in one sentence.';
    const byName = { sonnet: SONNET, opus: OPUS, fable: FABLE };
    for (const n of models.split(',')) {
      const r = await roundTrip(`D5-think-${n}`, byName[n], { prompt });
      if (!r.messages2) continue;
      writeFileSync(join(DIR, `D5-think-${n}-step2.messages.json`), JSON.stringify(r.messages2, null, 2) + '\n');
      if (n === 'sonnet') {
        // D5(f) with thinking in the replayed turn: the step-2 request under a system prompt changed by one character.
        await send({ id: 'D5f-think-sonnet-changed-system', model: SONNET, body: nativeBody({ model: SONNET, maxTokens: 4096, system: SYSTEM.replace(/\.$/, '!'), messages: r.messages2, tools: TOOLS }), worstInput: 10000 });
      }
    }
  },
  async 4() {
    // D6: run 1 is a tool round trip ending in an answer; run 2 replays only its prompt and answer text.
    const prompt = 'Think step by step: is 391 a prime number? If it is, call get_weather for Paris, otherwise for Rome. Then, after thinking about the result, tell me in one sentence whether I need an umbrella.';
    const r1 = await roundTrip('D6-run1', SONNET, { prompt });
    if (!r1.s2 || r1.s2.status !== 200) return;
    const answer = r1.s2.facts.blocks.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const messages = [
      { role: 'user', content: prompt },
      { role: 'assistant', content: answer },
      { role: 'user', content: 'Call get_time and tell me the time.' },
    ];
    await send({ id: 'D6-run2', model: SONNET, body: nativeBody({ model: SONNET, maxTokens: 4096, system: SYSTEM, messages, tools: TOOLS }), worstInput: 2000 });
  },
  async 5() {
    for (const [n, m] of [['sonnet', SONNET], ['opus', OPUS], ['fable', FABLE]]) {
      await send({ id: `D7-2048-${n}`, model: m, body: nativeBody({ model: m, maxTokens: 2048, messages: OK }), worstInput: 2000 });
    }
    await send({ id: 'D7-32000-sonnet', model: SONNET, body: nativeBody({ model: SONNET, maxTokens: 32000, messages: OK }), worstInput: 2000 });
  },
  async '5b'() {
    // Conditional D7 items: 32,000 on Opus 5.5, then Fable 5.1, each only while the cap covers its worst case.
    await send({ id: 'D7-32000-opus', model: OPUS, body: nativeBody({ model: OPUS, maxTokens: 32000, messages: OK }), worstInput: 2000 });
    await send({ id: 'D7-32000-fable', model: FABLE, body: nativeBody({ model: FABLE, maxTokens: 32000, messages: OK }), worstInput: 2000 });
  },
  async 6() {
    const prompt = 'Think carefully before acting. A city is chosen as follows: list the ten largest European capitals by population, '
      + 'reason step by step about which of them has the most rainy days per year, double-check your reasoning, and then call get_weather '
      + 'exactly once for the city you chose. Do not answer before calling the tool.';
    await send({ id: 'D12-opus-32000', model: OPUS, body: nativeBody({ model: OPUS, maxTokens: 32000, system: SYSTEM, messages: [{ role: 'user', content: prompt }], tools: TOOLS }), worstInput: 2000 });
  },
};

await steps[process.argv[2]]();
console.log(`spent so far: $${spent().toFixed(4)}`);
