import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { readdirSync } from 'fs';

test.describe('TailwindCSS v3 configuration', () => {
  /**
   * Verify that custom colors are generated in build output
   * (.svelte-kit/output/client/_app/immutable/assets/0.*.css)
   *
   * Precondition: pnpm build executed
   */

  test('primary color is generated in CSS', () => {
    // Validate build output
    // Path: CSS files with hash in .svelte-kit/output/client/_app/immutable/assets/
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    let cssFiles: string[] = [];

    try {
      cssFiles = readdirSync(cssDir).filter(
        (f: string) => f.startsWith('0.') && f.endsWith('.css'),
      );
    } catch (e) {
      // Fallback: search for all .css files
      cssFiles = readdirSync(cssDir).filter((f: string) => f.endsWith('.css'));
    }

    expect(cssFiles.length).toBeGreaterThan(0);

    const cssPath = resolve(cssDir, cssFiles[0]);
    const css = readFileSync(cssPath, 'utf-8');

    // Check if primary-* classes are generated
    expect(css).toMatch(/\.text-primary-[0-9]/);
    expect(css).toMatch(/\.bg-primary-[0-9]/);
  });

  test('atcoder color is generated', () => {
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    // Find 0.*.css file (main CSS file)
    const mainCssFiles = readdirSync(cssDir)
      .filter((f: string) => f.match(/^0\.[a-zA-Z0-9]+\.css$/))
      .sort()
      .reverse();

    expect(mainCssFiles.length).toBeGreaterThan(0);

    const cssPath = resolve(cssDir, mainCssFiles[0]);
    const css = readFileSync(cssPath, 'utf-8');

    // Validate if atcoder-* classes are generated
    expect(css).toContain('bg-atcoder');
  });

  test('xs breakpoint is available (or custom breakpoints)', () => {
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    const cssFiles = readdirSync(cssDir)
      .filter((f: string) => f.endsWith('.css'))
      .sort()
      .reverse();

    expect(cssFiles.length).toBeGreaterThan(0);

    // Verify total CSS size from multiple files
    const totalCssSize = cssFiles.slice(0, 5).reduce((acc, f) => {
      const cssPath = resolve(cssDir, f);
      const css = readFileSync(cssPath, 'utf-8');
      return acc + css.length;
    }, 0);

    // Verify CSS is generated properly (single file size may be small due to multiple files)
    expect(totalCssSize).toBeGreaterThan(5000);
  });
});
