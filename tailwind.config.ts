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
          bg: "#FFFFFF",
          surface: "#FAFAF8",
          border: "#EDE8E8",
          rose: "#C84B8C",
          "rose-light": "#F3D9EC",
          "rose-dark": "#A33A76",
          violet: "#9B6BB5",
          "violet-light": "#EDE2F5",
          muted: "#9C8B88",
          text: "#1E1A1A",
          "text-2": "#5A4E4C",
          subtle: "#FBF2F7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Montserrat", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
