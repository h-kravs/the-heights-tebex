// ════════════════════════════════════════════════════════════════════
//  Tebex connection check
//
//      node scripts/check-tebex.mjs
//
//  Reads .env, calls the Headless API and reports what came back. The token
//  itself is never printed: only its length and a masked preview, so the
//  output is safe to paste into a chat or a ticket.
// ════════════════════════════════════════════════════════════════════

import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), '')
const raw = env.VITE_TEBEX_TOKEN ?? ''
const token = raw.trim().replace(/^["']|["']$/g, '')

const mask = (t) => (t.length <= 8 ? '*'.repeat(t.length) : `${t.slice(0, 4)}…${t.slice(-2)}`)

console.log('\nVITE_TEBEX_TOKEN')
console.log('  present   :', raw ? 'yes' : 'NO, still demo mode')
if (!raw) process.exit(1)
console.log('  length    :', token.length)
console.log('  preview   :', mask(token))
console.log('  charset   :', /^[A-Za-z0-9_-]+$/.test(token) ? 'letters/digits/-/_' : 'contains other characters')

// A Tebex webstore identifier looks like `t66x-7cd928b1…cb`: a short prefix, a
// hyphen, then 40 hex characters (45 in total). Reporting the shape, never the
// value: is usually enough to spot a mis-copied or wrong credential.
const parts = token.split('-')
const expected = /^[A-Za-z0-9]{2,8}-[0-9a-f]{40}$/.test(token)
console.log('  shape     :', expected ? 'matches tXXX-<40 hex> ✅' : 'does NOT match tXXX-<40 hex> ❌')
if (!expected) {
  console.log('  segments  :', parts.length === 1 ? 'no hyphen found' : parts.map((p) => `${p.length} chars`).join(' + '))
  if (parts.length === 2) {
    console.log('  tail      :', /^[0-9a-f]+$/i.test(parts[1]) ? 'hex' : 'NOT hex, this is not a webstore identifier')
  }
}
if (raw !== token) console.log('  NOTE      : value had surrounding spaces or quotes, they are stripped here, but remove them from .env')
console.log('  store url :', env.VITE_TEBEX_STORE_URL || '(not set)')

async function probe(label, url) {
  try {
    const res = await fetch(url)
    const body = await res.text()
    console.log(`\n${label}`)
    console.log('  status :', res.status, res.statusText)
    console.log('  body   :', body.slice(0, 300).replace(token, '<token>'))
    return res.ok
  } catch (e) {
    console.log(`\n${label}`)
    console.log('  network error:', e.message)
    return false
  }
}

const base = 'https://headless.tebex.io/api'
const ok = await probe('GET /accounts/<token>', `${base}/accounts/${encodeURIComponent(token)}`)
if (ok) {
  await probe('GET /accounts/<token>/categories', `${base}/accounts/${encodeURIComponent(token)}/categories?includePackages=1`)
  console.log('\n✅ Connected. Restart `npm run dev` if it was running before you set the token.')
} else {
  console.log(`
❌ Tebex did not accept this token.

  404 "Account not found" means the value is not a Headless API public token for
  an existing webstore. Check in the Tebex Creator Panel:

    Your webstore → Integrations → Headless API → enable it, then copy the
    PUBLIC TOKEN shown there (not the secret/private key, not the Tebex.js
    public key, and not the store URL).

  Also confirm the webstore is published/enabled, and that .env has no quotes
  or trailing spaces around the value.`)
}
