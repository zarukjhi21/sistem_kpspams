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
          navy: {
            50: '#F0F7FF',
            100: '#E0EFFF',
            200: '#BAE0FD',
            300: '#7DD3FC',
            400: '#38BDF8',
            500: '#0284C7',
            600: '#0369A1',
            700: '#1D4ED8',
            800: '#1E3A8A',
            900: '#0F172A',
            950: '#080D1A',
          },
          aqua: {
            50: '#F0FDFA',
            100: '#E0F2FE',
            200: '#BAE6FD',
            400: '#38BDF8',
            500: '#0EA5E9',
            600: '#0284C7',
            700: '#0369A1',
          },
          // Alias for seamless backward compatibility
          maroon: {
            50: '#F0F7FF',
            100: '#E0EFFF',
            500: '#0284C7',
            700: '#1E3A8A',
            800: '#0F172A',
            900: '#0B132B',
            950: '#070B18',
          },
          gold: {
            50: '#F0F9FF',
            100: '#E0F2FE',
            400: '#38BDF8',
            500: '#0EA5E9',
            600: '#0284C7',
          },
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          sidebar: '#0A0F1D',
          border: '#E2E8F0',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          danger: '#E11D48',
          info: '#0284C7',
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
