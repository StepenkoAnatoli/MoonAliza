import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';

// Start from an empty dist/: a stale bundle would otherwise match electron-builder's dist/** glob.
await rm('dist', { recursive: true, force: true });
await mkdir('dist/renderer', { recursive: true });
await build({
  entryPoints: { main: 'src/main/index.ts', preload: 'src/preload/index.ts', engine: 'src/engine/index.ts' },
  outdir: 'dist', outExtension: { '.js': '.cjs' }, bundle: true, platform: 'node',
  format: 'cjs', target: 'node24', sourcemap: true, external: ['electron', 'better-sqlite3']
});
await build({
  entryPoints: ['src/renderer/index.tsx'], outfile: 'dist/renderer/index.js',
  bundle: true, platform: 'browser', format: 'esm', jsx: 'automatic',
  target: 'chrome152', sourcemap: true, define: { 'process.env.NODE_ENV': '"production"' }
});
await copyFile('src/renderer/index.html', 'dist/renderer/index.html');
await copyFile('src/renderer/styles.css', 'dist/renderer/styles.css');
