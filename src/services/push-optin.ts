const OPT_IN_KEY = 'emails.pushOptIn'

// SSR guard: `localStorage` only exists in the browser. The static export prerenders in Node,
// where `window` is absent.
const getStorage = (): Storage | undefined => (typeof window === 'undefined' ? undefined : window.localStorage)

// Whether this browser asked for notifications and the server confirmed it. The flag is the
// only durable record of intent -- a PushSubscription can be evicted at any time, and the
// self-heal in services/push.ts needs to know the difference between "evicted" and "never
// wanted". It is written only after the POST returns 204, and cleared first on an explicit
// unsubscribe so a later failure can never resurrect it.
export const isPushOptedIn = (): boolean => {
  const storage = getStorage()
  if (!storage) {
    return false
  }
  try {
    return storage.getItem(OPT_IN_KEY) === '1'
  } catch {
    // An unreadable store (privacy mode) means we cannot claim an opt-in, so we do not.
    return false
  }
}

export const setPushOptedIn = (): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }
  try {
    storage.setItem(OPT_IN_KEY, '1')
  } catch {
    // A refused write (quota, privacy mode) costs a self-heal, not the page.
  }
}

export const clearPushOptIn = (): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }
  try {
    storage.removeItem(OPT_IN_KEY)
  } catch {
    // Same: never break the page over a storage refusal.
  }
}
