import { expect, test } from 'vitest';

import { isValidUrl, sanitizeUrl } from '$lib/utils/url';

type TestCaseForUrlValidation = {
  rawUrl: string;
};

type TestCasesForUrlValidation = TestCaseForUrlValidation[];

type TestCaseForUrlSanitization = {
  rawUrl: string;
  expected: string;
};

type TestCasesForUrlSanitization = TestCaseForUrlSanitization[];

describe('URL', () => {
  describe('is valid URL', () => {
    describe('when valid URL are given', () => {
      const testCases = [
        { rawUrl: 'https://atcoder.jp' },
        { rawUrl: 'https://atcoder.jp/contests/abc365/editorial/10586' },
        { rawUrl: 'https://drken1215.hatenablog.com' },
        { rawUrl: 'https://drken1215.hatenablog.com/entry/2023/06/11/123536' },
        { rawUrl: 'https://qiita.com/e869120' },
        { rawUrl: 'https://qiita.com/e869120/items/f1c6f98364d1443148b3' },
      ];

      runTests('isValidUrl', testCases, ({ rawUrl }: TestCaseForUrlValidation) => {
        expect(isValidUrl(rawUrl)).toBeTruthy();
      });
    });

    test('when an empty URL is given', () => {
      expect(isValidUrl('')).toBeTruthy();
    });

    describe('when invalid URL are given', () => {
      const testCases = [
        { rawUrl: 'htt://' },
        { rawUrl: 'example.c' },
        // Note: 記事のセクション(#マーク)を含む場合は、2024年8月時点では無効なURLとして処理。ユーザの要望が多ければ、修正。
        {
          rawUrl:
            'https://qiita.com/e869120/items/f1c6f98364d1443148b3#1-2-5-%E3%82%B3%E3%83%9F%E3%83%A5%E3%83%8B%E3%83%86%E3%82%A3%E3%83%BC%E3%81%8C%E5%84%AA%E3%81%97%E3%81%84',
        },
      ];

      runTests('isValidUrl', testCases, ({ rawUrl }: TestCaseForUrlValidation) => {
        expect(isValidUrl(rawUrl)).toBeFalsy();
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForUrlValidation,
      testFunction: (testCase: TestCaseForUrlValidation) => void,
    ) {
      test.each(testCases)(`${testName}(rawUrl: $rawUrl)`, testFunction);
    }
  });

  describe('sanitize URL', () => {
    describe('when sanitization is not required URLs are given', () => {
      const testCases = [
        { rawUrl: 'https://atcoder.jp', expected: 'https://atcoder.jp' },
        {
          rawUrl: 'https://atcoder.jp/contests/abc365/editorial/10586',
          expected: 'https://atcoder.jp/contests/abc365/editorial/10586',
        },
        {
          rawUrl: 'https://drken1215.hatenablog.com',
          expected: 'https://drken1215.hatenablog.com',
        },
        {
          rawUrl: 'https://drken1215.hatenablog.com/entry/2023/06/11/123536',
          expected: 'https://drken1215.hatenablog.com/entry/2023/06/11/123536',
        },
        { rawUrl: 'https://qiita.com/e869120', expected: 'https://qiita.com/e869120' },
        {
          rawUrl: 'https://qiita.com/e869120/items/f1c6f98364d1443148b3',
          expected: 'https://qiita.com/e869120/items/f1c6f98364d1443148b3',
        },
      ];

      runTests('sanitizeUrl', testCases, ({ rawUrl, expected }: TestCaseForUrlSanitization) => {
        expect(sanitizeUrl(rawUrl)).toEqual(expected);
      });
    });

    // HACK: テストケースが弱いと思われるので、有効なケースが用意できれば追加する。
    describe('when sanitization is required URLs are given', () => {
      const testCases = [
        {
          rawUrl: '<script>alert("XSS")</script><div>Safe content</div>',
          expected: '&lt;script&gt;alert("XSS")&lt;/script&gt;<div>Safe content</div>',
        },
        {
          rawUrl: 'https://<script>alert("XSS")</script>.hatenablog.com',
          expected: 'https://&lt;script&gt;alert("XSS")&lt;/script&gt;.hatenablog.com',
        },
      ];

      runTests('sanitizeUrl', testCases, ({ rawUrl, expected }: TestCaseForUrlSanitization) => {
        expect(sanitizeUrl(rawUrl)).toEqual(expected);
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForUrlSanitization,
      testFunction: (testCase: TestCaseForUrlSanitization) => void,
    ) {
      test.each(testCases)(`${testName}(rawUrl: $rawUrl)`, testFunction);
    }
  });
});
