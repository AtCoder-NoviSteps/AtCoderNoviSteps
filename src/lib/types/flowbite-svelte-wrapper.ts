// Extract ButtonColor from ButtonProps (Flowbite Svelte exports ButtonProps)
import type { ButtonProps } from 'flowbite-svelte';

/**
 * Valid color variants for Flowbite Svelte button component.
 */
export type ButtonColor = NonNullable<ButtonProps['color']>;
