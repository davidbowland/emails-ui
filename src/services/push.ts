import { deletePushSubscription, getVapidPublicKey, postPushSubscription } from '@services/emails'
import { clearPushOptIn, setPushOptedIn } from '@services/push-optin'

// What one attempt to turn notifications on ended in. 'dismissed' is the reader closing the
// browser prompt without choosing -- retryable in the page -- and is deliberately NOT 'denied',
// which sends them to browser settings.
export type PushResult = 'subscribed' | 'unsupported' | 'denied' | 'dismissed' | 'unready' | 'failed'

export const READY_TIMEOUT_MS = 5_000

const resolveContainer = (): ServiceWorkerContainer | undefined =>
  typeof navigator === 'undefined' || !('serviceWorker' in navigator) ? undefined : navigator.serviceWorker

// The applicationServerKey must be raw bytes, and the API hands us the URL-safe base64 the
// VAPID spec uses.
export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)))
}

// serviceWorker.ready NEVER rejects: with no registration it stays pending forever, and the
// settings button would spin on "Turning on..." for the life of the page. Race it.
const waitForWorker = (
  swContainer: ServiceWorkerContainer,
  readyTimeoutMs: number,
): Promise<ServiceWorkerRegistration | undefined> =>
  Promise.race([
    swContainer.ready,
    new Promise<undefined>((resolve) => {
      setTimeout(() => resolve(undefined), readyTimeoutMs)
    }),
  ])

const subscribeAndPost = async (
  accountId: string,
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription> => {
  const publicKey = await getVapidPublicKey()
  const subscription = await registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(publicKey),
    userVisibleOnly: true,
  })
  try {
    await postPushSubscription(accountId, subscription.toJSON())
  } catch (error: unknown) {
    // Without this the browser holds a live subscription the server has never heard of:
    // isSubscribedToPush would report "on", the self-heal's null check would never fire, and
    // the reader would be silently unsubscribed while the UI claimed otherwise.
    await subscription.unsubscribe()
    throw error
  }
  return subscription
}

// The subscription is the fact, not Notification.permission: revoking permission in browser
// settings drops the subscription with it, and a granted permission with no subscription is
// not notifications being on. Read-only, so the settings page never prompts on load.
export const isSubscribedToPush = async (swContainer = resolveContainer()): Promise<boolean> => {
  if (!swContainer) {
    return false
  }
  try {
    const registration = await swContainer.ready
    return (await registration.pushManager.getSubscription()) !== null
  } catch (error: unknown) {
    console.error('isSubscribedToPush', { error })
    return false
  }
}

export const subscribeToPush = async (
  accountId: string,
  swContainer = resolveContainer(),
  readyTimeoutMs = READY_TIMEOUT_MS,
): Promise<PushResult> => {
  if (!swContainer || typeof Notification === 'undefined') {
    return 'unsupported'
  }
  // FIRST, before any other await. Safari and Firefox require user activation, and a
  // multi-second wait for the worker would spend it.
  const permission = await Notification.requestPermission()
  if (permission === 'denied') {
    return 'denied'
  }
  if (permission !== 'granted') {
    return 'dismissed'
  }
  // Readiness is checked before the VAPID fetch so an authenticated request is not spent on a
  // key that cannot be used.
  const registration = await waitForWorker(swContainer, readyTimeoutMs)
  if (!registration) {
    return 'unready'
  }
  try {
    await subscribeAndPost(accountId, registration)
    setPushOptedIn()
    return 'subscribed'
  } catch (error: unknown) {
    console.error('subscribeToPush', { accountId, error })
    return 'failed'
  }
}

export const unsubscribeFromPush = async (
  accountId: string,
  swContainer = resolveContainer(),
  readyTimeoutMs = READY_TIMEOUT_MS,
): Promise<'unsubscribed' | 'failed'> => {
  // First, so a failure anywhere after it can never be resurrected by the self-heal.
  clearPushOptIn()
  if (!swContainer) {
    return 'unsubscribed'
  }
  try {
    const registration = await waitForWorker(swContainer, readyTimeoutMs)
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) {
      // Nothing to delete, and the API answers a missing endpoint with 400.
      return 'unsubscribed'
    }
    // Server first: a failed local unsubscribe must not strand a row the server still sends to.
    await deletePushSubscription(accountId, subscription.endpoint)
    await subscription.unsubscribe()
    return 'unsubscribed'
  } catch (error: unknown) {
    console.error('unsubscribeFromPush', { accountId, error })
    return 'failed'
  }
}
