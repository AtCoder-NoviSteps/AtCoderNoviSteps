import { expect, test, describe } from 'vitest';

import { buildSignupPath } from './signup';

describe('buildSignupPath', () => {
  describe('without redirectTo', () => {
    test('returns base signup path when undefined', () => {
      expect(buildSignupPath()).toBe('/signup');
    });

    test('returns base signup path when null', () => {
      expect(buildSignupPath(null)).toBe('/signup');
    });
  });

  describe('with redirectTo', () => {
    test('appends redirectTo with encoded pathname', () => {
      expect(buildSignupPath('/workbooks/bfs')).toBe('/signup?redirectTo=%2Fworkbooks%2Fbfs');
    });

    test('appends redirectTo including query string', () => {
      expect(buildSignupPath('/workbooks?tab=solution')).toBe(
        '/signup?redirectTo=%2Fworkbooks%3Ftab%3Dsolution',
      );
    });

    test('returns redirectTo for root path', () => {
      expect(buildSignupPath('/')).toBe('/signup?redirectTo=%2F');
    });
  });
});
