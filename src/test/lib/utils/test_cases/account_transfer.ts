import type { User } from '@prisma/client';
import { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';

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
  updated_at: new Date(),
};

export const sampleAnswer: Map<string, TaskResult> = new Map([['abc999', sampleTaskResult]]);

export const testCasesForAdminCanNotBeCopied = [
  { user: admin, answers: new Map(), expectedToHaveAnswers: false, messages: [] },
  { user: admin, answers: sampleAnswer, expectedToHaveAnswers: false, messages: [] },
];

export const testCasesForSourceUserWithAnswer = [
  { user: guest, answers: sampleAnswer, expectedToHaveAnswers: true, messages: [] },
  {
    user: general,
    answers: sampleAnswer,
    expectedToHaveAnswers: true,
    messages: [],
  },
];

export const testCasesForSourceUserWithoutAnswer = [
  { user: guest, answers: new Map(), expectedToHaveAnswers: true, messages: [] },
  { user: general, answers: new Map(), expectedToHaveAnswers: true, messages: [] },
];

export const testCasesForDestinationUserWithoutAnswer = [
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

export const testCasesForDestinationUserWithAnswer = [
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

export const testCasesForExistingUser = [
  { userName: admin.username, user: admin, messages: [] },
  { userName: guest.username, user: guest, messages: [] },
  { userName: general.username, user: general, messages: [] },
];

export const testCasesForNoExistingUser = [{ userName: 'Bob', user: null, messages: [] }];

export const testCasesForEmptyUser = [{ user: null, messages: [] }];

export const testCasesForUser = [
  { user: guest, messages: [] },
  { user: general, messages: [] },
];

export const testCasesForAdminUser = [{ user: admin, messages: [] }];
