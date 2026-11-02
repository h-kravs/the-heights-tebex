// Shared handle on the Lenis smooth-scroll instance, so overlays (cart drawer,
// mobile menu) can freeze the page behind them. Lenis drives wheel scrolling
// itself, so `overflow: hidden` on <body> alone would not stop it.

let instance = null
let locks = 0

export const setLenis = (lenis) => {
  instance = lenis
}

export const getLenis = () => instance

export function lockScroll(lock) {
  locks = Math.max(0, locks + (lock ? 1 : -1))
  const locked = locks > 0
  if (instance) locked ? instance.stop() : instance.start()
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}

export function scrollToTop() {
  if (instance) instance.scrollTo(0, { immediate: true, force: true })
  window.scrollTo(0, 0)
}
