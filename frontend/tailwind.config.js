/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-20px) scale(0.95)',
            filter: 'blur(4px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)'
          },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}
