import { resolve } from 'path';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // See:
    // https://svelte.dev/docs/kit/adapter-vercel
    adapter: adapter({
      runtime: 'nodejs22.x',
      regions: ['hnd1'], // Tokyo, Japan.
      memory: 3008, // To avoid OOM errors on /workbooks/{slug}
      maxDuration: 30,
    }),
    // See:
    // https://kit.svelte.dev/docs/configuration#alias
    alias: {
      '@': resolve('./src'),
      $lib: resolve('./src/lib'),
      '$lib/*': resolve('./src/lib/*'),
    },
  },

  compilerOptions: {
    runes: true,
  },

  // [Work around]
  // SuperDebug.svelte: Cannot use `export let` in runes mode — use `$props()` instead.
  //
  // See:
  // https://github.com/ciscoheat/sveltekit-superforms/issues/306#issuecomment-1891015986
  vitePlugin: {
    dynamicCompileOptions({ filename }) {
      if (filename.includes('node_modules')) {
        return { runes: undefined }; // or false, check what works
      }
    },
  },
};

export default config;
