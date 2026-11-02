// CSS stand-in for the WebGL hero: shown while the Three.js chunk downloads
// and permanently on devices without WebGL. Same composition, no GPU.

export default function StaticHeights({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="bg-halftone absolute inset-0 opacity-60" />
      <div className="absolute left-1/2 top-[30%] h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2 lg:left-[72%] lg:top-1/2">
        <div className="absolute inset-[-50%] rounded-full bg-[radial-gradient(circle,rgb(255_20_160/0.4)_0%,rgb(160_8_98/0.16)_35%,transparent_68%)]" />
        {[
          ['-8%', '14%', '9vmin'],
          ['86%', '8%', '6vmin'],
          ['92%', '70%', '12vmin'],
          ['4%', '82%', '7vmin'],
          ['50%', '-14%', '5vmin'],
        ].map(([left, top, size], i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left,
              top,
              width: size,
              height: size,
              background: 'radial-gradient(circle at 32% 28%, #ffffff 0%, #c9c9d5 22%, #ff6cc8 40%, #3a2340 70%, #0a0510 100%)',
              boxShadow: '0 0 30px -6px rgb(255 20 160 / 0.6)',
            }}
          />
        ))}
        <img
          src="/brand/logo.webp"
          alt=""
          className="animate-flicker absolute left-1/2 top-1/2 w-[88%] max-w-none -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_40px_rgba(255,20,160,0.75)]"
        />
      </div>
    </div>
  )
}

export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
