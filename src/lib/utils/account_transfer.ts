import type { User } from '@prisma/client';

import type { Roles } from '$lib/types/user';
import type { TaskResult } from '$lib/types/task';
import type { FloatingMessages } from '$lib/types/floating_message';

import { sanitizeHTML } from '$lib/utils/html';
import { isAdmin } from '$lib/utils/authorship';

export function isSameUser(source: User, destination: User): boolean {
  return source.username.toLocaleLowerCase() === destination.username.toLocaleLowerCase();
}

export function validateUserAnswersTransferability(
  user: User,
  answers: Map<string, TaskResult>,
  expectedToHaveAnswers: boolean,
  messages: FloatingMessages,
): boolean {
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
  const sanitizedUserName = sanitizeHTML(userName);

  if (user === null) {
    addMessage(messages, `${sanitizedUserName} が存在しません。コピーを中止します`, false);
    return false;
  }

  addMessage(messages, `${sanitizedUserName} が存在することを確認しました`, true);
  return true;
}

export function isAdminUser(user: User | null, messages: FloatingMessages): boolean {
  if (user === null) {
    return false;
  }

  const sanitizedUserName = sanitizeHTML(user.username);

  if (user.role && isAdmin(user.role as Roles)) {
    addMessage(
      messages,
      `${sanitizedUserName} は管理者権限をもっているためコピーできません。コピーを中止します`,
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
  const userHasExistingAnswers = answers.size > 0;

  if (userHasExistingAnswers === expectedToHaveAnswers) {
    return expectedToHaveAnswers;
  }

  const sanitizedUserName = sanitizeHTML(user.username);

  addMessage(
    messages,
    expectedToHaveAnswers
      ? `${sanitizedUserName} にコピー対象のデータがありません。コピーを中止します`
      : `${sanitizedUserName} にすでにデータがあります。コピーを中止します`,
    false,
  );

  return !expectedToHaveAnswers;
}

export function addMessage(messages: FloatingMessages, message: string, status: boolean): void {
  messages.push({ message, status });
}
