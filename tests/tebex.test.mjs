import assert from 'node:assert/strict'
import {
  IS_DEMO,
  billingPeriod,
  buildVariableData,
  compareAtPrice,
  discountPercent,
  formatPrice,
  hasDiscount,
  idFromProductParam,
  isFeatured,
  isFillableOption,
  packageBadges,
  packageDescription,
  packageGallery,
  packagePerks,
  parseTags,
  plainText,
  productPath,
  categoryPath,
  requiredOptions,
} from '../src/lib/tebex.js'
import { DEMO_CATEGORIES } from '../src/lib/demoData.js'

let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log(`  ✓ ${name}`)
}

console.log('tebex helpers')

test('no token under plain Node means demo mode', () => {
  assert.equal(IS_DEMO, true)
})

test('parseTags reads a leading block, even wrapped in <p>', () => {
  const r = parseTags('<p>[Featured, New] Fast car</p>')
  assert.deepEqual(r.tags, ['Featured', 'New'])
  assert.equal(r.description, '<p>Fast car</p>')
  assert.deepEqual(parseTags('<p>No tags [here]</p>').tags, [])
})

test('tag aliases map to the same badges', () => {
  const a = { description: '[Featured, New, Popular] x' }
  const b = { description: '[Hot, New, Most picked] x' }
  assert.equal(isFeatured(a), true)
  assert.equal(isFeatured(b), true)
  assert.deepEqual(packageBadges(a).map((x) => x.label), ['New', 'Popular'])
  assert.deepEqual(packageBadges(b), packageBadges(a))
})

test('discount uses the discount field, not base vs total (sales tax case)', () => {
  const taxed = { base_price: 10, sales_tax: 2.1, discount: 2, total_price: 10.1 }
  assert.equal(hasDiscount(taxed), true)
  assert.equal(compareAtPrice(taxed), 12.1)
  assert.equal(discountPercent(taxed), 17)
  assert.equal(hasDiscount({ base_price: 5, total_price: 5, discount: 0 }), false)
  assert.equal(hasDiscount({ base_price: 8, total_price: 5 }), true)
})

test('formatPrice renders US dollars', () => {
  const s = formatPrice(1234.5).replace(/\s/g, '')
  assert.ok(s.includes('$') && s.includes('1,234.50'), s)
  assert.ok(formatPrice(9.99, 'EUR').includes('€'))
})

test('billingPeriod in English', () => {
  assert.equal(billingPeriod({ type: 'subscription', expiry_period: { unit: 'month', count: 1 } }), '/mo')
  assert.equal(billingPeriod({ type: 'subscription', expiry_period: { unit: 'year', count: 2 } }), '/2 yr')
  assert.equal(billingPeriod({ type: 'single' }), '')
})

test('product and category paths carry the id and survive null slugs', () => {
  assert.equal(productPath({ id: 42, name: 'Audi RS6 Avant', slug: null }), '/product/42-audi-rs6-avant')
  assert.equal(idFromProductParam('42-audi-rs6-avant'), '42')
  assert.equal(idFromProductParam('42'), '42')
  assert.equal(categoryPath({ key: 'vip' }), '/store/vip')
  assert.equal(categoryPath({ name: 'Streets & Crime' }), '/store/streets-crime')
})

test('gallery collects https images only, deduplicated', () => {
  const pkg = {
    image: 'https://cdn/a.png',
    media: [{ url: 'https://cdn/a.png' }, { url: 'http://insecure/b.png' }],
    description: '<p><img src="https://cdn/c.jpg"></p><img src="javascript:alert(1)">',
  }
  assert.deepEqual(packageGallery(pkg), ['https://cdn/a.png', 'https://cdn/c.jpg'])
  assert.equal(packageDescription(pkg), '')
})

test('perks and plain text excerpts', () => {
  const pkg = { description: '<p>[New] Intro</p><ul><li>One &amp; two</li><li><b>Three</b></li></ul>' }
  assert.deepEqual(packagePerks(pkg), ['One & two', 'Three'])
  assert.equal(plainText('<p>Hello</p><p>world</p>'), 'Hello · world')
  assert.equal(plainText('a'.repeat(200), 10), `${'a'.repeat(10)}…`)
})

test('options: only typeable ones are required from the buyer', () => {
  const pkg = {
    options: [
      { name: 'email', type: 'email' },
      { name: 'discord', type: 'discord_id' },
      { name: 'note', type: 'text', required: false },
    ],
  }
  assert.equal(isFillableOption(pkg.options[1]), false)
  assert.deepEqual(requiredOptions(pkg).map((o) => o.name), ['email'])
  assert.deepEqual(buildVariableData(pkg, { email: ' a@b.com ', note: '', other: 'x' }), { email: 'a@b.com' })
})

test('demo catalog is shaped like the live API', () => {
  const all = DEMO_CATEGORIES.flatMap((c) => c.packages)
  assert.ok(all.length >= 15)
  assert.equal(new Set(all.map((p) => p.id)).size, all.length, 'ids are unique')
  for (const p of all) {
    assert.equal(typeof p.total_price, 'number')
    assert.ok(p.total_price <= p.base_price)
    assert.equal(p.currency, 'USD')
  }
})

console.log(`  ${passed} passed\n`)
