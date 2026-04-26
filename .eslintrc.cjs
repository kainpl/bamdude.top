module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:astro/recommended'],
  overrides: [{ files: ['*.astro'], parser: 'astro-eslint-parser', parserOptions: { parser: '@typescript-eslint/parser', extraFileExtensions: ['.astro'] } }],
  ignorePatterns: ['dist', 'node_modules', '.astro'],
};
