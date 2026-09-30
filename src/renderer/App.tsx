import { useCallback, useEffect, useEffectEvent, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Project, Profile, Session, Message, Run, RunEvent, MethodName, MethodParams, MethodResult } from '../shared';
import { ChangesPanel } from './ChangesPanel';
import { CommandResultSchema } from '../shared/commands';
import { LocalModelPanel } from './LocalModelPanel';

export interface AppApi {
  invoke(method: string, params?: Record<string, unknown>): Promise<unknown>;
  onEvent(listener: (event: RunEvent) => void): () => void;
}
declare global { interface Window { moonaliza: AppApi } }

function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,button,select')?.focus();
    return () => previous?.focus();
  }, []);
  return <div className="modal-backdrop"><div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} onKeyDown={event => {
    if (event.key === 'Escape') close();
    if (event.key !== 'Tab') return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,[tabindex="0"]') ?? []);
    const first = items[0]; const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}><div className="modal-title"><h2>{title}</h2><button aria-label="Close dialog" onClick={close}>×</button></div>{children}</div></div>;
}

export function App({ api = window.moonaliza }: { api?: AppApi }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projectId, setProjectId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [mode, setMode] = useState<'ask' | 'plan' | 'build' | 'research'>('ask');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [localModelsDialog, setLocalModelsDialog] = useState(false);
  const [privacyReview, setPrivacyReview] = useState<Project>();
  const [telemetry, setTelemetry] = useState<Pick<MethodResult<'session.read'>, 'context' | 'usage' | 'failure'>>();
  const [selection, setSelection] = useState<{ ticketId: string; name: string; pathLabel: string }>();
  const [details, setDetails] = useState(true);
  const project = projects.find(item => item.id === projectId);
  const profile = profiles.find(item => item.id === profileId);
  const cloudBlocked = project?.policy.inference === 'local-only' && profile?.locality === 'external';
  const activeRun = runs.find(run => ['queued', 'running', 'awaiting_approval', 'awaiting_review', 'cancelling'].includes(run.status));
  const call = useCallback(<M extends MethodName,>(method: M, params: MethodParams<M>) => api.invoke(method, params as Record<string, unknown>) as Promise<MethodResult<M>>, [api]);
  const report = (reason: unknown) => setError(reason instanceof Error ? reason.message : 'The operation failed. Try again.');

  const refreshProjects = useCallback(async () => {
    const result = await call('project.list', {}); setProjects(result.projects); return result.projects;
  }, [call]);
  const refreshProfiles = useCallback(async () => {
    const result = await call('profile.list', {}); setProfiles(result.profiles);
    setProfileId(current => result.profiles.some(p => p.id === current) ? current : result.profiles[0]?.id ?? '');
  }, [call]);
  useEffect(() => {
    let alive = true;
    Promise.all([call('project.list', {}), call('profile.list', {})]).then(([p, f]) => {
      if (!alive) return;
      setProjects(p.projects); setProjectId(p.projects[0]?.id ?? '');
      setProfiles(f.profiles); setProfileId(f.profiles[0]?.id ?? ''); setReady(true);
    }).catch(reason => { if (alive) { report(reason); setReady(true); } });
    return () => { alive = false; };
  }, [call]);
  useEffect(() => {
    let alive = true;
    setSessionId(''); setMessages([]); setRuns([]); setSessions([]);
    if (projectId) call('session.list', { projectId }).then(result => { if (alive) setSessions(result.sessions); }).catch(report);
    return () => { alive = false; };
  }, [projectId, call]);
  useEffect(() => {
    setTelemetry(undefined); setError('');
    if (!sessionId) return;
    let alive = true;
    let revision = 0;
    const refresh = () => { const version = ++revision; return call('session.read', { sessionId }).then(result => { if (alive && version === revision) { setMessages(result.messages); setRuns(result.runs); setTelemetry(result); } }).catch(reason => { if (alive && version === revision) report(reason); }); };
    void refresh();
    const unsubscribe = api.onEvent(() => { void refresh(); });
    return () => { alive = false; unsubscribe(); };
  }, [api, call, sessionId]);

  async function openProject() {
    setError(''); setBusy(true);
    try { const result = await call('project.pick', {}); if ('ticketId' in result) setSelection(result); }
    catch (reason) { report(reason); } finally { setBusy(false); }
  }
  async function trustProject() {
    if (!selection) return;
    setBusy(true); setError('');
    try { const result = await call('project.trust', { ticketId: selection.ticketId }); await refreshProjects(); setProjectId(result.project.id); setSelection(undefined); }
    catch (reason) { report(reason); } finally { setBusy(false); }
  }
  async function newSession() {
    if (!project) return;
    const result = await call('session.create', { projectId: project.id, title: 'New conversation' });
    setSessions(current => [result.session, ...current]); setSessionId(result.session.id); setMessages([]); setRuns([]); setTelemetry(undefined); setError('');
    return result.session.id;
  }
  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (!text.trim() || !profile || !project || busy || activeRun || cloudBlocked) return;
    setBusy(true); setError('');
    try {
      const target = sessionId || await newSession();
      if (!target) return;
      const result = await call('run.start', { sessionId: target, profileId: profile.id, mode, prompt: text.trim() });
      setRuns(current => [result.run, ...current]); setText(''); setTelemetry(undefined);
      const history = await call('session.read', { sessionId: target }); setMessages(history.messages); setSessions(current => current.map(item => item.id === target ? history.session : item));
    } catch (reason) { report(reason); } finally { setBusy(false); }
  }
  async function stop() {
    if (!activeRun) return;
    try { const result = await call('run.cancel', { runId: activeRun.id }); setRuns(current => current.map(r => r.id === result.run.id ? result.run : r)); }
    catch (reason) { report(reason); }
  }
  async function changePrivacy(target: Project, inference: 'local-only' | 'cloud-allowed') {
    setBusy(true); setError('');
    try {
      await call('project.policy.update', { projectId: target.id, expectedRevision: target.policy.revision, policy: { inference, research: target.policy.research } });
      await refreshProjects(); setPrivacyReview(undefined);
    } catch (reason) { report(reason); } finally { setBusy(false); }
  }
  async function freshRequest() {
    const prompt = [...messages].reverse().find(message => message.role === 'user')?.content ?? '';
    setBusy(true);
    try { await newSession(); setText(prompt); } catch (reason) { report(reason); } finally { setBusy(false); }
  }
  const shortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!event.ctrlKey || busy || selection || profileDialog || localModelsDialog || privacyReview) return;
    if (event.key.toLowerCase() === 'o') { event.preventDefault(); void openProject(); }
    if (event.key.toLowerCase() === 'n' && project && !activeRun) { event.preventDefault(); void newSession().catch(report); }
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => shortcut(event);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return <div className="workbench">
    <a className="skip-link" href="#conversation">Skip to conversation</a>
    <aside className="sidebar" aria-label="Projects and conversations">
      <div className="brand"><svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M24 25A13 13 0 1 1 24 7A11 11 0 1 0 24 25Z" fill="currentColor"/><circle cx="25" cy="16" r="2" fill="currentColor"/></svg><strong>MoonAliza</strong></div>
      <button className="open-project" aria-label="Open project" aria-keyshortcuts="Control+O" onClick={() => void openProject()} disabled={busy}>Open project <kbd aria-hidden="true">Ctrl O</kbd></button>
      <div className="sidebar-label">Projects</div>
      <nav aria-label="Projects">{projects.map(p => <button key={p.id} className={p.id === projectId ? 'nav-item selected' : 'nav-item'} onClick={() => setProjectId(p.id)}><span className="folder-icon" aria-hidden="true">▱</span><span>{p.name}</span>{!p.trusted && <span className="muted">Untrusted</span>}</button>)}</nav>
      <div className="sidebar-label conversation-label">Conversations<button aria-label="New conversation" disabled={!project || busy || !!activeRun} onClick={() => void newSession().catch(report)}>+</button></div>
      <nav className="session-list" aria-label="Conversations">{sessions.map(s => <button className={s.id === sessionId ? 'nav-item selected' : 'nav-item'} key={s.id} onClick={() => setSessionId(s.id)}>{s.title}</button>)}{project && sessions.length === 0 && <p className="quiet-note">Your conversations will be saved here.</p>}</nav>
      <div className="sidebar-bottom"><button onClick={() => setLocalModelsDialog(true)}>Local models</button><button onClick={() => setProfileDialog(true)}>Model profiles <span aria-hidden="true">⚙</span></button><span className="development-label">Development build · 0.6</span></div>
    </aside>
    <main id="conversation" className="main-pane">
      <header className="toolbar"><div><h1>{project?.name ?? 'Workspace'}</h1><span className="muted">{project ? project.policy.inference === 'local-only' ? 'Local inference only' : 'Cloud inference allowed' : 'No project selected'}</span></div><button className="quiet-button" aria-pressed={details} onClick={() => setDetails(!details)}>Project details</button></header>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
      {telemetry?.failure && <div className="error-banner recovery-banner" role="alert"><span>{telemetry.failure.message}</span>{telemetry.failure.code === 'CONTEXT_LIMIT' && <div className="recovery-actions"><button onClick={() => setProfileDialog(true)}>Review context settings</button><button disabled={busy || !!activeRun} onClick={() => void freshRequest()}>Start fresh with this request</button></div>}</div>}
      <section className="transcript" aria-label="Conversation">
        {messages.length === 0 ? <div className="empty-state"><div className="orbit-mark" aria-hidden="true"><span /></div><h2>{project ? 'What are we working on?' : 'Your work starts here'}</h2><p>{project ? 'Ask a question or describe a change. MoonAliza keeps the conversation with your project.' : 'Open a project folder, choose a model, and start a conversation with your code.'}</p><div className="mode-examples"><button onClick={() => { setMode('ask'); setText('Explain how this project is organized.'); }}>Understand the project<span>Ask a question</span></button><button onClick={() => { setMode('plan'); setText('Help me plan the next change.'); }}>Plan a change<span>Work through an approach</span></button></div>{!profiles.length && <p className="setup-note">Add a connection in Model profiles to send your first message.</p>}</div> : messages.map(message => <MessageItem key={message.id} message={message} />)}
        {activeRun && <div className="run-progress" role="status">{activeRun.status === 'cancelling' ? 'Stopping the run…' : activeRun.status === 'awaiting_approval' ? 'Waiting for your review…' : 'Working…'}</div>}
        {project && <ChangesPanel key={project.id} api={api} projectId={project.id} runId={activeRun?.id} />}
      </section>
      {telemetry?.context && <details className="context-notice"><summary>Context estimate: {telemetry.context.estimatedInputTokens.toLocaleString()} / {telemetry.context.inputBudgetTokens.toLocaleString()} input tokens</summary><p>Estimated from UTF-8 content and tool declarations; the provider’s tokenizer may differ. Response reserve: {telemetry.context.reservedOutputTokens.toLocaleString()} tokens. {telemetry.context.omittedHistoryMessages} older messages omitted; {telemetry.context.compactedToolResults} tool results shown as retrievable excerpts. Full results remain in this conversation.</p><p>{telemetry.usage ? `Last reported usage (step ${telemetry.usage.modelSteps}): ${telemetry.usage.inputTokens.toLocaleString()} input, ${telemetry.usage.outputTokens.toLocaleString()} output tokens.` : 'The provider has not reported token usage for this run.'}</p></details>}
      <form className="composer" onSubmit={event => void send(event)}>
        {cloudBlocked && <div className="privacy-notice" role="status"><p><strong>{profile.name}</strong> connects to {new URL(profile.endpoint).host}. This project currently allows local inference only. Choose a local profile or review cloud access before sending.</p><button type="button" onClick={() => setPrivacyReview(project)}>Review cloud access</button></div>}
        <label className="sr-only" htmlFor="prompt">Message MoonAliza</label><textarea id="prompt" placeholder={project ? 'Ask about your project or describe a task…' : 'Open a project to begin…'} value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && event.ctrlKey) void send(event); }} disabled={!project || !ready} />
        <div className="composer-controls"><label className="select-label">Mode<select aria-label="Mode" value={mode} onChange={e => setMode(e.target.value as typeof mode)}>{['ask', 'plan', 'build', 'research'].map(m => <option key={m} value={m} disabled={m === 'research'}>{m[0]!.toUpperCase() + m.slice(1)}</option>)}</select></label><select aria-label="Model profile" value={profileId} onChange={e => setProfileId(e.target.value)}><option value="">Choose a model</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><span className="composer-spacer" />{activeRun ? <button type="button" className="stop-button" onClick={() => void stop()}>Stop run</button> : <button className="primary" type="submit" aria-label="Send message" disabled={!project?.trusted || !profile || !text.trim() || busy || cloudBlocked}>Send <span aria-hidden="true">↑</span></button>}</div>
      </form><p className="composer-footnote">{mode === 'build' ? 'File changes and commands require your review.' : 'This mode does not modify project files.'}</p>
    </main>
    {details && <aside className="details-pane" aria-label="Project details"><h2>Project details</h2>{project ? <><div className="detail-section"><h3>Folder</h3><p className="path-label">{project.pathLabel}</p><span className="status-tag">{project.trusted ? 'Trusted project' : 'Trust revoked'}</span></div><div className="detail-section"><h3>Privacy</h3><p>{project.policy.inference === 'local-only' ? 'Project content stays with local model connections.' : 'Project content may be sent to your selected cloud provider.'}</p><button disabled={busy} onClick={() => project.policy.inference === 'local-only' ? setPrivacyReview(project) : void changePrivacy(project, 'local-only')}>{project.policy.inference === 'local-only' ? 'Allow cloud inference' : 'Use local inference only'}</button></div><div className="detail-section"><h3>Model connection</h3><p>{profile ? profile.name : 'No model selected'}</p><p className="muted">{profile?.model ?? 'Add your local runtime or API provider.'}</p><button onClick={() => setProfileDialog(true)}>Manage profiles</button></div><div className="detail-section"><h3>Project access</h3><button disabled={!project.trusted} onClick={() => void call('project.revokeTrust', { projectId: project.id }).then(refreshProjects).catch(report)}>Revoke trust</button></div></> : <p className="muted">Project permissions, model connection, and activity appear here after you open a folder.</p>}</aside>}
    <footer className="statusbar" role="status"><span className={ready ? 'status-dot ready' : 'status-dot'} />{ready ? 'Ready' : 'Connecting to engine…'}<span className="status-spacer" /><span>{profile?.name ?? 'No model connected'}</span><span>{activeRun ? 'Run active' : 'Idle'}</span></footer>
    {selection && <Modal title="Trust this project?" close={() => setSelection(undefined)}><p>MoonAliza will be able to read this folder when you start a task. File changes and commands require approval.</p><p className="trust-path">{selection.pathLabel}</p><p>Only open folders whose contents you trust. Project instructions cannot grant additional permissions.</p>{error && <p role="alert" className="form-error">{error}</p>}<div className="modal-actions"><button onClick={() => setSelection(undefined)}>Cancel</button><button className="primary" disabled={busy} onClick={() => void trustProject()}>Trust and open</button></div></Modal>}
    {profileDialog && <ProfileDialog api={api} close={() => setProfileDialog(false)} saved={() => void refreshProfiles()} profiles={profiles} />}
    {localModelsDialog && <Modal title="Local model readiness" close={() => setLocalModelsDialog(false)}><LocalModelPanel api={api} /></Modal>}
    {privacyReview && <Modal title="Allow cloud inference?" close={() => { if (!busy) setPrivacyReview(undefined); }}><p>Allow prompts, selected project contents and tool results from <strong>{privacyReview.name}</strong> to be sent to external model providers. This permission applies to future cloud profiles selected for this project.</p>{profile?.locality === 'external' && <p>Currently selected: <strong>{profile.name}</strong> at {new URL(profile.endpoint).host}.</p>}<p>Nothing is sent by changing this setting. Your draft stays ready for you to send. Research permissions are separate.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button disabled={busy} onClick={() => setPrivacyReview(undefined)}>Keep local only</button><button className="primary" disabled={busy} onClick={() => void changePrivacy(privacyReview, 'cloud-allowed')}>Allow for this project</button></div></Modal>}
  </div>;
}

function ProfileDialog({ api, close, saved, profiles }: { api: AppApi; close: () => void; saved: () => void; profiles: Profile[] }) {
  const [editing, setEditing] = useState<Profile>();
  const [name, setName] = useState(''); const [model, setModel] = useState('');
  const [contextTokens, setContextTokens] = useState(8192); const [outputTokens, setOutputTokens] = useState(2048);
  const [kind, setKind] = useState('ollama'); const [endpoint, setEndpoint] = useState('http://127.0.0.1:11434');
  const [secret, setSecret] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api.invoke('profile.save', { ...(editing ? { id: editing.id, expectedRevision: editing.revision } : {}), name, kind, endpoint, model, contextTokens, outputTokens, ...(secret ? { secret } : {}) }); setSecret(''); saved(); close(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Profile could not be saved.'); } finally { setBusy(false); }
  }
  function edit(profile: Profile) {
    setEditing(profile); setName(profile.name); setKind(profile.kind); setEndpoint(profile.endpoint); setModel(profile.model);
    setContextTokens(profile.contextTokens); setOutputTokens(profile.outputTokens); setSecret(''); setError(''); setNotice('');
  }
  return <Modal title="Model profiles" close={close}><p>Connect to your local Ollama runtime or an OpenAI-compatible API.</p>{profiles.length > 0 && <div className="profile-list">{profiles.map(p => <div key={p.id}><div><strong>{p.name}</strong><small>{p.model} · {p.locality === 'local' ? 'Local' : 'Cloud'} · {p.contextTokens.toLocaleString()} context</small></div><button disabled={busy} aria-label={`Edit ${p.name}`} onClick={() => edit(p)}>Edit</button><button disabled={busy} onClick={() => { setBusy(true); setError(''); void api.invoke('profile.test', { profileId: p.id }).then(() => setNotice(`${p.name}: connection succeeded`)).catch(reason => setError(String(reason.message))).finally(() => setBusy(false)); }}>Test connection</button></div>)}</div>}{notice && <p role="status">{notice}</p>}<form onSubmit={event => void save(event)} className="profile-form">{editing && <p role="status">Editing {editing.name}. Changes apply to future runs. Leave the key blank to keep the encrypted credential at the same endpoint.</p>}<label>Profile name<input required value={name} onChange={e => setName(e.target.value)} autoComplete="off" /></label><label>Provider<select value={kind} onChange={e => { setKind(e.target.value); setEndpoint(e.target.value === 'ollama' ? 'http://127.0.0.1:11434' : 'https://api.openai.com/v1'); }}><option value="ollama">Ollama (local)</option><option value="openai-compatible">OpenAI-compatible API</option></select></label><label>Endpoint<input required type="url" value={endpoint} onChange={e => setEndpoint(e.target.value)} /></label><label>Model name<input required value={model} onChange={e => setModel(e.target.value)} placeholder="Exact model name from your provider" /></label><p className="muted">Use the context window supported by this exact model. Raising this number does not increase the provider’s limit. The maximum response is reserved inside the window.</p><label>Context window (tokens)<input type="number" min="512" max="2000000" required value={contextTokens} onChange={e => setContextTokens(Number(e.target.value))} /></label><label>Maximum response (tokens)<input type="number" min="1" max={Math.min(200000, contextTokens)} required value={outputTokens} onChange={e => setOutputTokens(Number(e.target.value))} /></label><label>API key <span className="muted">(optional for local models)</span><input type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="new-password" /></label><p className="muted">Keys are encrypted by Windows and cannot be retrieved from this interface.</p>{error && <p role="alert" className="form-error">{error}</p>}<div className="modal-actions"><button type="button" onClick={close}>Cancel</button><button className="primary" disabled={busy} type="submit">{busy ? 'Saving…' : editing ? 'Save changes' : 'Save profile'}</button></div></form></Modal>;
}

function MessageItem({ message }: { message: Message }) {
  if (message.role === 'tool') {
    if (message.toolName === 'run_command' || message.toolName?.startsWith('git_')) {
      try {
        const result = CommandResultSchema.parse(JSON.parse(message.content));
        const status = result.cancelled ? 'Stopped' : result.timedOut ? 'Timed out' : result.status === 'unknown' ? 'Outcome unknown' : result.status === 'failed' ? 'Could not start' : `Exit code ${result.code}`;
        return <details className="message tool"><summary>{message.toolName === 'run_command' ? 'Command' : 'Git'} · {status}{result.truncated ? ' · Output truncated' : ''}</summary><pre className="message-content">{result.output || '(no output)'}</pre></details>;
      } catch { /* Read-tool errors retain their structured explanation. */ }
    }
    return <details className="message tool"><summary>{message.toolName ?? 'File tool'} result</summary><pre className="message-content">{message.content}</pre></details>;
  }
  const content = message.content || (message.toolCalls?.some(call => call.name === 'run_command') ? 'Preparing a command for review…' : message.toolCalls?.some(call => ['write_file', 'edit_file'].includes(call.name)) ? 'Preparing an edit for review…' : message.toolCalls?.length ? 'Inspecting the project…' : '');
  if (!content) return null;
  return <article className={`message ${message.role}`}><div className="message-author">{message.role === 'user' ? 'You' : 'MoonAliza'}</div><div className="message-content">{content}</div></article>;
}
