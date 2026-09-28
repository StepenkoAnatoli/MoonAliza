// Controlled protocol fixture; never a model quality or machine qualification.
import { createServer } from 'node:http';
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
const { mode } = JSON.parse(readFileSync('fixture.json', 'utf8'));
const digest = 'a'.repeat(64); let loaded = false; let configuration;
const server = createServer(async (request, response) => {
  const chunks = []; for await (const chunk of request) chunks.push(chunk);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
  appendFileSync(join(process.env.USERPROFILE, 'requests.jsonl'), JSON.stringify({ pid: process.pid, route: request.url, body }) + '\n');
  response.setHeader('Content-Type', 'application/json');
  const send = data => response.end(JSON.stringify(data));
  if (request.url === '/api/version') return send({ version: mode === 'wrong-version' ? 'other' : 'fixture-v1' });
  if (request.url === '/api/status') return send({ cloud: { disabled: mode !== 'cloud-enabled' && process.env.OLLAMA_NO_CLOUD === '1' } });
  if (request.url === '/api/tags') return send({ models: [{ name: 'fixture:local', digest: mode === 'wrong-digest' ? 'b'.repeat(64) : digest, size: 42 }] });
  if (request.url === '/api/ps') return send({ models: loaded ? [{ name: 'fixture:local', digest, size: 42, size_vram: mode === 'gpu-loaded' ? 42 : 0, context_length: configuration.num_ctx, details: { quantization_level: 'Q4_K_M' } }] : [] });
  if (request.url === '/api/chat') {
    if (body.messages.length === 0) { loaded = true; configuration = body.options; return send({ done: true, done_reason: 'load', message: { content: '' } }); }
    if (mode === 'slow') { setTimeout(() => send({}), 30000); return; }
    if (mode === 'changed-after-chat') configuration.num_ctx++;
    return send({ done: true, done_reason: 'stop', message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'read_file', arguments: { path: 'example.txt' } } }] } });
  }
  response.statusCode = 404; send({});
});
const [host, port] = process.env.OLLAMA_HOST.split(':'); server.listen(Number(port), host);
