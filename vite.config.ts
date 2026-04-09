import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    exclude: ['@prisma/client', '@lucia-auth/adapter-prisma'],
  },
  test: {
    include: [
      'src/lib/**/*.test.ts', // shared utility tests
      'src/test/**/*.test.ts', // existing tests (phase transition)
      'src/features/**/*.test.ts', // feature co-location tests
    ],
    exclude: [
      '.pnpm-store/**',
      '.svelte-kit/**',
      'coverage/**',
      'build/**',
      'dist/**',
      'node_modules/**',
    ],
    environment: 'jsdom',
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
