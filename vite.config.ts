import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import deployment from './vercel.json'

// Exercise the deployment policy locally too; keep one canonical definition.
const securityHeaders = Object.fromEntries(deployment.headers.flatMap(rule =>
  rule.headers.map(({ key, value }) => [key, value])))

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
  preview: { headers: securityHeaders },
  server: {
    headers: securityHeaders,
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
  },
})
