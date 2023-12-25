// TODO: Enable to fetch data from the database via API.
export const tasks = [
  {
    contest_id: 'abc318',
    task_id: 'abc318_a',
    title: 'A - foo',
    grade: 'Q7',
  },
  {
    contest_id: 'abc231',
    task_id: 'abc231_a',
    title: 'A - Water Pressure',
    grade: 'Q10',
  },
  {
    contest_id: 'abc214',
    task_id: 'abc214_a',
    title: 'A - New Generation ABC',
    grade: 'Q10',
  },
  {
    contest_id: 'abc202',
    task_id: 'abc202_a',
    title: 'A - Three Dice',
    grade: 'Q9',
  },
];

export const answers = [
  {
    task_id: 'abc231_a',
    user_id: 'hogehoge',
    submission_status: 'wa',
    status_id: '2',
  },
  {
    task_id: 'abc214_a',
    user_id: 'hogehoge',
    submission_status: 'ac',
    status_id: '3',
  },
  {
    task_id: 'abc202_a',
    user_id: 'hogehoge',
    submission_status: 'ns',
    status_id: '1',
  },
];
