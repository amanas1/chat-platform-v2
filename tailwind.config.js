/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: 'var(--color-primary, #bc6ff1)',
        secondary: 'var(--color-secondary, #ff007c)',
      },
      animation: {
        'marquee': 'marquee 40s linear infinite',
        'marquee-slow': 'marquee 80s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'dance': 'dance 0.6s ease-in-out infinite alternate',
        'head-bop': 'headBop 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 1.5s ease-in-out infinite',
        'fade-cycle': 'fadeCycle 10s ease-in-out infinite',
        'vertical-marquee': 'marquee-vertical 20s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100vw)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-vertical': {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        dance: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateY(-4px) rotate(2deg)' },
        },
        headBop: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(3px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px var(--color-primary), 0 0 30px var(--color-primary)', opacity: '1' },
          '50%': { boxShadow: '0 0 40px var(--color-primary), 0 0 70px var(--color-primary)', opacity: '0.9' }
        },
        fadeCycle: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '30%': { opacity: '1', transform: 'translateY(0)' },
          '70%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' }
        }
      }
    },
  },
  plugins: [],
}
