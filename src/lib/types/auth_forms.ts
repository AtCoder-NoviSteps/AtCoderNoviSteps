/**
 * Defines validation constraints that can be applied to form fields.
 *
 * @interface FieldConstraints
 * @property {number} [minlength] - Minimum number of characters required for the field value
 * @property {number} [maxlength] - Maximum number of characters allowed for the field value
 * @property {boolean} [required] - Whether the field is mandatory and must have a value
 * @property {string} [pattern] - Regular expression pattern that the field value must match
 */
export type FieldConstraints = {
  minlength?: number;
  maxlength?: number;
  required?: boolean;
  pattern?: string;
};

export type AuthFormConstraints = {
  username?: FieldConstraints;
  password?: FieldConstraints;
};

/**
 * Represents the state and data structure for authentication forms.
 *
 * @interface AuthForm
 * @property {string} id - Unique identifier for the form instance
 * @property {boolean} valid - Indicates whether the form data passes validation
 * @property {boolean} posted - Indicates whether the form has been submitted
 * @property {Object} data - The form input data
 * @property {string} data.username - The username field value
 * @property {string} data.password - The password field value
 * @property {Record<string, string[]>} errors - Collection of validation errors keyed by field name
 * @property {AuthFormConstraints} [constraints] - Optional validation constraints for the form
 * @property {Record<string, unknown>} [shape] - Optional form schema or structure definition
 * @property {string} message - General message associated with the form (success, error, etc.)
 */
export type AuthForm = {
  id: string;
  valid: boolean;
  posted: boolean;
  data: { username: string; password: string };
  errors: Record<string, string[]>;
  constraints?: AuthFormConstraints;
  shape?: Record<string, unknown>;
  message: string;
};

/**
 * Represents a strategy for creating authentication forms.
 *
 * @interface AuthFormCreationStrategy
 * @property {string} name - The unique identifier or display name for this creation strategy
 * @property {() => Promise<{ form: AuthForm }>} run - Asynchronous function that executes the strategy and returns the created authentication form
 */
export type AuthFormCreationStrategy = {
  name: string;
  run: () => Promise<{ form: AuthForm }>;
};

export type AuthFormCreationStrategies = AuthFormCreationStrategy[];

/**
 * Defines a validation strategy for authentication forms.
 *
 * A validation strategy encapsulates the logic for validating authentication
 * form data from HTTP requests and returning the processed form object.
 *
 * @example
 * ```typescript
 * const loginStrategy: AuthFormValidationStrategy = {
 *   name: 'login',
 *   run: async (request) => {
 *     // Validation logic here
 *     return { form: validatedForm };
 *   }
 * };
 * ```
 */
export type AuthFormValidationStrategy = {
  name: string;
  run: (request: Request) => Promise<{ form: AuthForm }>;
};

export type AuthFormValidationStrategies = AuthFormValidationStrategy[];
