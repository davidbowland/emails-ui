import { readFileSync } from 'fs'
import { join } from 'path'

// sw-src.js runs in a worker scope, so it is loaded as text and evaluated with the scope
// globals it reaches for passed in as parameters. Every handler it registers is kept so a
// test can drive a real event through the real code.

const ORIGIN = 'https://email.dbowland.com'
const CACHE = 'emails-ui-dev'

const SW_SRC = join(__dirname, '..', '..', 'scripts', 'sw-src.js')
const source = readFileSync(SW_SRC, 'utf8')

// A stand-in for the responses the worker gets back from fetch or the cache.
const createResponse = (body: any, { status = 200 }: { status?: number } = {}) => ({
  body,
  ok: status >= 200 && status < 300,
  status,
})

// The response the worker builds itself with `new Response(...)`.
class FakeResponse {
  body: any
  headers: any
  status: number
  statusText: string
  ok: boolean
  constructor(body: any, init: any = {}) {
    this.body = body
    this.headers = init.headers ?? {}
    this.status = init.status ?? 200
    this.statusText = init.statusText ?? ''
    this.ok = this.status >= 200 && this.status < 300
  }
}

// CacheStorage with just the surface sw-src.js touches. Keys are normalized to an
// absolute URL the way a real Cache does, so `caches.match('/')` and a seeded request key
// can find each other.
const createCacheStorage = () => {
  const stores = new Map<string, Map<string, any>>()
  const keyOf = (key: any) => new URL(typeof key === 'string' ? key : key.url, ORIGIN).href
  const entriesFor = (name: string) => {
    const existing = stores.get(name) ?? new Map()
    stores.set(name, existing)
    return existing
  }
  return {
    delete: jest.fn((name: string) => Promise.resolve(stores.delete(name))),
    keys: jest.fn(() => Promise.resolve([...stores.keys()])),
    match: jest.fn((key: any) =>
      Promise.resolve(
        [...stores.values()].map((entries) => entries.get(keyOf(key))).find((entry) => entry !== undefined),
      ),
    ),
    open: jest.fn((name: string) => {
      const entries = entriesFor(name)
      return Promise.resolve({
        addAll: jest.fn((urls: string[]) => {
          urls.forEach((url) => entries.set(keyOf(url), createResponse(url)))
          return Promise.resolve()
        }),
      })
    }),
    seed: (name: string, bodies: Record<string, any>) => {
      const entries = entriesFor(name)
      Object.entries(bodies).forEach(([url, body]) => entries.set(keyOf(url), createResponse(body)))
    },
    stores,
  }
}

const loadSw = () => {
  const handlers: Record<string, any> = {}
  const caches = createCacheStorage()
  const fetchMock = jest.fn()
  const self = {
    addEventListener: (type: string, handler: any) => {
      handlers[type] = handler
    },
    clients: { claim: jest.fn(() => Promise.resolve()) },
    location: { origin: ORIGIN },
    skipWaiting: jest.fn(),
  }
  const swExports: any = {}
  new Function('self', 'exports', 'caches', 'fetch', 'Response', source)(
    self,
    swExports,
    caches,
    fetchMock,
    FakeResponse,
  )
  return { caches, exports: swExports, fetchMock, handlers, self }
}

// The network is down unless a test says otherwise. Online tests override with
// fetchMock.mockResolvedValueOnce.
const setup = (seeded: Record<string, any> = {}) => {
  const sw = loadSw()
  sw.caches.seed(CACHE, seeded)
  sw.fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
  return sw
}

const createFetchEvent = (
  url: string,
  { method = 'GET', mode = 'no-cors' }: { method?: string; mode?: string } = {},
) => {
  const waited: Promise<any>[] = []
  const event: any = {
    request: { method, mode, url: new URL(url, ORIGIN).href },
    responded: undefined,
    respondWith: (promise: Promise<any>) => {
      event.responded = promise
    },
    waitUntil: jest.fn((promise: Promise<any>) => {
      waited.push(promise)
    }),
    waited,
  }
  return event
}

const dispatchFetch = async (sw: ReturnType<typeof loadSw>, url: string, init?: any) => {
  const event = createFetchEvent(url, init)
  sw.handlers.fetch(event)
  const response = await event.responded
  await Promise.all(event.waited)
  return { event, response }
}

const dispatchLifecycle = async (sw: ReturnType<typeof loadSw>, type: string) => {
  const waited: Promise<any>[] = []
  sw.handlers[type]({ waitUntil: (promise: Promise<any>) => waited.push(promise) })
  await Promise.all(waited)
}

describe('sw-src indexFor', () => {
  const { indexFor } = loadSw().exports

  it('appends index.html to a directory URL', () => {
    expect(indexFor('/inbox/')).toBe('/inbox/index.html')
  })

  it('appends a whole segment to an extensionless URL', () => {
    expect(indexFor('/foo')).toBe('/foo/index.html')
  })

  it('resolves the site root', () => {
    expect(indexFor('/')).toBe('/index.html')
  })

  it('leaves a file URL alone', () => {
    expect(indexFor('/x.js')).toBeNull()
  })
})

describe('sw-src runtime writes', () => {
  it('never writes to the cache at runtime (ADR-2)', () => {
    expect(source).not.toContain('.put(')
  })
})

describe('sw-src install', () => {
  it('precaches every entry in the manifest', async () => {
    const sw = setup()

    await dispatchLifecycle(sw, 'install')

    expect([...sw.caches.stores.get(CACHE)!.keys()]).toEqual([`${ORIGIN}/`])
  })

  it('takes over from the previous worker immediately', async () => {
    const sw = setup()

    await dispatchLifecycle(sw, 'install')

    expect(sw.self.skipWaiting).toHaveBeenCalled()
  })
})

describe('sw-src activate', () => {
  it('deletes caches from earlier builds and keeps the current one', async () => {
    const sw = setup()
    sw.caches.seed('emails-ui-older', { '/': 'stale home page' })

    await dispatchLifecycle(sw, 'activate')

    expect([...sw.caches.stores.keys()]).toEqual([CACHE])
  })

  it('claims open clients only after the stale caches are gone', async () => {
    const sw = setup()
    sw.caches.seed('emails-ui-older', { '/': 'stale home page' })

    await dispatchLifecycle(sw, 'activate')

    expect(sw.caches.delete.mock.invocationCallOrder[0]).toBeLessThan(sw.self.clients.claim.mock.invocationCallOrder[0])
  })
})

describe('sw-src fetch bail-outs', () => {
  it('leaves a non-GET request to the network', async () => {
    const sw = setup()

    const { event } = await dispatchFetch(sw, '/', { method: 'POST' })

    expect(event.responded).toBeUndefined()
  })

  it('leaves a cross-origin request to the network', async () => {
    const sw = setup()

    const { event } = await dispatchFetch(sw, 'https://emails-email-api.dbowland.com/accounts')

    expect(event.responded).toBeUndefined()
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })

  it('leaves the manifest to the browser, even with the network down', async () => {
    const sw = setup()

    const { event } = await dispatchFetch(sw, '/site.webmanifest', { mode: 'cors' })

    expect(event.responded).toBeUndefined()
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })
})

describe('sw-src fetch of hashed assets', () => {
  it('answers from the cache without touching the network', async () => {
    const sw = setup({ '/_next/static/chunks/main-abc123.js': 'cached chunk' })

    const { response } = await dispatchFetch(sw, '/_next/static/chunks/main-abc123.js')

    expect(response.body).toBe('cached chunk')
    expect(sw.fetchMock).not.toHaveBeenCalled()
  })

  it('falls to the network for an asset the manifest missed', async () => {
    const sw = setup()
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh chunk'))

    const { response } = await dispatchFetch(sw, '/_next/static/chunks/main-abc123.js')

    expect(response.body).toBe('fresh chunk')
    await expect(sw.caches.match('/_next/static/chunks/main-abc123.js')).resolves.toBeUndefined()
  })
})

describe('sw-src fetch of documents', () => {
  it('prefers the network even when a copy is cached', async () => {
    const sw = setup({ '/privacy-policy/': 'stale page' })
    sw.fetchMock.mockResolvedValueOnce(createResponse('fresh page'))

    const { response } = await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    expect(response.body).toBe('fresh page')
  })

  it('falls back to the cached copy when the network fails', async () => {
    const sw = setup({ '/': 'home page', '/privacy-policy/': 'cached page' })

    const { response } = await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    expect(response.body).toBe('cached page')
  })

  it('falls back to the exported index.html for a directory URL', async () => {
    const sw = setup({ '/': 'home page', '/privacy-policy/index.html': 'privacy page' })

    const { response } = await dispatchFetch(sw, '/privacy-policy/', { mode: 'navigate' })

    expect(response.body).toBe('privacy page')
  })

  it('falls back to the home page for a document it has never seen', async () => {
    const sw = setup({ '/': 'home page' })

    const { response } = await dispatchFetch(sw, '/some-new-route/', { mode: 'navigate' })

    expect(response.body).toBe('home page')
  })

  it('explains itself when nothing at all is cached', async () => {
    const sw = setup()

    const { response } = await dispatchFetch(sw, '/some-new-route/', { mode: 'navigate' })

    expect(response.status).toBe(503)
    expect(response.body).toBe('You’re offline and this page isn’t on this device. Try again when you’re online.')
  })
})

describe('sw-src fetch of offline subresources', () => {
  it('fails an uncached asset with a 503 rather than answering with HTML', async () => {
    const sw = setup({ '/': 'home page' })

    const { response } = await dispatchFetch(sw, '/og-image.png', { mode: 'cors' })

    expect(response.body).not.toBe('home page')
    expect(response.status).toBe(503)
  })
})
