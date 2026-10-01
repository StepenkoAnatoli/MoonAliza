import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    // Bound memory on the first supported PC. Keep DOM workers separate from
    // the long-running native/process test worker; full mixed runs twice stalled
    // while starting the second DOM file even though both UI files passed alone.
    maxWorkers: 1,
    fileParallelism: false,
    projects: [
      { extends: true, test: { name: 'node', include: ['tests/**/*.test.ts'], environment: 'node', pool: 'threads', isolate: false } },
      { extends: true, test: { name: 'ui', include: ['tests/**/*.test.tsx'], environment: 'jsdom', pool: 'forks', isolate: true } },
    ],
    restoreMocks: true,
    clearMocks: true
  }
});
