/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2E4036",
        accent: "#CC5833",
        background: "#F2F0E9",
        dark: "#1A1A1A",
        brandBlue: "#0B3C8F",
        brandBlueLight: "#2563EB",
        brandBlueDark: "#092047",
        brandBg: "#F8FAFC",
      },
      fontFamily: {
        heading: ['var(--font-heading)', "sans-serif"],
        body: ['var(--font-body)', "sans-serif"],
        drama: ['var(--font-drama)', "serif"],
        mono: ['var(--font-mono)', "monospace"],
      },
      borderRadius: {
        '2rem': '2rem',
        '3rem': '3rem',
        '4rem': '4rem',
      },
      transitionTimingFunction: {
        'magnetic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-up': 'slide-up 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}
