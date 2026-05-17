import { fail, type Actions } from '@sveltejs/kit';

import type { Contests, ContestForImport, ContestsForImport } from '$lib/types/contest';
import { type Task, type Tasks, type TaskForImport, type TasksForImport } from '$lib/types/task';

import * as taskService from '$lib/services/tasks';
import { validateAdminAccess } from '$features/auth/services/admin_access';

import { fetchContests, fetchTasks, isContestTaskImportSource } from '$lib/clients';

import { classifyContest } from '$lib/utils/contest';
import { sha256 } from '$lib/utils/hash';

import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '$lib/constants/http-response-status-codes';

export async function load({ locals, url }) {
  await validateAdminAccess(locals, url);
}

export const actions: Actions = {
  fetch: async ({ request, locals }) => {
    await validateAdminAccess(locals);

    const formData = await request.formData();
    const source = formData.get('source');

    if (!isContestTaskImportSource(source)) {
      return fail(BAD_REQUEST, { message: 'コンテストサイト・種別が不正です。' });
    }

    try {
      const [contestsForImport, tasksForImport, tasksFromDB] = await Promise.all([
        fetchContests(source),
        fetchTasks(source),
        taskService.getTasks(),
      ]);

      const registeredTaskMap = prepareTaskMap(tasksFromDB);
      const unregisteredTasks = filterUnregisteredTasks(
        contestsForImport,
        tasksForImport,
        registeredTaskMap,
      );

      return {
        importContests: mergeContestsAndUnregisteredTasks(contestsForImport, unregisteredTasks),
      };
    } catch {
      return fail(INTERNAL_SERVER_ERROR, { message: 'データ取得に失敗しました。' });
    }
  },

  create: async ({ request, locals }) => {
    await validateAdminAccess(locals);

    const formData = await request.formData();
    const source = formData.get('source');

    if (!isContestTaskImportSource(source)) {
      return fail(BAD_REQUEST, { message: 'コンテストサイト・種別が不正です。' });
    }

    const contest_id = formData.get('contest_id');

    if (typeof contest_id !== 'string' || !contest_id) {
      return fail(BAD_REQUEST, { message: 'コンテストIDが指定されていません。' });
    }

    const tasksJson = formData.get('tasks');

    if (typeof tasksJson !== 'string') {
      return fail(BAD_REQUEST, { message: '問題データが不正です。' });
    }

    let tasks: TasksForImport;

    try {
      tasks = JSON.parse(tasksJson) as TasksForImport;
    } catch {
      return fail(BAD_REQUEST, { message: '問題データの解析に失敗しました。' });
    }

    try {
      await Promise.all(
        tasks.map(async (task: TaskForImport) => {
          const id = (await sha256(contest_id + task.title)) as string;
          await taskService.createTask(
            id,
            task.id,
            task.contest_id,
            task.problem_index,
            task.title,
          );
        }),
      );
    } catch {
      return { success: false };
    }

    return { success: true };
  },
};

function prepareTaskMap(tasks: Tasks): Map<string, Task> {
  const taskMap = new Map<string, Task>();

  tasks.forEach((task: Task) => {
    taskMap.set(task.task_id, task);
  });

  return taskMap;
}

function filterUnregisteredTasks(
  contestsForImport: ContestsForImport,
  tasksForImport: TasksForImport,
  registeredTaskMap: Map<string, Task>,
): Map<string, TasksForImport> {
  const unregisteredTasks = new Map<string, TasksForImport>();

  contestsForImport.forEach((contestForImport: ContestForImport) => {
    const contest_id = contestForImport.id;
    const contest_type = classifyContest(contest_id);

    if (contest_type !== null) {
      unregisteredTasks.set(
        contest_id,
        tasksForImport.filter(
          (taskForImport: TaskForImport) =>
            taskForImport.contest_id == contest_id && !registeredTaskMap.has(taskForImport.id),
        ),
      );
    }
  });

  return unregisteredTasks;
}

function mergeContestsAndUnregisteredTasks(
  contestsForImport: ContestsForImport,
  unregisteredTasks: Map<string, TasksForImport>,
): Contests {
  return contestsForImport.map((contestForImport: ContestForImport) => ({
    id: contestForImport.id,
    title: contestForImport.title,
    start_epoch_second: contestForImport.start_epoch_second,
    duration_second: contestForImport.duration_second,
    tasks: unregisteredTasks.get(contestForImport.id) ?? [],
  }));
}
