import { redirect } from '@sveltejs/kit';

import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';

import { TEMPORARY_REDIRECT, SEE_OTHER } from '$lib/constants/http-response-status-codes';
import { HOME_PAGE } from '$lib/constants/navbar-links';
import { authSchema } from '$lib/zod/schema';
import { Roles } from '$lib/types/user';

/**
 * Initialize authentication form pages (login/signup)
 * Redirects to home page if already logged in,
 * otherwise initializes the authentication form for unauthenticated users
 */
export const initializeAuthForm = async (locals: App.Locals) => {
  const session = await locals.auth.validate();

  if (session) {
    redirect(SEE_OTHER, HOME_PAGE);
  }

  return await createAuthFormWithFallback();
};

/**
 * Create authentication form with comprehensive fallback handling
 * Tries multiple strategies until one succeeds
 */
const createAuthFormWithFallback = async () => {
  for (const strategy of formCreationStrategies) {
    try {
      const result = await strategy.run();
      console.log(`Success: ${strategy.name}`);

      return result;
    } catch (error) {
      console.warn(`Failed to ${strategy.name}`);

      if (error instanceof Error) {
        console.warn('Error:', error.message);
      }
    }
  }

  // This should never be reached due to manual creation strategy
  throw new Error('Failed to create form for authentication.');
};

/**
 * Form creation strategies in order of preference
 * Each strategy attempts a different approach to create a valid form
 *
 * See:
 * https://superforms.rocks/concepts/client-validation
 * https://superforms.rocks/api#supervalidate-options
 */
const formCreationStrategies = [
  {
    name: '(Basic case) Use standard superValidate',
    async run() {
      const form = await superValidate(null, zod(authSchema));
      return { form: { ...form, message: '' } };
    },
  },
  {
    name: 'Use zod adapter explicitly',
    async run() {
      const zodAdapter = zod(authSchema);
      const form = await superValidate(null, zodAdapter);
      return { form: { ...form, message: '' } };
    },
  },
  {
    name: 'Create form by manually defining structure',
    async run() {
      const defaultForm = {
        valid: true,
        posted: false,
        errors: {},
        message: '',
        ...createBaseAuthForm(),
      };

      return { form: { ...defaultForm, message: '' } };
    },
  },
];

/**
 * Validate authentication form data with comprehensive fallback handling
 * Tries multiple strategies until one succeeds
 *
 * @param request - The incoming request containing form data
 * @returns Object containing success status and either form or errorResponse
 */
export const validateAuthFormWithFallback = async (request: Request) => {
  for (const strategy of formValidationStrategies) {
    try {
      const result = await strategy.run(request);
      console.log(`${strategy.name} successful`);

      return result.form;
    } catch (error) {
      console.warn(`Failed to ${strategy.name}`);

      if (error instanceof Error) {
        console.warn('Error:', error.message);
      }
    }
  }

  // This should never be reached due to fallback strategy
  throw new Error('Failed to validate form for authentication.');
};

/**
 * Form validation strategies for action handlers
 * Each strategy attempts a different approach to validate form data from requests
 */
const formValidationStrategies = [
  {
    name: '(Basic Case) Use standard superValidate with request',
    async run(request: Request) {
      const form = await superValidate(request, zod(authSchema));
      return { form: { ...form, message: '' } };
    },
  },
  {
    name: 'Use zod adapter explicitly with request',
    async run(request: Request) {
      const zodAdapter = zod(authSchema);
      const form = await superValidate(request, zodAdapter);
      return { form: { ...form, message: '' } };
    },
  },
  {
    name: 'Create fallback form manually',
    async run(request: Request) {
      // Create a fallback form with error state
      // This maintains consistency with other strategies by returning { form }
      const fallbackForm = {
        valid: false,
        posted: true,
        errors: { _form: ['ログインできませんでした。'] },
        message: 'サーバでエラーが発生しました。本サービスの開発・運営チームまでご連絡ください。',
        ...createBaseAuthForm(),
      };

      return { form: { ...fallbackForm, message: '' } };
    },
  },
];

/**
 * Common form structure for authentication forms
 * Contains constraints and shape definitions used across different form strategies
 */
const createBaseAuthForm = () => ({
  id: 'error-fallback-form-' + Date.now(), // Note: Use only client-side validation
  data: { username: '', password: '' },
  constraints: {
    username: { minlength: 3, maxlength: 24, required: true, pattern: '[\\w]*' },
    password: {
      minlength: 8,
      maxlength: 128,
      required: true,
      pattern: '(?=.*?[a-z])(?=.*?[A-Z])(?=.*?\\d)[a-zA-Z\\d]{8,128}',
    },
  },
  // [Workaround] Critical fix for production environment schema shape error
  // SuperForms requires a 'shape' property for internal form structure validation
  // In production builds, Zod schema internals may be optimized away, causing
  // "SchemaError: No shape could be created for schema" errors
  //
  // See:
  // SuperForms source - schemaShape() function in adapters/zod.ts
  // https://github.com/ciscoheat/sveltekit-superforms/issues/594
  shape: {
    username: { type: 'string' },
    password: { type: 'string' },
  },
});

export const ensureSessionOrRedirect = async (locals: App.Locals): Promise<void> => {
  const session = await locals.auth.validate();

  if (!session) {
    throw redirect(TEMPORARY_REDIRECT, '/login');
  }
};

export const getLoggedInUser = async (locals: App.Locals): Promise<App.Locals['user'] | null> => {
  await ensureSessionOrRedirect(locals);
  const loggedInUser = locals.user;

  if (!loggedInUser) {
    throw redirect(TEMPORARY_REDIRECT, '/login');
  }

  return loggedInUser;
};

export const isAdmin = (role: Roles): boolean => {
  return role === Roles.ADMIN;
};

export const hasAuthority = (userId: string, authorId: string): boolean => {
  return userId.toLocaleLowerCase() === authorId.toLocaleLowerCase();
};

// Note: 公開 + 非公開(本人のみ)の問題集が閲覧できる
export const canRead = (isPublished: boolean, userId: string, authorId: string): boolean => {
  return isPublished || hasAuthority(userId, authorId);
};

// Note: 特例として、管理者はユーザが公開している問題集を編集できる
export const canEdit = (
  userId: string,
  authorId: string,
  role: Roles,
  isPublished: boolean,
): boolean => {
  return hasAuthority(userId, authorId) || (isAdmin(role) && isPublished);
};

// Note: 本人のみ削除可能
export const canDelete = (userId: string, authorId: string): boolean => {
  return hasAuthority(userId, authorId);
};
