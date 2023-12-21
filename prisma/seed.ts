// // See:
// // https://www.prisma.io/docs/getting-started/quickstart
import { PrismaClient } from '@prisma/client';
import {
  initialize,
  defineUserFactory,
  defineKeyFactory,
  defineTaskFactory,
  defineTagFactory,
  defineTaskTagFactory,
  defineTaskAnswerFactory,
  defineSubmissionStatusFactory,
} from '../src/lib/server/__generated__/fabbrica';
import { generateLuciaPasswordHash } from 'lucia/utils';

import { classifyContest } from '../src/lib/utils/contest';

import { users } from './users';
import { tasks } from './tasks';
import { tags } from './tags';
import { task_tags } from './task_tags';
import { answers } from './answers';
import { submission_statuses } from './submission_statuses';
// import { tasks } from './tasks_for_production';

const prisma = new PrismaClient();
initialize({ prisma });

// See:
// https://github.com/TeemuKoivisto/sveltekit-monorepo-template/blob/main/packages/db/prisma/seed.ts
// https://lucia-auth.com/basics/keys/#password-hashing
// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
async function main() {
  addUsers();
  addTasks();
  addTags();
  addTaskTags();
  addSubmissionStatuses();
  addAnswers();
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
    id: user.id,
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
      //console.log('task id:', task.id, 'has already been registered.');
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
      //console.log('tag id:', tag.id, 'has already been registered.');
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
      //console.log(
      //  'tag id:',
      //  task_tag.tag_id,
      //  'task id:',
      //  task_tag.task_id,
      //  'has already been registered.',
      //);
    } else if (registeredTag.length !== 1 || registeredTask.length !== 1) {
      //console.log('tag id:', task_tag.tag_id, ' or task id:', task_tag.task_id, 'is missing.');
    }
  });
}
async function addTaskTag(task_tag, taskTagFactory) {
  await taskTagFactory.create({
    id: task_tag.id,
    priority: task_tag.priority,
    task: {
      connect: { task_id: task_tag.task_id },
    },
    tag: {
      connect: { id: task_tag.tag_id },
    },
  });
}

//insert data to submission_status table
async function addSubmissionStatuses() {
  const submissionStatusFactory = defineSubmissionStatusFactory();

  submission_statuses.map(async (submission_status) => {
    const registeredSubmissionStatus = await prisma.submissionStatus.findMany({
      where: {
        id: submission_status.id,
      },
    });

    if (registeredSubmissionStatus.length === 0) {
      console.log('submission_status id:', submission_status.id, 'was registered.');
      await addSubmissionStatus(submission_status, submissionStatusFactory);
    } else {
      //console.log('tag id:', tag.id, 'has already been registered.');
    }
  });
}

async function addSubmissionStatus(submission_status, submissionStatusFactory) {
  await submissionStatusFactory.create({
    id: submission_status.id,
    status_name: submission_status.status_name,
    label_name: submission_status.label_name,
    image_path: submission_status.image_path,
    button_color: submission_status.button_color,
    is_AC: submission_status.is_AC,
  });
}

//insert data to answer table
async function addAnswers() {
  const answerFactory = defineTaskAnswerFactory();

  answers.map(async (answer) => {
    const registeredAnswer = await prisma.taskAnswer.findMany({
      where: {
        id: answer.id,
      },
    });

    const registeredUser = await prisma.user.findMany({
      where: {
        id: answer.user_id,
      },
    });

    if (registeredAnswer.length === 0 && registeredUser.length === 1) {
      console.log('answer id:', answer.id, 'was registered.');
      await addAnswer(answer, answerFactory);
    } else {
      console.log(
        'answer len:',
        registeredAnswer.length,
        'user len:',
        registeredUser.length,
        answer.id,
        'was not registered.',
      );
    }
  });
}

async function addAnswer(answer, taskAnswerFactory) {
  await taskAnswerFactory.create({
    id: answer.id,
    //task_id: answer.task_id,
    task: {
      connect: { task_id: answer.task_id },
    },
    //username: answer.username,
    user: {
      connect: { id: answer.user_id },
    },
    status: {
      connect: { id: answer.status_id },
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
