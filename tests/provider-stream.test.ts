import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { complete, inferenceErrorCode } from '../src/main/inference';
import { readSse, readSseEvents } from '../src/main/provider-stream';
import type { ToolSpec } from '../src/shared';

// Replay fixtures for docs/research/2026-09-29-streaming-tool-calls: the chunk sequences quoted in
// E-04 (Ollama's streaming tool-calling post) and E-07 (OpenAI's function-calling guide).

const signal = () => new AbortController().signal;
const tool = (name: string): ToolSpec => ({ name, description: name, parameters: { type: 'object' } });
const ollama = { kind: 'ollama' as const, endpoint: 'http://127.0.0.1:11434', model: 'qwen3', outputTokens: 512 };
const openai = { kind: 'openai-compatible' as const, endpoint: 'https://model.example/v1', model: 'gpt', outputTokens: 512 };

/** A body delivered in awkward pieces, so no parser can rely on a chunk holding a whole line. */
function streamed(text: string, contentType: string, size = 7): Response {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream({ start(controller) {
    for (let at = 0; at < bytes.length; at += size) controller.enqueue(bytes.slice(at, at + size));
    controller.close();
  } }), { headers: { 'Content-Type': contentType } });
}
const ndjson = (chunks: unknown[]) => streamed(chunks.map(chunk => JSON.stringify(chunk)).join('\n') + '\n', 'application/x-ndjson');
const sse = (chunks: unknown[], done = true, size?: number) => streamed(chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') + (done ? 'data: [DONE]\n\n' : ''), 'text/event-stream', size);

const assistant = (content: string, extra: object = {}) => ({ model: 'qwen3', created_at: '2025-05-27T22:54:57Z', message: { role: 'assistant', content, ...extra }, done: false });

test('E-04: native Ollama streams content, then one chunk holding a whole call, then done', async () => {
  let body: Record<string, unknown> = {};
  const fetcher = async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return ndjson([
      assistant('<think>'), assistant('celsius'), assistant('</think>'),
      assistant('', { tool_calls: [{ function: { name: 'get_current_weather', arguments: { format: 'celsius', location: 'Toronto' } } }] }),
      { model: 'qwen3', created_at: '2025-05-27T22:54:58Z', message: { role: 'assistant', content: '' }, done: true, done_reason: 'stop' },
    ]);
  };
  const result = await complete(ollama, [], { tools: [tool('get_current_weather')], fetcher, signal: signal() });
  expect(body.stream).toBe(true);
  expect(result.outcome).toBe('tool_calls');
  expect(result.content).toBe('<think>celsius</think>');
  expect(result.toolCalls).toHaveLength(1);
  expect(result.toolCalls?.[0]).toMatchObject({ name: 'get_current_weather', input: { format: 'celsius', location: 'Toronto' } });
});

const E07 = [
  { index: 0, id: 'call_DdmO9pD3xa9XTPNJ32zg2hcA', function: { arguments: '', name: 'get_weather' }, type: 'function' },
  ...['{"', 'location', '":"', 'Paris', ',', ' France', '"}'].map(args => ({ index: 0, id: null, function: { arguments: args, name: null }, type: null })),
];
const delta = (fields: object, finish: string | null = null) => ({ id: 'chatcmpl-1', object: 'chat.completion.chunk', choices: [{ index: 0, delta: fields, finish_reason: finish }] });

test('E-07: OpenAI index-keyed fragments join into one call, parsed once finish_reason is tool_calls', async () => {
  let body: Record<string, unknown> = {};
  const fetcher = async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return sse([
      delta({ role: 'assistant', content: null }),
      ...E07.map(fragment => delta({ tool_calls: [fragment] })),
      delta({}, 'tool_calls'),
      { id: 'chatcmpl-1', object: 'chat.completion.chunk', choices: [], usage: { prompt_tokens: 80, completion_tokens: 17, total_tokens: 97 } },
    ]);
  };
  const result = await complete(openai, [], { tools: [tool('get_weather')], fetcher, signal: signal() });
  expect(body).toMatchObject({ stream: true, stream_options: { include_usage: true } });
  expect(result).toEqual({ usage: { inputTokens: 80, outputTokens: 17 }, content: '', outcome: 'tool_calls', toolCalls: [{ id: 'call_DdmO9pD3xa9XTPNJ32zg2hcA', name: 'get_weather', input: { location: 'Paris, France' } }] });
});

test('interleaved OpenAI calls are joined by index and returned in index order', async () => {
  const fetcher = async () => sse([
    delta({ tool_calls: [{ index: 1, id: 'call-b', type: 'function', function: { name: 'get_weather', arguments: '{"location":' } }] }),
    delta({ tool_calls: [{ index: 0, id: 'call-a', type: 'function', function: { name: 'get_weather', arguments: '{"location":"Oslo"}' } }] }),
    delta({ tool_calls: [{ index: 1, function: { arguments: '"Rome"}' } }] }),
    delta({}, 'tool_calls'),
  ]);
  const result = await complete(openai, [], { tools: [tool('get_weather')], fetcher, signal: signal() });
  expect(result.toolCalls).toEqual([{ id: 'call-a', name: 'get_weather', input: { location: 'Oslo' } }, { id: 'call-b', name: 'get_weather', input: { location: 'Rome' } }]);
});

test('streamed text accumulates, and a stream cut before its terminal never looks complete', async () => {
  const text = ['Hel', 'lo', ' world'].map(content => delta({ content }));
  expect(await complete(openai, [], { fetcher: async () => sse([...text, delta({}, 'stop')]), signal: signal() })).toEqual({ content: 'Hello world', outcome: 'complete' });
  expect(await complete(openai, [], { fetcher: async () => sse(text, false), signal: signal() })).toEqual({ content: 'Hello world', outcome: 'incomplete' });
  const cut = [assistant('Hel'), assistant('lo')];
  expect(await complete(ollama, [], { fetcher: async () => ndjson(cut), signal: signal() })).toEqual({ content: 'Hello', outcome: 'incomplete' });
  // A call whose arguments were still arriving when the stream stopped is never executable.
  const partial = [delta({ tool_calls: [E07[0]] }), delta({ tool_calls: [E07[1]] })];
  expect(await complete(openai, [], { tools: [tool('get_weather')], fetcher: async () => sse(partial, false), signal: signal() })).toEqual({ content: '', outcome: 'incomplete' });
});

test('a new id without a name, a renamed call, or a mid-stream error is rejected without its text', async () => {
  const renamed = async () => sse([
    delta({ tool_calls: [E07[0]] }),
    delta({ tool_calls: [{ index: 0, id: 'call_other', function: { arguments: '{}' } }] }),
    delta({}, 'tool_calls'),
  ]);
  await expect(complete(openai, [], { tools: [tool('get_weather')], fetcher: renamed, signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
  const retitled = async () => sse([
    delta({ tool_calls: [E07[0]] }),
    delta({ tool_calls: [{ index: 0, id: E07[0]!.id, function: { name: 'other_tool', arguments: '{}' } }] }),
    delta({}, 'tool_calls'),
  ]);
  await expect(complete(openai, [], { tools: [tool('get_weather'), tool('other_tool')], fetcher: retitled, signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
  const failing = async () => ndjson([assistant('partial'), { error: 'leaked-token in a runtime error' }]);
  const rejection = complete(ollama, [], { fetcher: failing, signal: signal() });
  await expect(rejection).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
  await expect(rejection).rejects.not.toThrow('leaked-token');
});

test('the response size bound holds across the whole stream, not per chunk', async () => {
  const many = Array.from({ length: 5000 }, () => delta({ content: 'x'.repeat(1000) }));
  await expect(complete(openai, [], { fetcher: async () => sse(many, true, 65536), signal: signal() })).rejects.toThrow('PROVIDER_RESPONSE_TOO_LARGE');
});

test('a stream abandoned mid-way is cancelled, so the provider stops sending', async () => {
  let cancelled = false;
  const open = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('data: {"not":"a chunk"}\n\n')); },
    cancel() { cancelled = true; },
  });
  const fetcher = async () => new Response(open, { headers: { 'Content-Type': 'text/event-stream' } });
  await expect(complete(openai, [], { fetcher, signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
  expect(cancelled).toBe(true);
});

// docs/research/2026-09-29-ollama-v1-stream-chunking: Ollama's /v1 sends each call whole, and
// one report (E-05) shows parallel calls both at index 0 with distinct ids; the finish reason
// arrives on its own chunk, carrying usage (E-03, E-04).
test('Ollama /v1: whole calls sharing index 0 with distinct ids are two calls, not a conflict', async () => {
  const whole = (id: string, sides: number) => ({ id: 'chatcmpl-914', object: 'chat.completion.chunk', system_fingerprint: 'fp_ollama',
    choices: [{ index: 0, delta: { role: 'assistant', content: '', tool_calls: [{ id, index: 0, type: 'function', function: { name: 'roll_dice', arguments: JSON.stringify({ sides }) } }] }, finish_reason: null }] });
  const fetcher = async () => sse([
    whole('call_a', 6), whole('call_b', 20),
    { id: 'chatcmpl-914', object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }], usage: { prompt_tokens: 40, completion_tokens: 12, total_tokens: 52 } },
  ]);
  const result = await complete(openai, [], { tools: [tool('roll_dice')], fetcher, signal: signal() });
  expect(result).toEqual({ usage: { inputTokens: 40, outputTokens: 12 }, content: '', outcome: 'tool_calls', toolCalls: [
    { id: 'call_a', name: 'roll_dice', input: { sides: 6 } },
    { id: 'call_b', name: 'roll_dice', input: { sides: 20 } },
  ] });
});


test('native streamed usage comes from terminal counts and compatible usage may share the finish chunk', async () => {
  expect(await complete(ollama, [], { signal: signal(), fetcher: async () => ndjson([
    assistant('hello'), { message: { content: '' }, done: true, done_reason: 'stop', prompt_eval_count: 123, eval_count: 7 },
  ]) })).toMatchObject({ content: 'hello', outcome: 'complete', usage: { inputTokens: 123, outputTokens: 7 } });
  expect(await complete(openai, [], { signal: signal(), fetcher: async () => sse([
    { ...delta({ content: 'hello' }, 'stop'), usage: { prompt_tokens: 123, completion_tokens: 7 } },
  ]) })).toMatchObject({ usage: { inputTokens: 123, outputTokens: 7 } });
});

test.each([null, {}, { prompt_tokens: -1, completion_tokens: 2 }, { prompt_tokens: 3.5, completion_tokens: 2 }, { prompt_tokens: 3, completion_tokens: '2' }])('malformed optional stream usage stays unknown: %j', async usage => {
  expect(await complete(openai, [], { signal: signal(), fetcher: async () => sse([
    delta({ content: 'ok' }, 'stop'), { choices: [], usage },
  ]) })).toEqual({ content: 'ok', outcome: 'complete' });
});


// More models Phase 1 (docs/specification/more-models.md, Phase 1 design 1). Fixtures are copied from
// the captures of docs/research/2026-10-05-provider-wire-formats (research/raw/), each beside its E-row;
// the first test below checks that each verbatim one still occurs in its capture.
const WIRE = '../docs/research/2026-10-05-provider-wire-formats/research/raw/';
const ANTHROPIC_STREAMING = '2026-10-05-streaming-messages-claude-platform-docs-claude-0712ffc4.md';
const OPENROUTER_STREAMING = '2026-10-05-api-streaming-real-time-model-response-i-openrouter-2d4880cd.md';
const DEEPSEEK_CHAT = '2026-10-05-chat-completions-api-deepseek-api-docs-deepseek-3c16da97.md';
const capture = (name: string) => readFileSync(new URL(WIRE + name, import.meta.url), 'utf8');

// E-10, capture lines 198-220: Anthropic's basic stream, with a `ping` event.
const E10_BASIC = String.raw`event: message_start
data: {"type": "message_start", "message": {"id": "msg_1nZdL29xx5MUA1yADyHTEsnR8uuvGzszyY", "type": "message", "role": "assistant", "content": [], "model": "claude-opus-5-5", "stop_reason": null, "stop_sequence": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}

event: content_block_start
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}}

event: ping
data: {"type": "ping"}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "!"}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 0}

event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null}, "usage": {"output_tokens": 15}}

event: message_stop
data: {"type": "message_stop"}`;

// E-10, capture lines 269-348: Anthropic's tool-use stream.
const E10_TOOL_USE = String.raw`event: message_start
data: {"type":"message_start","message":{"id":"msg_014p7gG3wDgGV9EUtLvnow3U","type":"message","role":"assistant","model":"claude-opus-5","stop_sequence":null,"usage":{"input_tokens":472,"output_tokens":2},"content":[],"stop_reason":null}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: ping
data: {"type": "ping"}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Okay"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":","}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" let"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"'s"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" check"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" the"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" weather"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" for"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" San"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" Francisco"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":","}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" CA"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":":"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01T1x1fJ34qAmk2tNTrN7Up6","name":"get_weather","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"location\":"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":" \"San"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":" Francisc"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"o,"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":" CA\"}"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"tool_use","stop_sequence":null},"usage":{"output_tokens":89}}

event: message_stop
data: {"type":"message_stop"}`;

// E-10, capture lines 85-86: an error event inside the stream.
const E10_ERROR = String.raw`event: error
data: {"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}}`;

// E-25, capture line 184: OpenRouter's keep-alive comment.
const E25_COMMENT = ': OPENROUTER PROCESSING';

// E-25, capture line 445: OpenRouter's mid-stream error chunk, sent after the 200 is committed.
const E25_ERROR = String.raw`data: {"id":"cmpl-abc123","object":"chat.completion.chunk","created":1234567890,"model":"openai/gpt-4o","provider":"openai","error":{"code":"server_error","message":"Provider disconnected unexpectedly"},"choices":[{"index":0,"delta":{"content":""},"finish_reason":"error"}]}`;

// E-20, capture lines 1143-1165: DeepSeek's streamed answer; usage rides on the last content chunk.
const E20_STREAM = String.raw`data: {"id": "1f633d8bfc032625086f14113c411638", "choices": [{"index": 0, "delta": {"content": "", "role": "assistant"}, "finish_reason": null, "logprobs": null}], "created": 1718345013, "model": "deepseek-flash", "system_fingerprint": "fp_a49d71b8a1", "object": "chat.completion.chunk"}

data: {"choices": [{"delta": {"content": "Hello", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": "!", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": " How", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": " can", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": " I", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": " assist", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": " you", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": " today", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": "?", "role": "assistant"}, "finish_reason": null, "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1"}

data: {"choices": [{"delta": {"content": "", "role": null}, "finish_reason": "stop", "index": 0, "logprobs": null}], "created": 1718345013, "id": "1f633d8bfc032625086f14113c411638", "model": "deepseek-flash", "object": "chat.completion.chunk", "system_fingerprint": "fp_a49d71b8a1", "usage": {"completion_tokens": 9, "prompt_tokens": 17, "total_tokens": 26, "prompt_tokens_details": {"cached_tokens": 0}, "prompt_cache_hit_tokens": 0, "prompt_cache_miss_tokens": 17}}

data: [DONE]`;

// E-25, capture lines 257-258: the last content-bearing chunk and the usage chunk that repeats its
// finish_reason. The page elides fields as `...`: the elided top-level fields are left out, and the
// elided usage object is OpenRouter's documented one (E-26, raw/2026-10-05-usage-accounting-track-ai-model-token-us-openrouter-0c244522.md lines 40-54).
const E26_USAGE = { completion_tokens: 2, completion_tokens_details: { reasoning_tokens: 0 }, cost: 0.95, cost_details: { upstream_inference_cost: 19 }, prompt_tokens: 194, prompt_tokens_details: { cached_tokens: 0, cache_write_tokens: 100, audio_tokens: 0 }, total_tokens: 196 };
const e25Terminal = (finish_reason: string) => ({ id: 'gen-abc123', choices: [{ index: 0, delta: { content: '', role: 'assistant' }, finish_reason, native_finish_reason: finish_reason }] });

/** A captured block as a response body, ended by the blank line every event needs, in awkward pieces. */
const events = (text: string) => streamed(`${text}\n\n`, 'text/event-stream');
const dataLines = (text: string) => text.split('\n').filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)) as unknown);
async function collect<T>(source: AsyncIterable<T>): Promise<T[]> { const items: T[] = []; for await (const item of source) items.push(item); return items; }
async function failure(promise: Promise<unknown>): Promise<Error> {
  try { await promise; } catch (error) { return error as Error; }
  throw new Error('expected the call to fail');
}

test('the wire fixtures are the captured text, copied verbatim', () => {
  // Guard: a fixture that drifts from its capture (mutation: change one character of E10_BASIC).
  for (const [file, fixtures] of [[ANTHROPIC_STREAMING, [E10_BASIC, E10_TOOL_USE, E10_ERROR]], [OPENROUTER_STREAMING, [E25_COMMENT, E25_ERROR]], [DEEPSEEK_CHAT, [E20_STREAM]]] as const) {
    const text = capture(file);
    for (const fixture of fixtures) expect(text.includes(fixture)).toBe(true);
  }
});

test('E-10: readSseEvents keeps each event name with its data, ping and error events included', async () => {
  // Guard: the `event` field is kept (mutation: drop the `event:` branch, so every name is undefined).
  const basic = await collect(readSseEvents(events(E10_BASIC)));
  expect(basic.map(item => item.event)).toEqual(['message_start', 'content_block_start', 'ping', 'content_block_delta', 'content_block_delta', 'content_block_stop', 'message_delta', 'message_stop']);
  // E-10: "Each event uses an SSE event name ..., and includes the matching event `type` in its data."
  for (const item of basic) expect(item.event).toBe((item.data as { type: string }).type);
  expect(basic.map(item => item.data)).toEqual(dataLines(E10_BASIC));
  const tool = await collect(readSseEvents(events(E10_TOOL_USE)));
  expect(tool).toHaveLength(27);
  for (const item of tool) expect(item.event).toBe((item.data as { type: string }).type);
  const deltas = tool.map(item => (item.data as { delta?: { partial_json?: string; text?: string } }).delta);
  expect(deltas.map(delta => delta?.partial_json ?? '').join('')).toBe('{"location": "San Francisco, CA"}');
  expect(deltas.map(delta => delta?.text ?? '').join('')).toBe("Okay, let's check the weather for San Francisco, CA:");
  expect(await collect(readSseEvents(events(E10_ERROR)))).toEqual([{ event: 'error', data: { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } } }]);
});

test('E-10: readSse, which its callers use, still yields only each event\'s parsed data, in order', async () => {
  // Guard: readSse projects each event to its data (mutation: yield the whole { event, data } item).
  for (const fixture of [E10_BASIC, E10_TOOL_USE, E10_ERROR]) expect(await collect(readSse(events(fixture)))).toEqual(dataLines(fixture));
});

test('E-25: a comment line is skipped, between events and inside a multi-line data event', async () => {
  // Guard: only the `data` and `event` fields are kept; a comment's field name is empty
  // (mutation: keep the value of every line that is not `event:` as data).
  const [first, second] = E20_STREAM.split('\n\n');
  // E-20's first chunk, then its second split across two `data:` lines with E-25's comment between.
  const split = second!.replace('"finish_reason": null', '\n' + E25_COMMENT + '\ndata: "finish_reason": null');
  expect(split.split('\n')).toHaveLength(3);
  const body = `${E25_COMMENT}\n\n${first}\n${E25_COMMENT}\n\n${split}\n\n${E25_COMMENT}`;
  const parsed = dataLines(`${first}\n\n${second}`);
  expect(await collect(readSseEvents(events(body)))).toEqual(parsed.map(data => ({ event: undefined, data })));
  expect(await collect(readSse(events(body)))).toEqual(parsed);
});

test('id: and retry: lines are ignored: never data, never the event name', async () => {
  // No capture shows an `id:` or `retry:` line; the two below are written to the SSE field grammar, around
  // E-10's message_stop event. Guard: as above (mutation: keep every non-`event:` line as data).
  const body = String.raw`id: msg_1
event: message_stop
retry: 3000
id: msg_2
data: {"type": "message_stop"}`;
  expect(await collect(readSseEvents(events(body)))).toEqual([{ event: 'message_stop', data: { type: 'message_stop' } }]);
});

test('an event name belongs to its own event: the next event without an `event:` line has no name', async () => {
  // F-1, names kept with their data. E-10's named message_stop event, then E-20's first chunk, which has no
  // `event:` line. Guard: the name is reset at each blank line (mutation: drop `event = undefined;` there,
  // so message_stop carries over to the unnamed event).
  const stop = E10_BASIC.split('\n\n').at(-1)!;
  const [first] = E20_STREAM.split('\n\n');
  expect(stop).toBe('event: message_stop\ndata: {"type": "message_stop"}');
  expect(await collect(readSseEvents(events(`${stop}\n\n${first}`)))).toEqual([
    { event: 'message_stop', data: { type: 'message_stop' } },
    { event: undefined, data: dataLines(first!)[0] },
  ]);
});

test('E-25: the usage chunk repeating finish_reason is an accounting frame, not a second terminal', async () => {
  // Guard: a repeated reason equal to the first is accepted (mutation: fail on any second non-null reason).
  const fetcher = async () => events([E25_COMMENT, `data: ${JSON.stringify(e25Terminal('stop'))}`, `data: ${JSON.stringify({ ...e25Terminal('stop'), usage: E26_USAGE })}`, 'data: [DONE]'].join('\n\n'));
  expect(await complete(openai, [], { fetcher, signal: signal() })).toEqual({ usage: { inputTokens: 194, outputTokens: 2 }, content: '', outcome: 'complete' });
});

test('a second terminal chunk with a different finish_reason fails the call', async () => {
  // E-25's terminal pair, its first reason changed to `length`: a truncated answer must not turn complete.
  // Guard: the conflicting-reason check (mutation: remove it, so the last reason wins).
  const fetcher = async () => events([`data: ${JSON.stringify(e25Terminal('length'))}`, `data: ${JSON.stringify({ ...e25Terminal('stop'), usage: E26_USAGE })}`, 'data: [DONE]'].join('\n\n'));
  const error = await failure(complete(openai, [], { fetcher, signal: signal() }));
  expect(error.message).toBe('PROVIDER_INVALID_RESPONSE');
  expect(inferenceErrorCode(error)).toBe('PROVIDER_ERROR');
});

test('E-25: a mid-stream error chunk fails the call without its text, as the only event or after text', async () => {
  // Guard: a chunk with a top-level `error` fails the stream (mutation: remove the check; the chunk's
  // finish_reason `error` then still fails the call, but as PROVIDER_FINISH_FAILED, not as the error it is).
  // The chunk alone after the comment ("The error can be the first and only event in the stream", E-25),
  // then after E-20's first three chunks, so that text ("Hello!") has already arrived and must not be kept.
  const [first, hello, bang] = E20_STREAM.split('\n\n');
  for (const body of [`${E25_COMMENT}\n\n${E25_ERROR}`, `${first}\n\n${hello}\n\n${bang}\n\n${E25_ERROR}`]) {
    const error = await failure(complete(openai, [], { fetcher: async () => events(body), signal: signal() }));
    expect(error.message).toBe('PROVIDER_STREAM_ERROR');
    expect(error.message).not.toContain('Provider disconnected');
    // It crosses into the engine as every provider failure does; no answer is returned to save.
    expect(inferenceErrorCode(error)).toBe('PROVIDER_ERROR');
  }
});

test('an error chunk that carries no choice still fails the call (review U1-R6)', async () => {
  // Guard: the top-level `error` check runs before the no-choice early return (mutation: move it below
  // `if (!choice) return`; the chunk is then skipped and the stream ends as an incomplete answer).
  // Derived from E-25's error chunk (capture line 445) with its choices emptied - no capture shows this
  // shape; it is the case the position of the check exists for.
  const noChoice = E25_ERROR.replace(/"choices":\[.*\]\}$/, '"choices":[]}');
  expect(noChoice).not.toBe(E25_ERROR);
  const [first, hello] = E20_STREAM.split('\n\n');
  const error = await failure(complete(openai, [], { fetcher: async () => events(`${first}\n\n${hello}\n\n${noChoice}`), signal: signal() }));
  expect(error.message).toBe('PROVIDER_STREAM_ERROR');
});

test('E-20: DeepSeek\'s captured stream completes with its usage', async () => {
  // The positive control for the failure cases below: the capture as published. Guard: `stop` is a
  // known reason (mutation: remove it from the known set; the call then fails).
  expect(await complete(openai, [], { fetcher: async () => events(E20_STREAM), signal: signal() })).toEqual({ usage: { inputTokens: 17, outputTokens: 9 }, content: 'Hello! How can I assist you today?', outcome: 'complete' });
});

// E-20's stream with its terminal reason replaced by: DeepSeek's two failure values (E-20, capture lines
// 1034-1041), Mistral's streamed `error` (E-22, the CompletionResponseStreamChoice enum in the captured
// source HTML), and OpenAI's deprecated `function_call` (docs/research/2026-09-28-open-gaps,
// raw/2026-09-28-chat-openai-api-reference-openai-b5558b02.md line 116), a value this adapter does not know.
test.each(['insufficient_system_resource', 'aborted', 'error', 'function_call'])('a streamed finish_reason of %s fails the call, never a partial answer', async reason => {
  // Guard: a finish_reason outside the known set fails the call (mutation: remove the check; it was incomplete).
  const body = E20_STREAM.replace('"finish_reason": "stop"', `"finish_reason": "${reason}"`);
  expect(body).not.toBe(E20_STREAM);
  const error = await failure(complete(openai, [], { fetcher: async () => events(body), signal: signal() }));
  expect(error.message).toBe('PROVIDER_FINISH_FAILED');
  expect(inferenceErrorCode(error)).toBe('PROVIDER_ERROR');
});

test('a stream that ends with no finish_reason at all stays incomplete', async () => {
  // Kept as it was (docs/specification/more-models.md): no terminal is not a failure signal. E-20's stream
  // without its last chunk and [DONE]. Guard: a missing reason is exempt from the known-set check
  // (mutation: drop the exemption; the call then fails).
  const body = E20_STREAM.split('\n\n').slice(0, -2).join('\n\n');
  expect(await complete(openai, [], { fetcher: async () => events(body), signal: signal() })).toEqual({ content: 'Hello! How can I assist you today?', outcome: 'incomplete' });
});
