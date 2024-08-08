import { expect, test } from 'vitest';
import { authSchema } from '$lib/zod/schema';

describe('Schema', () => {
  describe('auth schema', () => {
    describe('a correct user is given', () => {
      test('when an admin is given', () => {
        const user = {
          username: 'admin',
          password: 'Ch0kuda1',
        };
        const result = authSchema.safeParse(user);

        expect(result.success).toBeTruthy();
      });

      test('when a guest is given', () => {
        const guest = {
          username: 'guest',
          password: 'Hell0Guest',
        };
        const result = authSchema.safeParse(guest);

        expect(result.success).toBeTruthy();
      });

      test('when a general user is given', () => {
        const guest = {
          username: 'hoge',
          password: 'Hell0Hoge',
        };
        const result = authSchema.safeParse(guest);

        expect(result.success).toBeTruthy();
      });

      test('when a user containing underscores is given', () => {
        const guest = {
          username: 'hoge_hoge',
          password: 'Hell0Hoge',
        };
        const result = authSchema.safeParse(guest);

        expect(result.success).toBeTruthy();
      });
    });

    describe('a incorrect user is given', () => {
      test('when a user with a two-letter name is given', () => {
        const tooShortNameUser = {
          username: 'ab',
          password: 'Hell0AbaB',
        };

        const result = authSchema.safeParse(tooShortNameUser);

        expect(result.success).toBeFalsy();
      });

      test('when a user with a 25-letter name is given', () => {
        const tooLongNameUser = {
          username: 'a'.repeat(25),
          password: 'Hell0AbaB',
        };

        const result = authSchema.safeParse(tooLongNameUser);

        expect(result.success).toBeFalsy();
      });

      test('When a user name containing characters other than single-byte alphanumeric characters and underscore is given', () => {
        const invalidNameUser = {
          username: 'foo@bar',
          password: 'Hell0foobar',
        };

        const result = authSchema.safeParse(invalidNameUser);

        expect(result.success).toBeFalsy();
      });

      test('When a user name containing double-byte characters is given', () => {
        const invalidNameUser = {
          username: 'fooＢar',
          password: 'Hell0fooB',
        };

        const result = authSchema.safeParse(invalidNameUser);

        expect(result.success).toBeFalsy();
      });

      test('When seven-characters password is given', () => {
        const tooShortPasswordUser = {
          username: 'foo',
          password: 'Hell0fo',
        };
        const result = authSchema.safeParse(tooShortPasswordUser);

        expect(result.success).toBeFalsy();
      });

      test('When 129-characters password is given', () => {
        const tooLongPasswordUser = {
          username: 'foo',
          password: 'Fo0'.repeat(43),
        };
        const result = authSchema.safeParse(tooLongPasswordUser);

        expect(result.success).toBeFalsy();
      });

      test("When a password that doesn't contain a lowercase letter is given", () => {
        const noLowercasePasswordUser = {
          username: 'foo',
          password: 'HELLO123',
        };
        const result = authSchema.safeParse(noLowercasePasswordUser);

        expect(result.success).toBeFalsy();
      });

      test("When a password that doesn't contain an uppercase letter is given", () => {
        const noUppercasePasswordUser = {
          username: 'foo',
          password: 'hello123',
        };
        const result = authSchema.safeParse(noUppercasePasswordUser);

        expect(result.success).toBeFalsy();
      });

      test("When a password that doesn't contain a number is given", () => {
        const noNumberPasswordUser = {
          username: 'foo',
          password: 'HelloWorld',
        };
        const result = authSchema.safeParse(noNumberPasswordUser);

        expect(result.success).toBeFalsy();
      });
    });
  });
});
