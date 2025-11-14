/**
 * useKeyboardNav Hook
 *
 * React hook for keyboard navigation support
 */

import { useEffect, useRef, useCallback } from "react";
import {
  KeyboardEventHandler,
  FocusTrap,
  type KeyboardEventMap,
  type FocusTrapOptions,
} from "@/lib/accessibility/keyboard";

/**
 * Hook options
 */
interface UseKeyboardNavOptions {
  /** Enable focus trap */
  trapFocus?: boolean;

  /** Focus trap options */
  focusTrapOptions?: FocusTrapOptions;

  /** Keyboard event handlers */
  handlers?: KeyboardEventMap;

  /** Container element ref */
  containerRef?: React.RefObject<HTMLElement>;

  /** Enable arrow key navigation */
  arrowNavigation?: boolean;

  /** Arrow navigation orientation: horizontal, vertical, or both */
  arrowOrientation?: "horizontal" | "vertical" | "both";
}

/**
 * Hook for keyboard navigation support
 *
 * Provides keyboard event handling and focus management
 *
 * @example
 * ```typescript
 * function Modal({ isOpen }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useKeyboardNav({
 *     trapFocus: isOpen,
 *     containerRef,
 *     handlers: {
 *       onEscape: () => closeModal(),
 *       onEnter: () => handleConfirm(),
 *     },
 *   });
 *
 *   return <div ref={containerRef}>modal content</div>;
 * }
 * ```
 */
export function useKeyboardNav(options: UseKeyboardNavOptions = {}) {
  const {
    trapFocus = false,
    focusTrapOptions = {},
    handlers = {},
    containerRef,
    arrowNavigation = false,
    arrowOrientation = "both",
  } = options;

  const focusTrapRef = useRef<FocusTrap | null>(null);

  // Initialize focus trap
  useEffect(() => {
    if (!trapFocus || !containerRef?.current) {
      return;
    }

    focusTrapRef.current = new FocusTrap(containerRef.current, focusTrapOptions);

    return () => {
      focusTrapRef.current?.deactivate();
      focusTrapRef.current = null;
    };
  }, [trapFocus, containerRef, focusTrapOptions]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Handle standard keyboard events
      KeyboardEventHandler.handle(event, handlers);

      // Handle arrow key navigation
      if (arrowNavigation && containerRef?.current) {
        if (
          (arrowOrientation === "horizontal" ||
            arrowOrientation === "both") &&
          KeyboardEventHandler.isArrowRight(event)
        ) {
          event.preventDefault();
          focusNextInRow(containerRef.current);
        } else if (
          (arrowOrientation === "horizontal" ||
            arrowOrientation === "both") &&
          KeyboardEventHandler.isArrowLeft(event)
        ) {
          event.preventDefault();
          focusPreviousInRow(containerRef.current);
        } else if (
          (arrowOrientation === "vertical" ||
            arrowOrientation === "both") &&
          KeyboardEventHandler.isArrowDown(event)
        ) {
          event.preventDefault();
          focusNextInColumn(containerRef.current);
        } else if (
          (arrowOrientation === "vertical" ||
            arrowOrientation === "both") &&
          KeyboardEventHandler.isArrowUp(event)
        ) {
          event.preventDefault();
          focusPreviousInColumn(containerRef.current);
        }
      }
    },
    [handlers, arrowNavigation, arrowOrientation, containerRef]
  );

  // Attach keyboard event listener
  useEffect(() => {
    const container = containerRef?.current || document;
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  // Return utilities
  const focusNextElement = useCallback(() => {
    if (!containerRef?.current) return;
    const focusable = Array.from(
      containerRef.current.querySelectorAll(
        "button, a, input, textarea, select, [tabindex]:not([tabindex='-1'])"
      )
    ) as HTMLElement[];

    const current = document.activeElement as HTMLElement;
    const currentIndex = focusable.indexOf(current);
    const nextIndex = (currentIndex + 1) % focusable.length;

    if (focusable[nextIndex]) {
      focusable[nextIndex].focus();
    }
  }, [containerRef]);

  const focusPreviousElement = useCallback(() => {
    if (!containerRef?.current) return;
    const focusable = Array.from(
      containerRef.current.querySelectorAll(
        "button, a, input, textarea, select, [tabindex]:not([tabindex='-1'])"
      )
    ) as HTMLElement[];

    const current = document.activeElement as HTMLElement;
    const currentIndex = focusable.indexOf(current);
    const previousIndex =
      currentIndex - 1 < 0 ? focusable.length - 1 : currentIndex - 1;

    if (focusable[previousIndex]) {
      focusable[previousIndex].focus();
    }
  }, [containerRef]);

  const setFocus = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  }, []);

  return {
    focusNextElement,
    focusPreviousElement,
    setFocus,
    focusTrap: focusTrapRef.current,
  };
}

/**
 * Focus next item in row (for horizontal navigation)
 */
function focusNextInRow(container: HTMLElement): void {
  const items = Array.from(
    container.querySelectorAll("[data-row-item]")
  ) as HTMLElement[];
  const current = document.activeElement as HTMLElement;
  const currentIndex = items.indexOf(current);

  if (currentIndex >= 0 && items[currentIndex + 1]) {
    items[currentIndex + 1].focus();
  } else if (items.length > 0) {
    items[0].focus();
  }
}

/**
 * Focus previous item in row (for horizontal navigation)
 */
function focusPreviousInRow(container: HTMLElement): void {
  const items = Array.from(
    container.querySelectorAll("[data-row-item]")
  ) as HTMLElement[];
  const current = document.activeElement as HTMLElement;
  const currentIndex = items.indexOf(current);

  if (currentIndex > 0) {
    items[currentIndex - 1].focus();
  } else if (items.length > 0) {
    items[items.length - 1].focus();
  }
}

/**
 * Focus next item in column (for vertical navigation)
 */
function focusNextInColumn(container: HTMLElement): void {
  const items = Array.from(
    container.querySelectorAll("[data-col-item]")
  ) as HTMLElement[];
  const current = document.activeElement as HTMLElement;
  const currentIndex = items.indexOf(current);

  if (currentIndex >= 0 && items[currentIndex + 1]) {
    items[currentIndex + 1].focus();
  } else if (items.length > 0) {
    items[0].focus();
  }
}

/**
 * Focus previous item in column (for vertical navigation)
 */
function focusPreviousInColumn(container: HTMLElement): void {
  const items = Array.from(
    container.querySelectorAll("[data-col-item]")
  ) as HTMLElement[];
  const current = document.activeElement as HTMLElement;
  const currentIndex = items.indexOf(current);

  if (currentIndex > 0) {
    items[currentIndex - 1].focus();
  } else if (items.length > 0) {
    items[items.length - 1].focus();
  }
}
