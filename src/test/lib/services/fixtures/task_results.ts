import { ContestType } from '$lib/types/contest';
import { TaskGrade } from '$lib/types/task';

export const MOCK_TASKS_DATA = [
  {
    id: '1',
    contest_id: 'abc101',
    task_id: 'arc099_a',
    contest_type: ContestType.ABC,
    task_table_index: 'C',
    title: 'Minimization',
    grade: TaskGrade.Q3,
  },
  {
    id: '2',
    contest_id: 'arc099',
    task_id: 'arc099_a',
    contest_type: ContestType.ARC,
    task_table_index: 'A',
    title: 'Minimization',
    grade: TaskGrade.Q3,
  },
  {
    id: '3',
    contest_id: 'tessoku-book',
    task_id: 'math_and_algorithm_ai',
    contest_type: ContestType.TESSOKU_BOOK,
    task_table_index: 'A06',
    title: 'How Many Guests?',
    grade: TaskGrade.Q4,
  },
  {
    id: '4',
    contest_id: 'math-and-algorithm',
    task_id: 'math_and_algorithm_ai',
    contest_type: ContestType.MATH_AND_ALGORITHM,
    task_table_index: '038',
    title: 'How Many Guests?',
    grade: TaskGrade.Q4,
  },
];

export const MOCK_SUBMISSION_STATUSES_DATA = [
  [
    '1',
    {
      id: '1',
      status_name: 'ac',
      image_path: 'ac.png',
      label_name: 'AC',
      is_ac: true,
    },
  ],
  [
    '2',
    {
      id: '2',
      status_name: 'ac_with_editorial',
      image_path: 'ac_with_editorial.png',
      label_name: '解説AC',
      is_ac: true,
    },
  ],
  [
    '3',
    {
      id: '3',
      status_name: 'wa',
      image_path: 'wa.png',
      label_name: '挑戦中',
      is_ac: false,
    },
  ],
  [
    '4',
    {
      id: '4',
      status_name: 'ns',
      image_path: 'ns.png',
      label_name: '未挑戦',
      is_ac: false,
    },
  ],
] as const;

export const MOCK_SUBMISSION_STATUSES = new Map(
  MOCK_SUBMISSION_STATUSES_DATA as unknown as Array<[string, any]>,
);

export const MOCK_ANSWERS_WITH_ANSWERS = new Map([
  ['arc099_a', { id: 'answer_2', status_id: '2' }],
  ['math_and_algorithm_ai', { id: 'answer_4', status_id: '1' }],
]);

export const EXPECTED_STATUSES = [
  {
    contest_id: 'abc101',
    task_id: 'arc099_a',
    status_name: 'ac_with_editorial', // answer_2 with status_id '2'
    is_ac: true,
  },
  {
    contest_id: 'arc099',
    task_id: 'arc099_a',
    status_name: 'ac_with_editorial', // answer_2 with status_id '2'
    is_ac: true,
  },
  {
    contest_id: 'tessoku-book',
    task_id: 'math_and_algorithm_ai',
    status_name: 'ac', // answer_4 with status_id '1'
    is_ac: true,
  },
  {
    contest_id: 'math-and-algorithm',
    task_id: 'math_and_algorithm_ai',
    status_name: 'ac', // answer_4 with status_id '1'
    is_ac: true,
  },
];
