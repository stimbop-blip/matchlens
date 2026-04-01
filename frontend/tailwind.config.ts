import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--app-bg)",
        surface: "var(--surface-1)",
        accent: "var(--accent-primary)",
      },
      boxShadow: {
        premium: "0 18px 36px rgba(0, 0, 0, 0.24)",
      },
      borderRadius: {
        premium: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
