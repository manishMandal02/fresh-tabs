/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#34d399',
          secondary: '#f97316',
          background: '#19212c',
        },
      },
    },
  },
  plugins: [],
};
