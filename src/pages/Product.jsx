import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import Icon from '../components/Icon'
import PackageArt from '../components/PackageArt'
import Price from '../components/Price'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import RichText from '../components/RichText'
import { useCatalog } from '../stores/catalogStore'
import { useCart } from '../stores/cartStore'
import { useTitle } from '../lib/useTitle'
import {
  categoryPath,
  discountPercent,
  formatPrice,
  getPackage,
  idFromProductParam,
  isSubscription,
  packageBadges,
  packageDescription,
  packageGallery,
  packagePerks,
  packagePrice,
} from '../lib/tebex'
import { DISCORD_URL } from '../data/site'

const PROMISES = [
  ['bolt', 'Instant delivery', 'Ready when you reconnect'],
  ['shield', 'Secure payment', 'Handled by Tebex'],
  ['headset', 'Support', 'Staff active on Discord'],
]

function Gallery({ pkg, images }) {
  const [index, setIndex] = useState(0)
  useEffect(() => setIndex(0), [pkg.id])
  const discount = discountPercent(pkg)

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden  border border-white/[0.07] bg-ink-900">
        <AnimatePresence mode="wait">
          {images.length ? (
            <motion.img
              key={images[index]}
              src={images[index]}
              alt={pkg.name}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full w-full object-cover"
            />
          ) : (
            <PackageArt pkg={pkg} className="h-full w-full" />
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0  ring-1 ring-inset ring-white/[0.06]" />
        {discount > 0 && (
          <span className="absolute left-5 top-5 rounded-full bg-pink-500 px-3.5 py-1.5 font-label text-xs font-bold text-white shadow-[0_0_30px_-4px_rgb(255_20_160)]">
            -{discount}% off
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1}`}
              className={`h-20 w-28 shrink-0 cursor-pointer overflow-hidden  border-2 transition-all ${i === index ? 'border-pink-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Product() {
  const { param } = useParams()
  const id = idFromProductParam(param)
  const { findPackage, findCategory, packages, isLoading, currency } = useCatalog()
  const { addItem, has, open } = useCart()

  const cached = findPackage(id)
  const [fetched, setFetched] = useState(null)
  const [missing, setMissing] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Deep link to a package the catalog listing does not include: ask Tebex directly.
  useEffect(() => {
    setQuantity(1)
    if (cached || isLoading) return
    let alive = true
    getPackage(id)
      .then((data) => (alive ? (data ? setFetched(data) : setMissing(true)) : null))
      .catch(() => alive && setMissing(true))
    return () => {
      alive = false
    }
  }, [id, cached, isLoading])

  const pkg = cached || fetched
  useTitle(pkg?.name || 'Package')

  if (!pkg && (isLoading || !missing)) {
    return (
      <div className="container-x grid gap-10 pb-10 pt-36 lg:grid-cols-[1.15fr_1fr]">
        <div className="shimmer aspect-[4/3] " />
        <div className="space-y-4">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-12 w-3/4 " />
          <div className="shimmer h-10 w-40 " />
          <div className="shimmer mt-8 h-14 w-full rounded-full" />
        </div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="container-x flex min-h-[75svh] flex-col items-center justify-center pt-24 text-center">
        <img src="/brand/logo.webp" alt="" className="w-40 opacity-30 grayscale" />
        <h1 className="mt-8 text-4xl font-black uppercase">Package not found</h1>
        <p className="mt-3 max-w-md text-mist-400">This package is no longer available, or the link is wrong.</p>
        <Link to="/store" className="btn-primary mt-8">
          Back to the store
        </Link>
      </div>
    )
  }

  const category = findCategory(pkg.categoryId ?? pkg.category?.id)
  const inCart = has(pkg.id)
  const badges = packageBadges(pkg)
  const images = packageGallery(pkg)
  const description = packageDescription(pkg)
  const perks = packagePerks(pkg, 6)
  const canPickQuantity = !pkg.disable_quantity && !isSubscription(pkg)
  const related = packages.filter((p) => p.id !== pkg.id && p.rootCategoryId === (pkg.rootCategoryId ?? category?.id)).slice(0, 4)
  const money = pkg.currency || currency

  return (
    <>
      <div className="relative pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(50%_60%_at_30%_0%,rgb(255_20_160/0.16),transparent)]" />
        <div className="bg-halftone pointer-events-none absolute inset-x-0 top-0 h-[40rem]" />

        <div className="container-x relative">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 font-label text-[0.66rem] uppercase tracking-[0.18em] text-mist-500">
            <Link to="/" className="hover:text-pink-300">Home</Link>
            <Icon name="chevronRight" size={12} />
            <Link to="/store" className="hover:text-pink-300">Store</Link>
            {category && (
              <>
                <Icon name="chevronRight" size={12} />
                <Link to={categoryPath(category)} className="hover:text-pink-300">{category.name}</Link>
              </>
            )}
            <Icon name="chevronRight" size={12} />
            <span className="max-w-[14rem] truncate text-mist-200">{pkg.name}</span>
          </nav>

          <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <Gallery pkg={pkg} images={images} />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {PROMISES.map(([icon, title, text]) => (
                  <div key={title} className="flex items-center gap-3  border border-white/[0.06] bg-ink-900/60 p-4">
                    <Icon name={icon} size={20} className="text-pink-400" />
                    <div>
                      <p className="text-[0.8rem] font-semibold text-chalk">{title}</p>
                      <p className="text-[0.72rem] text-mist-500">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="lg:sticky lg:top-28">
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <Link to={categoryPath(category)} className="eyebrow hover:text-pink-300">
                    {category.name}
                  </Link>
                )}
                {badges.map((b) => (
                  <span key={b.id} className="rounded-full border border-white/15 px-2.5 py-1 font-label text-[0.6rem] font-bold uppercase tracking-[0.14em] text-chalk">
                    {b.label}
                  </span>
                ))}
              </div>

              <h1 className="mt-5 text-[clamp(2.4rem,5.2vw,4.2rem)] font-black uppercase leading-[0.92]">{pkg.name}</h1>

              <div className="mt-7">
                <Price pkg={pkg} size="lg" />
              </div>

              {isSubscription(pkg) && (
                <p className="mt-4 flex items-start gap-2.5  border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-mist-300">
                  <Icon name="refresh" size={17} className="mt-0.5 text-pink-400" />
                  Monthly subscription. Cancel any time through your Tebex confirmation email.
                </p>
              )}

              {perks.length > 0 && (
                <ul className="mt-8 space-y-3 border-t border-white/[0.07] pt-7">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-3 text-[0.92rem] text-mist-200">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-pink-400">
                        <Icon name="check" size={12} strokeWidth={2.6} />
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {canPickQuantity && !inCart && (
                  <div className="flex items-center justify-between rounded-full border border-white/10 bg-ink-900/70 p-1 sm:justify-start">
                    <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Less" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-mist-300 hover:bg-white/5 hover:text-chalk">
                      <Icon name="minus" size={16} />
                    </button>
                    <span className="w-10 text-center font-label text-base font-bold tabular-nums text-chalk">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="More" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-mist-300 hover:bg-white/5 hover:text-chalk">
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                )}
                <button type="button" onClick={() => (inCart ? open() : addItem(pkg, quantity))} className={`${inCart ? 'btn-ghost' : 'btn-primary'} flex-1 py-4`}>
                  <Icon name={inCart ? 'check' : 'cart'} size={17} />
                  {inCart ? 'View your cart' : `Add to cart · ${formatPrice(packagePrice(pkg) * quantity, money)}`}
                </button>
              </div>

              <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-mist-500">
                <Icon name="gamepad" size={15} className="mt-px text-mist-400" />
                At checkout you sign in with your FiveM account, so we know who to deliver to.
              </p>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="mt-2 flex items-center gap-2 text-xs text-mist-500 transition-colors hover:text-pink-300">
                <Icon name="discord" size={15} />
                Questions before you buy? Ask on Discord.
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {description && (
        <section className="container-x mt-20">
          <Reveal>
            <div className="grid gap-8  border border-white/[0.07] bg-ink-900/50 p-7 sm:p-10 lg:grid-cols-[0.35fr_1fr] lg:gap-14">
              <div>
                <p className="eyebrow">Details</p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-tight">About this package</h2>
              </div>
              <RichText html={description} className="max-w-3xl" />
            </div>
          </Reveal>
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x mt-24">
          <Reveal className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">More like this</p>
              <h2 className="mt-4 text-4xl font-black uppercase">You might also like</h2>
            </div>
            {category && (
              <Link to={categoryPath(category)} className="btn-ghost hidden sm:inline-flex">
                All in {category.name}
                <Icon name="arrowRight" size={16} />
              </Link>
            )}
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <ProductCard pkg={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
