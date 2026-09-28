import { z } from 'zod';
import { complete, type InferenceMessage } from '../main/inference';
import { InferenceScheduler, type InferenceLease } from '../engine/scheduler';
import type { ToolSpec } from '../shared';
import { ManagedOllamaRuntime, runtimeJson, type ManagedOllamaSession, type RuntimeInstallation } from './managed-ollama';

const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const ConfigurationSchema = z.object({
  model: z.string().min(1).max(256).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/), digest: Digest,
  contextTokens: z.number().int().min(512).max(2_000_000), outputTokens: z.number().int().min(1).max(131072),
  quantization: z.string().min(1).max(128), placement: z.literal('cpu'),
}).strict().refine(config => config.outputTokens <= config.contextTokens);
export type ManagedConfiguration = z.infer<typeof ConfigurationSchema>;
const Model = z.object({ name: z.string().min(1).max(256), digest: z.string().regex(/^(?:sha256:)?[a-f0-9]{64}$/) });
const Loaded = Model.extend({ context_length: z.number().int(), size_vram: z.number().int().nonnegative(), details: z.object({ quantization_level: z.string() }) });

/** CPU placement only until exact GPU backend/adapter attestation is available. This is not qualification. */
export async function completeManagedOllama(session: ManagedOllamaSession, input: ManagedConfiguration, messages: InferenceMessage[], options: { tools?: ToolSpec[] } = {}) {
  const config = ConfigurationSchema.parse(input); session.lease.assertCurrent();
  const tags = z.object({ models: z.array(Model).max(1000) }).parse(await runtimeJson(session, '/api/tags'));
  const matches = tags.models.filter(model => model.name === config.model);
  if (matches.length !== 1 || matches[0]!.digest.replace(/^sha256:/, '') !== config.digest) throw new Error('MODEL_IDENTITY');
  const loaded = await runtimeJson(session, '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.model, messages: [], stream: false, keep_alive: -1, options: { num_ctx: config.contextTokens, num_predict: config.outputTokens, num_gpu: 0 } }) });
  if (!z.object({ done: z.literal(true), done_reason: z.literal('load') }).safeParse(loaded).success) throw new Error('MODEL_LOAD');
  const checkLoaded = async () => {
    const data = z.object({ models: z.array(Loaded).max(128) }).safeParse(await runtimeJson(session, '/api/ps'));
    if (!data.success || data.data.models.length !== 1) throw new Error('MODEL_CONFIGURATION');
    const model = data.data.models[0]!;
    if (model.name !== config.model || model.digest.replace(/^sha256:/, '') !== config.digest || model.context_length !== config.contextTokens || model.size_vram !== 0 || model.details.quantization_level !== config.quantization) throw new Error('MODEL_CONFIGURATION');
  };
  await checkLoaded(); session.lease.heartbeat();
  const result = await complete({ kind: 'ollama', endpoint: session.endpoint, model: config.model, contextTokens: config.contextTokens, outputTokens: config.outputTokens }, messages, { fetcher: session.fetcher, signal: session.lease.signal, tools: options.tools, managedOllama: { numGpu: 0, keepAlive: -1 } });
  // A changed configuration also invalidates pending tool calls before the broker can see them.
  await checkLoaded(); session.lease.assertCurrent(); return result;
}

/** Own one instance in main; the resolver supplies verified activation and qualification metadata. */
export class ManagedOllamaProvider {
  private readonly runtime: ManagedOllamaRuntime;
  private readonly scheduler: InferenceScheduler;
  constructor(private readonly resolveConfiguration: (lease: InferenceLease) => Promise<{ installation: RuntimeInstallation; configuration: ManagedConfiguration }>, options: { helperPath?: string } = {}) {
    this.runtime = new ManagedOllamaRuntime(options.helperPath);
    this.scheduler = new InferenceScheduler({ stopRuntime: async () => { await this.runtime.stop(); } });
  }
  complete(messages: InferenceMessage[], options: { tools?: ToolSpec[]; signal?: AbortSignal } = {}) {
    return this.scheduler.run(async lease => {
      const resolved = await this.resolveConfiguration(lease); lease.assertCurrent();
      const session = await this.runtime.start(resolved.installation, lease);
      return completeManagedOllama(session, resolved.configuration, messages, options);
    }, { signal: options.signal, leaseTimeoutMs: 300000, heartbeatTimeoutMs: 150000 });
  }
  withRuntimeStopped<T>(task: () => Promise<T>) { return this.scheduler.withRuntimeStopped(task); }
  shutdown() { return this.scheduler.shutdown(); }
}
