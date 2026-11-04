// ════════════════════════════════════════════════════════════════════
//  VIP comparison table
//
//  Tebex's hosted theme can render a tier comparison table, but the
//  Headless API does not expose it, only the package descriptions. So
//  the table is derived from the <li> items the store owner already
//  writes in the Tebex panel, which keeps it editable without code.
//
//  Three things make that work:
//    · bullets that only differ by a quantity ("2 extra garage slots"
//      vs "5 extra garage slots") collapse into a single row, with the
//      quantity shown per tier;
//    · "Everything in VIP Bronze" is treated as inheritance, not as a
//      feature, so higher tiers pick up the lower tier's rows;
//    · a tier missing a row renders as "not included".
// ════════════════════════════════════════════════════════════════════

// Kept dependency-free on purpose: lib/tebex.js reads import.meta.env, which
// would drag Vite into the test runner. Price is one line, so it lives here.
const priceOf = (pkg) => Number(pkg?.total_price ?? pkg?.base_price ?? 0)

/**
 * Which packages the VIP page shows.
 *
 * Order of preference: the category whose name mentions VIP / membership /
 * priority / rank, then every subscription package, then the placeholders.
 * A single real VIP package is enough to drop the placeholders entirely.
 *
 * @returns {{tiers: Array, isPreview: boolean}}
 */
export function pickVipPackages(categories, packages, placeholders = []) {
  const cat = (categories || []).find((c) =>
    /vip|membership|priority|rank/i.test(`${c.name} ${c.slug || ''}`),
  )
  if (cat?.allPackages?.length) return { tiers: cat.allPackages, isPreview: false }

  const subs = (packages || []).filter((p) => p.type === 'subscription')
  if (subs.length) return { tiers: subs, isPreview: false }

  return { tiers: placeholders, isPreview: placeholders.length > 0 }
}

/**
 * Which tier gets the highlighted card and column.
 *
 * The store owner decides from the Tebex panel by starting a description
 * with a `[Popular]`, `[Recommended]` or `[Most picked]` tag. `[Best value]`
 * deliberately does NOT highlight, it usually sits on the top tier as a
 * descriptive label. If several tiers are tagged, the most expensive one
 * wins. With no tag at all it falls back to the second cheapest, the usual
 * "middle option".
 *
 * @param tiers packages ordered cheapest first
 */
export function pickFeatured(tiers) {
  if (!tiers?.length) return null
  const HIGHLIGHT = /^\s*(?:<[^>]*>\s*)*\[[^\]]*\b(popular|recommended|most\s*picked)\b/i
  const tagged = tiers.filter((p) => HIGHLIGHT.test(p.description || ''))
  if (tagged.length) return tagged[tagged.length - 1]
  return tiers.length >= 3 ? tiers[1] : tiers[0]
}

/** Tier accent colors. Named metals/gems win; otherwise the brand ramp. */
const NAMED_ACCENTS = [
  [/bronze|copper/i, '#d08a52'],
  [/silver|steel/i, '#c3cbd8'],
  [/gold|golden/i, '#f0c34a'],
  [/platinum/i, '#7fe6ff'],
  [/diamond|crystal/i, '#5cc9ff'],
  [/amethyst|purple/i, '#c06bff'],
  [/emerald|jade/i, '#4fd98a'],
  [/ruby|crimson/i, '#ff5a6e'],
  [/obsidian|onyx|black/i, '#9b8fae'],
]
const BRAND_RAMP = ['#d9d9e3', '#ff6cc8', '#ff14a0', '#b000ff', '#4de1ff']

export function tierAccent(name, index) {
  const hit = NAMED_ACCENTS.find(([re]) => re.test(name || ''))
  return hit ? hit[1] : BRAND_RAMP[index % BRAND_RAMP.length]
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'with',
  'your', 'you', 'per', 'every', 'all', 'get', 'access', 'extra',
])

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

// A perk is a short phrase; prose is an intro paragraph or a disclaimer, and
// must never become a table row. Two signals separate them: length, and the
// full stop a sentence ends with: perks are rarely punctuated that way.
const PERK_MAX_LENGTH = 80
const SENTENCE_MIN_LENGTH = 45

const looksLikeProse = (line) =>
  line.length > PERK_MAX_LENGTH || (line.length > SENTENCE_MIN_LENGTH && /[.!?]$/.test(line))

/**
 * Pulls the perks out of a Tebex description, in order of preference:
 *
 *   1. real `<li>` items: what the editor's bullet-list button produces;
 *   2. `&lt;li&gt;`: raw HTML pasted into the WYSIWYG, which stores markup as
 *      escaped text (markdown code fences come along for the ride);
 *   3. one short line per perk: plain paragraphs or <br>-separated lines,
 *      which is what you get typing a list without pressing the bullet button.
 *
 * Case 3 is the common one: people write the perks one per line and never
 * touch the toolbar. Long lines are skipped so an intro paragraph does not
 * turn into a row, and a lone `[Popular]` tag line is skipped too.
 */
export function extractBullets(html) {
  if (!html) return []

  let source = html
  if (!/<li[^>]*>/i.test(source) && /&lt;\s*li\b/i.test(source)) {
    source = source
      .replace(/```[a-z]*/gi, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }

  const items = (source.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [])
    .map((li) => decode(li.replace(/<[^>]*>/g, '')))
    .filter(Boolean)

  if (items.length) return items

  // No list markup: fall back to line-per-perk.
  return source
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split('\n')
    .map(decode)
    .filter((line) => line && !looksLikeProse(line) && !/^\[[^\]]*\]$/.test(line))
}

/** "Everything in VIP Bronze" → the tier it inherits from, else null. */
export function inheritsFrom(bullet) {
  const m = bullet.match(/^(?:everything|all)\s+(?:in|from|of)\s+(?:the\s+)?(.+?)[.,]?$/i)
  return m ? m[1].trim() : null
}

/** Significant words, lowercased, numbers dropped, used for grouping. */
function tokens(bullet) {
  return bullet
    .toLowerCase()
    .replace(/[+$]?\d[\d.,]*\s*[%kx]?/gi, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

// How alike two bullets must be to share a row. 0.6 rather than 0.5 because
// at 0.5 any two perks ending in the same noun collapse together, "character
// slots" with "garage slots", "VIP emotes" with "VIP clothing".
const SAME_ROW = 0.6

/** Dice coefficient over token sets: 1 identical, 0 nothing in common. */
function similarity(a, b) {
  if (!a.length || !b.length) return 0
  const setB = new Set(b)
  const shared = a.filter((w) => setB.has(w)).length
  return (2 * shared) / (a.length + b.length)
}

/**
 * The quantity a bullet carries, if any: "+35% payout" → "+35%",
 * "5 extra garage slots" → "5", "Unlimited garage" → "Unlimited".
 * Returns null when the bullet is a plain yes/no feature.
 */
export function quantityOf(bullet) {
  // Ratios and dates are part of the wording, not an amount: "24/7 support",
  // "1v1 arena", "Season 2.0". Strip them before looking for a quantity.
  const scrubbed = bullet.replace(/\b\d+\s*[/vx:.-]\s*\d+\b/gi, ' ')

  const numeric = scrubbed.match(/([+-]?[$€$]?\d[\d.,]*\s*[%kKxX]?)(?![/\d])/)
  if (numeric) return numeric[1].replace(/\s+/g, '').toUpperCase()

  const unlimited = bullet.match(/\b(unlimited|lifetime|permanent)\b/i)
  if (unlimited) return unlimited[1][0].toUpperCase() + unlimited[1].slice(1).toLowerCase()

  return null
}

/**
 * Sentence case for a row label, with the quantity stripped off the front so
 * the row names the perk and the cell carries the value: "5 garage slots" and
 * "Unlimited fuel" become "Garage slots" and "Fuel".
 */
function label(bullet) {
  const clean = bullet
    .replace(/^[+-]?[$€$]?\d[\d.,]*\s*[%kKxX]?\s*/, '')
    .replace(/^(?:unlimited|lifetime|permanent)\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/**
 * Builds the comparison table.
 *
 * @param {Array} packages VIP packages, any order
 * @returns {{tiers: Array, rows: Array}} tiers sorted cheapest first;
 *   each row is { label, values: [{kind: 'yes'|'no'|'value', text}] }
 */
export function buildComparison(packages) {
  const tiers = [...(packages || [])]
    .sort((a, b) => priceOf(a) - priceOf(b))
    .map((pkg, i) => ({
      id: pkg.id,
      name: pkg.name,
      pkg,
      accent: tierAccent(pkg.name, i),
      bullets: extractBullets(pkg.description),
    }))

  if (tiers.length === 0) return { tiers: [], rows: [] }

  // ── Resolve inheritance ──
  // "Everything in VIP Silver" copies that tier's bullets. Tiers are
  // cheapest-first and resolved in order, so chained inheritance
  // (Gold → Silver → Bronze) accumulates naturally. Falls back to the
  // tier directly below when the name matches nothing.
  // `own: true` marks a bullet the tier states itself, as opposed to one it
  // picked up through inheritance.
  const own = tiers.map((t) =>
    t.bullets.filter((b) => !inheritsFrom(b)).map((text) => ({ text, own: true })),
  )
  const resolved = []

  tiers.forEach((tier, i) => {
    const targets = tier.bullets.map(inheritsFrom).filter(Boolean)
    if (!targets.length) {
      resolved[i] = own[i]
      return
    }

    const inherited = targets.flatMap((target) => {
      const key = target.toLowerCase()
      const found = tiers.findIndex(
        (x) => key.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(key),
      )
      const from = found >= 0 && found < i ? found : i - 1
      // Inherited bullets lose their "own" flag: a tier that restates a perk
      // with a bigger number must win over the version it inherited.
      return from >= 0 ? resolved[from].map((b) => ({ ...b, own: false })) : []
    })

    // De-duplicate: a tier may both inherit a bullet and restate it verbatim.
    const seen = new Set()
    resolved[i] = [...inherited, ...own[i]].filter((b) => {
      const key = b.text.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

  // ── Group bullets into rows ──
  const groups = [] // { tokens, label, byTier: Map<tierIndex, bullet> }

  resolved.forEach((bullets, tierIndex) => {
    bullets.forEach(({ text, own: isOwn }) => {
      const tk = tokens(text)
      if (!tk.length) return

      let group = groups.find((g) => similarity(g.tokens, tk) >= SAME_ROW)
      if (!group) {
        group = { tokens: tk, label: label(text), byTier: new Map(), order: groups.length }
        groups.push(group)
      }
      // Keep the shortest phrasing as the row label, usually the cleanest.
      const candidate = label(text)
      if (candidate.length < group.label.length) group.label = candidate

      // Last write wins. Each tier's bullets are ordered lowest-inherited
      // first and its own last, so for a row several tiers restate with
      // bigger numbers ("2 slots" → "5 slots" → "8 slots") the tier ends up
      // showing the highest one it actually has, not the oldest it inherited.
      group.byTier.set(tierIndex, { text, own: isOwn })
    })
  })

  // Rows that every tier shares are the least interesting: push them down.
  const rows = groups
    .map((g) => ({
      label: g.label,
      order: g.order,
      spread: g.byTier.size,
      values: tiers.map((_, tierIndex) => {
        const entry = g.byTier.get(tierIndex)
        if (!entry) return { kind: 'no' }
        const qty = quantityOf(entry.text)
        return qty
          ? { kind: 'value', text: qty, title: entry.text }
          : { kind: 'yes', title: entry.text }
      }),
    }))
    .sort((a, b) => a.spread - b.spread || a.order - b.order)
    .map(({ label: l, values }) => ({ label: l, values }))

  return {
    tiers: tiers.map(({ id, name, pkg, accent }) => ({ id, name, pkg, accent })),
    rows,
  }
}
