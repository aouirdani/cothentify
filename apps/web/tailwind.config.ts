import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          50: 'var(--accent-50)',
          600: 'var(--accent-600)'
        },
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)'
        },
        bg: {
          DEFAULT: 'var(--bg)',
          subtle: 'var(--bg-subtle)'
        },
        border: 'var(--border)',
        ring: 'var(--ring)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        success: 'var(--success)'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)',
        card: '0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.06)',
        cardHover: '0 10px 20px rgba(16,24,40,0.10), 0 2px 6px rgba(16,24,40,0.08)'
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem'
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1280px',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
