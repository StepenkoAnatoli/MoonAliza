import { expect, test, vi } from 'vitest';
import { validateEndpoint, readBoundedJson, complete, inferenceErrorCode, checkTranscript, post, type InferenceMessage } from '../src/main/inference';
import { CompletionSchema, FromEngineSchema, PROVIDER_STATE_MAX, ProviderStateSchema, ToEngineSchema } from '../src/engine/control';
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
  // The exact init (More models Phase 2, U2 commit 3; F-5): no session cookie rides on a chat request.
  // Guard: credentials: 'omit' in post() (mutation: drop it; the init then lacks the field).
  expect(requestInit).toEqual({ method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer private-token' }, body: requestInit?.body, signal: expect.any(AbortSignal), redirect: 'error', credentials: 'omit' });
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

test('provider state rides only on an assistant tool step and a tool-call outcome, bounded and strict (More models Phase 2, U0)', () => {
  // docs/specification/more-models-phase2.md section 1. Guards: each refine and each field bound (mutations: drop the
  // message refine, drop the completion refine, loosen the format pattern, drop the data bounds, drop .strict()).
  const state = { format: 'anthropic-messages@1', appendOnly: true, data: '{"content":[]}' };
  const tool = { role: 'tool', content: 'text', toolCallId: call.id, toolName: call.name };
  const event = { epoch: 'e1', id: 'q1', type: 'inference', runId: 'r1', messages: [{ role: 'assistant', content: '', toolCalls: [call], providerState: state }, tool], tools };
  expect(FromEngineSchema.safeParse(event).success).toBe(true);
  const refused: unknown[] = [
    [{ role: 'user', content: 'x', providerState: state }],
    [{ role: 'system', content: 'x', providerState: state }],
    [{ role: 'assistant', content: 'answer', providerState: state }],
    [{ role: 'assistant', content: '', toolCalls: [call] }, { ...tool, providerState: state }],
    ...[{ ...state, data: '' }, { ...state, data: 'x' }, { ...state, data: 'x'.repeat(PROVIDER_STATE_MAX + 1) },
      { ...state, format: 'Anthropic-messages@1' }, { ...state, format: 'anthropic-messages' }, { ...state, format: 'anthropic-messages@0' },
      { ...state, format: 'anthropic-messages@1000' }, { ...state, format: `a${'b'.repeat(48)}@1` },
      { format: state.format, data: state.data }, { ...state, appendOnly: 'yes' }, { ...state, extra: 1 }]
      .map(bad => [{ role: 'assistant', content: '', toolCalls: [call], providerState: bad }, tool]),
  ];
  for (const messages of refused) expect(FromEngineSchema.safeParse({ ...event, messages }).success).toBe(false);
  expect(FromEngineSchema.safeParse({ ...event, messages: [{ role: 'assistant', content: '', toolCalls: [call], providerState: { ...state, data: 'x'.repeat(PROVIDER_STATE_MAX) } }, tool] }).success).toBe(true);
  expect(ProviderStateSchema.safeParse({ ...state, format: `a${'b'.repeat(47)}@999` }).success).toBe(true);
  const result = { content: '', outcome: 'tool_calls', toolCalls: [call], providerState: state };
  expect(ToEngineSchema.safeParse({ epoch: 'e1', id: 'q1', type: 'inference.result', result }).success).toBe(true);
  for (const outcome of ['complete', 'incomplete', 'blocked']) {
    expect(ToEngineSchema.safeParse({ epoch: 'e1', id: 'q1', type: 'inference.result', result: { content: 'x', outcome, providerState: state } }).success).toBe(false);
  }
});

test('a protocol refusal in main crosses into the engine as PROVIDER_PROTOCOL_ERROR (More models Phase 2, U0)', () => {
  // A secret in a tool call (src/main/index.ts) or, from Phase 2, in a tool step's provider state fails the step in main;
  // the engine shows that code's own message. Guards: the enum value; inferenceErrorCode's pass-through.
  expect(ToEngineSchema.safeParse({ epoch: 'e1', id: 'q1', type: 'inference.error', code: 'PROVIDER_PROTOCOL_ERROR' }).success).toBe(true);
  expect(inferenceErrorCode(new Error('PROVIDER_PROTOCOL_ERROR'))).toBe('PROVIDER_PROTOCOL_ERROR');
  expect(inferenceErrorCode(new Error('PROVIDER_INVALID_RESPONSE'))).toBe('PROVIDER_ERROR');
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

test('a plain JSON empty finish_reason is no reason: incomplete, as a stream reads it', async () => {
  // No capture shows an empty reason; this is E-22's body with its reason emptied. The stream accumulator
  // has read an empty reason as none since before Phase 1 (`if (choice.finish_reason)`), so a plain JSON
  // answer, which follows the same map as a stream, reads it the same way. Guard: the empty string counts as
  // no reason (mutation: `choice.finish_reason || null` to `?? null`; the call then fails).
  expect(await complete(profile, [], { fetcher: async () => Response.json(mistral('')), signal: signal() })).toEqual({ content: 'partial', outcome: 'incomplete' });
});

test('a failure finish_reason wins over a refusal, and stop, length, content_filter and tool_calls keep their outcomes', async () => {
  // Guard: the failure check runs before the blocked outcome (mutation: move it after; a refusal then hides an error).
  await expect(complete(profile, [], { fetcher: async () => Response.json({ choices: [{ message: { refusal: 'Blocked' }, finish_reason: 'error' }] }), signal: signal() })).rejects.toThrow('PROVIDER_FINISH_FAILED');
  for (const [reason, outcome] of [['stop', 'complete'], ['length', 'incomplete'], ['content_filter', 'blocked']] as const) {
    expect((await complete(profile, [], { fetcher: async () => Response.json(mistral(reason)), signal: signal() })).outcome).toBe(outcome);
  }
  expect((await complete(profile, [], { tools, fetcher: async () => Response.json({ choices: [{ message: { tool_calls: [openaiCall] }, finish_reason: 'tool_calls' }] }), signal: signal() })).outcome).toBe('tool_calls');
});

// More models Phase 2, U2 commit 1: pins written on the unchanged transport, before the per-kind seam
// (docs/specification/more-models-phase2.md section 4; REQUIREMENTS-P2 F-4, F-22, T-2). Each passes on the code it was
// written against and is shown red under a named mutation of that code; the seam (commit 2) must pass them unchanged.

const snapshotTools: ToolSpec[] = [tools[0]!, { name: 'list_files', description: 'List "files" in a folder', parameters: { type: 'object', properties: { path: { type: 'string' } }, additionalProperties: false } }];
const multiStep: InferenceMessage[] = [
  { role: 'system', content: 'You are a coding agent.' },
  { role: 'user', content: 'Read it' },
  { role: 'assistant', content: 'Reading.', toolCalls: [call, { id: 'call-provider-2', name: 'list_files', input: { path: '.' } }] },
  { role: 'tool', content: 'export const answer = 42;', toolCallId: call.id, toolName: call.name },
  { role: 'tool', content: 'src\nREADME.md', toolCallId: 'call-provider-2' }, // no toolName: Ollama's tool_name comes from the call
  { role: 'assistant', content: '', toolCalls: [{ id: 'call-provider-3', name: 'read_file', input: { path: 'README.md' } }] },
  { role: 'tool', content: '# Moonzila', toolCallId: 'call-provider-3', toolName: 'read_file' },
  { role: 'assistant', content: 'Done.' },
  { role: 'user', content: 'Thanks "quoted" \\ ünïcode' },
];
const chatProfile = { kind: 'openai-compatible' as const, endpoint: 'https://model.example/v1/', model: 'test-model', outputTokens: 512 };
const ollamaProfile = { kind: 'ollama' as const, endpoint: 'http://127.0.0.1:11434', model: 'qwen3:8b', outputTokens: 1024 };
const answer = (kind: string) => kind === 'ollama' ? Response.json({ message: { content: 'ok' }, done: true, done_reason: 'stop' }) : Response.json({ choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }] });
const openaiMessages = String.raw`"messages":[{"role":"system","content":"You are a coding agent."},{"role":"user","content":"Read it"},{"role":"assistant","content":"Reading.","tool_calls":[{"id":"call-provider-1","type":"function","function":{"name":"read_file","arguments":"{\"path\":\"src/main.ts\"}"}},{"id":"call-provider-2","type":"function","function":{"name":"list_files","arguments":"{\"path\":\".\"}"}}]},{"role":"tool","content":"export const answer = 42;","tool_call_id":"call-provider-1"},{"role":"tool","content":"src\nREADME.md","tool_call_id":"call-provider-2"},{"role":"assistant","content":"","tool_calls":[{"id":"call-provider-3","type":"function","function":{"name":"read_file","arguments":"{\"path\":\"README.md\"}"}}]},{"role":"tool","content":"# Moonzila","tool_call_id":"call-provider-3"},{"role":"assistant","content":"Done."},{"role":"user","content":"Thanks \"quoted\" \\ ünïcode"}]`;
const ollamaMessages = String.raw`"messages":[{"role":"system","content":"You are a coding agent."},{"role":"user","content":"Read it"},{"role":"assistant","content":"Reading.","tool_calls":[{"id":"call-provider-1","function":{"index":0,"name":"read_file","arguments":{"path":"src/main.ts"}}},{"id":"call-provider-2","function":{"index":1,"name":"list_files","arguments":{"path":"."}}}]},{"role":"tool","content":"export const answer = 42;","tool_call_id":"call-provider-1","tool_name":"read_file"},{"role":"tool","content":"src\nREADME.md","tool_call_id":"call-provider-2","tool_name":"list_files"},{"role":"assistant","content":"","tool_calls":[{"id":"call-provider-3","function":{"index":0,"name":"read_file","arguments":{"path":"README.md"}}}]},{"role":"tool","content":"# Moonzila","tool_call_id":"call-provider-3","tool_name":"read_file"},{"role":"assistant","content":"Done."},{"role":"user","content":"Thanks \"quoted\" \\ ünïcode"}]`;
const toolsJson = String.raw`"tools":[{"type":"function","function":{"name":"read_file","description":"Read a file","parameters":{"type":"object","properties":{"path":{"type":"string"}},"required":["path"],"additionalProperties":false}}},{"type":"function","function":{"name":"list_files","description":"List \"files\" in a folder","parameters":{"type":"object","properties":{"path":{"type":"string"}},"additionalProperties":false}}}]`;
const json = ['Content-Type', 'application/json'];
const snapshots: Array<[string, InferenceProfileInput, InferenceMessage[], { tools?: ToolSpec[]; secret?: string; managedOllama?: { numGpu: 0; keepAlive: -1 } }, { url: string; headers: string[][]; body: string }]> = [
  ['openai-compatible, plain', chatProfile, [{ role: 'user', content: 'hello' }], {}, {
    url: 'https://model.example/v1/chat/completions', headers: [json],
    body: String.raw`{"model":"test-model","messages":[{"role":"user","content":"hello"}],"max_completion_tokens":512,"stream_options":{"include_usage":true},"stream":true}`,
  }],
  ['openai-compatible, with tools, multi-step, keyed', { ...chatProfile, contextTokens: 32768 }, multiStep, { tools: snapshotTools, secret: 'sk-test-key' }, {
    url: 'https://model.example/v1/chat/completions', headers: [json, ['Authorization', 'Bearer sk-test-key']],
    body: `{"model":"test-model",${openaiMessages},${toolsJson},"max_completion_tokens":512,"stream_options":{"include_usage":true},"stream":true}`,
  }],
  ['ollama, plain', ollamaProfile, [{ role: 'user', content: 'hello' }], {}, {
    url: 'http://127.0.0.1:11434/api/chat', headers: [json],
    body: String.raw`{"model":"qwen3:8b","messages":[{"role":"user","content":"hello"}],"options":{"num_predict":1024},"truncate":false,"shift":false,"stream":true}`,
  }],
  ['ollama, with tools, multi-step, keyed', { ...ollamaProfile, contextTokens: 8192 }, multiStep, { tools: snapshotTools, secret: 'ollama-key' }, {
    url: 'http://127.0.0.1:11434/api/chat', headers: [json, ['Authorization', 'Bearer ollama-key']],
    body: `{"model":"qwen3:8b",${ollamaMessages},${toolsJson},"options":{"num_predict":1024,"num_ctx":8192},"truncate":false,"shift":false,"stream":true}`,
  }],
  ['ollama, managed, with tools, multi-step', { ...ollamaProfile, contextTokens: 4096 }, multiStep, { tools: snapshotTools, managedOllama: { numGpu: 0, keepAlive: -1 } }, {
    url: 'http://127.0.0.1:11434/api/chat', headers: [json],
    body: `{"model":"qwen3:8b",${ollamaMessages},${toolsJson},"options":{"num_predict":1024,"num_ctx":4096,"num_gpu":0},"truncate":false,"shift":false,"keep_alive":-1,"stream":true}`,
  }],
];
type InferenceProfileInput = Parameters<typeof complete>[0];

test.each(snapshots)('byte-exact request snapshot: %s (T-2)', async (_name, target, messages, extra, expected) => {
  // Taken on the unchanged transport (U0 base) and kept byte for byte by the seam: URL, method, headers in order, redirect
  // and the body string. Guard: any byte of the encoder (mutation: drop `shift: false` from the Ollama options).
  const sent: Array<{ url: string; init: RequestInit }> = [];
  await complete(target, messages, { ...extra, signal: signal(), fetcher: async (url, init) => { sent.push({ url, init }); return answer(target.kind); } });
  expect(sent).toHaveLength(1);
  const { url, init } = sent[0]!;
  expect({ url, method: init.method, headers: Object.entries(init.headers as Record<string, string>), redirect: init.redirect, body: init.body })
    .toEqual({ url: expected.url, method: 'POST', headers: expected.headers, redirect: 'error', body: expected.body });
});

type Refused = { profile: InferenceProfileInput; messages: InferenceMessage[]; aborted?: boolean; tools?: ToolSpec[]; secret?: string; managedOllama?: { numGpu: 0; keepAlive: -1 } };
async function refusal(input: Refused): Promise<{ error: unknown; fetched: number }> {
  let fetched = 0; const controller = new AbortController();
  if (input.aborted) controller.abort();
  try {
    await complete(input.profile, input.messages, { signal: controller.signal, ...(input.tools ? { tools: input.tools } : {}), ...(input.secret ? { secret: input.secret } : {}), ...(input.managedOllama ? { managedOllama: input.managedOllama } : {}), fetcher: async () => { fetched += 1; return answer(input.profile.kind); } });
  } catch (error) { return { error, fetched }; }
  return { error: undefined, fetched };
}
const orphanResult: InferenceMessage[] = [{ role: 'tool', content: 'text', toolCallId: call.id, toolName: call.name }];
const managed = { numGpu: 0, keepAlive: -1 } as const;
// F-4: for each adjacent pair of today's pre-checks whose errors differ, an input failing both gets the earlier check's
// error and makes no fetch. Each pin is red under the swap of its own two checks (named in the row).
const orderPins: Array<[string, Refused, string]> = [
  // Mutation: swap the cancellation check and validateEndpoint.
  ['cancellation before the endpoint', { profile: { ...chatProfile, endpoint: 'http://api.example.com/v1' }, messages: [], aborted: true }, 'RUN_CANCELLED'],
  // Mutation: swap validateEndpoint and the profile checks.
  ['the endpoint before the profile', { profile: { ...chatProfile, endpoint: 'http://api.example.com/v1', model: '' }, messages: [] }, 'INVALID_ENDPOINT'],
  // Mutation: swap the profile checks and the kind check.
  ['the profile before the kind', { profile: { ...chatProfile, kind: 'openai-responses', outputTokens: 0 }, messages: [] }, 'INVALID_PROFILE'],
  // Mutation: swap the kind check and the managed-Ollama check (managed options on a non-Ollama kind are INVALID_PROFILE).
  ['the kind before the managed-Ollama options', { profile: { ...chatProfile, kind: 'openai-responses' }, messages: [], managedOllama: managed }, 'NOT_IMPLEMENTED'],
  // Mutation: swap the managed-Ollama check and the transcript check (managed needs contextTokens).
  ['the managed-Ollama options before the transcript', { profile: ollamaProfile, messages: orphanResult, managedOllama: managed }, 'INVALID_PROFILE'],
];
test.each(orderPins)('pre-check order (F-4): %s', async (_name, input, code) => {
  const { error, fetched } = await refusal(input);
  expect((error as Error | undefined)?.message).toBe(code);
  expect(fetched).toBe(0);
});

test.each(['openai-compatible', 'ollama'] as const)('the transcript, tools and body-size checks each refuse a %s request with no fetch (F-4)', async kind => {
  // The three share INVALID_INFERENCE_REQUEST, so their relative order is not observable and is not pinned; each is
  // pinned as refusing before the fetch. Mutation, one per check: throw that check's error only after the fetch.
  const target = kind === 'ollama' ? ollamaProfile : chatProfile;
  const hello: InferenceMessage[] = [{ role: 'user', content: 'hello' }];
  const cases: Refused[] = [
    { profile: target, messages: orphanResult }, // transcript: a result with no call
    { profile: target, messages: hello, tools: [tools[0]!, tools[0]!] }, // tools: a duplicate declaration
    { profile: target, messages: Array.from({ length: 5 }, () => ({ role: 'user' as const, content: 'x'.repeat(2_000_000) })) }, // body over 8 MiB
  ];
  for (const [index, input] of cases.entries()) {
    const { error, fetched } = await refusal(input);
    expect((error as Error | undefined)?.message, `case ${index}`).toBe('INVALID_INFERENCE_REQUEST');
    expect(fetched, `case ${index}`).toBe(0);
  }
});

test('openai-responses has no adapter: NOT_IMPLEMENTED with no fetch (F-4)', async () => {
  // Guard: the kind check (mutation: admit openai-responses; it is then posted as a chat request).
  const { error, fetched } = await refusal({ profile: { ...chatProfile, kind: 'openai-responses' }, messages: [{ role: 'user', content: 'hello' }] });
  expect((error as Error | undefined)?.message).toBe('NOT_IMPLEMENTED');
  expect(fetched).toBe(0);
});

test.each(['openai-compatible', 'ollama'] as const)('a Stop that lands while a %s answer is read wins over an answer the outcome refuses', async kind => {
  // The cancellation re-check sits after the read and before the outcome (more-models-phase2.md section 4: `part.read`,
  // the re-check, `part.outcome`). The answer reads cleanly and only its outcome refuses it (a call to a tool that was not
  // offered). The Stop lands inside the read: the body is pull-based with highWaterMark 0, so it is pulled only when the
  // part reads it, and the pull presses Stop before it hands the answer over. Mutations: move the re-check after the
  // outcome, or before the read (between post() and part.read); either way the call fails as PROVIDER_INVALID_RESPONSE.
  const controller = new AbortController();
  const target = kind === 'ollama' ? ollamaProfile : chatProfile;
  const unoffered = kind === 'ollama'
    ? { message: { content: '', tool_calls: [{ function: { name: call.name, arguments: call.input } }] }, done: true, done_reason: 'stop' }
    : { choices: [{ message: { content: null, tool_calls: [openaiCall] }, finish_reason: 'tool_calls' }] };
  let stoppedBeforeRead: boolean | undefined;
  const fetcher = async () => new Response(new ReadableStream<Uint8Array>({
    pull(stream) {
      stoppedBeforeRead ??= controller.signal.aborted;
      controller.abort();
      stream.enqueue(new TextEncoder().encode(JSON.stringify(unoffered))); stream.close();
    },
  }, { highWaterMark: 0 }));
  await expect(complete(target, [{ role: 'user', content: 'hello' }], { fetcher: async () => Response.json(unoffered), signal: signal() })).rejects.toThrow('PROVIDER_INVALID_RESPONSE');
  await expect(complete(target, [{ role: 'user', content: 'hello' }], { fetcher, signal: controller.signal })).rejects.toThrow('RUN_CANCELLED');
  expect(stoppedBeforeRead, 'Stop was not pressed before the read began').toBe(false);
});

test.each(['openai-compatible', 'ollama'] as const)('a %s request still aborts at 120 s and not before (F-22 pin)', async kind => {
  // Fake timers cannot reach AbortSignal.timeout (a Node-internal timer), so on the unchanged code it is replaced for this
  // test by a setTimeout-backed signal (more-models-phase2.md section 4); after the seam the spy is no longer called and
  // complete()'s own setTimeout is the faked timer. Mutations: AbortSignal.timeout(600_000) on the unchanged code;
  // timeoutMs: 600_000 on the chat kinds after the seam.
  vi.useFakeTimers();
  vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms => { const c = new AbortController(); setTimeout(() => c.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), ms); return c.signal; });
  try {
    let seen: AbortSignal | undefined;
    const fetcher = (_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      seen = init.signal!;
      init.signal!.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
    });
    const target = kind === 'ollama' ? ollamaProfile : chatProfile;
    const outcome = complete(target, [{ role: 'user', content: 'hello' }], { fetcher, signal: signal() }).then(() => 'resolved', (error: unknown) => error);
    await vi.advanceTimersByTimeAsync(119_999);
    expect(seen, 'the request was sent').toBeDefined();
    expect(seen!.aborted, 'not aborted before 120 s').toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(seen!.aborted, 'aborted at 120 s').toBe(true);
    const error = await outcome;
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('TimeoutError');
  } finally { vi.useRealTimers(); }
});

// More models Phase 2, U2 commit 2: the per-kind seam (more-models-phase2.md section 4; REQUIREMENTS-P2 F-3, F-4, F-14,
// F-18, F-22). Each new behaviour was first seen red against the unchanged transport.

const foreignState = (format: string): InferenceMessage[] => [
  { role: 'user', content: 'Read it' },
  { role: 'assistant', content: '', toolCalls: [call], providerState: { format, appendOnly: true, data: '{"content":[]}' } },
  { role: 'tool', content: 'text', toolCallId: call.id, toolName: call.name },
];

test.each(['openai-compatible', 'ollama'] as const)('a %s request carrying any provider state is refused before any fetch (F-3)', async kind => {
  // openai-compatible and ollama own no state format. Guard: the ownership rule in checkTranscript (mutation: drop it;
  // the request is then sent, as on the U0 base).
  const target = kind === 'ollama' ? ollamaProfile : chatProfile;
  for (const format of ['anthropic-messages@1', 'other-dialect@2']) {
    const { error, fetched } = await refusal({ profile: target, messages: foreignState(format), tools });
    expect((error as Error | undefined)?.message, format).toBe('INVALID_INFERENCE_REQUEST');
    expect(fetched, format).toBe(0);
  }
});

test('the ownership refusal comes after the managed-Ollama check: invalid managed options plus a foreign state give INVALID_PROFILE (F-4)', async () => {
  // Mutation: run the ownership check before the managed-Ollama check; the call then fails INVALID_INFERENCE_REQUEST.
  const { error, fetched } = await refusal({ profile: ollamaProfile, messages: foreignState('anthropic-messages@1'), tools, managedOllama: managed });
  expect((error as Error | undefined)?.message).toBe('INVALID_PROFILE');
  expect(fetched).toBe(0);
});

test('checkTranscript keeps a state its kind owns, refuses any other, and returns the calls it saw (F-3)', () => {
  const messages = foreignState('anthropic-messages@1');
  const checked = checkTranscript(messages, ['anthropic-messages@1']);
  expect(checked.messages).toEqual(messages);
  expect([...checked.usedIds]).toEqual([call.id]);
  for (const owns of [[], ['other-dialect@1']]) expect(() => checkTranscript(messages, owns)).toThrow('INVALID_INFERENCE_REQUEST');
  // The rest is today's validation, unchanged: a result with no call is still refused.
  expect(() => checkTranscript(orphanResult, ['anthropic-messages@1'])).toThrow('INVALID_INFERENCE_REQUEST');
});

test('an anthropic endpoint is external even on loopback; the other kinds keep their labels (F-18)', () => {
  // Guard: the kind condition in validateEndpoint (mutation: label loopback local for every kind).
  expect(validateEndpoint('anthropic', 'http://127.0.0.1')).toEqual({ endpoint: 'http://127.0.0.1', locality: 'external' });
  expect(validateEndpoint('anthropic', 'http://127.0.0.1:11434/v1')).toEqual({ endpoint: 'http://127.0.0.1:11434/v1', locality: 'external' });
  expect(validateEndpoint('anthropic', 'http://localhost:8080/v1/').locality).toBe('external');
  expect(validateEndpoint('anthropic', 'https://api.anthropic.com/v1')).toEqual({ endpoint: 'https://api.anthropic.com/v1', locality: 'external' });
  expect(() => validateEndpoint('anthropic', 'http://api.anthropic.com/v1')).toThrow('INVALID_ENDPOINT');
  expect(validateEndpoint('ollama', 'http://127.0.0.1:11434').locality).toBe('local');
  // Phase 1's known limit, unchanged: a loopback openai-compatible profile is still labelled local.
  expect(validateEndpoint('openai-compatible', 'http://127.0.0.1:1234/v1').locality).toBe('local');
});

test('complete() arms one deadline timer once every pre-check has passed, and clears it when the call ends (F-22)', async () => {
  // Red on the unchanged code: AbortSignal.timeout runs on a Node-internal timer that vi.getTimerCount() cannot see.
  // Guard for the clear: remove clearTimeout from the finally (a timer is then left behind by both calls).
  vi.useFakeTimers();
  try {
    let release!: (response: Response) => void;
    const pending = complete(chatProfile, [{ role: 'user', content: 'hello' }], { signal: signal(), fetcher: () => new Promise<Response>(resolve => { release = resolve; }) });
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount(), 'one deadline while the fetch waits').toBe(1);
    release(answer('openai-compatible'));
    await pending;
    expect(vi.getTimerCount(), 'cleared once the call completes').toBe(0);
    await expect(complete(chatProfile, [{ role: 'user', content: 'hello' }], { signal: signal(), fetcher: async () => new Response('busy', { status: 503 }) })).rejects.toThrow('PROVIDER_HTTP_503');
    expect(vi.getTimerCount(), 'cleared once the call fails').toBe(0);
  } finally { vi.useRealTimers(); }
});

test.each(['openai-compatible', 'ollama'] as const)('the deadline also bounds the read: a %s body that stalls after its headers ends at 120 s (F-22)', async kind => {
  // The deadline timer is cleared in a finally around post(), part.read and part.outcome (more-models-phase2.md
  // section 4). The fake answers 200 with its headers at once and then sends nothing; like a fetch body, it errors with
  // the request signal's reason when that signal aborts. Mutation: clear the timer as soon as post() returns; the read
  // then waits past 120 s.
  vi.useFakeTimers();
  try {
    let fetched = 0;
    const fetcher = async (_url: string, init: RequestInit) => {
      fetched += 1;
      const request = init.signal!;
      return new Response(new ReadableStream<Uint8Array>({
        start(stream) { request.addEventListener('abort', () => stream.error(request.reason), { once: true }); },
      }), { headers: { 'Content-Type': kind === 'ollama' ? 'application/x-ndjson' : 'text/event-stream' } });
    };
    const target = kind === 'ollama' ? ollamaProfile : chatProfile;
    let settled = false;
    const outcome = complete(target, [{ role: 'user', content: 'hello' }], { fetcher, signal: signal() })
      .then(() => 'resolved', (error: unknown) => error).finally(() => { settled = true; });
    await vi.advanceTimersByTimeAsync(119_999);
    expect(fetched, 'the headers came back').toBe(1);
    expect(settled, 'still reading before 120 s').toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled, 'ended at 120 s').toBe(true);
    const error = await outcome;
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('TimeoutError');
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});

const preCheckRefusals: Array<[string, Refused]> = [
  ['cancellation', { profile: chatProfile, messages: [], aborted: true }],
  ['endpoint', { profile: { ...chatProfile, endpoint: 'http://api.example.com/v1' }, messages: [] }],
  ['profile', { profile: { ...chatProfile, model: '' }, messages: [] }],
  ['kind', { profile: { ...chatProfile, kind: 'openai-responses' }, messages: [] }],
  ['managed-Ollama', { profile: ollamaProfile, messages: [], managedOllama: managed }],
  ['transcript', { profile: chatProfile, messages: orphanResult }],
  ['ownership', { profile: chatProfile, messages: foreignState('anthropic-messages@1'), tools }],
  ['tools', { profile: chatProfile, messages: [], tools: [tools[0]!, tools[0]!] }],
  ['body-size', { profile: chatProfile, messages: Array.from({ length: 5 }, () => ({ role: 'user' as const, content: 'x'.repeat(2_000_000) })) }],
];
test.each(preCheckRefusals)('a call refused by the %s check leaves no timer behind (F-22)', async (_name, input) => {
  // Mutation: arm the deadline timer at the top of complete(), before the cancellation check.
  vi.useFakeTimers();
  try {
    const { error, fetched } = await refusal(input);
    expect(error).toBeInstanceOf(Error);
    expect(fetched).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});

type PostPart = Parameters<typeof post>[3];
/** A refused or accepted answer whose body records its own cancellation. */
const answerWith = (status: number, log: string[], label: string, text = `body ${label}`) => new Response(new ReadableStream<Uint8Array>({
  start(controller) { controller.enqueue(new TextEncoder().encode(text)); controller.close(); },
  cancel() { log.push(`cancelled ${label}`); },
}), { status });
function posting(part: PostPart, statuses: number[], options: { retry?: boolean; timeoutMs?: number; stop?: AbortController; deadline?: AbortController; texts?: string[] } = {}) {
  const log: string[] = []; let fetches = 0;
  const stop = options.stop ?? new AbortController();
  const fetcher = async () => {
    const status = statuses[fetches] ?? 500; const text = options.texts?.[fetches]; fetches += 1;
    log.push(`fetch ${fetches} ${status}`);
    return answerWith(status, log, String(fetches), text);
  };
  let settled = false;
  // With a deadline controller, `signal` is Stop joined with it and `stop` is Stop alone, as complete() passes them.
  const joined = options.deadline ? AbortSignal.any([stop.signal, options.deadline.signal]) : stop.signal;
  const outcome = post(fetcher, 'https://model.example/v1/x', { headers: { 'Content-Type': 'application/json' }, body: '{}', signal: joined, stop: stop.signal, deadline: Date.now() + (options.timeoutMs ?? 600_000), retry: options.retry ?? true }, part)
    .then(response => ({ status: response.status }), (error: unknown) => ({ error: (error as Error).message, ...(error instanceof DOMException ? { name: error.name } : {}) }))
    .finally(() => { settled = true; });
  return { log, outcome, stop, fetched: () => fetches, settled: () => settled };
}
const retrying = (delays: Array<number | undefined>, timeoutMs = 600_000) => ({ timeoutMs, refusalStatuses: [] as number[], isOverflow: () => false, retryDelayMs: vi.fn((_response: Response, attempt: number) => delays[attempt]) });

test('post() retries on the part\'s delay, at most twice, cancelling each refused body first (F-14)', async () => {
  // Guards: the retry count (mutation: allow three retries; the third refusal then waits again); the cancel (mutation:
  // drop it; no body is cancelled before its wait).
  vi.useFakeTimers();
  try {
    const part = retrying([1000, 2000]);
    const success = posting(part, [503, 503, 200]);
    await vi.advanceTimersByTimeAsync(999);
    expect(success.fetched()).toBe(1);
    expect(success.log).toEqual(['fetch 1 503', 'cancelled 1']);
    await vi.advanceTimersByTimeAsync(1);
    expect(success.fetched()).toBe(2);
    await vi.advanceTimersByTimeAsync(1999);
    expect(success.fetched()).toBe(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(await success.outcome).toEqual({ status: 200 });
    expect(success.log).toEqual(['fetch 1 503', 'cancelled 1', 'fetch 2 503', 'cancelled 2', 'fetch 3 200']);
    expect(part.retryDelayMs.mock.calls.map(([, attempt]) => attempt)).toEqual([0, 1]);

    const third = posting(retrying([1000, 1000, 1000]), [503, 503, 503]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(third.settled(), 'no third wait').toBe(true);
    expect(await third.outcome).toEqual({ error: 'PROVIDER_HTTP_503' });
    expect(third.fetched()).toBe(3);
    expect(third.log.at(-1)).toBe('cancelled 3');
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});

test('post() takes a wait only if it ends before the call\'s deadline (F-14, F-22)', async () => {
  // A fake part with a short timeout. Guard: the deadline comparison (mutation: drop it; the second wait is then taken).
  vi.useFakeTimers();
  try {
    const short = posting(retrying([1000, 1000], 1500), [503, 503, 200], { timeoutMs: 1500 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(short.settled(), 'the second wait is not taken').toBe(true);
    expect(await short.outcome).toEqual({ error: 'PROVIDER_HTTP_503' });
    expect(short.fetched()).toBe(2);
    // A wait that would end exactly at the deadline does not end before it.
    const exact = posting(retrying([1000], 1000), [503, 200], { timeoutMs: 1000 });
    await vi.advanceTimersByTimeAsync(0);
    expect(exact.settled(), 'a wait ending at the deadline is not taken').toBe(true);
    expect(await exact.outcome).toEqual({ error: 'PROVIDER_HTTP_503' });
    expect(exact.fetched()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});

test('Stop during a retry wait ends the call as RUN_CANCELLED with no further fetch; the deadline there ends it as itself (F-14)', async () => {
  // Each run gets its own deadline controller, so `signal` (Stop joined with the deadline) and `stop` differ, as in
  // complete(). Guards: the wait listens for the abort (mutation: a plain setTimeout wait; the call then fetches again
  // after Stop); the wait tells Stop from the deadline by the caller's own signal (mutation: pass `request.signal` to
  // pause() as its stop signal; the deadline then reads as RUN_CANCELLED). The deadline comparison keeps a wait from
  // reaching the deadline, so the second run aborts the deadline controller by hand during the wait.
  vi.useFakeTimers();
  try {
    const run = posting(retrying([1000]), [503, 200], { deadline: new AbortController() });
    await vi.advanceTimersByTimeAsync(500);
    run.stop.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(run.settled()).toBe(true);
    expect(await run.outcome).toEqual({ error: 'RUN_CANCELLED' });
    await vi.advanceTimersByTimeAsync(5000);
    expect(run.fetched()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);

    const deadline = new AbortController();
    const late = posting(retrying([1000]), [503, 200], { deadline });
    await vi.advanceTimersByTimeAsync(500);
    deadline.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    await vi.advanceTimersByTimeAsync(0);
    expect(late.settled(), 'the deadline ends the wait').toBe(true);
    expect(await late.outcome).toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(5000);
    expect(late.fetched()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});

test.each([Number.NaN, -1])('post() treats a retry delay of %s as no delay: the refusal surfaces at once, with no retry (F-14)', async delay => {
  // A delay that is not a non-negative number is no delay. Guard: `!(delay >= 0)` in post() (mutation: drop it; a NaN or
  // negative wait fires at once, so the refused request is sent again).
  vi.useFakeTimers();
  try {
    const part = retrying([delay, delay]);
    const run = posting(part, [503, 200]);
    await vi.advanceTimersByTimeAsync(0);
    expect(run.settled(), 'settled at once').toBe(true);
    expect(await run.outcome).toEqual({ error: 'PROVIDER_HTTP_503' });
    expect(run.fetched()).toBe(1);
    expect(run.log).toEqual(['fetch 1 503', 'cancelled 1']);
    expect(part.retryDelayMs).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount(), 'no wait pending').toBe(0);
  } finally { vi.useRealTimers(); }
});

test('post() never retries without a retry rule, and with retry: false never asks the rule (F-14)', async () => {
  // Guard for retry: false: post() honours the flag (mutation: ignore it; the refusal then waits and is fetched again).
  vi.useFakeTimers();
  try {
    const plain = posting({ refusalStatuses: [], isOverflow: () => false }, [503, 200]);
    await vi.advanceTimersByTimeAsync(0);
    expect(plain.settled(), 'no wait without a rule').toBe(true);
    expect(await plain.outcome).toEqual({ error: 'PROVIDER_HTTP_503' });
    expect(plain.log).toEqual(['fetch 1 503', 'cancelled 1']);
    const part = retrying([1000, 1000]);
    const once = posting(part, [503, 200], { retry: false });
    await vi.advanceTimersByTimeAsync(0);
    expect(once.settled(), 'the refusal surfaces at once').toBe(true);
    expect(vi.getTimerCount(), 'no wait pending').toBe(0);
    expect(await once.outcome).toEqual({ error: 'PROVIDER_HTTP_503' });
    expect(once.fetched()).toBe(1);
    expect(part.retryDelayMs).not.toHaveBeenCalled();
  } finally { vi.useRealTimers(); }
});

test('post() reads a refusal body only for the part\'s own statuses and asks the part\'s own overflow rule', async () => {
  // Guards: the part's refusalStatuses (mutation: today's fixed 400, 413 and 422 list), and its isOverflow (mutation:
  // today's OVERFLOW rule for every part).
  const isOverflow = vi.fn((text: string) => text === 'prompt is too long for this part');
  const part = { refusalStatuses: [409], isOverflow };
  expect(await posting(part, [409], { texts: ['prompt is too long for this part'] }).outcome).toEqual({ error: 'CONTEXT_LIMIT' });
  expect(await posting(part, [409], { texts: ['another conflict'] }).outcome).toEqual({ error: 'PROVIDER_HTTP_409' });
  expect(isOverflow.mock.calls).toEqual([['prompt is too long for this part'], ['another conflict']]);
  const unread = posting(part, [400], { texts: ["This model's maximum context length is 8192 tokens"] });
  expect(await unread.outcome).toEqual({ error: 'PROVIDER_HTTP_400' });
  expect(unread.log).toEqual(['fetch 1 400', 'cancelled 1']);
  expect(isOverflow).toHaveBeenCalledTimes(2);
});

test('an Ollama request carries the same exact init, credentials omitted (F-5)', async () => {
  // More models Phase 2, U2 commit 3. Guard: credentials: 'omit' in post() (mutation: drop it).
  let requestInit: RequestInit | undefined;
  await complete(ollamaProfile, [{ role: 'user', content: 'hello' }], { signal: signal(), fetcher: async (_url, init) => { requestInit = init; return answer('ollama'); } });
  expect(requestInit).toEqual({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestInit?.body, signal: expect.any(AbortSignal), redirect: 'error', credentials: 'omit' });
});
