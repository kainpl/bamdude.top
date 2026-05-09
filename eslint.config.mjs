import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    files: ['**/*.astro'],
    languageOptions: {
      parserOptions: { parser: '@typescript-eslint/parser', extraFileExtensions: ['.astro'] },
    },
  },
  // CJS files (lighthouserc.cjs) use CommonJS globals
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  // Inline scripts inside .astro files and test helpers use patterns that
  // are valid in their runtime context but would trip ESLint rules designed
  // for module code. Relax only the rules that fire in those contexts.
  {
    files: ['src/layouts/BaseLayout.astro'],
    rules: {
      'no-var': 'off',
      'prefer-rest-params': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.test.tsx', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  // relay/ is a self-contained Node sub-project (Fastify) with its own
  // eslint.config.mjs (which knows about Node globals: process, console,
  // Buffer, fetch). Root lint runs against the Astro site only — `cd relay
  // && npm run lint` covers the relay separately.
  { ignores: ['dist/', 'node_modules/', '.astro/', 'relay/'] },
];
