// Pre-commit scan: redacts account identifiers from recorded headers and refuses (exit 1) if any file
// in the given paths holds the key's value or the key prefix (sk- then ant). Prints only "found"/"clean".
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const key = process.env.MOONZILA_ANTHROPIC_API_KEY;
const ID_HEADERS = ['anthropic-organization-id', 'anthropic-workspace-id'];
const files = [];
for (const p of process.argv.slice(2)) {
  if (statSync(p).isDirectory()) for (const f of readdirSync(p)) files.push(join(p, f));
  else files.push(p);
}
let found = false;
for (const f of files) {
  if (f.endsWith('.meta.json')) {
    const meta = JSON.parse(readFileSync(f, 'utf8'));
    let changed = false;
    for (const h of [meta.headers, ...(meta.retries ?? []).map((r) => r.headers)]) {
      for (const k of ID_HEADERS) if (h && k in h && h[k] !== '<redacted-id>') { h[k] = '<redacted-id>'; changed = true; }
    }
    if (changed) writeFileSync(f, JSON.stringify(meta, null, 2) + '\n');
  }
  const text = readFileSync(f, 'utf8');
  if ((key && text.includes(key)) || text.includes('sk-' + 'ant')) { found = true; console.log(`found: ${f}`); }
}
console.log(found ? 'found' : `clean (${files.length} files)`);
process.exit(found ? 1 : 0);
