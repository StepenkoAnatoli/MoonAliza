// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
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
