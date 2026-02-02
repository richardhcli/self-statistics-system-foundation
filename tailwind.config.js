export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{html,js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-red-500',
    'hover:bg-red-600',
    'bg-indigo-600',
    'hover:bg-indigo-700',
    'scale-105',
    'opacity-50',
    'cursor-not-allowed',
    'grayscale',
    'text-indigo-500',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
