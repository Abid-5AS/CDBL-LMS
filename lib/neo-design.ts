/**
 * Professional Design System
 *
 * CENTRALIZED DESIGN CONFIGURATION
 * - Change values here to update the entire application
 * - All components use these utilities automatically
 * - Professional solid aesthetics
 * - Full accessibility and dark mode support
 */

// ============================================
// CORE PROFESSIONAL CARD SETTINGS
// ============================================
const CARD_CONFIG = {
  background: {
    default: "bg-card",
    elevated: "bg-card shadow-md",
    subtle: "bg-muted",
  },
  border: {
    default: "border border-border",
    strong: "border-2 border-border",
    subtle: "border border-border/50",
  },
  shadow: {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  },
};

// Professional Card Variants
export const glassCard = {
  base: `${CARD_CONFIG.background.default} ${CARD_CONFIG.border.default} ${CARD_CONFIG.shadow.sm} rounded-lg`,
  elevated: `${CARD_CONFIG.background.elevated} ${CARD_CONFIG.border.default} rounded-lg`,
  subtle: `${CARD_CONFIG.background.subtle} ${CARD_CONFIG.border.subtle} ${CARD_CONFIG.shadow.sm} rounded-lg`,
  interactive: `${CARD_CONFIG.background.default} ${CARD_CONFIG.border.default} ${CARD_CONFIG.shadow.sm} rounded-lg hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer`,
};

// Professional Button Variants
export const neoButton = {
  primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm border border-primary/20 transition-colors duration-200",
  success: "bg-success hover:bg-success/90 text-white shadow-sm border border-success/20 transition-colors duration-200",
  danger: "bg-danger hover:bg-danger/90 text-white shadow-sm border border-danger/20 transition-colors duration-200",
  glass: "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border shadow-sm transition-all duration-200",
};

// Professional Badge Variants
export const neoBadge = {
  approved: "bg-success text-white shadow-sm",
  pending: "bg-warning text-white shadow-sm",
  rejected: "bg-danger text-white shadow-sm",
  info: "bg-info text-white shadow-sm",
  glass: "bg-muted text-foreground border border-border shadow-sm",
};

// Professional Input/Form Styles
export const neoInput = {
  base: "bg-background border border-input focus:border-ring focus:ring-2 focus:ring-ring/20 shadow-sm transition-all duration-200",
  error: "bg-background border border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20 shadow-sm transition-all duration-200",
  success: "bg-background border border-success focus:border-success focus:ring-2 focus:ring-success/20 shadow-sm transition-all duration-200",
};

// Solid Backgrounds
export const neoGradient = {
  page: "bg-background",
  card: "bg-card",
  subtle: "bg-muted",
};

// Subtle Emphasis (no glow)
export const neoGlow = {
  blue: "shadow-md hover:shadow-lg transition-shadow",
  emerald: "shadow-md hover:shadow-lg transition-shadow",
  red: "shadow-md hover:shadow-lg transition-shadow",
  purple: "shadow-md hover:shadow-lg transition-shadow",
  soft: "shadow-sm hover:shadow-md transition-shadow",
};

// ============================================
// ACTION & NOTIFICATION STYLES
// ============================================
export const neoAction = {
  item: "bg-card border border-border rounded-lg p-3 hover:bg-accent transition-colors duration-200",
  destructive: "bg-destructive/10 border border-destructive/30 rounded-lg p-3 hover:bg-destructive/20 transition-colors duration-200",
  warning: "bg-warning/10 border border-warning/30 rounded-lg p-3 hover:bg-warning/20 transition-colors duration-200",
  info: "bg-info/10 border border-info/30 rounded-lg p-3 hover:bg-info/20 transition-colors duration-200",
  success: "bg-success/10 border border-success/30 rounded-lg p-3 hover:bg-success/20 transition-colors duration-200",
};

// ============================================
// DASHBOARD & PANEL STYLES
// ============================================
export const neoDashboard = {
  section: `${glassCard.base} rounded-xl p-6`,
  widget: `${glassCard.subtle} rounded-lg p-4`,
  sidebar: "bg-background border-r border-border",
};

// ============================================
// LIST & TABLE ITEM STYLES
// ============================================
export const neoList = {
  item: "bg-card border border-border rounded-lg p-3 hover:bg-accent hover:shadow-sm transition-all duration-200",
  itemActive: "bg-primary/10 border border-primary rounded-lg p-3 shadow-sm transition-all duration-200",
};

// ============================================
// EMPTY STATE STYLES
// ============================================
export const neoEmpty = {
  container: "bg-muted border border-border rounded-lg p-8 text-center",
};

// ============================================
// MODAL & DIALOG STYLES
// ============================================
export const neoModal = {
  overlay: "bg-black/50",
  content: `${glassCard.elevated} rounded-xl`,
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

// Helper to get card class (with global toggle)
export function getGlassCard(variant: keyof typeof glassCard = "base"): string {
  return NEO_ENABLED ? glassCard[variant] : "";
}

// Helper to get button class (with global toggle)
export function getNeoButton(variant: keyof typeof neoButton = "primary"): string {
  return NEO_ENABLED ? neoButton[variant] : "";
}

// Helper to get badge class (with global toggle)
export function getNeoBadge(variant: keyof typeof neoBadge = "info"): string {
  return NEO_ENABLED ? neoBadge[variant] : "";
}

// Helper to apply neo design to any element
export function withNeo(baseClasses: string, neoClasses?: string): string {
  return NEO_ENABLED && neoClasses ? cn(baseClasses, neoClasses) : baseClasses;
}
