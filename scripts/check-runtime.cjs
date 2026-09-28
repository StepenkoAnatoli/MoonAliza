// Exercises the actual Electron utility process and bundled SQLite native binary.
const { app, utilityProcess } = require('electron');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const directory = mkdtempSync(join(tmpdir(), 'moonaliza-runtime-'));
let child;
const timer = setTimeout(() => finish(1, 'Runtime check timed out'), 20000);
function finish(code, message) {
  clearTimeout(timer);
  process.stdout.write(`${message}\n`);
  if (child?.pid) {
    child.once('exit', () => { rmSync(directory, { recursive: true, force: true }); app.exit(code); });
    child.kill();
  } else { rmSync(directory, { recursive: true, force: true }); app.exit(code); }
}
app.whenReady().then(() => {
  const epoch = 'runtime-smoke';
  child = utilityProcess.fork(resolve('dist/engine.cjs'), [join(directory, 'state.sqlite'), epoch], { stdio: 'pipe' });
  child.stderr.on('data', bytes => process.stderr.write(bytes));
  child.on('message', message => {
    if (message.type === 'ready') child.postMessage({ type: 'control', epoch, id: 'refs', control: { method: 'vault.references' } });
    if (message.type === 'reply' && message.id === 'refs') {
      if (!Array.isArray(message.result) || message.result.length !== 0) { finish(1, 'Unexpected empty-vault state'); return; }
      child.postMessage({ type: 'control', epoch, id: 'close', control: { method: 'shutdown' } });
    }
    if (message.type === 'reply' && message.id === 'close') finish(0, `Electron ${process.versions.electron}, Node ${process.versions.node}: engine and SQLite loaded successfully`);
    if (message.type === 'failure') finish(1, `Engine failed: ${message.code}`);
  });
  child.on('exit', code => { if (code !== 0) finish(1, `Engine exited with ${code}`); });
});
