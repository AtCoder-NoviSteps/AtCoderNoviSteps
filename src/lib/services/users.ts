import { default as db } from '$lib/server/database';

export async function getUser(username: string) {
  return await db.user.findUnique({
    where: { username },
    include: { atCoderAccount: true },
  });
}

export async function getUserById(userId: string) {
  return await db.user.findUnique({
    where: { id: userId },
    include: { atCoderAccount: true },
  });
}

export async function deleteUser(username: string) {
  return await db.user.delete({ where: { username } });
}
