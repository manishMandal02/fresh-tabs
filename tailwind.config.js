/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#34d399',
          // /* --primary-color: #ec4899; */
          // /* --primary-color: #d946ef; */
          // /* --primary-color: #f97316; */
          // /* --primary-color: #fb923c; */
          secondary: '#f97316',
          background: '#19212c',
        },
      },
    },
  },
  plugins: [],
};
