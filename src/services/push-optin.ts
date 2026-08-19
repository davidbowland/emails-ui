const OPT_IN_KEY = 'emails.pushOptIn'

// SSR guard: `localStorage` only exists in the browser. The static export prerenders in Node,
// where `window` is absent.
const getStorage = (): Storage | undefined => (typeof window === 'undefined' ? undefined : window.localStorage)

// WHICH account asked for notifications on this browser, or undefined for none. The record is
// the only durable one -- a PushSubscription can be evicted at any time, and the self-heal in
// services/push.ts needs to know the difference between "evicted" and "never wanted". It has to
// name the account, not merely say "yes": a subscription belongs to the browser, so a session
// that ends without a sign-out (an expired refresh token, a shared device handed over) would
// otherwise leave the next reader with the previous one's senders and subjects. It is written
// only after the POST returns 204, and cleared first on an explicit unsubscribe so a later
// failure can never resurrect it.
export const getPushOptInAccount = (): string | undefined => {
  const storage = getStorage()
  if (!storage) {
    return undefined
  }
  try {
    // Builds before this one wrote a bare '1'. It is returned as-is rather than mapped to
    // undefined: it names no account, and the self-heal treats an unmatched name as somebody
    // else's, which is the safe reading.
    return storage.getItem(OPT_IN_KEY) || undefined
  } catch {
    // An unreadable store (privacy mode) means we cannot claim an opt-in, so we do not.
    return undefined
  }
}

export const setPushOptedIn = (accountId: string): void => {
  const storage = getStorage()
  if (!storage) {
    return
  }
  try {
    storage.setItem(OPT_IN_KEY, accountId)
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
