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
        slate: {
          750: '#253248',
          850: '#151f32',
          950: '#0a0f1d',
        },
        dastak: {
          primary: '#FF5200',
          'primary-dark': '#E04800',
          accent: '#113BD0',
          blue: '#113BD0',
          'blue-dark': '#0E2FA8',
          dark: '#0B1528',
          'card-dark': '#1E293B',
          'border-dark': '#334155',
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF5200', // Primary Dastak Orange
          600: '#E04800',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          DEFAULT: '#FF5200',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#113BD0',
          600: '#113BD0',
          700: '#0E2FA8',
          DEFAULT: '#113BD0',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 25px -5px rgba(255, 82, 0, 0.35)',
        'glow-blue': '0 0 25px -5px rgba(17, 59, 208, 0.35)',
      },
      animation: {
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      }
    },
  },
  plugins: [],
}
