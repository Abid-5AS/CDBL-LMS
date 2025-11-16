import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2rem",
        "2xl": "3rem",
      },
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          ...defaultTheme.fontFamily.sans,
        ],
        heading: [
          "var(--font-geist-sans)",
          ...defaultTheme.fontFamily.sans,
        ],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-foreground)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        ring: "var(--color-ring)",
        brand: {
          DEFAULT: "var(--color-brand)",
          soft: "var(--color-brand-soft)",
          strong: "var(--color-brand-strong)",
        },
        accent: "var(--color-accent)",
        success: "var(--color-data-success)",
        warning: "var(--color-data-warning)",
        danger: "var(--color-data-error)",
        info: "var(--color-data-info)",
      },
      backgroundImage: {
        "shell-grid":
          "linear-gradient(90deg, var(--shell-grid-color) 1px, transparent 1px), linear-gradient(0deg, var(--shell-grid-color) 1px, transparent 1px)",
        "shell-aurora": "var(--shell-gradient)",
      },
      boxShadow: {
        brand: "var(--shell-card-glow)",
        card: "var(--shadow-1)",
        panel: "var(--shadow-2)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s var(--ease-out) forwards",
        "scale-in": "scale-in 0.45s var(--ease-out) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
