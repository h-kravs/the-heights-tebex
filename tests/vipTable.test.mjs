// Run with: npm test
//
// Covers the VIP comparison table derived from Tebex package descriptions:
// bullet grouping, quantity extraction and "Everything in X" inheritance.

import { buildComparison, extractBullets, inheritsFrom, pickFeatured, pickVipPackages, quantityOf, tierAccent } from '../src/lib/vipTable.js'
import { DEMO_VIPS } from '../src/lib/demoVips.js'

let fails = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) fails++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}` +
      (ok ? '' : `\n        expected ${JSON.stringify(expected)}\n        got      ${JSON.stringify(actual)}`),
  )
}

/* ── helpers ── */

check('extractBullets pulls <li> text and strips markup',
  extractBullets('<ul><li><strong>Priority</strong> queue</li><li>2 slots</li></ul>'),
  ['Priority queue', '2 slots'])
check('extractBullets on empty input', extractBullets(null), [])
// A short standalone line IS treated as a perk, see the line-per-perk
// fallback below. Only prose long enough to read as a sentence is skipped.
check('extractBullets on a prose-only description',
  extractBullets('<p>Just a paragraph of prose that describes the package at some length ' +
    'and is clearly not a perk.</p>'),
  [])

// Regression, taken verbatim from the live store: pasting raw HTML into the
// Tebex WYSIWYG stores it as escaped text, markdown fences included, so the
// description ends up with zero real <li> elements.
check('extractBullets survives HTML escaped by the Tebex editor',
  extractBullets(
    '<p>```html</p><p>&lt;ul&gt;</p><p>  &lt;li&gt;Priority queue&lt;/li&gt;</p>' +
    '<p>  &lt;li&gt;2 character slots&lt;/li&gt;</p><p>&lt;/ul&gt;</p><p>```</p>',
  ),
  ['Priority queue', '2 character slots'])
check('real markup still wins over the escaped fallback',
  extractBullets('<ul><li>Real</li></ul><p>&lt;li&gt;Escaped&lt;/li&gt;</p>'),
  ['Real'])

// Regression, taken verbatim from the live store: typing one perk per line
// without pressing the bullet-list button produces paragraphs, not a list.
check('extractBullets reads one-perk-per-line paragraphs',
  extractBullets('<p>Priority queue</p><p>2 character slots</p><p>3 garage slots</p>' +
    '<p>+15% job payout</p><p>Exclusive Discord role</p>'),
  ['Priority queue', '2 character slots', '3 garage slots', '+15% job payout', 'Exclusive Discord role'])
check('extractBullets reads <br>-separated lines',
  extractBullets('<p>Priority queue<br>2 character slots<br>+15% job payout</p>'),
  ['Priority queue', '2 character slots', '+15% job payout'])
// Prose must never become table rows.
check('a long prose paragraph yields no perks',
  extractBullets("<p>District Coins is the server's premium currency, redeemable in-game " +
    'for a range of exclusive content including donor vehicles and premium unlocks.</p>'),
  [])
check('an intro line is dropped but the short perks survive',
  extractBullets('<p>This tier is aimed at players who spend most of their evenings in ' +
    'the city and want the grind smoothed out.</p><p>Priority queue</p><p>4 garage slots</p>'),
  ['Priority queue', '4 garage slots'])
check('a lone tag line is not a perk',
  extractBullets('<p>[Popular]</p><p>Priority queue</p>'),
  ['Priority queue'])
check('a list still wins when both are present',
  extractBullets('<p>Some intro</p><ul><li>Priority queue</li></ul><p>4 garage slots</p>'),
  ['Priority queue'])

check('inheritsFrom detects the inheritance sentence', inheritsFrom('Everything in District Gold'), 'District Gold')
check('inheritsFrom is not fooled by a normal perk', inheritsFrom('Priority queue'), null)

check('quantityOf reads a percentage', quantityOf('+35% job payout'), '+35%')
check('quantityOf reads a plain count', quantityOf('4 character slots'), '4')
check('quantityOf reads money', quantityOf('$30,000 cash per month'), '$30,000')
check('quantityOf reads "unlimited"', quantityOf('Unlimited garage slots'), 'Unlimited')
check('quantityOf returns null for a yes/no perk', quantityOf('Priority queue'), null)
check('quantityOf reads a multiplier', quantityOf('200x mats per month'), '200X')
// Ratios and version numbers are wording, not amounts.
check('quantityOf ignores 24/7', quantityOf('Priority support 24/7'), null)
check('quantityOf ignores 1v1', quantityOf('1v1 arena access'), null)
check('quantityOf ignores a version number', quantityOf('Season 2.0 pass'), null)
check('quantityOf still finds a real amount after a ratio',
  quantityOf('Support available 24/7 plus 5 extra slots'), '5')

/* ── table over the placeholder tiers ── */

const { tiers, rows } = buildComparison(DEMO_VIPS)
const row = (needle) => rows.find((r) => r.label.toLowerCase().includes(needle))

check('one column per tier', tiers.map((t) => t.name), ['Heights Silver', 'Heights Gold', 'Heights Diamond'])
check('tiers get distinct accents', new Set(tiers.map((t) => t.accent)).size, 3)

// Same perk with different amounts must collapse into ONE row.
const payout = row('payout')
check('payout is a single row', !!payout, true)
check('payout shows each tier its own amount', payout.values.map((v) => v.text), ['+15%', '+35%', '+60%'])

const slots = row('character slots')
check('character slots inherited and overridden', slots.values.map((v) => v.text), ['2', '4', '8'])

// A perk only the top tier has: lower tiers must render as "not included".
const limited = row('limited vehicle')
check('top-tier-only perk missing from lower tiers', limited.values.map((v) => v.kind), ['no', 'no', 'value'])

// Inheritance: Silver's perk must appear on Gold and Diamond even though
// they only say "Everything in <lower tier>".
const discord = row('discord')
check('Silver perk inherited up the chain', discord.values.map((v) => v.kind), ['yes', 'yes', 'yes'])

// "Everything in X" itself must never become a row.
check('inheritance sentence is not a row', rows.some((r) => /everything in/i.test(r.label)), false)

// Unlimited beats a numeric lower tier without creating a second row.
const garage = row('garage')
check('garage row exists', !!garage, true)
check('garage top tier reads Unlimited', garage.values[2].text, 'Unlimited')

/* ── the row names the perk, the cell carries the value ── */
// Any wording works, there is no fixed list of perks, but the quantity has to
// come off the label, including "Unlimited", or the row reads "Unlimited fuel"
// with an "UNLIMITED" pill next to it.
const invented = buildComparison([
  { id: 1, name: 'Silver', total_price: 1, description: '<p>Priority queue</p>' },
  { id: 2, name: 'Diamond', total_price: 3, description:
    '<p>3 helicopters per month</p><p>Unlimited fuel</p><p>+25% weapon durability</p>' +
    '<p>2 custom license plates</p><p>Access to the yacht</p>' },
])
const invRow = (needle) => invented.rows.find((r) => r.label.toLowerCase().includes(needle))
check('an invented numeric perk becomes a row with a pill',
  [invRow('helicopter').label, invRow('helicopter').values[1].text], ['Helicopters per month', '3'])
check('"Unlimited X" drops the quantity from the label',
  [invRow('fuel').label, invRow('fuel').values[1].text], ['Fuel', 'Unlimited'])
check('a percentage perk works on any wording',
  [invRow('durability').label, invRow('durability').values[1].text], ['Weapon durability', '+25%'])
check('a perk with no quantity is a plain check',
  invRow('yacht').values[1].kind, 'yes')

/* ── chained inheritance keeps the newest value, not the oldest ── */
// Regression: Gold inherits Silver, which already carries Bronze's "2 slots".
// The top tier must read 8, not the 2 it picked up two levels down.
const chained = buildComparison([
  { id: 1, name: 'Bronze', total_price: 5, description: '<ul><li>2 garage slots</li></ul>' },
  { id: 2, name: 'Silver', total_price: 10, description: '<ul><li>Everything in Bronze</li><li>5 garage slots</li></ul>' },
  { id: 3, name: 'Gold', total_price: 20, description: '<ul><li>Everything in Silver</li><li>8 garage slots</li></ul>' },
])
check('chained inheritance shows each tier its own value',
  chained.rows.find((r) => /garage/i.test(r.label)).values.map((v) => v.text), ['2', '5', '8'])

// A tier that inherits but does NOT restate the perk keeps the inherited value.
const partial = buildComparison([
  { id: 1, name: 'Bronze', total_price: 5, description: '<ul><li>2 garage slots</li></ul>' },
  { id: 2, name: 'Silver', total_price: 10, description: '<ul><li>Everything in Bronze</li><li>VIP emotes</li></ul>' },
])
check('a tier that only inherits keeps the inherited amount',
  partial.rows.find((r) => /garage/i.test(r.label)).values.map((v) => v.text), ['2', '2'])

/* ── edge cases ── */

check('no packages → empty table', buildComparison([]), { tiers: [], rows: [] })
check('undefined input → empty table', buildComparison(undefined), { tiers: [], rows: [] })
check('packages with prose only → no rows',
  buildComparison([
    { id: 1, name: 'A', total_price: 5, description: '<p>A long descriptive paragraph about this tier that reads as a sentence.</p>' },
    { id: 2, name: 'B', total_price: 9, description: '<p>Another long descriptive paragraph that is prose rather than a perk.</p>' },
  ]).rows,
  [])

check('named tiers get their metal colour', tierAccent('District Gold', 0), '#f0c34a')
check('unnamed tiers fall back to the brand ramp', tierAccent('Starter Pass', 1), '#ff6cc8')

/* ── placeholders appear only while the store has no VIP tiers ── */

const vipCategory = {
  name: 'VIP Subscriptions',
  slug: 'vip-subscriptions',
  allPackages: [{ id: 90, name: 'DISTRICT DIAMOND', type: 'subscription' }],
}
const coinsOnly = [{ id: 91, name: '1000 District Coins', type: 'single' }]
const aSubscription = [{ id: 92, name: 'Streamer Package', type: 'subscription' }]

check('empty store falls back to the placeholders',
  pickVipPackages([], [], DEMO_VIPS).isPreview, true)
check('a store with only one-off products still shows placeholders',
  pickVipPackages([], coinsOnly, DEMO_VIPS).isPreview, true)
check('one real VIP category drops the placeholders',
  pickVipPackages([vipCategory], coinsOnly, DEMO_VIPS).isPreview, false)
check('the real VIP tier is what gets shown',
  pickVipPackages([vipCategory], coinsOnly, DEMO_VIPS).tiers.map((p) => p.name), ['DISTRICT DIAMOND'])
check('any subscription counts, even with no VIP category',
  pickVipPackages([], aSubscription, DEMO_VIPS).tiers.map((p) => p.name), ['Streamer Package'])
check('no placeholders passed → nothing to preview',
  pickVipPackages([], [], []), { tiers: [], isPreview: false })

/* ── which tier gets highlighted ── */

const ladder = [
  { id: 1, name: 'Silver', description: '<ul><li>a</li></ul>' },
  { id: 2, name: 'Gold', description: '<ul><li>b</li></ul>' },
  { id: 3, name: 'Diamond', description: '<ul><li>c</li></ul>' },
  { id: 4, name: 'Amethyst', description: '<ul><li>d</li></ul>' },
]
const tag = (name, label) => ladder.map((t) =>
  t.name === name ? { ...t, description: `[${label}] <ul><li>x</li></ul>` } : t)

check('with no tag, the second cheapest is featured', pickFeatured(ladder).name, 'Gold')
check('a [Popular] tag wins', pickFeatured(tag('Diamond', 'Popular')).name, 'Diamond')
check('[Recommended] highlights too', pickFeatured(tag('Amethyst', 'Recommended')).name, 'Amethyst')
check('[Most picked] highlights too', pickFeatured(tag('Silver', 'Most picked')).name, 'Silver')
// [Best value] is a descriptive label on the top tier, not a highlight.
check('[Best value] does not highlight', pickFeatured(tag('Amethyst', 'Best value')).name, 'Gold')
check('an unrelated tag does not hijack it', pickFeatured(tag('Diamond', 'New')).name, 'Gold')
check('a tag inside HTML is still found', pickFeatured(ladder.map((t) =>
  t.name === 'Silver' ? { ...t, description: '<p>[Recommended] hi</p><ul><li>a</li></ul>' } : t)).name, 'Silver')
// Several highlight tags: the most expensive one wins, never the cheapest.
check('with several tags the priciest wins', pickFeatured(ladder.map((t) =>
  ['Silver', 'Diamond'].includes(t.name) ? { ...t, description: '[Popular] <ul><li>x</li></ul>' } : t)).name, 'Diamond')
check('two tiers only → the cheaper is featured', pickFeatured(ladder.slice(0, 2)).name, 'Silver')
check('no tiers → nothing featured', pickFeatured([]), null)

console.log(fails === 0 ? '\n✓ all tests pass' : `\n✗ ${fails} test(s) failing`)
process.exit(fails === 0 ? 0 : 1)
