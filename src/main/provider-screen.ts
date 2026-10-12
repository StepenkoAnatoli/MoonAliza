import type { Completion } from './inference';

/**
 * Every object key and string leaf of a provider state's `data`, in document order, joined with U+0000 (more-models-
 * phase2.md section 6). Leaves, not the JSON text: JSON escaping writes a `"` or `\` inside a secret as `\"` or `\\`,
 * so the secret would never appear in the text. The walk is iterative, so a deeply nested state cannot exhaust the
 * stack. Throws when `data` is not JSON.
 */
export function providerStateLeaves(data: string): string {
  const leaves: string[] = [];
  const pending: unknown[] = [JSON.parse(data)];
  while (pending.length > 0) {
    const value = pending.pop();
    if (typeof value === 'string') { leaves.push(value); continue; }
    if (typeof value !== 'object' || value === null) continue;
    // An object's keys are leaves too, each before its value: [key, value, key, value, ...].
    const items: unknown[] = Array.isArray(value) ? value : Object.entries(value).flat();
    for (let index = items.length - 1; index >= 0; index -= 1) pending.push(items[index]);
  }
  return leaves.join('\u0000');
}

/**
 * The screen every completion passes in main before it crosses to the engine (more-models-phase2.md section 6; S-1), in
 * this order: (1) a tool step's calls, as their JSON text and as their keys and string leaves, must come back from
 * `redact` unchanged; (2) a tool step's
 * provider state - every key and string leaf of its data, and the unredacted content, since a secret split across two
 * text blocks appears whole only there - must come back unchanged too, and the state is never redacted in place,
 * because an edited block is a 400 on the next step (E-09 l.161; E-12 l.167); (3) the content is redacted, as before.
 * A change in (1) or (2), or a state whose data cannot be read, is PROVIDER_PROTOCOL_ERROR: nothing from the step is
 * run or saved. A redact failure (REDACTION_UNAVAILABLE) propagates as itself.
 */
export async function screenCompletion(output: Completion, redact: (text: string) => Promise<string>): Promise<Completion> {
  if (output.toolCalls) {
    const encoded = JSON.stringify(output.toolCalls);
    // The JSON text, as infer() checked it before, and every key and string leaf, so a `"` or `\` in a secret cannot
    // hide behind JSON escaping in a kind that carries no state (integration review P2-IR-1).
    for (const text of [encoded, providerStateLeaves(encoded)]) if (await redact(text) !== text) throw new Error('PROVIDER_PROTOCOL_ERROR');
  }
  if (output.providerState) {
    let leaves: string;
    try { leaves = providerStateLeaves(output.providerState.data); } catch { throw new Error('PROVIDER_PROTOCOL_ERROR'); }
    for (const text of [leaves, output.content]) if (await redact(text) !== text) throw new Error('PROVIDER_PROTOCOL_ERROR');
  }
  return { ...output, content: await redact(output.content) };
}
