/**
 * Screen Reader Support
 *
 * Utilities for optimizing screen reader experience
 */

/**
 * Screen reader only text styles
 *
 * Hides text visually but keeps it available to screen readers
 */
export const screenReaderOnlyStyles = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
} as const;

/**
 * Get screen reader only CSS class
 */
export function getScreenReaderOnlyClass(): string {
  return `sr-only`;
}

/**
 * Create screen reader only element HTML
 */
export function createScreenReaderText(text: string, id?: string): string {
  const idAttr = id ? ` id="${id}"` : "";
  const styleAttr = `style="
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  "`;
  return `<span${idAttr}${styleAttr}>${text}</span>`;
}

/**
 * Live region announcement options
 */
export interface AnnouncementOptions {
  /** Politeness level */
  politeness?: "polite" | "assertive";

  /** Whether to replace entire region content */
  atomic?: boolean;

  /** Delay before announcing (ms) */
  delay?: number;

  /** Clear after announcement (ms) */
  clearAfter?: number;
}

/**
 * Screen reader announcement manager
 */
export class ScreenReaderAnnouncer {
  private liveRegion: HTMLElement | null = null;
  private announcements: string[] = [];

  constructor() {
    this.initializeLiveRegion();
  }

  /**
   * Initialize live region
   */
  private initializeLiveRegion(): void {
    if (typeof document === "undefined") {
      return;
    }

    // Check if live region already exists
    this.liveRegion = document.getElementById("sr-announcer");

    if (!this.liveRegion) {
      this.liveRegion = document.createElement("div");
      this.liveRegion.id = "sr-announcer";
      this.liveRegion.setAttribute("role", "status");
      this.liveRegion.setAttribute("aria-live", "polite");
      this.liveRegion.setAttribute("aria-atomic", "true");

      Object.assign(this.liveRegion.style, screenReaderOnlyStyles);

      document.body.appendChild(this.liveRegion);
    }
  }

  /**
   * Announce message to screen reader
   */
  announce(message: string, options: AnnouncementOptions = {}): void {
    const {
      politeness = "polite",
      atomic = true,
      delay = 0,
      clearAfter = 3000,
    } = options;

    if (!this.liveRegion) {
      this.initializeLiveRegion();
    }

    if (!this.liveRegion) return;

    // Store announcement
    this.announcements.push(message);

    // Set live region attributes
    this.liveRegion.setAttribute("aria-live", politeness);
    this.liveRegion.setAttribute("aria-atomic", atomic.toString());

    // Announce with delay
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, delay);

    // Clear after timeout
    if (clearAfter > 0) {
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = "";
        }
      }, delay + clearAfter);
    }
  }

  /**
   * Announce error message
   */
  announceError(message: string, delay?: number): void {
    this.announce(`Error: ${message}`, {
      politeness: "assertive",
      delay,
      clearAfter: 5000,
    });
  }

  /**
   * Announce success message
   */
  announceSuccess(message: string, delay?: number): void {
    this.announce(`Success: ${message}`, {
      politeness: "polite",
      delay,
      clearAfter: 3000,
    });
  }

  /**
   * Announce loading state
   */
  announceLoading(message: string = "Loading"): void {
    this.announce(message, {
      politeness: "polite",
      clearAfter: 0,
    });
  }

  /**
   * Clear announcements
   */
  clear(): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = "";
    }
    this.announcements = [];
  }

  /**
   * Get announcement history
   */
  getHistory(): string[] {
    return [...this.announcements];
  }

  /**
   * Destroy announcer
   */
  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentElement) {
      this.liveRegion.parentElement.removeChild(this.liveRegion);
    }
    this.announcements = [];
  }
}

/**
 * Global announcer instance
 */
let globalAnnouncer: ScreenReaderAnnouncer | null = null;

/**
 * Get global announcer
 */
export function getGlobalAnnouncer(): ScreenReaderAnnouncer {
  if (!globalAnnouncer) {
    globalAnnouncer = new ScreenReaderAnnouncer();
  }
  return globalAnnouncer;
}

/**
 * Announce to screen readers globally
 */
export function announce(
  message: string,
  options?: AnnouncementOptions
): void {
  getGlobalAnnouncer().announce(message, options);
}

/**
 * Create table header attributes for screen readers
 */
export function tableHeaderAttributes(
  isHeader: boolean,
  scope?: "col" | "row"
): Record<string, string> {
  const attrs: Record<string, string> = {};

  if (isHeader) {
    attrs.role = "columnheader";
    if (scope) {
      attrs.scope = scope;
    }
  }

  return attrs;
}

/**
 * Create table caption
 */
export function tableCaption(text: string, id?: string): string {
  const idAttr = id ? ` id="${id}"` : "";
  return `<caption${idAttr}>${text}</caption>`;
}

/**
 * Create list item attributes
 */
export function listItemAttributes(
  listType: "ordered" | "unordered",
  position: number,
  total: number
): Record<string, string | number> {
  return {
    role: "listitem",
    "aria-setsize": total,
    "aria-posinset": position,
  };
}

/**
 * Create skip link HTML
 */
export function createSkipLink(
  targetId: string = "main",
  text: string = "Skip to main content"
): string {
  return `
    <a href="#${targetId}" class="sr-skip-link" style="${Object.entries(screenReaderOnlyStyles)
      .map(([key, value]) => `${key}: ${value};`)
      .join("")}">
      ${text}
    </a>
  `;
}

/**
 * Check if element is hidden from screen readers
 */
export function isHiddenFromScreenReaders(element: Element): boolean {
  return (
    element.hasAttribute("aria-hidden") &&
    element.getAttribute("aria-hidden") === "true"
  );
}

/**
 * Announce page region
 */
export function announceRegion(
  region: "banner" | "main" | "navigation" | "contentinfo",
  name?: string
): Record<string, string> {
  const attrs: Record<string, string> = {
    role: region,
  };

  if (name && region === "main") {
    attrs["aria-label"] = name;
  }

  return attrs;
}

/**
 * Create expandable section attributes
 */
export function expandableAttributes(
  expanded: boolean,
  controlId: string
): Record<string, string | boolean> {
  return {
    "aria-expanded": expanded,
    "aria-controls": controlId,
  };
}

/**
 * Create page structure for screen readers
 */
export function createPageStructure(): {
  banner: Record<string, string>;
  navigation: Record<string, string>;
  main: Record<string, string>;
  contentinfo: Record<string, string>;
} {
  return {
    banner: { role: "banner" },
    navigation: { role: "navigation" },
    main: { role: "main" },
    contentinfo: { role: "contentinfo" },
  };
}

/**
 * Get screen reader specific styles CSS
 */
export function getScreenReaderStyles(): string {
  return `
    .sr-only,
    .sr-only-focusable:not(:focus),
    .sr-skip-link:not(:focus) {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .sr-only-focusable:focus,
    .sr-skip-link:focus {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      clip: auto;
      white-space: normal;
      padding: 8px;
      background: #000;
      color: #fff;
      text-decoration: none;
      z-index: 100;
    }
  `;
}
