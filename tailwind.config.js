/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#100B1C",
        surface: "#16101F",
        card: "#1E1730",
        border: "#2C2340",
        "accent-soft": "#453770",
        accent: "#8B7FD4",
        "accent-strong": "#5A4A94",
        "text-primary": "#EDEAF8",
        "text-secondary": "#B7AFCB",
        "text-muted": "#756A94",
        danger: "#D46A6A",
      },
    },
  },
  plugins: [],
};
