/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#003366",
          blue: "#005BB5",
        },
        action: {
          success: "#1B5E20",
          danger: "#B71C1C",
        },
        app: {
          bg: "#F4F7FA",
        },
      },
    },
  },
  plugins: [],
};
