import { TaskGrade } from '$lib/types/task';

type TaskGradeGuideline = {
  point: string;
  task: string;
  lowerGrade: TaskGrade;
  upperGrade: TaskGrade;
};

type TaskGradeGuidelines = TaskGradeGuideline[];

export const gradeGuidelineTableData: TaskGradeGuidelines = [
  {
    point: '100',
    task: 'A',
    lowerGrade: TaskGrade.Q9,
    upperGrade: TaskGrade.Q6,
  },
  {
    point: '150',
    task: 'A、B',
    lowerGrade: TaskGrade.Q7,
    upperGrade: TaskGrade.Q5,
  },
  {
    point: '200',
    task: 'B',
    lowerGrade: TaskGrade.Q6,
    upperGrade: TaskGrade.Q4,
  },
  {
    point: '250',
    task: 'B、C',
    lowerGrade: TaskGrade.Q5,
    upperGrade: TaskGrade.Q3,
  },
  {
    point: '300',
    task: 'C',
    lowerGrade: TaskGrade.Q4,
    upperGrade: TaskGrade.Q2,
  },
  {
    point: '350',
    task: 'C、D',
    lowerGrade: TaskGrade.Q3,
    upperGrade: TaskGrade.Q1,
  },
  {
    point: '400',
    task: 'D',
    lowerGrade: TaskGrade.Q2,
    upperGrade: TaskGrade.Q1,
  },
  {
    point: '425',
    task: 'D、E',
    lowerGrade: TaskGrade.Q2,
    upperGrade: TaskGrade.Q1,
  },
  {
    point: '450',
    task: 'D、E',
    lowerGrade: TaskGrade.Q1,
    upperGrade: TaskGrade.D1,
  },
  {
    point: '475',
    task: 'E、F',
    lowerGrade: TaskGrade.Q1,
    upperGrade: TaskGrade.D2,
  },
  {
    point: '500',
    task: 'E、F',
    lowerGrade: TaskGrade.Q1,
    upperGrade: TaskGrade.D3,
  },
  {
    point: '525',
    task: 'F',
    lowerGrade: TaskGrade.D1,
    upperGrade: TaskGrade.D3,
  },
  {
    point: '550',
    task: 'F',
    lowerGrade: TaskGrade.D2,
    upperGrade: TaskGrade.D4,
  },
  {
    point: '575',
    task: 'F、G',
    lowerGrade: TaskGrade.D3,
    upperGrade: TaskGrade.D4,
  },
  {
    point: '600',
    task: 'G',
    lowerGrade: TaskGrade.D3,
    upperGrade: TaskGrade.D4,
  },
  {
    point: '625',
    task: 'G',
    lowerGrade: TaskGrade.D3,
    upperGrade: TaskGrade.D5,
  },
  {
    point: '650',
    task: 'G',
    lowerGrade: TaskGrade.D4,
    upperGrade: TaskGrade.D5,
  },
  {
    point: '675',
    task: 'G',
    lowerGrade: TaskGrade.D5,
    upperGrade: TaskGrade.D6,
  },
];
