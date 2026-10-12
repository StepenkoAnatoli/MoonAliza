import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * A fake Ollama with its cloud features off. Under a local-only policy Moonzila asks
 * `GET /api/status` before every model step and sends the chat request only when it answers 200
 * with `cloud.disabled: true` (docs/specification/more-models.md, Phase 1 design 2). The shape is
 * StatusHandler's answer (wire E-31) as types.go declares it (wire E-30); `source` is left out
 * because Moonzila does not read it. Returns true when the request was the status request.
 */
export function answerOllamaStatus(request: IncomingMessage, response: ServerResponse): boolean {
  if (request.method !== 'GET' || request.url !== '/api/status') return false;
  response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ cloud: { disabled: true } }));
  return true;
}
