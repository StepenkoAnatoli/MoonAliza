import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.tooling/**', 'release/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{ts,tsx,mjs,cjs}'], languageOptions: { globals: {
    console: 'readonly', process: 'readonly', Buffer: 'readonly', URL: 'readonly',
    setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', AbortController: 'readonly',
    AbortSignal: 'readonly', fetch: 'readonly', structuredClone: 'readonly'
  } }, rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] } },
  { files: ['**/*.cjs'], languageOptions: { globals: { require: 'readonly', module: 'readonly', __dirname: 'readonly' } }, rules: { '@typescript-eslint/no-require-imports': 'off' } }
);
