/**
 * This script seeds the database with initial data.
 * Run this script using `pnpm db:seed`.
 */

// See:
// https://www.prisma.io/docs/getting-started/quickstart
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
  defineWorkBookFactory,
} from './.fabbrica';
import PQueue from 'p-queue';
import { generateLuciaPasswordHash } from 'lucia/utils';

import { classifyContest } from '../src/lib/utils/contest';

import { users } from './users';
import { tasks } from './tasks';
import { workbooks } from './workbooks';
import { tags } from './tags';
import { task_tags } from './task_tags';
import { answers } from './answers';
import { submission_statuses } from './submission_statuses';
//import { tasks } from './tasks_for_production';

const prisma = new PrismaClient();
initialize({ prisma });

// See:
// https://github.com/TeemuKoivisto/sveltekit-monorepo-template/blob/main/packages/db/prisma/seed.ts
// https://lucia-auth.com/basics/keys/#password-hashing
// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
// https://github.com/sindresorhus/p-queue
async function main() {
  try {
    console.log('Seeding has been started.');

    // Create a queue to ensure sequential execution
    const mainQueue = new PQueue({ concurrency: 1 });

    await mainQueue.add(() => addUsers());
    await mainQueue.add(() => addTasks());
    await mainQueue.add(() => addWorkBooks());
    await mainQueue.add(() => addTags());
    await mainQueue.add(() => addTaskTags());
    await mainQueue.add(() => addSubmissionStatuses());
    await mainQueue.add(() => addAnswers());

    console.log('Seeding has been completed.');
  } catch (e) {
    console.error('Failed to seeding:', e);
    throw e;
  }
}

async function addUsers() {
  console.log('Start adding users...');

  const userFactory = defineUserFactory();
  const keyFactory = defineKeyFactory({ defaultData: { user: userFactory } });

  // Create a queue with limited concurrency for user operations
  const userQueue = new PQueue({ concurrency: 2 });

  users.map((user) =>
    userQueue.add(async () => {
      try {
        const password = 'Ch0kuda1';
        const registeredUser = await prisma.user.findUnique({
          where: {
            username: user.name,
          },
        });

        if (!registeredUser) {
          await addUser(user, password, userFactory, keyFactory);
          console.log('username:', user.name, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add user', user.name, e);
      }
    }),
  );

  await userQueue.onIdle(); // Wait for all users to complete
  console.log('Finished adding users.');
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

async function addTasks() {
  console.log('Start adding tasks...');

  const taskFactory = defineTaskFactory();

  // Create a queue with limited concurrency for database operations
  const taskQueue = new PQueue({ concurrency: 3 });

  tasks.map((task) =>
    taskQueue.add(async () => {
      try {
        const registeredTask = await prisma.task.findUnique({
          where: {
            task_id: task.id,
          },
        });
        const registeredTaskTag = await prisma.taskTag.findMany({
          where: {
            task_id: task.id,
          },
        });

        if (!registeredTask) {
          await addTask(task, taskFactory, registeredTaskTag.length !== 0);
          console.log('task id:', task.id, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add task', task.id, e);
      }
    }),
  );

  await taskQueue.onIdle(); // Wait for all tasks to complete
  console.log('Finished adding tasks.');
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

async function addWorkBooks() {
  console.log('Start adding workbooks...');

  const userFactory = defineUserFactory();
  const workBookFactory = defineWorkBookFactory({ defaultData: { user: userFactory } });

  // Note: Use a for loop to ensure each workbook is processed sequentially.
  for (const workbook of workbooks) {
    try {
      const author = await prisma.user.findUnique({
        where: {
          id: workbook.authorId,
        },
      });

      const normalizedUrlSlug = normalizeUrlSlug(workbook.urlSlug);
      // Validate for existing workbook using appropriate criteria
      let registeredWorkBook;

      if (normalizedUrlSlug) {
        // If urlSlug exists, check by urlSlug
        registeredWorkBook = await prisma.workBook.findMany({
          where: {
            urlSlug: normalizedUrlSlug,
          },
        });
      } else {
        // If no urlSlug, check by title and authorId to avoid duplicates
        registeredWorkBook = await prisma.workBook.findMany({
          where: {
            title: workbook.title,
            authorId: workbook.authorId,
          },
        });
      }

      if (!author) {
        console.warn('Not found author id: ', workbook.authorId, '.');
      } else if (registeredWorkBook.length >= 1) {
        if (normalizedUrlSlug) {
          console.warn('Url slug ', workbook.urlSlug, ' has already been registered.');
        } else {
          console.warn(
            'Workbook title "',
            workbook.title,
            '" by author',
            workbook.authorId,
            'has already been registered.',
          );
        }
      } else {
        await addWorkBook(workbook, workBookFactory);
        console.log('workbook title:', workbook.title, 'was registered.');
      }
    } catch (e) {
      console.error('Failed to add workbook', workbook.title, e);
    }
  }

  console.log('Finished adding workbooks.');
}

async function addWorkBook(workbook, workBookFactory) {
  const urlSlug = normalizeUrlSlug(workbook.urlSlug);

  await workBookFactory.create({
    user: {
      connect: { id: workbook.authorId },
    },
    title: workbook.title,
    description: workbook.description,
    editorialUrl: workbook.editorialUrl,
    isPublished: workbook.isPublished,
    isOfficial: workbook.isOfficial,
    isReplenished: workbook.isReplenished,
    workBookType: workbook.workBookType,
    urlSlug: urlSlug,
    workBookTasks: {
      create: workbook.workBookTasks,
    },
  });
}

/**
 * Normalizes a URL slug by converting empty strings and null values to undefined.
 *
 * @param urlSlug - The URL slug to normalize. Can be a string, null, or undefined.
 * @returns The normalized URL slug as a string if it has content, otherwise undefined.
 *
 * @example
 * ```typescript
 * normalizeUrlSlug("union-find") // returns "union-find"
 * normalizeUrlSlug("") // returns undefined
 * normalizeUrlSlug(null) // returns undefined
 * normalizeUrlSlug(undefined) // returns undefined
 * ```
 */
function normalizeUrlSlug(urlSlug: string | null | undefined): string | undefined {
  return urlSlug && urlSlug !== '' ? urlSlug.toLocaleLowerCase() : undefined;
}

async function addTags() {
  console.log('Start adding tags...');

  const tagFactory = defineTagFactory();

  // Create a queue with limited concurrency for tag operations
  const tagQueue = new PQueue({ concurrency: 2 });

  tags.map((tag) =>
    tagQueue.add(async () => {
      try {
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
        }
      } catch (e) {
        console.error('Failed to add tag', tag.id, e);
      }
    }),
  );

  await tagQueue.onIdle(); // Wait for all tags to complete
  console.log('Finished adding tags.');
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
  console.log('Start adding task tags...');

  const taskFactory = defineTaskFactory();
  const tagFactory = defineTagFactory();
  const taskTagFactory = defineTaskTagFactory({
    defaultData: { task: taskFactory, tag: tagFactory },
  });

  // Create a queue with limited concurrency for task tag operations
  const taskTagQueue = new PQueue({ concurrency: 2 });

  task_tags.map((task_tag) =>
    taskTagQueue.add(async () => {
      try {
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
          await addTaskTag(task_tag, taskTagFactory);
          console.log('tag id:', task_tag.tag_id, 'task_id:', task_tag.task_id, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add task tag', task_tag, e);
      }
    }),
  );

  await taskTagQueue.onIdle(); // Wait for all task tags to complete
  console.log('Finished adding task tags.');
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

// Add data to submission_status table
async function addSubmissionStatuses() {
  console.log('Start adding submission statuses...');

  const submissionStatusFactory = defineSubmissionStatusFactory();

  // Create a queue with limited concurrency for submission status operations
  const submissionStatusQueue = new PQueue({ concurrency: 2 });

  submission_statuses.map((submission_status) =>
    submissionStatusQueue.add(async () => {
      try {
        const registeredSubmissionStatus = await prisma.submissionStatus.findMany({
          where: {
            id: submission_status.id,
          },
        });

        if (registeredSubmissionStatus.length === 0) {
          await addSubmissionStatus(submission_status, submissionStatusFactory);
          console.log('submission_status id:', submission_status.id, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add submission status', submission_status.id, e);
      }
    }),
  );

  await submissionStatusQueue.onIdle(); // Wait for all submission statuses to complete
  console.log('Finished adding submission statuses.');
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

// Add data to answer table
async function addAnswers() {
  console.log('Start adding answers...');

  const answerFactory = defineTaskAnswerFactory();

  // Create a queue with limited concurrency for answer operations
  const answerQueue = new PQueue({ concurrency: 2 });

  answers.map((answer) =>
    answerQueue.add(async () => {
      try {
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
          await addAnswer(answer, answerFactory);
          console.log('answer id:', answer.id, 'was registered.');
        } else {
          console.warn(
            'answer len:',
            registeredAnswer.length,
            'user len:',
            registeredUser.length,
            answer.id,
            'was not registered.',
          );
        }
      } catch (e) {
        console.error('Failed to add answer', answer.id, e);
      }
    }),
  );

  await answerQueue.onIdle(); // Wait for all answers to complete
  console.log('Finished adding answers.');
}

async function addAnswer(answer, taskAnswerFactory) {
  await taskAnswerFactory.create({
    id: answer.id,
    task: {
      connect: { task_id: answer.task_id },
    },
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
