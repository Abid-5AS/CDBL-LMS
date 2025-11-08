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
      // Colors are now defined via @theme in theme.css
      // You can still use bg-text-primary, text-leave-sick, etc. in your classes
    },
  },
  plugins: [],
};

export default config;
