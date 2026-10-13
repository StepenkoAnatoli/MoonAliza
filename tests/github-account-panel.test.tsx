// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, onTestFinished, test, vi } from 'vitest';
import { GitHubAttemptOutcomeSchema, GitHubEndedSchema, type GitHubAccountStatus } from '../src/shared';
import { App } from '../src/renderer/App';

// GitHub sign-in, U4 renderer (docs/specification/github-sign-in.md section 8; "Tests the builders owe",
// tests/github-account-panel.test.tsx). The fake AppApi below is built from the frozen DTO (src/shared/github-account.ts);
// no main process, network or browser storage is involved.
afterEach(cleanup);

type Call = { method: string; params: Record<string, unknown> };
const project = { id: 'p1', name: 'My project', pathLabel: 'C:\\work\\my-project', trusted: true, trustRevision: 1, policy: { revision: 1, inference: 'local-only', research: 'off' }, missing: false, createdAt: '2026-10-13T00:00:00Z' };
const cloudProfile = { id: 'cloud', name: 'Cloud connection', kind: 'openai-compatible', endpoint: 'https://provider.example/v1', model: 'test', contextTokens: 8192, outputTokens: 2048, locality: 'external', revision: 2, revisionId: 'revision-2', hasCredential: true, createdAt: project.createdAt, updatedAt: project.createdAt };

/** The workbench routes App needs to load (as tests/workbench.test.tsx answers them), plus any route a test supplies. */
function workbench({ projects = [] as unknown[], profiles = [] as unknown[], routes = {} as Record<string, (params: Record<string, unknown>) => unknown> } = {}) {
  const calls: Call[] = [];
  const api = {
    async invoke(method: string, params: Record<string, unknown> = {}) {
      calls.push({ method, params });
      if (routes[method]) return routes[method](params);
      if (method === 'project.list') return { projects };
      if (method === 'profile.list') return { profiles };
      if (method === 'session.list') return { sessions: [] };
      if (method === 'changes.list') return { changes: [], hasMore: false };
      if (method === 'recovery.list') return { items: [], hasMore: false, pendingCount: 0 };
      if (method === 'storage.read') return { usedBytes: 0, limitBytes: 268435456, snapshotCount: 0, protectedBytes: 0 };
      throw new Error('Unexpected route');
    },
    onEvent: () => () => {},
  };
  return { api, calls, github: () => calls.filter(call => call.method.startsWith('github.')) };
}
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
const ready = () => waitFor(() => expect(screen.getByLabelText('Message MoonAliza').hasAttribute('disabled')).toBe(false));

// Regression pins, committed before the renderer change (spec 8.1, 8.4).

test('pin: the workbench makes no github call while it loads, and none before the GitHub dialog opens', async () => {
  // Mutation that turns this red: App reads github.account.read on mount (the sidebar would then depend on the sign-in,
  // and spec 8.1 keeps the login out of the sidebar).
  const { api, github } = workbench({ projects: [project] });
  render(<App api={api} />);
  await screen.findByRole('heading', { name: project.name });
  await ready();
  await settle();
  expect(github()).toEqual([]);
});

test('pin: the Build-mode composer footnote is unchanged', async () => {
  // Spec 8.4: "Build: unchanged". Mutation that turns this red: rewrite the Build footnote with the new GitHub wording.
  const { api } = workbench({ projects: [project] });
  render(<App api={api} />);
  await screen.findByRole('heading', { name: project.name });
  await ready();
  fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'build' } });
  expect(document.querySelector('.composer-footnote')!.textContent).toBe('File changes and commands require your review.');
});

test('pin: the conversation cloud dialog keeps its existing sentences', async () => {
  // Spec 8.4 adds one clause to this dialog (src/renderer/App.tsx:243); it replaces nothing. Mutation that turns this red:
  // the clause replaces the first sentence.
  const { api } = workbench({ profiles: [cloudProfile] });
  render(<App api={api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'Review cloud access' }));
  const dialog = await screen.findByRole('dialog', { name: 'Allow cloud for this conversation?' });
  const text = dialog.textContent ?? '';
  expect(text).toContain("Allow this conversation's messages and any reviewed handoff text to be sent to external model providers you select.");
  expect(text).toContain('Project privacy rules still apply.');
  expect(within(dialog).getByText('Nothing is sent by changing this setting. Your draft stays ready.')).toBeTruthy();
});

// Behaviour tests (spec 8.1-8.4). The texts are the spec's, copied here so a drift in src/renderer/github-text.ts is red.
// Status fixtures are built from the frozen DTO (built from E-01/E-02/E-15 shapes, not a capture); the user code is made
// up, and markers are generated at run time. The renderer modules are imported inside each test, by a path Vite does not
// analyse, so that before they existed these tests failed one by one while the pins above still ran.
const PANEL_MODULE = '../src/renderer/GitHubAccountPanel';
const TEXT_MODULE = '../src/renderer/github-text';
const loadPanel = async () => ((await import(/* @vite-ignore */ PANEL_MODULE)) as typeof import('../src/renderer/GitHubAccountPanel')).GitHubAccountPanel;
const loadTexts = async () => (await import(/* @vite-ignore */ TEXT_MODULE)) as typeof import('../src/renderer/github-text');

type Status = GitHubAccountStatus;
const CODE = 'QX7P-2LMB';
const T0 = Date.parse('2026-10-13T12:00:00.000Z');
const signedOut = (patch: Partial<Extract<Status, { state: 'signed-out' }>> = {}): Status => ({ state: 'signed-out', ended: null, signOutIncomplete: false, lastOutcome: null, ...patch });
const pending = (patch: Partial<Extract<Status, { state: 'pending' }>> = {}): Status => ({ state: 'pending', userCode: CODE, codeExpiresAt: new Date(T0 + 900_000).toISOString(), committed: false, account: null, ...patch });
const signedIn = (patch: Partial<Extract<Status, { state: 'signed-in' }>> = {}): Status => ({ state: 'signed-in', login: 'octo-cat', renewalHeld: false, lastOutcome: null, ...patch });
const NOT_CONFIGURED: Status = { state: 'not-configured' };

const TEXT = {
  notConfigured: 'GitHub sign-in is not configured in this build.',
  intro: "Sign in to GitHub so MoonAliza can read your private repositories, read-only. MoonAliza shows a code that you enter at github.com/login/device. It can then read repositories where you install MoonAliza's GitHub App, and only repositories you paste into a conversation. It never writes to GitHub. Your sign-in is kept encrypted on this computer, and MoonAliza never shows it to models or asks you to paste a token.",
  ud4: "While you are signed in, every GitHub read MoonAliza makes, public repositories included, uses your sign-in and counts toward your GitHub account's rate limit.",
  ud3: "Text read from a private repository is handled like your local project files. It is read only in conversations where you pasted the repository's URL. It is saved in that conversation and its search. It is sent to a cloud model only when that conversation allows cloud models. Signing out does not delete it; deleting the conversation removes it from MoonAliza.",
  enterCode: 'Enter this code at github.com/login/device:',
  waiting: 'Waiting for GitHub…',
  phishing: "Only enter a code shown in this dialog. MoonAliza never asks for a code in a conversation. On GitHub, check that you are authorizing MoonAliza's GitHub App, which asks for read-only access to repository contents and metadata.",
  keepOpen: 'Keep this dialog open until GitHub confirms: closing it cancels the sign-in.',
  staySignedIn: 'You stay signed in until this sign-in finishes.',
  confirmed: 'GitHub confirmed the code. Finishing sign-in…',
  unknownLogin: 'Signed in to GitHub (account name unavailable).',
  install: "Signing in installs nothing. To let MoonAliza read a private repository, install MoonAliza's GitHub App on the account that owns it; on GitHub you choose All repositories or Only select repositories. In an organization, an owner installs it, or you can request it from the install page.",
  held: 'MoonAliza could not renew your GitHub sign-in just now, so some GitHub reads fail until it can. If this continues, sign in again.',
  unchanged: 'Your existing sign-in is unchanged.',
  // The spec asks for the UD-3 and UD-4 sentences "in short form" when signed in and gives no wording; these are U4's.
  ud4Short: "Every GitHub read MoonAliza makes, public repositories included, uses your sign-in and counts toward your GitHub account's rate limit.",
  ud3Short: "Text read from a private repository is handled like your local project files: it is read only in conversations where you pasted its URL, reaches a cloud model only when that conversation allows cloud models, and stays there after you sign out until you delete the conversation.",
  signOutDone: 'MoonAliza stopped using your GitHub sign-in. Its encrypted copy on this computer is deleted now, or, if a file cannot be deleted at once, the next time MoonAliza starts.',
  signOutIncomplete: "MoonAliza stopped using your GitHub sign-in, but could not finish removing its copy from this computer's disk. After MoonAliza restarts you may be signed in again; if so, sign out again.",
  notRevoked: 'This did not revoke anything on GitHub: the authorization and its tokens stay valid there until you revoke them or they expire, up to 8 hours for the access token and 6 months for the refresh token.',
  howToRevoke: "To revoke it on GitHub: click your profile picture, then Settings; in the Integrations section of the sidebar, click Applications; open the Authorized GitHub Apps tab; then click Revoke next to MoonAliza's app.",
  whoRevokes: 'Only the person who authorized the app can revoke it; an organization owner can uninstall the app from the organization instead.',
  chatFootnote: 'Paste a GitHub repository URL to read it; private repositories need GitHub sign-in (sidebar). What is read stays in this conversation and reaches a cloud model only if this conversation allows cloud models. General chat has no local file or command access.',
  projectFootnote: 'This mode does not modify project files. GitHub URLs you paste can be read; private ones need GitHub sign-in.',
  cloudClause: 'This includes text MoonAliza reads from GitHub repositories you paste, private ones too when you are signed in to GitHub.',
  f26: 'Claude and OpenAI models use API keys: Anthropic does not permit other apps to offer Claude.ai sign-in, and OpenAI documents Sign in with ChatGPT only for its own apps, so MoonAliza offers neither.',
};
const ENDED = {
  'sign-in-ended': 'Your GitHub sign-in ended: it expired, or GitHub no longer accepts it. Sign in again to read private repositories.',
  'app-changed': 'This build of MoonAliza uses a different GitHub App from the one you signed in with, so it removed that sign-in. Sign in again to read private repositories.',
  'client-rejected': "GitHub did not accept MoonAliza's GitHub App when renewing your sign-in, so the sign-in ended. Sign in again; if GitHub does not accept the sign-in either, this build cannot sign in.",
};
const OUTCOMES = {
  cancelled: 'Sign-in cancelled. Nothing was saved.',
  expired: 'The code expired before GitHub confirmed it. GitHub may also be limiting sign-ins right now; start again, or try again later.',
  restart: 'GitHub did not accept this sign-in code. Start again to get a new code.',
  denied: 'Access was denied on GitHub, and that code cannot be used again. Start again if you want to sign in.',
  disabled: "GitHub says sign-in with a code is turned off for MoonAliza's GitHub App, so this build cannot sign in.",
  'client-rejected': "GitHub did not recognise this build's GitHub App, so this build cannot sign in.",
  'grant-unsupported': 'GitHub refused the sign-in request this build sent, so this build cannot sign in.',
  'email-unverified': 'GitHub needs a verified email address on your account first. Verify it on GitHub, then start again.',
  'rate-limited': 'GitHub is limiting sign-in requests right now. Wait a few minutes, then start again.',
  'start-failed': 'MoonAliza could not get a sign-in code from GitHub. Check your connection, then try again.',
  failed: 'Sign-in did not complete, and nothing was saved. Start again.',
};

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void };
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void; let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
/** A fake GitHub side of the AppApi: the status main would project, and each method's reply (spec 3.3). */
function github(initial: Status, routes: Record<string, (params: Record<string, unknown>) => unknown> = {}, bench: { projects?: unknown[]; profiles?: unknown[] } = {}) {
  const state = { account: initial };
  const fake = workbench({ ...bench, routes: {
    'github.account.read': () => ({ account: state.account }),
    'github.signIn.cancel': () => { if (state.account.state === 'pending' && !state.account.committed) state.account = signedOut({ lastOutcome: 'cancelled' }); return { account: state.account }; },
    'github.open': () => ({ opened: true }),
    ...routes,
  } });
  return { ...fake, state, count: (method: string) => fake.calls.filter(call => call.method === method).length };
}
const panelOf = () => screen.getByTestId('github-account-panel');
const useFakeClock = () => { vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }); vi.setSystemTime(T0); };
const tick = async (ms: number) => { await act(async () => { vi.advanceTimersByTime(ms); }); await settle(); };
/** Loads the app's stylesheet into this test's document; jsdom applies its rules to getComputedStyle and to role queries. */
const useAppStyles = () => {
  const style = document.createElement('style');
  style.textContent = readFileSync(join(import.meta.dirname, '../src/renderer/styles.css'), 'utf8');
  document.head.append(style);
  onTestFinished(() => style.remove());
};
afterEach(() => { vi.useRealTimers(); });

test('not configured says so, and nothing else: no button', async () => {
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(NOT_CONFIGURED);
  render(<GitHubAccountPanel api={api} />);
  await settle();
  expect(panelOf().textContent).toBe(TEXT.notConfigured);
  expect(within(panelOf()).queryAllByRole('button')).toEqual([]);
});

test('signed out offers Sign in, with what it does and both disclosures, and no ended or outcome text', async () => {
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(signedOut());
  render(<GitHubAccountPanel api={api} />);
  await settle();
  const text = panelOf().textContent ?? '';
  for (const sentence of [TEXT.intro, TEXT.ud4, TEXT.ud3]) expect(text).toContain(sentence);
  expect(within(panelOf()).getAllByRole('button').map(button => button.textContent)).toEqual(['Sign in']);
  for (const other of [...Object.values(ENDED), ...Object.values(OUTCOMES), TEXT.signOutDone, TEXT.notRevoked]) expect(text).not.toContain(other);
});

test.each(Object.entries(ENDED))('signed out after the app ended the account (%s) says why, in the status region', async (ended, expected) => {
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(signedOut({ ended: ended as 'sign-in-ended' }));
  render(<GitHubAccountPanel api={api} />);
  await settle();
  expect(within(panelOf()).getByRole('status').textContent).toContain(expected);
  for (const [other, sentence] of Object.entries(ENDED)) if (other !== ended) expect(panelOf().textContent).not.toContain(sentence);
});

test.each(Object.entries(OUTCOMES))('a signed-out status with lastOutcome %s announces its text', async (outcome, expected) => {
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(signedOut({ lastOutcome: outcome as 'failed' }));
  render(<GitHubAccountPanel api={api} />);
  await settle();
  expect(within(panelOf()).getByRole('status').textContent).toBe(expected);
});

test('pending before GitHub confirms: the code, the time left, Open GitHub, Cancel, the phishing and keep-open sentences', async () => {
  useFakeClock();
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(pending());
  render(<GitHubAccountPanel api={api} />);
  await settle();
  const panel = panelOf();
  const text = panel.textContent ?? '';
  for (const sentence of [TEXT.enterCode, TEXT.phishing, TEXT.keepOpen]) expect(text).toContain(sentence);
  // The code is its own selectable element (the next test checks the stylesheet's user-select: all); no clipboard API is used.
  expect(within(panel).getByText(CODE).className).toBe('github-user-code');
  expect(within(panel).getByText('The code expires in 15:00.')).toBeTruthy();
  expect(within(panel).getAllByRole('button').map(button => button.textContent)).toEqual(['Open GitHub', 'Cancel']);
  expect(text).not.toContain(TEXT.staySignedIn);
  expect(text).not.toContain('You stay signed in as');
  await tick(61_000);
  expect(within(panel).getByText('The code expires in 13:59.')).toBeTruthy();
  await tick(839_000);
  expect(within(panel).getByText(TEXT.waiting)).toBeTruthy();
  expect(panel.textContent).not.toContain('The code expires in');
});

test('the code is selected whole with one click: the app stylesheet gives it user-select: all (spec 8.1)', async () => {
  // Mutation that turns this red: delete user-select:all from the .github-user-code rule in src/renderer/styles.css.
  useAppStyles();
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(pending());
  render(<GitHubAccountPanel api={api} />);
  await settle();
  expect(getComputedStyle(within(panelOf()).getByText(CODE)).getPropertyValue('user-select')).toBe('all');
});

test('pending during Sign in again says the current sign-in stays, with or without its login', async () => {
  const GitHubAccountPanel = await loadPanel();
  const named = github(pending({ account: { login: 'octo-cat' } }));
  const view = render(<GitHubAccountPanel api={named.api} />);
  await settle();
  expect(panelOf().textContent).toContain('You stay signed in as octo-cat until this sign-in finishes.');
  view.unmount();
  const unnamed = github(pending({ account: { login: null } }));
  render(<GitHubAccountPanel api={unnamed.api} />);
  await settle();
  expect(panelOf().textContent).toContain(TEXT.staySignedIn);
  expect(panelOf().textContent).not.toContain('You stay signed in as');
});

test('pending after GitHub confirms shows only that sign-in is finishing, with no button (DC-5)', async () => {
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(pending({ committed: true, account: { login: 'octo-cat' } }));
  render(<GitHubAccountPanel api={api} />);
  await settle();
  expect(panelOf().textContent).toBe(TEXT.confirmed);
  expect(within(panelOf()).queryAllByRole('button')).toEqual([]);
});

test('signed in shows the login, the install text, the three actions and the short disclosures', async () => {
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(signedIn());
  render(<GitHubAccountPanel api={api} />);
  await settle();
  const text = panelOf().textContent ?? '';
  for (const sentence of ['Signed in as octo-cat.', TEXT.install, TEXT.ud4Short, TEXT.ud3Short]) expect(text).toContain(sentence);
  expect(within(panelOf()).getAllByRole('button').map(button => button.textContent)).toEqual(['Install on repositories', 'Sign in again', 'Sign out']);
  expect(text).not.toContain(TEXT.held);
  expect(text).not.toContain(TEXT.unchanged);
  expect(within(panelOf()).getByRole('status').textContent).toBe('');
});

test('signed in with no login, with renewal held and with a last outcome', async () => {
  const GitHubAccountPanel = await loadPanel();
  const { api } = github(signedIn({ login: null, renewalHeld: true, lastOutcome: 'expired' }));
  render(<GitHubAccountPanel api={api} />);
  await settle();
  const text = panelOf().textContent ?? '';
  expect(text).toContain(TEXT.unknownLogin);
  expect(text).not.toContain('Signed in as');
  const status = within(panelOf()).getByRole('status').textContent ?? '';
  expect(status).toContain(TEXT.held);
  // The outcome's text, then that the existing sign-in is unchanged (spec 8.2).
  expect(status.indexOf(OUTCOMES.expired)).toBeGreaterThanOrEqual(0);
  expect(status.indexOf(TEXT.unchanged)).toBeGreaterThan(status.indexOf(OUTCOMES.expired));
});

test.each([false, true])('Sign out shows the four-part help text (signOutIncomplete %s), and no text claims a revocation or erasure', async incomplete => {
  const GitHubAccountPanel = await loadPanel();
  const fake = github(signedIn(), { 'github.signOut': () => { fake.state.account = signedOut({ signOutIncomplete: incomplete }); return { account: fake.state.account }; } });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  expect(panelOf().textContent).not.toContain(TEXT.notRevoked);
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Sign out' }));
  await settle();
  expect(fake.calls.filter(call => call.method === 'github.signOut').map(call => call.params)).toEqual([{}]);
  const text = panelOf().textContent ?? '';
  const parts = [incomplete ? TEXT.signOutIncomplete : TEXT.signOutDone, TEXT.notRevoked, TEXT.howToRevoke, TEXT.whoRevokes];
  const positions = parts.map(part => text.indexOf(part));
  expect(positions.every(position => position >= 0), `missing: ${parts.filter((_part, index) => positions[index]! < 0).join(' | ')}`).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  expect(text).not.toContain(incomplete ? TEXT.signOutDone : TEXT.signOutIncomplete);
  expect(text).not.toMatch(/revoked|erased/i);
  // No URL is shown for the revoke tab (F-12).
  expect(text).not.toMatch(/https?:|github\.com\/settings/);
  // The signed-out offer follows, so the user can sign in again from here.
  expect(within(panelOf()).getByRole('button', { name: 'Sign in' })).toBeTruthy();
});

test('the sign-out help text belongs to that sign-out: a new start clears it', async () => {
  // Guard: the renderer-local flag is cleared on Sign in (mutation: keep it; a start that fails at once would then show
  // the old sign-out text beside the new outcome).
  const GitHubAccountPanel = await loadPanel();
  const fake = github(signedIn(), {
    'github.signOut': () => { fake.state.account = signedOut(); return { account: fake.state.account }; },
    'github.signIn.start': () => { fake.state.account = signedOut({ lastOutcome: 'start-failed' }); return { account: fake.state.account }; },
  });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Sign out' }));
  await settle();
  expect(panelOf().textContent).toContain(TEXT.notRevoked);
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Sign in' }));
  await settle();
  expect(within(panelOf()).getByRole('status').textContent).toBe(OUTCOMES['start-failed']);
  expect(panelOf().textContent).not.toContain(TEXT.signOutDone);
});

test('the time left is counted from when the code arrives, not from when the dialog opened', async () => {
  // Guard: the clock is read again when a sign-in becomes pending (mutation: keep the clock read at mount; a code that
  // arrives five minutes after the dialog opened would then show five minutes too many until the next poll).
  useFakeClock();
  const GitHubAccountPanel = await loadPanel();
  const fake = github(signedOut(), { 'github.signIn.start': () => { fake.state.account = pending({ codeExpiresAt: new Date(Date.now() + 900_000).toISOString() }); return { account: fake.state.account }; } });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  vi.setSystemTime(T0 + 300_000);
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Sign in' }));
  await settle();
  expect(within(panelOf()).getByText('The code expires in 15:00.')).toBeTruthy();
});

test('mount, unmount and remount never start a sign-in, in any state (F-2, U-16)', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  const GitHubAccountPanel = await loadPanel();
  for (const status of [NOT_CONFIGURED, signedOut(), pending(), pending({ committed: true }), signedIn()]) {
    const fake = github(status);
    const first = render(<GitHubAccountPanel api={fake.api} />);
    await settle();
    first.unmount();
    render(<GitHubAccountPanel api={fake.api} />);
    await settle();
    cleanup();
    expect(fake.count('github.signIn.start'), status.state).toBe(0);
    expect(fake.count('github.account.read'), status.state).toBe(2);
  }
});

test('the status is polled about once a second only while pending, and the poll stops on a state change', async () => {
  useFakeClock();
  const GitHubAccountPanel = await loadPanel();
  const fake = github(pending());
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  expect(fake.count('github.account.read')).toBe(1);
  await tick(999);
  expect(fake.count('github.account.read')).toBe(1);
  await tick(1);
  expect(fake.count('github.account.read')).toBe(2);
  await tick(3000);
  expect(fake.count('github.account.read')).toBe(5);
  fake.state.account = pending({ committed: true, account: { login: null } });
  await tick(1000);
  expect(panelOf().textContent).toBe(TEXT.confirmed);
  await tick(1000);
  expect(fake.count('github.account.read')).toBe(7);
  fake.state.account = signedIn();
  await tick(1000);
  expect(panelOf().textContent).toContain('Signed in as octo-cat.');
  await tick(10_000);
  expect(fake.count('github.account.read')).toBe(8);
  expect(fake.count('github.signIn.start')).toBe(0);
});

test('a signed-out or signed-in panel never polls, and an unmounted one stops', async () => {
  useFakeClock();
  const GitHubAccountPanel = await loadPanel();
  for (const status of [signedOut(), signedIn(), NOT_CONFIGURED]) {
    const fake = github(status);
    render(<GitHubAccountPanel api={fake.api} />);
    await settle();
    await tick(10_000);
    expect(fake.count('github.account.read'), status.state).toBe(1);
    cleanup();
  }
  const fake = github(pending());
  const view = render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  await tick(2000);
  expect(fake.count('github.account.read')).toBe(3);
  view.unmount();
  await tick(10_000);
  expect(fake.count('github.account.read')).toBe(3);
});

test('Cancel ends a pending sign-in, announces the outcome and stops the poll', async () => {
  useFakeClock();
  const GitHubAccountPanel = await loadPanel();
  const fake = github(pending());
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Cancel' }));
  await settle();
  expect(fake.calls.filter(call => call.method === 'github.signIn.cancel').map(call => call.params)).toEqual([{}]);
  expect(within(panelOf()).getByRole('status').textContent).toBe(OUTCOMES.cancelled);
  const reads = fake.count('github.account.read');
  await tick(10_000);
  expect(fake.count('github.account.read')).toBe(reads);
});

test('a status reply older than one already shown is not applied', async () => {
  // Guard: the reply ordering (mutation: apply every reply as it arrives; a poll sent before Cancel then brings the
  // cancelled sign-in back on screen).
  useFakeClock();
  const GitHubAccountPanel = await loadPanel();
  const late = deferred<unknown>();
  let reads = 0;
  const fake = github(pending(), { 'github.account.read': () => (++reads === 2 ? late.promise : { account: fake.state.account }) });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  await tick(1000);
  expect(reads).toBe(2);
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Cancel' }));
  await settle();
  expect(within(panelOf()).getByRole('status').textContent).toBe(OUTCOMES.cancelled);
  await act(async () => late.resolve({ account: pending() }));
  await settle();
  expect(within(panelOf()).getByRole('status').textContent).toBe(OUTCOMES.cancelled);
  expect(within(panelOf()).queryByText(CODE)).toBeNull();
});

test.each(['Sign in', 'Sign in again'])('%s is disabled while a call is in flight, so a double click spends one code', async name => {
  const GitHubAccountPanel = await loadPanel();
  const reply = deferred<unknown>();
  const fake = github(name === 'Sign in' ? signedOut() : signedIn(), { 'github.signIn.start': () => reply.promise });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  const button = within(panelOf()).getByRole('button', { name });
  fireEvent.click(button);
  fireEvent.click(button);
  await settle();
  expect(button.hasAttribute('disabled')).toBe(true);
  fireEvent.click(button);
  expect(fake.calls.filter(call => call.method === 'github.signIn.start').map(call => call.params)).toEqual([{}]);
  await act(async () => reply.resolve({ account: pending(name === 'Sign in' ? {} : { account: { login: 'octo-cat' } }) }));
  await settle();
  expect(within(panelOf()).getByText(CODE)).toBeTruthy();
  expect(fake.count('github.signIn.start')).toBe(1);
});

test.each([
  ['Sign out', 'github.signOut'],
  ['Install on repositories', 'github.open'],
] as const)('Sign in again is also disabled while %s is in flight, and enabled once that call ends', async (other, method) => {
  // Spec 8.1: Sign in again is disabled while any call is in flight. Mutation that turns this red: disable it only while a
  // start is in flight (busy === 'github.signIn.start').
  const GitHubAccountPanel = await loadPanel();
  const reply = deferred<unknown>();
  const fake = github(signedIn(), { [method]: () => reply.promise });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  fireEvent.click(within(panelOf()).getByRole('button', { name: other }));
  await settle();
  const again = within(panelOf()).getByRole('button', { name: 'Sign in again' });
  expect(again.hasAttribute('disabled')).toBe(true);
  fireEvent.click(again);
  expect(fake.count('github.signIn.start')).toBe(0);
  // Sign out is refused here, so the signed-in view stays; Install opens the page.
  await act(async () => (method === 'github.open' ? reply.resolve({ opened: true }) : reply.reject(new Error('The engine is restarting. Try again when it is ready.'))));
  await settle();
  expect(within(panelOf()).getByRole('button', { name: 'Sign in again' }).hasAttribute('disabled')).toBe(false);
});

test('Open GitHub sends the device target and Install on repositories the install target, never a URL', async () => {
  const GitHubAccountPanel = await loadPanel();
  const fake = github(pending());
  const view = render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Open GitHub' }));
  await settle();
  view.unmount();
  fake.state.account = signedIn();
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Install on repositories' }));
  await settle();
  expect(fake.calls.filter(call => call.method === 'github.open').map(call => call.params)).toEqual([{ target: 'device' }, { target: 'install' }]);
});

test('an invoke failure shows its message, and the state shown is kept', async () => {
  const GitHubAccountPanel = await loadPanel();
  const fake = github(pending(), { 'github.open': () => { throw new Error('This operation is no longer available.'); } });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  fireEvent.click(within(panelOf()).getByRole('button', { name: 'Open GitHub' }));
  await settle();
  expect(within(panelOf()).getByRole('alert').textContent).toBe('This operation is no longer available.');
  expect(within(panelOf()).getByText(CODE)).toBeTruthy();
  cleanup();
  const failing = github(signedOut(), { 'github.account.read': () => { throw new Error('The engine is restarting. Try again when it is ready.'); } });
  render(<GitHubAccountPanel api={failing.api} />);
  await settle();
  expect(within(panelOf()).getByRole('alert').textContent).toBe('The engine is restarting. Try again when it is ready.');
  expect(within(panelOf()).queryAllByRole('button')).toEqual([]);
});

test.each([
  ['Open GitHub', 'github.open'],
  ['Cancel', 'github.signIn.cancel'],
] as const)('a refused %s stays on screen while the pending status is polled', async (name, method) => {
  // The action's failure belongs to the user's click, not to a status read. Mutation that turns this red: clear the
  // error whenever a status reply is applied (the refusal would then vanish at the next poll, a second later).
  useFakeClock();
  const GitHubAccountPanel = await loadPanel();
  const fake = github(pending(), { [method]: () => { throw new Error('This operation is no longer available.'); } });
  render(<GitHubAccountPanel api={fake.api} />);
  await settle();
  fireEvent.click(within(panelOf()).getByRole('button', { name }));
  await settle();
  expect(within(panelOf()).getByRole('alert').textContent).toBe('This operation is no longer available.');
  await tick(3000);
  expect(fake.count('github.account.read')).toBe(4);
  expect(within(panelOf()).getByRole('alert').textContent).toBe('This operation is no longer available.');
  expect(within(panelOf()).getByText(CODE)).toBeTruthy();
});

test('every outcome and every ended reason has its spec text, and no text says anything was revoked or erased', async () => {
  const texts = await loadTexts();
  expect(Object.keys(texts.GITHUB_OUTCOMES).sort()).toEqual([...GitHubAttemptOutcomeSchema.options].sort());
  expect(Object.keys(texts.GITHUB_ENDED).sort()).toEqual([...GitHubEndedSchema.options].sort());
  expect(texts.GITHUB_OUTCOMES).toEqual(OUTCOMES);
  expect(texts.GITHUB_ENDED).toEqual(ENDED);
  const strings: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') strings.push(value);
    else if (typeof value === 'function') strings.push(String(value('octo-cat')));
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  Object.values(texts).forEach(walk);
  expect(strings.length).toBeGreaterThan(40);
  for (const text of strings) expect(text).not.toMatch(/revoked|erased/i);
});

test('the sidebar GitHub button opens the GitHub account dialog, which reads the status once on open', async () => {
  const fake = github(signedOut());
  render(<App api={fake.api} />);
  await ready();
  expect(fake.github()).toEqual([]);
  fireEvent.click(within(screen.getByRole('complementary', { name: 'Projects and conversations' })).getByRole('button', { name: 'GitHub' }));
  const dialog = await screen.findByRole('dialog', { name: 'GitHub account' });
  expect(await within(dialog).findByRole('button', { name: 'Sign in' })).toBeTruthy();
  expect(fake.github().map(call => call.method)).toEqual(['github.account.read']);
  // The sidebar never shows the sign-in (spec 8.1).
  expect(within(screen.getByRole('complementary', { name: 'Projects and conversations' })).queryByText(/octo-cat|Signed in/)).toBeNull();
});

test('while the GitHub dialog is open, Ctrl+O and Ctrl+N do nothing', async () => {
  const fake = github(signedOut());
  render(<App api={fake.api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  await screen.findByRole('dialog', { name: 'GitHub account' });
  fireEvent.keyDown(window, { key: 'o', ctrlKey: true });
  fireEvent.keyDown(window, { key: 'n', ctrlKey: true });
  await settle();
  expect(fake.calls.map(call => call.method)).not.toContain('project.pick');
  expect(fake.calls.map(call => call.method)).not.toContain('session.create');
});

test.each([
  ['the close button', (dialog: HTMLElement) => fireEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }))],
  ['Escape', (dialog: HTMLElement) => fireEvent.keyDown(dialog, { key: 'Escape' })],
] as const)('closing the dialog with %s cancels a sign-in GitHub has not confirmed (6.6)', async (_how, close) => {
  const fake = github(pending());
  render(<App api={fake.api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  const dialog = await screen.findByRole('dialog', { name: 'GitHub account' });
  await within(dialog).findByText(CODE);
  close(dialog);
  await settle();
  expect(screen.queryByRole('dialog', { name: 'GitHub account' })).toBeNull();
  expect(fake.calls.filter(call => call.method === 'github.signIn.cancel').map(call => call.params)).toEqual([{}]);
});

test.each([
  ['pending, confirmed by GitHub', pending({ committed: true, account: { login: null } })],
  ['signed out', signedOut()],
  ['signed in', signedIn()],
  ['not configured', NOT_CONFIGURED],
] as const)('closing the dialog when %s calls nothing (DC-5)', async (_name, status) => {
  const fake = github(status);
  render(<App api={fake.api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  const dialog = await screen.findByRole('dialog', { name: 'GitHub account' });
  await waitFor(() => expect(within(dialog).getByTestId('github-account-panel').textContent).not.toBe(''));
  const before = fake.calls.length;
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
  await settle();
  expect(screen.queryByRole('dialog', { name: 'GitHub account' })).toBeNull();
  expect(fake.calls.slice(before)).toEqual([]);
});

test('closing the dialog while Sign in is still waiting for its code cancels that sign-in', async () => {
  // Spec 2.2: F1 (step 1 in flight) is left by "Cancel, sign-out, close or quit"; the status still shows the state before.
  const reply = deferred<unknown>();
  const fake = github(signedOut(), { 'github.signIn.start': () => reply.promise });
  render(<App api={fake.api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  const dialog = await screen.findByRole('dialog', { name: 'GitHub account' });
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Sign in' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
  await settle();
  expect(fake.count('github.signIn.cancel')).toBe(1);
  await act(async () => reply.resolve({ account: signedOut({ lastOutcome: 'cancelled' }) }));
  await settle();
  expect(fake.count('github.signIn.cancel')).toBe(1);
});

test('a cancel on close that fails is reported in the workbench', async () => {
  // Guard: the close handler reports the refusal (mutation: swallow it; the sign-in would then keep running unseen
  // with no word to the user).
  const fake = github(pending(), { 'github.signIn.cancel': () => { throw new Error('The engine is restarting. Try again when it is ready.'); } });
  render(<App api={fake.api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  const dialog = await screen.findByRole('dialog', { name: 'GitHub account' });
  await within(dialog).findByText(CODE);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
  expect((await screen.findByRole('alert')).textContent).toContain('The engine is restarting. Try again when it is ready.');
  expect(fake.count('github.signIn.cancel')).toBe(1);
});

test('a status that arrives after the dialog closed does not make a later close cancel', async () => {
  // Guard: replies to a closed dialog are dropped (mutation: report the unconfirmed state from the reply handler
  // instead of from what is rendered; the stale pending reply then marks the reopened dialog as unconfirmed).
  const first = deferred<unknown>(); const second = deferred<unknown>();
  let reads = 0;
  const fake = github(signedOut(), { 'github.account.read': () => (++reads === 1 ? first.promise : second.promise) });
  render(<App api={fake.api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  fireEvent.click(within(await screen.findByRole('dialog', { name: 'GitHub account' })).getByRole('button', { name: 'Close dialog' }));
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  const dialog = await screen.findByRole('dialog', { name: 'GitHub account' });
  await act(async () => first.resolve({ account: pending() }));
  await settle();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close dialog' }));
  await settle();
  expect(fake.count('github.signIn.cancel')).toBe(0);
  await act(async () => second.resolve({ account: signedOut() }));
});

test('the Model profiles dialog carries the F-26 sentence, which never says OpenAI forbids it', async () => {
  const { api } = workbench();
  render(<App api={api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'Model profiles' }));
  const dialog = await screen.findByRole('dialog', { name: 'Model profiles' });
  const note = within(dialog).getByText(TEXT.f26);
  expect(note.tagName).toBe('P');
  expect(note.className).toBe('muted');
  expect(dialog.textContent).not.toMatch(/OpenAI (forbids|does not permit)/);
});

test('the composer footnote names GitHub sign-in in general chat and in a project, and the cloud dialog carries its clause', async () => {
  const chat = workbench({ profiles: [cloudProfile] });
  render(<App api={chat.api} />);
  await ready();
  expect(document.querySelector('.composer-footnote')!.textContent).toBe(TEXT.chatFootnote);
  fireEvent.click(screen.getByRole('button', { name: 'Review cloud access' }));
  const dialog = await screen.findByRole('dialog', { name: 'Allow cloud for this conversation?' });
  expect(dialog.textContent).toContain(`Allow this conversation's messages and any reviewed handoff text to be sent to external model providers you select. ${TEXT.cloudClause} Project privacy rules still apply.`);
  cleanup();
  const inProject = workbench({ projects: [project] });
  render(<App api={inProject.api} />);
  await screen.findByRole('heading', { name: project.name });
  await ready();
  expect(document.querySelector('.composer-footnote')!.textContent).toBe(TEXT.projectFootnote);
  fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'plan' } });
  expect(document.querySelector('.composer-footnote')!.textContent).toBe(TEXT.projectFootnote);
  expect(document.body.textContent).not.toContain('public GitHub');
});

test('no token, refresh token or device code marker reaches the DOM through a whole sign-in, even when a reply carries one', async () => {
  // Markers are generated at run time (spec "Tests the builders owe", T-1). The fake plants them in fields the strict DTO
  // forbids; the panel renders only the fields it knows, so none reaches the DOM. Mutation that turns this red: the panel
  // renders the reply as JSON.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  const markers = [`${'ghu'}_${randomBytes(24).toString('hex')}`, `${'ghr'}_${randomBytes(24).toString('hex')}`, randomBytes(20).toString('hex')];
  const planted = (account: Status) => ({ account: { ...account, accessToken: markers[0], refreshToken: markers[1], deviceCode: markers[2], device_code: markers[2] } });
  const leaks = () => markers.filter(marker => document.body.innerHTML.includes(marker));
  const fake = github(signedOut(), {
    'github.account.read': () => planted(fake.state.account),
    'github.signIn.start': () => { fake.state.account = pending(); return planted(fake.state.account); },
    'github.signOut': () => { fake.state.account = signedOut(); return planted(fake.state.account); },
  });
  // Positive control: the scan finds a marker that is in the DOM.
  const control = document.createElement('div'); control.textContent = markers[1]!; document.body.append(control);
  expect(leaks()).toEqual([markers[1]]);
  control.remove();
  render(<App api={fake.api} />);
  await ready();
  fireEvent.click(screen.getByRole('button', { name: 'GitHub' }));
  const dialog = await screen.findByRole('dialog', { name: 'GitHub account' });
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Sign in' }));
  await settle();
  expect(within(dialog).getByText(CODE)).toBeTruthy();
  expect(leaks()).toEqual([]);
  fake.state.account = pending({ committed: true, account: { login: null } });
  await tick(1000);
  expect(within(dialog).getByTestId('github-account-panel').textContent).toBe(TEXT.confirmed);
  expect(leaks()).toEqual([]);
  fake.state.account = signedIn();
  await tick(1000);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));
  await settle();
  expect(dialog.textContent).toContain(TEXT.notRevoked);
  expect(leaks()).toEqual([]);
});
