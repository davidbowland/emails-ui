const COLLAPSED_KEY = 'emails.installCollapsed'

// SSR guard: `localStorage` only exists in the browser. The static export
// prerenders in Node, where `window` is absent.
const getStorage = (): Storage | undefined => (typeof window === 'undefined' ? undefined : window.localStorage)

// Reads the stored collapse choice. `fallback` is returned when the reader has made no choice
// yet (nothing stored) or the store is unreadable — so a caller can decide the default per
// surface: the sign-in card defaults collapsed (a compact link), Settings does not use this at
// all. '1' = collapsed, '0' = the reader explicitly expanded it; both are honored over the
// fallback, which is why `setInstallCollapsed` writes '0' rather than clearing the key.
export const isInstallCollapsed = (fallback = false): boolean => {
  const storage = getStorage()
  if (!storage) {
    return fallback
  }
  try {
    const raw = storage.getItem(COLLAPSED_KEY)
    if (raw === '1') {
      return true
    }
    if (raw === '0') {
      return false
    }
    return fallback
  } catch {
    // An unreadable store (privacy mode) just means the offer falls back to its default.
    return fallback
  }
}

export const setInstallCollapsed = (collapsed: boolean): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }
  try {
    // Write '0' for an explicit expand rather than clearing the key, so it wins over a
    // surface's collapsed-by-default fallback.
    storage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    // A refused write (quota, privacy mode) only means the offer reopens. Never break the page.
  }
}
