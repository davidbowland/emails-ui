import React from 'react'

import InstallOffer from './index'
import {
  isChromium,
  isCoarsePointer,
  isFirefoxAndroid,
  isIosDevice,
  isPhoneLike,
  isStandalone,
  resolveState,
} from './use-install-prompt'
import * as installDismissal from '@services/install-dismissal'
import * as installPrompt from '@services/install-prompt'
import { BeforeInstallPromptEvent } from '@services/install-prompt'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstallState } from '@types'

jest.mock('@services/install-prompt')
jest.mock('@services/install-dismissal')

const DESKTOP = {
  maxTouchPoints: 0,
  platform: 'Win32',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537',
}
const IPHONE = {
  maxTouchPoints: 5,
  platform: 'iPhone',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604',
}
const FIREFOX_ANDROID = {
  maxTouchPoints: 5,
  platform: 'Linux armv8l',
  userAgent: 'Mozilla/5.0 (Android 13; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
}
// Desktop Firefox genuinely cannot install a web app (Mozilla removed site-specific
// browsers), so it is the browser that resolves to `hidden`.
const FIREFOX_DESKTOP = {
  maxTouchPoints: 0,
  platform: 'Linux x86_64',
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
}

const BANNED = [/\bplease\b/i, /\bPWA\b/i, /manifest/i, /service worker/i, /progressive web app/i]

const fakeEvent = {
  prompt: jest.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted' as const }),
} as unknown as BeforeInstallPromptEvent

const setNavigator = (props: { maxTouchPoints: number; platform: string; userAgent: string }): void => {
  Object.entries(props).forEach(([key, value]) => {
    Object.defineProperty(window.navigator, key, { configurable: true, value })
  })
}

const setMatchMedia = (matches: boolean): void => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    addEventListener: jest.fn(),
    addListener: jest.fn(),
    dispatchEvent: jest.fn(),
    matches,
    media: query,
    onchange: null,
    removeEventListener: jest.fn(),
    removeListener: jest.fn(),
  }))
}

// Drives resolveState to the requested face via the mocked services + navigator, then
// renders the component and waits for the post-mount state to settle.
const renderState = async (
  state: InstallState,
  props: { defaultCollapsed?: boolean; dismissible?: boolean } = {},
): Promise<void> => {
  setMatchMedia(false)
  if (state === 'ios') {
    setNavigator(IPHONE)
  } else if (state === 'menu') {
    setNavigator(FIREFOX_ANDROID)
  } else {
    setNavigator(DESKTOP)
  }
  if (state === 'promptable') {
    jest.mocked(installPrompt.getDeferredPrompt).mockReturnValueOnce(fakeEvent)
  } else if (state === 'spent') {
    jest.mocked(installPrompt.wasPromptOffered).mockReturnValueOnce(true)
  }
  render(<InstallOffer surface="shell" {...props} />)
  await waitFor(() => expect(installPrompt.subscribe).toHaveBeenCalled())
}

describe('InstallOffer', () => {
  beforeAll(() => {
    jest.mocked(installPrompt.getDeferredPrompt).mockReturnValue(null)
    jest.mocked(installPrompt.wasPromptOffered).mockReturnValue(false)
    jest.mocked(installPrompt.isInstalled).mockReturnValue(false)
    jest.mocked(installPrompt.subscribe).mockReturnValue(() => undefined)
    jest.mocked(installPrompt.promptInstall).mockResolvedValue(true)
    jest.mocked(installDismissal.isInstallCollapsed).mockReturnValue(false)
  })

  describe('pure state helpers', () => {
    it('detects iPhone user agents and iPad-as-Mac, but not a plain Mac', () => {
      expect(isIosDevice(IPHONE.userAgent, 'iPhone', 5)).toBe(true)
      expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 5)).toBe(true)
      expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'MacIntel', 0)).toBe(false)
      expect(isIosDevice(DESKTOP.userAgent, 'Win32', 0)).toBe(false)
    })

    it('detects Firefox on Android only', () => {
      expect(isFirefoxAndroid(FIREFOX_ANDROID.userAgent)).toBe(true)
      expect(isFirefoxAndroid('Mozilla/5.0 (X11; Linux) Firefox/120.0')).toBe(false)
      expect(isFirefoxAndroid('Mozilla/5.0 (Android 13; Mobile) Chrome/120')).toBe(false)
    })

    it('detects Chromium browsers but not Firefox or plain Safari', () => {
      expect(isChromium(DESKTOP.userAgent)).toBe(true)
      expect(isChromium('Mozilla/5.0 (Windows NT 10.0) Edg/120.0')).toBe(true)
      expect(isChromium(FIREFOX_DESKTOP.userAgent)).toBe(false)
      expect(isChromium('Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/17.0 Safari/605')).toBe(false)
    })

    it('resolves iOS before Firefox-Android so a touch Mac with a Firefox/Android agent still gets iOS', () => {
      setMatchMedia(false)
      setNavigator({ maxTouchPoints: 5, platform: 'MacIntel', userAgent: 'Firefox/120.0 Android' })
      expect(resolveState()).toBe('ios')
    })

    it('reads standalone display mode and coarse pointer through matchMedia', () => {
      setMatchMedia(true)
      expect(isStandalone()).toBe(true)
      expect(isCoarsePointer()).toBe(true)
      setMatchMedia(false)
      expect(isCoarsePointer()).toBe(false)
    })

    it('reads iOS Safaris legacy navigator.standalone flag', () => {
      setMatchMedia(false)
      Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: true })
      expect(isStandalone()).toBe(true)
      Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: undefined })
    })

    it('phrases for a phone on iOS/menu, and follows the pointer otherwise', () => {
      setMatchMedia(false)
      expect(isPhoneLike('ios', false)).toBe(true)
      expect(isPhoneLike('menu', false)).toBe(true)
      expect(isPhoneLike('promptable', true)).toBe(true)
      expect(isPhoneLike('promptable', false)).toBe(false)
      expect(isPhoneLike('promptable')).toBe(false)
    })
  })

  describe('promptable', () => {
    it('renders an Install button whose click prompts the browser (AC-007)', async () => {
      await renderState('promptable')

      const button = await screen.findByRole('button', { name: 'Install' })
      await act(async () => {
        await userEvent.click(button)
      })

      expect(installPrompt.promptInstall).toHaveBeenCalled()
    })

    it('shows its own-window body copy', async () => {
      await renderState('promptable')

      expect(await screen.findByText('Its own window, its own icon — and you sign in once inside it.')).toBeVisible()
    })
  })

  describe('spent', () => {
    it('renders browser-menu steps and no Install button (AC-008)', async () => {
      await renderState('spent')

      expect(await screen.findByText('Install Email from your browser menu')).toBeVisible()
      expect(screen.getByText('Choose Install page as app')).toBeVisible()
      expect(screen.getByText('Reload the page and the Install button comes back.')).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
    })
  })

  describe('menu (Firefox Android)', () => {
    it('renders Firefox instructions and no Install button (AC-009)', async () => {
      await renderState('menu')

      const heading = await screen.findByText('Add Email to your home screen from the Firefox menu')
      expect(heading).toBeVisible()
      expect(screen.getByText('Firefox for Android installs from its menu.')).toBeVisible()
      expect(screen.getByText('Tap Install, then confirm with Add')).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
      BANNED.forEach((re) => expect(document.body.textContent).not.toMatch(re))
    })
  })

  describe('ios', () => {
    it('renders Share instructions and no Install button (AC-010)', async () => {
      await renderState('ios')

      expect(await screen.findByText('Add Email to your home screen')).toBeVisible()
      expect(screen.getByText('Tap Share in the toolbar')).toBeVisible()
      expect(
        screen.getByText("Safari adds Email to your home screen. Only Safari can — other iOS browsers can't."),
      ).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
      BANNED.forEach((re) => expect(document.body.textContent).not.toMatch(re))
    })
  })

  describe('hidden', () => {
    it('renders nothing once the app is installed (AC-011)', async () => {
      jest.mocked(installPrompt.isInstalled).mockReturnValueOnce(true)
      setMatchMedia(false)
      setNavigator(DESKTOP)

      render(<InstallOffer surface="shell" />)
      await waitFor(() => expect(installPrompt.subscribe).toHaveBeenCalled())

      expect(screen.queryByRole('region')).not.toBeInTheDocument()
    })

    it('renders nothing when the browser cannot install (AC-012)', async () => {
      setMatchMedia(false)
      setNavigator(FIREFOX_DESKTOP)

      render(<InstallOffer surface="paper" />)
      await waitFor(() => expect(installPrompt.subscribe).toHaveBeenCalled())

      expect(screen.queryByRole('region')).not.toBeInTheDocument()
    })
  })

  describe('chromium (no live prompt yet)', () => {
    it('points a Chromium browser at the address bar or menu, with no Install button', async () => {
      await renderState('chromium')

      expect(await screen.findByText('Install Email from your browser')).toBeVisible()
      expect(screen.getByText('Chrome and Edge install from the address bar or the browser menu.')).toBeVisible()
      expect(screen.getByText('Click the install icon at the right of the address bar')).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
      BANNED.forEach((re) => expect(document.body.textContent).not.toMatch(re))
    })
  })

  describe('disclosure', () => {
    it('toggles aria-expanded and reveals the concrete changes and reassurance', async () => {
      await renderState('promptable')

      const trigger = await screen.findByRole('button', { name: 'What changes when I install this?' })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await act(async () => {
        await userEvent.click(trigger)
      })

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('It opens in its own window')).toBeVisible()
      expect(screen.getByText('What stays the same')).toBeVisible()
      expect(screen.getByText('Nothing moves, and nothing is copied anywhere new.')).toBeVisible()
    })
  })

  describe('override', () => {
    it('reveals the other browsers instruction sets with no banned words', async () => {
      await renderState('spent')

      const trigger = await screen.findByRole('button', { name: 'Not your browser? Pick it here' })
      await act(async () => {
        await userEvent.click(trigger)
      })

      expect(screen.getByText('Chrome, Edge, or Brave')).toBeVisible()
      expect(screen.getByText('Firefox on Android')).toBeVisible()
      expect(screen.getByText('Safari on iPhone or iPad')).toBeVisible()
      BANNED.forEach((re) => expect(document.body.textContent).not.toMatch(re))
    })
  })

  describe('dismissible collapse (AC-013)', () => {
    it('shows only the one-line link when collapsed, and re-expands the same offer on click', async () => {
      jest.mocked(installDismissal.isInstallCollapsed).mockReturnValueOnce(true)
      await renderState('promptable', { dismissible: true })

      const link = await screen.findByRole('button', { name: 'Install this mailbox' })
      expect(link).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()

      await act(async () => {
        await userEvent.click(link)
      })

      expect(installDismissal.setInstallCollapsed).toHaveBeenCalledWith(false)
      expect(await screen.findByRole('heading', { name: 'Install this mailbox' })).toBeVisible()
      expect(screen.getByRole('button', { name: 'Install' })).toBeVisible()
    })

    it('collapses to the link when the dismiss control is pressed', async () => {
      await renderState('promptable', { dismissible: true })

      const dismiss = await screen.findByRole('button', { name: 'Collapse this offer to a one-line link' })
      await act(async () => {
        await userEvent.click(dismiss)
      })

      expect(installDismissal.setInstallCollapsed).toHaveBeenCalledWith(true)
      expect(screen.getByRole('button', { name: 'Install this mailbox' })).toBeVisible()
    })

    it('starts collapsed to the link when defaultCollapsed is set and nothing is stored', async () => {
      jest.mocked(installDismissal.isInstallCollapsed).mockImplementationOnce((fallback = false) => fallback)
      await renderState('promptable', { defaultCollapsed: true, dismissible: true })

      expect(await screen.findByRole('button', { name: 'Install this mailbox' })).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
    })
  })

  describe('accessibility (AC-028)', () => {
    it('labels the region with its heading and names every control', async () => {
      await renderState('promptable', { dismissible: true })

      expect(await screen.findByRole('region', { name: 'Install this mailbox' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'What changes when I install this?' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Collapse this offer to a one-line link' })).toBeInTheDocument()
    })

    it('renders no banned words in the promptable state with the changes open', async () => {
      await renderState('promptable')

      const trigger = await screen.findByRole('button', { name: 'What changes when I install this?' })
      await act(async () => {
        await userEvent.click(trigger)
      })

      BANNED.forEach((re) => expect(document.body.textContent).not.toMatch(re))
    })
  })
})
