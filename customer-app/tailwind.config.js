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
        dastak: {
          primary: '#2845D6',
          'primary-dark': '#1E3A8A',
          accent: '#F97316',
          'accent-hover': '#EA580C',
          dark: '#0F172A',
          'card-dark': '#1E293B',
          'border-dark': '#334155',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        english: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        hindi: ['"Rubik"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 25px -5px rgba(40, 69, 214, 0.35)',
        'glow-accent': '0 0 25px -5px rgba(249, 115, 22, 0.35)',
      },
    },
  },
  plugins: [],
}
