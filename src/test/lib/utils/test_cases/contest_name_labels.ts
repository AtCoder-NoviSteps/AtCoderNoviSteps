import { createTestCase } from '../../common/test_helpers';

export type TestCaseForContestNameLabel = {
  contestId: string;
  expected: string;
};

const createTestCaseForContestNameLabel = createTestCase<TestCaseForContestNameLabel>;

export const edpc = [
  createTestCaseForContestNameLabel('DP')({
    contestId: 'dp',
    expected: 'EDPC',
  }),
];

export const tdpc = [
  createTestCaseForContestNameLabel('TDPC')({
    contestId: 'tdpc',
    expected: 'TDPC',
  }),
];

export const aclPractice = [
  createTestCaseForContestNameLabel('ACL Practice')({
    contestId: 'practice2',
    expected: 'ACL Practice',
  }),
];

export const atCoderOthers = [
  createTestCaseForContestNameLabel('Chokudai SpeedRun 001')({
    contestId: 'chokudai_S001',
    expected: 'Chokudai SpeedRun 001',
  }),
  createTestCaseForContestNameLabel('Chokudai SpeedRun 002')({
    contestId: 'chokudai_S002',
    expected: 'Chokudai SpeedRun 002',
  }),
];

export const mathAndAlgorithm = [
  createTestCaseForContestNameLabel('Math and Algorithm')({
    contestId: 'math-and-algorithm',
    expected: 'アルゴリズムと数学',
  }),
];

export const awc = [
  createTestCaseForContestNameLabel('AWC 0001')({
    contestId: 'awc0001',
    expected: 'AWC 0001',
  }),
  createTestCaseForContestNameLabel('AWC 0002')({
    contestId: 'awc0002',
    expected: 'AWC 0002',
  }),
  createTestCaseForContestNameLabel('AWC 9999')({
    contestId: 'awc9999',
    expected: 'AWC 9999',
  }),
];

export const fps24 = [
  createTestCaseForContestNameLabel('FPS 24')({
    contestId: 'fps-24',
    expected: 'FPS 24 題',
  }),
];
