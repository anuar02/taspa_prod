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
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"]
      },
      colors: {
        primary: "#5B21B6",
        "primary-light": "#8B5CF6",
        bg: "#F8F7F4",
        surface: "#FFFFFF",
        text: "#1C1917",
        muted: "#78716C",
        border: "#E7E5E4",
        danger: "#DC2626"
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px"
      },
      boxShadow: {
        card: "0 4px 24px rgba(28,25,23,0.08)",
        "card-hover": "0 8px 32px rgba(28,25,23,0.14)",
        nav: "0 2px 16px rgba(28,25,23,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
