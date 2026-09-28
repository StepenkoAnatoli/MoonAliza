import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    testTimeout: 15000,
    // Reuse one worker per environment: isolated worker startup can stall on this 8 GiB host.
    pool: 'threads',
    maxWorkers: 1,
    isolate: false,
    restoreMocks: true,
    clearMocks: true
  }
});
