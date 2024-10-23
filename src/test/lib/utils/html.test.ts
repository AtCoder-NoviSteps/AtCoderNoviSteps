import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '$lib/utils/html';

describe('sanitizeHTML', () => {
  it('expects to be removed dangerous HTML', () => {
    const input = '<script>alert("xss")</script><p>Hello</p>';

    expect(sanitizeHTML(input)).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;&lt;p&gt;Hello&lt;/p&gt;',
    );
  });

  it('expects to respect custom options', () => {
    const input = '<strong>Bold</strong><script>alert("xss")</script>';
    const options = { allowedTags: ['strong'] };

    expect(sanitizeHTML(input, options)).toBe(
      '<strong>Bold</strong>&lt;script&gt;alert("xss")&lt;/script&gt;',
    );
  });
});
