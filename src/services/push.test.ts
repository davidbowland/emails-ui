import * as emails from './emails'
import {
  healPushSubscription,
  isPushSupported,
  isSubscribedToPush,
  READY_TIMEOUT_MS,
  subscribeToPush,
  unsubscribeFromPush,
} from './push'
import * as pushOptin from './push-optin'
import { accountId, pushEndpoint, pushSubscription } from '@test/__mocks__'

jest.mock('./emails')
jest.mock('./push-optin')

describe('push service', () => {
  const subscription = {
    endpoint: pushEndpoint,
    toJSON: () => pushSubscription,
    unsubscribe: jest.fn().mockResolvedValue(true),
  }

  const pushManager = {
    getSubscription: jest.fn().mockResolvedValue(null),
    subscribe: jest.fn().mockResolvedValue(subscription),
  }

  // The container the browser gives us: `ready` resolves once a worker controls the page.
  const createContainer = (ready: Promise<unknown> = Promise.resolve({ pushManager })): any => ({ ready })

  const setPermission = (permission: string, requested = permission): void => {
    Object.defineProperty(global, 'Notification', {
      configurable: true,
      value: { permission, requestPermission: jest.fn().mockResolvedValue(requested) },
      writable: true,
    })
  }

  const removeNotification = (): void => {
    Object.defineProperty(global, 'Notification', { configurable: true, value: undefined, writable: true })
  }

  // JSON.stringify renders an Error as {}, which would hide whatever its message carries.
  const replaceErrors = (key: string, value: unknown): unknown =>
    value instanceof Error ? `${value.message} ${value.stack ?? ''}` : value

  // A real VAPID public key: 65 URL-safe base64 bytes. It has to be decodable, because
  // urlBase64ToUint8Array runs atob on it before subscribe is ever reached.
  const vapidPublicKey = 'BAcOFRwjKjE4P0ZNVFtiaXB3foWMk5qhqK-2vcTL0tng5-71AQgPFh0kKzI5QEdOVVxjanF4f4aNlJuiqbC3vsU'

  beforeAll(() => {
    jest.mocked(emails.getVapidPublicKey).mockResolvedValue(vapidPublicKey)
    jest.mocked(emails.postPushSubscription).mockResolvedValue(undefined)
    jest.mocked(emails.deletePushSubscription).mockResolvedValue(undefined)
    jest.mocked(pushOptin.isPushOptedIn).mockReturnValue(false)

    console.error = jest.fn()
    console.warn = jest.fn()
  })

  describe('isPushSupported', () => {
    it('is false when the browser has no service worker container', () => {
      setPermission('granted')

      // Called the way the settings page calls it, so the default container resolution runs
      // too: jsdom's navigator has no serviceWorker.
      expect(isPushSupported()).toBe(false)
    })

    it('is false when the browser has no Notification API', () => {
      removeNotification()

      expect(isPushSupported(createContainer())).toBe(false)
    })

    it('is true when the browser has both', () => {
      setPermission('default')

      expect(isPushSupported(createContainer())).toBe(true)
    })
  })

  describe('subscribeToPush', () => {
    it('returns unsupported when the browser has no service worker container', async () => {
      setPermission('granted')

      // Called the way the UI calls it, so the default container resolution runs too: jsdom's
      // navigator has no serviceWorker.
      expect(await subscribeToPush(accountId)).toEqual('unsupported')
    })

    it('returns unsupported when the browser has no Notification API', async () => {
      removeNotification()

      expect(await subscribeToPush(accountId, createContainer())).toEqual('unsupported')
    })

    it('returns denied when the reader blocks notifications', async () => {
      setPermission('default', 'denied')

      expect(await subscribeToPush(accountId, createContainer())).toEqual('denied')
    })

    it('returns dismissed when the reader closes the prompt without choosing', async () => {
      setPermission('default', 'default')

      expect(await subscribeToPush(accountId, createContainer())).toEqual('dismissed')
    })

    it('asks for permission before waiting on the worker', async () => {
      setPermission('default', 'denied')
      const container = createContainer(Promise.resolve({ pushManager }))

      await subscribeToPush(accountId, container)

      expect(emails.getVapidPublicKey).not.toHaveBeenCalled()
    })

    it('subscribes, posts the subscription, and records the opt-in', async () => {
      setPermission('granted')
      pushManager.subscribe.mockResolvedValueOnce(subscription)

      const result = await subscribeToPush(accountId, createContainer())

      expect(pushManager.subscribe).toHaveBeenCalledWith({
        applicationServerKey: expect.any(Uint8Array),
        userVisibleOnly: true,
      })
      expect(emails.postPushSubscription).toHaveBeenCalledWith(accountId, pushSubscription)
      expect(pushOptin.setPushOptedIn).toHaveBeenCalled()
      expect(result).toEqual('subscribed')
    })

    it('returns failed and tears the subscription down when the POST fails', async () => {
      setPermission('granted')
      pushManager.subscribe.mockResolvedValueOnce(subscription)
      jest.mocked(emails.postPushSubscription).mockRejectedValueOnce(new Error('500'))

      const result = await subscribeToPush(accountId, createContainer())

      expect(subscription.unsubscribe).toHaveBeenCalled()
      expect(pushOptin.setPushOptedIn).not.toHaveBeenCalled()
      expect(result).toEqual('failed')
    })

    it('returns failed when the VAPID key cannot be fetched', async () => {
      setPermission('granted')
      jest.mocked(emails.getVapidPublicKey).mockRejectedValueOnce(new Error('401'))

      expect(await subscribeToPush(accountId, createContainer())).toEqual('failed')
    })
  })

  describe('when no worker ever becomes ready', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('returns unready rather than hanging forever', async () => {
      setPermission('granted')
      // The real shape of the hang: serviceWorker.ready never rejects and never resolves
      // when there is no registration.
      const container = createContainer(new Promise(() => undefined))

      const pending = subscribeToPush(accountId, container, READY_TIMEOUT_MS)
      await jest.advanceTimersByTimeAsync(READY_TIMEOUT_MS)

      expect(await pending).toEqual('unready')
    })

    it('reports notifications off rather than leaving the settings page checking forever', async () => {
      const container = createContainer(new Promise(() => undefined))

      const pending = isSubscribedToPush(container, READY_TIMEOUT_MS)
      await jest.advanceTimersByTimeAsync(READY_TIMEOUT_MS)

      expect(await pending).toBe(false)
    })
  })

  describe('isSubscribedToPush', () => {
    it('reports false when the browser has no container', async () => {
      expect(await isSubscribedToPush()).toBe(false)
    })

    it('reports false when there is no subscription', async () => {
      pushManager.getSubscription.mockResolvedValueOnce(null)

      expect(await isSubscribedToPush(createContainer())).toBe(false)
    })

    it('reports true when a subscription exists', async () => {
      pushManager.getSubscription.mockResolvedValueOnce(subscription)

      expect(await isSubscribedToPush(createContainer())).toBe(true)
    })

    it('reports false when reading the subscription throws', async () => {
      pushManager.getSubscription.mockRejectedValueOnce(new Error('nope'))

      expect(await isSubscribedToPush(createContainer())).toBe(false)
    })
  })

  describe('unsubscribeFromPush', () => {
    it('clears the opt-in flag before the DELETE', async () => {
      pushManager.getSubscription.mockResolvedValueOnce(subscription)

      await unsubscribeFromPush(accountId, createContainer())

      expect(jest.mocked(pushOptin.clearPushOptIn).mock.invocationCallOrder[0]).toBeLessThan(
        jest.mocked(emails.deletePushSubscription).mock.invocationCallOrder[0],
      )
    })

    it('deletes the endpoint on the server, then locally', async () => {
      pushManager.getSubscription.mockResolvedValueOnce(subscription)

      const result = await unsubscribeFromPush(accountId, createContainer())

      expect(emails.deletePushSubscription).toHaveBeenCalledWith(accountId, pushEndpoint)
      expect(subscription.unsubscribe).toHaveBeenCalled()
      expect(result).toEqual('unsubscribed')
    })

    it('makes no network call when there is no local subscription', async () => {
      pushManager.getSubscription.mockResolvedValueOnce(null)

      const result = await unsubscribeFromPush(accountId, createContainer())

      expect(emails.deletePushSubscription).not.toHaveBeenCalled()
      expect(result).toEqual('unsubscribed')
    })

    it('clears the flag and makes no network call with no container', async () => {
      const result = await unsubscribeFromPush(accountId, undefined)

      expect(pushOptin.clearPushOptIn).toHaveBeenCalled()
      expect(emails.deletePushSubscription).not.toHaveBeenCalled()
      expect(result).toEqual('unsubscribed')
    })

    // Anyone holding the endpoint can send to this browser, so it stays out of the console the
    // same way it stays out of the API's logs.
    it('never writes the endpoint to the console', async () => {
      pushManager.getSubscription.mockResolvedValueOnce(subscription)
      jest
        .mocked(emails.deletePushSubscription)
        .mockRejectedValueOnce(new Error(`DELETE /accounts/${accountId}/push-subscriptions responded with 500`))

      await unsubscribeFromPush(accountId, createContainer())

      const logged = jest
        .mocked(console.error)
        .mock.calls.map((call) => JSON.stringify(call, replaceErrors))
        .join(' ')
      expect(logged).not.toContain(pushEndpoint)
      expect(logged).not.toContain(encodeURIComponent(pushEndpoint))
    })

    it('reports failed when the DELETE fails', async () => {
      pushManager.getSubscription.mockResolvedValueOnce(subscription)
      jest.mocked(emails.deletePushSubscription).mockRejectedValueOnce(new Error('500'))

      expect(await unsubscribeFromPush(accountId, createContainer())).toEqual('failed')
    })
  })

  describe('healPushSubscription', () => {
    const optedInAndGranted = (): void => {
      setPermission('granted')
      jest.mocked(pushOptin.isPushOptedIn).mockReturnValueOnce(true)
    }

    it('re-subscribes silently when the subscription has been evicted', async () => {
      optedInAndGranted()
      pushManager.getSubscription.mockResolvedValueOnce(null)
      pushManager.subscribe.mockResolvedValueOnce(subscription)

      await healPushSubscription(accountId, createContainer())

      expect(pushManager.subscribe).toHaveBeenCalledWith({
        applicationServerKey: expect.any(Uint8Array),
        userVisibleOnly: true,
      })
      expect(emails.postPushSubscription).toHaveBeenCalledWith(accountId, pushSubscription)
    })

    it('never prompts', async () => {
      optedInAndGranted()
      pushManager.getSubscription.mockResolvedValueOnce(null)
      pushManager.subscribe.mockResolvedValueOnce(subscription)

      await healPushSubscription(accountId, createContainer())

      expect(Notification.requestPermission).not.toHaveBeenCalled()
    })

    // No getSubscription value is queued in the two cases below: they return before reading one,
    // and clearMocks resets call records but not a queued mockResolvedValueOnce -- an unconsumed
    // queue would leak into the next test and make it pass or fail for the wrong reason.
    it('does nothing when the reader never opted in', async () => {
      setPermission('granted')
      jest.mocked(pushOptin.isPushOptedIn).mockReturnValueOnce(false)

      await healPushSubscription(accountId, createContainer())

      expect(pushManager.subscribe).not.toHaveBeenCalled()
      expect(emails.postPushSubscription).not.toHaveBeenCalled()
    })

    it('does nothing when permission is no longer granted', async () => {
      setPermission('denied')
      jest.mocked(pushOptin.isPushOptedIn).mockReturnValueOnce(true)

      await healPushSubscription(accountId, createContainer())

      expect(pushManager.subscribe).not.toHaveBeenCalled()
    })

    it('does nothing when a subscription is already live', async () => {
      optedInAndGranted()
      pushManager.getSubscription.mockResolvedValueOnce(subscription)

      await healPushSubscription(accountId, createContainer())

      expect(pushManager.subscribe).not.toHaveBeenCalled()
      expect(emails.postPushSubscription).not.toHaveBeenCalled()
    })

    it('does nothing when the browser has no container', async () => {
      optedInAndGranted()

      await healPushSubscription(accountId, undefined)

      expect(pushManager.subscribe).not.toHaveBeenCalled()
    })

    it('swallows a failed POST, because this is a background repair', async () => {
      optedInAndGranted()
      pushManager.getSubscription.mockResolvedValueOnce(null)
      pushManager.subscribe.mockResolvedValueOnce(subscription)
      jest.mocked(emails.postPushSubscription).mockRejectedValueOnce(new Error('500'))

      await expect(healPushSubscription(accountId, createContainer())).resolves.toBeUndefined()
    })
  })
})
