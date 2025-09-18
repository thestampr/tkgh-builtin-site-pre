import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2997b6",
        secondary: "#0E2A47",
        divider: "#51545A",
      }
    }
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;