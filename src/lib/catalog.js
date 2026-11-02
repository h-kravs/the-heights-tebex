// ════════════════════════════════════════════════════════════════════
//  Catalog normalisation
//
//  Tebex categories form a two-level tree: a category may declare a
//  `parent`. This turns the flat API response into something the pages
//  can render directly. Pure, so it is unit tested without React.
// ════════════════════════════════════════════════════════════════════

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)

/** URL-safe slug. Tebex often returns `slug: null`, so one is derived from the name. */
export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @param {Array} raw categories exactly as returned by the Headless API
 * @returns {{categories: Array, rootCategories: Array, packages: Array}}
 *   - categories:     every category, each with `children`, `ownPackages`,
 *                     `allPackages` (own + descendants) and a stable `key`
 *   - rootCategories: top-level categories that have something to sell
 *   - packages:       flat, de-duplicated list tagged with its category
 */
export function normalizeCatalog(raw) {
  const sorted = [...(Array.isArray(raw) ? raw : [])].sort(byOrder)

  const childrenOf = new Map()
  for (const cat of sorted) {
    const parentId = cat.parent?.id
    if (!parentId) continue
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, [])
    childrenOf.get(parentId).push(cat)
  }

  const decorated = sorted.map((cat) => {
    const children = (childrenOf.get(cat.id) || []).sort(byOrder)
    const own = Array.isArray(cat.packages) ? cat.packages : []
    return {
      ...cat,
      key: cat.slug || slugify(cat.name) || String(cat.id),
      children,
      ownPackages: own,
      allPackages: [...own, ...children.flatMap((c) => c.packages || [])],
    }
  })

  // Re-link children to their decorated version so `children` is never stale.
  const byId = new Map(decorated.map((c) => [c.id, c]))
  for (const cat of decorated) {
    cat.children = cat.children.map((c) => byId.get(c.id) || c)
  }

  const seen = new Set()
  const packages = []
  for (const cat of decorated) {
    for (const p of cat.ownPackages) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      packages.push({
        ...p,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryKey: cat.key,
        rootCategoryId: cat.parent?.id || cat.id,
      })
    }
  }

  return {
    categories: decorated,
    rootCategories: decorated.filter((c) => !c.parent && c.allPackages.length > 0),
    packages,
  }
}
