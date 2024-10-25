import type { User } from '@prisma/client';
import { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';
import type { FloatingMessages } from '$lib/types/floating_message';

import { createTestCase } from '../../common/test_helpers';
import { taskResultsForUserId3 } from './task_results';

export type TestCaseForTransferValidation = {
  source: User;
  destination: User;
};

export type TestCaseForUserAndAnswersValidation = {
  user: User;
  answers: Map<string, TaskResult>;
  expectedToHaveAnswers: boolean;
  messages: FloatingMessages;
};

export type TestCaseForUserValidation = {
  userName: string;
  user: User | null;
  messages: FloatingMessages;
};

export type TestCaseForAdminValidation = {
  user: User | null;
  messages: FloatingMessages;
};

const SAMPLE_CREATION_TIMESTAMP = new Date('2024-01-01T00:00:00Z');

const admin: User = {
  id: '1',
  username: 'admin',
  role: Roles.ADMIN,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: SAMPLE_CREATION_TIMESTAMP,
  updated_at: SAMPLE_CREATION_TIMESTAMP,
};
const guest: User = {
  id: '2',
  username: 'guest',
  role: Roles.USER,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: SAMPLE_CREATION_TIMESTAMP,
  updated_at: SAMPLE_CREATION_TIMESTAMP,
};
const general: User = {
  id: '3',
  username: 'Alice',
  role: Roles.USER,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: SAMPLE_CREATION_TIMESTAMP,
  updated_at: SAMPLE_CREATION_TIMESTAMP,
};

const TASK_RESULT_CONSTANTS = {
  STATUS: {
    WA: 'wa',
    ID: '3',
    IMAGE: 'wa.png',
    LABEL: '挑戦中', // TODO: Add i18n support
  },
  CONTEST: {
    ID: 'abc999',
    TASK_INDEX: 'A',
    TASK_ID: 'abc999_a',
    TITLE: 'A. hoge hoge',
  },
  GRADE: 'Q7',
} as const;

const sampleTaskResult: TaskResult = {
  is_ac: false,
  user_id: '',
  status_name: TASK_RESULT_CONSTANTS.STATUS.WA,
  status_id: TASK_RESULT_CONSTANTS.STATUS.ID,
  submission_status_image_path: TASK_RESULT_CONSTANTS.STATUS.IMAGE,
  submission_status_label_name: TASK_RESULT_CONSTANTS.STATUS.LABEL,
  contest_id: TASK_RESULT_CONSTANTS.CONTEST.ID,
  task_table_index: TASK_RESULT_CONSTANTS.CONTEST.TASK_INDEX,
  task_id: TASK_RESULT_CONSTANTS.CONTEST.TASK_ID,
  title: TASK_RESULT_CONSTANTS.CONTEST.TITLE,
  grade: TASK_RESULT_CONSTANTS.GRADE,
  updated_at: SAMPLE_CREATION_TIMESTAMP,
};

export const sampleAnswer: Map<string, TaskResult> = new Map([['abc999', sampleTaskResult]]);

const sampleAnswers = new Map<string, TaskResult>();

// 2 out of 3 are accepted
taskResultsForUserId3.forEach((taskResult) => {
  sampleAnswers.set(taskResult.task_id, taskResult);
});

const createTestCaseForTransferValidation = createTestCase<TestCaseForTransferValidation>;

export const testCasesForSameUsers = [
  createTestCaseForTransferValidation('source and destination are guest')({
    source: guest,
    destination: guest,
  }),
  createTestCaseForTransferValidation('source and destination are general')({
    source: general,
    destination: general,
  }),
];

export const testCasesForNotSameUsers = [
  createTestCaseForTransferValidation('source is guest and destination is general')({
    source: guest,
    destination: general,
  }),
  createTestCaseForTransferValidation('source is general and destination is guest')({
    source: general,
    destination: guest,
  }),
];

const createTestCaseForUserAndAnswers = createTestCase<TestCaseForUserAndAnswersValidation>;

// Note: The messages array is intentionally left empty and will be populated during test execution.
export const testCasesForAdminCanNotBeCopied = [
  createTestCaseForUserAndAnswers('an admin with no answers')({
    user: admin,
    answers: new Map(),
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('an admin with an answer')({
    user: admin,
    answers: sampleAnswer,
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('an admin with answers')({
    user: admin,
    answers: sampleAnswers,
    expectedToHaveAnswers: false,
    messages: [],
  }),
];

export const testCasesForSourceUserWithAnswer = [
  createTestCaseForUserAndAnswers('a guest with an answer')({
    user: guest,
    answers: sampleAnswer,
    expectedToHaveAnswers: true,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a guest with answers')({
    user: guest,
    answers: sampleAnswers,
    expectedToHaveAnswers: true,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a general user with an answer')({
    user: general,
    answers: sampleAnswer,
    expectedToHaveAnswers: true,
    messages: [],
  }),
];

export const testCasesForSourceUserWithoutAnswer = [
  createTestCaseForUserAndAnswers('a guest with no answers')({
    user: guest,
    answers: new Map(),
    expectedToHaveAnswers: true,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a general user with no answers')({
    user: general,
    answers: new Map(),
    expectedToHaveAnswers: true,
    messages: [],
  }),
];

export const testCasesForDestinationUserWithoutAnswer = [
  createTestCaseForUserAndAnswers('a guest with no answers')({
    user: guest,
    answers: new Map(),
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a general user with no answers')({
    user: general,
    answers: new Map(),
    expectedToHaveAnswers: false,
    messages: [],
  }),
];

const createPartialTaskResult = (is_ac: boolean, updatedAt: Date): TaskResult => ({
  ...sampleTaskResult,
  is_ac,
  updated_at: updatedAt,
});

export const testCasesForDestinationUserWithAnswer = [
  createTestCaseForUserAndAnswers('a guest with an answer')({
    user: guest,
    answers: sampleAnswer,
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a guest with answers')({
    user: guest,
    answers: sampleAnswers,
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a general user with an answer')({
    user: general,
    answers: sampleAnswer,
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a general user with answers')({
    user: general,
    answers: sampleAnswers,
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a general user with mixed completion status')({
    user: general,
    answers: new Map([
      ['task1', createPartialTaskResult(true, new Date('2024-01-01'))],
      ['task2', createPartialTaskResult(false, new Date('2024-01-02'))],
    ]),
    expectedToHaveAnswers: false,
    messages: [],
  }),
];

const createTestCaseForUserValidation = createTestCase<TestCaseForUserValidation>;

export const testCasesForExistingUser = [
  createTestCaseForUserValidation('an admin')({
    userName: admin.username,
    user: admin,
    messages: [],
  }),
  createTestCaseForUserValidation('a guest')({
    userName: guest.username,
    user: guest,
    messages: [],
  }),
  createTestCaseForUserValidation('a general user')({
    userName: general.username,
    user: general,
    messages: [],
  }),
];

export const testCasesForNoExistingUser = [
  createTestCaseForUserValidation('No existing user')({
    userName: 'Bob',
    user: null,
    messages: [],
  }),
  createTestCaseForUserValidation('Invalid username format')({
    userName: 'user@name',
    user: null,
    messages: [],
  }),
  createTestCaseForUserValidation('Reserved username')({
    userName: 'system',
    user: null,
    messages: [],
  }),
  createTestCaseForUserValidation('Minimum length username')({
    userName: 'a'.repeat(2),
    user: null,
    messages: [],
  }),
  createTestCaseForUserValidation('Maximum length username')({
    userName: 'a'.repeat(25),
    user: null,
    messages: [],
  }),
];

const createTestCaseForAdminValidation = createTestCase<TestCaseForAdminValidation>;

export const testCasesForEmptyUser = [
  createTestCaseForAdminValidation('an empty user')({ user: null, messages: [] }),
];

export const testCasesForUser = [
  createTestCaseForAdminValidation('a guest')({ user: guest, messages: [] }),
  createTestCaseForAdminValidation('a general user')({ user: general, messages: [] }),
];

export const testCasesForAdminUser = [
  createTestCaseForAdminValidation('an admin')({ user: admin, messages: [] }),
];
