/**
 * Accessible Chart Patterns for Color-Blind Users
 *
 * Provides SVG pattern definitions and utilities to make charts accessible
 * to users with color vision deficiencies by combining colors with patterns.
 *
 * Updated: Now uses CSS custom properties from theme.css for consistent colors
 */

// Use CSS custom properties for theme-aware colors
export const CHART_COLORS = [
  "hsl(var(--primary))", // Primary blue
  "hsl(var(--chart-1))", // Amber/Orange
  "hsl(var(--chart-2))", // Emerald/Green
  "hsl(var(--chart-3))", // Pink
  "hsl(var(--chart-4))", // Purple
  "hsl(var(--chart-5))", // Cyan
  "hsl(var(--destructive))", // Red
  "hsl(var(--chart-6))", // Lime
];

// Fallback hex colors for contexts where CSS vars aren't available (e.g., PDF generation)
export const CHART_COLORS_HEX = [
  "#2563eb", // Blue
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#9333ea", // Purple
  "#06b6d4", // Cyan
  "#ef4444", // Red
  "#84cc16", // Lime
];

export const PATTERN_IDS = [
  "pattern-solid",
  "pattern-dots",
  "pattern-stripes",
  "pattern-grid",
  "pattern-diagonal",
  "pattern-cross",
  "pattern-waves",
  "pattern-zigzag",
];

/**
 * SVG Pattern Definitions Component
 * Include this once in your chart component tree
 */
export function ChartPatternDefs() {
  return (
    <defs>
      {/* Solid fill (no pattern) */}
      <pattern id="pattern-solid" width="1" height="1">
        <rect width="1" height="1" fill="currentColor" />
      </pattern>

      {/* Dots pattern */}
      <pattern
        id="pattern-dots"
        x="0"
        y="0"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="5" cy="5" r="2" fill="currentColor" />
      </pattern>

      {/* Vertical stripes */}
      <pattern
        id="pattern-stripes"
        x="0"
        y="0"
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
      >
        <rect x="0" y="0" width="4" height="8" fill="currentColor" />
      </pattern>

      {/* Grid pattern */}
      <pattern
        id="pattern-grid"
        x="0"
        y="0"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 10 0 L 0 0 0 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </pattern>

      {/* Diagonal stripes */}
      <pattern
        id="pattern-diagonal"
        x="0"
        y="0"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 0 10 L 10 0 M -2 2 L 2 -2 M 8 12 L 12 8"
          stroke="currentColor"
          strokeWidth="2"
        />
      </pattern>

      {/* Cross-hatch pattern */}
      <pattern
        id="pattern-cross"
        x="0"
        y="0"
        width="10"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 0 5 L 10 5 M 5 0 L 5 10"
          stroke="currentColor"
          strokeWidth="1"
        />
      </pattern>

      {/* Wave pattern */}
      <pattern
        id="pattern-waves"
        x="0"
        y="0"
        width="20"
        height="10"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 0 5 Q 5 0 10 5 T 20 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </pattern>

      {/* Zigzag pattern */}
      <pattern
        id="pattern-zigzag"
        x="0"
        y="0"
        width="12"
        height="12"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 0 6 L 3 0 L 6 6 L 9 0 L 12 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </pattern>
    </defs>
  );
}

/**
 * Get color and pattern for a specific chart index
 */
export function getChartStyle(index: number) {
  const colorIndex = index % CHART_COLORS.length;
  const patternIndex = index % PATTERN_IDS.length;

  return {
    color: CHART_COLORS[colorIndex],
    pattern: PATTERN_IDS[patternIndex],
    patternUrl: `url(#${PATTERN_IDS[patternIndex]})`,
  };
}

/**
 * Get accessible fill for Recharts Cell component
 * Combines color with pattern for better accessibility
 */
export function getAccessibleFill(index: number) {
  const style = getChartStyle(index);
  // For now, return color. Pattern fills can be applied via CSS or stroke
  return style.color;
}

/**
 * Chart legend with both color and pattern indicators
 */
export function AccessibleLegendItem({
  color,
  pattern,
  label,
}: {
  color: string;
  pattern: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg width="16" height="16" className="flex-shrink-0">
        <ChartPatternDefs />
        <rect
          width="16"
          height="16"
          fill={color}
          stroke={color}
          strokeWidth="1"
        />
        <rect
          width="16"
          height="16"
          fill={`url(#${pattern})`}
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
        />
      </svg>
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}
