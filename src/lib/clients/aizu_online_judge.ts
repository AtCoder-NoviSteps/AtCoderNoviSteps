import { fetchAPI } from '$lib/clients/common';
import type { ContestsForImport } from '$lib/types/contest';
import type { TasksForImport } from '$lib/types/task';

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

type ChallengeContestAPI = {
  largeCl: object;
  contests: ChallengeContests;
};

type ChallengeContest = {
  abbr: string;
  largeCl: string;
  middleCl: string;
  year: number;
  progress: number;
  numberOfProblems: number;
  numberOfSolved: number;
  days: { title: string; problems: AOJTaskAPI[] }[];
};

type ChallengeContests = ChallengeContest[];

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

type AOJTaskAPIs = AOJTaskAPI[];

const PRELIM = 'prelim';
const FINAL = 'final';

export async function getContests(): Promise<ContestsForImport> {
  const [courses, pckPrelims, pckFinals] = await Promise.all([
    fetchCoursesForContests(),
    fetchPckContests(PRELIM),
    fetchPckContests(FINAL),
  ]);
  const contests = courses.concat(pckPrelims, pckFinals);

  return contests;
}

async function fetchCoursesForContests(): Promise<ContestsForImport> {
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
        start_epoch_second: -1, // 該当するデータがないため
        duration_second: -1, // 同上
        title: course.name,
        rate_change: '', // 同上
      };
      return courseForContest;
    });

    console.log(`Found AOJ course: ${courses.length} contests.`);

    return coursesForContest;
  } else {
    console.error('Not found Courses in the response.');
    return [];
  }
}

async function fetchPckContests(round: string): Promise<ContestsForImport> {
  const allPckContestsUrl = `https://judgeapi.u-aizu.ac.jp/challenges/cl/pck/${round}`;
  const allPckContests = await fetchAPI<ChallengeContestAPI>(
    allPckContestsUrl,
    `Failed to fetch PCK ${round} tasks from AIZU ONLINE JUDGE API`,
  );

  if ('contests' in allPckContests) {
    const contests = allPckContests.contests.reduce(
      (importContests: ContestsForImport, contest: ChallengeContest) => {
        const titles = contest.days.map((day) => day.title);
        titles.forEach((title: string) => {
          importContests.push({
            id: contest.abbr,
            start_epoch_second: -1, // 該当するデータがないため
            duration_second: -1, // 同上
            title: title,
            rate_change: '', // 同上
          });
        });
        return importContests;
      },
      [] as ContestsForImport,
    );

    console.log(`Found PCK ${round}: ${contests.length} contests.`);

    return contests;
  } else {
    console.error(`Not found PCK ${round} in the response.`);
    return [];
  }
}

export async function getTasks(): Promise<TasksForImport> {
  const [courses, pckPrelims, pckFinals] = await Promise.all([
    fetchCourseTasks(),
    fetchPckTasks(PRELIM),
    fetchPckTasks(FINAL),
  ]);
  const tasks = courses.concat(pckPrelims, pckFinals);

  return tasks;
}

async function fetchCourseTasks(): Promise<TasksForImport> {
  const size = 10 ** 4;
  const allTasksUrl = `https://judgeapi.u-aizu.ac.jp/problems?size=${size}`;
  const allTasks = await fetchAPI<AOJTaskAPIs>(
    allTasksUrl,
    'Failed to fetch course tasks from AIZU ONLINE JUDGE API',
  );

  const courseTasks: TasksForImport = allTasks
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

  console.log(`Found AOJ course: ${courseTasks.length} tasks.`);

  return courseTasks;
}

// taskId:
// ・courses   : courseNameAbbr_topicId_taskIndex (ex: ITP1_1_A, ..., INFO1_01_E, ...)
// ・challenges: taskNumber (ex: 0001, ..., 0703, ..., 3000)
export const getCourseName = (taskId: string) => {
  let courseName = '';
  const splittedTaskId = taskId.split('_');

  if (splittedTaskId.length == 3) {
    courseName = splittedTaskId[0];
  }

  return courseName;
};

async function fetchPckTasks(round: string): Promise<TasksForImport> {
  const allPckContestsUrl = `https://judgeapi.u-aizu.ac.jp/challenges/cl/pck/${round}`;
  const allPckContests = await fetchAPI<ChallengeContestAPI>(
    allPckContestsUrl,
    `Failed to fetch PCK ${round} tasks from AIZU ONLINE JUDGE API`,
  );

  if ('contests' in allPckContests) {
    const tasks: TasksForImport = allPckContests.contests.flatMap((contest: ChallengeContest) =>
      contest.days.flatMap((day) =>
        day.problems.map((problem) => {
          const taskId = problem.id;

          return {
            id: taskId,
            contest_id: contest.abbr,
            problem_index: taskId, // problem_index 相当の値がないため problem.id で代用。AtCoder Problems APIにおいても、JOIの古い問題で同様の処理が行われている。
            task_id: taskId, // 同上
            title: problem.name,
          };
        }),
      ),
    );
    console.log(`Found PCK ${round}: ${tasks.length} tasks.`);

    return tasks;
  } else {
    console.error(`Not found PCK ${round} in the response.`);
    return [];
  }
}
