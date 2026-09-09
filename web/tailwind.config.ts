import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 領域（ドメイン）の色: work / life / rest
        work: '#0d9488',
        life: '#d97706',
        rest: '#6366f1',
      },
    },
  },
  plugins: [],
} satisfies Config
