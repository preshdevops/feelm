/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Flat, editorial dark theme (A24 meets Letterboxd style)
        cinema: {
          950: 'var(--cinema-950)',
          900: 'var(--cinema-900)',
          800: 'var(--cinema-800)',
          700: 'var(--cinema-700)',
          600: 'var(--cinema-600)',
          500: 'var(--cinema-500)',
          400: 'var(--cinema-400)',
          300: 'var(--cinema-300)',
        },
        // Accent color (warm amber, used sparingly)
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        // Flat filmic look - no heavy glowing shadows
        'none': 'none',
      },
    },
  },
  plugins: [],
}
