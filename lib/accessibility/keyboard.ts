/**
 * Keyboard Accessibility
 *
 * Utilities for keyboard navigation and focus management
 */

/**
 * Keyboard event handler
 */
export type KeyboardHandler = (event: KeyboardEvent) => void;

/**
 * Keyboard event map
 */
export interface KeyboardEventMap {
  onEscape?: KeyboardHandler;
  onEnter?: KeyboardHandler;
  onSpace?: KeyboardHandler;
  onTab?: KeyboardHandler;
  onArrowUp?: KeyboardHandler;
  onArrowDown?: KeyboardHandler;
  onArrowLeft?: KeyboardHandler;
  onArrowRight?: KeyboardHandler;
  onHome?: KeyboardHandler;
  onEnd?: KeyboardHandler;
  onPageUp?: KeyboardHandler;
  onPageDown?: KeyboardHandler;
}

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  initialFocus?: HTMLElement;
  fallbackFocus?: HTMLElement;
  onEscape?: () => void;
  clickOutsideDeactivates?: boolean;
}

/**
 * Keyboard event utilities
 */
export class KeyboardEventHandler {
  /**
   * Check if key is escape
   */
  static isEscape(event: KeyboardEvent): boolean {
    return event.key === "Escape" || event.key === "Esc";
  }

  /**
   * Check if key is enter
   */
  static isEnter(event: KeyboardEvent): boolean {
    return event.key === "Enter";
  }

  /**
   * Check if key is space
   */
  static isSpace(event: KeyboardEvent): boolean {
    return event.key === " " || event.code === "Space";
  }

  /**
   * Check if key is tab
   */
  static isTab(event: KeyboardEvent): boolean {
    return event.key === "Tab";
  }

  /**
   * Check if key is arrow up
   */
  static isArrowUp(event: KeyboardEvent): boolean {
    return event.key === "ArrowUp";
  }

  /**
   * Check if key is arrow down
   */
  static isArrowDown(event: KeyboardEvent): boolean {
    return event.key === "ArrowDown";
  }

  /**
   * Check if key is arrow left
   */
  static isArrowLeft(event: KeyboardEvent): boolean {
    return event.key === "ArrowLeft";
  }

  /**
   * Check if key is arrow right
   */
  static isArrowRight(event: KeyboardEvent): boolean {
    return event.key === "ArrowRight";
  }

  /**
   * Check if key is home
   */
  static isHome(event: KeyboardEvent): boolean {
    return event.key === "Home";
  }

  /**
   * Check if key is end
   */
  static isEnd(event: KeyboardEvent): boolean {
    return event.key === "End";
  }

  /**
   * Check if modifier key is pressed (Ctrl, Alt, Shift, Cmd)
   */
  static hasModifier(event: KeyboardEvent): boolean {
    return event.ctrlKey || event.altKey || event.shiftKey || event.metaKey;
  }

  /**
   * Handle keyboard events
   */
  static handle(event: KeyboardEvent, handlers: KeyboardEventMap): void {
    if (this.isEscape(event) && handlers.onEscape) {
      handlers.onEscape(event);
    } else if (this.isEnter(event) && handlers.onEnter) {
      handlers.onEnter(event);
    } else if (this.isSpace(event) && handlers.onSpace) {
      handlers.onSpace(event);
    } else if (this.isTab(event) && handlers.onTab) {
      handlers.onTab(event);
    } else if (this.isArrowUp(event) && handlers.onArrowUp) {
      handlers.onArrowUp(event);
    } else if (this.isArrowDown(event) && handlers.onArrowDown) {
      handlers.onArrowDown(event);
    } else if (this.isArrowLeft(event) && handlers.onArrowLeft) {
      handlers.onArrowLeft(event);
    } else if (this.isArrowRight(event) && handlers.onArrowRight) {
      handlers.onArrowRight(event);
    } else if (this.isHome(event) && handlers.onHome) {
      handlers.onHome(event);
    } else if (this.isEnd(event) && handlers.onEnd) {
      handlers.onEnd(event);
    }
  }
}

/**
 * Focus trap manager
 */
export class FocusTrap {
  private element: HTMLElement;
  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private options: FocusTrapOptions;

  constructor(element: HTMLElement, options: FocusTrapOptions = {}) {
    this.element = element;
    this.options = options;
    this.init();
  }

  /**
   * Initialize focus trap
   */
  private init(): void {
    this.findFocusableElements();
    this.storePreviousActiveElement();
    this.setInitialFocus();
    this.attachKeyboardHandler();
  }

  /**
   * Find all focusable elements within trap
   */
  private findFocusableElements(): void {
    const focusableSelectors = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ];

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors.join(", "))
    ) as HTMLElement[];
  }

  /**
   * Store previous active element
   */
  private storePreviousActiveElement(): void {
    if (typeof document !== "undefined") {
      this.previousActiveElement = document.activeElement as HTMLElement;
    }
  }

  /**
   * Set initial focus
   */
  private setInitialFocus(): void {
    if (this.options.initialFocus) {
      this.options.initialFocus.focus();
    } else if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    } else if (this.options.fallbackFocus) {
      this.options.fallbackFocus.focus();
    }
  }

  /**
   * Attach keyboard handler
   */
  private attachKeyboardHandler(): void {
    this.element.addEventListener("keydown", (event) =>
      this.handleKeydown(event)
    );

    if (this.options.clickOutsideDeactivates) {
      document.addEventListener("mousedown", (event) =>
        this.handleClickOutside(event as MouseEvent)
      );
    }
  }

  /**
   * Handle keydown event
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (KeyboardEventHandler.isEscape(event)) {
      if (this.options.onEscape) {
        this.options.onEscape();
      }
      this.deactivate();
      return;
    }

    if (KeyboardEventHandler.isTab(event)) {
      this.handleTabKey(event);
    }
  }

  /**
   * Handle tab key navigation
   */
  private handleTabKey(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) {
      return;
    }

    const activeElement = document.activeElement as HTMLElement;
    const activeIndex = this.focusableElements.indexOf(activeElement);

    if (event.shiftKey) {
      // Shift + Tab: focus previous element
      const previousIndex =
        activeIndex - 1 < 0
          ? this.focusableElements.length - 1
          : activeIndex - 1;
      this.focusableElements[previousIndex].focus();
    } else {
      // Tab: focus next element
      const nextIndex =
        activeIndex + 1 >= this.focusableElements.length ? 0 : activeIndex + 1;
      this.focusableElements[nextIndex].focus();
    }

    event.preventDefault();
  }

  /**
   * Handle click outside
   */
  private handleClickOutside(event: MouseEvent): void {
    if (!this.element.contains(event.target as Node)) {
      this.deactivate();
    }
  }

  /**
   * Deactivate focus trap
   */
  deactivate(): void {
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }

    this.element.removeEventListener("keydown", (event) =>
      this.handleKeydown(event)
    );
  }

  /**
   * Get focusable elements
   */
  getFocusableElements(): HTMLElement[] {
    return this.focusableElements;
  }
}

/**
 * Set focus to element
 */
export function setFocus(element: HTMLElement | null): void {
  if (element) {
    element.focus();
  }
}

/**
 * Get currently focused element
 */
export function getFocusedElement(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  return document.activeElement as HTMLElement;
}

/**
 * Check if element has focus
 */
export function hasFocus(element: HTMLElement): boolean {
  return getFocusedElement() === element;
}

/**
 * Find focusable elements
 */
export function getFocusableElements(
  container: HTMLElement = document.body
): HTMLElement[] {
  const focusableSelectors = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ];

  return Array.from(
    container.querySelectorAll(focusableSelectors.join(", "))
  ) as HTMLElement[];
}

/**
 * Move focus to next focusable element
 */
export function focusNext(container: HTMLElement = document.body): void {
  const focusable = getFocusableElements(container);
  const current = getFocusedElement();
  const currentIndex = focusable.indexOf(current!);
  const nextIndex = (currentIndex + 1) % focusable.length;

  if (focusable[nextIndex]) {
    focusable[nextIndex].focus();
  }
}

/**
 * Move focus to previous focusable element
 */
export function focusPrevious(container: HTMLElement = document.body): void {
  const focusable = getFocusableElements(container);
  const current = getFocusedElement();
  const currentIndex = focusable.indexOf(current!);
  const previousIndex = currentIndex - 1 < 0 ? focusable.length - 1 : currentIndex - 1;

  if (focusable[previousIndex]) {
    focusable[previousIndex].focus();
  }
}

/**
 * Restore focus to element
 */
export function restoreFocus(element: HTMLElement | null): void {
  if (element && element.contains(document.activeElement)) {
    return;
  }

  if (element) {
    element.focus();
  }
}
