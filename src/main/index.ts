import { app, BrowserWindow, ipcMain, dialog, safeStorage, session, shell } from 'electron';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { MethodSpec, SessionSchema, ProjectSchema, RunSchema, OperationSchema, ApprovalSchema, type Request, type Run, type ToolSpec } from '../shared';
import { StoredProfileSchema } from '../engine/control';
import { canonicalHash, assertConversationPolicy } from '../engine/policy';
import { inspectProjectPath, spawnOwned } from '../tools/commands';
import { CommandBroker } from './commands';
import { Engine } from './engine';
import { Vault } from './vault';
import { ProjectTickets } from './projects';
import { createBridge } from './bridge';
import { complete, validateEndpoint, type InferenceMessage } from './inference';
import { probeHardware } from '../models/hardware';
import { inspectLocalRuntime } from '../models/local-runtime';

app.setName('MoonAliza');
const dataOverride = app.commandLine.getSwitchValue('user-data-dir');
if (dataOverride) app.setPath('userData', dataOverride);
const ownsInstance = app.requestSingleInstanceLock();
if (!ownsInstance) app.quit();
let window: BrowserWindow | undefined;
let engine: Engine | undefined;
let quitting = false;
const active = new Map<string, { run: Run; stop: AbortController }>();
const executingCommands = new Set<Promise<unknown>>();

if (ownsInstance) void app.whenReady().then(async () => {
  const data = app.getPath('userData'); await mkdir(data, { recursive: true });
  const vault = new Vault(join(data, 'vault'), safeStorage);
  await vault.initialize('starting');
  const helperPath = app.isPackaged ? join(process.resourcesPath, 'native', 'MoonAlizaHost.exe') : join(app.getAppPath(), '.build', 'native', 'MoonAlizaHost.exe');
  const inspect = (path: string) => inspectProjectPath(path, { helperPath });
  const tickets = new ProjectTickets(async path => (await inspect(path)).localFixed);
  const localSession = session.fromPartition('moonaliza-local');
  await localSession.setProxy({ mode: 'direct' });
  const providerSession = session.fromPartition('moonaliza-providers');
  const contextSchema = z.object({ run: RunSchema, session: SessionSchema, project: ProjectSchema.nullable(), profile: StoredProfileSchema }).strict();
  const commandContextSchema = z.object({ run: RunSchema.extend({ projectId: z.string().min(1) }), project: ProjectSchema.extend({ rootPath: z.string() }), operation: OperationSchema.omit({ createdAt: true, finishedAt: true }).extend({ input: z.unknown() }).optional(), approval: ApprovalSchema.optional() }).strict();
  const commands = new CommandBroker({
    environment: process.env, protectedRoots: [data],
    async context(runId, operationId) {
      const capability = active.get(runId); const currentEngine = engine; const epoch = currentEngine?.epoch;
      if (!capability || !currentEngine || capability.stop.signal.aborted) throw new Error('RUN_CANCELLED');
      const result = commandContextSchema.parse(await currentEngine.control({ method: 'command.context', runId, ...(operationId ? { operationId } : {}) }));
      if (currentEngine.epoch !== epoch || active.get(runId) !== capability || capability.stop.signal.aborted || result.run.projectId !== capability.run.projectId) throw new Error('RUN_CANCELLED');
      return result;
    },
    execute: (request, signal) => spawnOwned(request, signal, { helperPath }),
    redact: text => vault.redact(text),
  });
  function commandSignal(runId: string, epoch: string) {
    const capability = active.get(runId);
    if (!capability || engine?.epoch !== epoch || capability.stop.signal.aborted) throw new Error('RUN_CANCELLED');
    return capability.stop.signal;
  }

  async function infer(runId: string, messages: InferenceMessage[], epoch: string, tools?: ToolSpec[]) {
    const capability = active.get(runId);
    if (!capability || !engine || epoch !== engine.epoch) throw new Error('RUN_CANCELLED');
    const context = contextSchema.parse(await engine.control({ method: 'run.context', runId }));
    if (context.run.status !== 'running' || context.run.profileRevisionId !== capability.run.profileRevisionId || context.run.projectId !== capability.run.projectId) throw new Error('RUN_CANCELLED');
    assertConversationPolicy(context.session, context.project, context.profile.locality, capability.stop.signal, context.run);
    if (context.run.projectId === null && tools?.length) throw new Error('PROJECT_REQUIRED');
    const inferred = validateEndpoint(context.profile.kind, context.profile.endpoint);
    if (inferred.locality !== context.profile.locality) throw new Error('INVALID_ENDPOINT');
    const fetcher = (url: string, init: RequestInit) => (context.profile.locality === 'local' ? localSession : providerSession).fetch(url, init);
    const invoke = (secret?: string) => complete(context.profile, messages, { fetcher, secret, signal: capability.stop.signal, tools });
    let output;
    if (context.profile.secretRef) {
      const binding = { epoch, purpose: 'inference' as const, contextId: runId, secretRef: context.profile.secretRef, profileRevisionId: context.profile.revisionId };
      const grant = vault.grant({ ...binding, expiresAt: Date.now() + 125_000 });
      try { output = await vault.withSecret(grant, binding, invoke); } finally { vault.revokeContext(runId); }
    } else output = await invoke();
    if (output.toolCalls) {
      const encoded = JSON.stringify(output.toolCalls);
      if (await vault.redact(encoded) !== encoded) throw new Error('PROVIDER_PROTOCOL_ERROR');
    }
    return { ...output, content: await vault.redact(output.content) };
  }

  engine = new Engine(join(__dirname, 'engine.cjs'), join(data, 'state.sqlite'), {
    event(event) {
      if (['run.completed', 'run.failed', 'run.cancelled'].includes(event.type)) { active.get(event.runId)?.stop.abort(); active.delete(event.runId); vault.revokeContext(event.runId); }
      if (window && !window.isDestroyed()) window.webContents.send('moonaliza:event', event);
    },
    inference: infer,
    async prepareCommand(runId, input, epoch) { return commands.prepare(runId, input, commandSignal(runId, epoch)); },
    async executeCommand(runId, operationId, epoch) {
      const task = commands.execute(runId, operationId, commandSignal(runId, epoch));
      executingCommands.add(task); try { return await task; } finally { executingCommands.delete(task); }
    },
    async inspectGit(runId, name, input, epoch) {
      const task = commands.inspectGit(runId, name, input, commandSignal(runId, epoch));
      executingCommands.add(task); try { return await task; } finally { executingCommands.delete(task); }
    },
    cancel(runId) { active.get(runId)?.stop.abort(); vault.revokeContext(runId); },
    restarted(epoch) { for (const item of active.values()) item.stop.abort(); active.clear(); vault.setEpoch(epoch); },
  });
  engine.start();
  const references = z.array(z.string()).parse(await engine.control({ method: 'vault.references' }));
  await vault.reconcile(new Set(references));

  async function handle(request: Request): Promise<unknown> {
    if (!engine || !window) throw new Error('ENGINE_UNAVAILABLE');
    if (MethodSpec[request.method].owner === 'engine') {
      if (['run.start', 'changes.undo', 'recovery.inspect', 'recovery.acknowledge'].includes(request.method) && executingCommands.size) throw new Error('RUN_ACTIVE');
      if (request.method === 'run.cancel') { active.get(request.params.runId)?.stop.abort(); vault.revokeContext(request.params.runId); }
      if (request.method === 'project.revokeTrust' || request.method === 'project.policy.update') {
        for (const [id, item] of active) if (item.run.projectId === request.params.projectId) { item.stop.abort(); vault.revokeContext(id); }
      }
      if (request.method === 'session.policy.update') {
        for (const [id, item] of active) if (item.run.sessionId === request.params.sessionId) { item.stop.abort(); vault.revokeContext(id); }
      }
      const result = await engine.request(request);
      if (request.method === 'run.start') {
        const { run } = z.object({ run: RunSchema }).parse(result);
        if (!active.has(run.id) && ['queued', 'running'].includes(run.status)) active.set(run.id, { run, stop: new AbortController() });
      }
      return result;
    }
    switch (request.method) {
      case 'hardware.read': return { ...await probeHardware({ helperPath, runtimeIdentity: `unmanaged;moonaliza-${app.getVersion()}` }), checkedAt: new Date().toISOString() };
      case 'runtime.inspect': return inspectLocalRuntime((url, init) => localSession.fetch(url, init));
      case 'project.pick': {
        let selected: string;
        if (request.params.create) {
          const result = await dialog.showSaveDialog(window, { title: 'Create a project folder', buttonLabel: 'Create folder', defaultPath: join(app.getPath('documents'), 'New project') });
          if (result.canceled || !result.filePath) return { cancelled: true };
          if (!(await inspect(dirname(result.filePath))).localFixed) throw new Error('PROJECT_VOLUME_UNSUPPORTED');
          await mkdir(result.filePath).catch((error: NodeJS.ErrnoException) => { if (error.code === 'EEXIST') throw new Error('FILE_CONFLICT'); throw error; });
          selected = result.filePath;
        } else {
          const result = await dialog.showOpenDialog(window, { title: 'Open a project', properties: ['openDirectory'] });
          if (result.canceled || !result.filePaths[0]) return { cancelled: true };
          selected = result.filePaths[0];
        }
        const ticket = await tickets.issue(selected, window.webContents.id);
        return { ticketId: ticket.ticket, name: ticket.name, pathLabel: ticket.pathLabel };
      }
      case 'project.trust': case 'project.relink': {
        const hash = canonicalHash(request.params);
        const replay = await engine.control({ method: 'request.lookup', requestId: request.clientRequestId, requestMethod: request.method, inputHash: hash }) as { response: unknown } | null;
        if (replay) return replay.response;
        const selected = tickets.consume(request.params.ticketId, window.webContents.id);
        const inspected = await inspect(selected.rootPath);
        if (!inspected.localFixed) throw new Error('PROJECT_VOLUME_UNSUPPORTED');
        return engine.control({ method: 'project.register', requestId: request.clientRequestId, inputHash: hash, rootPath: inspected.rootPath, name: selected.name, ...(request.method === 'project.relink' ? { projectId: request.params.projectId } : {}) });
      }
      case 'profile.save': {
        const hash = canonicalHash(request.params);
        const replay = await engine.control({ method: 'request.lookup', requestId: request.clientRequestId, requestMethod: request.method, inputHash: hash }) as { response: unknown } | null;
        if (replay) return replay.response;
        const params = request.params;
        const endpoint = validateEndpoint(params.kind, params.endpoint);
        const profileId = params.id;
        const previous = profileId ? StoredProfileSchema.parse(await engine.control({ method: 'profile.get', profileId })) : undefined;
        if (previous && previous.revision !== params.expectedRevision) throw new Error('REQUEST_CONFLICT');
        if (previous?.secretRef && !params.secret && !params.clearCredential && (previous.endpoint !== endpoint.endpoint || previous.kind !== params.kind)) throw new Error('CREDENTIAL_UNAVAILABLE');
        let secretRef = params.clearCredential ? undefined : previous?.secretRef;
        if (params.secret) secretRef = await vault.saveStaged(params.secret);
        const now = new Date().toISOString();
        const profile = { id: previous?.id ?? randomUUID(), name: params.name, kind: params.kind, ...endpoint, model: params.model, contextTokens: params.contextTokens, outputTokens: params.outputTokens, revision: (previous?.revision ?? 0) + 1, revisionId: randomUUID(), createdAt: previous?.createdAt ?? now, updatedAt: now, ...(secretRef ? { secretRef } : {}) };
        const result = await engine.control({ method: 'profile.save', requestId: request.clientRequestId, inputHash: hash, profile });
        if (secretRef) await vault.commit(secretRef);
        if (previous?.secretRef && previous.secretRef !== secretRef) {
          for (const [id, item] of active) if (item.run.profileId === previous.id) { item.stop.abort(); vault.revokeContext(id); }
          await vault.tombstone(previous.secretRef);
          await vault.remove(previous.secretRef);
        }
        return result;
      }
      case 'profile.test': {
        const profile = StoredProfileSchema.parse(await engine.control({ method: 'profile.get', profileId: request.params.profileId }));
        const controller = new AbortController(); const started = Date.now();
        const binding = { epoch: engine.epoch, purpose: 'provider-test' as const, contextId: request.clientRequestId, secretRef: profile.secretRef ?? '', profileRevisionId: profile.revisionId };
        const fetcher = (url: string, init: RequestInit) => (profile.locality === 'local' ? localSession : providerSession).fetch(url, init);
        const invoke = (secret?: string) => complete({ ...profile, outputTokens: 32 }, [{ role: 'user', content: 'Reply with OK.' }], { secret, fetcher, signal: controller.signal });
        const timeout = setTimeout(() => controller.abort(), 25_000);
        try {
          const output = profile.secretRef ? await vault.withSecret(vault.grant({ ...binding, expiresAt: Date.now() + 30_000 }), binding, invoke) : await invoke();
          if (output.outcome !== 'complete') throw new Error('PROVIDER_ERROR');
          return { profileId: profile.id, profileRevisionId: profile.revisionId, success: true, latencyMs: Date.now() - started, message: 'Connection succeeded' };
        } finally { clearTimeout(timeout); vault.revokeContext(request.clientRequestId); }
      }
      case 'external.open': await shell.openExternal(request.params.url); return { opened: true };
      default: throw new Error('NOT_IMPLEMENTED');
    }
  }

  window = new BrowserWindow({ width: 1440, height: 960, minWidth: 960, minHeight: 640, title: 'MoonAliza', backgroundColor: '#101821', show: false,
    webPreferences: { preload: join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false, partition: 'moonaliza-renderer' } });
  window.removeMenu();
  const contents = window.webContents;
  const entry = join(__dirname, 'renderer', 'index.html'); const expectedUrl = pathToFileURL(entry).href;
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', event => event.preventDefault());
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  contents.session.setPermissionCheckHandler(() => false);
  contents.session.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !details.url.startsWith(pathToFileURL(join(__dirname, 'renderer')).href + '/') }));
  const invoke = createBridge(() => ({ webContentsId: contents.id, frameId: contents.mainFrame.routingId, url: expectedUrl }), handle);
  ipcMain.handle('moonaliza:invoke', (event, input: unknown) => invoke({ webContentsId: event.sender.id, frameId: event.senderFrame?.routingId ?? -1, url: event.senderFrame?.url ?? '', isMainFrame: event.senderFrame === event.sender.mainFrame }, input));
  window.on('closed', () => { tickets.revokeOwner(contents.id); window = undefined; });
  await window.loadFile(entry); window.show();
}).catch(() => { dialog.showErrorBox('MoonAliza could not start', 'The application engine could not be initialized. Your saved project data has been retained.'); app.quit(); });

app.on('second-instance', () => { window?.show(); window?.focus(); });
app.on('window-all-closed', () => app.quit());
app.on('before-quit', event => {
  if (quitting || !engine) return;
  event.preventDefault(); quitting = true;
  for (const item of active.values()) item.stop.abort();
  void engine.close().finally(() => app.quit());
});
