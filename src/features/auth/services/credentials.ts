import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import client from '$lib/server/database';
import { hashPassword, verifyPassword } from '../server/password';
import { generateRandomString } from '../server/random';

const USER_ID_LENGTH = 15; // lucia v2 createUser default

const buildKeyId = (username: string): string => `username:${username.toLowerCase()}`;

/** Creates a user with a password key. Returns null when the username is already taken. */
export const registerUser = async (
  username: string,
  password: string,
): Promise<{ userId: string } | null> => {
  const userId = generateRandomString(USER_ID_LENGTH);
  const hashedPassword = await hashPassword(password);

  try {
    await client.$transaction([
      client.user.create({ data: { id: userId, username } }),
      client.key.create({
        data: { id: buildKeyId(username), user_id: userId, hashed_password: hashedPassword },
      }),
    ]);
  } catch (error) {
    // P2002 on user.username or key.id both mean the username is taken
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }

    throw error;
  }

  return { userId };
};

/** Returns the user id for valid credentials, or null (missing user and wrong password are indistinguishable). */
export const authenticateUser = async (
  username: string,
  password: string,
): Promise<{ userId: string } | null> => {
  const key = await client.key.findUnique({ where: { id: buildKeyId(username) } });

  if (!key || key.hashed_password === null) {
    return null;
  }

  const isValid = await verifyPassword(password, key.hashed_password);

  return isValid ? { userId: key.user_id } : null;
};
