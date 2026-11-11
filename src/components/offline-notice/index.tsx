import React, { useEffect, useState } from 'react'

import { WifiOffIcon } from '@components/ui/icons'

const OfflineNotice = (): React.ReactNode => {
  // SSR-safe: assume online so the server markup and the first client render agree (both render
  // nothing), then reconcile against navigator.onLine on mount.
  const [isOffline, setIsOffline] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const update = (): void => setIsOffline(!navigator.onLine)
    update()
    // Optional chaining because a test environment (jsdom) may not implement matchMedia;
    // a real browser always does. Absent → treat as no reduced-motion preference.
    setReducedMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false)
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
    // Sits at bottom-24, not bottom-6, on purpose: the only place this mounts (the
    // authenticated shell in icon-drawer) also renders a Snackbar (ui/snackbar) at bottom-6, and
    // being offline while an action errors would stack the two on the same spot. This
    // clears it.
    <div aria-live="polite" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2" role="status">
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
        {/* Decorative: the word "Offline" carries the meaning, so the icon is never the sole signal of
            state (the maintainer is colorblind). */}
        <span className="flex flex-shrink-0 items-center" style={{ color: 'var(--accent)' }}>
          <WifiOffIcon />
        </span>
        <span style={{ color: 'var(--text-paper)', fontWeight: 600 }}>Offline</span>
        <span style={{ color: 'var(--text-paper)' }}>Your mail loads when the connection returns.</span>
      </div>
    </div>
  )
}

export default OfflineNotice
