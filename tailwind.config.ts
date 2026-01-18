import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 10px 30px rgba(16, 24, 40, 0.08)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9eeff',
          200: '#b6ddff',
          300: '#80c6ff',
          400: '#46a6ff',
          500: '#1c86ff',
          600: '#0c66e4',
          700: '#0b51b6',
          800: '#0f458f',
          900: '#123c72',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
