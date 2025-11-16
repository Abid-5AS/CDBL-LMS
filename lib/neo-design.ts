/**
 * Professional Neo + Glassmorphism Design System
 *
 * CENTRALIZED DESIGN CONFIGURATION
 * - Change values here to update the entire application
 * - All components use these utilities automatically
 * - Professional neo aesthetics with glassmorphism
 * - Modern gradients, shadows, and animations
 * - Full accessibility and dark mode support
 */

// ============================================
// CORE GLASSMORPHISM SETTINGS
// ============================================
// Tweak these values to change the glass effect globally
const GLASS_CONFIG = {
  blur: {
    strong: "backdrop-blur-xl",
    medium: "backdrop-blur-md",
    light: "backdrop-blur-sm",
  },
  background: {
    light: {
      strong: "bg-white/80",
      medium: "bg-white/70",
      subtle: "bg-white/50",
    },
    dark: {
      strong: "bg-gray-900/80",
      medium: "bg-gray-900/70",
      subtle: "bg-gray-900/50",
    },
  },
  border: {
    strong: "border-white/30",
    medium: "border-white/20",
    subtle: "border-white/10",
  },
  shadow: {
    strong: "shadow-2xl shadow-black/20 dark:shadow-black/40",
    medium: "shadow-2xl shadow-black/10 dark:shadow-black/30",
    subtle: "shadow-xl shadow-black/5 dark:shadow-black/20",
  },
};

// Glassmorphism Card Variants
export const glassCard = {
  base: `${GLASS_CONFIG.blur.strong} ${GLASS_CONFIG.background.light.medium} dark:${GLASS_CONFIG.background.dark.medium} border ${GLASS_CONFIG.border.medium} dark:${GLASS_CONFIG.border.subtle} ${GLASS_CONFIG.shadow.medium}`,
  elevated: `${GLASS_CONFIG.blur.strong} ${GLASS_CONFIG.background.light.strong} dark:${GLASS_CONFIG.background.dark.strong} border ${GLASS_CONFIG.border.strong} dark:border-white/15 ${GLASS_CONFIG.shadow.strong}`,
  subtle: `${GLASS_CONFIG.blur.medium} ${GLASS_CONFIG.background.light.subtle} dark:${GLASS_CONFIG.background.dark.subtle} border ${GLASS_CONFIG.border.subtle} dark:border-white/5 ${GLASS_CONFIG.shadow.subtle}`,
  interactive: `${GLASS_CONFIG.blur.strong} ${GLASS_CONFIG.background.light.medium} dark:${GLASS_CONFIG.background.dark.medium} border ${GLASS_CONFIG.border.medium} dark:${GLASS_CONFIG.border.subtle} ${GLASS_CONFIG.shadow.medium} hover:bg-white/80 dark:hover:bg-gray-900/80 hover:shadow-3xl transition-all duration-300`,
};

// Neo Button Variants
export const neoButton = {
  primary: "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 border border-white/20 backdrop-blur-sm transition-all duration-300",
  success: "bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 border border-white/20 backdrop-blur-sm transition-all duration-300",
  danger: "bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 border border-white/20 backdrop-blur-sm transition-all duration-300",
  glass: "backdrop-blur-md bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20 border border-white/20 text-gray-900 dark:text-white shadow-lg hover:shadow-xl transition-all duration-300",
};

// Neo Badge Variants
export const neoBadge = {
  approved: "bg-gradient-to-br from-emerald-500/90 to-emerald-600/70 text-white shadow-md shadow-emerald-500/30 backdrop-blur-sm border border-white/20",
  pending: "bg-gradient-to-br from-amber-500/90 to-amber-600/70 text-white shadow-md shadow-amber-500/30 backdrop-blur-sm border border-white/20",
  rejected: "bg-gradient-to-br from-red-500/90 to-red-600/70 text-white shadow-md shadow-red-500/30 backdrop-blur-sm border border-white/20",
  info: "bg-gradient-to-br from-blue-500/90 to-blue-600/70 text-white shadow-md shadow-blue-500/30 backdrop-blur-sm border border-white/20",
  glass: "backdrop-blur-md bg-white/20 dark:bg-black/20 border border-white/30 dark:border-white/10 text-gray-900 dark:text-white shadow-md",
};

// Neo Input/Form Styles
export const neoInput = {
  base: "backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border border-white/30 dark:border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 shadow-inner transition-all duration-300",
  error: "backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-inner transition-all duration-300",
  success: "backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all duration-300",
};

// Animated Gradient Backgrounds
export const neoGradient = {
  page: "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950",
  card: "bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-indigo-950/30",
  subtle: "bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50",
};

// Glow Effects for Important Elements
export const neoGlow = {
  blue: "shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)]",
  emerald: "shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)]",
  red: "shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)]",
  purple: "shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]",
  soft: "shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_30px_rgba(0,0,0,0.15)]",
};

// ============================================
// ACTION & NOTIFICATION STYLES
// ============================================
export const neoAction = {
  item: `${GLASS_CONFIG.blur.medium} bg-white/40 dark:bg-gray-900/40 border ${GLASS_CONFIG.border.medium} dark:${GLASS_CONFIG.border.subtle} rounded-xl p-3 hover:bg-white/60 dark:hover:bg-gray-900/60 transition-all duration-300`,
  destructive: `${GLASS_CONFIG.blur.medium} bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-xl p-3 hover:bg-red-50/80 dark:hover:bg-red-900/30 transition-all duration-300`,
  warning: `${GLASS_CONFIG.blur.medium} bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-3 hover:bg-amber-50/80 dark:hover:bg-amber-900/30 transition-all duration-300`,
  info: `${GLASS_CONFIG.blur.medium} bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-3 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 transition-all duration-300`,
  success: `${GLASS_CONFIG.blur.medium} bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl p-3 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 transition-all duration-300`,
};

// ============================================
// DASHBOARD & PANEL STYLES
// ============================================
export const neoDashboard = {
  section: `${glassCard.base} rounded-2xl p-6`,
  widget: `${glassCard.subtle} rounded-xl p-4`,
  sidebar: `${GLASS_CONFIG.blur.strong} bg-white/60 dark:bg-gray-900/60 border-r ${GLASS_CONFIG.border.medium} dark:${GLASS_CONFIG.border.subtle}`,
};

// ============================================
// LIST & TABLE ITEM STYLES
// ============================================
export const neoList = {
  item: `${GLASS_CONFIG.blur.light} bg-white/30 dark:bg-gray-900/30 border ${GLASS_CONFIG.border.subtle} rounded-lg p-3 hover:bg-white/50 dark:hover:bg-gray-900/50 hover:shadow-lg transition-all duration-300`,
  itemActive: `${GLASS_CONFIG.blur.medium} bg-white/60 dark:bg-gray-900/60 border border-blue-500/50 rounded-lg p-3 shadow-lg shadow-blue-500/20 transition-all duration-300`,
};

// ============================================
// EMPTY STATE STYLES
// ============================================
export const neoEmpty = {
  container: `${GLASS_CONFIG.blur.medium} bg-white/40 dark:bg-gray-900/40 border ${GLASS_CONFIG.border.subtle} rounded-xl p-8 text-center`,
};

// ============================================
// MODAL & DIALOG STYLES
// ============================================
export const neoModal = {
  overlay: "backdrop-blur-md bg-black/30",
  content: `${glassCard.elevated} rounded-2xl`,
};

// ============================================
// GLOBAL NEO DESIGN TOGGLE
// ============================================
// Set this to false to disable neo design globally (fallback to default)
export const NEO_ENABLED = true;

// Utility function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Helper to get glassmorphism card class (with global toggle)
export function getGlassCard(variant: keyof typeof glassCard = "base"): string {
  return NEO_ENABLED ? glassCard[variant] : "";
}

// Helper to get neo button class (with global toggle)
export function getNeoButton(variant: keyof typeof neoButton = "primary"): string {
  return NEO_ENABLED ? neoButton[variant] : "";
}

// Helper to get neo badge class (with global toggle)
export function getNeoBadge(variant: keyof typeof neoBadge = "info"): string {
  return NEO_ENABLED ? neoBadge[variant] : "";
}

// Helper to apply neo design to any element
export function withNeo(baseClasses: string, neoClasses?: string): string {
  return NEO_ENABLED && neoClasses ? cn(baseClasses, neoClasses) : baseClasses;
}
