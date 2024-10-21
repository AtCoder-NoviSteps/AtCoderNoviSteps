import { expect, test } from 'vitest';

import { validateUserAndAnswers, isExistingUser, isAdminUser } from '$lib/utils/account_transfer';

import type { User } from '@prisma/client';
import type { TaskResult } from '$lib/types/task';
import { Roles } from '$lib/types/user';
import type { FloatingMessages } from '$lib/types/floating_message';

type TestCaseForUserAndAnswersValidation = {
  user: User;
  answers: Map<string, TaskResult>;
  expectedToHaveAnswers: boolean;
  messages: FloatingMessages;
};

type TestCasesForUserAndAnswersValidation = TestCaseForUserAndAnswersValidation[];

type TestCaseForUserValidation = {
  userName: string;
  user: User | null;
  messages: FloatingMessages;
};

type TestCasesForUserValidation = TestCaseForUserValidation[];

type TestCaseForAdminValidation = {
  user: User | null;
  messages: FloatingMessages;
};

type TestCasesForAdminValidation = TestCaseForAdminValidation[];

const admin: User = {
  id: '1',
  username: 'admin',
  role: Roles.ADMIN,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: new Date(),
  updated_at: new Date(),
};
const guest: User = {
  id: '2',
  username: 'guest',
  role: Roles.USER,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: new Date(),
  updated_at: new Date(),
};
const general: User = {
  id: '3',
  username: 'Alice',
  role: Roles.USER,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: new Date(),
  updated_at: new Date(),
};

const answer: TaskResult = {
  is_ac: false,
  user_id: '',
  status_name: 'wa',
  status_id: '3',
  submission_status_image_path: 'wa.png',
  submission_status_label_name: '挑戦中',
  contest_id: 'abc999',
  task_table_index: 'A',
  task_id: 'abc999_a',
  title: 'A. hoge hoge',
  grade: 'Q7',
  updated_at: new Date(),
};

const sampleAnswer: Map<string, TaskResult> = new Map([['abc999', answer]]);

describe('Account transfer', () => {
  describe('validate user and answers', () => {
    describe('when an admin is given', () => {
      const testCases = [
        { user: admin, answers: new Map(), expectedToHaveAnswers: false, messages: [] },
        { user: admin, answers: sampleAnswer, expectedToHaveAnswers: false, messages: [] },
      ];

      runTests(
        'validateUserAndAnswers',
        testCases,
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
      const testCases = [
        { user: guest, answers: sampleAnswer, expectedToHaveAnswers: true, messages: [] },
        {
          user: general,
          answers: sampleAnswer,
          expectedToHaveAnswers: true,
          messages: [],
        },
      ];

      runTests(
        'validateUserAndAnswers',
        testCases,
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
      const testCases = [
        { user: guest, answers: new Map(), expectedToHaveAnswers: true, messages: [] },
        { user: general, answers: new Map(), expectedToHaveAnswers: true, messages: [] },
      ];

      runTests(
        'validateUserAndAnswers',
        testCases,
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
      const testCases = [
        {
          user: guest,
          answers: new Map(),
          expectedToHaveAnswers: false,
          messages: [],
        },
        {
          user: general,
          answers: new Map(),
          expectedToHaveAnswers: false,
          messages: [],
        },
      ];

      runTests(
        'validateUserAndAnswers',
        testCases,
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
      const testCases = [
        {
          user: guest,
          answers: sampleAnswer,
          expectedToHaveAnswers: false,
          messages: [],
        },
        {
          user: general,
          answers: sampleAnswer,
          expectedToHaveAnswers: false,
          messages: [],
        },
      ];

      runTests(
        'validateUserAndAnswers',
        testCases,
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

    function runTests(
      testName: string,
      testCases: TestCasesForUserAndAnswersValidation,
      testFunction: (testCase: TestCaseForUserAndAnswersValidation) => void,
    ) {
      test.each(testCases)(
        `${testName}(username: $user.username, answers: $answers, expectedToHaveAnswers: $expectedToHaveAnswers)`,
        testFunction,
      );
    }
  });

  describe('is existing user', () => {
    describe('an existing user is given', () => {
      const testCases = [
        { userName: admin.username, user: admin, messages: [] },
        { userName: guest.username, user: guest, messages: [] },
        { userName: general.username, user: general, messages: [] },
      ];

      runTests(
        'isExistingUser',
        testCases,
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
      const testCases = [{ userName: 'Bob', user: null, messages: [] }];

      runTests(
        'isExistingUser',
        testCases,
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

    function runTests(
      testName: string,
      testCases: TestCasesForUserValidation,
      testFunction: (testCase: TestCaseForUserValidation) => void,
    ) {
      test.each(testCases)(`${testName}(username: $user.username)`, testFunction);
    }
  });

  describe('is admin user', () => {
    describe('when a user is not found', () => {
      const testCases = [{ user: null, messages: [] }];

      runTests('isAdminUser', testCases, ({ user, messages }: TestCaseForAdminValidation) => {
        expect(isAdminUser(user, messages)).toBeFalsy();

        expect(messages).toHaveLength(0);
        expect(messages).toEqual([]);
      });
    });

    describe('when a user (guest or general) is given', () => {
      const testCases = [
        { user: guest, messages: [] },
        { user: general, messages: [] },
      ];

      runTests('isAdminUser', testCases, ({ user, messages }: TestCaseForAdminValidation) => {
        expect(isAdminUser(user, messages)).toBeFalsy();

        expect(messages).toHaveLength(0);
        expect(messages).toEqual([]);
      });
    });

    describe('when an admin is given', () => {
      const testCases = [{ user: admin, messages: [] }];

      runTests('isAdminUser', testCases, ({ user, messages }: TestCaseForAdminValidation) => {
        expect(isAdminUser(user, messages)).toBeTruthy();

        const expectedMessage: FloatingMessages = [
          {
            message: `${user?.username} は管理者権限をもっているためコピーできません。コピーを中止します`,
            status: false,
          },
        ];
        expect(messages).toHaveLength(1);
        expect(messages).toEqual(expectedMessage);
      });
    });

    function runTests(
      testName: string,
      testCases: TestCasesForAdminValidation,
      testFunction: (testCase: TestCaseForAdminValidation) => void,
    ) {
      test.each(testCases)(`${testName}(username: $user.username)`, testFunction);
    }
  });
});
