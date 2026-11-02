import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Icon from './Icon'

export default function Faq({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
            >
              <span className="flex items-baseline gap-5">
                <span className="font-label text-xs text-pink-500">{String(i + 1).padStart(2, '0')}</span>
                <span className={`font-display text-lg font-bold uppercase tracking-tight transition-colors sm:text-xl ${isOpen ? 'text-chalk' : 'text-mist-200 group-hover:text-chalk'}`}>
                  {item.q}
                </span>
              </span>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isOpen ? 'rotate-45 border-pink-500 bg-pink-500 text-white' : 'border-white/15 text-mist-300'
                }`}
              >
                <Icon name="plus" size={16} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-7 pl-10 text-[0.95rem] leading-relaxed text-mist-400">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
