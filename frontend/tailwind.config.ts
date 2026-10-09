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
          maroon: {
            50: '#FDF2F2',
            100: '#FCE7E7',
            500: '#B91C1C',
            700: '#8B0000',
            800: '#7B1113', // Warna Brand Utama
            900: '#52090B',
            950: '#2B0B0E',
          },
          gold: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            400: '#F59E0B',
            500: '#D4AF37', // Aksen Emas Identitas
            600: '#D97706',
          },
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          sidebar: '#0F172A',
          border: '#E2E8F0',
        },
        status: {
          success: '#059669',
          warning: '#D97706',
          danger: '#DC2626',
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
