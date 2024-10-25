import { expect, test } from 'vitest';
import { ZodSchema } from 'zod';

import { accountTransferSchema } from '$lib/zod/schema';

describe('Account Transfer schema', () => {
  describe('Correct source and destination user are given', () => {
    test('when guest and general user are given', () => {
      const testCase = {
        sourceUserName: 'guest',
        destinationUserName: 'Bob',
      };
      validateAccountTransferSchema(accountTransferSchema, testCase);
    });

    test('when general users are given', () => {
      const testCase = {
        sourceUserName: 'a'.repeat(24),
        destinationUserName: 'b'.repeat(24),
      };
      validateAccountTransferSchema(accountTransferSchema, testCase);
    });

    test('when both usernames with maximum length are given', () => {
      const testCase = {
        sourceUserName: 'a'.repeat(24),
        destinationUserName: 'b'.repeat(24),
      };
      validateAccountTransferSchema(accountTransferSchema, testCase);
    });

    test('when a user containing underscores is given', () => {
      const testCase = {
        sourceUserName: 'a'.repeat(24),
        destinationUserName: 'Bob_1215',
      };
      validateAccountTransferSchema(accountTransferSchema, testCase);
    });

    test('when a user containing numbers is given', () => {
      const testCase = {
        sourceUserName: 'a'.repeat(24),
        destinationUserName: 'Alice0703',
      };
      validateAccountTransferSchema(accountTransferSchema, testCase);
    });

    test('when a user containing underscores and numbers is given', () => {
      const testCases = [
        {
          sourceUserName: 'a'.repeat(24),
          destinationUserName: 'Alice_and_Bob_0703',
        },
        {
          sourceUserName: 'a'.repeat(24),
          destinationUserName: '0703_Alice_and_Bob',
        },
        {
          sourceUserName: 'Alice_and_Bob_0703',
          destinationUserName: 'a'.repeat(24),
        },
        {
          sourceUserName: '0703_Alice_and_Bob',
          destinationUserName: 'a'.repeat(24),
        },
      ];

      testCases.forEach((testCase) => {
        validateAccountTransferSchema(accountTransferSchema, testCase);
      });
    });

    function validateAccountTransferSchema(schema: ZodSchema<unknown>, data: unknown) {
      const result = schema.safeParse(data);

      expect(result.success).toBeTruthy();
    }
  });

  describe('At least one incorrect user is given', () => {
    test('when at least one user with a two-letter name is given', () => {
      const tooShortNameUsers = [
        {
          sourceUserName: 'ab',
          destinationUserName: 'Alice',
        },
        {
          sourceUserName: 'Alice',
          destinationUserName: 'ab',
        },
        {
          sourceUserName: 'ab',
          destinationUserName: 'cd',
        },
      ];

      tooShortNameUsers.forEach((testCase) => {
        validateAccountTransferSchema(accountTransferSchema, testCase);
      });
    });

    test('when at least one user with a 25-letter name is given', () => {
      const tooLongNameUsers = [
        {
          sourceUserName: 'a'.repeat(25),
          destinationUserName: 'Alice',
        },
        {
          sourceUserName: 'Alice',
          destinationUserName: 'a'.repeat(25),
        },
        {
          sourceUserName: 'a'.repeat(25),
          destinationUserName: 'a'.repeat(25),
        },
      ];

      tooLongNameUsers.forEach((testCase) => {
        validateAccountTransferSchema(accountTransferSchema, testCase);
      });
    });

    test('When at least one user name containing characters other than single-byte alphanumeric characters and underscore is given', () => {
      const invalidNameUser = [
        {
          sourceUserName: 'foo@bar',
          destinationUserName: 'Alice',
        },
        {
          sourceUserName: 'Alice',
          destinationUserName: 'foo@bar',
        },
        {
          sourceUserName: 'foo@bar',
          destinationUserName: '@hogefuga',
        },
      ];

      invalidNameUser.forEach((testCase) => {
        validateAccountTransferSchema(accountTransferSchema, testCase);
      });
    });

    test('When usernames with leading or trailing spaces are given', () => {
      const invalidNameUser = [
        {
          sourceUserName: ' Alice',
          destinationUserName: 'Bob',
        },
        {
          sourceUserName: 'Alice',
          destinationUserName: 'Bob ',
        },
        {
          sourceUserName: ' Charlie ',
          destinationUserName: ' David ',
        },
      ];
      invalidNameUser.forEach((testCase) => {
        validateAccountTransferSchema(accountTransferSchema, testCase);
      });
    });

    test('When at least user name containing double-byte characters is given', () => {
      const invalidNameUser = [
        {
          sourceUserName: 'fooＢar',
          destinationUserName: 'Alice',
        },
        {
          sourceUserName: 'Alice',
          destinationUserName: 'fooＢar',
        },
        {
          sourceUserName: 'fooＢar',
          destinationUserName: 'fizzＢuzz',
        },
      ];
      invalidNameUser.forEach((testCase) => {
        validateAccountTransferSchema(accountTransferSchema, testCase);
      });
    });

    test('When the same name users are given', () => {
      const invalidNameUser = [
        {
          sourceUserName: 'Alice',
          destinationUserName: 'Alice',
        },
        {
          sourceUserName: 'Bob',
          destinationUserName: 'Bob',
        },
        {
          sourceUserName: 'a'.repeat(24),
          destinationUserName: 'a'.repeat(24),
        },
      ];
      invalidNameUser.forEach((testCase) => {
        validateAccountTransferSchema(accountTransferSchema, testCase);
      });
    });

    function validateAccountTransferSchema(schema: ZodSchema<unknown>, data: unknown) {
      const result = schema.safeParse(data);

      expect(result.success).toBeFalsy();
    }
  });
});
