// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { App } from '../src/renderer/App';

afterEach(cleanup);
const project = { id: 'p1', name: 'My project', pathLabel: 'C:\\work\\my-project', trusted: true, trustRevision: 1, policy: { revision: 1, inference: 'local-only', research: 'off' }, missing: false, createdAt: '2026-09-25T00:00:00Z' };
const cloudProfile = { id: 'cloud', name: 'Cloud connection', kind: 'openai-compatible', endpoint: 'https://provider.example/v1', model: 'test', contextTokens: 8192, outputTokens: 2048, locality: 'external', revision: 2, revisionId: 'revision-2', hasCredential: true, createdAt: project.createdAt, updatedAt: project.createdAt };
function api(projects: unknown[] = []) {
  return {
    async invoke(method: string, _params?: Record<string, unknown>) {
      if (method === 'project.list') return { projects };
      if (method === 'profile.list') return { profiles: [] };
      if (method === 'session.list') return { sessions: [] };
      if (method === 'changes.list') return { changes: [], hasMore: false };
      if (method === 'recovery.list') return { items: [], hasMore: false, pendingCount: 0 };
      if (method === 'storage.read') return { usedBytes: 0, limitBytes: 268435456, snapshotCount: 0, protectedBytes: 0 };
      if (method === 'settings.read') return { settings: { theme: 'system' } };
      if (method === 'project.pick') return { ticketId: 't1', name: project.name, pathLabel: project.pathLabel };
      if (method === 'project.trust') { projects.push(project); return { project }; }
      throw new Error('Unexpected route');
    },
    onEvent: () => () => {},
  };
}

test('empty workbench offers a real project entry point and explains model setup', async () => {
  render(<App api={api()} />);
  expect(await screen.findByRole('button', { name: 'Open project' })).toBeTruthy();
  expect(screen.getByText('Your work starts here')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(true);
});

test('native folder selection requires explicit trust before registering the project', async () => {
  render(<App api={api()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open project' }));
  const dialog = await screen.findByRole('dialog', { name: 'Trust this project?' });
  expect(dialog.textContent).toContain(project.pathLabel);
  fireEvent.click(screen.getByRole('button', { name: 'Trust and open' }));
  expect(await screen.findByRole('heading', { name: project.name })).toBeTruthy();
});

test('profile setup keeps failed submissions and explains the failure', async () => {
  const bridge = api([project]);
  render(<App api={{ ...bridge, async invoke(method, params) { if (method === 'profile.save') throw new Error('Connection profile was not saved'); return bridge.invoke(method, params); } }} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Model profiles' }));
  fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'My local model' } });
  fireEvent.change(screen.getByLabelText('Model name'), { target: { value: 'test-model' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByText('Connection profile was not saved')).toBeTruthy();
  expect((screen.getByLabelText('Profile name') as HTMLInputElement).value).toBe('My local model');
});

test('cloud preflight preserves the draft and requires explicit policy confirmation without sending', async () => {
  const calls: string[] = []; let current = structuredClone(project); const bridge = api([current]);
  render(<App api={{ ...bridge, async invoke(method, params) {
    calls.push(method);
    if (method === 'project.list') return { projects: [current] };
    if (method === 'profile.list') return { profiles: [cloudProfile] };
    if (method === 'project.policy.update') { current = { ...current, policy: { ...current.policy, inference: 'cloud-allowed', revision: 2 } }; return { project: current }; }
    return bridge.invoke(method, params);
  } }} />);
  await screen.findByRole('heading', { name: project.name });
  fireEvent.change(screen.getByLabelText('Message MoonAliza'), { target: { value: 'Keep my draft' } });
  expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(true);
  fireEvent.keyDown(screen.getByLabelText('Message MoonAliza'), { key: 'Enter', ctrlKey: true });
  fireEvent.click(await screen.findByRole('button', { name: 'Review cloud access' }));
  expect((await screen.findByRole('dialog', { name: 'Allow cloud inference?' })).textContent).toContain('provider.example');
  fireEvent.click(screen.getByRole('button', { name: 'Keep local only' }));
  expect(calls).not.toContain('project.policy.update'); expect(calls).not.toContain('run.start'); expect(calls).not.toContain('session.create');
  fireEvent.click(screen.getByRole('button', { name: 'Review cloud access' }));
  fireEvent.click(screen.getByRole('button', { name: 'Allow for this project' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(false));
  expect(calls.filter(call => call === 'project.policy.update')).toHaveLength(1);
  expect(calls).not.toContain('run.start');
  expect((screen.getByLabelText('Message MoonAliza') as HTMLTextAreaElement).value).toBe('Keep my draft');
});

test('editing context creates a bound profile revision while keeping the saved credential', async () => {
  const bridge = api([project]); let submitted: Record<string, unknown> | undefined;
  render(<App api={{ ...bridge, async invoke(method, params) {
    if (method === 'profile.list') return { profiles: [cloudProfile] };
    if (method === 'profile.save') { submitted = params; return { profile: cloudProfile }; }
    return bridge.invoke(method, params);
  } }} />);
  await screen.findByRole('heading', { name: project.name });
  fireEvent.click(screen.getByRole('button', { name: 'Model profiles' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Cloud connection' }));
  expect((screen.getByLabelText('Context window (tokens)') as HTMLInputElement).value).toBe('8192');
  fireEvent.change(screen.getByLabelText('Context window (tokens)'), { target: { value: '16384' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(submitted).toMatchObject({ id: 'cloud', expectedRevision: 2, contextTokens: 16384 }));
  expect(submitted).not.toHaveProperty('secret'); expect(submitted).not.toHaveProperty('clearCredential');
});
