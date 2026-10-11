/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FBFAF8",
        fg: "#383D4E",
        surface: "#F0EDE8",
        card: "#FFFFFF",
        accent: {
          DEFAULT: "#B21E3B",
          hover: "#981730",
          soft: "#F7E7EB",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      boxShadow: {
        card: "0 1px 2px rgba(56,61,78,0.04), 0 4px 16px rgba(56,61,78,0.06)",
      },
    },
  },
  plugins: [],
};
