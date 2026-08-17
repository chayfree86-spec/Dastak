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
        brand: {
          blue: '#2845D6',
          orange: '#F97316',
          dark: '#102A43',
          secondary: '#64748B',
          light: '#F8FAFC',
          border: '#E2E8F0',
        },
        slate: {
          750: '#1e293b',
          850: '#0f172a',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(16, 42, 67, 0.05)',
        sm: '0 1px 3px 0 rgba(16, 42, 67, 0.08), 0 1px 2px -1px rgba(16, 42, 67, 0.08)',
        md: '0 4px 6px -1px rgba(16, 42, 67, 0.08), 0 2px 4px -2px rgba(16, 42, 67, 0.08)',
        lg: '0 10px 15px -3px rgba(16, 42, 67, 0.08), 0 4px 6px -4px rgba(16, 42, 67, 0.08)',
        xl: '0 20px 25px -5px rgba(16, 42, 67, 0.08), 0 8px 10px -6px rgba(16, 42, 67, 0.08)',
      },
    },
  },
  plugins: [],
}
