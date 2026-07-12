import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router)/,
            },
            {
              name: 'supabase-vendor',
              test: /node_modules[\\/]@supabase/,
            },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
})
