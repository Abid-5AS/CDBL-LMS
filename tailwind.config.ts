import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Text Colors - Semantic Hierarchy
        "text-primary": "rgb(var(--text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--text-tertiary) / <alpha-value>)",
        "text-inverted": "rgb(var(--text-inverted) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",

        // Background Colors - Surface Hierarchy
        "bg-primary": "rgb(var(--bg-primary) / <alpha-value>)",
        "bg-secondary": "rgb(var(--bg-secondary) / <alpha-value>)",
        "bg-tertiary": "rgb(var(--bg-tertiary) / <alpha-value>)",
        "bg-inverted": "rgb(var(--bg-inverted) / <alpha-value>)",
        "bg-muted": "rgb(var(--bg-muted) / <alpha-value>)",

        // Leave Types - Semantic & Medical/Personal
        "leave-sick": "rgb(var(--color-leave-sick) / <alpha-value>)",
        "leave-casual": "rgb(var(--color-leave-casual) / <alpha-value>)",
        "leave-earned": "rgb(var(--color-leave-earned) / <alpha-value>)",
        "leave-unpaid": "rgb(var(--color-leave-unpaid) / <alpha-value>)",
        "leave-maternity": "rgb(var(--color-leave-maternity) / <alpha-value>)",
        "leave-paternity": "rgb(var(--color-leave-paternity) / <alpha-value>)",

        // Card Types - Functional UI
        "card-kpi": "rgb(var(--color-card-kpi) / <alpha-value>)",
        "card-action": "rgb(var(--color-card-action) / <alpha-value>)",
        "card-summary": "rgb(var(--color-card-summary) / <alpha-value>)",
        "card-kpi-soft": "rgb(var(--color-card-kpi-soft) / <alpha-value>)",
        "card-kpi-strong": "rgb(var(--color-card-kpi-strong) / <alpha-value>)",
        "card-action-soft": "rgb(var(--color-card-action-soft) / <alpha-value>)",
        "card-action-strong":
          "rgb(var(--color-card-action-strong) / <alpha-value>)",
        "card-summary-soft": "rgb(var(--color-card-summary-soft) / <alpha-value>)",
        "card-summary-strong":
          "rgb(var(--color-card-summary-strong) / <alpha-value>)",

        // Data States - Universal Status
        "data-success": "rgb(var(--color-data-success) / <alpha-value>)",
        "data-warning": "rgb(var(--color-data-warning) / <alpha-value>)",
        "data-error": "rgb(var(--color-data-error) / <alpha-value>)",
        "data-info": "rgb(var(--color-data-info) / <alpha-value>)",
        "data-success-soft":
          "rgb(var(--color-data-success-soft) / <alpha-value>)",
        "data-success-strong":
          "rgb(var(--color-data-success-strong) / <alpha-value>)",
        "data-warning-soft":
          "rgb(var(--color-data-warning-soft) / <alpha-value>)",
        "data-warning-strong":
          "rgb(var(--color-data-warning-strong) / <alpha-value>)",
        "data-error-soft": "rgb(var(--color-data-error-soft) / <alpha-value>)",
        "data-error-strong":
          "rgb(var(--color-data-error-strong) / <alpha-value>)",
        "data-info-soft": "rgb(var(--color-data-info-soft) / <alpha-value>)",
        "data-info-strong":
          "rgb(var(--color-data-info-strong) / <alpha-value>)",

        // UI States - Leave Request Status
        "status-draft": "rgb(var(--color-status-draft) / <alpha-value>)",
        "status-submitted":
          "rgb(var(--color-status-submitted) / <alpha-value>)",
        "status-approved": "rgb(var(--color-status-approved) / <alpha-value>)",
        "status-rejected": "rgb(var(--color-status-rejected) / <alpha-value>)",
        "status-returned": "rgb(var(--color-status-returned) / <alpha-value>)",
        "status-cancelled":
          "rgb(var(--color-status-cancelled) / <alpha-value>)",

        // Border helpers
        "border-default": "rgb(var(--color-border) / <alpha-value>)",
        "border-strong": "rgb(var(--color-border-strong) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};

export default config;
