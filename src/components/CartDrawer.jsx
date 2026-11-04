import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'
import PackageArt from './PackageArt'
import { formatPrice, packagePrice, productPath } from '../lib/tebex'
import { useCart } from '../stores/cartStore'
import { useCatalog } from '../stores/catalogStore'
import { lockScroll } from '../lib/lenis'
import { DISCORD_URL } from '../data/site'

const MESSAGES = {
  demo: 'Demo mode: checkout works as soon as the Tebex token is set. Everything before that already works.',
  'no-basket': 'Your session expired. Refresh the page, your cart is saved.',
  'needs-login': 'Your FiveM session expired. Sign in again to check out.',
  'sync-failed':
    'We could not sync your cart with Tebex, so we stopped instead of opening an empty checkout. Try again or let us know on Discord.',
}

export default function CartDrawer() {
  const {
    items, isOpen, close, removeItem, setQuantity, clear, subtotal, total, count, coupons,
    checkout, isAuthenticated, username, isBusy, answers, setAnswers, optionFields, addCoupon, dropCoupon,
    addItem, has, isDemo,
  } = useCart()
  const { featured, currency } = useCatalog()
  // Small carts leave the drawer half empty, fill it with featured packages.
  const suggestions = items.length < 3 ? featured.filter((p) => !has(p.id)).slice(0, 3 - items.length) : []
  const [notice, setNotice] = useState(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setNotice(null)
      return
    }
    lockScroll(true)
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  const handleCheckout = async () => {
    setNotice(null)
    const result = await checkout()
    const error = result?.error
    if (!error) return
    if (error === 'missing-options') {
      setNotice({ text: 'Fill in the required fields above first.' })
      document.querySelector('[data-cart-options] input')?.focus()
    } else if (error === 'stale-items') {
      setNotice({
        text: 'Some items are no longer available in the store. Empty your cart and add them again.',
        action: { label: 'Empty cart', run: clear },
      })
    } else if (error === 'partial') {
      const names = result.failures.map((f) => f.name).join(', ')
      setNotice({ text: `Not every item could be added (${names}). Remove them and try again.` })
    } else if (MESSAGES[error]) {
      setNotice({ text: MESSAGES[error] })
    }
  }

  const buttonLabel = isBusy
    ? 'One moment…'
    : isDemo
      ? 'Checkout (demo)'
      : isAuthenticated
        ? `Secure checkout · ${formatPrice(total, currency)}`
        : 'Sign in with FiveM'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
          />

          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 36 }}
            className="fixed bottom-0 right-0 top-0 z-[71] flex w-full max-w-[28rem] flex-col border-l border-white/[0.07] bg-ink-900 shadow-[-40px_0_120px_-40px_rgb(255_20_160/0.45)] sm:bottom-3 sm:right-3 sm:top-3 sm: sm:border"
          >
            <header className="relative flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black uppercase">Your cart</h2>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-pink-500/15 px-2 font-label text-xs font-bold text-pink-300">
                  {count}
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 text-mist-300 transition-colors hover:border-white/25 hover:text-chalk"
              >
                <Icon name="close" size={18} />
              </button>
              <span className="rule-pink absolute inset-x-0 bottom-0" />
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-pink-500/25 blur-2xl" />
                  <img src="/brand/logo-md.webp" alt="" width="448" height="491" className="relative h-auto w-36 opacity-90" />
                </div>
                <div>
                  <p className="font-display text-xl font-black uppercase text-chalk">Nothing in here yet</p>
                  <p className="mt-1.5 text-sm text-mist-400">The city is waiting. Pick a package to get started.</p>
                </div>
                <Link to="/store" onClick={close} className="btn-primary">
                  Browse the store
                  <Icon name="arrowRight" size={16} />
                </Link>
              </div>
            ) : (
              <>
                {!isDemo && !isAuthenticated && (
                  <div className="mx-6 mt-4 flex gap-3  border border-pink-500/25 bg-pink-500/[0.07] px-4 py-3 text-[0.8rem] leading-relaxed text-mist-200">
                    <Icon name="info" size={18} className="mt-0.5 text-pink-400" />
                    <span>
                      Sign in with your <strong className="text-chalk">FiveM account</strong> so we know who to deliver to.
                      Your cart stays saved.
                    </span>
                  </div>
                )}

                <ul className="flex-1 overflow-y-auto overscroll-contain px-6 py-4" data-lenis-prevent>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex gap-4 border-b border-white/[0.06] py-4 last:border-0"
                      >
                        <div className="h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden  border border-white/[0.07]">
                          {item.image ? (
                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <PackageArt pkg={{ id: item.id, name: item.name, categoryName: item.categoryName }} compact className="h-full w-full" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[0.92rem] font-semibold text-chalk">{item.name}</p>
                              {item.categoryName && (
                                <p className="mt-0.5 font-label text-[0.6rem] uppercase tracking-[0.18em] text-mist-500">
                                  {item.categoryName}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.name}`}
                              className="-mr-1.5 cursor-pointer rounded-full p-1.5 text-mist-500 transition-colors hover:bg-pink-500/10 hover:text-pink-300"
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            {item.oneOff ? (
                              <span className="font-label text-[0.62rem] uppercase tracking-[0.16em] text-mist-500">
                                {item.type === 'subscription' ? 'Subscription' : '1 per order'}
                              </span>
                            ) : (
                              <div className="flex items-center rounded-full border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => setQuantity(item.id, item.quantity - 1)}
                                  aria-label="Less"
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center text-mist-300 hover:text-pink-300"
                                >
                                  <Icon name="minus" size={14} />
                                </button>
                                <span className="w-6 text-center font-label text-sm font-bold tabular-nums text-chalk">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => setQuantity(item.id, item.quantity + 1)}
                                  aria-label="More"
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center text-mist-300 hover:text-pink-300"
                                >
                                  <Icon name="plus" size={14} />
                                </button>
                              </div>
                            )}
                            <span className="font-display text-[1rem] font-bold tabular-nums text-chalk">
                              {formatPrice(item.price * item.quantity, currency)}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>

                  {suggestions.length > 0 && (
                    <li className="mt-6 list-none">
                      <p className="mb-3 font-label text-[0.62rem] font-bold uppercase tracking-[0.2em] text-mist-500">Complete the look</p>
                      <div className="space-y-2">
                        {suggestions.map((p) => (
                          <div key={p.id} className="flex items-center gap-3  border border-white/[0.06] bg-void/40 p-2.5 pr-3">
                            <Link to={productPath(p)} onClick={close} className="h-12 w-12 shrink-0 overflow-hidden ">
                              {p.image ? (
                                <img src={p.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <PackageArt pkg={p} compact className="h-full w-full" />
                              )}
                            </Link>
                            <Link to={productPath(p)} onClick={close} className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-mist-100">{p.name}</p>
                              <p className="font-label text-xs text-mist-400">{formatPrice(packagePrice(p), p.currency || currency)}</p>
                            </Link>
                            <button
                              type="button"
                              onClick={() => addItem(p)}
                              aria-label={`Add ${p.name}`}
                              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-pink-500/50 text-pink-300 transition-colors hover:bg-pink-500 hover:text-white"
                            >
                              <Icon name="plus" size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>

                <footer className="border-t border-white/[0.07] bg-ink-850/60 px-6 pb-6 pt-5 ">
                  {notice && (
                    <div role="alert" className="mb-4  border border-pink-500/30 bg-pink-500/[0.08] px-4 py-3 text-[0.8rem] leading-relaxed text-mist-100">
                      <p>{notice.text}</p>
                      {notice.action && (
                        <button
                          type="button"
                          onClick={() => {
                            notice.action.run()
                            setNotice(null)
                          }}
                          className="mt-2 cursor-pointer font-label text-[0.68rem] font-bold uppercase tracking-[0.14em] text-pink-300 underline underline-offset-4"
                        >
                          {notice.action.label}
                        </button>
                      )}
                    </div>
                  )}

                  {optionFields.length > 0 && (
                    <div data-cart-options className="mb-4 space-y-3  border border-white/[0.07] bg-void/50 p-4">
                      <p className="font-label text-[0.62rem] font-bold uppercase tracking-[0.18em] text-mist-300">Needed for delivery</p>
                      {optionFields.map((option) => (
                        <label key={option.name} className="block">
                          <span className="mb-1.5 block text-xs text-mist-400">
                            {option.description || option.name}
                            {option.required !== false && <span className="ml-1 text-pink-400">*</span>}
                          </span>
                          <input
                            type={option.type === 'email' ? 'email' : option.type === 'number' ? 'number' : 'text'}
                            value={answers[option.name] || ''}
                            onChange={(e) => setAnswers({ [option.name]: e.target.value })}
                            placeholder={option.type === 'email' ? 'you@example.com' : ''}
                            autoComplete={option.type === 'email' ? 'email' : 'off'}
                            className="field"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {isAuthenticated && !isDemo && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (code.trim()) addCoupon(code.trim()).then((ok) => ok && setCode(''))
                      }}
                      className="mb-3 flex gap-2"
                    >
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Discount code"
                        aria-label="Discount code"
                        className="field min-w-0 flex-1 font-label uppercase placeholder:normal-case"
                      />
                      <button type="submit" disabled={isBusy} className="btn-ghost px-4 py-2.5">
                        Apply
                      </button>
                    </form>
                  )}

                  {coupons.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {coupons.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => dropCoupon(c.code)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-500/10 px-3 py-1 font-label text-[0.68rem] uppercase tracking-wider text-pink-200"
                        >
                          <Icon name="percent" size={13} />
                          {c.code}
                          <Icon name="close" size={12} />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mb-4 space-y-1.5">
                    {total !== subtotal && (
                      <div className="flex items-baseline justify-between text-sm text-mist-400">
                        <span>Subtotal</span>
                        <span className="tabular-nums line-through">{formatPrice(subtotal, currency)}</span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between">
                      <span className="font-label text-[0.68rem] uppercase tracking-[0.18em] text-mist-300">Total</span>
                      <span className="font-display text-3xl font-black tracking-tight tabular-nums text-chalk">
                        {formatPrice(total, currency)}
                      </span>
                    </div>
                  </div>

                  <button type="button" onClick={handleCheckout} disabled={isBusy} className="btn-primary w-full py-4">
                    <Icon name={isAuthenticated || isDemo ? 'lock' : 'gamepad'} size={17} />
                    {buttonLabel}
                  </button>

                  <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-mist-500">
                    <Icon name="shield" size={13} className="text-pink-400" />
                    {username ? (
                      <>
                        Delivering to <span className="font-semibold text-mist-200">{username}</span> · Paid through Tebex
                      </>
                    ) : (
                      'Secure payment via Tebex · Cards, PayPal & Apple Pay'
                    )}
                  </p>
                  <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1.5 block text-center text-[0.7rem] text-mist-500 transition-colors hover:text-pink-300"
                  >
                    Questions? Ask on Discord.
                  </a>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
