import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          dark: "#141414",
          card: "#1C1C1C",
          border: "#2A2A2A",
          rose: "#D4A0A0",
          "rose-light": "#E8C4C4",
          nude: "#C9A89A",
          "nude-light": "#D4BEB4",
          white: "#F5F5F5",
          muted: "#8A8A8A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
