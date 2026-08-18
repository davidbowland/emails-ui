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
 * browsers pick this up on their next update check. It deletes every cache, unregisters
 * itself, and handles no fetches, so pages load straight from the network again and the
 * site behaves as a plain static site with no worker at all.
 *
 * Restore scripts/sw-src.js from git once the real fix is ready:
 *
 *   git checkout -- scripts/sw-src.js
 *
 * emails-ui has NO Web Push, so unlike a push-bearing app's kill switch this one does
 * not stay registered to keep notifications alive -- AC-023 requires it to unregister
 * itself so a fixed build starts from a clean slate. Unlike the real worker it also calls
 * skipWaiting: an incident response has to take effect on the current page load.
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
      // Unregister before claiming: nothing keeps this worker around once its caches are
      // gone, so it tears itself down and the next navigation is served with no worker.
      .then(function () {
        return self.registration.unregister()
      })
      .then(function () {
        return self.clients.claim()
      }),
  )
})

// No fetch handler that intercepts: every request goes straight to the network.
