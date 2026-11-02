import { billingPeriod, compareAtPrice, formatPrice, packagePrice } from '../lib/tebex'
import { useCatalog } from '../stores/catalogStore'

/** Price, strike-through original when discounted, and billing period for subscriptions. */
export default function Price({ pkg, size = 'md', className = '' }) {
  const { currency: storeCurrency } = useCatalog()
  const compare = compareAtPrice(pkg)
  const period = billingPeriod(pkg)
  const currency = pkg?.currency || storeCurrency

  const main = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-5xl sm:text-6xl',
  }[size]

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className={`font-display font-black tracking-tight text-chalk tabular-nums ${main}`}>
        {formatPrice(packagePrice(pkg), currency)}
      </span>
      {period && <span className="font-label text-xs uppercase tracking-wider text-mist-400">{period}</span>}
      {compare && (
        <span className={`text-mist-500 line-through tabular-nums ${size === 'lg' ? 'text-lg' : 'text-xs'}`}>
          {formatPrice(compare, currency)}
        </span>
      )}
    </span>
  )
}
