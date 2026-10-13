import { z } from 'zod';
import { parseGitHubInput, type GitHubInput } from '../shared/github';
import { isSensitiveContextPath } from '../tools/paths';
import { SIGNED_OUT, type Fetcher, type GitHubCredential } from './github-credential';

const MAX_RESPONSE = 2_097_152;
const MAX_FILE = 262_144;
/** A signed-in 403's body is read this far, never echoed, to find E-15's missing-permission phrase (spec 7.2 step 4). */
const MAX_FORBIDDEN_BODY = 65_536;
const PERMISSION_MISSING = 'Resource not accessible by integration';
const entrySchema = z.object({ type: z.string(), path: z.string().max(1024), name: z.string().max(255), size: z.number().nonnegative().optional(), submodule_git_url: z.unknown().optional() });
/** Reads at most `limit` bytes as non-fatal UTF-8, then cancels and releases the body, so the caller's finally finds it unlocked. */
async function boundedText(response: Response, limit: number, signal: AbortSignal): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try { while (length < limit) {
    const part = await reader.read(); if (signal.aborted) throw new Error('RUN_CANCELLED'); if (part.done) break;
    const kept = part.value.subarray(0, limit - length); chunks.push(kept); length += kept.byteLength;
  } } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  return new TextDecoder('utf-8').decode(Buffer.concat(chunks));
}
/**
 * One reader per active run: commit pins cannot bleed across runs or conversations.
 * `credential` signs a read when the user is signed in to GitHub (docs/specification/github-sign-in.md 3.4, 7.1); `redact` is
 * main's vault redaction, for private file text (spec 7.3). Without them, a read is exactly today's unauthenticated request.
 */
export class GitHubReader {
  private readonly commits = new Map<string, string>();
  constructor(private readonly fetcher: Fetcher = fetch, private readonly credential: GitHubCredential = SIGNED_OUT,
              private readonly redact?: (text: string) => Promise<string>) {}
  private async request(route: string, signal: AbortSignal): Promise<unknown> {
    if (signal.aborted) throw new Error('RUN_CANCELLED');
    const url = `https://api.github.com${route}`;
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'MoonAliza-public-repository-reader' };
    const init: RequestInit = { method: 'GET', redirect: 'manual', credentials: 'omit', cache: 'no-store', signal, headers };
    // Signed out, the fetcher gets this very init: today's request (L-10). Signed in, the same plus Authorization only, dispatched
    // synchronously inside send() (F-13); nothing here keeps the value. A failed send() is never retried without it (no fallback).
    const { response, authenticated } = await this.credential.send(authorization => this.fetcher(url, authorization === undefined ? init
      : { ...init, headers: { ...headers, Authorization: authorization } }), signal);
    try {
      if (signal.aborted) throw new Error('RUN_CANCELLED');
      // Today's order (spec 7.2): a 3xx is never followed, a 404 is never a 403 or a 429, and rate limits come before any 403 cause.
      if (response.status >= 300 && response.status < 400) throw new Error('GITHUB_REDIRECT');
      if (response.status === 404) throw new Error(authenticated ? 'GITHUB_NOT_FOUND_SIGNED_IN' : 'GITHUB_NOT_FOUND');
      if (response.status === 429 || (response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after')))) throw new Error('GITHUB_RATE_LIMIT');
      // X-Accepted-GitHub-Permissions is a hint only, never the test (E-04 l.77, E-15 l.110).
      if (authenticated && response.status === 403) throw new Error((await boundedText(response, MAX_FORBIDDEN_BODY, signal)).includes(PERMISSION_MISSING) ? 'GITHUB_PERMISSION_MISSING' : 'GITHUB_FORBIDDEN_SIGNED_IN');
      // send() handles an authenticated 401 (spec 6.4), so only a signed-out one is a refusal here; anything else is unavailable.
      if (!authenticated && (response.status === 401 || response.status === 403)) throw new Error('GITHUB_FORBIDDEN');
      if (!response.ok) throw new Error('GITHUB_UNAVAILABLE');
      if (Number(response.headers.get('content-length') ?? 0) > MAX_RESPONSE) throw new Error('GITHUB_TOO_LARGE');
      if (!response.body) throw new Error('GITHUB_INVALID_RESPONSE');
      const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
      try { for (;;) {
        const part = await reader.read(); if (signal.aborted) throw new Error('RUN_CANCELLED'); if (part.done) break;
        length += part.value.byteLength; if (length > MAX_RESPONSE) throw new Error('GITHUB_TOO_LARGE'); chunks.push(part.value);
      } } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))); } catch { throw new Error('GITHUB_INVALID_RESPONSE'); }
    } finally { if (!response.body?.locked) await response.body?.cancel().catch(() => {}); }
  }
  async read(value: GitHubInput, allowed: readonly string[], stop: AbortSignal): Promise<string> {
    const input = parseGitHubInput(value);
    if (!allowed.includes(input.repository)) throw new Error('GITHUB_SCOPE_REQUIRED');
    if (isSensitiveContextPath(input.path)) throw new Error('GITHUB_PATH_EXCLUDED');
    const timeout = AbortSignal.timeout(20_000); const signal = AbortSignal.any([stop, timeout]);
    try {
      const base = `/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`;
      const key = `${input.repository}:${input.ref}`; let commit = this.commits.get(key);
      if (!commit) {
        const result = z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/) }).safeParse(await this.request(`${base}/commits/${encodeURIComponent(input.ref)}`, signal));
        if (!result.success) throw new Error('GITHUB_INVALID_RESPONSE'); commit = result.data.sha; this.commits.set(key, commit);
      }
      const encodedPath = input.path.split('/').map(encodeURIComponent).join('/');
      const data = await this.request(`${base}/contents/${encodedPath}?ref=${commit}`, signal);
      const prefix = `https://github.com/${input.owner}/${input.repo}`;
      const identity = { repository: input.repository, commit, path: input.path };
      let result: object;
      if (Array.isArray(data)) {
        const entries = z.array(entrySchema).max(1000).safeParse(data); if (!entries.success) throw new Error('GITHUB_INVALID_RESPONSE');
        const visible = entries.data.filter(entry => ['file', 'dir'].includes(entry.type) && !entry.submodule_git_url && !isSensitiveContextPath(entry.path));
        const selected: object[] = [];
        for (const entry of visible) {
          const parent = input.path ? `${input.path}/` : '';
          if (entry.path !== parent + entry.name || entry.name.includes('/') || (entry.path.includes('\\') || [...entry.path].some(char => char.charCodeAt(0) < 32)) || ['.', '..'].includes(entry.name)) throw new Error('GITHUB_INVALID_RESPONSE');
          const item = { path: entry.path, type: entry.type === 'dir' ? 'directory' : 'file' };
          if (selected.length >= 200 || JSON.stringify(selected).length + JSON.stringify(item).length > 35000) break;
          selected.push(item);
        }
        result = { ...identity, kind: 'directory', url: `${prefix}/tree/${commit}${encodedPath ? '/' + encodedPath : ''}`, entries: selected, truncated: data.length >= 1000 || selected.length < visible.length, excludedEntries: entries.data.length - visible.length };
      } else {
        const file = z.object({ type: z.literal('file'), size: z.number().int().nonnegative().max(MAX_FILE), path: z.literal(input.path), encoding: z.literal('base64'), content: z.string().max(400000), submodule_git_url: z.unknown().optional(), target: z.unknown().optional() }).safeParse(data);
        if (!file.success || file.data.submodule_git_url || file.data.target) throw new Error('GITHUB_UNSUPPORTED_FILE');
        const encoded = file.data.content.replace(/\s/g, '');
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw new Error('GITHUB_INVALID_RESPONSE');
        const bytes = Buffer.from(encoded, 'base64'); if (bytes.length !== file.data.size || bytes.length > MAX_FILE) throw new Error('GITHUB_INVALID_RESPONSE');
        let text: string; try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('GITHUB_UNSUPPORTED_FILE'); }
        if ([...text].some(char => { const code = char.charCodeAt(0); return (code < 32 && ![9, 10, 13].includes(code)) || code === 127; })) throw new Error('GITHUB_UNSUPPORTED_FILE');
        // X-3 (spec 7.3): redact the whole text before the cuts below, so a vault secret straddling a cut never leaves as a prefix
        // main's final exact-value redaction cannot match. A redaction failure is GITHUB_UNAVAILABLE (the catch below).
        if (this.redact) text = await this.redact(text);
        const lines = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
        const selected = lines.slice(input.startLine - 1, input.startLine - 1 + input.lineCount).join('\n'); const excerpt = selected.slice(0, 16000);
        const endLine = excerpt ? input.startLine + excerpt.split('\n').length - 1 : input.startLine - 1;
        result = { ...identity, kind: 'file', url: `${prefix}/blob/${commit}/${encodedPath}`, startLine: input.startLine, endLine, totalLines: lines.length, text: excerpt, truncated: input.startLine > 1 || endLine < lines.length || selected.length > excerpt.length };
      }
      if (signal.aborted) throw new Error('RUN_CANCELLED');
      return JSON.stringify(result);
    } catch (error) {
      if (stop.aborted) throw new Error('RUN_CANCELLED', { cause: error }); if (timeout.aborted) throw new Error('GITHUB_TIMEOUT', { cause: error });
      if (error instanceof Error && /^GITHUB_[A-Z_]+$/.test(error.message)) throw error;
      throw new Error('GITHUB_UNAVAILABLE', { cause: error });
    }
  }
}
