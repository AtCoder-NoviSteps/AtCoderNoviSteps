import xss from 'xss';

export function sanitizeHTML(html: string): string {
  return xss(html);
}
