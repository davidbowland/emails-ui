import { isInstallCollapsed, setInstallCollapsed } from './install-dismissal'

describe('install-dismissal', () => {
  const COLLAPSED_KEY = 'emails.installCollapsed'

  const realStorage = window.localStorage

  const clearStorage = (): void => realStorage.clear()

  // Delegate to the real storage rather than spreading it: spreading a `Storage`
  // copies only the stored key/value pairs, because `getItem`/`setItem`/`key`/
  // `length` all live on `Storage.prototype`.
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
    it('is not collapsed when nothing was ever stored', () => {
      clearStorage()

      expect(isInstallCollapsed()).toBe(false)
    })

    it('returns the fallback when nothing was ever stored', () => {
      clearStorage()

      expect(isInstallCollapsed(true)).toBe(true)
      expect(isInstallCollapsed(false)).toBe(false)
    })

    it('honors an explicit stored choice over the fallback', () => {
      clearStorage()
      setInstallCollapsed(false)

      expect(isInstallCollapsed(true)).toBe(false)
    })

    it('is collapsed after setInstallCollapsed(true)', () => {
      clearStorage()
      setInstallCollapsed(true)

      expect(isInstallCollapsed()).toBe(true)
    })

    it('stores the flag under the expected key', () => {
      clearStorage()
      setInstallCollapsed(true)

      expect(realStorage.getItem(COLLAPSED_KEY)).toBe('1')
    })

    it('is not collapsed again after setInstallCollapsed(false)', () => {
      clearStorage()
      setInstallCollapsed(true)
      setInstallCollapsed(false)

      expect(isInstallCollapsed()).toBe(false)
    })

    it('stores an explicit 0 on setInstallCollapsed(false), not a cleared key', () => {
      clearStorage()
      setInstallCollapsed(true)
      setInstallCollapsed(false)

      expect(realStorage.getItem(COLLAPSED_KEY)).toBe('0')
    })

    it('falls back when the stored value is unexpected', () => {
      clearStorage()
      realStorage.setItem(COLLAPSED_KEY, 'maybe')

      expect(isInstallCollapsed(false)).toBe(false)
      expect(isInstallCollapsed(true)).toBe(true)
    })
  })

  // Each broken-storage case gets its own block so the stub is torn down by an
  // `afterAll` that runs even when an assertion throws. Restoring inline at the end
  // of a test body would leave the stub installed for whichever test ran next.
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

    it('reports not collapsed', () => {
      expect(isInstallCollapsed()).toBe(false)
    })
  })

  describe('when writing to storage fails', () => {
    beforeAll(() => {
      clearStorage()
      useBrokenStorage({
        setItem: jest.fn(() => {
          throw new Error('quota exceeded')
        }),
      })
    })

    afterAll(restoreStorage)

    it('does not throw', () => {
      expect(() => setInstallCollapsed(true)).not.toThrow()
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

    it('reports not collapsed', () => {
      removeWindow()

      expect(isInstallCollapsed()).toBe(false)
    })

    it('does not throw from setInstallCollapsed', () => {
      removeWindow()

      expect(() => setInstallCollapsed(true)).not.toThrow()
    })
  })
})
