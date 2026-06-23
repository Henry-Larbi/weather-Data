/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // A calm, study-friendly palette keyed off Python's brand blue/yellow.
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#3776ab',
          600: '#2f6391',
          700: '#274f74',
        },
        accent: {
          500: '#ffd43b',
          600: '#f5c518',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
