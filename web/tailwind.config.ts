import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 領域（ドメイン）の色: work / life / rest
        work: '#0f766e',
        life: '#d97706',
        rest: '#475569',
      },
    },
  },
  plugins: [],
} satisfies Config
