import { default as db } from '$lib/server/database';

export async function getUser(username: string) {
  const user = await db.user.findUnique({
    where: {
      username: username,
    },
  });
  return user;
}
