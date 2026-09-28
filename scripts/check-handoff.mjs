import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Dependency-free, read-only verification; accepts an optional fresh-checkout root.
const root = await realpath(process.argv[2] ?? fileURLToPath(new URL('../', import.meta.url)));
const snapshot = join(root, 'docs', 'handoff');
const manifest = JSON.parse(await readFile(join(snapshot, 'manifest.json'), 'utf8'));
assert.equal(manifest.schemaVersion, 1, 'HANDOFF_MANIFEST');
assert(Array.isArray(manifest.files) && manifest.files.length > 0, 'HANDOFF_MANIFEST');
const expected = new Set(); const sources = new Set(); let included = 0, metadataOnly = 0;
for (const entry of manifest.files) {
  assert(typeof entry.source === 'string' && /^(work|outputs)\//.test(entry.source) && !sources.has(entry.source), 'HANDOFF_MANIFEST'); sources.add(entry.source);
  assert(/^[a-f0-9]{64}$/.test(entry.sha256) && Number.isSafeInteger(entry.bytes) && entry.bytes >= 0, 'HANDOFF_MANIFEST');
  if (entry.disposition === 'metadata-only') { assert(entry.source.endsWith('.exe') && typeof entry.reason === 'string' && entry.reason.length, 'HANDOFF_MANIFEST'); metadataOnly++; continue; }
  assert(entry.disposition === 'included' && entry.path === entry.source && !entry.path.includes('\\') && entry.path.split('/').every(part => part && part !== '.' && part !== '..' && !part.includes(':')), 'HANDOFF_MANIFEST');
  expected.add(entry.path); const path = join(snapshot, entry.path); const stat = await lstat(path);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.size === entry.bytes, `HANDOFF_INTEGRITY: ${entry.path}`);
  const hash = createHash('sha256'); for await (const bytes of createReadStream(path)) hash.update(bytes);
  assert.equal(hash.digest('hex'), entry.sha256, `HANDOFF_INTEGRITY: ${entry.path}`); included++;
}
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'HANDOFF_INTEGRITY: snapshot link');
    const path = join(folder, entry.name);
    if (entry.isDirectory()) await walk(path);
    else { const name = relative(snapshot, path).split(sep).join('/'); assert(expected.delete(name), `HANDOFF_UNLISTED: ${name}`); }
  }
}
await walk(join(snapshot, 'work')); await walk(join(snapshot, 'outputs')); assert.equal(expected.size, 0, 'HANDOFF_MISSING');

let linksChecked = 0;
for (const name of ['AGENTS.md', 'HANDOFF.md', 'README.md', 'docs/handoff/README.md', 'docs/development-status.md', 'docs/specification/windows-ci.md']) {
  const file = join(root, name); const markdown = await readFile(file, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1].replace(/^<|>$/g, ''); if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    const target = decodeURIComponent(href.split('#')[0]); if (!target) continue;
    const path = resolve(dirname(file), target), child = relative(root, path);
    assert(!isAbsolute(target) && !isAbsolute(child) && child !== '..' && !child.startsWith(`..${sep}`), `HANDOFF_LINK: ${name} -> ${href}`);
    const stat = await lstat(path).catch(() => null); assert(stat, `HANDOFF_LINK: ${name} -> ${href}`); linksChecked++;
  }
}
console.log(JSON.stringify({ sourceFiles: manifest.files.length, included, metadataOnly, linksChecked }));
