/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f5f3',
          100: '#e7e5e4',
          600: '#6b5b52',
          800: '#3e322b'
        }
      }
    }
  },
  plugins: []
}
