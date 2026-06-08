/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Light mode - brown palette
        primary: {
          DEFAULT: '#8B5E3C',
          50: '#FAF5EF',
          100: '#F5E6D3',
          200: '#E8CDA9',
          300: '#D6B08A',
          400: '#B98760',
          500: '#8B5E3C',
          600: '#6F4A2F',
          700: '#523724',
          800: '#392619',
          900: '#1E1A17',
        },
        secondary: '#D6B08A',
        accent: '#F5E6D3',

        // Dark mode tokens
        'dark-bg': '#1E1A17',
        'dark-card': '#2A241F',
        'dark-border': '#3A322B',
        'dark-text': '#F5E6D3',
        'dark-muted': '#A89684',

        // Semantic
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        info: '#0EA5E9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(139, 94, 60, 0.08), 0 1px 2px rgba(139, 94, 60, 0.04)',
        'card-dark': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
