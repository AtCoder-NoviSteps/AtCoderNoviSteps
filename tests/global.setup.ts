// // See:
// // https://www.prisma.io/docs/getting-started/quickstart
import { PrismaClient } from '@prisma/client';
import { initialize, defineUserFactory, defineKeyFactory } from '../prisma/.fabbrica';
import { generateLuciaPasswordHash } from 'lucia/utils';

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
  addUsers();
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

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
