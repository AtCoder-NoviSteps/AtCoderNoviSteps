import { expect, test } from 'vitest';
import { ZodSchema } from 'zod';

import { authSchema } from '$lib/zod/schema';

describe('Auth schema', () => {
  describe('a correct user is given', () => {
    test('when an admin is given', () => {
      const admin = {
        username: 'admin',
        password: 'Ch0kuda1',
      };
      validateAuthSchema(authSchema, admin);
    });

    test('when a guest is given', () => {
      const guest = {
        username: 'guest',
        password: 'Hell0Guest',
      };
      validateAuthSchema(authSchema, guest);
    });

    test('when a general user is given', () => {
      const user = {
        username: 'hoge',
        password: 'Hell0Hoge',
      };
      validateAuthSchema(authSchema, user);
    });

    test('when a user containing underscores is given', () => {
      const user = {
        username: 'hoge_hoge',
        password: 'Hell0Hoge',
      };
      validateAuthSchema(authSchema, user);
    });

    function validateAuthSchema(schema: ZodSchema<unknown>, data: unknown) {
      const result = schema.safeParse(data);

      expect(result.success).toBeTruthy();
    }
  });

  describe('a incorrect user is given', () => {
    test('when a user with a two-letter name is given', () => {
      const tooShortNameUser = {
        username: 'ab',
        password: 'Hell0AbaB',
      };
      validateAuthSchema(authSchema, tooShortNameUser);
    });

    test('when a user with a 25-letter name is given', () => {
      const tooLongNameUser = {
        username: 'a'.repeat(25),
        password: 'Hell0AbaB',
      };
      validateAuthSchema(authSchema, tooLongNameUser);
    });

    test('When a user name containing characters other than single-byte alphanumeric characters and underscore is given', () => {
      const invalidNameUser = {
        username: 'foo@bar',
        password: 'Hell0foobar',
      };
      validateAuthSchema(authSchema, invalidNameUser);
    });

    test('When a user name containing double-byte characters is given', () => {
      const invalidNameUser = {
        username: 'fooＢar',
        password: 'Hell0fooB',
      };
      validateAuthSchema(authSchema, invalidNameUser);
    });

    test('When seven-characters password is given', () => {
      const tooShortPasswordUser = {
        username: 'foo',
        password: 'Hell0fo',
      };
      validateAuthSchema(authSchema, tooShortPasswordUser);
    });

    test('When 129-characters password is given', () => {
      const tooLongPasswordUser = {
        username: 'foo',
        password: 'Fo0'.repeat(43),
      };
      validateAuthSchema(authSchema, tooLongPasswordUser);
    });

    test("When a password that doesn't contain a lowercase letter is given", () => {
      const noLowercasePasswordUser = {
        username: 'foo',
        password: 'HELLO123',
      };
      validateAuthSchema(authSchema, noLowercasePasswordUser);
    });

    test("When a password that doesn't contain an uppercase letter is given", () => {
      const noUppercasePasswordUser = {
        username: 'foo',
        password: 'hello123',
      };
      validateAuthSchema(authSchema, noUppercasePasswordUser);
    });

    test("When a password that doesn't contain a number is given", () => {
      const noNumberPasswordUser = {
        username: 'foo',
        password: 'HelloWorld',
      };
      validateAuthSchema(authSchema, noNumberPasswordUser);
    });

    function validateAuthSchema(schema: ZodSchema<unknown>, data: unknown) {
      const result = schema.safeParse(data);

      expect(result.success).toBeFalsy();
    }
  });
});
