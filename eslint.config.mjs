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
  // Plain Node scripts (run with `node`, outside Astro/browser) need Node globals
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly' } },
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
  { ignores: ['dist/', 'node_modules/', '.astro/'] },
];
