/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFFBF5',
        darkslate: '#2E2A4A',
        // Warna 7 Modul PRD.md § 6 & Design.md § 2.2
        modCerita: '#8B5CF6',
        modArab: '#0F766E',
        modIndo: '#EF4444',
        modInggris: '#14B8A6',
        modIpa: '#38BDF8',
        modIps: '#FB923C',
        modMath: '#6366F1',
      },
      fontFamily: {
        rounded: ['Fredoka', 'Quicksand', 'Nunito', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4s ease-in-out infinite',
        'float-fast': 'float 2.5s ease-in-out infinite',
        'pulse-gentle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 1s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        }
      }
    },
  },
  plugins: [],
}
