import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    // SvelteKit 3 takes the former svelte.config.js options here
    sveltekit({
      // Consult https://svelte.dev/docs/kit/integrations#preprocessors
      // for more information about preprocessors
      preprocess: vitePreprocess(),

      // See:
      // https://svelte.dev/docs/kit/adapter-vercel
      adapter: adapter({
        regions: ['hnd1'], // Tokyo, Japan.
        memory: 3008, // To avoid OOM errors on /workbooks/{slug}
        maxDuration: 30,
      }),

      compilerOptions: {
        runes: true,
      },

      // [Work around]
      // SuperDebug.svelte: Cannot use `export let` in runes mode — use `$props()` instead.
      //
      // See:
      // https://github.com/ciscoheat/sveltekit-superforms/issues/306#issuecomment-1891015986
      dynamicCompileOptions({ filename }) {
        if (filename.includes('node_modules')) {
          return { runes: undefined }; // or false, check what works
        }
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@prisma/client'],
  },
  test: {
    include: [
      'src/lib/**/*.test.ts', // shared utility tests
      'src/test/**/*.test.ts', // existing tests (phase transition)
      'src/features/**/*.test.ts', // feature co-location tests
      'src/routes/**/*.test.ts', // route-scoped utility tests
    ],
    exclude: [
      '.pnpm-store/**',
      '.svelte-kit/**',
      'coverage/**',
      'build/**',
      'dist/**',
      'node_modules/**',
    ],
    // Default to node; DOM-dependent tests opt in via `// @vitest-environment jsdom`.
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,svelte}'],
      exclude: [
        '.pnpm-store/**',
        '.svelte-kit/**',
        'coverage/**',
        'build/**',
        'dist/**',
        'node_modules/**',
      ],
    },
  },
});
