/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paper — warm cream backgrounds (SUNNY base)
        ivory: {
          50: '#FBF4E8',
          100: '#F8EFDF',
          200: '#F4E9D5',
          300: '#EDE0C6',
          400: '#E3D1AC',
          500: '#D6BE8D',
          600: '#BFA672',
          700: '#9E8557',
          800: '#7C6742',
          900: '#5E4E32',
        },
        // Ink — warm near-black: actions, headings, footer
        ink: {
          50: '#F6F3EE',
          100: '#E9E3D9',
          200: '#D5CBBE',
          300: '#BAAE9C',
          400: '#8A7C68',
          500: '#6B5F4E',
          600: '#4A4036',
          700: '#3B3227',
          800: '#2A231A',
          900: '#1E1710',
        },
        // Hairline warm neutral — borders, dividers, secondary text
        stone: {
          50: '#F8F5EF',
          100: '#F1EBE0',
          200: '#E7DFD0',
          300: '#D8CCB7',
          400: '#C0B19A',
          500: '#A2937C',
          600: '#857763',
          700: '#6A5F4F',
          800: '#4F473B',
          900: '#3A342B',
        },
        // Sun — the vivid accent
        champagne: {
          50: '#FFF4ED',
          100: '#FFE6D9',
          200: '#FFCDB2',
          300: '#FFAE85',
          400: '#FF8A50',
          500: '#FF5A1F',
          600: '#E8430D',
          700: '#C43507',
          800: '#9D2A06',
          900: '#7A2105',
        },
        // Amber — warm secondary accent
        mink: {
          50: '#FFF9F0',
          100: '#FFF0DC',
          200: '#FFE3C0',
          300: '#FFD19C',
          400: '#FFB25E',
          500: '#F89E42',
          600: '#E6862B',
          700: '#C56C1E',
          800: '#9E5518',
          900: '#7C4213',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', '"Helvetica Neue"', 'sans-serif'],
        mono: ['"Space Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        card: '0 24px 48px -20px rgba(30,23,16,.28)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'marquee': 'marquee 30s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
