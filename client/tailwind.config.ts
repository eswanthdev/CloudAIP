import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a0e27',
        card: '#111638',
        'card-hover': '#161d45',
        border: '#1e2a5a',
        'border-light': '#2a3a6e',
        cyan: {
          DEFAULT: '#00d4ff',
          50: '#e6fbff',
          100: '#b3f3ff',
          200: '#80ebff',
          300: '#4de3ff',
          400: '#1adbff',
          500: '#00d4ff',
          600: '#00a9cc',
          700: '#007f99',
          800: '#005466',
          900: '#002a33',
        },
        teal: {
          DEFAULT: '#0891b2',
          50: '#e6f7fa',
          100: '#b3e7f0',
          200: '#80d7e6',
          300: '#4dc7dc',
          400: '#1ab7d2',
          500: '#0891b2',
          600: '#06748e',
          700: '#05576b',
          800: '#033a47',
          900: '#021d24',
        },
        purple: {
          DEFAULT: '#7c3aed',
          50: '#f1e8fd',
          100: '#d4baf9',
          200: '#b78cf5',
          300: '#9a5ef1',
          400: '#7c3aed',
          500: '#6320d4',
          600: '#4e19a8',
          700: '#3a137e',
          800: '#270c54',
          900: '#13062a',
        },
        navy: {
          50: '#e8eaf5',
          100: '#c0c4e0',
          200: '#989ecb',
          300: '#7078b6',
          400: '#4852a1',
          500: '#2d3580',
          600: '#232a66',
          700: '#1a204d',
          800: '#111638',
          900: '#0a0e27',
        },
        'text-white': '#ffffff',
        'text-muted': '#94a3b8',
        'text-light': '#cbd5e1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-cyan': 'linear-gradient(135deg, #00d4ff, #0891b2)',
        'gradient-purple': 'linear-gradient(135deg, #7c3aed, #a855f7)',
        'gradient-mixed': 'linear-gradient(135deg, #00d4ff, #7c3aed)',
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 212, 255, 0.15)',
        'purple-glow': '0 0 20px rgba(124, 58, 237, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
