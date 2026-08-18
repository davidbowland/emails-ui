const COLLAPSED_KEY = 'emails.installCollapsed'

// SSR guard: `localStorage` only exists in the browser. The static export
// prerenders in Node, where `window` is absent.
const getStorage = (): Storage | undefined => (typeof window === 'undefined' ? undefined : window.localStorage)

export const isInstallCollapsed = (): boolean => {
  const storage = getStorage()
  if (!storage) {
    return false
  }
  try {
    return storage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    // An unreadable store (privacy mode) just means the offer stays expanded.
    return false
  }
}

export const setInstallCollapsed = (collapsed: boolean): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }
  try {
    if (collapsed) {
      storage.setItem(COLLAPSED_KEY, '1')
    } else {
      storage.removeItem(COLLAPSED_KEY)
    }
  } catch {
    // A refused write (quota, privacy mode) only means the offer reopens. Never break the page.
  }
}
