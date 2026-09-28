// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { LocalModelPanel } from '../src/renderer/LocalModelPanel';
afterEach(cleanup);
const now = '2026-09-27T00:00:00Z';
test('shows measured memory, honest unknown GPU memory and inspects only on request', async () => {
  const calls: string[] = [];
  render(<LocalModelPanel api={{ onEvent: () => () => {}, async invoke(method) {
    calls.push(method);
    if (method === 'runtime.inspect') return { endpoint: 'http://127.0.0.1:11434', ownership: 'external', checkedAt: now, status: 'available', version: 'fixture', models: [{ name: 'small-model', digest: 'a'.repeat(64), sizeBytes: 1000, quantization: 'Q4', qualified: false }] };
    return { checkedAt: now, error: null, hardware: { totalRamBytes: 8 * 1024 ** 3, availableRamBytes: 1024 ** 3, cpu: { name: 'CPU fixture', architecture: 'x64', logicalProcessors: 4 }, adapters: [{ id: 'gpu', name: 'GPU fixture', dedicatedBytes: 12 * 1024 ** 3, availableBytes: null, driver: null }], warnings: ['GLOBAL_FREE_VRAM_UNAVAILABLE'] } };
  } }} />);
  expect(await screen.findByText('CPU fixture')).toBeTruthy(); expect(screen.getByText('12.0 GiB')).toBeTruthy();
  expect(screen.getByText('Free GPU memory: Unknown')).toBeTruthy();
  expect(screen.getByText(/Available RAM is below/)).toBeTruthy(); expect(calls).toEqual(['hardware.read']);
  fireEvent.click(screen.getByRole('button', { name: 'Check Ollama' }));
  expect(await screen.findByText('small-model')).toBeTruthy(); expect(screen.getByText('Not qualified for coding')).toBeTruthy();
});
test('hardware failure still offers explicit runtime inspection without fabricating capacity', async () => {
  render(<LocalModelPanel api={{ onEvent: () => () => {}, async invoke() { return { hardware: null, error: 'HARDWARE_UNAVAILABLE', checkedAt: now }; } }} />);
  expect(await screen.findByText(/Hardware information is unavailable/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Check Ollama' }).hasAttribute('disabled')).toBe(false);
});
