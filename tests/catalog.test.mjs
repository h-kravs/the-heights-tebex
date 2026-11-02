import assert from 'node:assert/strict'
import { normalizeCatalog, slugify } from '../src/lib/catalog.js'

let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log(`  ✓ ${name}`)
}

console.log('catalog')

const RAW = [
  { id: 3, name: 'Ammo', order: 3, parent: { id: 2 }, packages: [{ id: 30, name: 'Kogels' }] },
  { id: 1, name: 'VIP', slug: 'vip', order: 1, parent: null, packages: [{ id: 10, name: 'Brons' }, { id: 11, name: 'Goud' }] },
  { id: 2, name: 'Wapens & Uitrusting', order: 2, parent: null, packages: [{ id: 20, name: 'Mes' }] },
  { id: 4, name: 'Leeg', order: 4, parent: null, packages: [] },
  { id: 5, name: 'Enkel kinderen', order: 5, parent: null, packages: [] },
  { id: 6, name: 'Kind', order: 6, parent: { id: 5 }, packages: [{ id: 60, name: 'X' }, { id: 10, name: 'Brons (dubbel)' }] },
]

test('slugify strips accents and punctuation', () => {
  assert.equal(slugify('Wapens & Uitrusting'), 'wapens-uitrusting')
  assert.equal(slugify('Café Crème!'), 'cafe-creme')
  assert.equal(slugify(null), '')
})

test('categories are sorted by order and keyed', () => {
  const { categories } = normalizeCatalog(RAW)
  assert.deepEqual(categories.map((c) => c.id), [1, 2, 3, 4, 5, 6])
  assert.equal(categories[0].key, 'vip') // explicit slug wins
  assert.equal(categories[1].key, 'wapens-uitrusting') // derived from name
})

test('children and allPackages include descendants', () => {
  const { categories } = normalizeCatalog(RAW)
  const weapons = categories.find((c) => c.id === 2)
  assert.deepEqual(weapons.children.map((c) => c.id), [3])
  assert.deepEqual(weapons.allPackages.map((p) => p.id), [20, 30])
  assert.ok(weapons.children[0].allPackages, 'children point at decorated categories')
})

test('rootCategories drop empty roots but keep parents whose children sell', () => {
  const { rootCategories } = normalizeCatalog(RAW)
  assert.deepEqual(rootCategories.map((c) => c.id), [1, 2, 5])
})

test('packages are flat, de-duplicated and tagged with their category', () => {
  const { packages } = normalizeCatalog(RAW)
  assert.deepEqual(packages.map((p) => p.id), [10, 11, 20, 30, 60])
  const ammo = packages.find((p) => p.id === 30)
  assert.equal(ammo.categoryName, 'Ammo')
  assert.equal(ammo.rootCategoryId, 2)
})

test('survives garbage input', () => {
  assert.deepEqual(normalizeCatalog(null).packages, [])
  assert.deepEqual(normalizeCatalog([{ id: 1, name: 'x' }]).rootCategories, [])
})

console.log(`  ${passed} passed\n`)
