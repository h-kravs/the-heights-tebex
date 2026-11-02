import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const KEY = 'thl_intro_seen'
const EASE = [0.76, 0, 0.24, 1]

/**
 * First-visit curtain: the sign powers up over the void, then the curtain
 * lifts and the page is already underneath. Once per browser session, under
 * two seconds, skipped for reduced motion. The page renders behind it from
 * frame one, so nothing waits on this.
 */
export default function Intro() {
  const [show, setShow] = useState(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
      return !sessionStorage.getItem(KEY)
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!show) return
    const id = setTimeout(() => {
      setShow(false)
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        /* private mode */
      }
    }, 1500)
    return () => clearTimeout(id)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-void"
          initial={{ y: 0 }}
          exit={{ y: '-101%' }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <div className="bg-halftone absolute inset-0 opacity-70" />
          <motion.div
            className="absolute h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(circle,rgb(255_20_160/0.5)_0%,transparent_65%)]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.img
            src="/brand/logo.webp"
            alt=""
            className="relative w-[46vmin] max-w-[18rem] drop-shadow-[0_0_40px_rgba(255,20,160,0.8)]"
            initial={{ scale: 0.86, opacity: 0, filter: 'brightness(0.4)' }}
            animate={{
              scale: [0.86, 1, 1],
              opacity: [0, 1, 0.5, 1, 0.7, 1],
              filter: ['brightness(0.4)', 'brightness(1.4)', 'brightness(0.8)', 'brightness(1.2)', 'brightness(1)', 'brightness(1)'],
            }}
            transition={{ duration: 1.05, ease: 'easeOut', times: [0, 0.3, 0.42, 0.55, 0.68, 1] }}
          />
          <motion.p
            className="absolute bottom-10 font-label text-[0.62rem] uppercase tracking-[0.4em] text-mist-400"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            The Heights LA
          </motion.p>
          {/* Drips hanging off the lifting curtain's bottom edge */}
          <div className="absolute inset-x-0 top-full flex justify-around" aria-hidden="true">
            {[0.5, 0.9, 0.35, 1.1, 0.7, 0.45, 0.95, 0.6].map((h, i) => (
              <span
                key={i}
                className="w-3 rounded-b-full bg-void"
                style={{ height: `${h * 3}rem`, marginTop: '-1px', transform: `translateX(${(i % 3) * 8 - 8}px)` }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
