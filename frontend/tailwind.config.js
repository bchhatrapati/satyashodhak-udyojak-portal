/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {

      /* =========================
         COLOR SYSTEM (SEMANTIC)
         ========================= */

      colors: {

        /* Brand Identity */
        brand: {
          primary: "#003366",        // Trust Navy
          primaryHover: "#00264D",
          secondary: "#005BB5",      // Action Blue
          secondaryHover: "#004999",
        },

        /* Transaction States */
        transaction: {
          credit: "#1B5E20",         // Deposits
          creditBg: "#E8F5E9",
          debit: "#B71C1C",          // Withdrawals
          debitBg: "#FFEBEE",
          pending: "#F57C00",
          pendingBg: "#FFF3E0",
        },

        /* Layout Surfaces */
        app: {
          background: "#F4F7FA",
          surface: "#FFFFFF",
          border: "#D6DEE6",
          muted: "#E5EAF0",
        },

        /* Text Hierarchy */
        text: {
          primary: "#1A1A1A",
          secondary: "#4A5568",
          muted: "#718096",
          inverse: "#FFFFFF",
        },

      },

      /* =========================
         TYPOGRAPHY
         ========================= */

      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        data: ['Inter', 'monospace'], // For aligned numbers
      },

      fontSize: {
        headline: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        subheadline: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px' }],
        small: ['14px', { lineHeight: '20px' }],
        data: ['18px', { lineHeight: '28px', fontWeight: '600' }],
      },

      /* =========================
         ACCESSIBILITY
         ========================= */

      minHeight: {
        touch: '44px',
      },

      minWidth: {
        touch: '44px',
      },

      borderRadius: {
        card: '12px',
      },

      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.05)',
      },

    },
  },

  plugins: [],
};