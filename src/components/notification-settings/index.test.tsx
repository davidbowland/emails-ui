import React from 'react'

import NotificationSettings from './index'
import * as push from '@services/push'
import { accountId } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationPreview } from '@types'

jest.mock('@services/push')

describe('NotificationSettings', () => {
  const setPreview = jest.fn()

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

  const setNavigator = (props: { maxTouchPoints: number; platform: string; userAgent: string }): void => {
    Object.entries(props).forEach(([key, value]) => {
      Object.defineProperty(window.navigator, key, { configurable: true, value })
    })
  }

  const renderSettings = async (preview: NotificationPreview = 'sender-and-subject'): Promise<void> => {
    render(<NotificationSettings accountId={accountId} disabled={false} preview={preview} setPreview={setPreview} />)
    await waitFor(() => expect(push.isSubscribedToPush).toHaveBeenCalled())
  }

  beforeAll(() => {
    jest.mocked(push.isSubscribedToPush).mockResolvedValue(false)
    jest.mocked(push.subscribeToPush).mockResolvedValue('subscribed')
    jest.mocked(push.unsubscribeFromPush).mockResolvedValue('unsubscribed')
  })

  describe('turning notifications on', () => {
    it('offers to turn them on when they are off', async () => {
      setNavigator(DESKTOP)
      await renderSettings()

      expect(await screen.findByRole('button', { name: 'Turn on notifications' })).toBeVisible()
    })

    it('subscribes this browser for this account', async () => {
      setNavigator(DESKTOP)
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(push.subscribeToPush).toHaveBeenCalledWith(accountId)
    })

    it('confirms once notifications are on', async () => {
      setNavigator(DESKTOP)
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(await screen.findByText('Notifications are on.')).toBeVisible()
      expect(await screen.findByRole('button', { name: 'Turn off notifications' })).toBeVisible()
    })

    it('sends a blocked reader to their browser settings', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.subscribeToPush).mockResolvedValueOnce('denied')
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(
        await screen.findByText(
          'Your browser is blocking notifications. Turn them on in your browser settings, then try again.',
        ),
      ).toBeVisible()
    })

    it('asks a reader who closed the prompt to choose Allow', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.subscribeToPush).mockResolvedValueOnce('dismissed')
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(await screen.findByText('Notifications are still off. Choose Allow when your browser asks.')).toBeVisible()
    })

    it('asks for a reload when the worker is not running yet', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.subscribeToPush).mockResolvedValueOnce('unready')
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(
        await screen.findByText(
          "Emails isn't running in the background yet, so notifications can't start. Reload the page and try again.",
        ),
      ).toBeVisible()
    })

    it('points an iPhone reader at the Home Screen', async () => {
      setNavigator(IPHONE)
      jest.mocked(push.subscribeToPush).mockResolvedValueOnce('unsupported')
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(
        await screen.findByText(
          "This browser can't turn on notifications. Add Emails to your Home Screen from the Share menu, then turn them on from there.",
        ),
      ).toBeVisible()
    })

    it('reassures every other unsupported browser', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.subscribeToPush).mockResolvedValueOnce('unsupported')
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(
        await screen.findByText(
          "This browser can't turn on notifications. You'll still see new mail when you open Emails.",
        ),
      ).toBeVisible()
    })

    it('offers another go after a failure', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.subscribeToPush).mockResolvedValueOnce('failed')
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn on notifications' }))

      expect(await screen.findByText("We couldn't turn on notifications. Please try again.")).toBeVisible()
      expect(await screen.findByRole('button', { name: 'Try again' })).toBeVisible()
    })
  })

  describe('turning notifications off', () => {
    it('offers to turn them off when they are on', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.isSubscribedToPush).mockResolvedValueOnce(true)
      await renderSettings()

      expect(await screen.findByRole('button', { name: 'Turn off notifications' })).toBeVisible()
    })

    it('unsubscribes this browser', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.isSubscribedToPush).mockResolvedValueOnce(true)
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn off notifications' }))

      expect(push.unsubscribeFromPush).toHaveBeenCalledWith(accountId)
      expect(await screen.findByRole('button', { name: 'Turn on notifications' })).toBeVisible()
    })

    it('says so when it cannot turn them off', async () => {
      setNavigator(DESKTOP)
      jest.mocked(push.isSubscribedToPush).mockResolvedValueOnce(true)
      jest.mocked(push.unsubscribeFromPush).mockResolvedValueOnce('failed')
      await renderSettings()

      await userEvent.click(await screen.findByRole('button', { name: 'Turn off notifications' }))

      expect(await screen.findByText("We couldn't turn notifications off. Please try again.")).toBeVisible()
    })
  })

  describe('what notifications show', () => {
    it('groups the choices under a legend', async () => {
      setNavigator(DESKTOP)
      await renderSettings()

      expect(await screen.findByRole('group', { name: 'What notifications show' })).toBeVisible()
    })

    it('warns that a locked screen shows this', async () => {
      setNavigator(DESKTOP)
      await renderSettings()

      expect(await screen.findByText('Anyone holding your phone can read this before you unlock it.')).toBeVisible()
    })

    it('checks the level the account is set to', async () => {
      setNavigator(DESKTOP)
      await renderSettings('sender-only')

      expect(await screen.findByRole('radio', { name: 'Sender only' })).toBeChecked()
    })

    it('reports a new choice to its owner', async () => {
      setNavigator(DESKTOP)
      await renderSettings('sender-and-subject')

      await userEvent.click(await screen.findByRole('radio', { name: 'Neither' }))

      expect(setPreview).toHaveBeenCalledWith('none')
    })

    it('shows what the chosen level draws', async () => {
      setNavigator(DESKTOP)
      await renderSettings('none')

      expect(await screen.findByText('Example — Neither')).toBeVisible()
    })
  })
})
