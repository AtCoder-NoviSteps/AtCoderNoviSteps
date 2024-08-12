// See:
// https://eslint.org/docs/latest/use/configure/migration-guide
// https://eslint.org/docs/latest/use/migrate-to-9.0.0
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import parser from 'svelte-eslint-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/.DS_Store',
      '**/node_modules',
      'build',
      'coverage',
      '.svelte-kit',
      '.vercel',
      'package',
      '**/.env',
      '**/.env.*',
      '!**/.env.example',
      '.pnpm-store',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/vite.config.js.timestamp-*',
      '**/vite.config.ts.timestamp-*',
      'prisma/.fabbrica/index.ts',
    ],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
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
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parser: parser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },
];
