// `BeforeInstallPromptEvent` is not in lib.dom, so this is the shape we rely on.
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Listener = () => void

let deferredPrompt: BeforeInstallPromptEvent | null = null

// Whether the browser has offered an install prompt during this page load. The
// deferred event is single-use and is spent by `promptInstall()` whatever the
// person chooses, but the offer itself does not stop being true. This lets the UI
// tell "we offered and it was spent" apart from "never offered / open the menu".
let promptOffered = false

// Whether the browser reported the app installed this page load (`appinstalled`). Kept
// separate from `promptOffered` on purpose: the install completing must NOT erase the
// fact that a prompt was offered, or the UI can no longer tell "offered and spent" from
// "never offered" at the exact moment the app was installed. The component treats this as
// one of its "render nothing" signals, alongside the display-mode standalone check.
let installed = false

const listeners = new Set<Listener>()

// One subscriber that throws must not stop the rest from hearing the change.
const notify = (): void => {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch {
      // A broken subscriber is its own problem, not everyone else's.
    }
  })
}

const onBeforeInstallPrompt = (event: Event): void => {
  // Suppress the browser's own mini-infobar so our offer is the single one.
  event.preventDefault()
  deferredPrompt = event as BeforeInstallPromptEvent
  promptOffered = true
  notify()
}

// Once installed there is nothing left to offer. Clear the spent event and record the
// install — but leave `promptOffered` alone: it is a page-load latch, and an install
// firing is exactly when the "offered vs never offered" distinction still has to hold.
const onInstalled = (): void => {
  deferredPrompt = null
  installed = true
  notify()
}

// Capture at module scope. Chrome fires `beforeinstallprompt` once, early, and can
// fire it before React hydrates — listeners attached from an effect would miss it,
// and the only symptom would be an Install control that never appears.
//
// SSR guard is non-negotiable: production is a static export (`output: 'export'`),
// so this module is evaluated in Node during `next build`, where `window` is
// undefined. An unguarded reference throws and fails the export.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onInstalled)
}

export const getDeferredPrompt = (): BeforeInstallPromptEvent | null => deferredPrompt

// True from the moment the browser offers an install prompt this page load,
// including after the deferred event has been spent. A one-way latch — the install
// completing does not reset it (that is what `isInstalled()` is for).
export const wasPromptOffered = (): boolean => promptOffered

// True once the browser has reported the app installed this page load. The component
// resolves the offer to `hidden` on this OR a standalone display-mode; the display-mode
// check is the durable one (iOS never fires `appinstalled`), this is for immediacy in
// the same tab right after a Chromium install.
export const isInstalled = (): boolean => installed

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Show the browser's own install sheet. Returns true only when the person accepted.
// The event is single-use, so it is spent either way — matching the browser, which
// will not fire `beforeinstallprompt` again until the page reloads.
export const promptInstall = async (): Promise<boolean> => {
  const event = deferredPrompt
  if (event === null) {
    return false
  }
  try {
    await event.prompt()
    const choice = await event.userChoice
    return choice.outcome === 'accepted'
  } catch {
    // `prompt()` throws when called twice or outside a user gesture; that must not
    // reject into a click handler. The spent event is cleared regardless.
    return false
  } finally {
    deferredPrompt = null
    notify()
  }
}
