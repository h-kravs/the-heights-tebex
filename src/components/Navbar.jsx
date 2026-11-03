import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'
import { useCart } from '../stores/cartStore'
import { DISCORD_URL, CONNECT_URL, NAV } from '../data/site'
import { lockScroll } from '../lib/lenis'

/** Small skewed slab: the navbar's unit of UI. */
const slab = 'flex h-10 cursor-pointer items-center gap-2 px-4 font-label text-[0.74rem] uppercase tracking-[0.1em] transition-colors [transform:skewX(-10deg)] [&>*]:[transform:skewX(10deg)]'

function AccountControl() {
  const { isAuthenticated, isReady, username, login, logout } = useCart()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!isReady) return <div className="shimmer hidden h-10 w-24 sm:block" aria-hidden="true" />

  if (!isAuthenticated) {
    return (
      <button type="button" onClick={login} aria-label="Sign in with FiveM" className={`${slab} hidden border border-white/20 text-chalk hover:border-pink-500 hover:bg-pink-500/10 sm:flex`}>
        <Icon name="gamepad" size={16} />
        <span>Sign in</span>
      </button>
    )
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} className={`${slab} border border-white/20 text-chalk hover:border-pink-500`}>
        <span className="flex h-6 w-6 items-center justify-center bg-pink-500 text-void">
          <Icon name="user" size={13} strokeWidth={2.4} />
        </span>
        <span className="max-w-[8rem] truncate">{username || 'FiveM player'}</span>
        <Icon name="chevronDown" size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+8px)] min-w-[13rem] overflow-hidden border border-white/10 bg-ink-850/95 shadow-2xl shadow-black/70 backdrop-blur-xl"
          >
            <div className="border-b border-white/[0.06] px-4 py-3">
              <p className="font-label text-[0.62rem] uppercase tracking-[0.18em] text-mist-500">Signed in as</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-chalk">{username || 'FiveM player'}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left text-sm text-mist-200 transition-colors hover:bg-pink-500/10 hover:text-white"
            >
              <Icon name="logout" size={16} className="text-pink-400" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CartButton() {
  const { count, open, lastAdded } = useCart()
  return (
    <button type="button" onClick={open} className={`${slab} bg-pink-500 text-void shadow-[4px_4px_0_0_var(--color-chalk)] hover:bg-pink-400`}>
      <Icon name="cart" size={17} />
      <span className="hidden sm:inline">Cart</span>
      <span className="sr-only">{count === 1 ? 'item' : 'items'} in cart:</span>
      <motion.span
        key={lastAdded?.at || 'idle'}
        initial={lastAdded ? { scale: 1.6 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
        className="flex h-5 min-w-5 items-center justify-center bg-void px-1.5 font-label text-[0.68rem] text-white tabular-nums"
      >
        {count}
      </motion.span>
    </button>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { login, isAuthenticated } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    lockScroll(true)
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      lockScroll(false)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const isActive = (to) => (to === '/store' ? location.pathname.startsWith('/store') || location.pathname.startsWith('/product') : location.pathname === to)

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled ? 'border-b border-white/[0.08] bg-void/80 backdrop-blur-2xl' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-x flex h-[4.5rem] items-center justify-between gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-3">
            <img src="/brand/logo-sm.webp" alt="The Heights LA" width="44" height="48" className="h-11 w-auto drop-shadow-[0_0_14px_rgba(255,20,160,0.5)]" />
            <span className="hidden font-display text-[1.15rem] font-black uppercase leading-none text-chalk md:block">
              The Heights LA
              <span className="mt-1 block font-label text-[0.62rem] tracking-[0.2em] text-pink-400">Official store</span>
            </span>
          </Link>

          <nav aria-label="Main menu" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = isActive(item.to)
              return (
                <NavLink key={item.to} to={item.to} className={`relative px-4 py-2 font-label text-[0.78rem] uppercase tracking-[0.12em] transition-colors ${active ? 'text-white' : 'text-mist-300 hover:text-chalk'}`}>
                  {active && <motion.span layoutId="nav-slab" className="absolute inset-0 bg-pink-500/15 ring-1 ring-pink-500/60 [transform:skewX(-10deg)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <span className="relative">{item.label}</span>
                </NavLink>
              )
            })}
            <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 px-4 py-2 font-label text-[0.78rem] uppercase tracking-[0.12em] text-mist-300 transition-colors hover:text-chalk">
              <Icon name="discord" size={15} />
              Discord
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <AccountControl />
            <CartButton />
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="flex h-10 w-10 cursor-pointer items-center justify-center border border-white/20 text-chalk lg:hidden">
              <Icon name="menu" size={18} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="fixed inset-0 z-[60] flex flex-col bg-void/95 px-6 pb-8 pt-5 backdrop-blur-2xl lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(60%_50%_at_80%_0%,rgb(255_20_160/0.28),transparent)]" />
            <div className="bg-halftone pointer-events-none absolute inset-0" />
            <div className="relative flex items-center justify-between">
              <img src="/brand/logo-sm.webp" alt="The Heights LA" width="44" height="48" className="h-11 w-auto" />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-11 w-11 cursor-pointer items-center justify-center border border-white/20 text-chalk">
                <Icon name="close" size={20} />
              </button>
            </div>

            <nav aria-label="Mobile menu" className="relative mt-12 flex flex-col">
              {[{ label: 'Home', to: '/' }, ...NAV].map((item, i) => (
                <motion.div key={item.to} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                  <Link to={item.to} className="flex items-center justify-between border-b border-white/[0.06] py-5 font-display text-5xl font-black uppercase leading-none text-chalk">
                    <span className="flex items-baseline gap-4">
                      <span className="font-label text-sm text-pink-500">0{i + 1}</span>
                      {item.label}
                    </span>
                    <Icon name="arrowUpRight" size={26} className="text-pink-500" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="relative mt-auto flex flex-col gap-4">
              {!isAuthenticated && (
                <button type="button" onClick={login} className="btn-ghost w-full">
                  <Icon name="gamepad" size={17} />
                  <span>Sign in with FiveM</span>
                </button>
              )}
              <a href={CONNECT_URL} className="btn-chrome w-full">
                <Icon name="play" size={15} />
                <span>Play now</span>
              </a>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="btn-discord w-full">
                <Icon name="discord" size={17} />
                <span>Discord</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
