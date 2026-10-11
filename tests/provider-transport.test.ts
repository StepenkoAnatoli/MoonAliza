import { expect, test } from 'vitest';
import { validateEndpoint, readBoundedJson, complete, inferenceErrorCode, type InferenceMessage } from '../src/main/inference';
import { CompletionSchema, FromEngineSchema, ToEngineSchema } from '../src/engine/control';
import { PublicErrorSchema, type ToolSpec } from '../src/shared';
import { safeError } from '../src/main/bridge';

test('credentials can only target explicit HTTPS providers or loopback local runtimes', () => {
  expect(validateEndpoint('openai-compatible', 'https://api.example.com/v1/')).toEqual({ endpoint: 'https://api.example.com/v1', locality: 'external' });
  expect(validateEndpoint('ollama', 'http://127.0.0.1:11434')).toEqual({ endpoint: 'http://127.0.0.1:11434', locality: 'local' });
  for (const url of ['http://api.example.com/v1', 'https://user:password@example.com', 'https://example.com?key=secret', 'file:///private']) {
    expect(() => validateEndpoint('openai-compatible', url)).toThrow('INVALID_ENDPOINT');
  }
  expect(() => validateEndpoint('ollama', 'http://192.168.1.2:11434')).toThrow('INVALID_ENDPOINT');
});

test('a refused endpoint crosses the bridge as INVALID_ENDPOINT, not INTERNAL_ERROR', () => {
  // profile.save validates the renderer's endpoint in main; HttpUrlSchema alone admits all of these.
  for (const [kind, url] of [['openai-compatible', 'http://api.example.com/v1'], ['openai-compatible', 'https://example.com/v1?key=x'], ['ollama', 'http://192.168.1.2:11434']] as const) {
    let thrown: unknown;
    try { validateEndpoint(kind, url); } catch (error) { thrown = error; }
    const error = safeError(thrown);
    expect(error.code).toBe('INVALID_ENDPOINT');
    expect(PublicErrorSchema.safeParse(error).success).toBe(true);
    expect(error.message).not.toContain(url);
  }
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
  expect(body.stream).toBe(true);
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

// docs/research/2026-09-29-context-overflow: Ollama truncates silently when `truncate` and
// `shift` are absent (E-13), and no provider names a code for overflow (E-11).
test('every native Ollama request refuses silent truncation, not only the managed one', async () => {
  let body: Record<string, unknown> = {};
  await complete({ ...profile, kind: 'ollama', endpoint: 'http://127.0.0.1:11434' }, [], {
    signal: signal(),
    fetcher: async (_url, init) => { body = JSON.parse(String(init.body)); return Response.json({ message: { content: 'ok' }, done: true, done_reason: 'stop' }); },
  });
  expect(body).toMatchObject({ truncate: false, shift: false });
});

test('an overflow 400 becomes CONTEXT_LIMIT without its text; another 400 stays PROVIDER_HTTP_400', async () => {
  const refuse = (text: string) => async () => new Response(JSON.stringify({ error: { message: text, type: 'invalid_request_error' } }), { status: 400 });
  const overflow = complete(profile, [], { fetcher: refuse("This model's maximum context length is 128000 tokens. However, your messages resulted in 131072 tokens (private prompt)."), signal: signal() });
  await expect(overflow).rejects.toThrow('CONTEXT_LIMIT');
  await expect(overflow).rejects.not.toThrow('private prompt');
  await expect(complete(profile, [], { fetcher: refuse('the request exceeds the available context size, try increasing it'), signal: signal() })).rejects.toThrow('CONTEXT_LIMIT');
  await expect(complete(profile, [], { fetcher: refuse('Invalid value for temperature'), signal: signal() })).rejects.toThrow('PROVIDER_HTTP_400');
});

test('a context overflow crosses into the engine as CONTEXT_LIMIT, not a generic provider error', () => {
  expect(ToEngineSchema.safeParse({ epoch: 'e1', id: 'q1', type: 'inference.error', code: 'CONTEXT_LIMIT' }).success).toBe(true);
  expect(inferenceErrorCode(new Error('CONTEXT_LIMIT'))).toBe('CONTEXT_LIMIT');
  expect(inferenceErrorCode(new Error('RUN_CANCELLED'))).toBe('PROVIDER_ERROR');
  // Anything else, including a provider's own status, crosses as the generic code it always did.
  expect(inferenceErrorCode(new Error('PROVIDER_HTTP_400'))).toBe('PROVIDER_ERROR');
  expect(inferenceErrorCode('not an error')).toBe('PROVIDER_ERROR');
});


test('an unverified local Ollama crosses into the engine as LOCAL_MODEL_UNVERIFIED (More models Phase 1)', () => {
  // Guard: inferenceErrorCode passes the code through (mutation: let it fall back to PROVIDER_ERROR).
  expect(ToEngineSchema.safeParse({ epoch: 'e1', id: 'q1', type: 'inference.error', code: 'LOCAL_MODEL_UNVERIFIED' }).success).toBe(true);
  expect(inferenceErrorCode(new Error('LOCAL_MODEL_UNVERIFIED'))).toBe('LOCAL_MODEL_UNVERIFIED');
});

test.each([400, 413, 422])('overflow status %i is classified within a strict 64 KiB inspection bound', async status => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({ start(controller) {
    controller.enqueue(new TextEncoder().encode('x'.repeat(65536) + ' maximum context length private text'));
  }, cancel() { cancelled = true; } });
  const response = new Response(body, { status });
  await expect(complete(profile, [], { fetcher: async () => response, signal: signal() })).rejects.toThrow(`PROVIDER_HTTP_${status}`);
  expect(cancelled).toBe(true); expect(body.locked).toBe(false);
  await expect(complete(profile, [], { fetcher: async () => Response.json({ error: { code: 'prompt_too_long' } }, { status }), signal: signal() })).rejects.toThrow('CONTEXT_LIMIT');
});

// More models Phase 1 (docs/specification/more-models.md, design 1): a plain JSON answer follows the same
// finish_reason map as a stream. E-22 (docs/research/2026-10-05-provider-wire-formats,
// raw/2026-10-05-chat-mistral-b5c8b721.md lines 466-478): Mistral's documented 200 body. The page leaves its
// choice unfilled (`"index": "<to fill>"`, no message); the index and the message below fill it.
const mistral = (finish_reason: string) => ({
  choices: [{ finish_reason, index: 0, message: { role: 'assistant', content: 'partial' } }],
  created: '1702256327', id: 'cmpl-e5cc70bb28c444948073e77776eb30ef', model: 'mistral-small-latest', object: 'chat.completion', usage: {},
});

test('E-22: a plain JSON model_length answer is incomplete, its text kept', async () => {
  // Mistral's non-streamed finish_reason adds model_length (E-22). Guard: model_length is a known reason
  // (mutation: remove it from the known set; the call then fails).
  expect(await complete(profile, [], { fetcher: async () => Response.json(mistral('model_length')), signal: signal() })).toEqual({ content: 'partial', outcome: 'incomplete' });
});

// Failure values: Mistral's `error` (E-22), DeepSeek's `insufficient_system_resource` and `aborted` (E-20,
// raw/2026-10-05-chat-completions-api-deepseek-api-docs-deepseek-3c16da97.md lines 503-510, the non-streamed
// choice), and OpenAI's deprecated `function_call` (docs/research/2026-09-28-open-gaps,
// raw/2026-09-28-chat-openai-api-reference-openai-b5558b02.md line 116), which this adapter does not know.
test.each(['error', 'insufficient_system_resource', 'aborted', 'function_call'])('a plain JSON finish_reason of %s fails the call, never a partial answer', async reason => {
  // Guard: a finish_reason outside the known set fails the call (mutation: remove the check; it was incomplete).
  let thrown: unknown;
  try { await complete(profile, [], { fetcher: async () => Response.json(mistral(reason)), signal: signal() }); } catch (error) { thrown = error; }
  expect(thrown).toBeInstanceOf(Error);
  expect((thrown as Error).message).toBe('PROVIDER_FINISH_FAILED');
  expect(inferenceErrorCode(thrown)).toBe('PROVIDER_ERROR');
});

test('a failure finish_reason wins over a refusal, and stop, length, content_filter and tool_calls keep their outcomes', async () => {
  // Guard: the failure check runs before the blocked outcome (mutation: move it after; a refusal then hides an error).
  await expect(complete(profile, [], { fetcher: async () => Response.json({ choices: [{ message: { refusal: 'Blocked' }, finish_reason: 'error' }] }), signal: signal() })).rejects.toThrow('PROVIDER_FINISH_FAILED');
  for (const [reason, outcome] of [['stop', 'complete'], ['length', 'incomplete'], ['content_filter', 'blocked']] as const) {
    expect((await complete(profile, [], { fetcher: async () => Response.json(mistral(reason)), signal: signal() })).outcome).toBe(outcome);
  }
  expect((await complete(profile, [], { tools, fetcher: async () => Response.json({ choices: [{ message: { tool_calls: [openaiCall] }, finish_reason: 'tool_calls' }] }), signal: signal() })).outcome).toBe('tool_calls');
});
