import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  IS_DEMO,
  STORE_URL,
  addPackageToBasket,
  applyCoupon,
  buildVariableData,
  createBasket,
  getBasket,
  getBasketAuthLinks,
  getPackage,
  isFillableOption,
  packagePrice,
  removeCoupon,
  removePackageFromBasket,
  updateBasketQuantity,
} from '../lib/tebex'
import { useCatalog } from './catalogStore'
import { useToast } from './toastStore'

// ════════════════════════════════════════════════════════════════════
//  Cart: local cart, mirrored into the Tebex basket at checkout.
//
//  Tebex rejects `POST /baskets/{id}/packages` with 422 ("User must login
//  before adding packages to basket") on FiveM stores until the buyer has
//  authenticated with Cfx.re. So the cart is deliberately two-phase:
//
//    1. Browsing: items live in localStorage. No Tebex calls, no login
//       wall in front of the catalog.
//    2. Checkout: the buyer signs in with FiveM, comes back, and only then
//       is the remote basket reconciled with the local cart and the Tebex
//       overlay launched, after verifying the basket is not empty.
// ════════════════════════════════════════════════════════════════════

const CartContext = createContext(undefined)

const ITEMS_KEY = 'thl_cart_items'
const BASKET_KEY = 'thl_basket_ident'
const ANSWERS_KEY = 'thl_option_answers'
const REOPEN_KEY = 'thl_reopen_cart'

/** Brand colors handed to the Tebex overlay so the pop-up matches the site. */
const CHECKOUT_COLORS = [
  { name: 'primary', color: '#ff14a0' },
  { name: 'secondary', color: '#ff6cc8' },
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) ?? fallback) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota or private mode: in-memory state still applies this session */
  }
}

function removeKeys(...keys) {
  try {
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}

const basketQuantity = (p) => Number(p?.in_basket?.quantity ?? p?.quantity ?? 1)

/*
 * Tebex Checkout SDK, loaded only once someone opens the cart. Keeping it
 * off the first paint saves a third-party script and its cookie on every
 * page view where nobody buys anything.
 */
const TEBEX_SDK_URL = 'https://js.tebex.io/v/1.js'
let sdkPromise = null
export function loadTebexSdk() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.Tebex?.checkout) return Promise.resolve(window.Tebex)
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TEBEX_SDK_URL
    script.async = true
    script.onload = () => (window.Tebex?.checkout ? resolve(window.Tebex) : reject(new Error('Tebex SDK missing')))
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('Tebex SDK blocked'))
    }
    document.head.appendChild(script)
  })
  return sdkPromise
}

export function CartProvider({ children }) {
  const { packages: catalog, isLoading: catalogLoading, isFallback } = useCatalog()
  const toast = useToast()
  // No token, or a token Tebex rejected: either way there is no basket to sell into.
  const demoMode = IS_DEMO || isFallback

  const [items, setItems] = useState(() => readJson(ITEMS_KEY, []))
  const [answers, setAnswersState] = useState(() => readJson(ANSWERS_KEY, {}))
  const [basket, setBasket] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isReady, setIsReady] = useState(IS_DEMO)
  const [isBusy, setIsBusy] = useState(false)
  const [lastAdded, setLastAdded] = useState(null)
  const initialised = useRef(false)
  const checkoutListener = useRef(false)

  useEffect(() => writeJson(ITEMS_KEY, items), [items])
  useEffect(() => writeJson(ANSWERS_KEY, answers), [answers])

  const isAuthenticated = !!(basket?.username_id || basket?.username)
  const username = basket?.username || null

  const open = useCallback(() => {
    setIsOpen(true)
    loadTebexSdk().catch(() => {}) // warm the SDK while the buyer reviews the cart
  }, [])
  const close = useCallback(() => {
    setIsOpen(false)
    removeKeys(REOPEN_KEY)
  }, [])

  const setAnswers = useCallback((patch) => setAnswersState((prev) => ({ ...prev, ...patch })), [])

  /**
   * Reconcile the saved cart against the live catalog once it loads.
   * localStorage outlives the catalog: a package removed in Tebex would stay in
   * the cart forever and make Tebex reject the whole basket with a 400.
   */
  useEffect(() => {
    if (catalogLoading || !catalog.length) return
    const byId = new Map(catalog.map((p) => [String(p.id), p]))
    setItems((prev) => {
      const next = prev
        .filter((item) => byId.has(String(item.id)))
        .map((item) => {
          const live = byId.get(String(item.id))
          return { ...item, name: live.name, price: packagePrice(live), image: live.image, type: live.type }
        })
      const unchanged =
        next.length === prev.length &&
        next.every((n, i) => n.price === prev[i].price && n.name === prev[i].name && n.image === prev[i].image)
      if (next.length < prev.length) console.warn(`[cart] dropped ${prev.length - next.length} stale item(s)`)
      return unchanged ? prev : next
    })
  }, [catalog, catalogLoading])

  /* Create or restore the Tebex basket; re-open the cart after a login round-trip. */
  useEffect(() => {
    if (IS_DEMO || initialised.current) return
    initialised.current = true

    ;(async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        if (params.has('authed')) {
          params.delete('authed')
          const qs = params.toString()
          window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
        }

        let active = null
        const saved = readJson(BASKET_KEY, null)
        if (saved) {
          try {
            active = await getBasket(saved)
            // Completed = paid (e.g. via the hosted page, outside the overlay):
            // the local cart was bought, and the basket cannot take new packages.
            if (active?.complete) {
              active = null
              setItems([])
            }
          } catch {
            active = null
          }
        }
        if (!active) {
          active = await createBasket()
          writeJson(BASKET_KEY, active.ident)
        }
        setBasket(active)

        if ((active.username_id || active.username) && readJson(REOPEN_KEY, null)) setIsOpen(true)
      } catch (err) {
        console.error('[cart] basket init failed:', err)
      } finally {
        setIsReady(true)
      }
    })()
  }, [])

  /** Option fields still unanswered across the cart, de-duplicated by name. */
  const missingOptions = useMemo(() => {
    const byName = new Map()
    for (const item of items) {
      for (const option of item.options || []) {
        if (!isFillableOption(option) || option?.required === false) continue
        const answered = answers[option.name]
        if (answered != null && String(answered).trim() !== '') continue
        if (!byName.has(option.name)) byName.set(option.name, option)
      }
    }
    return [...byName.values()]
  }, [items, answers])

  /** Every fillable option in the cart, rendered as fields, answered once, shared. */
  const optionFields = useMemo(() => {
    const seen = new Map()
    for (const item of items) {
      for (const option of item.options || []) {
        if (isFillableOption(option) && !seen.has(option.name)) seen.set(option.name, option)
      }
    }
    return [...seen.values()]
  }, [items])

  const addItem = useCallback(
    async (pkg, quantity = 1) => {
      if (pkg?.preview) {
        toast.info('This tier is a preview. It is not in the store yet.')
        return
      }
      const oneOff = pkg.type === 'subscription' || pkg.disable_quantity
      setItems((prev) => {
        const found = prev.find((i) => i.id === pkg.id)
        if (found) {
          if (oneOff) return prev
          return prev.map((i) => (i.id === pkg.id ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i))
        }
        return [
          ...prev,
          {
            id: pkg.id,
            name: pkg.name,
            price: packagePrice(pkg),
            image: pkg.image,
            type: pkg.type,
            categoryName: pkg.categoryName || pkg.category?.name || '',
            oneOff,
            options: Array.isArray(pkg.options) ? pkg.options : null,
            quantity: oneOff ? 1 : quantity,
          },
        ]
      })
      setLastAdded({ id: pkg.id, at: Date.now() })
      setIsOpen(true)

      /*
       * The list endpoints omit `options`; only `GET /packages/{id}` returns them.
       * Without this fetch the cart never learns a package needs e.g. an email,
       * and Tebex rejects the basket with an error that looks like a bad id.
       */
      if (!IS_DEMO && !Array.isArray(pkg.options)) {
        try {
          const full = await getPackage(pkg.id)
          setItems((prev) => prev.map((i) => (i.id === pkg.id ? { ...i, options: full?.options || [] } : i)))
        } catch (err) {
          console.error('[cart] failed to load package options:', pkg.id, err)
        }
      }
    },
    [toast],
  )

  const setQuantity = useCallback((id, quantity) => {
    setItems((prev) =>
      quantity < 1
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id && !i.oneOff ? { ...i, quantity: Math.min(99, quantity) } : i)),
    )
  }, [])

  const removeItem = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  /** Send the buyer to Cfx.re auth; the cart is in localStorage and survives the redirect. */
  const login = useCallback(async () => {
    if (demoMode) {
      toast.info('Signing in with FiveM works once the Tebex store is connected.')
      return { demo: true }
    }
    if (!basket?.ident) {
      toast.error('Your session expired. Refresh the page, your cart is saved.')
      return { error: 'no-basket' }
    }
    try {
      if (items.length) writeJson(REOPEN_KEY, 1)
      const returnUrl = `${window.location.origin}${window.location.pathname}?authed=1`
      const links = await getBasketAuthLinks(basket.ident, returnUrl)
      const target = links.find((l) => /fivem|cfx/i.test(l.name || '')) || links[0]
      if (!target?.url) {
        toast.error('No sign-in method is configured in Tebex. Please report this on Discord.')
        return { error: 'no-auth-link' }
      }
      window.location.href = target.url
      return { redirecting: true }
    } catch (err) {
      console.error('[cart] auth links failed:', err)
      toast.error('Sign-in could not be started. Please try again in a moment.')
      return { error: 'auth-failed' }
    }
  }, [basket, items.length, toast, demoMode])

  /**
   * Sign out. Tebex baskets carry the identity, so this abandons the basket and
   * starts a fresh one. Local items are kept, emptying someone's cart because
   * they switched accounts is hostile.
   */
  const logout = useCallback(async () => {
    if (IS_DEMO) return
    removeKeys(BASKET_KEY, REOPEN_KEY)
    try {
      const fresh = await createBasket()
      writeJson(BASKET_KEY, fresh.ident)
      setBasket(fresh)
      toast.info('You are signed out.')
    } catch (err) {
      console.error('[cart] logout failed:', err)
      setBasket(null)
    }
  }, [toast])

  /**
   * Make the remote basket match the local cart: add what is missing, fix
   * quantities, drop what the buyer removed. Returns the fresh basket and any
   * per-item failures.
   */
  const syncBasket = useCallback(async () => {
    let current = basket
    try {
      current = await getBasket(basket.ident) // the cached copy can be stale after login
    } catch {
      /* fall back to the cached copy */
    }

    const remote = new Map((current?.packages || []).map((p) => [p.id, p]))
    const local = new Set(items.map((i) => i.id))
    const failures = []

    for (const p of current?.packages || []) {
      if (local.has(p.id)) continue
      try {
        await removePackageFromBasket(basket.ident, p.id)
      } catch (err) {
        console.error('[cart] remove during sync failed:', p.id, err)
      }
    }

    for (const item of items) {
      const inBasket = remote.get(item.id)
      try {
        if (!inBasket) {
          await addPackageToBasket(basket.ident, item.id, item.quantity, buildVariableData({ options: item.options }, answers))
        } else if (basketQuantity(inBasket) !== item.quantity && !item.oneOff) {
          await updateBasketQuantity(basket.ident, item.id, item.quantity)
        }
      } catch (err) {
        console.error('[cart] sync failed for item:', item.id, err.status, err.detail || err.message)
        failures.push({ id: item.id, name: item.name, status: err.status, detail: err.detail })
      }
    }

    const fresh = await getBasket(basket.ident)
    setBasket(fresh)
    return { fresh, failures }
  }, [basket, items, answers])

  const resetAfterPurchase = useCallback(async () => {
    setItems([])
    removeKeys(BASKET_KEY, REOPEN_KEY)
    try {
      const next = await createBasket()
      writeJson(BASKET_KEY, next.ident)
      setBasket(next)
    } catch (err) {
      console.error('[cart] post-purchase basket reset failed:', err)
    }
  }, [])

  const checkout = useCallback(async () => {
    if (demoMode) return { error: 'demo' }
    if (!items.length) return { error: 'empty' }
    if (!basket?.ident) return { error: 'no-basket' }
    if (!isAuthenticated) return login()
    if (missingOptions.length) return { error: 'missing-options', options: missingOptions }

    setIsBusy(true)
    try {
      const { fresh, failures } = await syncBasket()

      /*
       * Verify before launching. Tebex renders "Empty basket, return to the
       * store" if the overlay opens on a basket with no packages: a dead end.
       */
      if (!fresh.packages?.length) {
        const stale = failures.some((f) => f.status === 400)
        const needsLogin = failures.some((f) => f.status === 422)
        return { error: stale ? 'stale-items' : needsLogin ? 'needs-login' : 'sync-failed', failures }
      }
      if (failures.length) return { error: 'partial', failures }

      const Tebex = await loadTebexSdk().catch(() => null)
      if (Tebex?.checkout) {
        Tebex.checkout.init({
          ident: fresh.ident,
          theme: 'dark',
          locale: 'en_US',
          colors: CHECKOUT_COLORS,
        })
        if (!checkoutListener.current) {
          checkoutListener.current = true
          Tebex.checkout.on('payment:complete', () => {
            resetAfterPurchase()
            window.location.assign('/thank-you')
          })
        }
        Tebex.checkout.launch()
        setIsOpen(false)
        return { launched: true }
      }

      // SDK blocked (ad-blocker, CSP…): fall back to the hosted checkout page.
      window.location.href = fresh.links?.checkout || STORE_URL
      return { redirected: true }
    } catch (err) {
      console.error('[cart] checkout failed:', err)
      return { error: 'sync-failed' }
    } finally {
      setIsBusy(false)
    }
  }, [items.length, basket, isAuthenticated, login, missingOptions, syncBasket, resetAfterPurchase, demoMode])

  const addCoupon = useCallback(
    async (code) => {
      if (demoMode) {
        toast.info('Discount codes work once the Tebex store is connected.')
        return false
      }
      if (!basket?.ident || !isAuthenticated) return false
      setIsBusy(true)
      try {
        // A coupon applies to what is in the remote basket, so sync first.
        await syncBasket()
        await applyCoupon(basket.ident, code)
        setBasket(await getBasket(basket.ident))
        toast.success(`Code ${code.toUpperCase()} applied`)
        return true
      } catch (err) {
        toast.error(err.detail || 'That code is not valid.')
        return false
      } finally {
        setIsBusy(false)
      }
    },
    [basket, isAuthenticated, syncBasket, toast, demoMode],
  )

  const dropCoupon = useCallback(
    async (code) => {
      if (!basket?.ident) return
      try {
        await removeCoupon(basket.ident, code)
        setBasket(await getBasket(basket.ident))
      } catch (err) {
        console.error('[cart] remove coupon failed:', err)
      }
    },
    [basket],
  )

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0)
  const coupons = basket?.coupons || []
  // After a coupon the remote total is the truth, but only while it covers the same items.
  const basketInSync =
    coupons.length > 0 &&
    (basket?.packages || []).length === items.length &&
    items.every((i) => (basket.packages || []).some((p) => p.id === i.id && basketQuantity(p) === i.quantity))
  const total = basketInSync ? Number(basket.total_price) : subtotal
  const has = useCallback((id) => items.some((i) => i.id === id), [items])

  const value = useMemo(
    () => ({
      items, count, subtotal, total, coupons, isOpen, isReady, isBusy, isAuthenticated, username, lastAdded, isDemo: demoMode,
      answers, setAnswers, missingOptions, optionFields,
      has, addItem, removeItem, setQuantity, clear, open, close, checkout, login, logout, addCoupon, dropCoupon,
    }),
    [items, count, subtotal, total, coupons, isOpen, isReady, isBusy, isAuthenticated, username, lastAdded, demoMode,
     answers, setAnswers, missingOptions, optionFields,
     has, addItem, removeItem, setQuantity, clear, open, close, checkout, login, logout, addCoupon, dropCoupon],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
