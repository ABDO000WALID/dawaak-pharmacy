import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0F766E',
          emerald: '#00A86B',
          mint: '#10B981',
          azure: '#0284C7',
          amber: '#D97706',
          danger: '#DC2626',
        },
        health: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E', // Primary medical teal
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'Segoe UI', 'Tahoma', 'sans-serif'],
        sans: ['Cairo', 'Inter', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      lineHeight: {
        'relaxed-cairo': '1.625',
        'loose-cairo': '1.75',
      },
      boxShadow: {
        'medical': '0 4px 20px -2px rgba(15, 118, 110, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'medical-lg': '0 10px 25px -3px rgba(15, 118, 110, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
