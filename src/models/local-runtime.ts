import { z } from 'zod';
import { readBoundedJson, type Fetcher } from '../main/inference';
import { type MethodResult } from '../shared/params';

const endpoint = 'http://127.0.0.1:11434';
const version = z.object({ version: z.string().min(1).max(128) });
const inventory = z.object({ models: z.array(z.object({
  name: z.string().min(1).max(256), digest: z.string().regex(/^(?:sha256:)?[a-f0-9]{64}$/),
  size: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  details: z.object({ quantization_level: z.string().max(128).optional() }).optional(),
})).max(1000) });

/** Explicit discovery only. Never starts/stops inference or modifies an external runtime. */
export async function inspectLocalRuntime(fetcher: Fetcher): Promise<MethodResult<'runtime.inspect'>> {
  const base = { endpoint, ownership: 'external', checkedAt: new Date().toISOString() } as const;
  const signal = AbortSignal.timeout(5000);
  let reached = false;
  try {
    const get = async (path: string) => {
      const response = await fetcher(`${endpoint}${path}`, { method: 'GET', headers: { Accept: 'application/json' }, signal, redirect: 'error', credentials: 'omit' });
      reached = true;
      if (!response.ok) { await response.body?.cancel(); throw new Error('INCOMPATIBLE_RUNTIME'); }
      return readBoundedJson(response, 524288);
    };
    const info = version.parse(await get('/api/version'));
    const listed = inventory.parse(await get('/api/tags'));
    const models = listed.models.map(model => ({ name: model.name, digest: model.digest.replace(/^sha256:/, ''), sizeBytes: model.size, quantization: model.details?.quantization_level ?? null, qualified: false as const }));
    return { ...base, status: 'available', version: info.version, models };
  } catch { return { ...base, status: reached ? 'incompatible' : 'unavailable', version: null, models: [] }; }
}
