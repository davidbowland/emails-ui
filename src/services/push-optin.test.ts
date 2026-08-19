import { clearPushOptIn, getPushOptInAccount, setPushOptedIn } from './push-optin'
import { accountId } from '@test/__mocks__'

describe('push-optin', () => {
  const OPT_IN_KEY = 'emails.pushOptIn'

  const realStorage = window.localStorage

  const clearStorage = (): void => realStorage.clear()

  // Delegate to the real storage rather than spreading it: spreading a `Storage` copies only
  // the stored key/value pairs, because `getItem`/`setItem`/`key`/`length` all live on
  // `Storage.prototype`.
  const useBrokenStorage = (overrides: Partial<Storage>): void => {
    const stub: Storage = {
      clear: () => realStorage.clear(),
      getItem: (key: string) => realStorage.getItem(key),
      key: (index: number) => realStorage.key(index),
      get length() {
        return realStorage.length
      },
      removeItem: (key: string) => realStorage.removeItem(key),
      setItem: (key: string, value: string) => realStorage.setItem(key, value),
      ...overrides,
    }
    Object.defineProperty(window, 'localStorage', { configurable: true, value: stub })
  }

  const restoreStorage = (): void => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: realStorage })
  }

  afterAll(restoreStorage)

  describe('in the browser', () => {
    it('reports no account when nothing was ever stored', () => {
      clearStorage()

      expect(getPushOptInAccount()).toBeUndefined()
    })

    it('reports the account setPushOptedIn recorded', () => {
      clearStorage()
      setPushOptedIn(accountId)

      expect(getPushOptInAccount()).toEqual(accountId)
    })

    it('stores the account under the expected key', () => {
      clearStorage()
      setPushOptedIn(accountId)

      expect(realStorage.getItem(OPT_IN_KEY)).toEqual(accountId)
    })

    it('removes the key on clearPushOptIn', () => {
      clearStorage()
      setPushOptedIn(accountId)
      clearPushOptIn()

      expect(realStorage.getItem(OPT_IN_KEY)).toBeNull()
      expect(getPushOptInAccount()).toBeUndefined()
    })

    it('reports no account when the stored value is empty', () => {
      clearStorage()
      realStorage.setItem(OPT_IN_KEY, '')

      expect(getPushOptInAccount()).toBeUndefined()
    })

    // Builds before this one wrote a bare '1'. It names no account, so the self-heal has to treat
    // it as somebody else's -- see the mismatch teardown in services/push.ts.
    it('reports the legacy flag as an account no reader can match', () => {
      clearStorage()
      realStorage.setItem(OPT_IN_KEY, '1')

      expect(getPushOptInAccount()).toEqual('1')
    })
  })

  describe('when reading from storage fails', () => {
    beforeAll(() => {
      clearStorage()
      useBrokenStorage({
        getItem: jest.fn(() => {
          throw new Error('private mode')
        }),
      })
    })

    afterAll(restoreStorage)

    it('reports no account', () => {
      expect(getPushOptInAccount()).toBeUndefined()
    })
  })

  describe('when writing to storage fails', () => {
    beforeAll(() => {
      clearStorage()
      useBrokenStorage({
        removeItem: jest.fn(() => {
          throw new Error('private mode')
        }),
        setItem: jest.fn(() => {
          throw new Error('quota exceeded')
        }),
      })
    })

    afterAll(restoreStorage)

    it('does not throw from setPushOptedIn', () => {
      expect(() => setPushOptedIn(accountId)).not.toThrow()
    })

    it('does not throw from clearPushOptIn', () => {
      expect(() => clearPushOptIn()).not.toThrow()
    })
  })

  describe('on the server (no window)', () => {
    const originalWindow = global.window

    const removeWindow = (): void => {
      // @ts-expect-error simulating the SSR environment where window is absent
      delete global.window
    }

    afterAll(() => {
      global.window = originalWindow
    })

    it('reports no account', () => {
      removeWindow()

      expect(getPushOptInAccount()).toBeUndefined()
    })

    it('does not throw from setPushOptedIn', () => {
      removeWindow()

      expect(() => setPushOptedIn(accountId)).not.toThrow()
    })

    it('does not throw from clearPushOptIn', () => {
      removeWindow()

      expect(() => clearPushOptIn()).not.toThrow()
    })
  })
})
