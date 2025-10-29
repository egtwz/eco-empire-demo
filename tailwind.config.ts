import type { Config } from 'tailwindcss'

export default {
  content: ['index.html', 'src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        text: 'var(--text)',
        card: 'var(--card)',
      },
      borderRadius: {
        '2xl': '1rem'
      },
      boxShadow: {
        'md': '0 4px 12px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
} satisfies Config






