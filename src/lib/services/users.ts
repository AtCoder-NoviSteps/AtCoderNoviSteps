import { default as db } from '$lib/server/database';
import type { User } from '@prisma/client';

export async function getUser(username: string) {
  const user = await db.user.findUnique({
    where: {
      username: username,
    },
  });
  return user;
}

export async function getUserById(userId: string) {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });
  return user;
}

export async function deleteUser(username: string) {
  const user = await db.user.delete({
    where: {
      username: username,
    },
  });
  return user;
}

export async function updateValicationCode(
  username: string,
  atcoder_id: string,
  validationCode: string,
) {
  try {
    const user: User | null = await db.user.update({
      where: {
        username: username,
      },

      data: {
        atcoder_validation_code: validationCode,
        atcoder_username: atcoder_id,
      },
    });

    return user;
  } catch {
    console.log('user update error');
  }
}
