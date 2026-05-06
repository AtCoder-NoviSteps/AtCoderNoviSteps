import { expect, test, describe } from 'vitest';

import { buildLoginPath } from './login';

const createUrl = (path: string) => new URL(`http://localhost:5174${path}`);

describe('buildLoginPath', () => {
  describe('without url', () => {
    test('returns base login path', () => {
      expect(buildLoginPath()).toBe('/login');
    });
  });

  describe('with url', () => {
    test('appends redirectTo with encoded pathname', () => {
      expect(buildLoginPath(createUrl('/workbooks/bfs'))).toBe(
        '/login?redirectTo=%2Fworkbooks%2Fbfs',
      );
    });

    test('appends redirectTo including query string', () => {
      expect(buildLoginPath(createUrl('/workbooks?tab=solution'))).toBe(
        '/login?redirectTo=%2Fworkbooks%3Ftab%3Dsolution',
      );
    });

    test('returns redirectTo for root path', () => {
      expect(buildLoginPath(createUrl('/'))).toBe('/login?redirectTo=%2F');
    });
  });
});
