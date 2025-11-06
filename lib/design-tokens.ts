export type ThemeMode = "light" | "dark";

export type UserRole =
  | "EMPLOYEE"
  | "DEPT_HEAD"
  | "HR_ADMIN"
  | "HR_HEAD"
  | "CEO";

type SemanticColorSet = {
  background: string;
  surface: string;
  surfaceMuted: string;
  popover: string;
  card: string;
  foreground: string;
  foregroundMuted: string;
  foregroundSubtle: string;
  border: string;
  borderStrong: string;
  ring: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  overlay: string;
};

type RoleVisualIdentity = {
  accent: string;
  accentMuted: string;
  accentRing: string;
  gradient: string;
  chart: [string, string, string, string];
  icon: string;
};

type RoleThemeDefinition = Record<ThemeMode, RoleVisualIdentity>;

export const semanticColors: Record<ThemeMode, SemanticColorSet> = {
  light: {
    background: "#fafbfc",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    popover: "#ffffff",
    card: "#ffffff",
    foreground: "#0f172a",
    foregroundMuted: "#475569",
    foregroundSubtle: "#94a3b8",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    ring: "#6366f1",
    primary: "#6366f1",
    primaryForeground: "#f8fafc",
    accent: "#3b82f6",
    accentForeground: "#ffffff",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    overlay: "rgba(15, 23, 42, 0.08)",
  },
  dark: {
    background: "#0f1419",
    surface: "#1a1f2e",
    surfaceMuted: "#232a3b",
    popover: "#1e2532",
    card: "rgba(26, 31, 46, 0.7)",
    foreground: "#f8fafc",
    foregroundMuted: "#cbd5e1",
    foregroundSubtle: "#64748b",
    border: "rgba(148, 163, 184, 0.18)",
    borderStrong: "rgba(148, 163, 184, 0.35)",
    ring: "#818cf8",
    primary: "#818cf8",
    primaryForeground: "#0f1419",
    accent: "#60a5fa",
    accentForeground: "#0a0e1a",
    success: "#34d399",
    warning: "#facc15",
    danger: "#f87171",
    info: "#60a5fa",
    overlay: "rgba(12, 18, 28, 0.55)",
  },
};

export const spacingScale = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
  "6xl": 80,
  "7xl": 96,
} as const;

export const borderRadius = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  pill: "9999px",
} as const;

export const shadowTokens = {
  light: {
    xs: "0 1px 2px rgba(15, 23, 42, 0.05)",
    sm: "0 1px 3px rgba(15, 23, 42, 0.08)",
    md: "0 4px 6px rgba(15, 23, 42, 0.1)",
    lg: "0 10px 15px rgba(15, 23, 42, 0.12)",
    xl: "0 20px 25px rgba(15, 23, 42, 0.16)",
  },
  dark: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.35)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.45)",
    md: "0 4px 6px rgba(0, 0, 0, 0.5)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.55)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.6)",
  },
} as const;

export const typographyTokens = {
  fontFamily: {
    sans: "var(--font-geist-sans, 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif)",
    mono: "var(--font-geist-mono, 'IBM Plex Mono', 'Fira Code', monospace)",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    heading: "-0.01em",
    body: "-0.005em",
    uppercase: "0.08em",
  },
} as const;

export const transitionTokens = {
  duration: {
    micro: 150,
    small: 250,
    medium: 350,
    large: 500,
    xl: 800,
  },
  easing: {
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
} as const;

// Transparency tokens for liquid glass effects
export const transparencyTokens = {
  light: {
    glassCard: "rgba(255, 255, 255, 0.4)",
    glassNav: "rgba(255, 255, 255, 0.7)",
    glassModal: "rgba(255, 255, 255, 0.9)",
    glassBorder: "rgba(255, 255, 255, 0.2)",
    backdropBlur: "blur(24px)",
    backdropSaturate: "saturate(180%)",
  },
  dark: {
    glassCard: "rgba(26, 31, 46, 0.4)",
    glassNav: "rgba(15, 23, 42, 0.7)",
    glassModal: "rgba(26, 31, 46, 0.9)",
    glassBorder: "rgba(148, 163, 184, 0.18)",
    backdropBlur: "blur(24px)",
    backdropSaturate: "saturate(180%)",
  },
} as const;

// Dynamic accent palette from system theme (HSL primary, secondary)
export const dynamicAccentPalette = {
  light: {
    primary: "hsl(243, 75%, 59%)", // indigo-600
    primaryHover: "hsl(243, 75%, 65%)",
    secondary: "hsl(217, 91%, 60%)", // blue-500
    secondaryHover: "hsl(217, 91%, 65%)",
    accent: "hsl(243, 75%, 59%)",
    accentMuted: "hsla(243, 75%, 59%, 0.12)",
  },
  dark: {
    primary: "hsl(243, 75%, 68%)", // indigo-400
    primaryHover: "hsl(243, 75%, 73%)",
    secondary: "hsl(217, 91%, 68%)", // blue-400
    secondaryHover: "hsl(217, 91%, 73%)",
    accent: "hsl(243, 75%, 68%)",
    accentMuted: "hsla(243, 75%, 68%, 0.22)",
  },
} as const;

export const roleThemes: Record<UserRole, RoleThemeDefinition> = {
  EMPLOYEE: {
    light: {
      accent: "#3b82f6",
      accentMuted: "rgba(59, 130, 246, 0.12)",
      accentRing: "rgba(59, 130, 246, 0.35)",
      gradient: "linear-gradient(135deg, #38bdf8, #22d3ee)",
      chart: ["#38bdf8", "#34d399", "#facc15", "#6366f1"],
      icon: "#2563eb",
    },
    dark: {
      accent: "#60a5fa",
      accentMuted: "rgba(96, 165, 250, 0.2)",
      accentRing: "rgba(96, 165, 250, 0.45)",
      gradient: "linear-gradient(135deg, #2563eb, #22d3ee)",
      chart: ["#60a5fa", "#4ade80", "#facc15", "#818cf8"],
      icon: "#93c5fd",
    },
  },
  DEPT_HEAD: {
    light: {
      accent: "#6366f1",
      accentMuted: "rgba(99, 102, 241, 0.12)",
      accentRing: "rgba(99, 102, 241, 0.35)",
      gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      chart: ["#6366f1", "#14b8a6", "#f97316", "#64748b"],
      icon: "#4f46e5",
    },
    dark: {
      accent: "#8b5cf6",
      accentMuted: "rgba(139, 92, 246, 0.22)",
      accentRing: "rgba(139, 92, 246, 0.45)",
      gradient: "linear-gradient(135deg, #4c1d95, #7c3aed)",
      chart: ["#8b5cf6", "#2dd4bf", "#fb923c", "#cbd5f5"],
      icon: "#c4b5fd",
    },
  },
  HR_ADMIN: {
    light: {
      accent: "#2563eb",
      accentMuted: "rgba(37, 99, 235, 0.14)",
      accentRing: "rgba(37, 99, 235, 0.4)",
      gradient: "linear-gradient(135deg, #2563eb, #f97316)",
      chart: ["#2563eb", "#f97316", "#22d3ee", "#1d4ed8"],
      icon: "#1d4ed8",
    },
    dark: {
      accent: "#3b82f6",
      accentMuted: "rgba(59, 130, 246, 0.22)",
      accentRing: "rgba(59, 130, 246, 0.45)",
      gradient: "linear-gradient(135deg, #1d4ed8, #fb923c)",
      chart: ["#3b82f6", "#fb923c", "#22d3ee", "#a855f7"],
      icon: "#93c5fd",
    },
  },
  HR_HEAD: {
    light: {
      accent: "#7c3aed",
      accentMuted: "rgba(124, 58, 237, 0.14)",
      accentRing: "rgba(124, 58, 237, 0.38)",
      gradient: "linear-gradient(135deg, #7c3aed, #6366f1)",
      chart: ["#7c3aed", "#6366f1", "#22d3ee", "#f97316"],
      icon: "#6d28d9",
    },
    dark: {
      accent: "#a855f7",
      accentMuted: "rgba(168, 85, 247, 0.25)",
      accentRing: "rgba(168, 85, 247, 0.48)",
      gradient: "linear-gradient(135deg, #4c1d95, #818cf8)",
      chart: ["#a855f7", "#818cf8", "#22d3ee", "#fb923c"],
      icon: "#d8b4fe",
    },
  },
  CEO: {
    light: {
      accent: "#4338ca",
      accentMuted: "rgba(67, 56, 202, 0.12)",
      accentRing: "rgba(67, 56, 202, 0.35)",
      gradient: "linear-gradient(135deg, #4338ca, #fbbf24)",
      chart: ["#4338ca", "#fbbf24", "#22d3ee", "#22c55e"],
      icon: "#3730a3",
    },
    dark: {
      accent: "#818cf8",
      accentMuted: "rgba(129, 140, 248, 0.22)",
      accentRing: "rgba(129, 140, 248, 0.45)",
      gradient: "linear-gradient(135deg, #312e81, #facc15)",
      chart: ["#818cf8", "#facc15", "#22d3ee", "#22c55e"],
      icon: "#c7d2fe",
    },
  },
};

export const statusIconMap = {
  DRAFT: "Edit",
  SUBMITTED: "Send",
  PENDING: "Clock",
  APPROVED: "CheckCircle",
  REJECTED: "XCircle",
  CANCELLED: "Ban",
} as const;

export const leaveTypeIconMap = {
  EARNED: "Calendar",
  CASUAL: "Coffee",
  MEDICAL: "HeartPulse",
  EXTRAWITHPAY: "Sparkles",
  EXTRAWITHOUTPAY: "Timer",
  MATERNITY: "Baby",
  PATERNITY: "Users",
  STUDY: "GraduationCap",
  SPECIAL_DISABILITY: "HeartHandshake",
  QUARANTINE: "Shield",
} as const;

export function getRoleTheme(role: UserRole, mode: ThemeMode = "light") {
  return roleThemes[role][mode];
}

export function getSemanticColors(mode: ThemeMode) {
  return semanticColors[mode];
}

export const designTokens = {
  modes: ["light", "dark"] as ThemeMode[],
  semanticColors,
  spacingScale,
  borderRadius,
  shadowTokens,
  typographyTokens,
  transitionTokens,
  transparencyTokens,
  dynamicAccentPalette,
  roleThemes,
};

export type RoleTheme = ReturnType<typeof getRoleTheme>;

