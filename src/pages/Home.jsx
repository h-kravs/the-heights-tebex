import { lazy, Suspense, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import CountUp from '../components/CountUp'
import Drip from '../components/Drip'
import Faq from '../components/Faq'
import PackageArt from '../components/PackageArt'
import SectionHead from '../components/SectionHead'
import VipSwitcher from '../components/VipSwitcher'
import StaticHeights, { hasWebGL } from '../components/StaticHeights'
import { useCatalog } from '../stores/catalogStore'
import { useCart } from '../stores/cartStore'
import { useServerStats } from '../lib/useServerStats'
import { useTitle } from '../lib/useTitle'
import { categoryIcon, isVipCategory } from '../lib/categoryMeta'
import { billingPeriod, categoryPath, discountPercent, formatPrice, packageBadges, packagePrice, plainText, productPath } from '../lib/tebex'
import { CONNECT_URL, DISCORD_URL, FAQ, PILLARS, STEPS, TICKER } from '../data/site'

// Three.js is only needed here: split into its own chunk.
const HeightsScene = lazy(() => import('../components/HeightsScene'))

const EASE = [0.16, 1, 0.3, 1]

/* ───────────────────────── Hero ───────────────────────── */

function HeroStats() {
  const stats = useServerStats()
  const items = []
  if (stats?.fivem?.ok) {
    items.push({ label: 'Players in the city', value: stats.fivem.players, suffix: stats.fivem.maxPlayers ? ` / ${stats.fivem.maxPlayers}` : '', live: true })
  }
  if (stats?.discord?.ok) {
    items.push({ label: 'Discord members', value: stats.discord.members })
    items.push({ label: 'Online now', value: stats.discord.online, live: true })
  }

  // No live source configured: show what is always true instead of empty dashes.
  if (!items.length) {
    return (
      <ul className="flex flex-wrap gap-x-7 gap-y-2">
        {['Instant delivery', 'Secure via Tebex', 'Apple Pay & PayPal'].map((t) => (
          <li key={t} className="flex items-center gap-2 font-label text-[0.74rem] uppercase tracking-[0.1em] text-mist-200">
            <span className="h-2 w-2 bg-pink-500 [transform:skewX(-10deg)]" />
            {t}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-5">
      {items.map((s) => (
        <div key={s.label}>
          <dt className="flex items-center gap-2 font-label text-[0.66rem] uppercase tracking-[0.18em] text-mist-400">
            {s.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]" />}
            {s.label}
          </dt>
          <dd className="mt-1.5 font-display text-3xl font-black text-chalk sm:text-4xl">
            <CountUp value={s.value} />
            {s.suffix && <span className="text-mist-500">{s.suffix}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** The best offer in the catalog, stuck on the hero like a price ticket. */
function HeroTicket({ pkg, style }) {
  const { currency } = useCatalog()
  if (!pkg) return null
  const discount = discountPercent(pkg)
  return (
    <motion.div initial={{ opacity: 0, y: 30, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ delay: 1.5, duration: 0.9, ease: EASE }} className="pointer-events-auto absolute bottom-10 right-6 hidden lg:block xl:right-12">
      <motion.div style={style}>
        <Link to={productPath(pkg)} className="group flex border-2 border-chalk bg-void shadow-[6px_6px_0_0_var(--color-pink-500)] transition-transform hover:-translate-y-1">
          {/* Stub */}
          <span className="flex w-[5.5rem] flex-col items-center justify-center bg-pink-500 px-3 py-3 text-center text-void">
            {discount > 0 ? (
              <>
                <span className="font-display text-[2.2rem] font-black leading-none">{discount}%</span>
                <span className="font-label text-[0.62rem] uppercase tracking-[0.2em]">off</span>
              </>
            ) : (
              <>
                <Icon name="flame" size={26} strokeWidth={2.2} />
                <span className="mt-1 font-label text-[0.62rem] uppercase tracking-[0.2em]">Drop</span>
              </>
            )}
          </span>
          <span className="perforated w-px self-stretch" aria-hidden="true" />
          {/* Body */}
          <span className="flex items-center gap-4 py-3 pl-4 pr-4">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-white/15">
              {pkg.image ? <img src={pkg.image} alt="" className="h-full w-full object-cover" /> : <PackageArt pkg={pkg} compact className="h-full w-full" />}
            </span>
            <span className="min-w-0">
              <span className="block font-label text-[0.62rem] uppercase tracking-[0.2em] text-pink-400">{discount > 0 ? 'Limited drop' : 'Featured drop'}</span>
              <span className="mt-0.5 block max-w-[11rem] truncate font-display text-[1.25rem] font-black uppercase leading-tight text-chalk">{pkg.name}</span>
              <span className="font-label text-[0.8rem] text-mist-200">{formatPrice(packagePrice(pkg), pkg.currency || currency)}</span>
            </span>
            <span className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center bg-chalk text-void transition-colors group-hover:bg-pink-500 group-hover:text-white">
              <Icon name="arrowUpRight" size={17} strokeWidth={2.4} />
            </span>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  )
}

function Hero({ drop }) {
  const [webgl] = useState(() => hasWebGL())
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 140])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  const line = (delay) => ({
    initial: { y: '110%' },
    animate: { y: '0%' },
    transition: { duration: 1.1, delay, ease: EASE },
  })

  return (
    // Below lg the sign sits above the copy, so the copy starts under it.
    <section ref={ref} className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 pt-[44svh] lg:items-center lg:pb-10 lg:pt-28">
      {webgl ? (
        <Suspense fallback={<StaticHeights />}>
          <HeightsScene />
        </Suspense>
      ) : (
        <StaticHeights />
      )}

      {/* Legibility: a dark band behind the navbar so the chrome drips never fight the menu */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-void via-void/70 to-transparent" />
      {/* Legibility: darken behind the copy without dimming the sign */}
      <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#06030a_0%,rgb(6_3_10/0.85)_26%,transparent_56%)] lg:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-void via-void/85 to-transparent lg:h-56 lg:via-void/40" />

      <motion.div style={{ y: copyY, opacity: copyOpacity }} className="container-x relative">
        <div className="max-w-[44rem]">
          <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            The Heights LA · Official store
          </motion.p>

          <h1 className="font-poster mt-6 text-[clamp(3.8rem,11.5vw,9.8rem)] font-black uppercase leading-[0.86] tracking-[-0.005em]">
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span className="block" {...line(0.3)}>
                Own the
              </motion.span>
            </span>
            <span className="neon-room block overflow-hidden">
              <motion.span className="text-neon block" {...line(0.42)}>
                Heights.
              </motion.span>
            </span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.6, ease: EASE }} className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-mist-300 sm:mt-7 sm:text-lg">
            VIP memberships, exclusive rides, bundles and items for The Heights LA. Secure checkout through Tebex, delivered to your character the moment you reconnect. Every purchase keeps the city running.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.72, ease: EASE }} className="mt-9 flex flex-wrap gap-5 sm:mt-10">
            <Link to="/store" className="btn-chrome px-8 py-4">
              <Icon name="cart" size={17} strokeWidth={2.2} />
              Shop the store
            </Link>
            <Link to="/vip" className="btn-ghost px-8 py-4">
              <Icon name="crown" size={16} strokeWidth={2.2} />
              VIP memberships
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="mt-10 border-t border-white/[0.1] pt-6 sm:mt-12 sm:pt-7">
            <HeroStats />
          </motion.div>
        </div>
      </motion.div>

      <HeroTicket pkg={drop} style={{ opacity: copyOpacity }} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-label text-[0.62rem] uppercase tracking-[0.3em] text-mist-500 lg:flex" aria-hidden="true">
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-white/10">
          <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-pink-500" animate={{ y: ['-100%', '200%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
        </span>
      </motion.div>
    </section>
  )
}

/* ───────────────────────── Crossing marquee bands ───────────────────────── */

function Track({ words, className, reverse }) {
  const row = [...words, ...words]
  return (
    <div className="flex w-max animate-marquee" style={reverse ? { animationDirection: 'reverse' } : undefined}>
      {[0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0 items-center">
          {row.map((w, i) => (
            <span key={`${copy}-${i}`} className={`flex items-center font-display font-black uppercase tracking-tight ${className}`}>
              <span className="px-6 sm:px-9">{w}</span>
              <span className="h-2.5 w-2.5 rounded-full bg-current opacity-80" />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function Bands() {
  return (
    <section className="relative -mt-6 h-48 overflow-hidden sm:h-64" aria-hidden="true">
      <div className="absolute -left-[5%] -right-[5%] top-1/2 -translate-y-1/2 rotate-[2.5deg] border-y border-white/[0.08] bg-ink-900 py-4 sm:py-5">
        <Track words={TICKER} reverse className="text-outline text-3xl sm:text-5xl" />
      </div>
      <div className="absolute -left-[5%] -right-[5%] top-1/2 -translate-y-1/2 rotate-[-3deg] bg-pink-500 py-4 text-void shadow-[0_0_90px_-10px_rgb(255_20_160/0.9)] sm:py-5">
        <Track words={TICKER} className="text-3xl sm:text-5xl" />
        <Drip className="text-pink-500" height={34} />
      </div>
    </section>
  )
}

/* ───────────────────────── Promises strip ───────────────────────── */

function Promises() {
  return (
    <section className="container-x relative z-10 mt-6">
      <Reveal>
        <ul className="grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <li key={p.title} className="group relative flex items-center gap-4 px-2 py-6 lg:px-6">
              {i > 0 && <span className="pointer-events-none absolute left-0 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-white/10 [transform:translateY(-50%)_skewX(-10deg)] lg:block" aria-hidden="true" />}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-pink-500/50 text-pink-400 transition-colors [transform:skewX(-10deg)] group-hover:bg-pink-500 group-hover:text-void">
                <Icon name={p.icon} size={21} strokeWidth={2.2} className="[transform:skewX(10deg)]" />
              </span>
              <span>
                <span className="block font-display text-[1.1rem] font-black uppercase leading-none text-chalk">{p.title}</span>
                <span className="mt-1.5 block text-[0.82rem] leading-snug text-mist-400">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}

/* ───────────────────────── Categories as lanes ───────────────────────── */

/**
 * Categories as lanes on a road: a row of tall strips, each one a category
 * with its name set vertically. The lane under the cursor widens and turns
 * its name upright, with count, starting price and blurb. On narrow screens
 * the lanes stack and open on tap.
 */
function Lane({ cat, index, active, onActivate }) {
  const { currency } = useCatalog()
  const from = cat.allPackages.length ? Math.min(...cat.allPackages.map(packagePrice)) : 0
  const blurb = plainText(cat.description, 120)
  const icon = categoryIcon(cat.name)

  return (
    <li
      onPointerEnter={() => onActivate(index)}
      onFocus={() => onActivate(index)}
      className={`relative min-h-[7.5rem] overflow-hidden border-b border-white/10 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:min-h-0 lg:border-b-0 lg:border-r ${active ? 'lg:grow-[3.2]' : 'lg:grow'}`}
      style={{ flexBasis: 0 }}
    >
      <Link to={categoryPath(cat)} className={`group flex h-full w-full flex-col justify-between p-6 transition-colors lg:p-8 ${active ? 'bg-ink-850' : 'bg-ink-950 hover:bg-ink-900'}`}>
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-halftone absolute inset-0 opacity-80" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-pink-500/30 blur-[90px]" />
          <Icon name={icon} size={260} strokeWidth={0.5} className="absolute -bottom-12 -right-10 text-pink-500/15" />
        </div>

        <div className="relative flex items-start justify-between">
          <span className="font-label text-[0.72rem] uppercase tracking-[0.18em] text-pink-400">0{index + 1}</span>
          <span className={`flex h-9 w-9 items-center justify-center transition-colors ${active ? 'bg-pink-500 text-void' : 'border border-white/20 text-mist-300'}`}>
            <Icon name={active ? 'arrowUpRight' : icon} size={17} strokeWidth={2.2} />
          </span>
        </div>

        {/* Vertical name while collapsed (desktop) */}
        <span className={`pointer-events-none absolute bottom-8 left-1/2 hidden origin-center -translate-x-1/2 whitespace-nowrap font-display text-[2.6rem] font-black uppercase leading-none text-mist-300 transition-opacity duration-300 [writing-mode:vertical-rl] lg:block ${active ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true">
          {cat.name}
        </span>

        <div className={`relative transition-[opacity,transform] duration-500 ${active ? 'opacity-100 delay-200' : 'lg:translate-y-4 lg:opacity-0'}`}>
          <h3 className="text-[clamp(2rem,4vw,3.6rem)] font-black uppercase leading-[0.9]">{cat.name}</h3>
          <p className="mt-3 font-label text-[0.7rem] uppercase tracking-[0.18em] text-mist-400">
            {cat.allPackages.length} {cat.allPackages.length === 1 ? 'package' : 'packages'}
            {from > 0 && <> · from {formatPrice(from, currency)}</>}
          </p>
          {blurb && <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist-300">{blurb}</p>}
        </div>
      </Link>
    </li>
  )
}

function Categories({ categories }) {
  // VIP leads when it exists: it is what the server most wants to sell.
  const ordered = [...categories].sort((a, b) => Number(isVipCategory(b)) - Number(isVipCategory(a)))
  const [active, setActive] = useState(0)
  return (
    <section className="container-x mt-28">
      <SectionHead
        eyebrow="Categories"
        title="Pick your"
        accent="lane."
        action={
          <Link to="/store" className="btn-ghost self-start md:self-auto">
            Every package
            <Icon name="arrowRight" size={16} strokeWidth={2.2} />
          </Link>
        }
      >
        From an extra character slot to your own crew: everything you need for your story in The Heights.
      </SectionHead>
      <Reveal>
        <ul className="flex flex-col border border-white/10 lg:h-[30rem] lg:flex-row" onPointerLeave={() => setActive(0)}>
          {ordered.map((cat, i) => (
            <Lane key={cat.id} cat={cat} index={i} active={active === i} onActivate={setActive} />
          ))}
        </ul>
      </Reveal>
    </section>
  )
}

/* ───────────────────────── Drops as a set list ───────────────────────── */

/**
 * Featured packages as a set list, not a carousel: one line per drop with
 * the name set huge, and a preview that floats under the cursor. Hover a
 * line and it lights up pink; the plus adds it without leaving the page.
 */
function DropRow({ pkg, index, onHover }) {
  const { addItem, has, open } = useCart()
  const { currency } = useCatalog()
  const inCart = has(pkg.id)
  const badges = packageBadges(pkg)
  const discount = discountPercent(pkg)
  return (
    <li className="group relative border-b border-white/10" onPointerEnter={() => onHover(pkg)} onPointerLeave={() => onHover(null)}>
      <span className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-pink-500/[0.08] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" aria-hidden="true" />
      <div className="relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[3.5rem_1fr_auto_auto] sm:gap-6 lg:py-6">
        <span className="font-label text-[0.8rem] text-mist-500 transition-colors group-hover:text-pink-400">0{index + 1}</span>
        <Link to={productPath(pkg)} className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-label text-[0.66rem] uppercase tracking-[0.18em] text-mist-400">{pkg.categoryName}</span>
            {badges.map((b) => (
              <span key={b.id} className="border border-white/25 px-1.5 py-0.5 font-label text-[0.6rem] uppercase tracking-[0.12em] text-mist-200">
                {b.label}
              </span>
            ))}
            {discount > 0 && <span className="bg-pink-500 px-1.5 py-0.5 font-label text-[0.6rem] uppercase tracking-[0.12em] text-void">-{discount}%</span>}
          </span>
          <span className="mt-1 block truncate font-display text-[clamp(1.7rem,4vw,3.6rem)] font-black uppercase leading-[0.95] text-chalk transition-transform duration-500 group-hover:translate-x-2 group-hover:text-pink-100">
            {pkg.name}
          </span>
        </Link>
        <span className="hidden text-right sm:block">
          <span className="block font-display text-2xl font-black text-chalk tabular-nums">{formatPrice(packagePrice(pkg), pkg.currency || currency)}</span>
          {billingPeriod(pkg) && <span className="font-label text-[0.62rem] uppercase tracking-wider text-mist-500">{billingPeriod(pkg)}</span>}
        </span>
        <button
          type="button"
          onClick={() => (inCart ? open() : addItem(pkg))}
          aria-label={inCart ? `${pkg.name} is in your cart` : `Add ${pkg.name} to cart`}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center transition-colors [transform:skewX(-10deg)] ${inCart ? 'bg-chalk text-void' : 'border border-white/25 text-chalk hover:border-pink-500 hover:bg-pink-500 hover:text-white'}`}
        >
          <Icon name={inCart ? 'check' : 'plus'} size={20} strokeWidth={2.4} className="[transform:skewX(10deg)]" />
        </button>
      </div>
    </li>
  )
}

function Drops({ items, loading }) {
  const [hovered, setHovered] = useState(null)
  const area = useRef(null)
  const x = useSpring(0, { stiffness: 260, damping: 30 })
  const y = useSpring(0, { stiffness: 260, damping: 30 })

  const onMove = (e) => {
    const r = area.current?.getBoundingClientRect()
    if (!r) return
    x.set(e.clientX - r.left)
    y.set(e.clientY - r.top)
  }

  const list = items.slice(0, 6)

  return (
    <section className="container-x mt-32">
      <SectionHead
        eyebrow="Featured drops"
        title="Hot in"
        accent="the city."
        action={
          <Link to="/store" className="btn-ghost self-start md:self-auto">
            Go to the store
            <Icon name="arrowRight" size={16} strokeWidth={2.2} />
          </Link>
        }
      >
        The packages everyone is pulling up in right now.
      </SectionHead>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="shimmer h-20" />
          ))}
        </div>
      ) : (
        <div ref={area} onPointerMove={onMove} className="relative">
          <Reveal as="ul" className="border-t border-white/10">
            {list.map((pkg, i) => (
              <DropRow key={pkg.id} pkg={pkg} index={i} onHover={setHovered} />
            ))}
          </Reveal>

          {/* Floating preview, desktop only */}
          <motion.div style={{ x, y }} className="pointer-events-none absolute left-0 top-0 z-10 hidden lg:block" aria-hidden="true">
            <motion.div
              animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.8, rotate: hovered ? -4 : 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="-translate-x-1/2 -translate-y-[110%] overflow-hidden border-2 border-chalk shadow-[8px_8px_0_0_var(--color-pink-500)]"
              style={{ width: 300, height: 220 }}
            >
              {hovered && (hovered.image ? <img src={hovered.image} alt="" className="h-full w-full object-cover" /> : <PackageArt pkg={hovered} className="h-full w-full" />)}
            </motion.div>
          </motion.div>
        </div>
      )}
    </section>
  )
}

/* ───────────────────────── VIP ───────────────────────── */

function Vip({ category }) {
  return (
    <section className="relative mt-36 py-10">
      <p aria-hidden="true" className="text-outline pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 select-none font-display text-[clamp(10rem,34vw,30rem)] font-black leading-none">
        VIP
      </p>
      <div className="container-x relative">
        <SectionHead
          eyebrow="Memberships"
          title="Live like"
          accent="a VIP."
          action={
            <Link to="/vip" className="btn-ghost self-start md:self-auto">
              Everything about VIP
              <Icon name="arrowRight" size={16} strokeWidth={2.2} />
            </Link>
          }
        >
          Priority queue, monthly perks and exclusive extras. Cancel any time, keep what you paid for.
        </SectionHead>
        <Reveal>
          <VipSwitcher tiers={category.allPackages} />
        </Reveal>
      </div>
    </section>
  )
}

/* ───────────────────────── How it works: the route ───────────────────────── */

function Steps() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 80, damping: 24 })

  return (
    <section className="container-x mt-36">
      <SectionHead eyebrow="How it works" title="Four stops." accent="Then play." />
      <div ref={ref} className="relative grid gap-y-10 lg:grid-cols-4 lg:gap-y-0">
        {/* The route: a hairline that fills pink as you scroll past it */}
        <div className="pointer-events-none absolute left-[1.35rem] top-0 h-full w-px bg-white/10 lg:left-0 lg:top-[2.75rem] lg:h-px lg:w-full" aria-hidden="true">
          <motion.span className="absolute inset-0 origin-top bg-pink-500 shadow-[0_0_12px_rgb(255_20_160)] lg:origin-left" style={{ scaleY: fill, scaleX: 1 }} />
        </div>
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08} className="relative pl-16 lg:pl-0 lg:pr-8">
            <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center border-2 border-pink-500 bg-void font-display text-lg font-black text-chalk [transform:skewX(-10deg)] lg:relative lg:mb-8">
              <span className="[transform:skewX(10deg)]">{s.n}</span>
            </span>
            <h3 className="text-[1.9rem] font-black uppercase leading-none">{s.title}</h3>
            <p className="mt-3 max-w-xs text-[0.92rem] leading-relaxed text-mist-400">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ───────────────────────── Community ───────────────────────── */

function Community() {
  const stats = useServerStats()
  const members = stats?.discord?.ok ? stats.discord.members : null
  const online = stats?.discord?.ok ? stats.discord.online : null

  return (
    <section className="container-x mt-36">
      <Reveal>
        <div className="relative grid overflow-hidden border border-[#5865F2]/40 bg-ink-900 lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-stripes absolute inset-x-0 top-0 h-2 opacity-80" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgb(88_101_242/0.3),transparent_60%),radial-gradient(50%_60%_at_0%_100%,rgb(255_20_160/0.22),transparent_60%)]" />
          <div className="bg-halftone pointer-events-none absolute inset-0 opacity-60" />
          <Icon name="discord" size={360} className="pointer-events-none absolute -bottom-20 -right-16 text-[#5865F2]/[0.08]" />

          <div className="relative p-8 sm:p-12">
            <p className="eyebrow">Community</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5.4vw,4.4rem)] font-black uppercase leading-[0.9]">
              The city lives <span className="text-neon">on Discord.</span>
            </h2>
            <p className="mt-5 max-w-md text-mist-300">Drops, events, patch notes and the staff team all in one place. Questions before you buy? Ask there, a human answers.</p>
            <div className="mt-9 flex flex-wrap gap-5">
              <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="btn-discord px-7 py-4">
                <Icon name="discord" size={18} />
                Join the Discord
              </a>
              <a href={CONNECT_URL} className="btn-ghost px-7 py-4">
                <Icon name="play" size={14} />
                Play now
              </a>
            </div>
          </div>

          {members != null ? (
            <div className="relative grid grid-cols-2 border-t border-white/10 lg:grid-cols-1 lg:border-l lg:border-t-0">
              {[
                ['Members', members, 'users'],
                ['Online now', online, 'bolt'],
              ].map(([label, value, icon], i) => (
                <div key={label} className={`flex flex-col justify-center p-7 sm:p-9 ${i > 0 ? 'border-l border-white/10 lg:border-l-0 lg:border-t' : ''}`}>
                  <span className="flex items-center gap-2 font-label text-[0.66rem] uppercase tracking-[0.2em] text-mist-400">
                    <Icon name={icon} size={14} className="text-pink-400" />
                    {label}
                  </span>
                  <span className="mt-2 font-display text-5xl font-black text-chalk sm:text-6xl">
                    <CountUp value={value} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <ul className="relative flex flex-col justify-center gap-6 border-t border-white/10 p-8 sm:p-10 lg:border-l lg:border-t-0">
              {[
                ['flame', 'Drops & events', 'New packages and limited drops land there first.'],
                ['bolt', 'Patch notes', 'Every update to the city, the day it ships.'],
                ['headset', 'Tickets', 'Purchase issues sorted by staff, not bots.'],
              ].map(([icon, title, text]) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-pink-500 text-void [transform:skewX(-10deg)]">
                    <Icon name={icon} size={18} strokeWidth={2.2} className="[transform:skewX(10deg)]" />
                  </span>
                  <span>
                    <span className="block font-display text-xl font-black uppercase leading-none text-chalk">{title}</span>
                    <span className="mt-1 block text-sm text-mist-400">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </section>
  )
}

/* ───────────────────────── FAQ + CTA ───────────────────────── */

function FaqPreview() {
  return (
    <section className="container-x mt-36 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <Reveal>
        <p className="eyebrow">FAQ</p>
        <h2 className="mt-5 text-[clamp(2.4rem,5.6vw,4.6rem)] font-black uppercase leading-[0.9]">
          Still got <span className="text-neon">questions?</span>
        </h2>
        <p className="mt-4 max-w-sm text-mist-400">The things people ask most about ordering, delivery and memberships.</p>
        <Link to="/support" className="btn-ghost mt-9">
          All questions & support
          <Icon name="arrowRight" size={16} strokeWidth={2.2} />
        </Link>
      </Reveal>
      <Reveal delay={0.1}>
        <Faq items={FAQ.slice(0, 4)} />
      </Reveal>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="container-x mt-36">
      <Reveal>
        <div className="relative overflow-hidden border border-pink-500/30 bg-ink-900 px-6 py-20 text-center sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_120%,rgb(255_20_160/0.55),transparent_70%)]" />
          <div className="bg-halftone pointer-events-none absolute inset-0" />
          <div className="bg-stripes absolute inset-x-0 bottom-0 h-2 opacity-80" aria-hidden="true" />
          <motion.div className="pointer-events-none absolute left-1/2 top-[115%] h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-500/20" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400 shadow-[0_0_24px_4px_rgb(255_20_160)]" />
          </motion.div>

          <div className="relative flex flex-col items-center">
            <img src="/brand/logo.webp" alt="The Heights LA" loading="lazy" className="w-44 drop-shadow-[0_20px_50px_rgba(255,20,160,0.5)] sm:w-56" />
            <h2 className="mt-10 max-w-3xl text-[clamp(2.4rem,6vw,5rem)] font-black uppercase leading-[0.9]">
              The city is waiting. <span className="text-neon whitespace-nowrap">You in?</span>
            </h2>
            <p className="mt-5 max-w-lg text-mist-300">Connect to The Heights, join the community on Discord and write your own story.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-5">
              <a href={CONNECT_URL} className="btn-chrome px-8 py-4">
                <Icon name="play" size={14} />
                Play now
              </a>
              <Link to="/store" className="btn-primary px-8 py-4">
                <Icon name="cart" size={16} strokeWidth={2.2} />
                Shop the store
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ───────────────────────── Page ───────────────────────── */

export default function Home() {
  useTitle(null)
  const { rootCategories, featured, packages, isLoading } = useCatalog()
  const vip = rootCategories.find(isVipCategory)
  // The hero ticket: the deepest discount, or the first featured package.
  const drop = [...packages].sort((a, b) => discountPercent(b) - discountPercent(a))[0]

  return (
    <>
      <Hero drop={drop && discountPercent(drop) > 0 ? drop : featured[0]} />
      <Bands />
      <Promises />
      {rootCategories.length > 1 && <Categories categories={rootCategories} />}
      <Drops items={featured} loading={isLoading} />
      {vip && vip.allPackages.length > 0 && <Vip category={vip} />}
      <Steps />
      <Community />
      <FaqPreview />
      <FinalCta />
    </>
  )
}
