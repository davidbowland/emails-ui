import { getCurrentUser } from 'aws-amplify/auth'
import React from 'react'

import AccountSettings from './index'
import AddressLine from '@components/address-line'
import BounceSenderInput from '@components/bounce-sender-input'
import * as emails from '@services/emails'
import { account, spamImpactIncomplete, spamImpactResponse, user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_SPAM_FILTER, SpamFilter, SpamImpactResponse } from '@types'

// Stands in for the section's draft commit, so each test can say what a typed-but-unentered
// entry would add, or that one was refused.
const mockCommitDrafts = jest.fn()

jest.mock('aws-amplify/auth')
jest.mock('@components/address-line')
jest.mock('@components/bounce-sender-input')
jest.mock('@components/error-snackbar', () => {
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
jest.mock('@components/loading-spinner', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return () => React.createElement('div', null, 'Loading...')
})
jest.mock('@components/notification-settings', () => {
  const React = require('react')
  // eslint-disable-next-line react/display-name
  return ({ onPreviewChange, preview }: any) =>
    React.createElement(
      'div',
      null,
      `NotificationSettingsMounted:${preview}`,
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
  const MockSpamFilterSettings = ({ onChange, ref, value }: any) => {
    React.useImperativeHandle(ref, () => ({ commitDrafts: () => mockCommitDrafts(value) }))
    return React.createElement(
      'div',
      null,
      `SpamFilterSettingsMounted:${value.sensitivity}:${value.blockPhrases.join('|')}`,
      React.createElement(
        'button',
        { onClick: () => onChange({ ...value, blockPhrases: [...value.blockPhrases, 'invoice'] }) },
        'Add invoice phrase',
      ),
      React.createElement('button', { onClick: () => onChange({ ...value, sensitivity: 'high' }) }, 'Choose high'),
    )
  }
  return MockSpamFilterSettings
})
jest.mock('@config/amplify')
jest.mock('@services/emails')

describe('AccountSettings component', () => {
  // The button's whole label is its state -- 'Save', 'Saving…' or 'Saved' -- so it is found by the
  // one part of the name that does not move.
  const findSaveButton = async (): Promise<HTMLButtonElement> =>
    (await screen.findByRole('button', { name: /^Sav/ })) as HTMLButtonElement

  const withInvoice: SpamFilter = { ...DEFAULT_SPAM_FILTER, blockPhrases: ['invoice'] }

  // One new phrase, 'invoice', that matches nothing in either folder and was checked completely.
  const noMatches: SpamImpactResponse = { ...spamImpactIncomplete, inboxIncomplete: false }
  const inboxMatch: SpamImpactResponse = { ...spamImpactResponse, phrases: [spamImpactResponse.phrases[0]] }
  const spamOnly: SpamImpactResponse = {
    ...inboxMatch,
    phrases: [{ ...inboxMatch.phrases[0], inbox: { count: 0, emails: [] } }],
  }

  // Adds the phrase 'invoice' and presses Save.
  const saveNewPhrase = async (): Promise<void> => {
    render(<AccountSettings />)
    await userEvent.click(await screen.findByText('Add invoice phrase'))
    await userEvent.click(await findSaveButton())
  }

  // Adds two phrases at once and presses Save. The page's draft changes, and the mocked section
  // commits the two phrases on Save.
  const saveTwoNewPhrases = async (): Promise<void> => {
    mockCommitDrafts.mockReturnValueOnce({ ...DEFAULT_SPAM_FILTER, blockPhrases: ['free lunch', 'lottery winner'] })
    render(<AccountSettings />)
    await userEvent.click(await screen.findByText('Choose high'))
    await userEvent.click(await findSaveButton())
  }

  const findImpactDialog = (): Promise<HTMLElement> =>
    screen.findByRole('dialog', { name: 'Check your new block phrases' })

  beforeAll(() => {
    jest.mocked(getCurrentUser).mockResolvedValue(user)
    jest.mocked(AddressLine).mockReturnValue(<>AddressLine</>)
    jest.mocked(BounceSenderInput).mockReturnValue(<>BounceSenderInput</>)
    jest.mocked(emails).getAccount.mockResolvedValue(account)
    jest.mocked(emails).postSpamImpact.mockResolvedValue(noMatches)
    mockCommitDrafts.mockImplementation((value: SpamFilter) => value)
    jest.mocked(emails).putAccount.mockResolvedValue(account)

    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
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
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(closeSnackbarButton)

    expect(screen.queryByText(/We couldn't sign you in. Reload the page to try again./i)).not.toBeInTheDocument()
  })

  it('expect error message when getAccount rejects', async () => {
    jest.mocked(emails).getAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    expect(await screen.findByText(/Couldn't load your settings. Reload the page to try again./i)).toBeVisible()
  })

  it('expect error message when putAccount rejects', async () => {
    jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    const linkTextInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    fireEvent.change(linkTextInput, { target: { value: 'George' } })
    fireEvent.click(await findSaveButton())

    expect(
      await screen.findByText(
        "We couldn't save your settings. Nothing changed — your last saved settings are still in effect.",
      ),
    ).toBeVisible()
  })

  it('expect the fields put back where the server is when the save fails', async () => {
    jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    const linkTextInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    fireEvent.change(linkTextInput, { target: { value: 'George' } })
    fireEvent.click(await findSaveButton())

    expect(await screen.findByDisplayValue(account.name)).toBeVisible()
  })

  it('expect the notification settings mounted with the saved level', async () => {
    render(<AccountSettings />)

    expect(await screen.findByText('NotificationSettingsMounted:sender-and-subject')).toBeInTheDocument()
  })

  it('expect a new notification level saved as soon as it is chosen', async () => {
    render(<AccountSettings />)

    await userEvent.click(await screen.findByText(/Choose neither/i))

    expect(emails.putAccount).toHaveBeenCalledWith(user.username, {
      bounceSenders: account.bounceSenders,
      forwardTargets: account.forwardTargets,
      id: user.username,
      name: account.name,
      notificationPreview: 'none',
    })
  })

  it('expect the level to revert with a message when saving it fails', async () => {
    jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
    render(<AccountSettings />)

    await userEvent.click(await screen.findByText(/Choose neither/i))

    expect(await screen.findByText(/We couldn't save that. Your last saved choice is still in effect./i)).toBeVisible()
    expect(await screen.findByText('NotificationSettingsMounted:sender-and-subject')).toBeInTheDocument()
  })

  it('expect a failed level save to revert to the level last saved, not the level loaded', async () => {
    render(<AccountSettings />)

    await userEvent.click(await screen.findByText(/Choose sender only/i))
    jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
    await userEvent.click(await screen.findByText(/Choose neither/i))

    expect(await screen.findByText('NotificationSettingsMounted:sender-only')).toBeInTheDocument()
  })

  it('expect no save while the notification level is still saving', async () => {
    // The whole-item PUT the level save is making carries the account as it was loaded, so a
    // second PUT racing it can land first and be overwritten by the older name.
    jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise(() => undefined))
    render(<AccountSettings />)

    const nameInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'George')
    await userEvent.click(await screen.findByText(/Choose neither/i))
    await userEvent.click(await findSaveButton())

    expect(emails.putAccount).toHaveBeenCalledTimes(1)
  })

  it('expect a save once the notification level has finished saving', async () => {
    render(<AccountSettings />)

    const nameInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'George')
    await userEvent.click(await screen.findByText(/Choose neither/i))
    await userEvent.click(await findSaveButton())

    expect(emails.putAccount).toHaveBeenCalledTimes(2)
  })

  it('expect the button to read Saved and save nothing when there is nothing to save', async () => {
    render(<AccountSettings />)

    await userEvent.click(await findSaveButton())

    expect(await screen.findByRole('button', { name: 'Saved' })).toBeVisible()
    expect(emails.putAccount).not.toHaveBeenCalled()
  })

  it('expect the button to offer Save once a field is edited', async () => {
    render(<AccountSettings />)

    fireEvent.change(await screen.findByLabelText(/From name/i), { target: { value: 'George' } })

    expect(await screen.findByRole('button', { name: 'Save' })).toBeVisible()
  })

  it('expect the button to read Saved again once a notification level is chosen and Save has nothing left', async () => {
    // The tier saves itself, so Save must not go on offering to write a change that already landed.
    render(<AccountSettings />)

    await userEvent.click(await screen.findByText(/Choose neither/i))

    expect(await screen.findByRole('button', { name: 'Saved' })).toBeVisible()
  })

  it('expect the page to say which settings need Save and which do not', async () => {
    render(<AccountSettings />)

    expect(
      await screen.findByText('Notifications save as soon as you change them. Everything else waits for Save.'),
    ).toBeVisible()
  })

  it('expect the install offer mounted in the App section', async () => {
    render(<AccountSettings />)

    expect(await screen.findByText('InstallOfferMounted')).toBeInTheDocument()
  })

  it('expect the whole updated account passed to putAccount', async () => {
    render(<AccountSettings />)

    const linkTextInput = (await screen.findByLabelText(/From name/i)) as HTMLInputElement
    fireEvent.change(linkTextInput, { target: { value: 'George' } })
    fireEvent.click(await findSaveButton())

    expect(emails.putAccount).toHaveBeenCalledWith(user.username, {
      bounceSenders: account.bounceSenders,
      forwardTargets: account.forwardTargets,
      id: user.username,
      name: 'George',
      notificationPreview: 'sender-and-subject',
      spamFilter: DEFAULT_SPAM_FILTER,
    })
  })

  it('expect a landed save to be confirmed and the button to settle back to Saved', async () => {
    render(<AccountSettings />)

    fireEvent.change(await screen.findByLabelText(/From name/i), { target: { value: 'George' } })
    await userEvent.click(await findSaveButton())

    expect(await screen.findByText('Settings saved.')).toBeVisible()
    expect(await screen.findByRole('button', { name: 'Saved' })).toBeVisible()
  })

  it('expect pressing Saved to send nothing, so a landed save cannot be replayed', async () => {
    render(<AccountSettings />)

    fireEvent.change(await screen.findByLabelText(/From name/i), { target: { value: 'George' } })
    await userEvent.click(await findSaveButton())
    await screen.findByRole('button', { name: 'Saved' })
    await userEvent.click(await findSaveButton())

    expect(emails.putAccount).toHaveBeenCalledTimes(1)
  })

  it('expect focus kept on the button once the save lands', async () => {
    // A disabled button leaves the tab order, dropping focus to the body: the next Tab would
    // restart at the top of the page.
    render(<AccountSettings />)

    fireEvent.change(await screen.findByLabelText(/From name/i), { target: { value: 'George' } })
    await userEvent.click(await findSaveButton())

    expect(await screen.findByRole('button', { name: 'Saved' })).toHaveFocus()
  })

  it('expect the confirmation dropped once there is something to save again', async () => {
    render(<AccountSettings />)

    fireEvent.change(await screen.findByLabelText(/From name/i), { target: { value: 'George' } })
    await userEvent.click(await findSaveButton())
    await screen.findByText('Settings saved.')
    fireEvent.change(await screen.findByLabelText(/From name/i), { target: { value: 'Georgina' } })

    expect(screen.queryByText('Settings saved.')).not.toBeInTheDocument()
  })

  it('expect bounce senders BounceSenderInput rendered', async () => {
    render(<AccountSettings />)

    await screen.findByText(/Account Settings/i)
    expect(BounceSenderInput).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Reject emails from:',
        rules: ['spam@domain.com'],
      }),
      undefined,
    )
    expect(
      await screen.findByText(
        /Block senders by address \(user@domain\.com\), domain \(@domain\.com\), or enter \* to block everyone\./i,
      ),
    ).toBeVisible()
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

    it('expect the button to offer Save once the spam filter changes', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))

      expect(await screen.findByRole('button', { name: 'Save' })).toBeVisible()
    })

    it('expect the spam filter sent with the rest of the account', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await userEvent.click(await findSaveButton())

      expect(emails.putAccount).toHaveBeenCalledWith(user.username, {
        bounceSenders: account.bounceSenders,
        forwardTargets: account.forwardTargets,
        id: user.username,
        name: account.name,
        notificationPreview: 'sender-and-subject',
        spamFilter: { ...DEFAULT_SPAM_FILTER, sensitivity: 'high' },
      })
    })

    it('expect the spam filter put back where the server is when the save fails', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(undefined)
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await userEvent.click(await findSaveButton())

      expect(await screen.findByText('SpamFilterSettingsMounted:medium:')).toBeInTheDocument()
    })

    it('expect the Inbox never loaded, since the endpoint does the checking', async () => {
      render(<AccountSettings />)

      await screen.findByText('SpamFilterSettingsMounted:medium:')

      expect(emails.getAllReceivedEmails).not.toHaveBeenCalled()
    })

    it('expect Save to add an entry still in its box before saving', async () => {
      mockCommitDrafts.mockReturnValueOnce({ ...DEFAULT_SPAM_FILTER, trustedSenders: ['@new.com'] })
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await userEvent.click(await findSaveButton())

      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: { ...DEFAULT_SPAM_FILTER, trustedSenders: ['@new.com'] } }),
      )
    })

    it('expect nothing saved when an entry still in its box is refused', async () => {
      mockCommitDrafts.mockReturnValueOnce(undefined)
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await userEvent.click(await findSaveButton())

      expect(emails.putAccount).not.toHaveBeenCalled()
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
      await userEvent.click(await findSaveButton())

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.postSpamImpact).toHaveBeenCalledWith(user.username, ['invoice'])
    })

    it('expect no check when no phrase is new', async () => {
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await userEvent.click(await findSaveButton())

      expect(emails.postSpamImpact).not.toHaveBeenCalled()
      expect(emails.putAccount).toHaveBeenCalledTimes(1)
    })

    it('expect a phrase already saved not checked again', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({ ...account, spamFilter: withInvoice })
      render(<AccountSettings />)

      await userEvent.click(await screen.findByText('Choose high'))
      await userEvent.click(await findSaveButton())

      expect(emails.postSpamImpact).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('expect the button to say the check is running while it runs', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))

      await saveNewPhrase()

      expect(await screen.findByRole('button', { name: 'Checking your mail…' })).toBeVisible()
    })

    it('expect nothing saved while the check runs', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))

      await saveNewPhrase()
      await userEvent.click(await screen.findByRole('button', { name: 'Checking your mail…' }))

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('expect a save with no dialog when nothing matches and the check was complete', async () => {
      await saveNewPhrase()

      expect(await screen.findByText('Settings saved.')).toBeVisible()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: withInvoice }),
      )
    })

    it('expect Inbox matches to give the Inbox lead and Save anyway', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()

      const dialog = await findImpactDialog()
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

      const dialog = await findImpactDialog()
      expect(within(dialog).getByText(incompleteLead)).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save anyway' })).toBeVisible()
    })

    it('expect a failed check to give its lead, the failure line and Save anyway', async () => {
      jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(new Error('throttled'))

      await saveNewPhrase()

      const dialog = await findImpactDialog()
      expect(within(dialog).getByText(failedLead)).toBeVisible()
      expect(within(dialog).getByText("We couldn't check this phrase against your mail.")).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save anyway' })).toBeVisible()
      expect(within(dialog).queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
    })

    it('expect a malformed response to count as a failed check', async () => {
      // Two phrase entries for one phrase sent.
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveNewPhrase()

      expect(within(await findImpactDialog()).getByText(failedLead)).toBeVisible()
    })

    it('expect a response that is not an object to count as a failed check', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(undefined as unknown as SpamImpactResponse)

      await saveNewPhrase()

      expect(within(await findImpactDialog()).getByText(failedLead)).toBeVisible()
    })

    it('expect Spam-only matches to give the Spam lead and Save', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamOnly)

      await saveNewPhrase()

      const dialog = await findImpactDialog()
      expect(within(dialog).getByText(spamLead)).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible()
      expect(within(dialog).queryByRole('button', { name: 'Save anyway' })).not.toBeInTheDocument()
    })

    it('expect the Inbox lead before the incomplete lead', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ ...inboxMatch, inboxIncomplete: true })

      await saveNewPhrase()

      const dialog = await findImpactDialog()
      expect(within(dialog).getByText(inboxLead)).toBeVisible()
      expect(within(dialog).queryByText(incompleteLead)).not.toBeInTheDocument()
    })

    it('expect the incomplete lead before the Spam lead', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ ...spamOnly, inboxIncomplete: true })

      await saveNewPhrase()

      const dialog = await findImpactDialog()
      expect(within(dialog).getByText(incompleteLead)).toBeVisible()
      expect(within(dialog).getByRole('button', { name: 'Save anyway' })).toBeVisible()
    })

    it('expect the dialog to open for a Spam match in only one of two phrases, and list both', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactResponse,
        phrases: [spamImpactResponse.phrases[1], { ...spamImpactResponse.phrases[0], inbox: { count: 0, emails: [] } }],
      })

      await saveTwoNewPhrases()

      const dialog = await findImpactDialog()
      expect(within(dialog).getByText('“free lunch”')).toBeVisible()
      expect(within(dialog).getByText('“lottery winner”')).toBeVisible()
      expect(within(dialog).getByText(pluralSpamLead)).toBeVisible()
    })

    it('expect each new phrase listed with its lines and the footnote', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveTwoNewPhrases()

      const dialog = await findImpactDialog()
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

      expect(within(await findImpactDialog()).getByText(/Future mail with this phrase will go to Spam/)).toBeVisible()
    })

    it('expect the footnote to say "these phrases" for two new phrases', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveTwoNewPhrases()

      expect(within(await findImpactDialog()).getByText(/Future mail with these phrases will go to Spam/)).toBeVisible()
    })

    it('expect nothing saved until the owner answers', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()
      await findImpactDialog()

      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('expect Go back to save nothing and return focus to Save', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()
      await userEvent.click(within(await findImpactDialog()).getByRole('button', { name: 'Go back' }))

      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
    })

    it('expect Save anyway to save the new phrase', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(inboxMatch)

      await saveNewPhrase()
      await userEvent.click(within(await findImpactDialog()).getByRole('button', { name: 'Save anyway' }))

      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: withInvoice }),
      )
      expect(await screen.findByText('Settings saved.')).toBeVisible()
    })

    it('expect Save to save the phrase when only Spam matched', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamOnly)

      await saveNewPhrase()
      await userEvent.click(within(await findImpactDialog()).getByRole('button', { name: 'Save' }))

      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ spamFilter: withInvoice }),
      )
    })

    it('expect the plural failed lead when more than one new phrase is checked', async () => {
      jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(new Error('throttled'))

      await saveTwoNewPhrases()

      expect(within(await findImpactDialog()).getByText(pluralFailedLead)).toBeVisible()
    })

    it('expect the plural incomplete lead when more than one new phrase is checked', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactResponse,
        inboxIncomplete: true,
        phrases: [spamImpactResponse.phrases[1], spamImpactResponse.phrases[1]],
      })

      await saveTwoNewPhrases()

      expect(within(await findImpactDialog()).getByText(pluralIncompleteLead)).toBeVisible()
    })

    it('expect the singular Inbox lead when two phrases are checked and only one matches the Inbox', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactResponse)

      await saveTwoNewPhrases()

      expect(within(await findImpactDialog()).getByText(inboxLead)).toBeVisible()
    })

    it('expect the check announced in the status region', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))

      await saveNewPhrase()

      expect(await within(screen.getByRole('status')).findByText('Checking your mail…')).toBeVisible()
    })

    it('expect the forward and bounce lists locked while the check runs', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))

      await saveNewPhrase()
      await screen.findByRole('button', { name: 'Checking your mail…' })

      expect(AddressLine).toHaveBeenLastCalledWith(expect.objectContaining({ disabled: true }), undefined)
      expect(BounceSenderInput).toHaveBeenLastCalledWith(expect.objectContaining({ disabled: true }), undefined)
    })

    it('expect an edit attempted during the check not to change what is saved', async () => {
      let finishCheck: (response: SpamImpactResponse) => void = () => undefined
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise((resolve) => (finishCheck = resolve)))

      await saveNewPhrase()
      await screen.findByRole('button', { name: 'Checking your mail…' })
      await userEvent.type(screen.getByLabelText(/From name/i), ' Jr')
      finishCheck(noMatches)

      expect(await screen.findByText('Settings saved.')).toBeVisible()
      expect(emails.putAccount).toHaveBeenCalledWith(
        user.username,
        expect.objectContaining({ name: account.name, spamFilter: withInvoice }),
      )
    })
  })
})
