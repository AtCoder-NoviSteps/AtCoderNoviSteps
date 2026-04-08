// Extract ButtonColor from ButtonProps (Flowbite Svelte exports ButtonProps)
import type { ButtonProps } from 'flowbite-svelte';

// Get the color type from ButtonProps
export type ButtonColor = NonNullable<ButtonProps['color']>;
