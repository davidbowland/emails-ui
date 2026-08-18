'use strict'

/*
 * Emergency service worker kill switch.
 *
 * If the deployed worker is broken, copy this file over scripts/sw-src.js and deploy:
 *
 *   cp scripts/sw-killswitch.js scripts/sw-src.js && npm run deploy
 *
 * This file declares no precache manifest -- it has no PRECACHE line -- which is fine:
 * scripts/build-sw.js keys off exactly that absence and copies the source straight
 * through to out/sw.js with a warning. An incident response must never be blocked by the
 * build step it is trying to bypass. (This comment avoids writing the injected variable
 * name verbatim so the detector cannot mistake the comment for the real declaration.)
 *
 * Because sw.js is served no-cache and the deploy re-writes /sw.js at CloudFront,
 * browsers pick this up on their next update check. It deletes every cache and handles no
 * fetches, so pages load straight from the network again and the site behaves as a plain
 * static site with no caching worker.
 *
 * Restore scripts/sw-src.js from git once the real fix is ready:
 *
 *   git checkout -- scripts/sw-src.js
 *
 * It does NOT unregister itself, and it carries the push region from sw-src.js byte for
 * byte. A PushSubscription is owned by the ServiceWorkerRegistration: unregistering would
 * destroy every subscription on every browser that picked this up, silently -- the settings
 * page would correctly report notifications as off, but nobody opens settings to check
 * something they believe is working. The caching bug is fully neutralised either way; what
 * is lost is only that the next real deploy replaces this worker through the normal update
 * path rather than starting from no registration. This supersedes AC-023 in
 * docs/planning/2026-08-18-pwa/spec.md. Unlike the real worker it still calls skipWaiting:
 * an incident response has to take effect on the current page load.
 */

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            return caches.delete(key)
          }),
        )
      })
      .then(function () {
        return self.clients.claim()
      }),
  )
})

// No fetch handler that intercepts: every request goes straight to the network.

// #region push
// PUSH REGION -- byte-for-byte identical to the same region in sw-killswitch.js, and
// test/scripts/service-worker.test.ts compares the two with toBe. A PushSubscription is owned
// by the ServiceWorkerRegistration, so the kill switch has to keep notifications alive while it
// neutralizes the caching bug. Edit both files or neither.

// The payload carries facts, not sentences: { emailId, senderLabel?, subject? } and nothing
// else, ever. The three shapes below are the three privacy tiers -- what a reader asked not to
// see never leaves the Lambda -- so the label-less branch is the renderer for 'none', not a
// defensive afterthought. A malformed payload lands on the same row, which is the right failure.
function buildNotification(payload) {
  if (!payload.senderLabel) {
    return { body: 'New email', title: 'Emails' }
  }
  if (!payload.subject) {
    return { body: 'sent you an email', title: payload.senderLabel }
  }
  return { body: payload.subject, title: payload.senderLabel }
}

function readPushPayload(event) {
  try {
    return event.data ? event.data.json() : {}
  } catch {
    // An unreadable payload lands on the label-less row, which is the right failure.
    return {}
  }
}

self.addEventListener('push', function (event) {
  var payload = readPushPayload(event)
  var notification = buildNotification(payload)
  event.waitUntil(
    self.registration.showNotification(notification.title, {
      // The only precached 192px asset (scripts/build-sw.js:44). Under the kill switch the
      // caches are gone, so the platform fetches it or draws without one.
      badge: '/icon-192.png',
      body: notification.body,
      // An id, never a route: renaming a Next.js route must not strip a notification of its
      // destination.
      data: { emailId: payload.emailId },
      icon: '/icon-192.png',
      // Conditional, and load-bearing. The Notifications Standard throws a TypeError when
      // renotify is true and tag is the empty string -- which is what an absent emailId becomes
      // under WebIDL. showNotification would reject, waitUntil would receive a rejected promise,
      // and NOTHING would be drawn: the one payload that could not be read would be the one push
      // showing no notification at all.
      renotify: Boolean(payload.emailId),
      // One notification per email. Unlike a chat thread, a mailbox wants to show that three
      // separate things arrived.
      tag: payload.emailId,
    }),
  )
})

// trailingSlash: true means the app navigates to /inbox/, but a shared link can land on /inbox,
// so both forms have to count as the inbox.
function isInboxClient(client) {
  var pathname = new URL(client.url).pathname
  return (pathname.slice(-1) === '/' ? pathname : pathname + '/') === '/inbox/'
}

// The target is always /inbox/ -- there is no per-email route.
function openInbox() {
  return self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clientList) {
    var windows = clientList || []
    var inbox = windows.filter(isInboxClient)[0]
    if (inbox) {
      // Not decoration: this app does no polling at all, so focusing a stale inbox would show a
      // mailbox that does not contain the email just tapped. The page listens for this message
      // and re-fetches; navigate() to the same URL would work but would discard component state
      // to achieve the same thing.
      inbox.postMessage({ type: 'refresh-inbox' })
      return inbox.focus()
    }
    var other = windows[0]
    if (other) {
      return Promise.resolve()
        .then(function () {
          return other.navigate('/inbox/')
        })
        .then(function (navigated) {
          return (navigated || other).focus()
        })
        .catch(function () {
          // navigate() rejects for a client this worker does not control, and
          // includeUncontrolled hands us exactly those -- so the rejection must land here rather
          // than on waitUntil, or the tap draws nothing at all.
          return self.clients.openWindow('/inbox/')
        })
    }
    return self.clients.openWindow('/inbox/')
  })
}

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(openInbox())
})
// #endregion push
