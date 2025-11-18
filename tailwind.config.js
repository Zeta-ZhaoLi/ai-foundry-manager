/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        foreground: '#e5e7eb',
        border: '#1f2937',
        muted: {
          DEFAULT: '#111827',
          foreground: '#9ca3af',
        },
        primary: {
          DEFAULT: '#0ea5e9',
          foreground: '#f9fafb',
        },
        secondary: {
          DEFAULT: '#22c55e',
          foreground: '#022c22',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

