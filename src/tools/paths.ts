import path from 'node:path';
import { realpath, stat } from 'node:fs/promises';

export function validateRelativePath(value: string): string {
  const normalized = value.replaceAll('\\', '/');
  const parts = normalized.split('/');
  const reserved = /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(\.|$)/i;
  if (!normalized || path.win32.isAbsolute(value) || normalized.startsWith('/') || normalized.includes(':') ||
    parts.some(part => !part || part === '.' || part === '..' || part.length > 255 ||
      /[<>|"?*]/.test(part) || [...part].some(char => char.charCodeAt(0) < 32) || /[. ]$/.test(part) || reserved.test(part))) {
    throw new Error('PATH_OUTSIDE_PROJECT');
  }
  return normalized;
}

function assertWithin(root: string, candidate: string): void {
  const relative = path.relative(root, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('PATH_OUTSIDE_PROJECT');
  }
}

export async function resolveProjectPath(root: string, relative: string, options: { allowMissing?: boolean } = {}): Promise<string> {
  const normalized = validateRelativePath(relative);
  const canonicalRoot = await realpath(root);
  if (!(await stat(canonicalRoot)).isDirectory()) throw new Error('PROJECT_UNAVAILABLE');
  const candidate = path.resolve(canonicalRoot, ...normalized.split('/'));
  assertWithin(canonicalRoot, candidate);
  let ancestor = candidate;
  const missing: string[] = [];
  for (;;) {
    try {
      const actual = await realpath(ancestor);
      assertWithin(canonicalRoot, actual);
      const resolved = path.join(actual, ...missing);
      assertWithin(canonicalRoot, resolved);
      return resolved;
    } catch (error) {
      if (!options.allowMissing || (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw new Error('PATH_OUTSIDE_PROJECT', { cause: error });
      missing.unshift(path.basename(ancestor));
      ancestor = parent;
    }
  }
}

/** Same default exclusion boundary for reads, search and automatic context gathering. */
export function isSensitiveContextPath(relative: string): boolean {
  const normalized = relative.replaceAll('\\', '/').toLowerCase();
  const parts = normalized.split('/');
  if (parts.some(part => ['.git', '.moonaliza', 'node_modules', '.ssh', '.aws', '.azure', '.gnupg'].includes(part))) return true;
  const name = parts.at(-1) ?? '';
  if (name === '.env.example' || name === '.env.sample' || name === '.env.template') return false;
  return name === '.env' || name.startsWith('.env.') || /\.(pem|p12|pfx|key|keystore)$/.test(name) ||
    ['id_rsa', 'id_ed25519', 'credentials', '.npmrc', '.pypirc', '.netrc'].includes(name);
}
