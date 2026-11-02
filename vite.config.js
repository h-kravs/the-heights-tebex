import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Dev-only middleware mirroring the Netlify Function at `/api/server-stats`,
 * so the live player and Discord counters work under `vite dev` without the
 * Netlify CLI. In production the same path is served by
 * netlify/functions/server-stats.mjs.
 */
function serverStatsDevApi(env) {
  return {
    name: 'server-stats-dev',
    configureServer(server) {
      server.middlewares.use('/api/server-stats', async (_req, res) => {
        try {
          const { fetchServerStats } = await import('./netlify/functions/_core.mjs')
          const stats = await fetchServerStats({
            cfxCode: env.FIVEM_SERVER_CODE || '',
            inviteCode: env.DISCORD_INVITE_CODE || '',
          })
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.statusCode = 200
          res.end(JSON.stringify(stats))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(e?.message || e) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load every env var, including the non-VITE_ ones the middleware needs.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), serverStatsDevApi(env)],
    server: { port: 5200, open: false },
    build: {
      // The lazily loaded Three.js chunk is ~890 KB raw / ~240 KB gzip by nature.
      // Three.js is reached only through the lazy NovaScene import, so it lands in
      // its own async chunk. No manualChunks: forcing a named chunk made the
      // entry modulepreload it on every route.
      chunkSizeWarningLimit: 1000,
    },
  }
})
