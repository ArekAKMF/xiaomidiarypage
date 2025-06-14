/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2196F3',
        secondary: '#4CAF50',
        danger: '#f44336',
      },
    },
  },
  plugins: [],
} 