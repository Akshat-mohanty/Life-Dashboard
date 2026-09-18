/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#f0fbfd',
          100: '#dcf4f8',
          200: '#bcecf4',
          300: '#9bdee8', // Exact base user color
          400: '#68c5d4',
          500: '#3faab9',
          600: '#237d8d',
          700: '#1b6370',
          800: '#154f59',
          900: '#0f3840',
        },
      },
      boxShadow: {
        'glow-sm': '0 2px 10px -2px rgba(35, 125, 141, 0.25)',
        'glow-md': '0 4px 20px -2px rgba(35, 125, 141, 0.3)',
        'card-clean': '0 2px 12px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
