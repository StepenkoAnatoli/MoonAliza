// Explicit development/CI provisioning. The desktop never clones or downloads a tool.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportSource, inventory, revision } from './research-kit-source.mjs';
const repo = resolve('.build/research-kit-pin');
if (!existsSync(repo)) execFileSync('git', ['-c', 'core.longpaths=true', 'clone', '--no-checkout', 'https://github.com/StepenkoAnatoli/Research-Kit.git', repo], { stdio: 'inherit', windowsHide: true });
const root = exportSource(repo, revision, resolve('.build/research-kit-external'));
const expected = JSON.parse(readFileSync('src/adapters/research-kit/runtime-inventory.json', 'utf8'));
if (JSON.stringify(inventory(root)) !== JSON.stringify(expected)) throw new Error('Pinned Research Kit bytes differ from reviewed inventory');
console.log(`Prepared external Research Kit ${revision}; ${expected.files.length} runtime files verified.`);
