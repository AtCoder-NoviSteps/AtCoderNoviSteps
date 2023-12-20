import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
  },
  build: {
    rollupOptions: {
      external: ['@lib/server/__generated__/fabbrica'],
      // https://rollupjs.org/configuration-options/
    },
  },
});
