import { redirect } from '@sveltejs/kit';

//import type { Roles } from '$lib/types/user';
import type { Contest, Task, ImportTask } from '$lib/types/task';
import * as taskService from '$lib/services/tasks';
import * as userService from '$lib/services/users';
import * as problemApiService from '$lib/services/problemsApiService';
import { Roles } from '$lib/types/user';

export async function load({ locals }) {
  const session = await locals.auth.validate();
  if (!session) {
    throw redirect(302, '/login');
  }

  const user = await userService.getUser(session?.user.username as string);
  if (user?.role !== Roles.ADMIN) {
    throw redirect(302, '/login');
  }

  const importContestsJson = await problemApiService.getContests();
  const importTasksJson = await problemApiService.getTasks();
  const tasks = await taskService.getTasks();

  //dbから取得した、contest_id-Task, task_id-Taskのマップ
  const taskContestMap = new Map<string, Task>();
  const taskMap = new Map<string, Task>();
  for (let i = 0; i < tasks.length; i++) {
    taskContestMap.set(tasks[i].contest_id, tasks[i]);
    taskMap.set(tasks[i].task_id, tasks[i]);
  }
  //APIから取得した、contest_id-ImportTaskのマップ
  const unregisteredTasksInContest = new Map<string, ImportTask[]>();

  //console.log(taskMap.values.length)
  //console.log(tasks[0])
  //console.log(importTasksJson[0])

  const thres = '1469275200'; //abc042

  //対象コンテストに絞る
  for (let i = 0; i < importContestsJson.length; i++) {
    const contest_id = importContestsJson[i].id;

    if (importContestsJson[i].start_epoch_second < thres) {
      continue;
    }
    //console.log(contest_id);
    //console.log("check:", importTasksJson[i], taskMap.has(importTasksJson[i].id))
    //console.log("check2:", importContestsJson[i].id)

    unregisteredTasksInContest.set(
      contest_id,
      importTasksJson.filter(
        (importTaskJson: ImportTask) =>
          importTaskJson.contest_id == contest_id && !taskMap.has(importTaskJson.id),
      ),
    );
    //const ary = unregisteredTasksInContest.get(contest_id) ?? []
    //if (ary.length > 0){
    //  filteredContests.push(importContestsJson[i])
    //}
    //for (let j = 0; j < importTasksJson.length; j++){
    //  if (importTasksJson[j].contest_id == contest_id && !taskMap.has(importTasksJson[i].id)){
    //    unregisteredTasksInContest.set(contest_id, importTasksJson[j])
    //  }
    //}
  }

  const importContests = importContestsJson.map((importContestJson: Contest) => {
    return {
      id: importContestJson.id,
      title: importContestJson.title,
      start_epoch_second: importContestJson.start_epoch_second,
      duration_second: importContestJson.duration_second,
      tasks: unregisteredTasksInContest.get(importContestJson.id) ?? [],
    };
  });
  //console.log(importContests)
  //console.log(unregisteredTasksInContest)
  //console.log(registeredTasksInContest)

  return {
    importContests: importContests,
  };
}
