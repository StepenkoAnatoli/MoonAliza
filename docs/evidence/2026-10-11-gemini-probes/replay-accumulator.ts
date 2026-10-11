// Replays a recorded compatible-endpoint stream through Moonzila's OpenAIAccumulator, chunk by chunk,
// then again with a missing tool_calls[].index filled in as 0, to show which field the rejection rests on.
// Usage: npx tsx docs/evidence/2026-10-11-gemini-probes/replay-accumulator.ts <raw/p1-...json>
import { OpenAIAccumulator } from '../../../src/main/provider-stream';
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
const body: string = (r.exchange ?? r).body;
const events = body.split('\n\n').map(b => b.replace(/^data: /, '')).filter(p => p && p !== '[DONE]').map(p => JSON.parse(p));
const acc = new OpenAIAccumulator();
for (const [i, e] of events.entries()) { try { acc.push(e); console.log('chunk', i, 'ok'); } catch (err) { console.log('chunk', i, 'rejected', (err as Error).message); } }
// with index added
const acc2 = new OpenAIAccumulator();
for (const e of events) { for (const tc of e.choices?.[0]?.delta?.tool_calls ?? []) tc.index ??= 0; acc2.push(e); }
console.log('with index injected:', JSON.stringify(acc2.result()));
