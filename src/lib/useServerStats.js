import { useEffect, useState } from 'react'

/**
 * Live player and Discord counts from /api/server-stats (Netlify Function in
 * production, Vite middleware in dev). Each source can fail on its own; the
 * caller renders only what came back, nothing is ever invented.
 */
export function useServerStats(intervalMs = 60_000) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/server-stats', { headers: { Accept: 'application/json' } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => alive && data && setStats(data))
        .catch(() => {})
    load()
    const id = setInterval(load, intervalMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [intervalMs])

  return stats
}
