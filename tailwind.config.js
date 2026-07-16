/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette Diayma acheteur (crème + vert profond)
        cream: {
          DEFAULT: '#F5EDD9',
          50:  '#FBF6EB',
          100: '#F7EFD9',
          200: '#F1E5C3',
        },
        forest: {
          DEFAULT: '#0F5B3A',
          50:  '#E7F0EB',
          600: '#0C4A2F',
          700: '#093B25',
        },
        gold: {
          DEFAULT: '#C6A961',
          50:  '#F6EFDC',
        },
        // Actions paiement (couleurs officielles)
        orange_money: '#F58220',
        wave:         '#1BC7C7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
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
