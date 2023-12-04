// // See:
// // https://www.prisma.io/docs/getting-started/quickstart
import { PrismaClient, Roles } from '@prisma/client';
import {
  initialize,
  defineUserFactory,
  defineKeyFactory,
  defineTaskFactory,
  defineTagFactory,
  defineTaskTagFactory,
} from './.fabbrica';
import { generateLuciaPasswordHash } from 'lucia/utils';

import { classifyContest } from '../src/lib/utils/contest';

import { tasks } from './tasks';
// import { tasks } from './tasks_for_production';
import { tags } from './tags';
import { tasktags } from './tasktags';

const prisma = new PrismaClient();
initialize({ prisma });

const users = [
  { name: 'admin', role: Roles.ADMIN },
  { name: 'guest', role: Roles.USER },
  { name: 'Alice', role: Roles.USER },
  { name: 'Bob23', role: Roles.USER },
  { name: 'Carol', role: Roles.USER },
  { name: 'Dave4', role: Roles.USER },
  { name: 'Ellen', role: Roles.USER },
  { name: 'Frank', role: Roles.USER },
];

// See:
// https://github.com/TeemuKoivisto/sveltekit-monorepo-template/blob/main/packages/db/prisma/seed.ts
// https://lucia-auth.com/basics/keys/#password-hashing
// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
async function main() {
  addUsers();
  addTasks();
  addTags();
  addTaskTags();
}

function addUsers() {
  const userFactory = defineUserFactory();
  const keyFactory = defineKeyFactory({ defaultData: { user: userFactory } });

  users.map(async (user) => {
    const password = 'Ch0kuda1';
    const registeredUser = await prisma.user.findUnique({
      where: {
        username: user.name,
      },
    });

    if (!registeredUser) {
      await addUser(user, password, userFactory, keyFactory);
      console.log('username:', user.name, 'was registered.');
    } else {
      console.log('username:', user.name, 'has already registered.');
    }
  });
}

// See:
// https://lucia-auth.com/reference/lucia/modules/utils/#generateluciapasswordhash
async function addUser(user, password: string, userFactory, keyFactory) {
  const currentUser = await userFactory.createForConnect({
    username: user.name,
    role: user.role,
  });
  const hashed_password = await generateLuciaPasswordHash(password);

  await keyFactory.create({
    user: { connect: currentUser },
    id: 'username:' + user.name.toLocaleLowerCase(),
    hashed_password: hashed_password,
  });
}

function addTasks() {
  const taskFactory = defineTaskFactory();

  tasks.map(async (task) => {
    const registeredTask = await prisma.task.findMany({
      where: {
        task_id: task.id,
      },
    });

    if (registeredTask.length === 0) {
      console.log('task id:', task.id, 'was registered.');
      await addTask(task, taskFactory);
    } else {
      console.log('task id:', task.id, 'has already been registered.');
    }
  });
}

async function addTask(task, taskFactory) {
  await taskFactory.create({
    contest_type: classifyContest(task.contest_id),
    contest_id: task.contest_id,
    task_table_index: task.problem_index,
    task_id: task.id,
    title: task.title,
    grade: task.grade,
  });
}

async function addTags() {
  const tagFactory = defineTagFactory();

  tags.map(async (tag) => {
    const registeredTag = await prisma.tag.findMany({
      where: {
        id: tag.id,
      },
    });

    if (registeredTag.length === 0) {
      console.log('tag id:', tag.id, 'was registered.');
      await addTag(tag, tagFactory);
    } else {
      console.log('tag id:', tag.id, 'has already been registered.');
    }
  });
}

async function addTag(tag, tagFactory) {
  await tagFactory.create({
    id: tag.id,
    name: tag.name,
    is_official: tag.is_official,
    is_published: tag.is_published,
    title: tag.title,
  });
}

async function addTaskTags() {
  const taskTagFactory = defineTaskTagFactory();

  tasktags.map(async (tasktag) => {
    const registeredTaskTag = await prisma.taskTag.findMany({
      where: {
        task_id: tasktag.task_id,
        tag_id: tasktag.tag_id,
      },
    });

    if (registeredTaskTag.length === 0) {
      console.log('tag id:', tasktag.tag_id, 'task_id:', tasktag.task_id, 'was registered.');
      await addTaskTag(tasktag, taskTagFactory);
    } else {
      console.log(
        'tag id:',
        tasktag.id,
        'task id:',
        tasktag.task_id,
        'has already been registered.',
      );
    }
  });
}

async function addTaskTag(tasktag, taskTagFactory) {
  await taskTagFactory.create({
    id: tasktag.id,
    task_id: tasktag.task_id,
    tag_id: tasktag.tag_id,
    priority: tasktag.priority,
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
