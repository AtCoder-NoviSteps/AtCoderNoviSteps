import type { User } from '@prisma/client';
import { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';
import type { FloatingMessages } from '$lib/types/floating_message';

import { createTestCase } from '../../common/test_helpers';

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

const TEST_TIMESTAMP = new Date('2024-01-01T00:00:00Z');

const admin: User = {
  id: '1',
  username: 'admin',
  role: Roles.ADMIN,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: TEST_TIMESTAMP,
  updated_at: TEST_TIMESTAMP,
};
const guest: User = {
  id: '2',
  username: 'guest',
  role: Roles.USER,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: TEST_TIMESTAMP,
  updated_at: TEST_TIMESTAMP,
};
const general: User = {
  id: '3',
  username: 'Alice',
  role: Roles.USER,
  atcoder_validation_code: '',
  atcoder_username: '',
  atcoder_validation_status: false,
  created_at: TEST_TIMESTAMP,
  updated_at: TEST_TIMESTAMP,
};

const sampleTaskResult: TaskResult = {
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
  updated_at: TEST_TIMESTAMP,
};

export const sampleAnswer: Map<string, TaskResult> = new Map([['abc999', sampleTaskResult]]);

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
];

export const testCasesForSourceUserWithAnswer = [
  createTestCaseForUserAndAnswers('a guest with an answer')({
    user: guest,
    answers: sampleAnswer,
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

export const testCasesForDestinationUserWithAnswer = [
  createTestCaseForUserAndAnswers('a guest with an answer')({
    user: guest,
    answers: sampleAnswer,
    expectedToHaveAnswers: false,
    messages: [],
  }),
  createTestCaseForUserAndAnswers('a general user with an answer')({
    user: general,
    answers: sampleAnswer,
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
