import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { IS_DEMO, getCategories, getWebstore, isFeatured } from '../lib/tebex'
import { DEMO_CATEGORIES, DEMO_WEBSTORE } from '../lib/demoData'
import { normalizeCatalog } from '../lib/catalog'

// The catalog is fetched once per session and shared across the app:
// categories already carry their packages (`includePackages=1`), so moving
// between pages never triggers another request.

const CatalogContext = createContext(undefined)

export function CatalogProvider({ children }) {
  const [raw, setRaw] = useState([])
  const [webstore, setWebstore] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let alive = true
    Promise.all([getCategories(), getWebstore().catch(() => null)])
      .then(([cats, store]) => {
        if (!alive) return
        setRaw(Array.isArray(cats) ? cats : [])
        setWebstore(store)
        setStatus('ready')
      })
      .catch((err) => {
        // A bad/expired token or a Tebex outage would leave an empty storefront,
        // which looks broken and sells nothing. Fall back to the sample catalog
        // and say so, exactly like demo mode.
        console.error('[catalog] failed to load, falling back to the demo catalog:', err)
        if (!alive) return
        setRaw(DEMO_CATEGORIES)
        setWebstore(DEMO_WEBSTORE)
        setStatus('fallback')
      })
    return () => {
      alive = false
    }
  }, [])

  const { categories, rootCategories, packages } = useMemo(() => normalizeCatalog(raw), [raw])

  const featured = useMemo(() => {
    // [Featured] packages lead; nothing tagged falls back to catalog order.
    const tagged = packages.filter(isFeatured)
    if (tagged.length >= 3) return tagged
    const rest = packages.filter((p) => !isFeatured(p))
    return [...tagged, ...rest].slice(0, 8)
  }, [packages])

  const findPackage = useCallback((id) => packages.find((p) => String(p.id) === String(id)) || null, [packages])

  const findCategory = useCallback(
    (key) => categories.find((c) => c.key === key || String(c.id) === String(key)) || null,
    [categories],
  )

  const value = useMemo(
    () => ({
      categories,
      rootCategories,
      packages,
      featured,
      webstore,
      currency: webstore?.currency || 'GBP',
      isLoading: status === 'loading',
      // True when a token is configured but Tebex did not answer: the catalog on
      // screen is sample data, so checkout must behave like demo mode.
      isFallback: status === 'fallback' && !IS_DEMO,
      findPackage,
      findCategory,
    }),
    [categories, rootCategories, packages, featured, webstore, status, findPackage, findCategory],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return ctx
}
