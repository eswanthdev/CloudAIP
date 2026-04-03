export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0a0e27', light: '#131842', dark: '#060918' },
        cyan: { DEFAULT: '#00d4ff', light: '#33ddff', dark: '#00a8cc' },
        purple: { DEFAULT: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9' }
      }
    }
  },
  plugins: []
}
