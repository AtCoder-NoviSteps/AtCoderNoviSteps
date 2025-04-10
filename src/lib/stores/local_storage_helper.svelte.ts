// See:
// https://svelte.dev/docs/kit/$app-environment#browser
import { browser } from '$app/environment';

export function useLocalStorage<T>(key: string, initialValue: T) {
  return new LocalStorageWrapper<T>(key, initialValue);
}

/**
 * A type-safe wrapper for interacting with localStorage.
 *
 * This class provides a convenient way to store and retrieve typed data from localStorage
 * with automatic JSON serialization/deserialization. It gracefully handles server-side
 * rendering environments where localStorage is not available.
 *
 * @template T The type of value being stored
 *
 * @example
 * ```typescript
 * // Create a wrapper for a user settings object
 * const userSettings = new LocalStorageWrapper<UserSettings>('user_settings', defaultSettings);
 *
 * // Read the current value
 * const currentSettings = userSettings.value;
 *
 * // Update the value (automatically persists to localStorage)
 * userSettings.value = { ...currentSettings, theme: 'dark' };
 * ```
 */
class LocalStorageWrapper<T> {
  private _value: T;
  private key: string;

  constructor(key: string, initialValue: T) {
    this.key = key;
    this._value = this.getInitialValue(initialValue);
  }

  private getInitialValue(defaultValue: T): T {
    // WHY: Cannot access localStorage during SSR (server-side rendering).
    if (!browser) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(this.key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to parse ${this.key} from local storage:`, error);
      return defaultValue;
    }
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;

    if (browser) {
      localStorage.setItem(this.key, JSON.stringify(newValue));
    }
  }
}
