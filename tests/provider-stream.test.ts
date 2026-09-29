import { expect, test } from 'vitest';
import { complete } from '../src/main/inference';
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
  expect(result).toEqual({ content: '', outcome: 'tool_calls', toolCalls: [{ id: 'call_DdmO9pD3xa9XTPNJ32zg2hcA', name: 'get_weather', input: { location: 'Paris, France' } }] });
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

test('a call whose identity changes mid-stream, or a mid-stream error, is rejected without its text', async () => {
  const renamed = async () => sse([
    delta({ tool_calls: [E07[0]] }),
    delta({ tool_calls: [{ index: 0, id: 'call_other', function: { arguments: '{}' } }] }),
    delta({}, 'tool_calls'),
  ]);
  await expect(complete(openai, [], { tools: [tool('get_weather')], fetcher: renamed, signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
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
