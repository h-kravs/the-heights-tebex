import Icon from './Icon'
import { categoryIcon } from '../lib/categoryMeta'

/**
 * Artwork for packages without an image. Tebex packages often ship with
 * `image: null`; a grey box would make the whole catalog look unfinished, so
 * each one gets a branded plate: halftone mesh, a magenta light seeded by id
 * so neighbours differ, a chrome category glyph and the THL mark.
 */
export default function PackageArt({ pkg, className = '', compact = false }) {
  const seed = Number(pkg?.id) || 7
  const x = 25 + ((seed * 37) % 50)
  const y = 15 + ((seed * 53) % 45)
  const icon = categoryIcon(pkg?.categoryName || pkg?.category?.name || pkg?.name || '')

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-ink-900 ${className}`}
      style={{
        backgroundImage: `radial-gradient(90% 80% at ${x}% ${y}%, rgb(255 20 160 / 0.45), transparent 60%), radial-gradient(70% 60% at ${100 - x}% 100%, rgb(100 5 64 / 0.5), transparent 70%)`,
      }}
      aria-hidden="true"
    >
      <div className="bg-halftone absolute inset-0 opacity-90" />
      {!compact && (
        <>
          <div className="absolute aspect-square h-[78%] rounded-full border border-white/[0.06]" />
          <div className="absolute aspect-square h-[52%] rounded-full border border-pink-500/25" />
        </>
      )}
      <span className="text-chrome relative">
        <Icon
          name={icon}
          size={compact ? 26 : 68}
          strokeWidth={compact ? 1.5 : 1.1}
          className="text-chalk drop-shadow-[0_0_22px_rgba(255,20,160,0.95)]"
        />
      </span>
      {!compact && (
        <img src="/brand/logo-sm.webp" alt="" loading="lazy" width="160" height="176" className="absolute bottom-3 right-3 h-auto w-12 opacity-80 drop-shadow-[0_0_10px_rgba(255,20,160,0.6)]" />
      )}
    </div>
  )
}
