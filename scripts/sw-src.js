'use strict'

// CACHE_VERSION and PRECACHE are rewritten by scripts/build-sw.js at postbuild, so
// the cache name changes whenever the build does. The literals below are only what a
// dev server sees; nothing ships with them. PRECACHE lists only '/', the one URL that
// exists in both worlds -- addAll is atomic, so naming a route a dev server has never
// exported would 404 and fail the install, and the worker would never activate locally.
var CACHE_VERSION = 'dev'
var PRECACHE = ['/']

var CACHE_NAME = 'emails-ui-' + CACHE_VERSION

// The one URL rewrite this worker performs, and only offline: online, CloudFront has
// already resolved a directory URL to its index.html at the edge and the response comes
// back keyed by the URL the browser asked for. A trailing-slash path takes index.html;
// an extensionless path takes a whole /index.html segment; anything with a file
// extension (a real asset) is left alone so it can miss cleanly rather than be answered
// with a document. emails-ui has no dynamic route segments, so this is the whole story --
// there is no per-route shell rewrite to do.
function indexFor(pathname) {
  if (pathname.slice(-1) === '/') return pathname + 'index.html'
  if (/\.[^/]+$/.test(pathname)) return null
  return pathname + '/index.html'
}

// The one string the worker writes that a reader ever sees. It is handed only to a
// document that is uncached with no connection, so waiting for a connection is the only
// step left to name. charset is declared because the copy carries a typographic
// apostrophe, and text/plain with no charset is decoded as windows-1252 by browsers that
// guess. A subresource (JSON, an icon) never renders this body -- but it must still be a
// 503 and never an HTML document, or Next's loaders would throw on res.json().
function offlineResponse(noun) {
  return new Response('You’re offline and this ' + noun + ' isn’t on this device. Try again when you’re online.', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    status: 503,
    statusText: 'Offline',
  })
}

// ADR-2: this worker NEVER writes to the cache at runtime. Everything servable is put
// there by the precache at install (build-sw.js injects the complete list), so install is
// the only writer. addAll is atomic; skipWaiting so a fixed worker takes the current load.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE)
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key !== CACHE_NAME
            })
            .map(function (key) {
              return caches.delete(key)
            }),
        )
      })
      // Inside waitUntil and AFTER the deletes, so a page adopted by this worker never
      // sees the moment where the old caches are still around.
      .then(function () {
        return self.clients.claim()
      }),
  )
})

self.addEventListener('fetch', function (event) {
  var request = event.request

  // The bail-outs come first, before any cache access. Nothing they decline is ever
  // read from or measured against the cache.

  // A non-GET is a mutation -- sending mail, updating a setting. It has no place in a
  // read-through cache, and respondWith would only get in the network's way.
  if (request.method !== 'GET') return

  // The API is a different origin (emails-email-api.dbowland.com) and so is every mail
  // body, token, and attachment. Declining anything cross-origin keeps all of it out of
  // the cache BY SHAPE -- there is no allowlist to keep in sync, only "same origin as the
  // app shell, or not us".
  var url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never answer for the manifest. Firefox fetches site.webmanifest from an uncaught
  // requestIdleCallback and discards the WHOLE manifest on any non-2xx answer:
  //
  //   const badStatus = aResp.status < 200 || aResp.status >= 300
  //   if (aResp.type === "error" || badStatus) throw new Error(msg)
  //
  // ContentDelegateChild runs that with no try/catch, so one bad response means no
  // manifest at all for that page load and installableManifest() returns null -- the
  // difference between Android offering to install an app and offering a bookmark. A
  // worker here has nothing to add (the file is under a kilobyte and ships no-cache) and
  // one thing to lose, because the subresource miss branch below would answer it with a
  // synthetic 503. So leave it to the browser, exactly as an app with no worker does.
  if (url.pathname === '/site.webmanifest') return

  // Everything under _next/ is content-hashed and ships immutable (see
  // scripts/copyToS3.sh), so the bytes behind a URL can never change and cache-first is
  // safe forever. The whole tree is precached, so this reads straight from the precache;
  // the network fetch is only a belt-and-braces path for a URL the manifest somehow
  // missed, and it is NOT written back -- ADR-2, install is the only writer.
  if (url.pathname.indexOf('/_next/') === 0) {
    event.respondWith(
      caches.match(request).then(function (hit) {
        return hit || fetch(request)
      }),
    )
    return
  }

  // Everything else ships `public, no-cache` (copyToS3.sh), so network-first: a
  // cache-first shell would pin every installed user to the build they first opened.
  event.respondWith(
    // Two-argument then, not .then().catch(): a trailing catch would also swallow
    // anything the success handler throws and quietly answer a live request with a stale
    // copy, looking exactly like being offline.
    fetch(request).then(
      function (response) {
        return response
      },
      function () {
        // Offline. In order: the exact URL, then the directory-index form the edge would
        // have appended, then -- for a document only -- the precached home page. Falling
        // straight to '/' would answer /privacy-policy/ with the inbox.
        var indexed = indexFor(url.pathname)
        return caches
          .match(request)
          .then(function (hit) {
            return hit || (indexed ? caches.match(indexed) : undefined)
          })
          .then(function (hit) {
            if (hit) return hit
            // Last resort for a DOCUMENT only. Handing the home page's HTML to a
            // subresource is worse than failing: a JSON or icon request would resolve
            // 200 with an HTML body and its loader would throw, where a clean network
            // error lets the browser do the sensible thing.
            if (request.mode !== 'navigate') return offlineResponse('file')
            return caches.match('/').then(function (home) {
              return home || offlineResponse('page')
            })
          })
      },
    ),
  )
})

// Exported for test only; harmless in a worker scope, which has no `exports`.
if (typeof exports !== 'undefined') {
  exports.indexFor = indexFor
}
