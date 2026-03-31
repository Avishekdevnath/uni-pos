import { defineConfig } from 'vite';

// https://vitejs.dev/config
// Tailwind v4 handled via postcss.config.cjs (avoids ESM-only @tailwindcss/vite issue with Electron Forge)
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});
