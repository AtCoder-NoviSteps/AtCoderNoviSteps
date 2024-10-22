import { expect } from 'vitest';

import { runTests } from '../common/test_helpers';
import { validateUserAndAnswers, isExistingUser, isAdminUser } from '$lib/utils/account_transfer';

import type { User } from '@prisma/client';
import type { TaskResult } from '$lib/types/task';
import type { FloatingMessages } from '$lib/types/floating_message';

import {
  testCasesForAdminCanNotBeCopied,
  testCasesForSourceUserWithAnswer,
  testCasesForSourceUserWithoutAnswer,
  testCasesForDestinationUserWithoutAnswer,
  testCasesForDestinationUserWithAnswer,
  testCasesForExistingUser,
  testCasesForNoExistingUser,
  testCasesForEmptyUser,
  testCasesForUser,
  testCasesForAdminUser,
} from './test_cases/account_transfer';

type TestCaseForUserAndAnswersValidation = {
  user: User;
  answers: Map<string, TaskResult>;
  expectedToHaveAnswers: boolean;
  messages: FloatingMessages;
};

type TestCaseForUserValidation = {
  userName: string;
  user: User | null;
  messages: FloatingMessages;
};

type TestCaseForAdminValidation = {
  user: User | null;
  messages: FloatingMessages;
};

describe('Account transfer', () => {
  describe('validate user and answers', () => {
    describe('when an admin is given', () => {
      runTests(
        'validateUserAndAnswers',
        testCasesForAdminCanNotBeCopied,
        ({
          user,
          answers,
          expectedToHaveAnswers,
          messages,
        }: TestCaseForUserAndAnswersValidation) => {
          expect(
            validateUserAndAnswers(user, answers, expectedToHaveAnswers, messages),
          ).toBeFalsy();

          const expectedMessage: FloatingMessages = [
            {
              message: `${user?.username} は管理者権限をもっているためコピーできません。コピーを中止します`,
              status: false,
            },
          ];
          expect(messages).toHaveLength(1);
          expect(messages).toEqual(expectedMessage);
        },
      );
    });

    describe('when a source user with answer is given', () => {
      runTests(
        'validateUserAndAnswers',
        testCasesForSourceUserWithAnswer,
        ({
          user,
          answers,
          expectedToHaveAnswers,
          messages,
        }: TestCaseForUserAndAnswersValidation) => {
          expect(
            validateUserAndAnswers(user, answers, expectedToHaveAnswers, messages),
          ).toBeTruthy();

          expect(messages).toHaveLength(0);
          expect(messages).toEqual([]);
        },
      );
    });

    describe('when a source user without answer is given', () => {
      runTests(
        'validateUserAndAnswers',
        testCasesForSourceUserWithoutAnswer,
        ({
          user,
          answers,
          expectedToHaveAnswers,
          messages,
        }: TestCaseForUserAndAnswersValidation) => {
          expect(
            validateUserAndAnswers(user, answers, expectedToHaveAnswers, messages),
          ).toBeFalsy();

          expect(messages).toHaveLength(1);
          expect(messages).toEqual([
            {
              message: `${user.username} にコピー対象のデータがありません。コピーを中止します`,
              status: false,
            },
          ]);
        },
      );
    });

    describe('when a destination user without answer is given', () => {
      runTests(
        'validateUserAndAnswers',
        testCasesForDestinationUserWithoutAnswer,
        ({
          user,
          answers,
          expectedToHaveAnswers,
          messages,
        }: TestCaseForUserAndAnswersValidation) => {
          expect(
            validateUserAndAnswers(user, answers, expectedToHaveAnswers, messages),
          ).toBeTruthy();

          expect(messages).toHaveLength(0);
          expect(messages).toEqual([]);
        },
      );
    });

    describe('when a destination user with answer is given', () => {
      runTests(
        'validateUserAndAnswers',
        testCasesForDestinationUserWithAnswer,
        ({
          user,
          answers,
          expectedToHaveAnswers,
          messages,
        }: TestCaseForUserAndAnswersValidation) => {
          expect(
            validateUserAndAnswers(user, answers, expectedToHaveAnswers, messages),
          ).toBeFalsy();

          expect(messages).toHaveLength(1);
          expect(messages).toEqual([
            {
              message: `${user.username} にすでにデータがあります。コピーを中止します`,
              status: false,
            },
          ]);
        },
      );
    });
  });

  describe('is existing user', () => {
    describe('an existing user is given', () => {
      runTests(
        'isExistingUser',
        testCasesForExistingUser,
        ({ userName, user, messages }: TestCaseForUserValidation) => {
          expect(isExistingUser(userName, user, messages)).toBeTruthy();

          const expectedMessage: FloatingMessages = [
            { message: `${userName} が存在することを確認しました`, status: true },
          ];
          expect(messages).toHaveLength(1);
          expect(messages).toEqual(expectedMessage);
        },
      );
    });

    describe('when a user is not found', () => {
      runTests(
        'isExistingUser',
        testCasesForNoExistingUser,
        ({ userName, user, messages }: TestCaseForUserValidation) => {
          expect(isExistingUser(userName, user, messages)).toBeFalsy();

          const expectedMessage: FloatingMessages = [
            { message: `${userName} が存在しません。コピーを中止します`, status: false },
          ];
          expect(messages).toHaveLength(1);
          expect(messages).toEqual(expectedMessage);
        },
      );
    });
  });

  describe('is admin user', () => {
    describe('when a user is not found', () => {
      runTests(
        'isAdminUser',
        testCasesForEmptyUser,
        ({ user, messages }: TestCaseForAdminValidation) => {
          expect(isAdminUser(user, messages)).toBeFalsy();

          expect(messages).toHaveLength(0);
          expect(messages).toEqual([]);
        },
      );
    });

    describe('when a user (guest or general) is given', () => {
      runTests(
        'isAdminUser',
        testCasesForUser,
        ({ user, messages }: TestCaseForAdminValidation) => {
          expect(isAdminUser(user, messages)).toBeFalsy();

          expect(messages).toHaveLength(0);
          expect(messages).toEqual([]);
        },
      );
    });

    describe('when an admin is given', () => {
      runTests(
        'isAdminUser',
        testCasesForAdminUser,
        ({ user, messages }: TestCaseForAdminValidation) => {
          expect(isAdminUser(user, messages)).toBeTruthy();

          const expectedMessage: FloatingMessages = [
            {
              message: `${user?.username} は管理者権限をもっているためコピーできません。コピーを中止します`,
              status: false,
            },
          ];
          expect(messages).toHaveLength(1);
          expect(messages).toEqual(expectedMessage);
        },
      );
    });
  });
});
