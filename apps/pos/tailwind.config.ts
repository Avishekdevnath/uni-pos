import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['DM Mono', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        surface3: 'var(--surface3)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'accent-dim': 'var(--accent-dim)',
        pos: {
          green: 'var(--green)',
          'green-dim': 'var(--green-dim)',
          red: 'var(--red)',
          'red-dim': 'var(--red-dim)',
          amber: 'var(--amber)',
          blue: 'var(--blue)',
          'blue-dim': 'var(--blue-dim)',
        },
        text1: 'var(--text1)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        border: 'var(--border)',
        border2: 'var(--border2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
