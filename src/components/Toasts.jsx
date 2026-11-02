import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'
import { useToast } from '../stores/toastStore'

const STYLE = {
  success: { icon: 'check', ring: 'border-emerald-400/30', tint: 'text-emerald-300' },
  error: { icon: 'info', ring: 'border-pink-500/40', tint: 'text-pink-300' },
  info: { icon: 'info', ring: 'border-white/15', tint: 'text-mist-200' },
}

export default function Toasts() {
  const { toasts, dismiss } = useToast()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const s = STYLE[t.kind] || STYLE.info
          return (
            <motion.button
              key={t.id}
              type="button"
              layout
              onClick={() => dismiss(t.id)}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex max-w-md cursor-pointer items-start gap-3  border ${s.ring} bg-ink-850/95 px-4 py-3 text-left text-sm text-mist-100 shadow-2xl shadow-black/60 backdrop-blur-xl`}
            >
              <Icon name={s.icon} size={18} className={`mt-px ${s.tint}`} />
              {t.text}
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
