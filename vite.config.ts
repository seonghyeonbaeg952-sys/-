import { defineConfig, type Connect } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import deployment from './vercel.json'

// Exercise the deployment policy locally too; keep one canonical definition.
const securityHeaders = Object.fromEntries(deployment.headers.filter(rule => rule.source === '/(.*)').flatMap(rule =>
  rule.headers.map(({ key, value }) => [key, value])))

const fontHeaderRules = deployment.headers.flatMap(rule => {
  const link = rule.headers.find(({ key }) => key === 'Link')
  return link ? [{
    path: new RegExp('^' + rule.source + '$'),
    excludedQueries: (rule.missing ?? []).map(({ key }) => key),
    value: link.value,
  }] : []
})

function useFontHeaders({ middlewares }: { middlewares: Connect.Server }) {
  middlewares.use((req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const rule = fontHeaderRules.find(({ path, excludedQueries }) =>
      path.test(url.pathname) && !excludedQueries.some(key => url.searchParams.has(key)))
    if (rule) res.setHeader('Link', rule.value)
    // A missing WOFF2 should return 404 so browsers never try to decode the SPA document.
    if (url.pathname === '/fonts' || url.pathname.startsWith('/fonts/')) {
      req.headers.accept = 'application/octet-stream'
    }
    next()
  })
}

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
  plugins: [react(), tailwindcss(), {
    name: 'smyc-local-font-headers',
    configureServer: useFontHeaders,
    configurePreviewServer: useFontHeaders,
  }],
  preview: { headers: securityHeaders },
  server: {
    headers: securityHeaders,
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
  },
})
