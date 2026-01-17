import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { readdirSync } from 'fs';

test.describe('Custom colors for TailwindCSS v4 configuration', () => {
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
      const allCssFiles = readdirSync(cssDir).filter((f: string) => f.endsWith('.css'));
      cssFiles = allCssFiles.filter((f: string) => f.startsWith('0.'));

      // Fallback: use any CSS file if no 0.*.css files found
      if (cssFiles.length === 0) {
        cssFiles = allCssFiles;
      }
    } catch (e) {
      // True error: directory not found or inaccessible
      throw new Error(`Not found CSS directory: ${cssDir}`);
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

  test('xs breakpoint media queries are generated in CSS', () => {
    const cssDir = resolve('.svelte-kit/output/client/_app/immutable/assets');
    const cssFiles = readdirSync(cssDir)
      .filter((f: string) => f.endsWith('.css'))
      .sort()
      .reverse();

    expect(cssFiles.length).toBeGreaterThan(0);

    // Merge all CSS files to verify xs breakpoint
    const allCss = cssFiles
      .map((f: string) => readFileSync(resolve(cssDir, f), 'utf-8'))
      .join('\n');

    // Verify xs breakpoint media query is generated (26.25rem = 420px)
    // @media(min-width:26.25rem) confirms the xs breakpoint is defined correctly
    expect(allCss).toMatch(/@media\(min-width:26\.25rem\)/);
  });
});
