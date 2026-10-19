// Test-only. A loopback stand-in for GitHub's sign-in endpoints (docs/specification/github-sign-in.md, "Tests the builders
// owe": the loopback fake, T-2). Answers are built from E-01/E-02/E-15 shapes, not a capture: no answer, token or code here is
// copied from the research captures, and every marker is generated at run time.
//
// The fake is an http server on 127.0.0.1, port 0. fetcherFor(fake) maps https://github.com/login/... and
// https://api.github.com/... onto it, as /github.com/login/... and /api.github.com/..., and throws on any other URL, so a test
// that forgets the fake cannot reach the network. It calls the real fetch, so redirect, abort and body-streaming behave as in
// main. Each request is recorded with query keys and body keys kept apart (spec 5.2's placement pin), the header names, which
// registered marker the Authorization header carries, which registered markers appear anywhere in the request, and whether a
// client secret field appears anywhere. Values stay in memory; nothing is written to disk.
//
// U1 owns this file; U5 and U7 import it read-only.
import { randomBytes } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import type { Fetcher } from '../../src/main/github-credential';

/** Route keys: the GitHub host, then the path without its query. A key ending in `*` matches by prefix. */
export const ROUTES = {
  device: 'github.com/login/device/code',
  token: 'github.com/login/oauth/access_token',
  user: 'api.github.com/user',
} as const;

/** Run-time markers (T-1). Hex is escape-free, so JSON cannot hide one from a byte scan. `userCode` is not a secret. */
export interface Markers { access: string; refresh: string; device: string; userCode: string }
export function markers(): Markers {
  const hex = (bytes: number) => randomBytes(bytes).toString('hex');
  return { access: 'ghu_' + hex(24), refresh: 'ghr_' + hex(24), device: hex(20), userCode: `${hex(2)}-${hex(2)}`.toUpperCase() };
}

export interface FakeReply {
  /** Default 200. */
  status?: number;
  /** Sent as given; a `content-type` here replaces the one `json` or `form` implies. */
  headers?: Record<string, string>;
  /** Serialized with JSON.stringify (undefined members are dropped); `content-type: application/json` unless headers say otherwise. */
  json?: unknown;
  /** Form-encoded; `content-type: application/x-www-form-urlencoded` unless headers say otherwise. */
  form?: Record<string, string>;
  /** A raw body; no content type unless headers give one. */
  text?: string | Buffer;
  /** Written in 16 KiB pieces with no content-length (chunked), so only a streaming bound can stop it. */
  chunked?: boolean;
  /** Waits this long, in real time, before answering. */
  delayMs?: number;
  /** true: never answers. 'body': sends the headers and the first half of the body, then never finishes. */
  hang?: true | 'body';
  /** Destroys the socket without an answer. */
  reset?: boolean;
}
export type FakeAnswer = FakeReply | ((request: FakeRequest) => FakeReply | Promise<FakeReply>);

export interface FakeRequest {
  /** 1 for the first request since start or reset(). */
  seq: number;
  method: string;
  /** The GitHub host the fetcher mapped: 'github.com' or 'api.github.com'. */
  host: string;
  /** The path without its query. */
  path: string;
  queryKeys: string[];
  query: Record<string, string>;
  bodyKeys: string[];
  /** Form or JSON body members, as strings. */
  body: Record<string, string>;
  /** The request's Content-Type, as sent. */
  contentType: string | null;
  /** Lower-case, as Node reports them. */
  headerNames: string[];
  /** Every header value except Authorization's, which is recorded only by identity below. */
  headers: Record<string, string>;
  authorization: 'none' | 'marker' | 'other';
  /** The registered name of the marker an Authorization header carries as `Bearer <marker>`. */
  authorizationMarker: string | null;
  /** The registered names of every marker found anywhere in the URL, the header values or the body. */
  carries: string[];
  /** Whether a client secret field name appears anywhere in the URL, the headers or the body. */
  clientSecret: boolean;
  /** No answer was queued for the route: the fake answered 500 `fake: no answer`. */
  unanswered: boolean;
  /** Real time the request arrived. */
  at: number;
}

export interface FakeGitHubOAuth {
  /** http://127.0.0.1:<port>; fetcherFor uses it. */
  readonly origin: string;
  readonly requests: FakeRequest[];
  /** Errors thrown by answer functions (an assertion inside a handler lands here; the fake then answers 500). */
  readonly errors: unknown[];
  /** Queues answers for one route, used once each in order. */
  answer(route: string, ...answers: FakeAnswer[]): void;
  /** The answer for a route once its queue is empty. */
  always(route: string, answer: FakeAnswer): void;
  /** Names marker values, so a request records which one it carries. */
  register(values: Readonly<Record<string, string>>): void;
  /** Requests to one route. */
  to(route: string): FakeRequest[];
  /** Clears queues, fixed answers, registered markers, records and errors, and restarts `seq`. */
  reset(): void;
  close(): Promise<void>;
}

const SECRET_FIELD = ['client', 'secret'].join('_');
const realFetch = globalThis.fetch;

/** Maps the two GitHub origins the sign-in uses onto the fake; throws on anything else, before any request. */
export function fetcherFor(fake: Pick<FakeGitHubOAuth, 'origin'>): Fetcher {
  return (url, init) => {
    const target = new URL(url);
    const plain = target.protocol === 'https:' && target.port === '' && target.username === '' && target.password === '';
    const host = !plain ? null : target.hostname === 'github.com' && target.pathname.startsWith('/login/') ? 'github.com' : target.hostname === 'api.github.com' ? 'api.github.com' : null;
    if (!host) throw new Error(`FAKE_GITHUB_UNROUTED ${target.protocol}//${target.host}`);
    return realFetch(`${fake.origin}/${host}${target.pathname}${target.search}`, init);
  };
}

function mediaType(value: string | null): string {
  return (value ?? '').split(';', 1)[0]!.trim().toLowerCase();
}

function bodyRecord(raw: Buffer, contentType: string | null): Record<string, string> {
  const text = raw.toString('utf8');
  if (mediaType(contentType) === 'application/json') {
    try {
      const value: unknown = JSON.parse(text);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === 'string' ? item : JSON.stringify(item)]));
    } catch { /* Recorded as no members. */ }
    return {};
  }
  return text === '' ? {} : Object.fromEntries(new URLSearchParams(text));
}

export async function startFakeGitHubOAuth(): Promise<FakeGitHubOAuth> {
  if (process.env.NODE_USE_ENV_PROXY && !(process.env.NO_PROXY ?? process.env.no_proxy ?? '').split(',').map(item => item.trim()).includes('127.0.0.1')) {
    throw new Error('FAKE_GITHUB_PROXY: NODE_USE_ENV_PROXY is set and NO_PROXY does not list 127.0.0.1');
  }
  const requests: FakeRequest[] = []; const errors: unknown[] = [];
  const queues = new Map<string, FakeAnswer[]>(); const fixed = new Map<string, FakeAnswer>(); const registered = new Map<string, string>();
  const sockets = new Set<Socket>(); const timers = new Set<NodeJS.Timeout>();
  let seq = 0; let closed = false;

  const pick = (key: string): FakeAnswer | undefined => {
    const queued = queues.get(key)?.shift(); if (queued) return queued;
    const exact = fixed.get(key); if (exact) return exact;
    const prefix = [...new Set([...queues.keys(), ...fixed.keys()])].filter(route => route.endsWith('*') && key.startsWith(route.slice(0, -1))).sort((a, b) => b.length - a.length);
    for (const route of prefix) { const answer = queues.get(route)?.shift() ?? fixed.get(route); if (answer) return answer; }
    return undefined;
  };
  const wait = (ms: number) => new Promise<void>(resolve => { const timer = setTimeout(() => { timers.delete(timer); resolve(); }, ms); timers.add(timer); });

  async function reply(request: http.IncomingMessage, response: http.ServerResponse, raw: Buffer) {
    const url = new URL(request.url ?? '/', 'http://fake.invalid');
    const [, host = '', ...rest] = url.pathname.split('/');
    const path = '/' + rest.join('/');
    const contentType = request.headers['content-type'] ?? null;
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(request.headers)) if (name !== 'authorization' && value !== undefined) headers[name] = Array.isArray(value) ? value.join(', ') : value;
    const header = request.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    const named = bearer === undefined ? undefined : [...registered].find(([, value]) => value === bearer)?.[0];
    const haystack = [request.url ?? '', ...Object.keys(request.headers), ...Object.values(request.headers).flat().map(String), raw.toString('utf8')].join('\n');
    const body = bodyRecord(raw, contentType);
    const record: FakeRequest = {
      seq: ++seq, method: request.method ?? '', host, path, queryKeys: [...url.searchParams.keys()], query: Object.fromEntries(url.searchParams),
      bodyKeys: Object.keys(body), body, contentType, headerNames: Object.keys(request.headers), headers,
      authorization: header === undefined ? 'none' : named ? 'marker' : 'other', authorizationMarker: named ?? null,
      carries: [...registered].filter(([, value]) => haystack.includes(value)).map(([name]) => name),
      clientSecret: haystack.toLowerCase().includes(SECRET_FIELD), unanswered: false, at: Date.now(),
    };
    requests.push(record);
    const answer = pick(`${host}${path}`);
    if (!answer) { record.unanswered = true; response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ message: 'fake: no answer' })); return; }
    let chosen: FakeReply;
    try { chosen = typeof answer === 'function' ? await answer(record) : answer; } catch (error) {
      errors.push(error); response.writeHead(500, { 'content-type': 'application/json' }); response.end(JSON.stringify({ message: 'fake: handler failed' })); return;
    }
    if (chosen.delayMs) await wait(chosen.delayMs);
    if (closed || chosen.hang === true) return;
    if (chosen.reset) { request.socket.destroy(); return; }
    const out: Record<string, string> = {};
    let payload: Buffer = Buffer.alloc(0);
    if (chosen.json !== undefined) { out['content-type'] = 'application/json'; payload = Buffer.from(JSON.stringify(chosen.json), 'utf8'); }
    else if (chosen.form !== undefined) { out['content-type'] = 'application/x-www-form-urlencoded'; payload = Buffer.from(new URLSearchParams(chosen.form).toString(), 'utf8'); }
    else if (chosen.text !== undefined) payload = Buffer.isBuffer(chosen.text) ? chosen.text : Buffer.from(chosen.text, 'utf8');
    for (const [name, value] of Object.entries(chosen.headers ?? {})) out[name.toLowerCase()] = value;
    if (chosen.hang === 'body') { response.writeHead(chosen.status ?? 200, out); response.write(payload.subarray(0, Math.max(1, payload.length >> 1))); return; }
    if (!chosen.chunked) { response.writeHead(chosen.status ?? 200, out); response.end(payload); return; }
    response.writeHead(chosen.status ?? 200, out);
    for (let offset = 0; offset < payload.length; offset += 16_384) response.write(payload.subarray(offset, offset + 16_384));
    response.end();
  }

  const server = http.createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => { reply(request, response, Buffer.concat(chunks)).catch(error => { errors.push(error); request.socket.destroy(); }); });
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve(); }); });
  const { port } = server.address() as AddressInfo;

  return {
    origin: `http://127.0.0.1:${port}`, requests, errors,
    answer(route, ...answers) { queues.set(route, [...(queues.get(route) ?? []), ...answers]); },
    always(route, answer) { fixed.set(route, answer); },
    register(values) { for (const [name, value] of Object.entries(values)) registered.set(name, value); },
    to(route) { return requests.filter(request => `${request.host}${request.path}` === route); },
    reset() { queues.clear(); fixed.clear(); registered.clear(); requests.length = 0; errors.length = 0; seq = 0; },
    async close() {
      closed = true;
      for (const timer of timers) clearTimeout(timer); timers.clear();
      for (const socket of sockets) socket.destroy();
      await new Promise<void>(resolve => server.close(() => resolve()));
    },
  };
}

/** A step-1 answer (E-01 l.122-132 shape). Pass a member as undefined to drop it. */
export function codeAnswer(m: Markers, fields: Record<string, unknown> = {}, status = 200): FakeReply {
  return { status, json: { device_code: m.device, user_code: m.userCode, verification_uri: 'https://github.com/login/device', expires_in: 900, interval: 5, ...fields } };
}

/** A token answer (E-01 l.173-178, E-02 l.72-79 shape). Pass a member as undefined to drop it. */
export function tokenAnswer(m: Pick<Markers, 'access' | 'refresh'>, fields: Record<string, unknown> = {}, status = 200): FakeReply {
  return { status, json: { access_token: m.access, expires_in: 28_800, refresh_token: m.refresh, refresh_token_expires_in: 15_897_600, scope: '', token_type: 'bearer', ...fields } };
}

/** An OAuth error answer (E-01 l.152-165): an `error` member at any status. */
export function errorAnswer(code: string, status = 200, fields: Record<string, unknown> = {}): FakeReply {
  return { status, json: { error: code, ...fields } };
}
