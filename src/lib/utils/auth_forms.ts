import { redirect } from '@sveltejs/kit';

import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';

import type {
  AuthForm,
  AuthFormCreationStrategies,
  AuthFormValidationStrategies,
} from '$lib/types/auth_forms';

import { authSchema } from '$lib/zod/schema';
import { SEE_OTHER } from '$lib/constants/http-response-status-codes';
import { HOME_PAGE } from '$lib/constants/navbar-links';

/**
 * Initialize authentication form pages (login/signup)
 * Redirects to home page if already logged in,
 * otherwise initializes the authentication form for unauthenticated users
 * @param locals - The application locals containing authentication state
 * @returns { form: AuthForm } - The initialized authentication form
 */
export const initializeAuthForm = async (locals: App.Locals): Promise<{ form: AuthForm }> => {
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
export const createAuthFormWithFallback = async (): Promise<{ form: AuthForm }> => {
  for (const strategy of formCreationStrategies) {
    try {
      const result = await strategy.run();

      return result;
    } catch (error) {
      if (isDevelopmentMode()) {
        console.warn(`Create authForm strategy: Failed to ${strategy.name}`);
        console.warn(error instanceof Error ? (error.stack ?? error.message) : error);
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
 * https://superforms.rocks/migration-v2#supervalidate
 * https://superforms.rocks/concepts/client-validation
 * https://superforms.rocks/api#supervalidate-options
 */
const formCreationStrategies: AuthFormCreationStrategies = [
  {
    name: '(Basic case) Use standard superValidate',
    async run() {
      const form = await superValidate(zod4(authSchema));
      return { form: { ...form, message: '' } };
    },
  },
  {
    name: 'Create form by manually defining structure',
    async run() {
      const defaultForm = {
        valid: false,
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
 * @returns The validated form object (bare form, suitable for actions: fail(..., { form }))
 */
export const validateAuthFormWithFallback = async (request: Request): Promise<AuthForm> => {
  for (const strategy of formValidationStrategies) {
    try {
      const result = await strategy.run(request);

      return result.form;
    } catch (error) {
      if (isDevelopmentMode()) {
        console.warn(`Validate authForm strategy: Failed to ${strategy.name}`);
        console.warn(error instanceof Error ? (error.stack ?? error.message) : error);
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
const formValidationStrategies: AuthFormValidationStrategies = [
  {
    name: '(Basic Case) Use standard superValidate with request',
    async run(request: Request) {
      const form = await superValidate(request, zod4(authSchema));
      return { form: { ...form, message: '' } };
    },
  },
  {
    name: 'Create fallback form manually',
    async run(_request: Request) {
      // Create a fallback form with error state
      // This maintains consistency with other strategies by returning { form }
      const fallbackForm = {
        valid: false,
        posted: true,
        errors: { _form: ['ログインできませんでした。'] },
        message: 'サーバでエラーが発生しました。本サービスの開発・運営チームまでご連絡ください。',
        ...createBaseAuthForm(),
      };

      return { form: fallbackForm };
    },
  },
];

/**
 * Helper function to validate if we're in development mode
 * This can be mocked in tests to control logging behavior
 */
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Common form structure for authentication forms
 * Contains constraints and shape definitions used across different form strategies
 */
const createBaseAuthForm = () => ({
  id: getBaseAuthFormId(),
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
  shape: {
    username: { type: 'string' },
    password: { type: 'string' },
  },
});

/**
 * Generates a unique identifier for authentication form elements.
 *
 * Uses Web Crypto API's randomUUID() when available, falling back to a
 * timestamp-based random string for environments where crypto is unavailable.
 *
 * @returns A unique string identifier prefixed with 'error-fallback-form-'
 *
 * @example
 * ```typescript
 * const formId = getBaseAuthFormId();
 * // Returns: "error-fallback-form-550e8400-e29b-41d4-a716-446655440000"
 * // or: "error-fallback-form-1703875200000-abc123def"
 * ```
 */
const getBaseAuthFormId = () => {
  return (
    'error-fallback-form-' +
    (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
  ); // Fallback when Web Crypto is unavailable
};
