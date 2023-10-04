// // See:
// // https://www.prisma.io/docs/getting-started/quickstart
import { PrismaClient, Roles } from '@prisma/client';
import { initialize, defineUserFactory, defineKeyFactory, defineTaskFactory } from './.fabbrica';
import { generateLuciaPasswordHash } from 'lucia/utils';

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

// See:
// https://github.com/TeemuKoivisto/sveltekit-monorepo-template/blob/main/packages/db/prisma/seed.ts
// https://lucia-auth.com/basics/keys/#password-hashing
// https://datatracker.ietf.org/doc/html/rfc7914#page-3
async function main() {
  const userFactory = defineUserFactory();
  const keyFactory = defineKeyFactory({ defaultData: { user: userFactory } });

  users.map(async (user) => {
    const password = 'Ch0kuda1';
    // TODO: 既にDBに存在する場合は追加しないようにしましょう
    await addUser(user, password, userFactory, keyFactory);
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
