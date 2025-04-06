import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

const activeDropdownId: Writable<string | null> = writable<string | null>(null);

/**
 * A Svelte action that manages dropdown behavior for an HTML element.
 *
 * This action handles common dropdown interactions such as:
 * - Closing when clicking outside the dropdown
 * - Closing on page scroll
 * - Coordinating with other dropdowns to ensure only one is open at a time
 *
 * @param node - The HTML element that contains the dropdown
 * @param options - Configuration options for the dropdown behavior
 * @param options.dropdownId - Unique identifier for this dropdown
 * @param options.isOpen - Boolean indicating if the dropdown is currently open
 * @param options.closeDropdown - Function to call when the dropdown should close
 * @param options.onStatusChange - Optional callback that fires when dropdown open state changes
 *
 * @returns An object containing update and destroy methods (Svelte action interface)
 * @returns.update - Method to update the dropdown options
 * @returns.destroy - Cleanup method to remove event listeners
 *
 * @example
 * <div use:handleDropdownBehavior={{
 *   dropdownId: 'user-menu',
 *   isOpen: $isMenuOpen,
 *   closeDropdown: () => isMenuOpen.set(false),
 *   onStatusChange: (status) => console.log(`Menu is ${status ? 'open' : 'closed'}`)
 * }}>
 *   <!-- Dropdown content -->
 * </div>
 */
export function handleDropdownBehavior(
  node: HTMLElement,
  options: {
    dropdownId: string;
    isOpen: boolean;
    closeDropdown: () => void;
    onStatusChange?: (status: boolean) => void;
  },
) {
  if (!browser) {
    return {
      update: () => {},
      destroy: () => {},
    };
  }

  let ignoreNextClick = false;

  // Close the dropdown on scroll.
  const handleScroll = () => {
    if (options.isOpen) {
      options.closeDropdown();
    }
  };

  // Close the dropdown when clicking outside of it.
  const handleWindowClick = (event: MouseEvent) => {
    if (ignoreNextClick) {
      ignoreNextClick = false;
      return;
    }

    if (options.isOpen && !node.contains(event.target as Node)) {
      options.closeDropdown();
    }
  };

  // Close the dropdown if another one is opened.
  const unsubscribe = activeDropdownId.subscribe((id) => {
    if (id && id !== options.dropdownId && options.isOpen) {
      options.closeDropdown();
    }
  });

  window.addEventListener('click', handleWindowClick);
  window.addEventListener('scroll', handleScroll, { passive: true });

  return {
    update(newOptions: {
      dropdownId: string;
      isOpen: boolean;
      closeDropdown: () => void;
      onStatusChange?: (status: boolean) => void;
    }) {
      Object.assign(options, newOptions);
    },

    destroy() {
      if (browser) {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('click', handleWindowClick);
        unsubscribe();
      }
    },
  };
}

/**
 * Calculates the position for a dropdown menu based on the event's target element.
 *
 * @param event - The mouse event that triggered the dropdown
 * @returns An object containing:
 *   - x: The horizontal position (right edge of the element)
 *   - y: The vertical position (bottom edge of the element)
 *   - isLower: Boolean indicating whether the element is in the lower half of the viewport
 */
export function calculateDropdownPosition(event: MouseEvent): {
  x: number;
  y: number;
  isLower: boolean;
} {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  return {
    x: rect.right,
    y: rect.bottom,
    isLower: rect.top > window.innerHeight / 2,
  };
}

/**
 * Toggles a dropdown menu's visibility state and manages its active status.
 *
 * @param event - The mouse event that triggered the dropdown toggle. If undefined, the dropdown
 *                is toggled without position calculations or stopping event propagation.
 * @param options - Configuration options for the dropdown toggle operation
 * @param options.dropdownId - Unique identifier for the dropdown being toggled
 * @param options.toggle - Callback function that handles the actual toggling of the dropdown state
 * @param options.getPosition - Optional callback to calculate and set dropdown position based on the mouse event
 *
 * @remarks
 * This function handles several aspects of dropdown management:
 * - Stops event propagation if an event is provided
 * - Optionally positions the dropdown based on mouse coordinates
 * - Updates the currently active dropdown ID in the application state
 * - Executes the toggle callback to change dropdown visibility
 */
export function toggleDropdown(
  event: MouseEvent | undefined,
  options: {
    dropdownId: string;
    toggle: () => void;
    getPosition?: (e: MouseEvent) => void;
  },
) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();

    if (options.getPosition) {
      options.getPosition(event);
    }
  }

  activeDropdownId.set(options.dropdownId);

  setTimeout(() => {
    options.toggle();
  }, 10);
}
