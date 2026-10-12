// Prints the decisive facts of each recorded probe: node summarize.mjs <id>...
import { readFileSync } from 'node:fs';
for (const id of process.argv.slice(2)) {
  const m = JSON.parse(readFileSync(`${id}.meta.json`, 'utf8'));
  if (m.skipped) { console.log(id, 'SKIPPED', m.reason); continue; }
  const f = m.facts;
  if (!f) { console.log(id, m.status, readFileSync(`${id}.response.raw`, 'utf8').slice(0, 400)); continue; }
  console.log(id, m.status, `${m.latencyMs.total}ms ${m.responseBytes}B`, JSON.stringify({ types: f.blockTypes, deltas: f.deltaTypes, sig: f.signatureDeltasPerBlock, pings: f.pings, noName: f.eventsWithoutName, mismatch: f.nameMismatch, unk: f.unknownEventTypes, crlf: f.crlf, after: f.bytesAfterMessageStop, stop: f.stopReason, sd: f.stopDetails, fallback: f.fallbackBlock, usage: m.usage }));
  for (const b of f.blocks) {
    const c = { ...b };
    if (typeof c.signature === 'string') c.signature = `<${c.signature.length} chars>`;
    if (typeof c.thinking === 'string') c.thinking = `${c.thinking.slice(0, 80)}...(${b.thinking.length})`;
    if (typeof c.data === 'string') c.data = `<${c.data.length} chars>`;
    console.log('   ', JSON.stringify(c));
  }
}
