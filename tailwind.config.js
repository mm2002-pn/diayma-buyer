/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette Diayma — chaleur boutique sénégalaise, contraste raffiné
        cream: {
          DEFAULT: '#F5EDD9',
          50:  '#FBF6EB',
          100: '#F5EDD9',
          200: '#EADFC1',
          300: '#DCCEA6',
        },
        forest: {
          DEFAULT: '#1F4D3A',
          50:  '#EAF0EC',
          100: '#D2DFD5',
          400: '#2E6449',
          600: '#173A2C',
          700: '#0F2A1F',
          800: '#0A1E17',
        },
        gold: {
          DEFAULT: '#B8945F',
          50:  '#F6EFDC',
          100: '#EEE0B7',
          400: '#C6A961',
          600: '#9B7C4F',
        },
        clay: {
          DEFAULT: '#C24E2F',
          50:  '#FBEBE5',
        },
        ink: '#1A1815',
        brand: {
          DEFAULT: '#0066FF',
          hover:   '#0052CC',
          light:   '#EFF6FF',
          50:      '#EFF6FF',
        },
        // Paiements
        orange_money: '#F58220',
        wave:         '#1BC7C7',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.06)',
        card: '0 8px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
