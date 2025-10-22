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
  defineContestTaskPairFactory,
  defineTagFactory,
  defineTaskTagFactory,
  defineTaskAnswerFactory,
  defineSubmissionStatusFactory,
  defineWorkBookFactory,
} from './.fabbrica';
import PQueue from 'p-queue';
import { generateLuciaPasswordHash } from 'lucia/utils';

import { getTaskGrade } from '../src/lib/types/task';

import { classifyContest } from '../src/lib/utils/contest';

import { users, USER_PASSWORD_FOR_SEED } from './users';
import { tasks } from './tasks';
import { contest_task_pairs } from './contest_task_pairs';
import { workbooks } from './workbooks';
import { tags } from './tags';
import { task_tags } from './task_tags';
import { answers } from './answers';
import { submission_statuses } from './submission_statuses';
//import { tasks } from './tasks_for_production';

const prisma = new PrismaClient();
initialize({ prisma });

// Queue concurrency configuration
// Adjust these values based on your database connection limits and performance requirements
// Can be overridden via environment variables (e.g., SEED_USERS_CONCURRENCY=4)
const QUEUE_CONCURRENCY = {
  users: Number(process.env.SEED_USERS_CONCURRENCY) || 2, // User creation with password hashing (CPU intensive)
  tasks: Number(process.env.SEED_TASKS_CONCURRENCY) || 3, // Task creation (lightweight)
  contestTaskPairs: Number(process.env.SEED_CONTEST_TASK_PAIRS_CONCURRENCY) || 2, // ContestTaskPair creation (lightweight)
  tags: Number(process.env.SEED_TAGS_CONCURRENCY) || 2, // Tag creation (lightweight)
  taskTags: Number(process.env.SEED_TASK_TAGS_CONCURRENCY) || 2, // TaskTag relations (multiple validations)
  submissionStatuses: Number(process.env.SEED_SUBMISSION_STATUSES_CONCURRENCY) || 2, // SubmissionStatus creation (lightweight)
  answers: Number(process.env.SEED_ANSWERS_CONCURRENCY) || 2, // Answer creation (multiple validations)
} as const;

// See:
// https://github.com/TeemuKoivisto/sveltekit-monorepo-template/blob/main/packages/db/prisma/seed.ts
// https://lucia-auth.com/basics/keys/#password-hashing
// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
// https://github.com/sindresorhus/p-queue
async function main() {
  try {
    console.log('Seeding has been started.');

    await addUsers();
    await addTasks();
    await addContestTaskPairs();
    await addWorkBooks();
    await addTags();
    await addTaskTags();
    await addSubmissionStatuses();
    await addAnswers();

    console.log('Seeding has been completed.');
  } catch (e) {
    console.error('Failed to seed:', e);
    throw e;
  }
}

async function addUsers() {
  console.log('Start adding users...');

  const userFactory = defineUserFactory();
  const keyFactory = defineKeyFactory({ defaultData: { user: userFactory } });

  // Create a queue with limited concurrency for user operations
  const userQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.users });

  for (const user of users) {
    userQueue.add(async () => {
      try {
        const registeredUser = await prisma.user.findUnique({
          where: {
            username: user.name,
          },
        });

        if (!registeredUser) {
          await addUser(user, USER_PASSWORD_FOR_SEED, userFactory, keyFactory);
          console.log('username:', user.name, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add user', user.name, e);
      }
    });
  }

  await userQueue.onIdle(); // Wait for all users to complete
  console.log('Finished adding users.');
}

// See:
// https://lucia-auth.com/reference/lucia/modules/utils/#generateluciapasswordhash
async function addUser(
  user: (typeof users)[number],
  password: string,
  userFactory: ReturnType<typeof defineUserFactory>,
  keyFactory: ReturnType<typeof defineKeyFactory>,
) {
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
  const taskQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.tasks });

  for (const task of tasks) {
    taskQueue.add(async () => {
      try {
        const registeredTask = await prisma.task.findUnique({
          where: {
            task_id: task.id,
          },
        });

        if (!registeredTask) {
          await addTask(task, taskFactory);
          console.log('task id:', task.id, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add task', task.id, e);
      }
    });
  }

  await taskQueue.onIdle(); // Wait for all tasks to complete
  console.log('Finished adding tasks.');
}

async function addTask(
  task: (typeof tasks)[number],
  taskFactory: ReturnType<typeof defineTaskFactory>,
) {
  // Note: Task-Tag relationships are handled separately via TaskTag table
  await taskFactory.create({
    contest_type: classifyContest(task.contest_id),
    contest_id: task.contest_id,
    task_table_index: task.problem_index,
    task_id: task.id,
    title: task.title,
    grade: getTaskGrade(task.grade as string),
  });
}

async function addContestTaskPairs() {
  console.log('Start adding contest task pairs...');

  const contestTaskPairFactory = defineContestTaskPairFactory();

  // Create a queue with limited concurrency for contest task pair operations
  const contestTaskPairQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.contestTaskPairs });

  for (const pair of contest_task_pairs) {
    contestTaskPairQueue.add(async () => {
      try {
        const registeredPair = await prisma.contestTaskPair.findUnique({
          where: {
            contestId_taskId: {
              contestId: pair.contest_id,
              taskId: pair.problem_id,
            },
          },
        });

        if (!registeredPair) {
          await addContestTaskPair(pair, contestTaskPairFactory);
          console.log(
            'contest_id:',
            pair.contest_id,
            'problem_index:',
            pair.problem_index,
            'task_id:',
            pair.problem_id,
            'was registered.',
          );
        }
      } catch (e) {
        console.error('Failed to add contest task pair', pair, e);
      }
    });
  }

  await contestTaskPairQueue.onIdle(); // Wait for all contest task pairs to complete
  console.log('Finished adding contest task pairs.');
}

async function addContestTaskPair(
  pair: (typeof contest_task_pairs)[number],
  contestTaskPairFactory: ReturnType<typeof defineContestTaskPairFactory>,
) {
  await contestTaskPairFactory.create({
    contestId: pair.contest_id,
    taskTableIndex: pair.problem_index,
    taskId: pair.problem_id,
  });
}

async function addWorkBooks() {
  console.log('Start adding workbooks...');

  const workBookFactory = defineWorkBookFactory({ defaultData: { user: defineUserFactory() } });

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
        registeredWorkBook = await prisma.workBook.findUnique({
          where: {
            urlSlug: normalizedUrlSlug,
          },
        });
      } else {
        // If no urlSlug, check by title and authorId to avoid duplicates
        registeredWorkBook = await prisma.workBook.findFirst({
          where: {
            title: workbook.title,
            authorId: workbook.authorId,
          },
        });
      }

      if (!author) {
        console.warn('Not found author id: ', workbook.authorId, '.');
      } else if (registeredWorkBook) {
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

async function addWorkBook(
  workbook: (typeof workbooks)[number],
  workBookFactory: ReturnType<typeof defineWorkBookFactory>,
) {
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
  return urlSlug && urlSlug.trim() !== '' ? urlSlug.trim().toLowerCase() : undefined;
}

async function addTags() {
  console.log('Start adding tags...');

  const tagFactory = defineTagFactory();

  // Create a queue with limited concurrency for tag operations
  const tagQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.tags });

  for (const tag of tags) {
    tagQueue.add(async () => {
      try {
        const registeredTag = await prisma.tag.findUnique({
          where: {
            id: tag.id,
          },
        });

        if (!registeredTag) {
          await addTag(tag, tagFactory);
          console.log('tag id:', tag.id, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add tag', tag.id, e);
      }
    });
  }

  await tagQueue.onIdle(); // Wait for all tags to complete
  console.log('Finished adding tags.');
}

async function addTag(tag: (typeof tags)[number], tagFactory: ReturnType<typeof defineTagFactory>) {
  // Note: Tags and Tasks are connected via the TaskTag relationship table
  // which is handled separately in addTaskTags()
  await tagFactory.create({
    id: tag.id,
    name: tag.name,
    is_official: tag.is_official,
    is_published: tag.is_published,
  });
}

async function addTaskTags() {
  console.log('Start adding task tags...');

  const taskFactory = defineTaskFactory();
  const tagFactory = defineTagFactory();
  const taskTagFactory = defineTaskTagFactory({
    defaultData: { task: taskFactory, tag: tagFactory },
  });

  // Create a queue with limited concurrency for task tag operations
  const taskTagQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.taskTags });

  for (const task_tag of task_tags) {
    taskTagQueue.add(async () => {
      try {
        const [registeredTaskTag, registeredTask, registeredTag] = await Promise.all([
          prisma.taskTag.findUnique({
            where: {
              task_id_tag_id: {
                task_id: task_tag.task_id,
                tag_id: task_tag.tag_id,
              },
            },
          }),
          prisma.task.findUnique({
            where: {
              task_id: task_tag.task_id,
            },
          }),
          prisma.tag.findUnique({
            where: {
              id: task_tag.tag_id,
            },
          }),
        ]);

        if (!registeredTaskTag && registeredTag && registeredTask) {
          await addTaskTag(task_tag, taskTagFactory);
          console.log('tag id:', task_tag.tag_id, 'task_id:', task_tag.task_id, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add task tag', task_tag, e);
      }
    });
  }

  await taskTagQueue.onIdle(); // Wait for all task tags to complete
  console.log('Finished adding task tags.');
}
async function addTaskTag(
  task_tag: (typeof task_tags)[number],
  taskTagFactory: ReturnType<typeof defineTaskTagFactory>,
) {
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
  const submissionStatusQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.submissionStatuses });

  for (const submission_status of submission_statuses) {
    submissionStatusQueue.add(async () => {
      try {
        const registeredSubmissionStatus = await prisma.submissionStatus.findUnique({
          where: {
            id: submission_status.id,
          },
        });

        if (!registeredSubmissionStatus) {
          await addSubmissionStatus(submission_status, submissionStatusFactory);
          console.log('submission_status id:', submission_status.id, 'was registered.');
        }
      } catch (e) {
        console.error('Failed to add submission status', submission_status.id, e);
      }
    });
  }

  await submissionStatusQueue.onIdle(); // Wait for all submission statuses to complete
  console.log('Finished adding submission statuses.');
}

async function addSubmissionStatus(
  submission_status: (typeof submission_statuses)[number],
  submissionStatusFactory: ReturnType<typeof defineSubmissionStatusFactory>,
) {
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
  const answerQueue = new PQueue({ concurrency: QUEUE_CONCURRENCY.answers });

  for (const answer of answers) {
    answerQueue.add(async () => {
      try {
        const [registeredAnswer, registeredUser] = await Promise.all([
          prisma.taskAnswer.findUnique({
            where: {
              task_id_user_id: {
                task_id: answer.task_id,
                user_id: answer.user_id,
              },
            },
          }),
          prisma.user.findUnique({
            where: {
              id: answer.user_id,
            },
          }),
        ]);

        if (!registeredAnswer && registeredUser) {
          await addAnswer(answer, answerFactory);
          console.log('answer id:', answer.id, 'was registered.');
        } else {
          console.warn(
            'answer exists:',
            !!registeredAnswer,
            'user exists:',
            !!registeredUser,
            answer.id,
            'was not registered.',
          );
        }
      } catch (e) {
        console.error('Failed to add answer', answer.id, e);
      }
    });
  }

  await answerQueue.onIdle(); // Wait for all answers to complete
  console.log('Finished adding answers.');
}

async function addAnswer(
  answer: (typeof answers)[number],
  taskAnswerFactory: ReturnType<typeof defineTaskAnswerFactory>,
) {
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
