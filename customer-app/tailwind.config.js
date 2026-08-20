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
          primary: '#FF5200',
          'primary-dark': '#E04800',
          accent: '#113BD0',
          'accent-hover': '#1E3A8A',
          dark: '#113BD0',
          'card-dark': '#1E293B',
          'border-dark': '#334155',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        english: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        hindi: ['"Rubik"', '"Poppins"', '"Mukta"', '"Noto Sans Devanagari"', '"Hind"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 25px -5px rgba(255, 82, 0, 0.35)',
        'glow-blue': '0 0 25px -5px rgba(40, 69, 214, 0.35)',
      },
    },
  },
  plugins: [],
}
