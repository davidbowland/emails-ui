import { getCurrentUser } from 'aws-amplify/auth'
import React from 'react'

import AccountSettings from './index'
import { changedSections, commitDrafts, draftLine, EMPTY_DRAFTS, ENTRY_NOUN, joinSections } from './save-state'
import AddressLine from '@components/address-line'
import BounceSenderInput from '@components/bounce-sender-input'
import { LeaveGuardProvider, useLeaveGuard } from '@components/leave-guard'
import * as emails from '@services/emails'
import { account, spamImpactIncomplete, spamImpactResponse, user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Account, DEFAULT_SPAM_FILTER, SpamFilter, SpamImpactResponse } from '@types'

jest.mock('aws-amplify/auth')
// Partial mocks: the components are stubbed, but the validators that save-state uses stay real.
jest.mock('@components/address-line', () => ({
  ...jest.requireActual('@components/address-line'),
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@components/bounce-sender-input', () => ({
  ...jest.requireActual('@components/bounce-sender-input'),
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@components/ui/snackbar', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return ({ message, onClose }: any) =>
    message
      ? React.createElement(
          'div',
          { role: 'alert' },
          message,
          React.createElement('button', { 'aria-label': 'Close', onClick: onClose }, '✕'),
        )
      : null
})
jest.mock('@components/notification-settings', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return ({ onPreviewChange, preview, readOnly }: any) =>
    React.createElement(
      'div',
      null,
      `NotificationSettingsMounted:${preview}${readOnly ? ':read-only' : ''}`,
      React.createElement('button', { onClick: () => onPreviewChange('none') }, 'Choose neither'),
      React.createElement('button', { onClick: () => onPreviewChange('sender-only') }, 'Choose sender only'),
    )
})
jest.mock('@components/install-offer', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return () => React.createElement('div', null, 'InstallOfferMounted')
})
jest.mock('@components/spam-filter-settings', () => {
  const React = require('react')
  const box = (key: string, label: string, { drafts, inputRef, onDraftChange, readOnly }: any) =>
    React.createElement('input', {
      'aria-label': label,
      onChange: (event: any) => onDraftChange(key, event.target.value),
      readOnly,
      ref: (element: HTMLInputElement | null) => inputRef(key, element),
      value: drafts[key],
    })
  const MockSpamFilterSettings = (props: any) => {
    const { changed, errors, onChange, onErrorChange, value } = props
    return React.createElement(
      'section',
      { 'aria-labelledby': 'mock-spam-heading' },
      React.createElement('h2', { id: 'mock-spam-heading', tabIndex: -1 }, 'Spam filter'),
      `SpamFilterSettingsMounted:${value.sensitivity}:${value.blockPhrases.join('|')}${changed ? ':changed' : ''}`,
      box('blockPhrases', 'Block phrases', props),
      box('trustedSenders', 'Trusted senders', props),
      React.createElement('p', null, errors.blockPhrases),
      React.createElement(
        'button',
        { onClick: () => onChange({ ...value, blockPhrases: [...value.blockPhrases, 'invoice'] }) },
        'Add invoice phrase',
      ),
      React.createElement(
        'button',
        { onClick: () => onChange({ ...value, blockPhrases: ['free lunch', 'lottery winner'] }) },
        'Add two phrases',
      ),
      React.createElement(
        'button',
        { onClick: () => onChange({ ...value, trustedSenders: [...value.trustedSenders, '@friend.example'] }) },
        'Add a trusted sender',
      ),
      React.createElement('button', { onClick: () => onChange({ ...value, sensitivity: 'high' }) }, 'Choose high'),
      React.createElement(
        'button',
        { onClick: () => onErrorChange('blockPhrases', 'That phrase is refused.') },
        'Refuse a phrase',
      ),
      React.createElement(
        'button',
        {
          onClick: () => {
            onErrorChange('blockPhrases', undefined)
            onChange({ ...value, blockPhrases: value.blockPhrases.slice(1) })
          },
        },
        'Remove the first phrase',
      ),
    )
  }
  return {
    ...jest.requireActual('@components/spam-filter-settings'),
    __esModule: true,
    default: MockSpamFilterSettings,
  }
})
jest.mock('@config/amplify')
jest.mock('@services/emails')

describe('AccountSettings component', () => {
  // 3:42 PM on the local clock, wherever the tests run. The expected text uses the page's own
  // formatter, so the locale the tests run under doesn't matter.
  const SAVED_AT = new Date(2026, 10, 11, 15, 42).getTime()
  const savedAtText = `Saved at ${new Date(SAVED_AT).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`

  const withInvoice: SpamFilter = { ...DEFAULT_SPAM_FILTER, blockPhrases: ['invoice'] }

  // One new phrase, 'invoice', that matches nothing in either folder and was checked completely.
  const noMatches: SpamImpactResponse = { ...spamImpactIncomplete, inboxIncomplete: false }
  const inboxMatch: SpamImpactResponse = { ...spamImpactResponse, phrases: [spamImpactResponse.phrases[0]] }
  const spamOnly: SpamImpactResponse = {
    ...inboxMatch,
    phrases: [{ ...inboxMatch.phrases[0], inbox: { count: 0, emails: [] } }],
  }

  const checkingLead = 'Before your new phrase takes effect, we check it against the mail you already have.'

  const findBar = (): Promise<HTMLElement> => screen.findByRole('region', { name: 'Your changes' })
  const queryBar = (): HTMLElement | null => screen.queryByRole('region', { name: 'Your changes' })

  const pressSave = async (): Promise<void> =>
    userEvent.click(within(await findBar()).getByRole('button', { name: 'Save' }))

  // Every status region's text, including the page's own announcements.
  const statusTexts = (): (string | null)[] => screen.getAllByRole('status').map((region) => region.textContent)

  const findImpactDialog = (): Promise<HTMLElement> =>
    screen.findByRole('dialog', { name: 'Check your new block phrases' })

  // The dialog once the check has answered.
  const findImpactResult = async (): Promise<HTMLElement> => {
    const dialog = await findImpactDialog()
    await waitFor(() => expect(within(dialog).queryByText(checkingLead)).not.toBeInTheDocument())
    return dialog
  }

  // Adds the phrase 'invoice' and presses Save.
  const saveNewPhrase = async (): Promise<void> => {
    render(<AccountSettings />)
    await userEvent.click(await screen.findByText('Add invoice phrase'))
    await pressSave()
  }

  // Adds two phrases at once and presses Save.
  const saveTwoNewPhrases = async (): Promise<void> => {
    render(<AccountSettings />)
    await userEvent.click(await screen.findByText('Add two phrases'))
    await pressSave()
  }

  // Replaces the display name the way a reader would.
  const renameTo = async (name: string): Promise<void> => {
    const input = await screen.findByLabelText(/From name/i)
    await userEvent.clear(input)
    await userEvent.type(input, name)
  }

  const stubBounceSenderInput: typeof BounceSenderInput = ({
    draft,
    inputRef,
    label,
    onDraftChange,
    onInvalid,
    readOnly,
    rules,
    setRules,
  }) => (
    <div>
      <input
        aria-label={label}
        onChange={(event) => onDraftChange?.(event.target.value)}
        readOnly={readOnly}
        ref={inputRef}
        value={draft ?? ''}
      />
      <span>{`Bounce rules:${rules.join('|')}`}</span>
      <button onClick={() => setRules?.([...rules, '@added.example'])}>Add a bounce rule</button>
      <button onClick={() => setRules?.(rules.slice(1))}>Remove the first bounce rule</button>
      <button onClick={() => onInvalid?.(draft ?? '')}>Refuse the typed rule</button>
    </div>
  )

  const phone = { addEventListener: jest.fn(), matches: true, removeEventListener: jest.fn() }
  const desktop = { addEventListener: jest.fn(), matches: false, removeEventListener: jest.fn() }
  const originalMatchMedia = window.matchMedia

  beforeAll(() => {
    jest.mocked(getCurrentUser).mockResolvedValue(user)
    jest
      .mocked(AddressLine)
      .mockImplementation(
        ({ addresses, draft, inputRef, label, onDraftChange, onInvalid, readOnly, setAddresses, validate }) => (
          <div>
            <input
              aria-label={label}
              onChange={(event) => onDraftChange?.(event.target.value)}
              readOnly={readOnly}
              ref={inputRef}
              value={draft ?? ''}
            />
            <span>{`Forwarding:${addresses.map((address) => address.address).join('|')}`}</span>
            <button onClick={() => setAddresses?.([...addresses, { address: 'new@example.com', name: '' }])}>
              Add a forwarding address
            </button>
            <button onClick={() => (validate?.(draft ?? '') ? undefined : onInvalid?.(draft ?? ''))}>
              Add the typed address
            </button>
          </div>
        ),
      )
    jest.mocked(BounceSenderInput).mockImplementation(stubBounceSenderInput)
    jest.mocked(emails).getAccount.mockResolvedValue(account)
    jest.mocked(emails).postSpamImpact.mockResolvedValue(noMatches)
    jest.mocked(emails).putAccount.mockResolvedValue(account)
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn().mockReturnValue(desktop) })

    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
  })

  afterAll(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
  })

  describe('loading', () => {
    it('expect a loading status until the account arrives', async () => {
      jest.mocked(emails).getAccount.mockReturnValueOnce(new Promise(() => undefined))
      render(<AccountSettings />)

      await waitFor(() => expect(emails.getAccount).toHaveBeenCalled())

      expect(screen.getByText('Loading…')).toBeInTheDocument()
      expect(screen.queryByLabelText(/From name/i)).not.toBeInTheDocument()
      expect(queryBar()).not.toBeInTheDocument()
    })

    it('expect error message when user not logged in', async () => {
      jest.mocked(getCurrentUser).mockRejectedValueOnce(undefined)
      render(<AccountSettings />)

      expect(await screen.findByText(/We couldn't sign you in. Reload the page to try again./i)).toBeVisible()
    })

    it('expect closing snackbar removes error', async () => {
      jest.mocked(getCurrentUser).mockRejectedValueOnce(undefined)
      render(<AccountSettings />)

      await screen.findByText(/We couldn't sign you in. Reload the page to try again./i)
      await userEvent.click(await screen.findByLabelText(/Close/i, { selector: 'button' }))

      expect(screen.queryByText(/We couldn't sign you in. Reload the page to try again./i)).not.toBeInTheDocument()
    })

    it('expect error message when getAccount rejects', async () => {
      jest.mocked(emails).getAccount.mockRejectedValueOnce(undefined)
      render(<AccountSettings />)

      expect(await screen.findByText(/Couldn't load your settings. Reload the page to try again./i)).toBeVisible()
    })

    it('expect the page titled in sentence case, with the sections named as the bar names them', async () => {
      render(<AccountSettings />)

      expect(await screen.findByRole('heading', { level: 1, name: 'Account settings' })).toBeVisible()
      expect(screen.getByRole('heading', { name: 'Display name' })).toBeVisible()
      expect(screen.getByRole('heading', { name: 'Forwarding' })).toBeVisible()
      expect(screen.getByRole('heading', { name: 'Bounce rules' })).toBeVisible()
      expect(screen.queryByText('Forward emails to')).not.toBeInTheDocument()
    })

    it('expect no bar, no foot Save and no Saved line before anything is edited', async () => {
      render(<AccountSettings />)

      await screen.findByLabelText(/From name/i)

      expect(queryBar()).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Saved at/)).not.toBeInTheDocument()
      expect(
        screen.queryByText('Notifications save as soon as you change them. Everything else waits for Save.'),
      ).not.toBeInTheDocument()
    })

    it('expect the install offer mounted', async () => {
      render(<AccountSettings />)

      expect(await screen.findByText('InstallOfferMounted')).toBeInTheDocument()
    })

    it('expect bounce senders BounceSenderInput rendered with its pending-entry props', async () => {
      render(<AccountSettings />)

      await screen.findByRole('heading', { level: 1, name: 'Account settings' })
      expect(BounceSenderInput).toHaveBeenCalledWith(
        expect.objectContaining({
          addLabel: 'Add bounce rule',
          addOnBlur: false,
          label: 'Reject emails from:',
          rules: ['spam@domain.com'],
          savedEntries: ['spam@domain.com'],
        }),
        undefined,
      )
      expect(AddressLine).toHaveBeenCalledWith(
        expect.objectContaining({
          addLabel: 'Add forwarding address',
          addOnBlur: false,
          savedEntries: ['any@domain.com'],
        }),
        undefined,
      )
      expect(
        screen.getByText(
          /Block senders by address \(user@domain\.com\), domain \(@domain\.com\), or enter \* to block everyone\./i,
        ),
      ).toBeVisible()
    })
  })

  describe('the bar', () => {
    it('bar appears with "Not saved yet: Display name" after editing the name', async () => {
      render(<AccountSettings />)

      await renameTo('George')

      const bar = await findBar()
      expect(bar).toHaveTextContent('Not saved yet: Display name')
      expect(within(bar).getByRole('button', { name: 'Discard' })).toBeVisible()
      expect(within(bar).getByRole('button', { name: 'Save' })).toBeVisible()
      expect(screen.getByText('Not saved yet')).toBeVisible()
    })

    it('bar appears while typing in a box, before leaving it', async () => {
      render(<AccountSettings />)

      const box = await screen.findByLabelText('Reject emails from:')
      await userEvent.type(box, '@spam')

      const bar = await findBar()
      expect(bar).toHaveTextContent('Not saved yet: Bounce rules')
      expect(within(bar).getByText("1 entry isn't added yet. Save adds it first.")).toBeVisible()
      expect(box).toHaveFocus()
    })

    it('expect the draft line to count every box with text', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Reject emails from:'), '@spam.example')
      await userEvent.type(screen.getByLabelText('Trusted senders'), '@friend.example')

      expect(within(await findBar()).getByText("2 entries aren't added yet. Save adds them first.")).toBeVisible()
      expect(await findBar()).toHaveTextContent('Not saved yet: Bounce rules and Spam filter')
    })

    it('expect three sections listed with commas', async () => {
      render(<AccountSettings />)

      await renameTo('George')
      await userEvent.click(screen.getByText('Add a forwarding address'))
      await userEvent.click(screen.getByText('Choose high'))

      expect(await findBar()).toHaveTextContent('Not saved yet: Display name, Forwarding, and Spam filter')
    })

    it('section buttons in the bar focus their heading', async () => {
      render(<AccountSettings />)

      await renameTo('George')
      await userEvent.click(screen.getByText('Choose high'))
      const bar = await findBar()
      await userEvent.click(within(bar).getByRole('button', { name: 'Display name' }))

      expect(screen.getByRole('heading', { name: 'Display name' })).toHaveFocus()

      await userEvent.click(within(bar).getByRole('button', { name: 'Spam filter' }))

      expect(screen.getByRole('heading', { name: 'Spam filter' })).toHaveFocus()
    })

    it('expect adding and removing a chip announced', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Add a bounce rule'))

      expect(statusTexts()).toContain('Added “@added.example”. Not saved yet.')

      await userEvent.click(screen.getByText('Remove the first bounce rule'))

      expect(statusTexts()).toContain('Removed “spam@domain.com”. Not saved yet.')
    })

    it('expect a new forwarding address and trusted sender announced', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Add a forwarding address'))

      expect(statusTexts()).toContain('Added “new@example.com”. Not saved yet.')

      await userEvent.click(screen.getByText('Add a trusted sender'))

      expect(statusTexts()).toContain('Added “@friend.example”. Not saved yet.')
    })

    it('expect undoing every edit by hand to remove the bar and say so', async () => {
      render(<AccountSettings />)

      const input = await screen.findByLabelText(/From name/i)
      await userEvent.type(input, 'x')
      await findBar()
      await userEvent.type(input, '{Backspace}')

      expect(queryBar()).not.toBeInTheDocument()
      expect(statusTexts()).toContain('You have no changes to save.')
    })

    it('expect undoing every edit by hand a second time said again', async () => {
      render(<AccountSettings />)

      const input = await screen.findByLabelText(/From name/i)
      await userEvent.type(input, 'x')
      await userEvent.type(input, '{Backspace}')
      await userEvent.type(input, 'x')

      expect(statusTexts()).not.toContain('You have no changes to save.')

      await userEvent.type(input, '{Backspace}')

      expect(statusTexts()).toContain('You have no changes to save.')
    })

    it('expect clearing a typed entry a second time said again', async () => {
      render(<AccountSettings />)

      const box = await screen.findByLabelText('Reject emails from:')
      await userEvent.type(box, 'x')
      await userEvent.type(box, '{Backspace}')
      await userEvent.type(box, 'x')

      expect(statusTexts()).not.toContain('You have no changes to save.')

      await userEvent.type(box, '{Backspace}')

      expect(statusTexts()).toContain('You have no changes to save.')
    })

    it('expect a refused entry shown under its box, and cleared when its text changes', async () => {
      render(<AccountSettings />)

      const box = await screen.findByLabelText('To:')
      await userEvent.type(box, 'nope')
      await userEvent.click(screen.getByText('Add the typed address'))

      expect(screen.getByText('Enter an email address, like name@example.com.')).toBeVisible()

      await userEvent.type(box, 'd')

      expect(screen.queryByText('Enter an email address, like name@example.com.')).not.toBeInTheDocument()
    })

    it('expect a repeated bounce rule refused with the repeat message', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Reject emails from:'), 'spam@domain.com')
      await userEvent.click(screen.getByText('Refuse the typed rule'))

      expect(screen.getByText('“spam@domain.com” is already on your list.')).toBeVisible()
    })

    it('expect a refusal from the spam filter shown in its section', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Refuse a phrase'))

      expect(screen.getByText('That phrase is refused.')).toBeVisible()
    })

    it('phone with a field focused renders the compact bar', async () => {
      jest.mocked(window.matchMedia).mockReturnValueOnce(phone as unknown as MediaQueryList)
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText(/From name/i), ' Jr')

      const bar = await findBar()
      expect(within(bar).queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument()
      expect(within(bar).getByRole('button', { name: 'Save' })).toBeVisible()
      expect(bar).toHaveTextContent('Not saved yet: Display name')
    })

    it('expect the phone bar to keep its full layout while no field has focus', async () => {
      jest.mocked(window.matchMedia).mockReturnValueOnce(phone as unknown as MediaQueryList)
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))

      expect(within(await findBar()).getByRole('button', { name: 'Discard' })).toBeVisible()
    })

    it('expect the compact bar to keep Save in place when a tap moves focus to it', async () => {
      jest.mocked(window.matchMedia).mockReturnValueOnce(phone as unknown as MediaQueryList)
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise(() => undefined))
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText(/From name/i), ' Jr')
      await pressSave()

      const bar = await findBar()
      expect(within(bar).queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument()
      expect(emails.putAccount).toHaveBeenCalledTimes(1)
      expect(screen.getByLabelText(/From name/i)).toHaveFocus()
    })

    it('expect the phone strip to open out once focus leaves the bar for somewhere else', async () => {
      jest.mocked(window.matchMedia).mockReturnValueOnce(phone as unknown as MediaQueryList)
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText(/From name/i), ' Jr')
      const save = within(await findBar()).getByRole('button', { name: 'Save' })
      act(() => save.focus())

      expect(within(await findBar()).queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument()

      await userEvent.tab()

      expect(within(await findBar()).getByRole('button', { name: 'Discard' })).toBeVisible()
    })

    it('expect the phone bar to show the failure in full after Save from the strip', async () => {
      jest.mocked(window.matchMedia).mockReturnValueOnce(phone as unknown as MediaQueryList)
      jest.mocked(emails).putAccount.mockRejectedValueOnce(new Error('offline'))
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText(/From name/i), ' Jr')
      await pressSave()

      const bar = await findBar()
      expect(
        await within(bar).findByText(
          'Your changes to Display name are still here. Check your connection, then try again.',
        ),
      ).toBeVisible()
      expect(within(bar).getByRole('button', { name: 'Discard' })).toBeVisible()
      expect(within(bar).getByRole('button', { name: 'Try again' })).toBeVisible()
    })
  })

  describe('saving', () => {
    it('expect the whole updated account passed to putAccount', async () => {
      render(<AccountSettings />)

      await renameTo('George')
      await pressSave()

      expect(emails.putAccount).toHaveBeenCalledWith(user.username, {
        bounceSenders: account.bounceSenders,
        forwardTargets: account.forwardTargets,
        id: user.username,
        name: 'George',
        notificationPreview: 'sender-and-subject',
        spamFilter: DEFAULT_SPAM_FILTER,
      })
    })

    it('saves text still typed in a box', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Reject emails from:'), '@spam.example')
      await pressSave()

      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ bounceSenders: ['spam@domain.com', '@spam.example'] }),
      )
      expect(await screen.findByText('Bounce rules:spam@domain.com|@spam.example')).toBeInTheDocument()
      expect(screen.getByLabelText('Reject emails from:')).toHaveValue('')
    })

    it('refused draft blocks the save and focuses its box', async () => {
      render(<AccountSettings />)

      const box = await screen.findByLabelText('Reject emails from:')
      await userEvent.type(box, 'nope')
      await userEvent.click(screen.getByText('Choose high'))
      await pressSave()

      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(within(await findBar()).getByText('Fix or clear the bounce rule you typed, then save.')).toBeVisible()
      expect(
        screen.getByText('Enter an address (user@domain.com), a domain (@domain.com), or * to block everyone.'),
      ).toBeVisible()
      expect(box).toHaveFocus()
    })

    it('expect several refused boxes named together, with the first focused', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('To:'), 'nope')
      await userEvent.type(screen.getByLabelText('Trusted senders'), '*')
      await pressSave()

      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(within(await findBar()).getByText('Fix or clear the entries you typed, then save.')).toBeVisible()
      expect(screen.getByLabelText('To:')).toHaveFocus()
    })

    it('expect the refusal note gone once the refused text is fixed', async () => {
      render(<AccountSettings />)

      const box = await screen.findByLabelText('Reject emails from:')
      await userEvent.type(box, 'nope')
      await pressSave()
      await userEvent.type(box, '.example')

      expect(screen.queryByText('Fix or clear the bounce rule you typed, then save.')).not.toBeInTheDocument()
    })

    it('expect the refusal note to stay gone when a phrase is removed after the fix', async () => {
      render(<AccountSettings />)

      const box = await screen.findByLabelText('Reject emails from:')
      await userEvent.type(box, 'nope')
      await pressSave()
      await userEvent.type(box, '.example')
      await userEvent.click(screen.getByText('Remove the first phrase'))

      expect(await findBar()).toHaveTextContent('Not saved yet: Bounce rules')
      expect(screen.queryByText('Fix or clear the bounce rule you typed, then save.')).not.toBeInTheDocument()
    })

    it('expect the refusal note cleared by an edit elsewhere, even with the box still refused', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Reject emails from:'), 'nope')
      await pressSave()
      await userEvent.click(screen.getByText('Choose high'))

      expect(screen.queryByText('Fix or clear the bounce rule you typed, then save.')).not.toBeInTheDocument()
      expect(
        screen.getByText('Enter an address (user@domain.com), a domain (@domain.com), or * to block everyone.'),
      ).toBeVisible()
    })

    it('expect a draft that repeats a listed entry cleared, with nothing saved', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Reject emails from:'), 'SPAM@domain.com')
      await pressSave()

      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(screen.getByLabelText('Reject emails from:')).toHaveValue('')
      expect(queryBar()).not.toBeInTheDocument()
      expect(statusTexts()).toContain('You have no changes to save.')
    })

    it('expect every field read-only while saving, Notifications included', async () => {
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise(() => undefined))
      render(<AccountSettings />)

      await renameTo('George')
      await pressSave()

      expect(await within(await findBar()).findByRole('button', { name: 'Saving…' })).toBeVisible()
      await userEvent.type(screen.getByLabelText(/From name/i), 'x')
      expect(screen.getByLabelText(/From name/i)).toHaveValue('George')
      expect(screen.getByText('NotificationSettingsMounted:sender-and-subject:read-only')).toBeInTheDocument()
      expect(AddressLine).toHaveBeenLastCalledWith(expect.objectContaining({ readOnly: true }), undefined)
      expect(BounceSenderInput).toHaveBeenLastCalledWith(expect.objectContaining({ readOnly: true }), undefined)
    })

    it('Discard while saving explains "Wait until Save finishes."', async () => {
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise(() => undefined))
      render(<AccountSettings />)

      await renameTo('George')
      await pressSave()
      const bar = await findBar()
      await userEvent.click(within(bar).getByRole('button', { name: 'Discard' }))

      expect(within(bar).getByRole('status')).toHaveTextContent('Wait until Save finishes.')
      expect(screen.getByLabelText(/From name/i)).toHaveValue('George')
    })

    it('failure keeps every edit and offers Try again', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(new Error('offline'))
      render(<AccountSettings />)

      await renameTo('George')
      await userEvent.click(screen.getByText('Choose high'))
      await pressSave()

      const bar = await findBar()
      expect(await within(bar).findByText("We couldn't save your changes.")).toBeVisible()
      expect(
        within(bar).getByText(
          'Your changes to Display name and Spam filter are still here. Check your connection, then try again.',
        ),
      ).toBeVisible()
      expect(screen.getByLabelText(/From name/i)).toHaveValue('George')
      expect(screen.getByText('SpamFilterSettingsMounted:high::changed')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(statusTexts()).toContain("We couldn't save your changes. They're still here, so you can try again.")
      expect(bar.contains(document.activeElement)).toBe(true)

      await userEvent.click(within(bar).getByRole('button', { name: 'Try again' }))

      expect(emails.putAccount).toHaveBeenCalledTimes(2)
      expect(await within(await findBar()).findByText('Saved: Display name and Spam filter')).toBeVisible()
    })

    it('expect a failed save left with nothing to retry to go back to clean', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(new Error('offline'))
      render(<AccountSettings />)

      const input = await screen.findByLabelText(/From name/i)
      await userEvent.type(input, 'x')
      await pressSave()
      await within(await findBar()).findByText("We couldn't save your changes.")
      await userEvent.type(input, '{Backspace}')

      expect(queryBar()).not.toBeInTheDocument()
    })

    it('expect an edit after a save to bring the dirty bar back', async () => {
      render(<AccountSettings />)

      await renameTo('George')
      await pressSave()
      await within(await findBar()).findByText('Saved: Display name')
      await userEvent.type(screen.getByLabelText(/From name/i), 'tte')

      expect(await findBar()).toHaveTextContent('Not saved yet: Display name')
    })

    it('Discard restores saved values and Undo brings the edits back', async () => {
      render(<AccountSettings />)

      await renameTo('George')
      await userEvent.type(screen.getByLabelText('Reject emails from:'), '@spam.example')
      await userEvent.click(within(await findBar()).getByRole('button', { name: 'Discard' }))

      const bar = await findBar()
      expect(bar).toHaveTextContent('Discarded: Display name and Bounce rules')
      expect(screen.getByLabelText(/From name/i)).toHaveValue('Dave')
      expect(screen.getByLabelText('Reject emails from:')).toHaveValue('')
      expect(statusTexts()).toContain('Discarded your changes. You can undo this for 8 seconds.')
      expect(within(bar).getByRole('button', { name: 'Undo' })).toHaveFocus()

      await userEvent.click(within(bar).getByRole('button', { name: 'Undo' }))

      expect(screen.getByLabelText(/From name/i)).toHaveValue('George')
      expect(screen.getByLabelText('Reject emails from:')).toHaveValue('@spam.example')
      expect(statusTexts()).toContain('Your changes are back.')
      expect(within(await findBar()).getByRole('button', { name: 'Save' })).toHaveFocus()
    })

    it('expect an edit after Discard to drop the Undo offer', async () => {
      render(<AccountSettings />)

      await renameTo('George')
      await userEvent.click(within(await findBar()).getByRole('button', { name: 'Discard' }))
      await userEvent.click(screen.getByText('Choose high'))

      const bar = await findBar()
      expect(within(bar).queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
      expect(bar).toHaveTextContent('Not saved yet: Spam filter')
    })

    it('Cmd+S saves; Ctrl+S saves; neither does anything while the dialog is open', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)
      render(<AccountSettings />)

      await renameTo('George')
      await userEvent.keyboard('{Meta>}s{/Meta}')

      expect(emails.putAccount).toHaveBeenCalledTimes(1)
      await within(await findBar()).findByText('Saved: Display name')

      await userEvent.type(screen.getByLabelText(/From name/i), 'tte')
      await userEvent.keyboard('{Control>}s{/Control}')

      expect(emails.putAccount).toHaveBeenCalledTimes(2)
      await within(await findBar()).findByText('Saved: Display name')

      await userEvent.click(screen.getByText('Add invoice phrase'))
      await userEvent.keyboard('{Control>}s{/Control}')
      await findImpactResult()
      await userEvent.keyboard('{Meta>}s{/Meta}')
      await userEvent.keyboard('{Control>}s{/Control}')

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.putAccount).toHaveBeenCalledTimes(2)
    })

    it('expect Cmd+S to do nothing with nothing to save', async () => {
      render(<AccountSettings />)

      await screen.findByLabelText(/From name/i)
      await userEvent.keyboard('{Meta>}s{/Meta}')

      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('leaving with unsaved changes registers the leave guard', async () => {
      const proceed = jest.fn()
      const Leaver = (): React.ReactNode => {
        const { requestLeave } = useLeaveGuard()
        return <button onClick={() => requestLeave(proceed)}>Leave</button>
      }
      render(
        <LeaveGuardProvider>
          <AccountSettings />
          <Leaver />
        </LeaveGuardProvider>,
      )

      await userEvent.click(await screen.findByText('Add a forwarding address'))
      await userEvent.click(screen.getByText('Choose high'))
      await userEvent.click(screen.getByText('Leave'))

      const dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' })
      expect(
        within(dialog).getByText("If you leave now, you'll lose your changes to Forwarding and Spam filter."),
      ).toBeVisible()

      await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }))

      expect(proceed).not.toHaveBeenCalled()
      expect(within(await findBar()).getByRole('button', { name: 'Save' })).toHaveFocus()
    })

    it('expect leaving with nothing unsaved to proceed at once', async () => {
      const proceed = jest.fn()
      const Leaver = (): React.ReactNode => {
        const { requestLeave } = useLeaveGuard()
        return <button onClick={() => requestLeave(proceed)}>Leave</button>
      }
      render(
        <LeaveGuardProvider>
          <AccountSettings />
          <Leaver />
        </LeaveGuardProvider>,
      )

      await screen.findByLabelText(/From name/i)
      await userEvent.click(screen.getByText('Leave'))

      expect(proceed).toHaveBeenCalledTimes(1)
    })
  })

  describe('save races', () => {
    it('expect a second failure announced again', async () => {
      let failAgain: (error: Error) => void = () => undefined
      jest
        .mocked(emails)
        .putAccount.mockRejectedValueOnce(new Error('offline'))
        .mockReturnValueOnce(new Promise((_, reject) => (failAgain = reject)))
      const failure = "We couldn't save your changes. They're still here, so you can try again."
      render(<AccountSettings />)

      await renameTo('George')
      await pressSave()
      const bar = await findBar()
      await within(bar).findByRole('button', { name: 'Try again' })
      expect(statusTexts()).toContain(failure)

      await userEvent.click(within(bar).getByRole('button', { name: 'Try again' }))

      expect(statusTexts()).not.toContain(failure)

      await act(async () => failAgain(new Error('offline')))

      expect(statusTexts()).toContain(failure)
    })

    it('expect no PUT once the page is left while Save waits for a notification save', async () => {
      let finishPreview: (saved: Account) => void = () => undefined
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise((resolve) => (finishPreview = resolve)))
      const { unmount } = render(<AccountSettings />)

      await renameTo('George')
      await userEvent.click(screen.getByText(/Choose neither/i))
      await pressSave()
      unmount()
      await act(async () => finishPreview(account))

      expect(emails.putAccount).toHaveBeenCalledTimes(1)
    })

    it('expect focus left in the leave dialog when a slow save lands', async () => {
      let finishSave: (saved: Account) => void = () => undefined
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise((resolve) => (finishSave = resolve)))
      const Leaver = (): React.ReactNode => {
        const { requestLeave } = useLeaveGuard()
        return <button onClick={() => requestLeave(jest.fn())}>Leave</button>
      }
      render(
        <LeaveGuardProvider>
          <AccountSettings />
          <Leaver />
        </LeaveGuardProvider>,
      )

      await renameTo('George')
      await pressSave()
      await userEvent.click(screen.getByText('Leave'))
      const dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' })
      await act(async () => finishSave(account))

      expect(within(await findBar()).getByText('Saved: Display name')).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus()
    })

    it('expect Discard to forget phrases confirmed with Save anyway', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch).mockResolvedValueOnce(inboxMatch)
      jest.mocked(emails).putAccount.mockRejectedValueOnce(new Error('offline'))

      await saveNewPhrase()
      await userEvent.click(within(await findImpactResult()).getByRole('button', { name: 'Save anyway' }))
      const bar = await findBar()
      await within(bar).findByRole('button', { name: 'Try again' })
      await userEvent.click(within(bar).getByRole('button', { name: 'Discard' }))
      await userEvent.click(screen.getByText('Add invoice phrase'))
      await pressSave()
      await findImpactResult()

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(2)
      expect(emails.putAccount).toHaveBeenCalledTimes(1)
    })
  })

  describe('timed bar states', () => {
    beforeAll(() => {
      jest.useFakeTimers()
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('success shows "Saved: Spam filter", then "Saved at 3:42 PM" under the lede', async () => {
      const events = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<AccountSettings now={() => SAVED_AT} />)

      await events.click(await screen.findByText('Choose high'))
      await events.click(within(await findBar()).getByRole('button', { name: 'Save' }))

      const bar = await findBar()
      expect(await within(bar).findByText('Saved: Spam filter')).toBeVisible()
      expect(screen.getByText(savedAtText)).toBeVisible()
      expect(statusTexts()).toContain('Saved your changes to Spam filter.')
      expect(bar.contains(document.activeElement)).toBe(true)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(queryBar()).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: 'Account settings' })).toHaveFocus()
      expect(screen.getByText(savedAtText)).toBeVisible()
    })

    it('expect the Undo offer to leave after 8 seconds', async () => {
      const events = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<AccountSettings />)

      await events.click(await screen.findByText('Choose high'))
      await events.click(within(await findBar()).getByRole('button', { name: 'Discard' }))

      act(() => {
        jest.advanceTimersByTime(7999)
      })

      expect(within(await findBar()).getByRole('button', { name: 'Undo' })).toBeVisible()

      act(() => {
        jest.advanceTimersByTime(1)
      })

      expect(queryBar()).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1, name: 'Account settings' })).toHaveFocus()
    })

    it('expect focus left alone when it moved out of the bar before it leaves', async () => {
      const events = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<AccountSettings />)

      await events.click(await screen.findByText('Choose high'))
      await events.click(within(await findBar()).getByRole('button', { name: 'Discard' }))
      const box = screen.getByLabelText('Trusted senders')
      act(() => box.focus())

      act(() => {
        jest.advanceTimersByTime(8000)
      })

      expect(box).toHaveFocus()
    })
  })

  describe('notifications', () => {
    it('expect the notification settings mounted with the saved level', async () => {
      render(<AccountSettings />)

      expect(await screen.findByText('NotificationSettingsMounted:sender-and-subject')).toBeInTheDocument()
    })

    it('expect a new notification level saved as soon as it is chosen, with no bar', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText(/Choose neither/i))

      expect(emails.putAccount).toHaveBeenCalledWith(user.username, {
        bounceSenders: account.bounceSenders,
        forwardTargets: account.forwardTargets,
        id: user.username,
        name: account.name,
        notificationPreview: 'none',
      })
      expect(queryBar()).not.toBeInTheDocument()
    })

    it('expect the level to revert with a message when saving it fails', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText(/Choose neither/i))

      expect(
        await screen.findByText(/We couldn't save that. Your last saved choice is still in effect./i),
      ).toBeVisible()
      expect(await screen.findByText('NotificationSettingsMounted:sender-and-subject')).toBeInTheDocument()
    })

    it('expect a failed level save to revert to the level last saved, not the level loaded', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText(/Choose sender only/i))
      jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
      await userEvent.click(await screen.findByText(/Choose neither/i))

      expect(await screen.findByText('NotificationSettingsMounted:sender-only')).toBeInTheDocument()
    })

    it('waits for an in-flight notification save before the PUT', async () => {
      let finishPreview: (saved: Account) => void = () => undefined
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise((resolve) => (finishPreview = resolve)))
      render(<AccountSettings />)

      await renameTo('George')
      await userEvent.click(screen.getByText(/Choose neither/i))
      await pressSave()

      expect(emails.putAccount).toHaveBeenCalledTimes(1)
      expect(within(await findBar()).getByRole('button', { name: 'Saving…' })).toBeVisible()

      await act(async () => finishPreview(account))

      await waitFor(() => expect(emails.putAccount).toHaveBeenCalledTimes(2))
      expect(emails.putAccount).toHaveBeenLastCalledWith(
        user.username,
        expect.objectContaining({ name: 'George', notificationPreview: 'none' }),
      )
    })

    it('expect the saved preview sent with a later Save', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText(/Choose sender only/i))
      await renameTo('George')
      await pressSave()

      expect(emails.putAccount).toHaveBeenLastCalledWith(
        user.username,
        expect.objectContaining({ name: 'George', notificationPreview: 'sender-only' }),
      )
    })
  })

  describe('spam filter', () => {
    it('expect the defaults for an account saved before the spam filter existed', async () => {
      render(<AccountSettings />)

      expect(await screen.findByText('SpamFilterSettingsMounted:medium:')).toBeInTheDocument()
    })

    it("expect the account's saved spam filter", async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...account,
        spamFilter: { blockPhrases: ['crypto'], sensitivity: 'high', trustedSenders: [] },
      })
      render(<AccountSettings />)

      expect(await screen.findByText('SpamFilterSettingsMounted:high:crypto')).toBeInTheDocument()
    })

    it('expect the spam filter sent with the rest of the account', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await pressSave()

      expect(emails.putAccount).toHaveBeenCalledWith(user.username, {
        bounceSenders: account.bounceSenders,
        forwardTargets: account.forwardTargets,
        id: user.username,
        name: account.name,
        notificationPreview: 'sender-and-subject',
        spamFilter: { ...DEFAULT_SPAM_FILTER, sensitivity: 'high' },
      })
    })

    it('expect the Inbox never loaded, since the endpoint does the checking', async () => {
      render(<AccountSettings />)

      await screen.findByText('SpamFilterSettingsMounted:medium:')

      expect(emails.getAllReceivedEmails).not.toHaveBeenCalled()
    })

    it('expect a trusted sender still in its box added before saving', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Trusted senders'), '@new.com')
      await pressSave()

      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: { ...DEFAULT_SPAM_FILTER, trustedSenders: ['@new.com'] } }),
      )
    })
  })

  describe('impact check', () => {
    const inboxLead =
      'This new phrase matches emails already in your Inbox. Those emails stay put, but new mail containing it will go to Spam, unless it comes from a trusted sender.'
    const incompleteLead = "We couldn't check all of your Inbox. Your new phrase may match emails we didn't check."
    const failedLead = "We couldn't check your new phrase against your mail. You can save it anyway."
    const spamLead = "Here's the mail in Spam that your new phrase matches."
    const pluralIncompleteLead =
      "We couldn't check all of your Inbox. Your new phrases may match emails we didn't check."
    const pluralFailedLead = "We couldn't check your new phrases against your mail. You can save them anyway."
    const pluralSpamLead = "Here's the mail in Spam that your new phrases match."

    it('expect only the new phrases checked, with no email excluded', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...account,
        spamFilter: { ...DEFAULT_SPAM_FILTER, blockPhrases: ['crypto'] },
      })
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Add invoice phrase'))
      await pressSave()

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.postSpamImpact).toHaveBeenCalledWith(user.username, ['invoice'])
    })

    it('expect a phrase typed in its box checked on Save', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Block phrases'), 'free prize')
      await pressSave()

      expect(emails.postSpamImpact).toHaveBeenCalledWith(user.username, ['free prize'])
    })

    it('expect no check when no phrase is new', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await pressSave()

      expect(emails.postSpamImpact).not.toHaveBeenCalled()
      expect(emails.putAccount).toHaveBeenCalledTimes(1)
    })

    it('expect a phrase already saved not checked again', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({ ...account, spamFilter: withInvoice })
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await pressSave()

      expect(emails.postSpamImpact).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('new block phrase opens the impact dialog in its checking state', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))

      await saveNewPhrase()

      const dialog = await findImpactDialog()
      expect(within(dialog).getByText(checkingLead)).toBeVisible()
      expect(within(within(dialog).getByRole('listitem')).getByText('Checking your mail…')).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toHaveFocus()
      expect(within(dialog).getByRole('button', { name: 'Checking your mail…' })).toBeVisible()
      expect(within(await findBar()).getByRole('button', { name: 'Checking your mail…' })).toBeVisible()
    })

    it('expect the plural checking lead for two new phrases', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))

      await saveTwoNewPhrases()

      expect(
        within(await findImpactDialog()).getByText(
          'Before your new phrases take effect, we check them against the mail you already have.',
        ),
      ).toBeVisible()
    })

    it('expect nothing saved while the check runs', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))

      await saveNewPhrase()
      const dialog = await findImpactDialog()
      await userEvent.click(within(dialog).getByRole('button', { name: 'Checking your mail…' }))

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('no matches: dialog closes, announces "No matches in the emails we checked. Saving…", and saves', async () => {
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise(() => undefined))

      await saveNewPhrase()

      await waitFor(() => expect(emails.putAccount).toHaveBeenCalledTimes(1))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(statusTexts()).toContain('No matches in the emails we checked. Saving…')
      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: withInvoice }),
      )
    })

    it('matches: Save anyway saves; Keep editing keeps edits and saves nothing', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch).mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()
      await userEvent.click(within(await findImpactResult()).getByRole('button', { name: 'Keep editing' }))

      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByText('SpamFilterSettingsMounted:medium:invoice:changed')).toBeInTheDocument()
      expect(statusTexts()).toContain('Nothing saved. Your changes are still here.')
      expect(within(await findBar()).getByRole('button', { name: 'Save' })).toHaveFocus()

      await pressSave()
      await userEvent.click(within(await findImpactResult()).getByRole('button', { name: 'Save anyway' }))

      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: withInvoice }),
      )
      expect(await within(await findBar()).findByText('Saved: Spam filter')).toBeVisible()
    })

    it('expect Escape in the dialog to act as Keep editing', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()
      await findImpactResult()
      await userEvent.keyboard('{Escape}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('expect a retry after a failed save not to ask about phrases already confirmed', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)
      jest.mocked(emails).putAccount.mockRejectedValueOnce(new Error('offline'))

      await saveNewPhrase()
      await userEvent.click(within(await findImpactResult()).getByRole('button', { name: 'Save anyway' }))
      const bar = await findBar()
      await userEvent.click(await within(bar).findByRole('button', { name: 'Try again' }))

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.putAccount).toHaveBeenCalledTimes(2)
    })

    it('ignores a check result that arrives after Keep editing', async () => {
      let finishCheck: (response: SpamImpactResponse) => void = () => undefined
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise((resolve) => (finishCheck = resolve)))

      await saveNewPhrase()
      await userEvent.click(within(await findImpactDialog()).getByRole('button', { name: 'Keep editing' }))
      await act(async () => finishCheck(inboxMatch))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(within(await findBar()).getByRole('button', { name: 'Save' })).toBeVisible()
    })

    it('expect Inbox matches to give the Inbox lead and Save anyway', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText(inboxLead)).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save anyway' })).toBeVisible()
    })

    it('expect the plural Inbox lead when more than one new phrase matches the Inbox', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactResponse,
        phrases: [spamImpactResponse.phrases[0], spamImpactResponse.phrases[0]],
      })

      await saveTwoNewPhrases()

      expect(
        await screen.findByText(
          'These new phrases match emails already in your Inbox. Those emails stay put, but new mail containing them will go to Spam, unless it comes from a trusted sender.',
        ),
      ).toBeVisible()
    })

    it('expect an incomplete check to give its lead and Save anyway', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactIncomplete)

      await saveNewPhrase()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText(incompleteLead)).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save anyway' })).toBeVisible()
    })

    it('expect a failed check to give its lead, the failure line and Save anyway', async () => {
      jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(new Error('throttled'))

      await saveNewPhrase()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText(failedLead)).toBeVisible()
      expect(within(dialog).getByText("We couldn't check this phrase against your mail.")).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save anyway' })).toBeVisible()
      expect(within(dialog).queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
      expect(within(await findBar()).queryByText("We couldn't save your changes.")).not.toBeInTheDocument()
    })

    it('expect a failed check logged without the phrases', async () => {
      const error = new Error('throttled')
      jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(error)

      await saveNewPhrase()
      await findImpactResult()

      expect(console.error).toHaveBeenCalledWith('postSpamImpact', { accountId: user.username, error })
    })

    it('expect a malformed response to count as a failed check', async () => {
      // Two phrase entries for one phrase sent.
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveNewPhrase()

      expect(within(await findImpactResult()).getByText(failedLead)).toBeVisible()
    })

    it('expect a response that is not an object to count as a failed check', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(undefined as unknown as SpamImpactResponse)

      await saveNewPhrase()

      expect(within(await findImpactResult()).getByText(failedLead)).toBeVisible()
    })

    it('expect Spam-only matches to give the Spam lead and Save', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamOnly)

      await saveNewPhrase()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText(spamLead)).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible()
      expect(within(dialog).queryByRole('button', { name: 'Save anyway' })).not.toBeInTheDocument()
    })

    it('expect the Inbox lead before the incomplete lead', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ ...inboxMatch, inboxIncomplete: true })

      await saveNewPhrase()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText(inboxLead)).toBeVisible()
      expect(within(dialog).queryByText(incompleteLead)).not.toBeInTheDocument()
    })

    it('expect the incomplete lead before the Spam lead', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ ...spamOnly, inboxIncomplete: true })

      await saveNewPhrase()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText(incompleteLead)).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save anyway' })).toBeVisible()
    })

    it('expect the dialog to open for a Spam match in only one of two phrases, list both, and use the singular lead', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactResponse,
        phrases: [spamImpactResponse.phrases[1], { ...spamImpactResponse.phrases[0], inbox: { count: 0, emails: [] } }],
      })

      await saveTwoNewPhrases()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText('“free lunch”')).toBeVisible()
      expect(within(dialog).getByText('“lottery winner”')).toBeVisible()
      expect(within(dialog).getByText(spamLead)).toBeVisible()
      expect(within(dialog).queryByText(pluralSpamLead)).not.toBeInTheDocument()
    })

    it('expect the plural Spam lead when more than one new phrase matches Spam', async () => {
      const spamOnlyImpact = { ...spamImpactResponse.phrases[0], inbox: { count: 0, emails: [] } }
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactResponse,
        phrases: [spamOnlyImpact, spamOnlyImpact],
      })

      await saveTwoNewPhrases()

      expect(within(await findImpactResult()).getByText(pluralSpamLead)).toBeVisible()
    })

    it('expect the dialog described by its lead, so a screen reader reads it with the title', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamOnly)

      await saveNewPhrase()

      expect(await findImpactResult()).toHaveAccessibleDescription(spamLead)
    })

    it('expect each new phrase listed with its lines and the footnote', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveTwoNewPhrases()

      const dialog = await findImpactResult()
      expect(within(dialog).getByText('“free lunch”')).toBeVisible()
      expect(within(dialog).getByText('“lottery winner”')).toBeVisible()
      expect(within(dialog).getByText(/Matches 2 of 100 Inbox emails:/)).toBeVisible()
      expect(within(dialog).getByText('Lunch on Friday')).toBeVisible()
      expect(within(dialog).getByText(/Also matches 3 of 25 Spam emails:/)).toBeVisible()
      expect(
        within(dialog).getByText(
          /We checked subjects and message text in 100 of 150 Inbox emails and 25 of 40 Spam emails, newest first\./,
        ),
      ).toBeVisible()
    })

    it('expect the footnote to say "this phrase" for one new phrase', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()

      expect(within(await findImpactResult()).getByText(/Future mail with this phrase will go to Spam/)).toBeVisible()
    })

    it('expect the footnote to say "these phrases" for two new phrases', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveTwoNewPhrases()

      expect(within(await findImpactResult()).getByText(/Future mail with these phrases will go to Spam/)).toBeVisible()
    })

    it('expect nothing saved until the owner answers', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()
      await findImpactResult()

      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('expect Save to save the phrase when only Spam matched', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamOnly)

      await saveNewPhrase()
      await userEvent.click(within(await findImpactResult()).getByRole('button', { name: 'Save' }))

      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: withInvoice }),
      )
    })

    it('expect the plural failed lead when more than one new phrase is checked', async () => {
      jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(new Error('throttled'))

      await saveTwoNewPhrases()

      expect(within(await findImpactResult()).getByText(pluralFailedLead)).toBeVisible()
    })

    it('expect the plural incomplete lead when more than one new phrase is checked', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactResponse,
        inboxIncomplete: true,
        phrases: [spamImpactResponse.phrases[1], spamImpactResponse.phrases[1]],
      })

      await saveTwoNewPhrases()

      expect(within(await findImpactResult()).getByText(pluralIncompleteLead)).toBeVisible()
    })

    it('expect the singular Inbox lead when two phrases are checked and only one matches the Inbox', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveTwoNewPhrases()

      expect(within(await findImpactResult()).getByText(inboxLead)).toBeVisible()
    })

    it('expect an edit attempted during the check not to change what is saved', async () => {
      let finishCheck: (response: SpamImpactResponse) => void = () => undefined
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise((resolve) => (finishCheck = resolve)))

      await saveNewPhrase()
      await findImpactDialog()
      await userEvent.type(screen.getByLabelText(/From name/i), ' Jr')
      await act(async () => finishCheck(noMatches))

      await waitFor(() => expect(emails.putAccount).toHaveBeenCalledTimes(1))
      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ name: account.name, spamFilter: withInvoice }),
      )
    })
  })

  // The real chip box: its Enter both adds the entry and clears the box in one batch.
  describe('with the real bounce rule box', () => {
    beforeAll(() => {
      jest.mocked(BounceSenderInput).mockImplementation(jest.requireActual('@components/bounce-sender-input').default)
    })

    afterAll(() => {
      jest.mocked(BounceSenderInput).mockImplementation(stubBounceSenderInput)
    })

    it('expect a rule added with Enter announced', async () => {
      render(<AccountSettings />)

      await userEvent.type(await screen.findByLabelText('Reject emails from:'), '@new.example{Enter}')

      expect(statusTexts()).toContain('Added “@new.example”. Not saved yet.')
    })
  })
})

describe('save-state', () => {
  const setup = () => {
    const fields = {
      name: account.name,
      forwardTargets: [...account.forwardTargets],
      bounceSenders: [...account.bounceSenders],
      spamFilter: account.spamFilter ?? DEFAULT_SPAM_FILTER,
    }
    return { fields }
  }

  it('changedSections returns [] for an untouched form', () => {
    const { fields } = setup()
    expect(changedSections(account, fields, EMPTY_DRAFTS)).toEqual([])
  })

  it('changedSections marks a section holding only a draft', () => {
    const { fields } = setup()
    expect(changedSections(account, fields, { ...EMPTY_DRAFTS, blockPhrases: 'x' })).toEqual(['spam'])
    expect(changedSections(account, fields, { ...EMPTY_DRAFTS, bounce: '   ' })).toEqual([])
  })

  it('changedSections keeps SECTION_ORDER', () => {
    const { fields } = setup()
    const edited = {
      ...fields,
      name: `${fields.name} changed`,
      spamFilter: { ...fields.spamFilter, sensitivity: 'high' as const },
    }
    expect(changedSections(account, edited, { ...EMPTY_DRAFTS, forwarding: 'a@b.co' })).toEqual([
      'name',
      'forwarding',
      'spam',
    ])
  })

  it('changedSections compares an account with no spam filter against the defaults', () => {
    const { fields } = setup()
    const { spamFilter: _unused, ...legacy } = account
    expect(changedSections(legacy, { ...fields, spamFilter: DEFAULT_SPAM_FILTER }, EMPTY_DRAFTS)).toEqual([])
    expect(
      changedSections(
        legacy,
        { ...fields, spamFilter: { ...DEFAULT_SPAM_FILTER, blockPhrases: ['invoice'] } },
        EMPTY_DRAFTS,
      ),
    ).toEqual(['spam'])
  })

  it('commitDrafts adds every valid draft', () => {
    const { fields } = setup()
    const result = commitDrafts(fields, {
      forwarding: ' new@example.com ',
      bounce: '@spam.example',
      blockPhrases: 'free prize',
      trustedSenders: '@friends.example',
    })
    expect(result).toEqual({
      ok: true,
      fields: {
        ...fields,
        forwardTargets: [...fields.forwardTargets, 'new@example.com'],
        bounceSenders: [...fields.bounceSenders, '@spam.example'],
        spamFilter: {
          ...fields.spamFilter,
          blockPhrases: [...fields.spamFilter.blockPhrases, 'free prize'],
          trustedSenders: [...fields.spamFilter.trustedSenders, '@friends.example'],
        },
      },
    })
    expect(commitDrafts(fields, EMPTY_DRAFTS)).toEqual({ ok: true, fields })
    expect(commitDrafts(fields, { ...EMPTY_DRAFTS, forwarding: '   ' })).toEqual({ ok: true, fields })
  })

  it('commitDrafts drops an exact repeat silently', () => {
    const { fields } = setup()
    const withLists = {
      ...fields,
      forwardTargets: ['Me@Example.com'],
      spamFilter: { ...fields.spamFilter, blockPhrases: ['free prize'] },
    }
    expect(
      commitDrafts(withLists, { ...EMPTY_DRAFTS, forwarding: ' me@example.COM ', blockPhrases: 'FREE PRIZE' }),
    ).toEqual({ ok: true, fields: withLists })
  })

  it('commitDrafts refuses and adds nothing when any draft is invalid, returning every error and the first in DRAFT_ORDER', () => {
    const { fields } = setup()
    const result = commitDrafts(fields, {
      ...EMPTY_DRAFTS,
      forwarding: 'not an address',
      bounce: '@fine.example',
      trustedSenders: '*',
    })
    expect(result).toEqual({
      ok: false,
      first: 'forwarding',
      errors: {
        forwarding: 'Enter an email address, like name@example.com.',
        trustedSenders: 'Trusting everyone would turn the filter off. Enter an address or a domain.',
      },
    })
  })

  it('joinSections joins section names', () => {
    expect(joinSections(['name'])).toBe('Display name')
    expect(joinSections(['spam'])).toBe('Spam filter')
    expect(joinSections(['forwarding', 'spam'])).toBe('Forwarding and Spam filter')
    expect(joinSections(['forwarding', 'bounce', 'spam'])).toBe('Forwarding, Bounce rules, and Spam filter')
  })

  it('draftLine words the count', () => {
    expect(draftLine(0)).toBeUndefined()
    expect(draftLine(1)).toBe("1 entry isn't added yet. Save adds it first.")
    expect(draftLine(2)).toBe("2 entries aren't added yet. Save adds them first.")
  })

  it('ENTRY_NOUN names each box', () => {
    expect(ENTRY_NOUN.trustedSenders).toBe('trusted sender')
  })

  it('EMPTY_DRAFTS is blank in every box', () => {
    expect(Object.values(EMPTY_DRAFTS)).toEqual(['', '', '', ''])
  })
})
