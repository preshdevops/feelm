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
        // Cinematic color palette
        cinema: {
          950: '#0a0b14',
          900: '#0f1022',
          800: '#161833',
          700: '#1e2044',
          600: '#272a55',
          500: '#363a6e',
        },
        accent: {
          50: '#fff9e6',
          100: '#ffeeb3',
          200: '#ffe380',
          300: '#ffd84d',
          400: '#ffcd1a',
          500: '#e6b400',
          600: '#b38c00',
          700: '#806400',
          800: '#4d3c00',
          900: '#1a1400',
        },
        gold: {
          DEFAULT: '#d4a843',
          light: '#f0d078',
          dark: '#a67c2e',
          glow: '#ffd700',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cinema-gradient': 'linear-gradient(135deg, #0a0b14 0%, #161833 50%, #0f1022 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #a67c2e, #ffd700, #d4a843, #ffd700, #a67c2e)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 168, 67, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 168, 67, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'gold': '0 0 15px rgba(212, 168, 67, 0.3)',
        'gold-lg': '0 0 30px rgba(212, 168, 67, 0.4)',
        'cinema': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'cinema-lg': '0 16px 64px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
