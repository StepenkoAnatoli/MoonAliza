// Explicit development/CI provisioning. The desktop never clones or downloads a tool.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportSource, inventory, revision } from './fetchproof-source.mjs';
// Paths below are repository-relative: run from the repository root whatever the caller's cwd.
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const repo = resolve('.build/fetchproof-pin');
// A leftover empty or half-made directory is not a clone: judge by its .git, so the clone can be retried.
if (!existsSync(join(repo, '.git'))) {
  try { execFileSync('git', ['-c', 'core.longpaths=true', 'clone', '--no-checkout', 'https://github.com/StepenkoAnatoli/Fetchproof.git', repo], { stdio: 'inherit', windowsHide: true }); }
  catch { throw new Error(`Could not clone the external Fetchproof kit into ${repo}. The first run needs access to github.com; later runs reuse the clone.`); }
}
// Export into an empty directory, so files from an earlier pin cannot fail the inventory check.
const destination = resolve('.build/fetchproof-external');
rmSync(destination, { recursive: true, force: true });
const root = exportSource(repo, revision, destination);
const expected = JSON.parse(readFileSync('src/adapters/research-kit/runtime-inventory.json', 'utf8'));
if (JSON.stringify(inventory(root)) !== JSON.stringify(expected)) throw new Error('Pinned Fetchproof bytes differ from reviewed inventory');
console.log(`Prepared external Fetchproof kit ${revision}; ${expected.files.length} runtime files verified.`);
