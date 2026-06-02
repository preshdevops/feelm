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
          950: '#000000', // Pure pitch black base
          900: '#080808', // Card hover / search bar black
          800: '#121212', // Card background / base panel
          700: '#1c1c1c', // Solid dark borders
          600: '#2a2a2a', // Selected border highlight
          500: '#525252', // Muted text / label color
          400: '#a3a3a3', // Secondary body text
          300: '#d4d4d4', // Regular body text
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
