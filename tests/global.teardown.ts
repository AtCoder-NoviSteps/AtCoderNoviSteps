// // See:
// // https://www.prisma.io/docs/getting-started/quickstart
import { PrismaClient } from '@prisma/client';
import { initialize } from '../prisma/.fabbrica';
//import { generateLuciaPasswordHash } from 'lucia/utils';

//import { classifyContest } from '../src/lib/utils/contest';

import { users } from '../prisma/users_for_test';
//import { tasks } from '../prisma/tasks';
//import { tags } from '../prisma/tags';
//import { task_tags } from '../prisma/task_tags';
// import { tasks } from './tasks_for_production';

const prisma = new PrismaClient();
initialize({ prisma });

// See:
// https://github.com/TeemuKoivisto/sveltekit-monorepo-template/blob/main/packages/db/prisma/seed.ts
// https://lucia-auth.com/basics/keys/#password-hashing
// https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#findunique
async function main() {
  deleteUsers();
}

function deleteUsers() {
  users.map(async (user) => {
    const registeredUser = await prisma.user.findUnique({
      where: {
        username: user.name,
      },
    });

    if (!registeredUser) {
      console.log('username:', user.name, 'is not found.');
    } else {
      await deleteUser(user);
      console.log('username:', user.name, 'was deleted.');
    }
  });
}

// See:
// https://lucia-auth.com/reference/lucia/modules/utils/#generateluciapasswordhash
async function deleteUser(user) {
  //await prisma.key.delete({
  //  where: {
  //  id: 'username:' + user.name.toLocaleLowerCase(),
  //  }
  //});

  await prisma.user.delete({
    where: {
      username: user.name,
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
