/**
 * Minimal allow-list HTML sanitiser for Tebex package descriptions.
 *
 * Descriptions are rich HTML authored in the Tebex panel. They have to render
 * as markup, but they arrive over the network, so they are treated as
 * untrusted: if the Tebex account were ever compromised, a stored <script>
 * would otherwise execute on this domain.
 *
 * Strategy: parse with the browser's own parser (never regex over HTML), walk
 * the tree, and rebuild it keeping only allowed tags and attributes.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'small', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'hr', 'code', 'pre', 'a',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
])

/** Only these attributes survive, and only on these tags. */
const ALLOWED_ATTRS = {
  a: ['href', 'title'],
}

/** A narrow set of harmless inline declarations; anything that can load a URL is dropped. */
const ALLOWED_STYLE_PROPS = new Set(['text-align', 'font-weight', 'font-style', 'text-decoration'])

function sanitizeStyle(value) {
  return value
    .split(';')
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => {
      const [prop, val = ''] = decl.split(':').map((s) => s.trim().toLowerCase())
      if (!ALLOWED_STYLE_PROPS.has(prop)) return false
      return !/url\s*\(|expression\s*\(|javascript:|\\/i.test(val)
    })
    .join('; ')
}

function isSafeHref(href) {
  const value = String(href).trim()
  if (/^(https?:|mailto:)/i.test(value)) return true
  // Relative links are fine; any other scheme (javascript:, data:…) is not.
  return !/^[a-z][a-z0-9+.-]*:/i.test(value)
}

function clean(node, doc) {
  if (node.nodeType === Node.TEXT_NODE) return doc.createTextNode(node.nodeValue)
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const tag = node.tagName.toLowerCase()

  // Script-bearing elements go entirely, their text content is code, not copy.
  if (tag === 'script' || tag === 'style' || tag === 'template') return null

  // Disallowed wrapper: drop the tag, keep its text, so stripping never deletes copy.
  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = doc.createDocumentFragment()
    node.childNodes.forEach((child) => {
      const cleaned = clean(child, doc)
      if (cleaned) fragment.appendChild(cleaned)
    })
    return fragment
  }

  const el = doc.createElement(tag)

  for (const attr of ALLOWED_ATTRS[tag] || []) {
    const value = node.getAttribute(attr)
    if (value == null) continue
    if (attr === 'href' && !isSafeHref(value)) continue
    el.setAttribute(attr, value)
  }

  const style = node.getAttribute('style')
  if (style) {
    const safe = sanitizeStyle(style)
    if (safe) el.setAttribute('style', safe)
  }

  if (tag === 'a' && el.getAttribute('href')) {
    el.setAttribute('target', '_blank')
    el.setAttribute('rel', 'noreferrer noopener')
  }

  node.childNodes.forEach((child) => {
    const cleaned = clean(child, doc)
    if (cleaned) el.appendChild(cleaned)
  })

  return el
}

/** Returns sanitised HTML safe to pass to dangerouslySetInnerHTML. */
export function sanitizeHtml(html) {
  if (!html) return ''
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return String(html).replace(/<[^>]*>/g, '')
  }

  // A detached document means <img onerror> and friends never fire while inspected.
  const doc = new DOMParser().parseFromString(String(html), 'text/html')
  const out = doc.createDocumentFragment()
  doc.body.childNodes.forEach((child) => {
    const cleaned = clean(child, doc)
    if (cleaned) out.appendChild(cleaned)
  })

  const wrapper = doc.createElement('div')
  wrapper.appendChild(out)
  return wrapper.innerHTML
}
