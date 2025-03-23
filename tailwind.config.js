const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        background: '#fefefe',
        'gray-soft': '#f4f7f8',
        text: '#1f1f1f',
        primary: '#1f1f1f',
        'primary-hover': '#333333',
        'accent-blue': '#3b82f6',
        'accent-sky': '#0ea5e9',
        'accent-indigo': '#6366f1',
        'neon': '#4cf0ff'
      },
    },
  },
  plugins: [flowbite.plugin()],
};
