import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard'
import { useCatalog } from '../stores/catalogStore'
import { useTitle } from '../lib/useTitle'
import { categoryIcon } from '../lib/categoryMeta'
import { categoryPath, isFeatured, packagePrice, plainText } from '../lib/tebex'
import { DISCORD_URL } from '../data/site'

const SORTS = [
  { id: 'featured', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name: A to Z' },
]

function Pill({ to, active, icon, label, count }) {
  return (
    <Link
      to={to}
      className={`relative flex shrink-0 items-center gap-2 px-4 py-2.5 font-label text-[0.76rem] uppercase tracking-[0.1em] transition-colors ${
        active ? 'text-void' : 'text-mist-300 hover:text-chalk'
      }`}
    >
      {active && (
        <motion.span
          layoutId="store-pill"
          className="absolute inset-0 bg-pink-500 [transform:skewX(-10deg)]"
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        {icon && <Icon name={icon} size={15} strokeWidth={2.2} />}
        {label}
        {count != null && <span className={`text-[0.66rem] ${active ? 'text-void' : 'text-mist-500'}`}>{count}</span>}
      </span>
    </Link>
  )
}

/** "vehicles" becomes "Vehicles", for a category the store does not carry yet. */
function labelFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function Store() {
  const { category: key } = useParams()
  const { rootCategories, packages, findCategory, isLoading } = useCatalog()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')

  const active = key ? findCategory(key) : null
  const root = active?.parent ? findCategory(active.parent.id) || active : active
  // A link to a category that does not exist in Tebex yet: show the rest of the store instead of a dead end.
  const missing = Boolean(key) && !isLoading && !active
  const missingLabel = missing ? labelFromSlug(key) : ''
  useTitle(active ? active.name : missing ? missingLabel : 'Store')

  const results = useMemo(() => {
    let list = active ? packages.filter((p) => p.categoryId === active.id || p.rootCategoryId === active.id) : packages
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((p) => `${p.name} ${p.categoryName}`.toLowerCase().includes(q))

    const sorted = [...list]
    if (sort === 'price-asc') sorted.sort((a, b) => packagePrice(a) - packagePrice(b))
    else if (sort === 'price-desc') sorted.sort((a, b) => packagePrice(b) - packagePrice(a))
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'en'))
    else sorted.sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)))
    return sorted
  }, [active, packages, query, sort])

  return (
    <>
      <PageHeader
        eyebrow={active ? 'Category' : missing ? 'Coming soon' : 'Store'}
        title={active ? active.name : missing ? missingLabel : 'Every'}
        accent={active || missing ? null : 'package.'}
        description={
          active
            ? plainText(active.description, 220) || `Everything in ${active.name}.`
            : missing
              ? `${missingLabel} is not in the store yet. Here is everything that is.`
              : 'Back The Heights and get something back. Everything is delivered the moment you reconnect.'
        }
        crumbs={active ? [{ label: 'Store', to: '/store' }, { label: active.name }] : missing ? [{ label: 'Store', to: '/store' }, { label: missingLabel }] : [{ label: 'Store' }]}
      />

      <div className="container-x">
        {/* Filter bar */}
        <div className="sticky top-[5.5rem] z-30 mb-8 border border-white/10 bg-void/85 p-2 backdrop-blur-2xl">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className={`flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${rootCategories.length < 2 ? 'hidden' : ''}`}>
              <Pill to="/store" active={!active} label="All" count={packages.length} icon="sparkles" />
              {rootCategories.map((c) => (
                <Pill key={c.id} to={categoryPath(c)} active={root?.id === c.id} label={c.name} count={c.allPackages.length} icon={categoryIcon(c.name)} />
              ))}
            </div>
            <div className="flex gap-2">
              <label className="relative flex-1 lg:w-60 lg:flex-none">
                <span className="sr-only">Search</span>
                <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-500" />
                <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search packages…" className="field py-2.5 pl-10" />
              </label>
              <label className="relative">
                <span className="sr-only">Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="field cursor-pointer appearance-none py-2.5 pl-4 pr-10">
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-ink-900">
                      {s.label}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-mist-400" />
              </label>
            </div>
          </div>
        </div>

        {root?.children?.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link to={categoryPath(root)} className={`border px-4 py-2 font-label text-[0.7rem] uppercase tracking-[0.1em] [transform:skewX(-10deg)] [&>*]:[transform:skewX(10deg)] ${active?.id === root.id ? 'border-pink-500 text-pink-300' : 'border-white/10 text-mist-300 hover:text-chalk'}`}>
              All in {root.name}
            </Link>
            {root.children.map((c) => (
              <Link key={c.id} to={categoryPath(c)} className={`border px-4 py-2 font-label text-[0.7rem] uppercase tracking-[0.1em] [transform:skewX(-10deg)] [&>*]:[transform:skewX(10deg)] ${active?.id === c.id ? 'border-pink-500 text-pink-300' : 'border-white/10 text-mist-300 hover:text-chalk'}`}>
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {missing && (
          <div className="mb-6 flex items-start gap-3  border border-pink-500/25 bg-pink-500/[0.06] px-4 py-3.5 text-sm leading-relaxed text-mist-200">
            <Icon name="info" size={18} className="mt-0.5 shrink-0 text-pink-400" />
            <span>
              <strong className="text-chalk">{missingLabel}</strong> is coming soon. Ask about it on Discord, or browse what is in the store right now.
            </span>
          </div>
        )}

        <p className="mb-5 font-label text-[0.66rem] uppercase tracking-[0.2em] text-mist-500">
          {isLoading ? 'Loading…' : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
        </p>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center  border border-white/[0.07] py-20 text-center">
            <Icon name="search" size={34} className="text-mist-500" />
            <p className="mt-5 font-display text-xl font-bold uppercase text-chalk">Nothing found</p>
            <p className="mt-2 text-sm text-mist-400">Try another search or category.</p>
            {query && (
              <button type="button" onClick={() => setQuery('')} className="btn-ghost mt-6">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <motion.div
            layout
            className={`grid gap-5 ${
              results.length === 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : results.length === 2 ? 'sm:grid-cols-2 lg:max-w-3xl' : results.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}
          >
            <AnimatePresence mode="popLayout">
              {results.map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.035, 0.3), ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard pkg={pkg} priority={i < 2} headingLevel="h2" />
                </motion.div>
              ))}
            </AnimatePresence>

            {results.length === 1 && (
              <div className="flex flex-col items-center justify-center  border border-dashed border-white/10 p-8 text-center">
                <Icon name="discord" size={26} className="text-mist-400" />
                <p className="mt-4 font-display text-base font-bold uppercase text-chalk">Missing something?</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-mist-400">Tell us on Discord which package you would like to see in the store.</p>
                <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="btn-ghost mt-6">
                  Go to Discord
                </a>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  )
}
