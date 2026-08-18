import React, { useEffect, useState } from 'react'

// Inline, stroke-based offline (wifi-off) glyph. Decorative — the word "Offline" carries the
// meaning — so it is aria-hidden and never the sole signal of state (the maintainer is colorblind).
const OfflineIcon = (): React.ReactNode => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="16"
  >
    <path d="M12 20h.01" />
    <path d="M8.5 16.429a5 5 0 0 1 7 0" />
    <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
    <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
    <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
    <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
    <path d="m2 2 20 20" />
  </svg>
)

const OfflineNotice = (): React.ReactNode => {
  // SSR-safe: assume online so the server markup and the first client render agree (both render
  // nothing), then reconcile against navigator.onLine on mount.
  const [isOffline, setIsOffline] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const update = (): void => setIsOffline(!navigator.onLine)
    update()
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  // Render nothing when online — never hide via CSS.
  if (!isOffline) {
    return null
  }

  return (
    <div aria-live="polite" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2" role="status">
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm shadow-lg${reducedMotion ? '' : ' animate-fade-in'}`}
        style={{
          background: 'var(--paper-bg)',
          border: '1px solid rgba(196, 92, 42, 0.4)',
          color: 'var(--text-paper)',
          fontFamily: 'Outfit, sans-serif',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '90vw',
        }}
      >
        <span className="flex flex-shrink-0 items-center" style={{ color: 'var(--accent)' }}>
          <OfflineIcon />
        </span>
        <span style={{ color: 'var(--text-paper)', fontWeight: 600 }}>Offline</span>
        <span style={{ color: 'var(--text-paper)' }}>Your mail loads when the connection returns.</span>
      </div>
    </div>
  )
}

export default OfflineNotice
