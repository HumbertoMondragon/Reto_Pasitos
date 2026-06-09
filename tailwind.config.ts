import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: { DEFAULT: "var(--destructive)" },
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        pasitos: {
          purple:         "#7C3AED",
          "purple-dark":  "#6B21A8",
          "purple-light": "#EDE9FE",
          "purple-mid":   "#A855F7",
          "gray-light":   "#F9F7FF",
          border:         "#E9D5FF",
          green:          "#15803D",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pasitos:       "0 1px 3px rgba(124, 58, 237, 0.08)",
        "pasitos-md":  "0 4px 12px rgba(124, 58, 237, 0.15)",
        "pasitos-btn": "0 2px 8px rgba(124, 58, 237, 0.30)",
      },
    },
  },
  plugins: [],
};

export default config;
