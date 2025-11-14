/**
 * Color Contrast Utilities
 *
 * Calculate and validate color contrast ratios for accessibility compliance
 * Based on WCAG 2.1 guidelines
 */

import { RGB, hexToRgb, normalizeToRgb } from "./conversion";

/**
 * WCAG accessibility levels
 */
export enum WCAGLevel {
  /** AA standard: 4.5:1 for normal text, 3:1 for large text */
  AA = "AA",

  /** AAA standard: 7:1 for normal text, 4.5:1 for large text */
  AAA = "AAA",
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 definition
 * @param rgb - RGB color
 * @returns Luminance value (0-1)
 */
function calculateLuminance(rgb: RGB): number {
  // Convert to sRGB
  let [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * WCAG formula: (L1 + 0.05) / (L2 + 0.05)
 * @param color1 - First color (hex or RGB)
 * @param color2 - Second color (hex or RGB)
 * @returns Contrast ratio (1-21)
 * @throws Error if colors are invalid
 *
 * @example
 * ```tsx
 * const ratio = getContrastRatio('#ffffff', '#000000');
 * // 21 (maximum contrast)
 *
 * const ratio2 = getContrastRatio('#666666', '#777777');
 * // ~1.1 (poor contrast)
 * ```
 */
export function getContrastRatio(
  color1: string | RGB,
  color2: string | RGB
): number {
  const rgb1 = normalizeToRgb(color1);
  const rgb2 = normalizeToRgb(color2);

  const l1 = calculateLuminance(rgb1);
  const l2 = calculateLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * AA requires 4.5:1 for normal text, 3:1 for large text
 * @param color1 - First color
 * @param color2 - Second color
 * @param largeText - Whether text is large (≥18pt or ≥14pt bold)
 * @returns true if meets AA standard
 */
export function meetsWCAGAA(
  color1: string | RGB,
  color2: string | RGB,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const required = largeText ? 3 : 4.5;
  return ratio >= required;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 * AAA requires 7:1 for normal text, 4.5:1 for large text
 * @param color1 - First color
 * @param color2 - Second color
 * @param largeText - Whether text is large
 * @returns true if meets AAA standard
 */
export function meetsWCAGAAA(
  color1: string | RGB,
  color2: string | RGB,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  const required = largeText ? 4.5 : 7;
  return ratio >= required;
}

/**
 * Get the highest WCAG level met
 * @param ratio - Contrast ratio
 * @param largeText - Whether text is large
 * @returns "AAA" | "AA" | "fail"
 */
export function getWCAGLevel(ratio: number, largeText: boolean = false): "AAA" | "AA" | "fail" {
  const aaRequired = largeText ? 3 : 4.5;
  const aaaRequired = largeText ? 4.5 : 7;

  if (ratio >= aaaRequired) return "AAA";
  if (ratio >= aaRequired) return "AA";
  return "fail";
}

/**
 * Validate colors meet a specific WCAG level
 * @param color1 - First color
 * @param color2 - Second color
 * @param level - WCAG level to check
 * @param largeText - Whether text is large
 * @returns Validation result
 */
export function validateContrast(
  color1: string | RGB,
  color2: string | RGB,
  level: WCAGLevel,
  largeText: boolean = false
): {
  passes: boolean;
  ratio: number;
  required: number;
  level: "AAA" | "AA" | "fail";
} {
  const ratio = getContrastRatio(color1, color2);
  const required = level === WCAGLevel.AAA
    ? largeText ? 4.5 : 7
    : largeText ? 3 : 4.5;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
    level: getWCAGLevel(ratio, largeText),
  };
}

/**
 * Get contrast ratio as string (e.g., "4.5:1")
 * @param color1 - First color
 * @param color2 - Second color
 * @returns Formatted ratio string
 */
export function formatContrastRatio(
  color1: string | RGB,
  color2: string | RGB,
  precision: number = 2
): string {
  const ratio = getContrastRatio(color1, color2);
  return `${ratio.toFixed(precision)}:1`;
}

/**
 * Check if color pair has sufficient contrast for UI elements
 * UI elements are treated differently than text
 * @param color1 - First color
 * @param color2 - Second color
 * @returns true if contrast is sufficient for UI (3:1 minimum)
 */
export function hasUIContrast(
  color1: string | RGB,
  color2: string | RGB
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return ratio >= 3;
}

/**
 * Get a readable foreground color (black or white) for a background
 * @param bgColor - Background color
 * @returns "#000000" if background is light, "#ffffff" if dark
 */
export function getContrastingTextColor(bgColor: string | RGB): string {
  const rgb = normalizeToRgb(bgColor);
  const luminance = calculateLuminance(rgb);

  // If luminance > 0.5, use dark text, otherwise use light text
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Detailed contrast report for debugging
 * @param color1 - First color (foreground)
 * @param color2 - Second color (background)
 * @param usage - What the colors are used for
 * @returns Detailed report
 */
export function getContrastReport(
  color1: string | RGB,
  color2: string | RGB,
  usage: "text" | "ui" | "text-large" | "ui-focus" = "text"
): {
  color1: string;
  color2: string;
  ratio: string;
  wcagAA: boolean;
  wcagAAA: boolean;
  wcagLevel: "AAA" | "AA" | "fail";
  passes: boolean;
  message: string;
} {
  const color1Str = typeof color1 === "string" ? color1 : `rgb(${color1.r}, ${color1.g}, ${color1.b})`;
  const color2Str = typeof color2 === "string" ? color2 : `rgb(${color2.r}, ${color2.g}, ${color2.b})`;

  const ratio = getContrastRatio(color1, color2);
  const ratioStr = formatContrastRatio(color1, color2);

  let wcagAA = false;
  let wcagAAA = false;
  let passes = false;
  let message = "";

  if (usage === "text") {
    wcagAA = ratio >= 4.5;
    wcagAAA = ratio >= 7;
    passes = wcagAA;
    message = wcagAAA ? "✓ Meets AAA" : wcagAA ? "✓ Meets AA" : "✗ Fails AA";
  } else if (usage === "text-large") {
    wcagAA = ratio >= 3;
    wcagAAA = ratio >= 4.5;
    passes = wcagAA;
    message = wcagAAA ? "✓ Meets AAA" : wcagAA ? "✓ Meets AA" : "✗ Fails AA";
  } else if (usage === "ui") {
    passes = ratio >= 3;
    message = passes ? "✓ Meets UI requirement (3:1)" : "✗ Below 3:1";
  } else if (usage === "ui-focus") {
    passes = ratio >= 3;
    message = passes ? "✓ Sufficient for focus indicator" : "✗ Needs higher contrast";
  }

  return {
    color1: color1Str,
    color2: color2Str,
    ratio: ratioStr,
    wcagAA,
    wcagAAA,
    wcagLevel: getWCAGLevel(ratio, usage === "text-large"),
    passes,
    message,
  };
}
