import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        mica: '0 2px 20px -10px rgba(15, 23, 42, 0.22)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, rgb(203 213 225 / 0.9) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
    },
  },
  plugins: [],
} satisfies Config;
