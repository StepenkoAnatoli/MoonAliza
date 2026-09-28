import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import type { Fetcher } from '../main/inference';
import { atomicJson, boundedJson, hashFile, missing, privateDirectory, regularFile, removeFile, requireSpace, serialized } from './artifact-files';

const secureUrl = z.string().max(4096).refine(value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.hash && (!u.port || u.port === '443'); } catch { return false; } });
export const ArtifactSpecSchema = z.object({ sha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: z.number().int().min(1).max(1_000_000_000_000), url: secureUrl, redirectHosts: z.array(z.string().min(1).max(253).regex(/^[a-z0-9]+(?:[a-z0-9.-]*[a-z0-9])?$/)).max(8) }).strict();
export type ArtifactSpec = z.infer<typeof ArtifactSpecSchema>;
const ResumeSchema = z.object({ schemaVersion: z.literal(1), sha256: z.string(), sizeBytes: z.number(), url: z.string(), etag: z.string().regex(/^"[^"\r\n]{1,256}"$/) }).strict();
type Options = { fetcher: Fetcher; signal?: AbortSignal; retries?: number; onProgress?: (bytes: number) => void };
function cancelled(signal?: AbortSignal) { if (signal?.aborted) throw new Error('DOWNLOAD_CANCELLED'); }
function strongEtag(value: string | null): value is string { return value !== null && /^"[^"\r\n]{1,256}"$/.test(value); }
class Retryable extends Error { constructor(readonly waitMs: number) { super('DOWNLOAD_TEMPORARY'); } }

async function request(spec: ArtifactSpec, options: Options, headers: Record<string, string>): Promise<Response> {
  let url = spec.url;
  for (let hop = 0; hop < 5; hop++) {
    cancelled(options.signal);
    const response = await options.fetcher(url, { method: 'GET', headers, redirect: 'manual', credentials: 'omit', signal: AbortSignal.any([...(options.signal ? [options.signal] : []), AbortSignal.timeout(30 * 60_000)]) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const target = new URL(response.headers.get('location') ?? '', url);
      if (!response.headers.has('location') || !secureUrl.safeParse(target.href).success || ![new URL(spec.url).hostname, ...spec.redirectHosts].includes(target.hostname)) throw new Error('ARTIFACT_REDIRECT');
      url = target.href; continue;
    }
    if ([408, 429, 500, 502, 503, 504].includes(response.status)) {
      await response.body?.cancel();
      const header = response.headers.get('retry-after');
      const waitMs = header && /^\d+$/.test(header) ? Number(header) * 1000 : header ? Math.max(0, Date.parse(header) - Date.now()) : 500;
      // Do not retry sooner than a server's long requested delay; return for user retry.
      if (!Number.isFinite(waitMs) || waitMs > 30_000) throw new Error('DOWNLOAD_RATE_LIMITED');
      throw new Retryable(waitMs);
    }
    if (![200, 206].includes(response.status)) { await response.body?.cancel(); throw new Error(`DOWNLOAD_HTTP_${response.status}`); }
    return response;
  }
  throw new Error('ARTIFACT_REDIRECT');
}

/** Only main-owned consumers pass descriptors verified by a trusted catalogue. */
export async function downloadArtifact(input: ArtifactSpec, directory: string, options: Options): Promise<string> {
  const spec = ArtifactSpecSchema.parse(input); const retries = options.retries ?? 2;
  if (!Number.isInteger(retries) || retries < 0 || retries > 3) throw new Error('INVALID_RETRIES');
  return serialized(directory, async () => {
    cancelled(options.signal); const root = await privateDirectory(directory);
    const final = join(root, `${spec.sha256}.blob`); const partial = join(root, `${spec.sha256}.partial`); const metadata = join(root, `${spec.sha256}.resume.json`);
    try {
      const cached = await hashFile(final, spec.sizeBytes, options.signal);
      if (cached.sha256 !== spec.sha256 || cached.sizeBytes !== spec.sizeBytes) throw new Error('ARTIFACT_CORRUPT');
      return final;
    } catch (error) { if (!missing(error)) throw error; }
    for (let attempt = 0; ; attempt++) {
      cancelled(options.signal); let offset = 0; let previousTag: string | undefined;
      try {
        const previous = ResumeSchema.parse(await boundedJson(metadata, 8192)); const info = await regularFile(partial);
        if (previous.sha256 === spec.sha256 && previous.sizeBytes === spec.sizeBytes && previous.url === spec.url && info.size <= spec.sizeBytes) { offset = info.size; previousTag = previous.etag; }
      } catch (error) { if (error instanceof Error && error.message === 'ARTIFACT_PATH') throw error; }
      if (!offset) { await removeFile(partial); await removeFile(metadata); }
      if (offset === spec.sizeBytes) {
        const verified = await hashFile(partial, spec.sizeBytes, options.signal);
        if (verified.sha256 !== spec.sha256) { await removeFile(partial); await removeFile(metadata); throw new Error('ARTIFACT_DIGEST'); }
        await rename(partial, final); await removeFile(metadata); return final;
      }
      await requireSpace(root, spec.sizeBytes - offset);
      let response: Response | undefined; let resumable = offset > 0 && previousTag !== undefined;
      try {
        response = await request(spec, options, { Accept: 'application/octet-stream', 'Accept-Encoding': 'identity', ...(offset ? { Range: `bytes=${offset}-`, 'If-Range': previousTag! } : {}) });
        const encoding = response.headers.get('content-encoding'); if (encoding && encoding !== 'identity') throw new Error('ARTIFACT_ENCODING');
        const etag = response.headers.get('etag');
        if (response.status === 206) {
          if (!offset || !strongEtag(etag) || etag !== previousTag || response.headers.get('content-range') !== `bytes ${offset}-${spec.sizeBytes - 1}/${spec.sizeBytes}`) throw new Error('ARTIFACT_RANGE');
        } else { offset = 0; }
        const length = response.headers.get('content-length');
        if (length !== null && (!/^\d+$/.test(length) || Number(length) !== spec.sizeBytes - offset)) throw new Error('ARTIFACT_SIZE');
        await requireSpace(root, spec.sizeBytes - offset);
        resumable = strongEtag(etag);
        if (strongEtag(etag)) { await atomicJson(metadata, { schemaVersion: 1, sha256: spec.sha256, sizeBytes: spec.sizeBytes, url: spec.url, etag }); }
        else await removeFile(metadata);
        const hash = createHash('sha256');
        if (offset) for await (const chunk of createReadStream(partial, { highWaterMark: 256 * 1024, signal: options.signal })) hash.update(chunk);
        const handle = await open(partial, offset ? 'r+' : 'w');
        let bytes = offset; const reader = response.body?.getReader();
        try {
          if (!reader) throw new Error('ARTIFACT_SIZE');
          while (true) {
            cancelled(options.signal); const part = await reader.read(); if (part.done) break;
            cancelled(options.signal); if (bytes + part.value.byteLength > spec.sizeBytes) throw new Error('ARTIFACT_SIZE');
            let written = 0;
            while (written < part.value.byteLength) { const result = await handle.write(part.value, written, part.value.byteLength - written, bytes + written); if (!result.bytesWritten) throw new Error('DOWNLOAD_IO'); written += result.bytesWritten; }
            hash.update(part.value); bytes += part.value.byteLength; options.onProgress?.(bytes);
          }
          cancelled(options.signal); if (bytes !== spec.sizeBytes) throw new Error('ARTIFACT_SIZE');
          if (hash.digest('hex') !== spec.sha256) throw new Error('ARTIFACT_DIGEST');
          await handle.sync();
        } finally { await reader?.cancel().catch(() => {}); reader?.releaseLock(); await handle.close(); }
        cancelled(options.signal); await rename(partial, final); await removeFile(metadata); return final;
      } catch (error) {
        await response?.body?.cancel().catch(() => {});
        const message = error instanceof Error ? error.message : '';
        if (!resumable && !(error instanceof Retryable) || message.startsWith('ARTIFACT_')) { await removeFile(partial); await removeFile(metadata); }
        if (options.signal?.aborted || message === 'DOWNLOAD_CANCELLED') throw new Error('DOWNLOAD_CANCELLED', { cause: error });
        if ((error as NodeJS.ErrnoException)?.code === 'ENOSPC') throw new Error('STORAGE_FULL', { cause: error });
        if ((error instanceof Retryable || error instanceof TypeError) && attempt < retries) { try { await delay(error instanceof Retryable ? Math.max(error.waitMs, attempt * 500) : 250 * 2 ** attempt, undefined, { signal: options.signal }); } catch { throw new Error('DOWNLOAD_CANCELLED'); } continue; }
        throw error;
      }
    }
  });
}
