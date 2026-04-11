import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7C3AED",
        "primary-light": "#A78BFA",
        bg: "#FFFFFF",
        surface: "#F9FAFB",
        text: "#111827",
        muted: "#6B7280",
        border: "#E5E7EB",
        danger: "#EF4444"
      },
      borderRadius: {
        md: "12px",
        lg: "16px"
      },
      boxShadow: {
        card: "0 18px 45px -24px rgba(17, 24, 39, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
