import type { User } from '@prisma/client';

import type { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';
import type { FloatingMessages } from '$lib/types/floating_message';

import { isAdmin } from '$lib/utils/authorship';

export function validateUserAndAnswers(
  user: User,
  answers: Map<string, TaskResult>,
  expectedToHaveAnswers: boolean,
  messages: FloatingMessages,
) {
  if (isAdminUser(user, messages)) {
    return false;
  }

  if (expectedToHaveAnswers) {
    return validateUserAnswersExistence(user, answers, expectedToHaveAnswers, messages);
  } else {
    return !validateUserAnswersExistence(user, answers, expectedToHaveAnswers, messages);
  }
}

export function isExistingUser(
  userName: string,
  user: User | null,
  messages: FloatingMessages,
): boolean {
  if (user === null) {
    addMessage(messages, `${userName} が存在しません。コピーを中止します`, false);
    return false;
  } else {
    addMessage(messages, `${userName} が存在することを確認しました`, true);
    return true;
  }
}

export function isAdminUser(user: User | null, messages: FloatingMessages): boolean {
  if (user === null) {
    return false;
  }

  if (user.role && isAdmin(user.role as Roles)) {
    addMessage(
      messages,
      `${user.username} は管理者権限をもっているためコピーできません。コピーを中止します`,
      false,
    );

    return true;
  }

  return false;
}

export function validateUserAnswersExistence(
  user: User,
  answers: Map<string, TaskResult>,
  expectedToHaveAnswers: boolean,
  messages: FloatingMessages,
): boolean {
  const hasAnswers = answers.size > 0;

  if (hasAnswers !== expectedToHaveAnswers) {
    addMessage(
      messages,
      expectedToHaveAnswers
        ? `${user.username} にコピー対象のデータがありません。コピーを中止します`
        : `${user.username} にすでにデータがあります。コピーを中止します`,
      false,
    );

    return !expectedToHaveAnswers;
  }

  return expectedToHaveAnswers;
}

export function addMessage(messages: FloatingMessages, message: string, status: boolean) {
  messages.push({ message, status });
}
