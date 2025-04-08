import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

const activeDropdownId: Writable<string | null> = writable<string | null>(null);

let lastTriggerElement: HTMLElement | null = null;
// Bounce timer for resizing event.
let resizeTimeout: ReturnType<typeof setTimeout>;

/**
 * A Svelte action that manages dropdown behavior for an HTML element.
 *
 * This action handles common dropdown interactions such as:
 * - Closing when clicking outside the dropdown
 * - Closing on page scroll
 * - Coordinating with other dropdowns to ensure only one is open at a time
 * - Recalculating the dropdown position on window resize
 *
 * @param node - The HTML element that contains the dropdown
 * @param options - Configuration options for the dropdown behavior
 * @param options.dropdownId - Unique identifier for this dropdown
 * @param options.isOpen - Boolean indicating if the dropdown is currently open
 * @param options.closeDropdown - Function to call when the dropdown should close
 * @param options.onStatusChange - Optional callback that fires when dropdown open state changes
 * @param options.updatePosition - Optional function to update the dropdown position
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
 *   updatePosition: (x, y, isLower) => {updateDropdownPosition(x, y, isLower)},
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
    updatePosition?: (x: number, y: number, isLower: boolean) => void;
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

  // Recalculate the dropdown position on resize.
  const handleWindowResize = () => {
    if (options.isOpen) {
      options.closeDropdown();
    }

    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
      recalculateDropdownPosition({
        updatePosition: options.updatePosition || (() => {}),
        dropdownIsOpen: options.isOpen,
      });
    }, 100);
  };

  // Close the dropdown if another one is opened.
  const unsubscribe = activeDropdownId.subscribe((id) => {
    if (id && id !== options.dropdownId && options.isOpen) {
      options.closeDropdown();
    }
  });

  // Add event listeners.
  window.addEventListener('click', handleWindowClick);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleWindowResize, { passive: true });

  return {
    update(newOptions: {
      dropdownId: string;
      isOpen: boolean;
      closeDropdown: () => void;
      onStatusChange?: (status: boolean) => void;
      updatePosition?: (x: number, y: number, isLower: boolean) => void;
    }) {
      Object.assign(options, newOptions);
    },

    destroy() {
      if (browser) {
        // Remove event listeners to prevent memory leaks.
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('click', handleWindowClick);
        window.removeEventListener('resize', handleWindowResize);

        clearTimeout(resizeTimeout);
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
  lastTriggerElement = event.currentTarget as HTMLElement;
  const rect = (lastTriggerElement as HTMLElement).getBoundingClientRect();

  return {
    x: rect.right,
    y: rect.bottom,
    isLower: rect.top > window.innerHeight / 2,
  };
}

/**
 * Recalculates the position of a dropdown menu relative to its trigger element.
 *
 * This function uses the position of the last trigger element to determine where
 * the dropdown should be placed. It also determines whether the dropdown should
 * appear above or below the trigger based on the trigger's position on the screen.
 *
 * @param options - Configuration options for positioning
 * @param options.updatePosition - Callback function to update the dropdown position
 * @param options.dropdownIsOpen - Boolean indicating if the dropdown is currently open
 *
 * @remarks
 * This function depends on global variables `browser` and `lastTriggerElement`,
 * and will do nothing if either is undefined or if the dropdown is not open.
 *
 * The dropdown will be positioned at the bottom-right corner of the trigger element.
 * The `isLower` parameter passed to `updatePosition` will be true if the trigger is
 * in the top half of the screen, suggesting the dropdown should expand downward.
 */
export function recalculateDropdownPosition(options: {
  updatePosition: (x: number, y: number, isLower: boolean) => void;
  dropdownIsOpen: boolean;
}): void {
  if (!browser || !lastTriggerElement || !options.dropdownIsOpen) {
    return;
  }

  const rect = lastTriggerElement.getBoundingClientRect();
  options.updatePosition(rect.right, rect.bottom, rect.top > window.innerHeight / 2);
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

    // Save the last trigger element for position calculations.
    lastTriggerElement = event.currentTarget as HTMLElement;

    if (options.getPosition) {
      options.getPosition(event);
    }
  }

  activeDropdownId.set(options.dropdownId);

  setTimeout(() => {
    options.toggle();
  }, 10);
}
