/**
 * Shared core for the live server stats.
 * Used by both the Netlify Function (production) and the Vite dev middleware.
 *
 * Neither upstream sends permissive CORS headers, so the browser cannot call
 * them directly: this runs server-side and returns clean JSON.
 */

// Current Cfx server-status endpoint. The old servers-frontend.fivem.net host
// 404s on every code; cfx-services.net is what the live server list uses.
const CFX_ENDPOINT = 'https://frontend.cfx-services.net/api/servers/single/'

// Discord's invite endpoint returns member counts for a plain invite code, 
// no bot token and no widget setup required.
const DISCORD_ENDPOINT = 'https://discord.com/api/v10/invites/'

// Cfx rejects requests without a believable user agent.
const UA = 'Mozilla/5.0 (compatible; TheHeightsStore/1.0)'

/** Accepts a bare code or a full URL (cfx.re/join/…, discord.gg/…) → bare code. */
export function normalizeCode(input) {
  if (!input) return ''
  const s = String(input).trim().split(/[?#]/)[0].replace(/\/+$/, '')
  return s.split('/').pop() || ''
}

async function fetchFivem(rawCode) {
  const code = normalizeCode(rawCode)
  if (!code) return { ok: false, error: 'no_code' }

  try {
    const res = await fetch(`${CFX_ENDPOINT}${encodeURIComponent(code)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    })
    if (!res.ok) return { ok: false, error: `upstream_${res.status}` }

    const data = (await res.json())?.Data
    if (!data) return { ok: false, error: 'no_data' }

    return {
      ok: true,
      online: true,
      players: data.clients ?? 0,
      maxPlayers: data.sv_maxclients ?? data.svMaxclients ?? 0,
      code,
    }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}

async function fetchDiscord(rawCode) {
  const code = normalizeCode(rawCode)
  if (!code) return { ok: false, error: 'no_code' }

  try {
    const res = await fetch(`${DISCORD_ENDPOINT}${encodeURIComponent(code)}?with_counts=true`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return { ok: false, error: `upstream_${res.status}` }

    const json = await res.json()
    if (!json?.guild) return { ok: false, error: 'no_guild' }

    return {
      ok: true,
      members: json.approximate_member_count ?? 0,
      online: json.approximate_presence_count ?? 0,
    }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}

/** Both sources fetched in parallel; either can fail without taking the other down. */
export async function fetchServerStats({ cfxCode, inviteCode }) {
  const [fivem, discord] = await Promise.all([fetchFivem(cfxCode), fetchDiscord(inviteCode)])
  return { fivem, discord, fetchedAt: new Date().toISOString() }
}
