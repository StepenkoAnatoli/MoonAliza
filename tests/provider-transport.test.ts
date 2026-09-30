import { expect, test } from 'vitest';
import { validateEndpoint, readBoundedJson, complete, type InferenceMessage } from '../src/main/inference';
import { CompletionSchema, FromEngineSchema, ToEngineSchema } from '../src/engine/control';
import type { ToolSpec } from '../src/shared';

test('credentials can only target explicit HTTPS providers or loopback local runtimes', () => {
  expect(validateEndpoint('openai-compatible', 'https://api.example.com/v1/')).toEqual({ endpoint: 'https://api.example.com/v1', locality: 'external' });
  expect(validateEndpoint('ollama', 'http://127.0.0.1:11434')).toEqual({ endpoint: 'http://127.0.0.1:11434', locality: 'local' });
  for (const url of ['http://api.example.com/v1', 'https://user:password@example.com', 'https://example.com?key=secret', 'file:///private']) {
    expect(() => validateEndpoint('openai-compatible', url)).toThrow('INVALID_ENDPOINT');
  }
  expect(() => validateEndpoint('ollama', 'http://192.168.1.2:11434')).toThrow('INVALID_ENDPOINT');
});

test('response size is enforced while reading, without trusting content-length', async () => {
  const response = new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('x'.repeat(1024))); c.close(); } }));
  await expect(readBoundedJson(response, 100)).rejects.toThrow('PROVIDER_RESPONSE_TOO_LARGE');
});

const profile = { kind: 'openai-compatible' as const, endpoint: 'https://model.example/v1', model: 'test-model', outputTokens: 512 };
test.each(['ollama', 'openai-compatible'] as const)('preserves reported %s token usage through private IPC', async kind => {
  const response = kind === 'ollama' ? { message: { content: 'ok' }, done: true, done_reason: 'stop', prompt_eval_count: 123, eval_count: 9 } : { choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }], usage: { prompt_tokens: 123, completion_tokens: 9 } };
  const result = await complete({ ...profile, kind, endpoint: 'http://127.0.0.1:11434' }, [], { signal: new AbortController().signal, fetcher: async () => Response.json(response) });
  expect(CompletionSchema.parse(result)).toMatchObject({ usage: { inputTokens: 123, outputTokens: 9 } });
});
test('provider context error codes survive sanitization without echoing private response text', async () => {
  await expect(complete(profile, [], { signal: new AbortController().signal, fetcher: async () => Response.json({ error: { code: 'context_length_exceeded', message: 'private prompt secret' } }, { status: 400 }) })).rejects.toThrow('CONTEXT_LIMIT');
});
test.each([undefined, { prompt_tokens: -1, completion_tokens: 1 }, { prompt_tokens: '12', completion_tokens: 1 }, { prompt_tokens: 12.5, completion_tokens: 1 }])('missing or invalid provider usage stays unknown: %j', async usage => {
  const output = await complete(profile, [], { signal: new AbortController().signal, fetcher: async () => Response.json({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }], usage }) });
  expect(output).not.toHaveProperty('usage');
});
test('managed Ollama disallows silent history truncation and context shifting', async () => {
  let body: Record<string, unknown> = {};
  await complete({ ...profile, kind: 'ollama', endpoint: 'http://127.0.0.1:11434', contextTokens: 2048 }, [{ role: 'user', content: 'hello' }], {
    signal: new AbortController().signal, managedOllama: { numGpu: 0, keepAlive: -1 },
    fetcher: async (_url, init) => { body = JSON.parse(String(init.body)); return Response.json({ message: { content: 'ok' }, done: true, done_reason: 'stop' }); },
  });
  expect(body).toMatchObject({ truncate: false, shift: false, keep_alive: -1, options: { num_ctx: 2048, num_predict: 512, num_gpu: 0 } });
});
test('Ollama receives the configured context size instead of using its runtime default', async () => {
  let body: { options?: unknown } = {};
  await complete({ ...profile, kind: 'ollama', endpoint: 'http://127.0.0.1:11434', contextTokens: 8192 }, [], {
    signal: new AbortController().signal,
    fetcher: async (_url, init) => { body = JSON.parse(String(init.body)); return new Response(JSON.stringify({ message: { content: 'ok' }, done: true, done_reason: 'stop' })); },
  });
  expect(body.options).toEqual({ num_predict: 512, num_ctx: 8192 });
});
test('provider requests bind the destination and refuse automatic redirect following', async () => {
  let requestUrl = ''; let requestInit: RequestInit | undefined;
  const fetcher = async (url: string, init: RequestInit) => {
    requestUrl = url; requestInit = init;
    return new Response(JSON.stringify({ choices: [{ message: { content: 'A real response' }, finish_reason: 'stop' }] }));
  };
  const output = await complete(profile, [{ role: 'user', content: 'hello' }], { fetcher, secret: 'private-token', signal: new AbortController().signal });
  expect(requestUrl).toBe('https://model.example/v1/chat/completions');
  expect(requestInit?.redirect).toBe('error');
  expect(JSON.parse(String(requestInit?.body)).messages).toEqual([{ role: 'user', content: 'hello' }]);
  expect(output).toEqual({ content: 'A real response', outcome: 'complete' });
  expect(JSON.stringify(output)).not.toContain('private-token');
});

test('truncated, rejected and missing terminal outcomes never look successful', async () => {
  for (const [reason, outcome] of [['length', 'incomplete'], ['content_filter', 'blocked'], [undefined, 'incomplete']] as const) {
    const fetcher = async () => new Response(JSON.stringify({ choices: [{ message: { content: 'partial' }, finish_reason: reason }] }));
    expect((await complete(profile, [], { fetcher, signal: new AbortController().signal })).outcome).toBe(outcome);
  }
});

test('provider error text is not included in exceptions', async () => {
  const fetcher = async () => new Response('leaked-token and private prompt', { status: 401 });
  await expect(complete(profile, [], { fetcher, signal: new AbortController().signal })).rejects.toThrow('PROVIDER_HTTP_401');
});

test('stopped requests are never sent', async () => {
  const controller = new AbortController(); controller.abort(); let sent = false;
  await expect(complete(profile, [], { fetcher: async () => { sent = true; return new Response('{}'); }, signal: controller.signal })).rejects.toThrow('RUN_CANCELLED');
  expect(sent).toBe(false);
});

test('Ollama uses its native route and only reports complete after a stop terminal', async () => {
  let target = ''; let body: Record<string, unknown> = {};
  const fetcher = async (url: string, init: RequestInit) => {
    target = url; body = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ message: { role: 'assistant', content: 'Local reply' }, done: true, done_reason: 'stop' }));
  };
  const result = await complete({ ...profile, kind: 'ollama', endpoint: 'http://127.0.0.1:11434' }, [], { fetcher, signal: new AbortController().signal });
  expect(target).toBe('http://127.0.0.1:11434/api/chat');
  expect(body.options).toEqual({ num_predict: 512 });
  expect(body.stream).toBe(false);
  expect(result).toEqual({ content: 'Local reply', outcome: 'complete' });
});

const tools: ToolSpec[] = [{ name: 'read_file', description: 'Read a file', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false } }];
const call = { id: 'call-provider-1', name: 'read_file', input: { path: 'src/main.ts' } };
const signal = () => new AbortController().signal;
const openaiCall = { id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.input) } };

test('OpenAI sends native tools and retains IDs through assistant calls and tool results', async () => {
  const bodies: Record<string, unknown>[] = [];
  const fetcher = async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify(bodies.length === 1
      ? { choices: [{ message: { role: 'assistant', content: null, tool_calls: [openaiCall] }, finish_reason: 'tool_calls' }] }
      : { choices: [{ message: { role: 'assistant', content: 'The file contains code.' }, finish_reason: 'stop' }] }));
  };
  const first = await complete(profile, [{ role: 'user', content: 'Read it' }], { tools, fetcher, signal: signal() });
  expect(first).toEqual({ content: '', outcome: 'tool_calls', toolCalls: [call] });
  expect(bodies[0]?.tools).toEqual([{ type: 'function', function: tools[0] }]);
  const messages: InferenceMessage[] = [{ role: 'user', content: 'Read it' }, { role: 'assistant', content: first.content, toolCalls: first.toolCalls }, { role: 'tool', content: 'export const answer = 42;', toolCallId: call.id, toolName: call.name }];
  expect((await complete(profile, messages, { tools, fetcher, signal: signal() })).outcome).toBe('complete');
  expect(bodies[1]?.messages).toEqual([
    { role: 'user', content: 'Read it' },
    { role: 'assistant', content: '', tool_calls: [openaiCall] },
    { role: 'tool', content: 'export const answer = 42;', tool_call_id: call.id },
  ]);
});

test('Ollama uses object arguments and preserves native call IDs in the next request', async () => {
  const bodies: Record<string, unknown>[] = [];
  const fetcher = async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify(bodies.length === 1
      ? { message: { role: 'assistant', content: '', tool_calls: [{ id: call.id, function: { index: 0, name: call.name, arguments: call.input } }] }, done: true, done_reason: 'stop' }
      : { message: { role: 'assistant', content: 'Read it.' }, done: true, done_reason: 'stop' }));
  };
  const local = { ...profile, kind: 'ollama' as const, endpoint: 'http://127.0.0.1:11434' };
  const first = await complete(local, [], { tools, fetcher, signal: signal() });
  expect(first).toEqual({ content: '', outcome: 'tool_calls', toolCalls: [call] });
  await complete(local, [{ role: 'assistant', content: '', toolCalls: first.toolCalls }, { role: 'tool', content: 'file content', toolCallId: call.id, toolName: call.name }], { tools, fetcher, signal: signal() });
  expect(bodies[0]?.tools).toEqual([{ type: 'function', function: tools[0] }]);
  expect(bodies[1]?.messages).toEqual([
    { role: 'assistant', content: '', tool_calls: [{ id: call.id, function: { index: 0, name: call.name, arguments: call.input } }] },
    { role: 'tool', content: 'file content', tool_call_id: call.id, tool_name: call.name },
  ]);
});

test('Ollama assigns distinct canonical IDs when its response omits IDs', async () => {
  const fetcher = async () => Response.json({ message: { content: '', tool_calls: [0, 1].map(index => ({ function: { index, name: 'read_file', arguments: { path: String(index) } } })) }, done: true, done_reason: 'stop' });
  const result = await complete({ ...profile, kind: 'ollama', endpoint: 'http://127.0.0.1:11434' }, [], { tools, fetcher, signal: signal() });
  expect(result.outcome).toBe('tool_calls');
  expect(result.toolCalls).toHaveLength(2);
  expect(result.toolCalls?.[0]?.id).toMatch(/^ollama-[a-f0-9-]+$/);
  expect(result.toolCalls?.[0]?.id).not.toBe(result.toolCalls?.[1]?.id);
});

test('connection tests offer no tools and reject unsolicited tool calls', async () => {
  let body: Record<string, unknown> = {};
  const fetcher = async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return Response.json({ choices: [{ message: { content: null, tool_calls: [openaiCall] }, finish_reason: 'tool_calls' }] });
  };
  await expect(complete(profile, [], { fetcher, signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
  expect(body).not.toHaveProperty('tools');
});

test.each(['{"path":', '[]', 'null', '"text"', '{"path":1e400}'])('OpenAI rejects malformed or nonobject arguments %s', async args => {
  const fetcher = async () => Response.json({ choices: [{ message: { tool_calls: [{ ...openaiCall, function: { name: 'read_file', arguments: args } }] }, finish_reason: 'tool_calls' }] });
  await expect(complete(profile, [], { tools, fetcher, signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
});

test('duplicate IDs and unoffered tool names never become executable calls', async () => {
  for (const calls of [[openaiCall, openaiCall], [{ ...openaiCall, function: { name: 'run_unknown', arguments: '{}' } }]]) {
    const fetcher = async () => Response.json({ choices: [{ message: { tool_calls: calls }, finish_reason: 'tool_calls' }] });
    await expect(complete(profile, [], { tools, fetcher, signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
  }
});

test('incomplete or blocked OpenAI outcomes discard every tool call', async () => {
  for (const [reason, outcome] of [['length', 'incomplete'], ['content_filter', 'blocked'], [undefined, 'incomplete'], ['stop', 'incomplete']] as const) {
    const fetcher = async () => Response.json({ choices: [{ message: { content: 'partial', tool_calls: [openaiCall] }, finish_reason: reason }] });
    expect(await complete(profile, [], { tools, fetcher, signal: signal() })).toEqual({ content: 'partial', outcome });
  }
  const fetcher = async () => Response.json({ choices: [{ message: { refusal: 'Blocked', tool_calls: [openaiCall] }, finish_reason: 'tool_calls' }] });
  expect(await complete(profile, [], { tools, fetcher, signal: signal() })).toEqual({ content: 'Blocked', outcome: 'blocked' });
});

test('Ollama requires both done and stop before returning executable tool calls', async () => {
  for (const terminal of [{ done: false, done_reason: 'stop' }, { done: true, done_reason: 'length' }, { done: true }]) {
    const fetcher = async () => Response.json({ message: { content: '', tool_calls: [{ function: { name: call.name, arguments: call.input } }] }, ...terminal });
    expect(await complete({ ...profile, kind: 'ollama', endpoint: 'http://127.0.0.1:11434' }, [], { tools, fetcher, signal: signal() })).toEqual({ content: '', outcome: 'incomplete' });
  }
});

test('malformed and ambiguous tool-result transcripts are rejected before network admission', async () => {
  const assistant: InferenceMessage = { role: 'assistant', content: '', toolCalls: [call] };
  const result: InferenceMessage = { role: 'tool', content: 'text', toolCallId: call.id, toolName: call.name };
  for (const messages of [[result], [assistant], [assistant, result, result], [assistant, { ...result, toolCallId: 'different' }], [assistant, { ...result, toolName: 'different' }]]) {
    let sent = false;
    await expect(complete(profile, messages, { tools, fetcher: async () => { sent = true; return Response.json({}); }, signal: signal() })).rejects.toThrow('INVALID_INFERENCE_REQUEST');
    expect(sent).toBe(false);
  }
});

test('control messages admit bounded canonical tool data and reject wire fields', () => {
  const event = { epoch: 'e1', id: 'q1', type: 'inference', runId: 'r1', messages: [{ role: 'assistant', content: '', toolCalls: [call] }, { role: 'tool', content: 'text', toolCallId: call.id, toolName: call.name }], tools };
  expect(FromEngineSchema.safeParse(event).success).toBe(true);
  for (const messages of [[{ role: 'user', content: 'x'.repeat(2_000_001) }], [{ role: 'user', content: 'hello', toolCalls: [call] }], [{ role: 'assistant', content: '', tool_calls: [openaiCall] }], [{ role: 'tool', content: 'text' }]]) {
    expect(FromEngineSchema.safeParse({ ...event, messages }).success).toBe(false);
  }
  expect(FromEngineSchema.safeParse({ ...event, tools: [{ ...tools[0], secret: 'private' }] }).success).toBe(false);
  expect(FromEngineSchema.safeParse({ ...event, tools: Array.from({ length: 129 }, () => tools[0]) }).success).toBe(false);
  expect(CompletionSchema.safeParse({ content: '', outcome: 'tool_calls', toolCalls: [call] }).success).toBe(true);
  for (const result of [{ content: '', outcome: 'tool_calls' }, { content: '', outcome: 'tool_calls', toolCalls: [] }, { content: '', outcome: 'incomplete', toolCalls: [call] }, { content: '', outcome: 'tool_calls', toolCalls: [call, call] }, { content: 'x'.repeat(2_000_001), outcome: 'complete' }]) {
    expect(ToEngineSchema.safeParse({ epoch: 'e1', id: 'q1', type: 'inference.result', result }).success).toBe(false);
  }
});
