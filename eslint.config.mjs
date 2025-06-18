// See:
// https://eslint.org/docs/latest/use/configure/migration-guide
// https://eslint.org/docs/latest/use/migrate-to-9.0.0
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';
import sveltePlugin from 'eslint-plugin-svelte';
import js from '@eslint/js';

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
  js.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Add Svelte 5 runes as global variables
        $state: 'readonly',
        $derived: 'readonly',
        $effect: 'readonly',
        $props: 'readonly',
        $bindable: 'readonly',
        $inspect: 'readonly',
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
      // Add TypeScript ESLint rules manually
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable some strict Svelte rules that are too aggressive
      'svelte/require-each-key': 'warn',
      'svelte/no-useless-mustaches': 'warn',
      'svelte/prefer-writable-derived': 'warn', // New in 3.6.0 - prefer $derived over $state+$effect
      'svelte/valid-prop-names-in-kit-pages': 'warn', // Allow props other than data/errors in pages
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-undef': 'off', // TypeScript handles this
    },
  },
  {
    files: ['**/*.svelte'],

    languageOptions: {
      parser: svelteParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  },
];
