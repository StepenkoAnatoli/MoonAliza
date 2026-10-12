import { createServer, type IncomingHttpHeaders } from 'node:http';

/**
 * A loopback fake of Anthropic's Messages API for e2e/anthropic.spec.ts (docs/specification/more-models-phase2.md,
 * "Tests the builders owe", Windows e2e; REQUIREMENTS-P2 T-4). It answers three requests to /v1/messages, in order:
 * the Test connection, then the two steps of one tool round trip. Each is checked as it arrives; a request that
 * fails a check, or any request beyond the three, is answered 400 `invalid_request_error` (what the live API answers
 * a replayed thinking block whose earlier request changed, E-12 l.283) and its reasons are recorded in `refusals`,
 * so the journey stops at the first wrong request and the spec can say why. A fake that accepted anything would
 * prove nothing (BREAKDOWN-P2 row U5, pre-mortem 2).
 *
 * No `/api/status` (Phase 1's P1-CI-1): Moonzila asks it only of an `ollama` profile in a local-only conversation
 * (src/main/ollama-locality.ts). This fake serves an `anthropic` profile, never checked that way, and the journey
 * makes its project cloud-allowed before the run; a status request would be refused here like any other.
 *
 * Every stream below is built from E-10 shapes and the 2026-10-12 live recordings, not a capture. It follows the
 * live framing of docs/evidence/2026-10-12-anthropic-probes/D5-think-sonnet-step1.response.raw: an `event:` line
 * equal to the data's `type` (E-10 l.63), LF line ends, exactly one `ping` (written as the live one is) right after
 * the first content_block_start, inside the open block; a thinking block that starts with `"thinking":""` and
 * `"signature":""`, then one empty thinking_delta and one signature_delta (E-10 l.135); and the live `caller` field
 * on tool_use. The live data lines' trailing space padding is left out (U3 pins it from the recordings).
 */

/** The version header Moonzila must send (E-08 l.50-54). */
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * The step-1 thinking signature: built for this test, not copied from E-10 l.407 (whose example signature is elided
 * with "..."). Base64-alphabet letters and digits only, so JSON never escapes it and one form matches at any depth of
 * nesting; long enough not to occur by chance. It reaches Moonzila only inside the provider state, so after the app
 * closes it must be found nowhere under userData (the spec's byte scan).
 */
export const SIGNATURE_MARKER = 'MoonzilaE2eSignatureMarkerQ7x9Zr4Lw2Vb8Nc5Kt3Hp6';
export const TOOL_ID = 'toolu_01MoonzilaE2eListFiles';
export const STEP1_TEXT = 'I will list the project folder first.';
export const STEP2_TEXT = 'The project folder was listed through the Anthropic fixture.';

/**
 * Step 1's content array as Moonzila must replay it in request 2: each block's start object with its deltas applied,
 * in index order, the tool input parsed from its partial JSON, every other field (`caller`) kept (E-10 l.59; the
 * D5 live step 2 replayed `caller` verbatim and was accepted).
 */
export const STEP1_REPLAY = [
  { type: 'thinking', thinking: '', signature: SIGNATURE_MARKER },
  { type: 'text', text: STEP1_TEXT },
  { type: 'tool_use', id: TOOL_ID, name: 'list_files', input: { path: '.' }, caller: { type: 'direct' } },
];

type Json = Record<string, unknown>;
interface BuiltBlock { start: Json; deltas: Json[] }

const line = (event: Json & { type: string }) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
/** Byte for byte as the live recordings write it (a space after the colon). */
const PING = 'event: ping\ndata: {"type": "ping"}\n\n';

/** One built Messages stream (built from E-10 shapes and the 2026-10-12 live recordings, not a capture). */
function stream(model: string, id: string, blocks: BuiltBlock[], stopReason: 'end_turn' | 'tool_use', outputTokens: number): string {
  const usage = { input_tokens: 512, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  let text = line({ type: 'message_start', message: { model, id, type: 'message', role: 'assistant', content: [], stop_reason: null, stop_sequence: null, usage: { ...usage, output_tokens: 3 } } });
  blocks.forEach((block, index) => {
    text += line({ type: 'content_block_start', index, content_block: block.start });
    if (index === 0) text += PING;
    for (const delta of block.deltas) text += line({ type: 'content_block_delta', index, delta });
    text += line({ type: 'content_block_stop', index });
  });
  text += line({ type: 'message_delta', delta: { stop_reason: stopReason, stop_sequence: null }, usage: { ...usage, output_tokens: outputTokens } });
  return text + line({ type: 'message_stop' });
}

/** The Test connection's answer: one text block, `end_turn`. */
const testAnswer = (model: string) => stream(model, 'msg_01MoonzilaE2eTestConnection', [
  { start: { type: 'text', text: '' }, deltas: [{ type: 'text_delta', text: 'OK.' }] },
], 'end_turn', 4);

/**
 * Step 1: a thinking block (empty thinking, the marker as its signature), a text block and a `list_files` call with
 * `{"path": "."}`, stopping with `tool_use`. `list_files` is offered in Ask mode (src/tools/reads.ts:23); E-10's
 * `get_weather` is not a Moonzila tool and would fail the step as PROVIDER_INVALID_RESPONSE.
 */
const stepOneAnswer = (model: string) => stream(model, 'msg_01MoonzilaE2eStepOne', [
  { start: { type: 'thinking', thinking: '', signature: '' }, deltas: [{ type: 'thinking_delta', thinking: '' }, { type: 'signature_delta', signature: SIGNATURE_MARKER }] },
  { start: { type: 'text', text: '' }, deltas: [{ type: 'text_delta', text: 'I will list' }, { type: 'text_delta', text: ' the project folder first.' }] },
  // The first partial_json is empty, as in E-10 l.324 and the live recordings.
  { start: { type: 'tool_use', id: TOOL_ID, name: 'list_files', input: {}, caller: { type: 'direct' } }, deltas: [{ type: 'input_json_delta', partial_json: '' }, { type: 'input_json_delta', partial_json: '{"path"' }, { type: 'input_json_delta', partial_json: ': "."}' }] },
], 'tool_use', 96);

/** Step 2: the final answer, one text block, `end_turn`. */
const stepTwoAnswer = (model: string) => stream(model, 'msg_01MoonzilaE2eStepTwo', [
  { start: { type: 'text', text: '' }, deltas: [{ type: 'text_delta', text: 'The project folder was listed' }, { type: 'text_delta', text: ' through the Anthropic fixture.' }] },
], 'end_turn', 14);

export interface AnthropicFakeExpectations {
  /** The profile's API key: every request carries `authorization: Bearer <key>`. */
  key: string;
  model: string;
  /** The profile's maximum response: every request's `max_tokens`, the Test connection's included (F-20). */
  maxTokens: number;
  /** The journey's prompt: request 1 holds exactly this one user message. */
  prompt: string;
  /** A name the step-1 tool result must contain: `list_files` really ran in the project folder. */
  toolResultIncludes: string;
}

export type Turn = 'test' | 'step1' | 'step2';
export interface RecordedRequest { turn: Turn | 'unexpected'; method: string; path: string; headers: IncomingHttpHeaders; body: Json | undefined }

export interface AnthropicFake {
  /** `http://127.0.0.1:<port>`. */
  origin: string;
  /** The profile endpoint, `<origin>/v1`: Moonzila posts to `<endpoint>/messages`. */
  endpoint: string;
  /** Every request, in arrival order, refused or not. */
  requests: RecordedRequest[];
  /** One entry per refused request: its turn and every check it failed. */
  refusals: string[];
  close(): Promise<void>;
}

const canonical = (value: unknown) => JSON.stringify(value);
const isRecord = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const toolNames = (body: Json) => Array.isArray(body.tools) ? body.tools.map(tool => isRecord(tool) ? tool.name : undefined) : [];

/**
 * The checks every request must pass, then the checks of its turn. Each returns the reasons it failed, empty when it
 * passed. The guard that turns each one red on Windows is named beside it.
 */
function check(turn: Turn, method: string, path: string, headers: IncomingHttpHeaders, body: Json | undefined, first: Json | undefined, expected: AnthropicFakeExpectations): string[] {
  const failed: string[] = [];
  const need = (holds: boolean, reason: string) => { if (!holds) failed.push(reason); };
  // Route: red under `url: endpoint => `${endpoint}/message`` in anthropicKind (src/main/anthropic.ts).
  need(method === 'POST' && path === '/v1/messages', `${method} ${path} is not POST /v1/messages`);
  // Red with the Authorization entry removed from anthropicHeaders (src/main/anthropic.ts). The key is never printed.
  need(headers.authorization === `Bearer ${expected.key}`, 'authorization is not "Bearer <the profile key>"');
  // Red with the version header removed from anthropicHeaders.
  need(headers['anthropic-version'] === ANTHROPIC_VERSION, `anthropic-version is ${String(headers['anthropic-version'])}`);
  if (!body) return [...failed, 'the body is not a JSON object'];
  need(body.model === expected.model, `model is ${canonical(body.model)}`);
  // The profile's own maximum response on every request; red when profile.test sends 32 for anthropic (F-20).
  need(body.max_tokens === expected.maxTokens, `max_tokens is ${canonical(body.max_tokens)}`);
  need(body.stream === true, 'stream is not true');
  const messages = Array.isArray(body.messages) ? body.messages as unknown[] : undefined;
  if (turn === 'test') {
    // profile.test sends one user message and no tools (src/main/index.ts).
    need(messages?.length === 1 && isRecord(messages[0]) && messages[0].role === 'user' && !Object.hasOwn(body, 'tools'), 'the Test connection is not one user message without tools');
    return failed;
  }
  if (turn === 'step1') {
    need(canonical(messages) === canonical([{ role: 'user', content: expected.prompt }]), 'request 1 is not exactly the prompt as one user message');
    // Ask mode, as the run's system message names it, offering list_files and no write tool.
    need(typeof body.system === 'string' && body.system.startsWith('You are Moonzila, a coding assistant in ask mode.'), 'the system prompt is not the Ask-mode prompt');
    need(toolNames(body).includes('list_files') && !toolNames(body).includes('write_file'), `the tools are not Ask mode's: ${canonical(toolNames(body))}`);
    return failed;
  }
  // Step 2. E-12 l.283: a replayed thinking block is accepted only while the system prompt, the tools and the
  // messages before it are unchanged. Each key compared as JSON.stringify of its parsed value, canonical because the
  // encoder is pure and fixes key order. `system` is red under a step-dependent suffix on the system message the
  // engine hands to infer (src/engine/application.ts, the `this.host.infer(...)` call; a suffix where the context is
  // assembled would be hidden by the freeze, which reuses the previous request's messages).
  if (!first) return [...failed, 'request 2 arrived without a request 1'];
  for (const key of ['system', 'tools', 'model', 'max_tokens', 'stream']) need(canonical(body[key]) === canonical(first[key]), `${key} differs from request 1`);
  const before = Array.isArray(first.messages) ? first.messages as unknown[] : [];
  // Request 2 = request 1's messages + step 1's content array + one user message of tool_result blocks only. Red
  // when the state is stripped from `current` (src/engine/application.ts, the tool step's `current.push`): the
  // encoder then refuses the assistant step before any fetch, so request 2 never arrives and the run fails.
  if (!messages || messages.length !== before.length + 2) return [...failed, `request 2 has ${messages?.length} messages, not request 1's ${before.length} + 2`];
  need(canonical(messages.slice(0, before.length)) === canonical(before), 'request 2 does not start with request 1\'s messages');
  need(canonical(messages[before.length]) === canonical({ role: 'assistant', content: STEP1_REPLAY }), `the assistant step is not step 1's content array unchanged: ${canonical(messages[before.length])}`);
  const results = messages[before.length + 1];
  const blocks = isRecord(results) && results.role === 'user' && Array.isArray(results.content) ? results.content as unknown[] : [];
  need(blocks.length > 0 && blocks.every(block => isRecord(block) && block.type === 'tool_result'), 'the last message is not a user message of tool_result blocks only');
  const answer = blocks.filter(block => isRecord(block) && block.tool_use_id === TOOL_ID);
  need(answer.length === 1 && isRecord(answer[0]) && typeof answer[0].content === 'string' && answer[0].content.includes(expected.toolResultIncludes), `no one tool_result for ${TOOL_ID} holding ${expected.toolResultIncludes}`);
  return failed;
}

/** Starts the fake on a loopback port chosen by the system (port 0), as the other e2e fakes do. */
export async function startAnthropicFake(expected: AnthropicFakeExpectations): Promise<AnthropicFake> {
  const requests: RecordedRequest[] = []; const refusals: string[] = [];
  const turns: Turn[] = ['test', 'step1', 'step2'];
  const answers: Record<Turn, (model: string) => string> = { test: testAnswer, step1: stepOneAnswer, step2: stepTwoAnswer };
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => { chunks.push(chunk); });
    request.on('end', () => {
      const method = request.method ?? ''; const path = request.url ?? '';
      let body: Json | undefined;
      try { const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8')); body = isRecord(parsed) ? parsed : undefined; } catch { body = undefined; }
      const turn = turns[requests.length];
      requests.push({ turn: turn ?? 'unexpected', method, path, headers: request.headers, body });
      const first = requests.find(item => item.turn === 'step1')?.body;
      const failed = turn ? check(turn, method, path, request.headers, body, first, expected) : [`an unexpected request: ${method} ${path}`];
      if (failed.length || !turn) {
        refusals.push(`${turn ?? 'unexpected'}: ${failed.join('; ')}`);
        response.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'Refused by the e2e fake' } }));
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' }).end(answers[turn](expected.model));
    });
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  return {
    origin, endpoint: `${origin}/v1`, requests, refusals,
    close: () => new Promise<void>(done => { server.closeAllConnections(); server.close(() => done()); }),
  };
}
