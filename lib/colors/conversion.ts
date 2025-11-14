/**
 * Color Format Conversion Utilities
 *
 * Convert between different color formats: Hex, RGB, HSL
 * Used for color manipulation and CSS generation
 */

/**
 * RGB color representation
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color (#RRGGBB or RRGGBB)
 * @returns RGB object
 * @throws Error if hex color is invalid
 *
 * @example
 * ```tsx
 * const rgb = hexToRgb('#ff0000');
 * // { r: 255, g: 0, b: 0 }
 * ```
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const clean = hex.replace(/^#/, "");

  if (!/^[0-9A-F]{6}$/i.test(clean)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

/**
 * Convert RGB to hex color
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string (#RRGGBB)
 *
 * @example
 * ```tsx
 * const hex = rgbToHex(255, 0, 0);
 * // "#ff0000"
 * ```
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
}

/**
 * Convert RGB to HSL
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HSL object with h (0-360), s (0-100), l (0-100)
 *
 * @example
 * ```tsx
 * const hsl = rgbToHsl(255, 0, 0);
 * // { h: 0, s: 100, l: 50 }
 * ```
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
    default:
      h = 0;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB object with r, g, b (0-255)
 *
 * @example
 * ```tsx
 * const rgb = hslToRgb(0, 100, 50);
 * // { r: 255, g: 0, b: 0 }
 * ```
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert hex to HSL
 * @param hex - Hex color (#RRGGBB)
 * @returns HSL object
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert HSL to hex
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Format RGB as CSS rgb() string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @param alpha - Optional alpha (0-1)
 * @returns CSS rgb/rgba string
 *
 * @example
 * ```tsx
 * const css = formatRgb(255, 0, 0);
 * // "rgb(255, 0, 0)"
 *
 * const cssAlpha = formatRgb(255, 0, 0, 0.5);
 * // "rgba(255, 0, 0, 0.5)"
 * ```
 */
export function formatRgb(
  r: number,
  g: number,
  b: number,
  alpha?: number
): string {
  if (alpha !== undefined) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Format HSL as CSS hsl() string
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @param alpha - Optional alpha (0-1)
 * @returns CSS hsl/hsla string
 */
export function formatHsl(
  h: number,
  s: number,
  l: number,
  alpha?: number
): string {
  if (alpha !== undefined) {
    return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Get RGB from various formats (hex, rgb, hsl)
 * @param color - Color in any supported format
 * @returns RGB object
 */
export function normalizeToRgb(
  color: string | RGB
): RGB {
  if (typeof color === "object") {
    return color;
  }

  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  if (color.startsWith("rgb")) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      return {
        r: parseInt(match[0]),
        g: parseInt(match[1]),
        b: parseInt(match[2]),
      };
    }
  }

  throw new Error(`Cannot parse color: ${color}`);
}
