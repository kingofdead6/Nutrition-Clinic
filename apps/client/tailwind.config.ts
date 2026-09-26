import type { Config } from 'tailwindcss';

/**
 * RTL rule: layout uses logical utilities only (ms/me/ps/pe/start/end/text-start),
 * never ml/mr/pl/pr/left/right — enforced by ESLint (see eslint.config.js).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d', // sidebar
          950: '#052e16',
        },
        /** Soft KPI card backgrounds from the mockup. */
        pastel: {
          green: '#e7f6ec',
          blue: '#e6f0fb',
          purple: '#efe9f8',
          red: '#fcebea',
          orange: '#fdf0e3',
          yellow: '#fdf6dc',
        },
        /** Status colors (patient / appointment). */
        status: {
          green: '#15803d',
          blue: '#1d4ed8',
          orange: '#c2410c',
          yellow: '#a16207',
          red: '#b91c1c',
          gray: '#4b5563',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 40 / 0.05), 0 1px 3px rgb(16 24 40 / 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
