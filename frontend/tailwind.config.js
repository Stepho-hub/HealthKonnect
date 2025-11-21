/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary (60%): Cream/Off-white
        primary: {
          50: '#fefefe',
          100: '#fdfdfb',
          200: '#faf9f5',
          300: '#f5f4ef',
          400: '#f0ede4',
          500: '#e8e3d6', // Main cream color
          600: '#d4cdb8',
          700: '#b8b092',
          800: '#9c9374',
          900: '#807656',
        },
        // Secondary (30%): Professional Blue
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main blue color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Accent (10%): Healthcare Green
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Main green color
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
    },
  },
  plugins: [],
};
