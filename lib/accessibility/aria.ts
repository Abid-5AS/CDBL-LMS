/**
 * ARIA Utilities
 *
 * Helpers for ARIA attributes and semantic HTML
 */

/**
 * ARIA role type
 */
export type AriaRole =
  | "button"
  | "link"
  | "menuitem"
  | "tab"
  | "alert"
  | "article"
  | "banner"
  | "complementary"
  | "contentinfo"
  | "form"
  | "main"
  | "navigation"
  | "region"
  | "search"
  | "listitem"
  | "option"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "radio"
  | "checkbox"
  | "progressbar"
  | "slider";

/**
 * ARIA live region politeness level
 */
export type AriaPoliteness = "polite" | "assertive" | "off";

/**
 * Get semantic HTML element for role
 */
export function getSemanticElement(role: AriaRole): string {
  const roleToElement: Record<AriaRole, string> = {
    button: "button",
    link: "a",
    menuitem: "li",
    tab: "button",
    alert: "div",
    article: "article",
    banner: "header",
    complementary: "aside",
    contentinfo: "footer",
    form: "form",
    main: "main",
    navigation: "nav",
    region: "section",
    search: "form",
    listitem: "li",
    option: "option",
    menuitemcheckbox: "input",
    menuitemradio: "input",
    radio: "input",
    checkbox: "input",
    progressbar: "div",
    slider: "input",
  };

  return roleToElement[role] || "div";
}

/**
 * ARIA attributes builder
 */
export class AriaAttributeBuilder {
  private attributes: Record<string, string | boolean | number> = {};

  /**
   * Set aria-label
   */
  label(label: string): this {
    this.attributes["aria-label"] = label;
    return this;
  }

  /**
   * Set aria-labelledby
   */
  labelledBy(id: string): this {
    this.attributes["aria-labelledby"] = id;
    return this;
  }

  /**
   * Set aria-describedby
   */
  describedBy(id: string): this {
    this.attributes["aria-describedby"] = id;
    return this;
  }

  /**
   * Set aria-disabled
   */
  disabled(disabled: boolean): this {
    this.attributes["aria-disabled"] = disabled;
    return this;
  }

  /**
   * Set aria-hidden
   */
  hidden(hidden: boolean): this {
    this.attributes["aria-hidden"] = hidden;
    return this;
  }

  /**
   * Set aria-pressed
   */
  pressed(pressed: boolean | "mixed"): this {
    this.attributes["aria-pressed"] = pressed;
    return this;
  }

  /**
   * Set aria-checked
   */
  checked(checked: boolean | "mixed"): this {
    this.attributes["aria-checked"] = checked;
    return this;
  }

  /**
   * Set aria-expanded
   */
  expanded(expanded: boolean): this {
    this.attributes["aria-expanded"] = expanded;
    return this;
  }

  /**
   * Set aria-selected
   */
  selected(selected: boolean): this {
    this.attributes["aria-selected"] = selected;
    return this;
  }

  /**
   * Set aria-required
   */
  required(required: boolean): this {
    this.attributes["aria-required"] = required;
    return this;
  }

  /**
   * Set aria-invalid
   */
  invalid(invalid: boolean): this {
    this.attributes["aria-invalid"] = invalid;
    return this;
  }

  /**
   * Set aria-readonly
   */
  readOnly(readOnly: boolean): this {
    this.attributes["aria-readonly"] = readOnly;
    return this;
  }

  /**
   * Set aria-busy
   */
  busy(busy: boolean): this {
    this.attributes["aria-busy"] = busy;
    return this;
  }

  /**
   * Set aria-live
   */
  live(politeness: AriaPoliteness): this {
    this.attributes["aria-live"] = politeness;
    return this;
  }

  /**
   * Set aria-atomic
   */
  atomic(atomic: boolean): this {
    this.attributes["aria-atomic"] = atomic;
    return this;
  }

  /**
   * Set aria-controls
   */
  controls(id: string): this {
    this.attributes["aria-controls"] = id;
    return this;
  }

  /**
   * Set aria-owns
   */
  owns(id: string): this {
    this.attributes["aria-owns"] = id;
    return this;
  }

  /**
   * Set aria-currentpage
   */
  currentPage(current: boolean): this {
    this.attributes["aria-current"] = current ? "page" : "false";
    return this;
  }

  /**
   * Get built attributes as object
   */
  build(): Record<string, string | boolean | number> {
    return { ...this.attributes };
  }

  /**
   * Get attributes as string for HTML
   */
  toString(): string {
    return Object.entries(this.attributes)
      .map(([key, value]) => {
        if (typeof value === "boolean") {
          return value ? key : "";
        }
        return `${key}="${value}"`;
      })
      .filter(Boolean)
      .join(" ");
  }
}

/**
 * Create ARIA builder
 */
export function aria(): AriaAttributeBuilder {
  return new AriaAttributeBuilder();
}

/**
 * Associate label with input
 */
export function associateLabel(
  inputId: string,
  labelText: string
): { labelProps: { htmlFor: string }; inputProps: { id: string } } {
  return {
    labelProps: { htmlFor: inputId },
    inputProps: { id: inputId },
  };
}

/**
 * Associate description with input
 */
export function associateDescription(
  inputId: string,
  descriptionId: string
): { inputProps: { "aria-describedby": string }; descriptionProps: { id: string } } {
  return {
    inputProps: { "aria-describedby": descriptionId },
    descriptionProps: { id: descriptionId },
  };
}

/**
 * Create live region attributes
 */
export function liveRegion(
  politeness: AriaPoliteness = "polite",
  atomic: boolean = true
): Record<string, string | boolean> {
  return {
    "aria-live": politeness,
    "aria-atomic": atomic,
  };
}

/**
 * Create error message attributes
 */
export function errorAttributes(
  inputId: string,
  errorId: string
): Record<string, string | boolean> {
  return {
    "aria-invalid": true,
    "aria-describedby": errorId,
  };
}

/**
 * Create button attributes
 */
export function buttonAttributes(
  label?: string,
  disabled?: boolean
): Record<string, string | boolean> {
  const attrs: Record<string, string | boolean> = {};

  if (label) {
    attrs["aria-label"] = label;
  }

  if (disabled !== undefined) {
    attrs["aria-disabled"] = disabled;
  }

  return attrs;
}

/**
 * Create link attributes
 */
export function linkAttributes(
  label?: string
): Record<string, string> {
  const attrs: Record<string, string> = {};

  if (label) {
    attrs["aria-label"] = label;
  }

  return attrs;
}

/**
 * Get semantic HTML for heading level
 */
export function getHeadingElement(level: 1 | 2 | 3 | 4 | 5 | 6): string {
  return `h${level}`;
}

/**
 * Create landmark attributes
 */
export type Landmark = "banner" | "contentinfo" | "main" | "navigation" | "region" | "search" | "complementary" | "form";

export function landmarkAttributes(
  landmark: Landmark,
  label?: string
): Record<string, string> {
  const attrs: Record<string, string> = {
    role: landmark,
  };

  if (label && landmark === "region") {
    attrs["aria-label"] = label;
  }

  return attrs;
}

/**
 * Create tab attributes
 */
export function tabAttributes(
  id: string,
  selected: boolean,
  panelId: string
): Record<string, string | boolean> {
  return {
    id,
    role: "tab",
    "aria-selected": selected,
    "aria-controls": panelId,
    tabIndex: selected ? 0 : -1,
  };
}

/**
 * Create tab panel attributes
 */
export function tabPanelAttributes(
  id: string,
  labelledBy: string,
  hidden: boolean
): Record<string, string | boolean> {
  return {
    id,
    role: "tabpanel",
    "aria-labelledby": labelledBy,
    hidden,
  };
}

/**
 * Create listbox option attributes
 */
export function optionAttributes(
  id: string,
  selected: boolean,
  disabled?: boolean
): Record<string, string | boolean> {
  return {
    id,
    role: "option",
    "aria-selected": selected,
    "aria-disabled": disabled || false,
  };
}

/**
 * Validate ARIA attributes on element
 */
export function validateAriaAttributes(element: Element): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const attrs = element.attributes;

  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    const name = attr.name;

    // Check for common ARIA mistakes
    if (name === "aria-label" && element.textContent?.trim()) {
      // OK - element has both ARIA label and text content
    }

    if (name === "aria-hidden" && attr.value === "true") {
      const hasAriaLabel = element.hasAttribute("aria-label");
      if (!hasAriaLabel && element.children.length === 0) {
        // Might be decorative, which is OK
      }
    }

    if (name === "aria-required" && element.tagName === "BUTTON") {
      errors.push(`aria-required not applicable to ${element.tagName}`);
    }

    if (name === "aria-selected" && !element.hasAttribute("role")) {
      errors.push("aria-selected requires role attribute");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get recommended ARIA roles for element
 */
export function getRecommendedRoles(element: HTMLElement): AriaRole[] {
  const tagName = element.tagName.toLowerCase();
  const roleMap: Record<string, AriaRole[]> = {
    button: ["button"],
    a: ["link"],
    nav: ["navigation"],
    main: ["main"],
    header: ["banner"],
    footer: ["contentinfo"],
    aside: ["complementary"],
    article: ["article"],
    section: ["region"],
    form: ["form", "search"],
    ul: [],
    ol: [],
    li: ["listitem"],
    div: [],
    span: [],
  };

  return roleMap[tagName] || [];
}
