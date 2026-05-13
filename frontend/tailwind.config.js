/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // Surface tokens (light theme)
        bg: "#f6f8fb",
        surface: "#eef2f7",
        card: "#ffffff",
        cardAlt: "#f8fafc",
        // Text
        ink: "#0f172a",
        "ink-muted": "#475569",
        "ink-faint": "#94a3b8",
        // Borders
        line: "#e4e9f1",
        "line-strong": "#cbd5e1",
        // Sidebar
        sidebar: "#0e1c33",
        "sidebar-text": "#cbd5e1",
        // Navy accent (default)
        navy: {
          50: "#f1f4fa",
          100: "#dde5f1",
          200: "#bccae3",
          300: "#8ea4cb",
          400: "#5d7eb1",
          500: "#3a5d96",
          600: "#1e3a5f",
          700: "#162d4a",
          800: "#111f33",
          900: "#0a1426",
        },
        // Semantic
        success: "#16a34a",
        warn: "#d97706",
        danger: "#dc2626",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,.6) inset, 0 4px 16px rgba(15,23,42,.06)",
        elevated:
          "0 1px 0 rgba(255,255,255,.6) inset, 0 12px 32px rgba(15,23,42,.08)",
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};
