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
        primary: {
          50: "#e6f6f1",
          100: "#c5ece2",
          200: "#a0ddcf",
          300: "#73c7ba",
          400: "#44b3a5",
          500: "#1fa89c",
          600: "#199287",
          700: "#137b72",
          800: "#0d655d",
          900: "#074e48",
        },
        secondary: {
          50: "#f0f5ff",
          100: "#d6e4ff",
          200: "#adc8ff",
          300: "#84a9ff",
          400: "#6690ff",
          500: "#3366ff", // 포인트 대비용 (청량한 블루)
          600: "#254eda",
          700: "#1939b7",
          800: "#102693",
          900: "#091a7a",
        },
        success: {
          50: "#e6f9ed",
          100: "#c3efd7",
          200: "#99e5be",
          300: "#6fdba5",
          400: "#4ed494",
          500: "#2ecc83",
          600: "#25b371",
          700: "#1d995f",
          800: "#167f4d",
          900: "#0f663d",
        },
        info: {
          50: "#e6f6ff",
          100: "#bfe9ff",
          200: "#80d4ff",
          300: "#40beff",
          400: "#1ab0ff",
          500: "#009eff", // 밝고 선명한 하늘색
          600: "#0085e6",
          700: "#006dc2",
          800: "#0055a0",
          900: "#003e77",
        },
        warning: {
          50: "#fff8e6",
          50: "#e6f9f7", // 아주 연한 민트+하늘
          100: "#cbf2ee", // 연한 에메랄드톤
          200: "#a6e8e0",
          300: "#76d8ce",
          400: "#47c7bc",
          500: "#2abaae", // 메인 강조용 – 산뜻한 청록
          600: "#1aa99d", // hover, active
          700: "#15988d", // 딥 포인트 (어두워도 탁하지 않음)
          800: "#10887d",
          900: "#0c7269", // 가장 어두운 톤 (사용 빈도 낮음)
        },
        danger: {
          50: "#ffecec",
          100: "#ffcfcf",
          200: "#ff9e9e",
          300: "#ff6e6e",
          400: "#ff4747",
          500: "#ff1f1f", // 강렬한 경고
          600: "#e61a1a",
          700: "#c21515",
          800: "#a01010",
          900: "#770c0c",
        },
      },
    },
  },
  plugins: [flowbite.plugin()],
};
