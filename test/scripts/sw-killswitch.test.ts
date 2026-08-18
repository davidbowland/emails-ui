import { readFileSync } from 'fs'
import { join } from 'path'

const SW_KILLSWITCH = join(__dirname, '..', '..', 'scripts', 'sw-killswitch.js')
const source = readFileSync(SW_KILLSWITCH, 'utf8')

const loadKillSwitch = () => {
  const handlers: Record<string, any> = {}
  const stores = new Map<string, boolean>([
    ['emails-ui-abc', true],
    ['emails-ui-def', true],
  ])
  const caches = {
    delete: jest.fn((name: string) => Promise.resolve(stores.delete(name))),
    keys: jest.fn(() => Promise.resolve([...stores.keys()])),
    stores,
  }
  const self = {
    addEventListener: (type: string, handler: any) => {
      handlers[type] = handler
    },
    clients: { claim: jest.fn(() => Promise.resolve()) },
    registration: { unregister: jest.fn(() => Promise.resolve(true)) },
    skipWaiting: jest.fn(),
  }
  new Function('self', 'caches', source)(self, caches)
  return { caches, handlers, self }
}

const dispatchLifecycle = async (sw: ReturnType<typeof loadKillSwitch>, type: string) => {
  const waited: Promise<any>[] = []
  const event = { waitUntil: (promise: Promise<any>) => waited.push(promise) }
  sw.handlers[type](event)
  await Promise.all(waited)
}

describe('sw-killswitch pass-through', () => {
  it('carries no precache placeholder, so build-sw copies it straight through', () => {
    expect(source).not.toContain('var PRECACHE =')
  })
})

describe('sw-killswitch install', () => {
  it('takes effect on the current page load', async () => {
    const sw = loadKillSwitch()

    await dispatchLifecycle(sw, 'install')

    expect(sw.self.skipWaiting).toHaveBeenCalled()
  })
})

describe('sw-killswitch activate', () => {
  it('deletes every cache', async () => {
    const sw = loadKillSwitch()

    await dispatchLifecycle(sw, 'activate')

    expect([...sw.caches.stores.keys()]).toEqual([])
  })

  it('unregisters itself', async () => {
    const sw = loadKillSwitch()

    await dispatchLifecycle(sw, 'activate')

    expect(sw.self.registration.unregister).toHaveBeenCalled()
  })

  it('claims open clients', async () => {
    const sw = loadKillSwitch()

    await dispatchLifecycle(sw, 'activate')

    expect(sw.self.clients.claim).toHaveBeenCalled()
  })
})
