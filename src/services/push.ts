import { deletePushSubscription, getVapidPublicKey, postPushSubscription } from '@services/emails'
import { clearPushOptIn, getPushOptInAccount, setPushOptedIn } from '@services/push-optin'

// What one attempt to turn notifications on ended in. 'dismissed' is the reader closing the
// browser prompt without choosing -- retryable in the page -- and is deliberately NOT 'denied',
// which sends them to browser settings.
export type PushResult = 'subscribed' | 'unsupported' | 'denied' | 'dismissed' | 'unready' | 'failed'

export const READY_TIMEOUT_MS = 5_000

// The deadline for the unsubscribe that sign-out and account deletion wait on. Those two hold
// the reader on a screen they have already left, so they cannot afford the full deadline a
// settings-page action can: a browser whose worker never becomes ready would freeze the sign-out
// for five seconds. Still long enough that the server-side DELETE usually lands.
export const SIGN_OUT_TIMEOUT_MS = 1_500

const resolveContainer = (): ServiceWorkerContainer | undefined =>
  typeof navigator === 'undefined' || !('serviceWorker' in navigator) ? undefined : navigator.serviceWorker

// The applicationServerKey must be raw bytes, and the API hands us the URL-safe base64 the
// VAPID spec uses. The buffer is pinned to ArrayBuffer rather than the default ArrayBufferLike:
// BufferSource excludes SharedArrayBuffer-backed views, so a bare Uint8Array does not satisfy
// PushSubscriptionOptionsInit.applicationServerKey.
export const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
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

// Whether this browser could ever do push, whatever the reader has chosen. Synchronous and
// prompt-free, so the settings page can say so at mount rather than offering a button that can
// only end in 'unsupported'.
// A type predicate, so the callers that go on to use the container do not have to re-check it.
export const isPushSupported = (swContainer = resolveContainer()): swContainer is ServiceWorkerContainer =>
  swContainer !== undefined && typeof Notification !== 'undefined'

// The subscription is the fact, not Notification.permission: revoking permission in browser
// settings drops the subscription with it, and a granted permission with no subscription is
// not notifications being on. Read-only, so the settings page never prompts on load.
export const isSubscribedToPush = async (
  swContainer = resolveContainer(),
  readyTimeoutMs = READY_TIMEOUT_MS,
): Promise<boolean> => {
  if (!swContainer) {
    return false
  }
  try {
    // Raced for the same reason subscribeToPush races it: ready never rejects, so a failed
    // registration would leave the settings button on "Checking notifications…" for the life of
    // the page, with no status line and nothing to try. A worker that never arrives is off.
    const registration = await waitForWorker(swContainer, readyTimeoutMs)
    return Boolean(await registration?.pushManager.getSubscription())
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
  if (!isPushSupported(swContainer)) {
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
    setPushOptedIn(accountId)
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

// Subscriptions die for reasons that have nothing to do with any incident: browsers evict them
// under storage pressure, Chrome drops them after repeated push-budget violations, readers clear
// site data, and a VAPID rotation invalidates every one at once. Without this, each of those is a
// permanent silent failure only a visit to Settings would reveal. No prompt is needed or shown --
// the permission grant survives independently of the registration. Failures are swallowed; this
// is a background repair, not a user action.
//
// It is also where a subscription that outlived its owner's session is taken away. Signing out
// unsubscribes, but that is not the only way a session ends: a refresh token expires, or a
// shared device is simply handed over. The subscription belongs to the browser, so without the
// account check below the previous reader's senders and subject lines would keep arriving on the
// new reader's lock screen -- indefinitely, since the push service still considers the endpoint
// valid.
export const healPushSubscription = async (
  accountId: string,
  swContainer = resolveContainer(),
  readyTimeoutMs = READY_TIMEOUT_MS,
): Promise<void> => {
  const optedInAccount = getPushOptInAccount()
  if (!isPushSupported(swContainer) || Notification.permission !== 'granted' || !optedInAccount) {
    return
  }
  try {
    const registration = await waitForWorker(swContainer, readyTimeoutMs)
    if (!registration) {
      return
    }
    const existing = await registration.pushManager.getSubscription()
    if (optedInAccount !== accountId) {
      // Local only: the DELETE would be signed as this reader, and the row belongs to the other
      // one. Killing the endpoint is what stops the delivery -- the push service answers the
      // server's next send with a 410 and the row goes with it.
      await existing?.unsubscribe()
      clearPushOptIn()
      // Deliberately no re-subscribe. Notifications are this reader's choice to make, in
      // Settings, not one inherited from whoever used the device before.
      return
    }
    if (existing) {
      return
    }
    await subscribeAndPost(accountId, registration)
  } catch (error: unknown) {
    console.warn('healPushSubscription', { accountId, error })
  }
}
