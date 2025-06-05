import { expect, test } from 'vitest';

import { canViewWorkBook, getUrlSlugFrom } from '$lib/utils/workbooks';
import { Roles } from '$lib/types/user';
import { type WorkbookList, WorkBookType } from '$lib/types/workbook';

function createWorkBookListBase(overrides: Partial<WorkbookList> = {}): WorkbookList {
  return {
    id: 1,
    authorId: '3',
    authorName: 'Alice',
    title: '実装力を鍛える問題集',
    description: '',
    editorialUrl: '',
    isPublished: false,
    isOfficial: false,
    isReplenished: false,
    urlSlug: undefined,
    workBookType: WorkBookType.CREATED_BY_USER,
    workBookTasks: [],
    ...overrides,
  };
}

describe('Workbooks', () => {
  describe('can view workbooks', () => {
    describe('when the user is admin', () => {
      test('admin can view published workbooks', () => {
        expect(canViewWorkBook(Roles.ADMIN, true)).toBeTruthy();
      });

      test('admin can view workbooks privately', () => {
        expect(canViewWorkBook(Roles.ADMIN, false)).toBeTruthy();
      });
    });

    describe('when the user is not admin', () => {
      test('the user can view published workbooks', () => {
        expect(canViewWorkBook(Roles.USER, true)).toBeTruthy();
      });

      test('the user can not view workbooks privately', () => {
        expect(canViewWorkBook(Roles.USER, false)).toBeFalsy();
      });
    });
  });

  describe('get url slug from workbook', () => {
    test('returns urlSlug when it exists', () => {
      const workbook = createWorkBookListBase({ id: 1, urlSlug: '2-sat' });
      expect(getUrlSlugFrom(workbook)).toBe('2-sat');
    });

    test('returns id as string when urlSlug is null', () => {
      const workbook = createWorkBookListBase({ id: 10, urlSlug: null });
      expect(getUrlSlugFrom(workbook)).toBe('10');
    });

    test('returns id as string when urlSlug is undefined', () => {
      const workbook = createWorkBookListBase({ id: 123, urlSlug: undefined });
      expect(getUrlSlugFrom(workbook)).toBe('123');
    });

    test('returns id as string when urlSlug is empty string', () => {
      const workbook = createWorkBookListBase({ id: 999, urlSlug: '' });
      expect(getUrlSlugFrom(workbook)).toBe('999');
    });
  });
});
