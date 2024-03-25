import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import About from '../routes/about/+page.svelte';
import { expect, test } from 'vitest';

// Aboutページ
test('routes/about/+page.svelte', () => {
  render(About);
  const Element = screen.getByText(/サービスの説明/);
  expect(Element).toBeInTheDocument();
});
