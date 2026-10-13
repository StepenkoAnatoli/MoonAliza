/**
 * The GitHub sign-in wire (docs/specification/github-sign-in.md 3.5 and 5; owned by U1). The exact requests of the device flow,
 * the refresh and the login read; one classifier for every OAuth answer; the rate-limit wait; the shape checks. It is stateless:
 * the lifecycle service (src/main/github-signin.ts) owns the flow, the account and the holds.
 *
 * - Nothing here rejects. Every failure is a result kind (3.9 layer 1), and no result carries GitHub's response text.
 * - Each request is dispatched synchronously, before the call returns, so the service can call it inside vault.withSecret (3.8).
 *   The part that awaits the answer never sees the parameters or the Authorization value (L-7, DC-9).
 */
import { GitHubLoginSchema, GitHubUserCodeSchema } from '../shared/github-account';
import { DEVICE_CODE_URL, DEVICE_PAGE_URL, TOKEN_URL, USER_URL } from './github-app';
import type { Fetcher } from './github-credential';

export interface WireLimits { requestTimeoutMs: number; maxBodyBytes: number; rateLimitFloorMs: number; rateLimitCeilingMs: number }
export type DeviceCodeResult =
  | { kind: 'code'; deviceCode: string; userCode: string; expiresInS: number; intervalS: number }
  | { kind: 'rate-limited'; waitMs: number }
  | { kind: 'error'; code: string }        // `error` at any status; code matches /^[a-z_]{1,64}$/, otherwise 'unknown'
  | { kind: 'failed' };                   // thrown, timeout, 3xx, non-2xx without error, oversize, unparseable, a bad field, verification_uri not the constant
export interface IssuedTokens { access: string; refresh: string | null; accessExpiresInS: number | null; refreshExpiresInS: number | null }
export type TokenResult =
  | { kind: 'tokens'; tokens: IssuedTokens; receivedAt: number }
  | { kind: 'rate-limited'; waitMs: number }
  | { kind: 'error'; code: string; intervalS: number | null }
  | { kind: 'malformed' }                 // 2xx whose access_token is present but fails the shape check, or whose expiry fields do
  | { kind: 'unusable'; status: number }  // 3xx, a non-2xx below 500 without `error`, or a 2xx without access_token; status keys the GS-2 count
  | { kind: 'transient' };                // thrown, timeout, 5xx, oversize, unparseable

const USER_AGENT = 'MoonAliza-github-sign-in';                // frozen in U0 (BREAKDOWN, "Frozen names")
const MAX_TOKEN_LENGTH = 16_384;                              // keeps a token within the vault's 32 KiB bound (5.5)
const HEADER_SAFE = /^[\x21-\x7E\xA1-\xFF]+$/;                // what a header value can carry; no other character set assumed (E-10 l.145)
const ERROR_CODE = /^[a-z_]{1,64}$/;
const DEVICE_CODE = /^[\x21-\x7E]{1,1024}$/;                  // no length assumed; E-01 l.128 says 40
const FORM_INTEGER = /^\d{1,10}$/;
const RETRY_AFTER = /^\d{1,4}$/;
const EPOCH_SECONDS = /^\d{1,12}$/;
const HOUR_MS = 3_600_000;

type Fields = Readonly<Record<string, string | number>>;
/** A parsed answer body: a flat object of strings and numbers, and whether it was a form body (its integers are digit strings). */
interface Parsed { fields: Fields; form: boolean }
/** What the one classifier (5.3) makes of an answer, before step 1 or a token request reads it. */
type Classified =
  | { kind: 'transient' }                                       // rows 1, 4 and 7
  | { kind: 'redirect'; status: number }                        // row 2
  | { kind: 'rate-limited'; waitMs: number }                    // row 3
  | { kind: 'error'; code: string; intervalS: number | null }   // row 5
  | { kind: 'ok'; status: number; body: Parsed; receivedAt: number }   // row 6
  | { kind: 'other'; status: number };                          // row 8

/** 5.2: the only place client_id, scope, device_code, grant_type and refresh_token are placed. A form-encoded body, as GitHub's own
 *  device-flow tutorial sends both its requests (E-21 l.300-304, l.315-322), with no query on the URL; the refresh follows the poll to
 *  the same endpoint (an inference DO-1 and DO-2 check). There is no fallback to another placement: a refresh token is single-use. */
export function oauthRequest(url: string, params: Readonly<Record<string, string>>, signal: AbortSignal): { url: string; init: RequestInit } {
  return { url, init: { method: 'POST', redirect: 'manual', credentials: 'omit', cache: 'no-store', signal,
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    body: new URLSearchParams(params).toString() } };
}

/** 5.4: null unless the answer is a rate limit (5.3 row 3); otherwise the wait, at least 1 s (DC-12) and at most the ceiling. */
export function rateLimitWait(response: Response, nowMs: number, limits: WireLimits): number | null {
  const { status, headers } = response;
  const retryAfter = headers.get('retry-after'); const remaining = headers.get('x-ratelimit-remaining'); const reset = headers.get('x-ratelimit-reset');
  if (!(status === 429 || (status === 403 && (remaining === '0' || retryAfter !== null)))) return null;     // E-15 l.32-38, R2-4
  let waitMs = limits.rateLimitFloorMs;
  if (retryAfter !== null && RETRY_AFTER.test(retryAfter) && Number(retryAfter) <= 3_600) waitMs = Number(retryAfter) * 1_000;
  else if (remaining === '0' && reset !== null && EPOCH_SECONDS.test(reset) && Number(reset) * 1_000 - nowMs < HOUR_MS) waitMs = Math.max(limits.rateLimitFloorMs, Number(reset) * 1_000 - nowMs);
  return Math.min(Math.max(waitMs, 1_000), limits.rateLimitCeilingMs);
}

/** 5.5: a string longer than its prefix, at most 16,384 characters, every character one a header value can carry. */
export function headerSafeToken(value: unknown, prefix: 'ghu_' | 'ghr_'): value is string {
  return typeof value === 'string' && value.length > prefix.length && value.length <= MAX_TOKEN_LENGTH && value.startsWith(prefix) && HEADER_SAFE.test(value);
}

/** Step 1 (5.1). offlineAccess adds scope=offline_access; the service passes REQUEST_OFFLINE_ACCESS (3.1, DC-3, GS-5). */
export function requestDeviceCode(fetcher: Fetcher, clientId: string, offlineAccess: boolean, signal: AbortSignal, limits: WireLimits, now: () => number): Promise<DeviceCodeResult> {
  const { url, init } = oauthRequest(DEVICE_CODE_URL, offlineAccess ? { client_id: clientId, scope: 'offline_access' } : { client_id: clientId }, bounded(signal, limits));
  return deviceCodeResult(classify(dispatch(fetcher, url, init), limits, now));
}

/** A poll or a refresh (5.1): the caller names the parameters, oauthRequest places them. */
export function requestToken(fetcher: Fetcher, params: Readonly<Record<string, string>>, signal: AbortSignal, limits: WireLimits, now: () => number): Promise<TokenResult> {
  const { url, init } = oauthRequest(TOKEN_URL, params, bounded(signal, limits));
  return tokenResult(classify(dispatch(fetcher, url, init), limits, now));
}

/** One GET /user; dispatches synchronously (call it inside withSecret); the 5.1 options (redirect 'manual', credentials 'omit',
 *  cache 'no-store', the caller's signal, here also bounded by requestTimeoutMs, GS-8); 64 KiB; keeps only `login`; any failure,
 *  a 3xx included, is null. */
export function fetchLogin(fetcher: Fetcher, authorization: string, signal: AbortSignal, limits: WireLimits): Promise<string | null> {
  return loginOf(dispatch(fetcher, USER_URL, { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', signal: bounded(signal, limits),
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': USER_AGENT, Authorization: authorization } }), limits);
}

/** 5.1: the owner's signal combined with this request's own timeout. */
function bounded(signal: AbortSignal, limits: WireLimits): AbortSignal {
  return AbortSignal.any([signal, AbortSignal.timeout(limits.requestTimeoutMs)]);
}

/** Calls the fetcher now, before any await; a synchronous throw becomes a rejection, which the readers below treat as row 1. */
function dispatch(fetcher: Fetcher, url: string, init: RequestInit): Promise<Response> {
  try { return fetcher(url, init); } catch (error) { return Promise.reject(error); }
}

/** At most maxBytes, checked against the declared content-length and while streaming; null when over, or when the read fails.
 *  The body is always cancelled and released. */
async function readBounded(response: Response, maxBytes: number): Promise<Uint8Array | null> {
  const declared = response.headers.get('content-length');
  if (declared !== null && !(/^\d{1,16}$/.test(declared) && Number(declared) <= maxBytes)) { await response.body?.cancel().catch(() => {}); return null; }
  if (!response.body) return new Uint8Array(0);
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.byteLength; if (length > maxBytes) return null;
      chunks.push(part.value);
    }
  } catch { return null; } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  return Buffer.concat(chunks);
}

/** 5.3 row 4: parsed by the media type, compared case-insensitively before `;`; any other type is unparseable. */
function parseBody(bytes: Uint8Array, contentType: string | null): Parsed | null {
  const media = (contentType ?? '').split(';', 1)[0]!.trim().toLowerCase();
  const form = media === 'application/x-www-form-urlencoded' || media === 'text/plain';
  if (!form && media !== 'application/json') return null;
  let value: unknown;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    value = form ? Object.fromEntries(new URLSearchParams(text)) : JSON.parse(text);
  } catch {
    return null;   // replaced, with no cause: a JSON SyntaxError quotes the body, and a token answer's body holds tokens (5.3, DC-9)
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  if (!Object.values(value).every(item => typeof item === 'string' || (typeof item === 'number' && Number.isFinite(item)))) return null;
  return { fields: value as Fields, form };
}

function field(body: Parsed, name: string): string | number | undefined {
  return Object.hasOwn(body.fields, name) ? body.fields[name] : undefined;
}

/** An integer of 0 or more: a JSON number, or in a form body a string of 1 to 10 digits (5.5). */
function integer(body: Parsed, name: string): number | null {
  const value = field(body, name);
  if (body.form) return typeof value === 'string' && FORM_INTEGER.test(value) ? Number(value) : null;
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 9_999_999_999 ? value : null;
}

/** The one classifier (5.3), in its order. `error_description`, `error_uri` and every other member are never read here. */
async function classify(sent: Promise<Response>, limits: WireLimits, now: () => number): Promise<Classified> {
  let response: Response;
  try { response = await sent; } catch { return { kind: 'transient' }; }                                         // 1: thrown or timed out
  const receivedAt = now();
  let read = false;
  try {
    if (response.status >= 300 && response.status < 400) return { kind: 'redirect', status: response.status };    // 2: never followed
    const waitMs = rateLimitWait(response, receivedAt, limits);
    if (waitMs !== null) return { kind: 'rate-limited', waitMs };                                                  // 3: before the body
    read = true;
    const bytes = await readBounded(response, limits.maxBodyBytes);
    const body = bytes && parseBody(bytes, response.headers.get('content-type'));
    if (!body) return { kind: 'transient' };                                                                       // 4: oversize, unparseable
    const error = field(body, 'error');
    if (typeof error === 'string') return { kind: 'error', code: ERROR_CODE.test(error) ? error : 'unknown', intervalS: integer(body, 'interval') };   // 5: any status (R2-5)
    if (response.ok) return { kind: 'ok', status: response.status, body, receivedAt };                             // 6: the shape check follows
    if (response.status >= 500) return { kind: 'transient' };                                                      // 7
    return { kind: 'other', status: response.status };                                                             // 8
  } finally {
    if (!read) await response.body?.cancel().catch(() => {});
  }
}

async function deviceCodeResult(classified: Promise<Classified>): Promise<DeviceCodeResult> {
  const answer = await classified;
  if (answer.kind === 'rate-limited') return { kind: 'rate-limited', waitMs: answer.waitMs };
  if (answer.kind === 'error') return { kind: 'error', code: answer.code };
  if (answer.kind !== 'ok') return { kind: 'failed' };
  const { body } = answer;
  const deviceCode = field(body, 'device_code'); const userCode = field(body, 'user_code'); const expiresInS = integer(body, 'expires_in');
  const intervalS = field(body, 'interval') === undefined ? 5 : integer(body, 'interval');                         // E-01 l.132: default 5
  if (field(body, 'verification_uri') !== DEVICE_PAGE_URL) return { kind: 'failed' };                              // exactly, or fail closed (F-2)
  if (typeof deviceCode !== 'string' || !DEVICE_CODE.test(deviceCode)) return { kind: 'failed' };
  if (typeof userCode !== 'string' || !GitHubUserCodeSchema.safeParse(userCode).success) return { kind: 'failed' };
  if (expiresInS === null || expiresInS < 1 || intervalS === null || intervalS < 1 || intervalS > 300) return { kind: 'failed' };
  return { kind: 'code', deviceCode, userCode, expiresInS, intervalS };
}

async function tokenResult(classified: Promise<Classified>): Promise<TokenResult> {
  const answer = await classified;
  if (answer.kind === 'transient') return { kind: 'transient' };
  if (answer.kind === 'redirect' || answer.kind === 'other') return { kind: 'unusable', status: answer.status };
  if (answer.kind === 'rate-limited') return { kind: 'rate-limited', waitMs: answer.waitMs };
  if (answer.kind === 'error') return { kind: 'error', code: answer.code, intervalS: answer.intervalS };
  const { body } = answer;
  const access = field(body, 'access_token');
  if (access === undefined) return { kind: 'unusable', status: answer.status };
  if (!headerSafeToken(access, 'ghu_')) return { kind: 'malformed' };
  if (field(body, 'expires_in') === undefined) {                                                                   // non-expiring: never refreshed (E-01 l.173-178)
    return { kind: 'tokens', tokens: { access, refresh: null, accessExpiresInS: null, refreshExpiresInS: null }, receivedAt: answer.receivedAt };
  }
  const refresh = field(body, 'refresh_token'); const accessExpiresInS = integer(body, 'expires_in'); const refreshExpiresInS = integer(body, 'refresh_token_expires_in');
  if (accessExpiresInS === null || accessExpiresInS < 1 || !headerSafeToken(refresh, 'ghr_') || refreshExpiresInS === null || refreshExpiresInS < 1) return { kind: 'malformed' };
  return { kind: 'tokens', tokens: { access, refresh, accessExpiresInS, refreshExpiresInS }, receivedAt: answer.receivedAt };
}

async function loginOf(sent: Promise<Response>, limits: WireLimits): Promise<string | null> {
  let response: Response;
  try { response = await sent; } catch { return null; }
  if (!response.ok) { await response.body?.cancel().catch(() => {}); return null; }                                // a 3xx included: never followed
  const bytes = await readBounded(response, limits.maxBodyBytes);
  if (!bytes) return null;
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { return null; }      // replaced, with no cause
  if (typeof value !== 'object' || value === null || Array.isArray(value) || !Object.hasOwn(value, 'login')) return null;
  const login = GitHubLoginSchema.safeParse((value as { login: unknown }).login);
  return login.success ? login.data : null;
}
