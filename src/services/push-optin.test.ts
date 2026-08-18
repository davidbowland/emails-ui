import { clearPushOptIn, isPushOptedIn, setPushOptedIn } from './push-optin'

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
    it('is not opted in when nothing was ever stored', () => {
      clearStorage()

      expect(isPushOptedIn()).toBe(false)
    })

    it('is opted in after setPushOptedIn', () => {
      clearStorage()
      setPushOptedIn()

      expect(isPushOptedIn()).toBe(true)
    })

    it('stores the flag under the expected key', () => {
      clearStorage()
      setPushOptedIn()

      expect(realStorage.getItem(OPT_IN_KEY)).toBe('1')
    })

    it('removes the key on clearPushOptIn', () => {
      clearStorage()
      setPushOptedIn()
      clearPushOptIn()

      expect(realStorage.getItem(OPT_IN_KEY)).toBeNull()
      expect(isPushOptedIn()).toBe(false)
    })

    it('is not opted in when the stored value is unexpected', () => {
      clearStorage()
      realStorage.setItem(OPT_IN_KEY, 'maybe')

      expect(isPushOptedIn()).toBe(false)
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

    it('reports not opted in', () => {
      expect(isPushOptedIn()).toBe(false)
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
      expect(() => setPushOptedIn()).not.toThrow()
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

    it('reports not opted in', () => {
      removeWindow()

      expect(isPushOptedIn()).toBe(false)
    })

    it('does not throw from setPushOptedIn', () => {
      removeWindow()

      expect(() => setPushOptedIn()).not.toThrow()
    })

    it('does not throw from clearPushOptIn', () => {
      removeWindow()

      expect(() => clearPushOptIn()).not.toThrow()
    })
  })
})
