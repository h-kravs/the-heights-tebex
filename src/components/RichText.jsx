import { useMemo } from 'react'
import { sanitizeHtml } from '../lib/sanitizeHtml'

/** Tebex description HTML: sanitised through the allow-list, styled by `.thl-rich`. */
export default function RichText({ html, className = '' }) {
  const safe = useMemo(() => sanitizeHtml(html), [html])
  if (!safe) return null
  return <div className={`thl-rich text-[0.95rem] text-fog-300 ${className}`} dangerouslySetInnerHTML={{ __html: safe }} />
}
