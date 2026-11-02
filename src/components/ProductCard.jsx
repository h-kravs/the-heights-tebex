import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from './Icon'
import PackageArt from './PackageArt'
import { billingPeriod, compareAtPrice, discountPercent, formatPrice, packageBadges, packageDescription, packagePerks, packagePrice, plainText, productPath } from '../lib/tebex'
import { useCart } from '../stores/cartStore'
import { useCatalog } from '../stores/catalogStore'

/**
 * Package card, built like a poster: sharp corners, the price slapped on as
 * a tilted sticker over the artwork, the name set huge and condensed, and
 * an "add" bar that slides up from the bottom edge. The whole card is the
 * link; the bar adds to cart without navigating.
 */
export default function ProductCard({ pkg, priority = false }) {
  const { addItem, has, open } = useCart()
  const { currency } = useCatalog()
  const inCart = has(pkg.id)
  const badges = packageBadges(pkg)
  const discount = discountPercent(pkg)
  const compare = compareAtPrice(pkg)
  const perks = packagePerks(pkg, 3)
  const excerpt = perks.length ? perks.join(' · ') : plainText(packageDescription(pkg), 110)
  const money = pkg.currency || currency

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-white/10 bg-ink-900 transition-colors duration-500 ease-out hover:border-pink-500/60">
      <Link to={productPath(pkg)} className="flex flex-1 flex-col" aria-label={pkg.name}>
        <div className="relative aspect-[4/3] overflow-hidden">
          {pkg.image ? (
            <img src={pkg.image} alt="" loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
          ) : (
            <PackageArt pkg={pkg} className="h-full w-full transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />

          {/* Price sticker, slapped on at an angle */}
          <div className="absolute left-3 top-3 -rotate-3 transition-transform duration-500 group-hover:rotate-0">
            <span className="flex items-baseline gap-1.5 bg-chalk px-3 py-1.5 font-display text-[1.15rem] font-black leading-none text-void shadow-[3px_3px_0_0_var(--color-pink-500)] [transform:skewX(-8deg)]">
              <span className="[transform:skewX(8deg)]">{formatPrice(packagePrice(pkg), money)}</span>
              {billingPeriod(pkg) && <span className="font-label text-[0.6rem] uppercase tracking-wider text-mist-500 [transform:skewX(8deg)]">{billingPeriod(pkg)}</span>}
            </span>
            {compare && <span className="mt-1.5 block pl-1 font-label text-[0.68rem] text-mist-300 line-through">{formatPrice(compare, money)}</span>}
          </div>

          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {discount > 0 && (
              <span className="bg-pink-500 px-2 py-1 font-label text-[0.66rem] uppercase tracking-[0.1em] text-void [transform:skewX(-8deg)]">
                <span className="block [transform:skewX(8deg)]">-{discount}%</span>
              </span>
            )}
            {badges.map((b) => (
              <span key={b.id} className="border border-white/30 bg-void/70 px-2 py-1 font-label text-[0.62rem] uppercase tracking-[0.1em] text-chalk backdrop-blur-md [transform:skewX(-8deg)]">
                <span className="block [transform:skewX(8deg)]">{b.label}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
          {pkg.categoryName && <span className="font-label text-[0.66rem] uppercase tracking-[0.18em] text-pink-400">{pkg.categoryName}</span>}
          <h3 className="mt-1.5 text-[1.7rem] font-black uppercase leading-[0.95] text-chalk transition-colors group-hover:text-pink-200">{pkg.name}</h3>
          {excerpt && <p className="mt-2.5 line-clamp-2 text-[0.84rem] leading-relaxed text-mist-400">{excerpt}</p>}
        </div>
      </Link>

      {/* Add bar: hidden under the bottom edge until hover; always shown without a hover device */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => (inCart ? open() : addItem(pkg))}
        aria-label={inCart ? `${pkg.name} is in your cart` : `Add ${pkg.name} to cart`}
        className={`absolute inset-x-0 bottom-0 flex h-12 cursor-pointer items-center justify-center gap-2 font-label text-[0.8rem] uppercase tracking-[0.12em] transition-transform duration-300 ease-out [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover:translate-y-0 ${
          inCart ? 'bg-chalk text-void' : 'bg-pink-500 text-white'
        }`}
      >
        <Icon name={inCart ? 'check' : 'plus'} size={17} strokeWidth={2.4} />
        {inCart ? 'In your cart' : 'Add to cart'}
      </motion.button>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden border border-white/[0.06] bg-ink-900/60">
      <div className="shimmer aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="shimmer h-3 w-20" />
        <div className="shimmer h-6 w-3/4" />
        <div className="shimmer h-3 w-full" />
      </div>
    </div>
  )
}
