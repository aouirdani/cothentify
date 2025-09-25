import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: ['class'],
  content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A56DB',
          600: '#1E3A8A',
        },
      },
      boxShadow: {
        soft: '0 10px 40px rgba(0,0,0,.25)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#1A56DB 0%,#7C3AED 100%)',
        'brand-radial': 'radial-gradient(80% 80% at 70% 10%, rgba(124,58,237,.35), rgba(26,86,219,.15) 70%, transparent)',
      },
    },
  },
  plugins: [],
};
export default config;
