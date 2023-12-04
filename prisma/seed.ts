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
import { tags } from './tags';
import { task_tags } from './task_tags';
// import { tasks } from './tasks_for_production';

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
    const registeredTaskTag = await prisma.taskTag.findMany({
      where: {
        task_id: task.id,
      },
    });

    if (registeredTask.length === 0) {
      console.log('task id:', task.id, 'was registered.');
      await addTask(task, taskFactory, registeredTaskTag.length !== 0);
    } else {
      console.log('task id:', task.id, 'has already been registered.');
    }
  });
}

async function addTask(task, taskFactory, isHavingTaskTag) {
  if (isHavingTaskTag) {
    await taskFactory.create({
      contest_type: classifyContest(task.contest_id),
      contest_id: task.contest_id,
      task_table_index: task.problem_index,
      task_id: task.id,
      title: task.title,
      grade: task.grade,
      tags: {
        create: [
          {
            tag: {
              connect: { task_id: task.task_id },
            },
          },
        ],
      },
    });
  } else {
    await taskFactory.create({
      contest_type: classifyContest(task.contest_id),
      contest_id: task.contest_id,
      task_table_index: task.problem_index,
      task_id: task.id,
      title: task.title,
      grade: task.grade,
    });
  }
}

async function addTags() {
  const tagFactory = defineTagFactory();

  tags.map(async (tag) => {
    const registeredTag = await prisma.tag.findMany({
      where: {
        id: tag.id,
      },
    });

    const registeredTaskTag = await prisma.taskTag.findMany({
      where: {
        tag_id: tag.id,
      },
    });

    if (registeredTag.length === 0) {
      console.log('tag id:', tag.id, 'was registered.');
      await addTag(tag, tagFactory, registeredTaskTag.length !== 0);
    } else {
      console.log('tag id:', tag.id, 'has already been registered.');
    }
  });
}

async function addTag(tag, tagFactory, isHavingTaskTag) {
  if (isHavingTaskTag) {
    await tagFactory.create({
      id: tag.id,
      name: tag.name,
      is_official: tag.is_official,
      is_published: tag.is_published,
      tasks: {
        create: [
          {
            task: {
              connect: { tag_id: tag.id },
            },
          },
        ],
      },
    });
  } else {
    await tagFactory.create({
      id: tag.id,
      name: tag.name,
      is_official: tag.is_official,
      is_published: tag.is_published,
    });
  }
}

async function addTaskTags() {
  const taskFactory = defineTaskFactory();
  const tagFactory = defineTagFactory();
  const taskTagFactory = defineTaskTagFactory({
    defaultData: { task: taskFactory, tag: tagFactory },
  });

  task_tags.map(async (task_tag) => {
    const registeredTaskTag = await prisma.taskTag.findMany({
      where: {
        AND: [{ task_id: task_tag.task_id }, { tag_id: task_tag.tag_id }],
      },
    });

    const registeredTask = await prisma.task.findMany({
      where: {
        task_id: task_tag.task_id,
      },
    });

    const registeredTag = await prisma.tag.findMany({
      where: {
        id: task_tag.tag_id,
      },
    });

    if (
      registeredTaskTag.length === 0 &&
      registeredTag.length === 1 &&
      registeredTask.length === 1
    ) {
      console.log('tag id:', task_tag.tag_id, 'task_id:', task_tag.task_id, 'was registered.');
      await addTaskTag(task_tag, taskTagFactory);
    } else if (registeredTaskTag.length !== 0) {
      console.log(
        'tag id:',
        task_tag.tag_id,
        'task id:',
        task_tag.task_id,
        'has already been registered.',
      );
    } else if (registeredTag.length !== 1 || registeredTask.length !== 1) {
      console.log('tag id:', task_tag.tag_id, ' or task id:', task_tag.task_id, 'is missing.');
    }
  });
}

async function addTaskTag(task_tag, taskTagFactory) {
  await taskTagFactory.create({
    id: task_tag.id,
    //task_id: task_tag.task_id,
    //tag_id: task_tag.tag_id,
    priority: task_tag.priority,
    task: {
      connect: { task_id: task_tag.task_id },
    },
    tag: {
      connect: { id: task_tag.tag_id },
    },
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
