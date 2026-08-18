import { useEffect, useState } from 'react'

import {
  getDeferredPrompt,
  isInstalled,
  promptInstall as promptInstallService,
  subscribe,
  wasPromptOffered,
} from '@services/install-prompt'
import { InstallState } from '@types'

// True when the page is already running as an installed app. Two signals: the standalone
// display mode (durable, and the only one iOS reports) and iOS Safari's legacy
// `navigator.standalone`. SSR-guarded, and tolerant of a `matchMedia` that is absent —
// jsdom omits it, and an old browser might too.
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }
  const legacyStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayModeStandalone =
    typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  return displayModeStandalone || legacyStandalone
}

// iOS detection that also catches the iPad, which reports a Mac user agent and is only
// told apart by having a touch screen (`MacIntel` + more than one touch point). This is
// the recorded misdetection class two sibling repos shipped and then fixed.
export const isIosDevice = (userAgent: string, platform: string, maxTouchPoints: number): boolean =>
  /iphone|ipad|ipod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)

// Firefox on Android is the one browser that installs only from its own menu. Firefox on
// iOS is NOT this case — it must get the Safari/iOS instructions — so the iOS check runs
// first in `resolveState`.
export const isFirefoxAndroid = (userAgent: string): boolean => /firefox/i.test(userAgent) && /android/i.test(userAgent)

// A touch-first device, used only to word the "what changes" list ("home screen" vs
// "dock"). SSR-guarded and tolerant of an absent `matchMedia`.
export const isCoarsePointer = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(pointer: coarse)').matches
}

// Whether to phrase the offer for a phone. iOS and Firefox-Android are always phones; the
// promptable/spent states could be either, so fall back to the pointer type.
export const isPhoneLike = (state: InstallState, coarse: boolean = isCoarsePointer()): boolean =>
  state === 'ios' || state === 'menu' || coarse

// The single source of truth for which of the five faces the offer shows. Order matters and
// is fixed: installed wins over everything; a live prompt beats a spent one; iOS is checked
// before Firefox-Android so Firefox-on-iOS still gets the Safari steps.
export const resolveState = (): InstallState => {
  if (typeof window === 'undefined') {
    return 'hidden'
  }
  if (isStandalone() || isInstalled()) {
    return 'hidden'
  }
  if (getDeferredPrompt() !== null) {
    return 'promptable'
  }
  if (wasPromptOffered()) {
    return 'spent'
  }
  if (isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints)) {
    return 'ios'
  }
  if (isFirefoxAndroid(navigator.userAgent)) {
    return 'menu'
  }
  return 'hidden'
}

export interface UseInstallPrompt {
  promptInstall: () => Promise<boolean>
  state: InstallState
}

// React binding over the install services. State is resolved AFTER mount so the static
// export's markup and the first client render agree (both render nothing), then re-resolved
// whenever the services notify a change.
export const useInstallPrompt = (): UseInstallPrompt => {
  const [state, setState] = useState<InstallState>('hidden')

  useEffect(() => {
    setState(resolveState())
    return subscribe(() => setState(resolveState()))
  }, [])

  return { promptInstall: promptInstallService, state }
}
