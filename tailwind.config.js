/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#34d399',
          secondary: '#f97316',
          // darkBg: '#1C2039',
          darkBg: '#121422',
          darkBgAccent: '#262B49',
          // darkBgAccent: '#1C1E2F',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
