import { createServer } from 'node:http';
import { writeFileSync, appendFileSync } from 'node:fs';
const [infoPath, bodyPath] = process.argv.slice(2);
const server = createServer(async (request, response) => {
  const chunks = []; for await (const bytes of request) chunks.push(bytes);
  appendFileSync(bodyPath, Buffer.concat(chunks));
  if (request.url === '/api/tags') { response.writeHead(302, { Location: 'http://127.0.0.1:1/leak' }); response.end(); return; }
  const body = Buffer.concat(chunks).toString();
  if (body === 'oversize') { response.end('x'.repeat(4 * 1024 * 1024 + 1)); return; }
  if (body === 'slow') { setTimeout(() => response.end('{}'), 30000); return; }
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ version: 'fixture', received: Buffer.concat(chunks).toString() }));
});
server.on('connection', socket => socket.on('data', bytes => appendFileSync(`${bodyPath}.wire`, bytes)));
server.listen(0, '127.0.0.1', () => { writeFileSync(bodyPath, ''); writeFileSync(`${bodyPath}.wire`, ''); writeFileSync(infoPath, JSON.stringify({ pid: process.pid, port: server.address().port })); });
