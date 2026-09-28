import { _electron as electron } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

// Explicit opt-in verification against an installed executable and its default app data.
const [phase, executable] = process.argv.slice(2);
if (!['seed', 'verify'].includes(phase) || !executable) throw new Error('Usage: check-installed.mjs seed|verify <installed-executable>');
const directory = resolve('.build/install-check'); const receipt = join(directory, 'receipt.json');
await mkdir(directory, { recursive: true });
const application = await electron.launch({ executablePath: executable });
try {
  const page = await application.firstWindow();
  await page.getByRole('button', { name: 'Open project', exact: true }).waitFor();
  const runtime = await application.evaluate(({ app }) => ({ packaged: app.isPackaged, version: app.getVersion(), userData: app.getPath('userData'), path: app.getAppPath() }));
  assert.equal(runtime.packaged, true);
  if (phase === 'seed') {
    const projects = await page.evaluate(() => globalThis.window.moonaliza.invoke('project.list', {}));
    assert.equal(projects.projects.length, 0, 'Refuse to seed an existing user workspace');
    const project = join(directory, 'Installation project'); await mkdir(project, { recursive: true });
    await application.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, project);
    await page.getByRole('button', { name: 'Open project', exact: true }).click();
    await page.getByRole('button', { name: 'Trust and open' }).click();
    await page.getByRole('heading', { name: 'Installation project', exact: true }).waitFor();
    const saved = await page.evaluate(async () => {
      const { projects } = await globalThis.window.moonaliza.invoke('project.list', {});
      const { session } = await globalThis.window.moonaliza.invoke('session.create', { projectId: projects[0].id, title: 'Saved before uninstall' });
      return { projectId: projects[0].id, sessionId: session.id };
    });
    await writeFile(receipt, JSON.stringify({ ...runtime, ...saved }, null, 2));
    console.log(JSON.stringify({ phase, ...runtime, savedConversation: true }));
  } else {
    const before = JSON.parse(await readFile(receipt, 'utf8'));
    assert.equal(runtime.userData, before.userData);
    const saved = await page.evaluate(id => globalThis.window.moonaliza.invoke('session.read', { sessionId: id }), before.sessionId);
    assert.equal(saved.session.title, 'Saved before uninstall');
    await page.screenshot({ path: '.build/install-check/reinstalled.png' });
    // Remove only this verifier's registration; leave the app and user-data directory installed.
    await page.evaluate(id => globalThis.window.moonaliza.invoke('project.forget', { projectId: id }), before.projectId);
    console.log(JSON.stringify({ phase, ...runtime, restoredConversation: true }));
  }
} finally { await application.close(); }
