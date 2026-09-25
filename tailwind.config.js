/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            whiz: '#00A86B',
            emerald: '#00C853',
            glow: '#10B981',
          },
          accent: {
            orange: '#FF5E1E',
            flame: '#F97316',
            amber: '#F59E0B',
            red: '#EF4444',
          },
          dark: {
            950: '#04070C',
            900: '#070C14',
            850: '#0B121E',
            800: '#10192A',
            750: '#162238',
            700: '#1E2D4A',
            card: 'rgba(15, 23, 42, 0.65)',
            glass: 'rgba(7, 12, 20, 0.75)',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(at 10% 20%, rgba(0, 168, 107, 0.15) 0px, transparent 50%), radial-gradient(at 90% 10%, rgba(255, 94, 30, 0.12) 0px, transparent 50%), radial-gradient(at 50% 80%, rgba(16, 185, 129, 0.08) 0px, transparent 60%)',
        'card-glow': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-spin': 'glowSpin 10s linear infinite',
        'marquee': 'marquee 30s linear infinite',
        'marquee-reverse': 'marqueeReverse 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeReverse: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        }
      },
      boxShadow: {
        'neon-green': '0 0 25px -5px rgba(0, 168, 107, 0.4), 0 0 10px -3px rgba(0, 168, 107, 0.3)',
        'neon-orange': '0 0 25px -5px rgba(255, 94, 30, 0.4), 0 0 10px -3px rgba(255, 94, 30, 0.3)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 50px -10px rgba(0, 168, 107, 0.2)',
      }
    },
  },
  plugins: [],
}
