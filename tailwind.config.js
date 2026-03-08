/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFACD',
          100: '#FFF8DC',
          200: '#EEE8CD',
          300: '#CDC8B1',
        },
        stone1: {
          fill: '#FFAEB9',
          stroke: '#CD8C95',
          win: '#8B5F65',
        },
        stone2: {
          fill: '#A2CD5A',
          stroke: '#6E8B3D',
          win: '#3A5F0B',
        },
        primary: '#1E90FF',
        primaryDark: '#1874CD',
        accent: '#836FFF',
      },
      keyframes: {
        pulse2: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px currentColor)' },
          '50%': { filter: 'drop-shadow(0 0 12px currentColor)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        pulse2: 'pulse2 2s ease-in-out infinite',
        glow: 'glow 1s ease-in-out infinite',
        scaleIn: 'scaleIn 0.15s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
