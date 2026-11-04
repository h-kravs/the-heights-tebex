import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'
import { useCart } from '../stores/cartStore'
import { useCatalog } from '../stores/catalogStore'
import { billingPeriod, compareAtPrice, formatPrice, packagePrice, parseTags, productPath } from '../lib/tebex'
import { extractBullets, inheritsFrom, pickFeatured, tierAccent } from '../lib/vipTable'

const EASE = [0.16, 1, 0.3, 1]

/**
 * Membership tiers as a switcher, not a row of cards: the tier names stack
 * on the left like a set list, the selected one opens on the right with its
 * perks, price and the one chrome button. One decision at a time sells
 * better than three columns of ticks, and the owner's `[Popular]` tag picks
 * which tier is open on arrival.
 */
export default function VipSwitcher({ tiers, headingLevel = 'h3' }) {
  const Heading = headingLevel
  const { addItem, has, open } = useCart()
  const { currency } = useCatalog()
  const ordered = [...tiers].sort((a, b) => packagePrice(a) - packagePrice(b))
  const featured = pickFeatured(ordered)
  const [activeId, setActiveId] = useState(featured?.id ?? ordered[0]?.id)
  const active = ordered.find((t) => t.id === activeId) || ordered[0]
  if (!active) return null

  const index = ordered.indexOf(active)
  const accent = tierAccent(active.name, index)
  const { tags, description } = parseTags(active.description)
  const bullets = extractBullets(description)
  const inherits = bullets.map(inheritsFrom).find(Boolean)
  const perks = bullets.filter((b) => !inheritsFrom(b))
  const inCart = has(active.id)
  const compare = compareAtPrice(active)
  const money = active.currency || currency

  return (
    <div className="grid border border-white/10 bg-ink-900/60 lg:grid-cols-[minmax(16rem,0.9fr)_1.6fr]">
      {/* Tier list */}
      <ul className="flex overflow-x-auto border-b border-white/10 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {ordered.map((tier, i) => {
          const selected = tier.id === active.id
          const color = tierAccent(tier.name, i)
          return (
            <li key={tier.id} role="presentation" className="min-w-[11rem] flex-1 lg:min-w-0">
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(tier.id)}
                className={`relative flex h-full w-full cursor-pointer flex-col justify-between gap-6 p-6 text-left transition-colors lg:p-8 ${selected ? 'bg-ink-850' : 'hover:bg-white/[0.03]'}`}
              >
                {selected && <motion.span layoutId="vip-edge" className="absolute inset-y-0 left-0 w-1" style={{ background: color, boxShadow: `0 0 18px ${color}` }} transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
                <span className="flex items-center justify-between font-label text-[0.66rem] uppercase tracking-[0.18em] text-mist-500">
                  <span>Tier 0{i + 1}</span>
                  {tier.id === featured?.id && <span className="bg-pink-500 px-1.5 py-0.5 text-void">Most picked</span>}
                </span>
                <span>
                  <span className={`block font-display text-[2.2rem] font-black uppercase leading-none transition-colors lg:text-[2.6rem] ${selected ? 'text-chalk' : 'text-mist-400'}`}>
                    {tier.name.replace(/^heights\s+/i, '')}
                  </span>
                  <span className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-display text-lg font-black text-chalk">{formatPrice(packagePrice(tier), tier.currency || currency)}</span>
                    <span className="font-label text-[0.62rem] uppercase tracking-wider text-mist-500">{billingPeriod(tier)}</span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Open tier */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-[100px]" style={{ background: `color-mix(in srgb, ${accent} 35%, transparent)` }} />
        <div className="bg-halftone pointer-events-none absolute inset-0 opacity-60" />
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative flex h-full flex-col p-7 sm:p-10"
            role="tabpanel"
          >
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <span className="eyebrow-ghost" style={{ borderColor: accent, color: accent }}>
                  <span>{tags[0] || 'Membership'}</span>
                </span>
                <Heading className="mt-4 text-[clamp(2.6rem,5vw,4.4rem)] font-black uppercase leading-[0.9]">
                  {active.name.replace(/^heights\s+/i, '')}
                  <span className="block font-display text-[0.45em] font-black text-mist-400">every month</span>
                </Heading>
              </div>
              <div className="text-right">
                <p className="font-display text-[clamp(2.6rem,5vw,4.4rem)] font-black leading-none text-chalk tabular-nums">{formatPrice(packagePrice(active), money)}</p>
                <p className="mt-1 font-label text-[0.7rem] uppercase tracking-[0.18em] text-mist-400">
                  {compare && <span className="mr-2 text-mist-500 line-through">{formatPrice(compare, money)}</span>}
                  {billingPeriod(active)} · cancel any time
                </p>
              </div>
            </div>

            <ul className="mt-8 grid flex-1 content-start gap-x-8 gap-y-3 border-t border-white/10 pt-7 sm:grid-cols-2">
              {inherits && (
                <li className="flex items-center gap-3 text-[0.9rem] text-mist-300 sm:col-span-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-chalk text-void [transform:skewX(-8deg)]">
                    <Icon name="plus" size={13} strokeWidth={2.6} className="[transform:skewX(8deg)]" />
                  </span>
                  <span>
                    Everything in <strong className="text-chalk">{inherits}</strong>, plus:
                  </span>
                </li>
              )}
              {perks.map((perk, i) => (
                <motion.li key={perk} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04, duration: 0.4 }} className="flex items-start gap-3 text-[0.95rem] text-mist-100">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center [transform:skewX(-8deg)]" style={{ background: accent, color: '#120a16' }}>
                    <Icon name="check" size={13} strokeWidth={2.8} className="[transform:skewX(8deg)]" />
                  </span>
                  {perk}
                </motion.li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => (inCart ? open() : addItem(active))} className="btn-chrome px-9 py-4">
                <Icon name={active.preview ? 'clock' : inCart ? 'check' : 'crown'} size={16} />
                <span>{active.preview ? 'Coming soon' : inCart ? 'In your cart' : `Get ${active.name.replace(/^heights\s+/i, '')}`}</span>
              </button>
              {!active.preview && (
                <Link to={productPath(active)} className="font-label text-[0.72rem] uppercase tracking-[0.18em] text-mist-400 underline decoration-pink-500 underline-offset-4 transition-colors hover:text-chalk">
                  Full details
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
