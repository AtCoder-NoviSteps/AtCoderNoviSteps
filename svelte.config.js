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
      regions: ['hnd1'], // Tokyo, Japan.
      memory: 3008, // To avoid OOM errors on /workbooks/{slug}
      maxDuration: 30,
    }),
    // Module paths use package.json#imports (#lib, #features); SvelteKit 3 deprecates kit.alias
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
