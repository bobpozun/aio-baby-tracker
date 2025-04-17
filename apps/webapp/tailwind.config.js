/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}', // Scan all relevant files in the src directory
  ],
  theme: {
    extend: {
      // You can extend the default Tailwind theme here if needed
      // For example, adding custom colors, fonts, etc.
      // colors: {
      //   'brand-primary': '#a88b79',
      //   'brand-secondary': '#d4b8a7',
      //   'brand-accent': '#e3d1c1',
      //   'brand-background': '#efe6d7',
      //   'brand-text': '#5c534d',
      //   'brand-heading': '#4a413b',
      // },
      // fontFamily: {
      //   sans: ['Nunito Sans', 'sans-serif'],
      //   heading: ['Poppins', 'sans-serif'],
      // }
    },
  },
  plugins: [],
};
