import { spawnOwned, safeCommandEnvironment } from '../../../src/tools/commands.ts';
import { fileURLToPath } from 'node:url';
await spawnOwned({ executable: process.execPath, args: [fileURLToPath(new URL('./tree.mjs', import.meta.url)), process.argv[2]], cwd: process.cwd(), env: safeCommandEnvironment(), timeoutMs: 60000, maxOutputBytes: 8192 });
