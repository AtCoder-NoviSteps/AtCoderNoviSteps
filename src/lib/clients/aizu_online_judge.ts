import { fetchAPI } from '$lib/clients/common';
import type { ImportContests } from '$lib/types/contest';
import type { ImportTasks } from '$lib/types/task';

type AOJCourseAPI = {
  filter: string;
  courses: Courses;
};

type Course = {
  id: number;
  serial: number;
  shortName: string;
  name: string;
  type: string;
  userScore: number;
  maxScore: number;
  progress: number;
  image: string;
  numberOfTopics: number;
  topics: string;
  description: string;
};

type Courses = Course[];

type AOJTaskAPI = {
  id: string;
  available: number;
  doctype: number;
  name: string;
  problemTimeLimit: number;
  problemMemoryLimit: number;
  maxScore: number;
  solvedUser: number;
  submissions: number;
  recommendations: number;
  isSolved: boolean;
  bookmark: boolean;
  recommend: boolean;
  successRate: number;
  score: number;
  userScore: number;
};

export async function getContests(): Promise<ImportContests> {
  const coursesForContests = await fetchCoursesForContests();

  // TODO: fetch PCK (qual and final) contests.
  // TODO: Merge courseForContests and PCK contests.

  return coursesForContests;
}

async function fetchCoursesForContests(): Promise<ImportContests> {
  const allCoursesUrl = `https://judgeapi.u-aizu.ac.jp/courses`;
  const allCourses = await fetchAPI<AOJCourseAPI>(
    allCoursesUrl,
    'Failed to fetch courses from AIZU ONLINE JUDGE API',
  );

  if ('courses' in allCourses) {
    const courses = allCourses.courses as Courses;

    const coursesForContest = courses.map((course: Course) => {
      const courseForContest = {
        id: course.shortName,
        start_epoch_second: '', // 該当するデータがないため
        duration_second: '', // 同上
        title: course.name,
        rate_change: '', // 同上
      };
      return courseForContest;
    });

    return coursesForContest;
  } else {
    console.error('Not found Courses in the response.');
    return [];
  }
}

export async function getTasks(): Promise<ImportTasks> {
  const courseTasks: ImportTasks = await fetchCourseTasks();
  // TODO: fetch PCK (qual and final) tasks.
  // TODO: Merge courseTasks and PCK tasks.

  return courseTasks;
}

async function fetchCourseTasks(): Promise<ImportTasks> {
  const size = 10 ** 4;
  const allProblemsUrl = `https://judgeapi.u-aizu.ac.jp/problems?size=${size}`;
  const allTasks = await fetchAPI<AOJTaskAPI>(
    allProblemsUrl,
    'Failed to fetch course tasks from AIZU ONLINE JUDGE API',
  );

  const courseTasks: ImportTasks = allTasks
    .filter((task: AOJTaskAPI) => getCourseName(task.id) !== '')
    .map((task: AOJTaskAPI) => {
      const taskId = task.id;

      const courseTask = {
        id: taskId,
        contest_id: getCourseName(taskId),
        problem_index: taskId, // problem_index 相当の値がないため task.id で代用。AtCoder Problems APIにおいても、JOIの古い問題で同様の処理が行われている。
        task_id: taskId, // 同上
        title: task.name,
      };

      return courseTask;
    });

  return courseTasks;
}

// taskId:
// ・courses   : courseNameAbbr_topicId_taskIndex (ex: ITP1_1_A, ..., INFO1_01_E, ...)
// ・challenges: taskNumber (ex: 0001, ..., 0703, ..., 3000)
export const getCourseName = (taskId: string) => {
  const splittedTaskId = taskId.split('_');

  if (splittedTaskId.length == 3) {
    return splittedTaskId[0];
  } else {
    return '';
  }
};
