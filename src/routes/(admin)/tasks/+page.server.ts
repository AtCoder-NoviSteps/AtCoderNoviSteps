import { redirect, type Actions } from '@sveltejs/kit';

import { Roles } from '$lib/types/user';
import type { Contests, ContestForImport, ContestsForImport } from '$lib/types/contest';
import {
  type Task,
  type Tasks,
  type TaskForImport,
  type TasksForImport,
  TaskGrade,
  getTaskGrade,
} from '$lib/types/task';

import * as taskService from '$lib/services/tasks';
import * as userService from '$lib/services/users';
import * as apiClient from '$lib/clients';

import { isAdmin } from '$lib/utils/authorship';
import { sha256 } from '$lib/utils/hash';
import { classifyContest } from '$lib/utils/contest';

import { LOGIN_PAGE } from '$lib/constants/navbar-links';
import { TEMPORARY_REDIRECT } from '$lib/constants/http-response-status-codes.js';

export async function load({ locals }) {
  await validateAdminAccess(locals);

  const { contestsForImport, tasksForImport } = await fetchContestsAndTasksFromAPI();

  const tasksFromDB = await taskService.getTasks();
  const registeredTaskMap = prepareTaskMap(tasksFromDB);

  const unregisteredTasks = filterUnregisteredTasks(
    contestsForImport,
    tasksForImport,
    registeredTaskMap,
  );
  const contestsWithUnregisteredTasks: Contests = mergeContestsAndUnregisteredTasks(
    contestsForImport,
    unregisteredTasks,
  );

  return {
    importContests: contestsWithUnregisteredTasks,
  };
}

async function validateAdminAccess(locals: App.Locals): Promise<void> {
  const session = await locals.auth.validate();

  if (!session) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }

  const user = await userService.getUser(session?.user.username as string);

  if (!isAdmin(user?.role as Roles)) {
    redirect(TEMPORARY_REDIRECT, LOGIN_PAGE);
  }
}

async function fetchContestsAndTasksFromAPI(): Promise<{
  contestsForImport: ContestsForImport;
  tasksForImport: TasksForImport;
}> {
  const contestsForImport = await apiClient.getContests();
  const tasksForImport = await apiClient.getTasks();

  return { contestsForImport, tasksForImport };
}

function prepareTaskMap(tasks: Tasks): Map<string, Task> {
  const taskMap = new Map<string, Task>();

  tasks.forEach((task: Task) => {
    taskMap.set(task.task_id, task);
  });

  return taskMap;
}

// See:
// src/lib/utils/contest.ts
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
) {
  const contestsWithUnregisteredTasks: Contests = contestsForImport.map(
    (contestForImport: ContestForImport) => {
      return {
        id: contestForImport.id,
        title: contestForImport.title,
        start_epoch_second: contestForImport.start_epoch_second,
        duration_second: contestForImport.duration_second,
        tasks: unregisteredTasks.get(contestForImport.id) ?? [],
      };
    },
  );

  return contestsWithUnregisteredTasks;
}

export const actions: Actions = {
  create: async ({ request }) => {
    try {
      console.log('users->actions->generate');
      const formData = await request.formData();
      const contest_id = formData.get('contest_id')?.toString() as string;

      const tasks = await apiClient.getTasks();
      const tasksByContestId = tasks.filter(
        (task: TaskForImport) => task.contest_id === contest_id,
      );

      tasksByContestId.map(async (task: TaskForImport) => {
        const id = (await sha256(contest_id + task.title)) as string;
        await taskService.createTask(id, task.id, task.contest_id, task.problem_index, task.title);
      });
    } catch {
      return {
        success: false,
      };
    }

    return {
      success: true,
    };
  },

  update: async ({ request }) => {
    try {
      console.log('users->actions->generate');
      const formData = await request.formData();
      console.log(formData);
      const task_id = formData.get('task_id')?.toString();

      const task_grade_str: string | null = formData.get('task_grade')?.toString() || '';

      //POSTされてこなかった場合は抜ける
      if (task_grade_str === '') {
        return {
          success: true,
        };
      }

      // Assuming getTaskGrade function is defined as mentioned before
      const task_grade: TaskGrade | undefined = task_grade_str
        ? getTaskGrade(task_grade_str)
        : TaskGrade.PENDING;

      if (!task_id || task_grade === undefined) {
        return {
          success: false,
        };
      }

      await taskService.updateTask(task_id, task_grade);
      const contest_id = formData.get('contest_id')?.toString() as string;

      const tasks = await apiClient.getTasks();

      const tasksByContestId = tasks.filter(
        (task: TaskForImport) => task.contest_id === contest_id,
      );

      tasksByContestId.map(async (task: TaskForImport) => {
        const id = (await sha256(contest_id + task.title)) as string;
        console.log(id);
        await taskService.createTask(id, task.id, task.contest_id, task.problem_index, task.title);
      });
    } catch {
      return {
        success: false,
      };
    }

    redirect(301, '/problems/');
  },
};
