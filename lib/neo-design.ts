/**
 * Professional Neo + Glassmorphism Design System
 *
 * This module provides a comprehensive design system combining:
 * - Professional neo aesthetics
 * - Glassmorphism effects
 * - Modern gradients and shadows
 * - Accessibility and readability
 */

// Glassmorphism Card Variants
export const glassCard = {
  base: "backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/30",
  elevated: "backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/30 dark:border-white/15 shadow-2xl shadow-black/20 dark:shadow-black/40",
  subtle: "backdrop-blur-md bg-white/50 dark:bg-gray-900/50 border border-white/10 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20",
  interactive: "backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/30 hover:bg-white/80 dark:hover:bg-gray-900/80 hover:shadow-3xl transition-all duration-300",
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

// Utility function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Helper to get glassmorphism card class
export function getGlassCard(variant: keyof typeof glassCard = "base"): string {
  return glassCard[variant];
}

// Helper to get neo button class
export function getNeoButton(variant: keyof typeof neoButton = "primary"): string {
  return neoButton[variant];
}

// Helper to get neo badge class
export function getNeoBadge(variant: keyof typeof neoBadge = "info"): string {
  return neoBadge[variant];
}
