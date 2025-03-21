const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e8f1ff",
          100: "#cfe0ff",
          200: "#a3c2ff",
          300: "#74a2ff",
          400: "#4b87ff",
          500: "#256eff",
          600: "#1e5be6", // 여기!
          700: "#1a4ac2",
          800: "#173fa0",
          900: "#122e77",
        },
      },
    },
  },
  plugins: [flowbite.plugin()],
};
