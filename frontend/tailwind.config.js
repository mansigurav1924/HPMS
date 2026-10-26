/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#EEF0FF', 100: '#E0E4FF', 200: '#C7CDFE', 300: '#A5ADFC',
          400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81',
        },
        brand: {
          navy: '#0F1535',
          // NOTE: legacy token name kept for compatibility; value is now the primary indigo.
          orange: '#6366F1',
          sky: '#38BDF8',
          yellow: '#FBBF24',
          purple: '#4F46E5',
          page: '#F5F6FF',
        },
        dash: {
          // Sidebar background (deep navy)
          purple: '#0B1230',
          sky: '#818CF8',
          yellow: '#FBBF24',
          bg: '#F3F4FF',
        }
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(15, 21, 53, 0.06)',
        float: '0 14px 36px -8px rgba(15, 21, 53, 0.18)',
        glow: '0 10px 28px -6px rgba(99, 102, 241, 0.45)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pop': 'pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
