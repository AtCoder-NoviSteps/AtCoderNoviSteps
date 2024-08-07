// See:
// https://typescript-eslint.io/rules/ban-ts-comment/
// https://qiita.com/KokiSakano/items/ff8dde69d7f4296e2480
// https://gist.github.com/huntabyte/b73073a93a7a664f3cbad7c50376c9c9
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    extraFileExtensions: ['.svelte'],
  },
  rules: {
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': false,
      },
    ],
  },
  env: {
    browser: true,
    es2024: true,
    node: true,
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
};
