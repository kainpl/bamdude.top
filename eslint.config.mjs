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
  { ignores: ['dist/', 'node_modules/', '.astro/'] },
];
