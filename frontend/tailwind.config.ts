export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0F1E',
          secondary: '#0D1626', 
          card: '#111827',
          elevated: '#1A2333',
          hover: '#1E2D42',
          input: '#0D1626',
        },
        primary: { DEFAULT: '#2563EB', light: '#3B82F6', dark: '#1D4ED8', muted: '#1E3A5F' },
        accent: { DEFAULT: '#F07322', light: '#FEF0E6', muted: '#7C3A0A' },
        success: { DEFAULT: '#10B981', muted: '#064E3B' },
        warning: { DEFAULT: '#F59E0B', muted: '#78350F' },
        error: { DEFAULT: '#EF4444', muted: '#7F1D1D' },
        text: { primary: '#FFFFFF', secondary: '#94A3B8', muted: '#475569', accent: '#2563EB' },
        border: { DEFAULT: '#1E293B', light: '#334155', active: '#2563EB' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
