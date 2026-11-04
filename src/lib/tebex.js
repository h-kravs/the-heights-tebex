// ════════════════════════════════════════════════════════════════════
//  Tebex Headless API client
//  Docs: https://docs.tebex.io/developers/headless-api/overview
//
//  The public token (VITE_TEBEX_TOKEN) identifies the webstore and travels
//  in the URL. It is public by design; the private key is never used here.
//
//  With no token configured the module runs in DEMO MODE and serves the
//  sample catalog in ./demoData.js, with identical response shapes.
// ════════════════════════════════════════════════════════════════════

// Explicit extensions so the pure helpers can be unit tested under plain Node.
import { DEMO_CATEGORIES, DEMO_WEBSTORE } from './demoData.js'
import { slugify } from './catalog.js'

const ENV = import.meta.env || {}
const TOKEN = (ENV.VITE_TEBEX_TOKEN || '').trim()
const BASE = 'https://headless.tebex.io/api'

export const IS_DEMO = !TOKEN
export const STORE_URL = (ENV.VITE_TEBEX_STORE_URL || 'https://theheightsla.tebex.io').replace(/\/$/, '')

/**
 * Fetch wrapper. Tebex answers errors with application/problem+json carrying a
 * human-readable `detail`: kept on the error, because it is the difference
 * between "something failed" and knowing which option a package is missing.
 */
async function api(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    let detail = ''
    try {
      const problem = await res.json()
      detail = problem?.detail || problem?.title || problem?.message || ''
    } catch {
      /* non-JSON error body */
    }
    const err = new Error(detail || `Tebex ${res.status} on ${path}`)
    err.status = res.status
    err.detail = detail
    throw err
  }
  const json = await res.json().catch(() => ({}))
  return json.data ?? json
}

const post = (path, body) =>
  api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

// ─────────────────────────── Catalog ───────────────────────────

export async function getWebstore() {
  if (IS_DEMO) return DEMO_WEBSTORE
  return api(`/accounts/${TOKEN}`)
}

export async function getCategories() {
  if (IS_DEMO) return DEMO_CATEGORIES
  return api(`/accounts/${TOKEN}/categories?includePackages=1`)
}

/**
 * Single package. The list endpoints omit `options`; only this one returns
 * them, so the cart calls it before trusting that a package needs nothing.
 */
export async function getPackage(id) {
  if (IS_DEMO) {
    return DEMO_CATEGORIES.flatMap((c) => c.packages).find((p) => String(p.id) === String(id)) || null
  }
  return api(`/accounts/${TOKEN}/packages/${id}`)
}

// ─────────────────────────── Basket ───────────────────────────
//  Demo mode never reaches these: cartStore keeps the cart local and stops
//  at checkout with an explanatory notice.

export async function createBasket() {
  const origin = window.location.origin
  // Without return URLs, anyone completing payment outside the JS overlay is stranded.
  return post(`/accounts/${TOKEN}/baskets`, {
    complete_url: `${origin}/thank-you`,
    cancel_url: `${origin}/store`,
    complete_auto_redirect: true,
  })
}

export async function getBasket(ident) {
  return api(`/accounts/${TOKEN}/baskets/${ident}`)
}

/**
 * Auth links for the basket. On FiveM, Tebex requires the buyer to identify
 * with their Cfx.re account BEFORE any package can be added, that is where
 * the username delivered to the server comes from.
 */
export async function getBasketAuthLinks(ident, returnUrl) {
  const data = await api(`/accounts/${TOKEN}/baskets/${ident}/auth?returnUrl=${encodeURIComponent(returnUrl)}`)
  return Array.isArray(data) ? data : data?.data || []
}

export async function addPackageToBasket(ident, packageId, quantity = 1, variableData = null) {
  const body = { package_id: packageId, quantity }
  if (variableData && Object.keys(variableData).length) body.variable_data = variableData
  return post(`/baskets/${ident}/packages`, body)
}

export async function updateBasketQuantity(ident, packageId, quantity) {
  return api(`/baskets/${ident}/packages/${packageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
}

export async function removePackageFromBasket(ident, packageId) {
  return post(`/baskets/${ident}/packages/remove`, { package_id: packageId })
}

export async function applyCoupon(ident, code) {
  return post(`/accounts/${TOKEN}/baskets/${ident}/coupons`, { coupon_code: code })
}

export async function removeCoupon(ident, code) {
  return post(`/accounts/${TOKEN}/baskets/${ident}/coupons/remove`, { coupon_code: code })
}

// ─────────────────────────── Pricing ───────────────────────────

export const BASE_CURRENCY = 'USD'

export function formatPrice(amount, currency = BASE_CURRENCY) {
  const value = Number(amount) || 0
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || BASE_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `$${value.toFixed(2)}`
  }
}

/** Effective price of a package, discount already applied. */
export function packagePrice(pkg) {
  return Number(pkg?.total_price ?? pkg?.base_price ?? 0)
}

/**
 * Whether Tebex is discounting this package.
 *
 * Reads `discount` rather than comparing base to total, because Tebex computes
 * `total_price = base_price + sales_tax - discount`: with sales tax configured
 * a discounted package can still have base < total, and the comparison misses it.
 */
export function hasDiscount(pkg) {
  const discount = Number(pkg?.discount)
  if (Number.isFinite(discount) && discount > 0) return true
  if (pkg?.discount == null) return (Number(pkg?.base_price) || 0) > (Number(pkg?.total_price) || 0)
  return false
}

/** Strike-through price, or null when not discounted. */
export function compareAtPrice(pkg) {
  if (!hasDiscount(pkg)) return null
  const total = packagePrice(pkg)
  const discount = Number(pkg?.discount) || 0
  // Adding the discount back keeps tax included, so both figures are comparable.
  return discount > 0 ? total + discount : Number(pkg?.base_price) || null
}

/** Rounded percentage off, or 0. */
export function discountPercent(pkg) {
  const compareAt = compareAtPrice(pkg)
  if (!compareAt) return 0
  const pct = Math.round(((compareAt - packagePrice(pkg)) / compareAt) * 100)
  return pct > 0 ? pct : 0
}

export function isSubscription(pkg) {
  return pkg?.type === 'subscription'
}

/** Billing suffix for subscriptions: "/mo", "/yr"… Empty for one-off packages. */
export function billingPeriod(pkg) {
  if (!isSubscription(pkg)) return ''
  const ep = pkg?.expiry_period
  const unit = String((typeof ep === 'object' ? ep?.unit : ep) || 'month').toLowerCase()
  const count = typeof ep === 'object' ? Number(ep?.count) || 1 : 1
  const short = { day: 'day', week: 'wk', month: 'mo', year: 'yr' }[unit] || unit
  return count === 1 ? `/${short}` : `/${count} ${short}`
}

// ─────────────────────────── Routing ───────────────────────────

/** Tebex packages often ship `slug: null`, so the id is always part of the path. */
export function productPath(pkg) {
  const slug = pkg?.slug || slugify(pkg?.name)
  return `/product/${pkg?.id}${slug ? `-${slug}` : ''}`
}

/** Pulls the numeric id back out of "/product/123-vip-gold". */
export function idFromProductParam(param) {
  const match = String(param || '').match(/^(\d+)/)
  return match ? match[1] : String(param || '')
}

export function categoryPath(cat) {
  return `/store/${cat?.key || cat?.slug || slugify(cat?.name) || cat?.id}`
}

// ─────────────────────────── Tags ───────────────────────────
/*
 * Tebex has no "featured" flag and no custom fields, so merchandising is driven
 * by a bracketed tag list at the very start of a package description:
 *
 *     [Featured, New] A fully tuned Audi RS6…
 *
 * The owner controls it entirely from the Tebex panel. The block is stripped
 * before the description renders anywhere.
 */

export function parseTags(description) {
  if (!description) return { tags: [], description: '' }
  const textOnly = String(description).replace(/<[^>]*>/g, '')
  const match = textOnly.match(/^\s*\[([^\]]+)\]/)
  if (!match) return { tags: [], description }
  return {
    tags: match[1].split(',').map((t) => t.trim()).filter(Boolean),
    // Remove the block while preserving any leading markup (e.g. the opening <p>).
    description: description.replace(/^(\s*(?:<[^>]*>\s*)*)\[[^\]]+\]\s*/, '$1').trim(),
  }
}

const TAG_ALIASES = {
  featured: 'featured', hot: 'featured',
  new: 'new',
  popular: 'popular', 'most picked': 'popular', recommended: 'popular',
  bundle: 'bundle', pack: 'bundle',
  limited: 'limited', 'limited time': 'limited',
  'best value': 'best', 'best deal': 'best',
  premium: 'premium', exclusive: 'premium',
}

/** Canonical tag ids for a package, e.g. ["featured", "new"]. */
export function packageTags(pkg) {
  return parseTags(pkg?.description).tags.map((t) => TAG_ALIASES[t.toLowerCase()] || t.toLowerCase())
}

export const isFeatured = (pkg) => packageTags(pkg).includes('featured')

const BADGE_LABELS = { new: 'New', popular: 'Popular', bundle: 'Bundle', limited: 'Limited', best: 'Best value', premium: 'Exclusive' }

/** Visible badges, in the order written. `featured` is placement, not a badge. */
export function packageBadges(pkg) {
  return packageTags(pkg).filter((t) => BADGE_LABELS[t]).map((t) => ({ id: t, label: BADGE_LABELS[t] }))
}

// ─────────────────────────── Descriptions ───────────────────────────

/**
 * All screenshots for a package, deduplicated. Tebex spreads these across
 * `image`, `media` and, most often, <img> tags inside the WYSIWYG description.
 */
export function packageGallery(pkg) {
  const urls = []
  const seen = new Set()
  const push = (url) => {
    if (!url || typeof url !== 'string') return
    const clean = url.trim()
    // https, or a same-origin path (the demo artwork). Never data:, javascript: or //host.
    if (!/^(https:\/\/|\/(?!\/))/i.test(clean) || seen.has(clean)) return
    seen.add(clean)
    urls.push(clean)
  }
  push(pkg?.image)
  ;(pkg?.media || []).forEach((m) => push(m?.url))
  const imgTag = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi
  const description = String(pkg?.description || '')
  let match
  while ((match = imgTag.exec(description)) !== null) push(match[1])
  return urls
}

/** Description without the tag block and without inline images (those live in the gallery). */
export function packageDescription(pkg) {
  const html = parseTags(pkg?.description).description
  if (!html) return ''
  return html
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .trim()
}

/** Plain-text excerpt for cards and meta tags. */
export function plainText(html, max = 140) {
  if (!html) return ''
  const text = String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|li|h\d)>/gi, ' · ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/(\s·\s*)+$/, '')
    .replace(/^\s*·\s*/, '')
    .trim()
  return text.length > max ? `${text.slice(0, max).replace(/[\s·]+$/, '')}…` : text
}

/** `<li>` items of a description, as plain strings, used for perk lists. */
export function packagePerks(pkg, max = 6) {
  const html = packageDescription(pkg)
  const items = []
  const li = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let match
  while ((match = li.exec(html)) !== null && items.length < max) {
    const text = plainText(match[1], 90)
    if (text) items.push(text)
  }
  return items
}

// ─────────────────────────── Package options ───────────────────────────

/**
 * Option types that are plain form fields this site can render and submit.
 * Everything else (discord_id, steam_id…) is an OAuth flow Tebex resolves in
 * its own checkout overlay: rendering a text box for it would ask the buyer
 * to type something that has no typeable answer.
 */
const TEXT_OPTION_TYPES = new Set(['email', 'text', 'string', 'number', 'url', 'textarea'])

export function isFillableOption(option) {
  return TEXT_OPTION_TYPES.has(String(option?.type || '').toLowerCase())
}

export function requiredOptions(pkg) {
  const all = Array.isArray(pkg?.options) ? pkg.options : []
  return all.filter((o) => isFillableOption(o) && o?.required !== false)
}

/** `variable_data` payload from the buyer's shared answers; only declared keys. */
export function buildVariableData(pkg, answers = {}) {
  const data = {}
  for (const option of Array.isArray(pkg?.options) ? pkg.options : []) {
    const value = answers[option.name]
    if (value != null && String(value).trim() !== '') data[option.name] = String(value).trim()
  }
  return data
}
