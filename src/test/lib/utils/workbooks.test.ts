import { expect, test } from 'vitest';

import { canViewWorkBook } from '$lib/utils/workbooks';
import { Roles } from '$lib/types/user';

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
});
