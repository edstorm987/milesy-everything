import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
        },
      },
      fontFamily: {
        heading: ["var(--brand-font-heading)", "ui-serif", "Georgia", "serif"],
        body: ["var(--brand-font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "var(--brand-radius)",
      },
    },
  },
};

export default config;
