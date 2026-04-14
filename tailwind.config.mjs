/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Quaker Valley palette
        qvgold: {
          DEFAULT: '#FFB81C', // PMS 1235
          50: '#FFF7E6',
          100: '#FFEDC2',
          500: '#FFB81C',
          600: '#E0A018',
          700: '#B07D0E',
        },
        qvblack: {
          DEFAULT: '#0A0A0A',
          900: '#0A0A0A',
          800: '#1A1A1A',
          700: '#2A2A2A',
        },
      },
      fontFamily: {
        display: ['"Oswald"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
