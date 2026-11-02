import { useState } from 'react'
import { IS_DEMO } from '../lib/tebex'
import { useCatalog } from '../stores/catalogStore'
import Icon from './Icon'

/**
 * Makes it impossible to mistake sample data for the live store, whether that
 * is demo mode (no token) or the fallback after Tebex refused the token.
 */
export default function DemoBanner() {
  const [hidden, setHidden] = useState(false)
  const { isFallback } = useCatalog()
  if ((!IS_DEMO && !isFallback) || hidden) return null
  return (
    // z-55: above the page and navbar, below the mobile menu (60) and cart drawer (70).
    <div className="fixed bottom-4 left-4 z-[55] flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border border-amber-400/30 bg-ink-900/90 py-1.5 pl-3 pr-1.5 text-xs text-amber-100 shadow-xl backdrop-blur-xl">
      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_10px_rgb(251_191_36)]" />
      <span>
        <strong className="font-semibold">Demo mode</strong>:{' '}
        {isFallback ? 'Tebex unreachable, showing the sample catalog' : 'sample catalog, no real payments'}
      </span>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label="Hide notice"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-amber-200/70 hover:bg-white/10"
      >
        <Icon name="close" size={13} />
      </button>
    </div>
  )
}
