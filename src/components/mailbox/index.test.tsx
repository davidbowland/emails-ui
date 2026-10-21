import { getCurrentUser } from 'aws-amplify/auth'
import React from 'react'

import Mailbox, { MailboxProps } from './index'
import EmailViewer, { EmailViewerProps } from '@components/email-viewer'
import SpamSuggestions from '@components/spam-suggestions'
import { getAccount, putAccount } from '@services/emails'
import { account, email, emailBatch, emailContents, emailId, user, accountId } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailBatch } from '@types'

jest.mock('aws-amplify/auth')
jest.mock('@components/email-viewer')
jest.mock('@components/spam-suggestions')
jest.mock('@services/emails')
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
jest.mock('@config/amplify')

describe('Mailbox component', () => {
  const bounceEmail = jest.fn().mockResolvedValue(email)
  const deleteEmail = jest.fn().mockResolvedValue(email)
  const getAllEmails = jest.fn().mockResolvedValue(emailBatch)
  const getEmailAttachment = jest.fn()
  const getEmailContents = jest.fn().mockResolvedValue(emailContents)
  const patchEmail = jest.fn().mockResolvedValue(undefined)

  beforeAll(() => {
    jest.mocked(getCurrentUser).mockResolvedValue(user)
    jest.mocked(EmailViewer).mockReturnValue(<>Email contents</>)

    console.error = jest.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
  })

  it('should show error message when user is not logged in', async () => {
    jest.mocked(getCurrentUser).mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/We couldn't sign you in. Reload the page to try again./i)).toBeVisible()
  })

  it('should remove error when closing snackbar', async () => {
    jest.mocked(getCurrentUser).mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/We couldn't sign you in. Reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(closeSnackbarButton)
    })

    expect(screen.queryByText(/We couldn't sign you in. Reload the page to try again./i)).not.toBeInTheDocument()
  })

  it('should show error message when getAllEmails fails', async () => {
    getAllEmails.mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/Couldn't load your emails. Reload the page to try again./i)).toBeVisible()
  })

  it('should render the email list', async () => {
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/Hello, world of email/i)).toBeVisible()
  })

  it('should show message when mailbox is empty', async () => {
    getAllEmails.mockResolvedValueOnce([])
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/This mailbox is empty/i)).toBeVisible()
  })

  it('should render email content when clicking on an email', async () => {
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement

    await act(async () => {
      await userEvent.click(emailElement)
    })

    expect(await screen.findByText(/Email contents/i)).toBeVisible()
    expect(EmailViewer).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: user.username, bounced: undefined, email: emailContents, emailId }),
      undefined,
    )
    expect(patchEmail).toHaveBeenCalledWith(user.username, emailId, [{ op: 'replace', path: '/viewed', value: true }])
  })

  it('should show error message when getEmailContents fails', async () => {
    getEmailContents.mockRejectedValueOnce(undefined).mockRejectedValueOnce(undefined)
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Select an email to view/i)
    const emailElement = (await screen.findByText(/Hello, world of email/i)) as HTMLBaseElement

    await act(async () => {
      await userEvent.click(emailElement)
    })

    expect(await screen.findByText(/Couldn't load this email. Please try again./i)).toBeVisible()
  })

  it('should invoke bounceEmail and refresh email list when bouncing an email', async () => {
    const bouncableEmailBatch = [
      {
        accountId,
        data: {
          ...email,
          canBeBounced: true,
        },
        id: emailId,
      },
    ]
    getAllEmails.mockResolvedValueOnce(bouncableEmailBatch).mockResolvedValueOnce(bouncableEmailBatch)

    jest.mocked(EmailViewer).mockImplementationOnce(({ bounceEmail }) => {
      bounceEmail?.(user.username as string, emailId)
      return <>Bounce invoked</>
    })
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Bounce invoked/i)
    await waitFor(() => {
      expect(bounceEmail).toHaveBeenCalledWith(user.username, emailId)
    })
    expect(getAllEmails).toHaveBeenCalledWith(user.username)
  })

  it('should invoke deleteEmail and refresh email list when deleting an email', async () => {
    jest.mocked(EmailViewer).mockImplementationOnce(({ deleteEmail }) => {
      deleteEmail?.(user.username as string, emailId)
      return <>Delete invoked</>
    })
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Delete invoked/i)
    await waitFor(() => {
      expect(deleteEmail).toHaveBeenCalledWith(user.username, emailId)
    })
    expect(getAllEmails).toHaveBeenCalledWith(user.username)
  })

  it('should show email content when clicking forward button', async () => {
    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(forwardButton)
    })

    await waitFor(() => {
      expect(screen.queryByText(/Email contents/i)).toBeVisible()
    })
  })

  it('should return to email list when clicking back button', async () => {
    getAllEmails.mockResolvedValueOnce(emailBatch)

    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    const forwardButton = (await screen.findByLabelText(/Show selected email/i, {
      selector: 'button',
    })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(forwardButton)
    })

    const backButton = (await screen.findByLabelText(/Back to email list/i, {
      selector: 'button',
    })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(backButton)
    })

    expect(await screen.findByText(/4\/13\/1975, \d+:21:13 PM/i)).toBeVisible()
  })

  it('should display bounced chip when email is bounced', async () => {
    const bouncedEmailBatch = [
      {
        accountId,
        data: {
          ...email,
          bounced: true,
        },
        id: emailId,
      },
    ]
    getAllEmails.mockResolvedValueOnce(bouncedEmailBatch)

    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    expect(await screen.findByText(/Bounced/i)).toBeVisible()
  })

  it('should not display bounced chip when email is not bounced', async () => {
    const nonBouncedEmailBatch = [
      {
        accountId,
        data: {
          ...email,
          bounced: false,
        },
        id: emailId,
      },
    ]
    getAllEmails.mockResolvedValueOnce(nonBouncedEmailBatch)

    render(
      <Mailbox
        bounceEmail={bounceEmail}
        deleteEmail={deleteEmail}
        getAllEmails={getAllEmails}
        getEmailAttachment={getEmailAttachment}
        getEmailContents={getEmailContents}
        patchEmail={patchEmail}
      />,
    )

    await screen.findByText(/Hello, world of email/i)
    expect(screen.queryByText(/Bounced/i)).not.toBeInTheDocument()
  })
  describe('service worker messages', () => {
    // A real EventTarget rather than a mock pair, so the test drives the listener the way the
    // browser does -- which is the only way a stale-closure registration would show up.
    const serviceWorker = new EventTarget()

    beforeAll(() => {
      Object.defineProperty(window.navigator, 'serviceWorker', {
        configurable: true,
        value: serviceWorker,
      })
    })

    const postToPage = async (data: unknown): Promise<void> => {
      await act(async () => {
        serviceWorker.dispatchEvent(new MessageEvent('message', { data }))
      })
    }

    // The mailbox settles at TWO loads on mount: the initial fetch, then the refresh that
    // follows marking the first email as viewed. Waiting for that second load is what makes the
    // counts below deterministic -- the act() around dispatchEvent is otherwise what flushes the
    // mark-as-viewed chain, so an unrelated load would land on whichever test dispatched first.
    const renderSettledMailbox = async () => {
      const view = render(
        <Mailbox
          deleteEmail={deleteEmail}
          getAllEmails={getAllEmails}
          getEmailAttachment={getEmailAttachment}
          getEmailContents={getEmailContents}
          patchEmail={patchEmail}
        />,
      )
      await waitFor(() => expect(getAllEmails).toHaveBeenCalledTimes(2))
      return view
    }

    it('refreshes the mailbox when the worker says an email arrived', async () => {
      await renderSettledMailbox()

      await postToPage({ type: 'refresh-inbox' })

      expect(getAllEmails).toHaveBeenCalledTimes(3)
      expect(getAllEmails).toHaveBeenLastCalledWith(user.username)
    })

    it('ignores a message it does not recognize', async () => {
      await renderSettledMailbox()

      await postToPage({ type: 'something-else' })

      expect(getAllEmails).toHaveBeenCalledTimes(2)
    })

    it('ignores a message with no data', async () => {
      await renderSettledMailbox()

      await postToPage(undefined)

      expect(getAllEmails).toHaveBeenCalledTimes(2)
    })

    it('stops listening once the mailbox unmounts', async () => {
      const { unmount } = await renderSettledMailbox()
      unmount()

      await postToPage({ type: 'refresh-inbox' })

      expect(getAllEmails).toHaveBeenCalledTimes(2)
    })
  })

  describe('folders', () => {
    it.each([
      ['spam', 'No spam right now'],
      ['inbox', 'This mailbox is empty'],
    ] as const)('should show the %s empty state with a decorative icon', async (folder, emptyText) => {
      getAllEmails.mockResolvedValueOnce([])
      render(
        <Mailbox
          deleteEmail={deleteEmail}
          folder={folder}
          getAllEmails={getAllEmails}
          getEmailAttachment={getEmailAttachment}
          getEmailContents={getEmailContents}
          patchEmail={patchEmail}
        />,
      )

      expect(await screen.findByText(emptyText)).toBeInTheDocument()
      screen.getAllByTestId('icon-Mail').forEach((icon) => expect(icon).toHaveAttribute('aria-hidden', 'true'))
    })

    it.each([
      ['spam', 'Spam emails'],
      ['inbox', 'Inbox emails'],
    ] as const)('should name the %s list', async (folder, listName) => {
      render(
        <Mailbox
          deleteEmail={deleteEmail}
          folder={folder}
          getAllEmails={getAllEmails}
          getEmailAttachment={getEmailAttachment}
          getEmailContents={getEmailContents}
          patchEmail={patchEmail}
        />,
      )

      expect(await screen.findByRole('navigation', { name: listName })).toBeInTheDocument()
    })

    it('should offer no move actions in a mailbox without a folder (Sent)', async () => {
      render(
        <Mailbox
          deleteEmail={deleteEmail}
          getAllEmails={getAllEmails}
          getEmailAttachment={getEmailAttachment}
          getEmailContents={getEmailContents}
          moveEmail={jest.fn()}
          patchEmail={patchEmail}
        />,
      )

      await waitFor(() => expect(EmailViewer).toHaveBeenCalled())
      expect(EmailViewer).toHaveBeenLastCalledWith(
        expect.objectContaining({ onMoveToSpam: undefined, onNotSpam: undefined }),
        undefined,
      )
      expect(screen.queryByRole('navigation', { name: /emails/i })).not.toBeInTheDocument()
      expect(SpamSuggestions).not.toHaveBeenCalled()
    })
  })

  describe('moving emails', () => {
    const sender = 'notices@harborvotes.org'
    const batch = (id: string, from: string, subject: string, timestamp: number): EmailBatch => ({
      accountId,
      data: { from, subject, timestamp, to: ['account@domain.com'], viewed: true },
      id,
    })
    const first = batch('s1', `"Harbor County" <${sender}>`, 'Polling place notice', 3000)
    const second = batch('s2', sender, 'Second notice', 2000)
    const third = batch('s3', 'deals@gmail.com', 'Free offer', 1000)
    const moveEmail = jest.fn()
    const originalMatchMedia = window.matchMedia

    // Stands in for the viewer: its action group holds the move buttons it was given.
    const FakeViewer = ({ accountId, emailId, onMoveToSpam, onNotSpam }: EmailViewerProps): React.ReactNode => (
      <div data-email-actions="">
        <span>Viewing {emailId}</span>
        {onNotSpam && <button onClick={() => onNotSpam(accountId, emailId).catch(() => undefined)}>Not spam</button>}
        {onMoveToSpam && (
          <button onClick={() => onMoveToSpam(accountId, emailId).catch(() => undefined)}>Move to spam</button>
        )}
      </div>
    )

    const setViewport = (wide: boolean): jest.Mock => {
      const matchMedia = jest.fn().mockReturnValue({ matches: wide })
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia })
      return matchMedia
    }

    beforeAll(() => {
      jest.mocked(EmailViewer).mockImplementation(FakeViewer)
      jest.mocked(SpamSuggestions).mockImplementation(({ emailId, onApplied, onClose, open }) =>
        open ? (
          <div role="dialog">
            Suggestions for {emailId}
            <button onClick={() => onApplied(2)}>Apply 2 changes</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        ) : null,
      )
      jest.mocked(getAccount).mockResolvedValue(account)
      jest.mocked(putAccount).mockResolvedValue(account)
      moveEmail.mockResolvedValue(email)
    })

    afterAll(() => {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia })
    })

    // Renders a settled folder with its first email selected.
    const setup = async (folder: MailboxProps['folder'], before: EmailBatch[], wide = true): Promise<jest.Mock> => {
      const matchMedia = setViewport(wide)
      getAllEmails.mockResolvedValueOnce(before)
      render(
        <Mailbox
          deleteEmail={deleteEmail}
          folder={folder}
          getAllEmails={getAllEmails}
          getEmailAttachment={getEmailAttachment}
          getEmailContents={getEmailContents}
          moveEmail={moveEmail}
          patchEmail={patchEmail}
        />,
      )
      await screen.findByText(`Viewing ${before[0].id}`)
      return matchMedia
    }

    const click = async (name: string | RegExp): Promise<void> => {
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name }))
      })
    }

    // Clicks a move action whose reload after the move returns `after`.
    const move = async (name: string, after: EmailBatch[]): Promise<void> => {
      getAllEmails.mockResolvedValueOnce(after)
      await click(name)
    }

    const noticeOf = (text: string | RegExp): HTMLElement => screen.getByText(text).closest('section') as HTMLElement

    describe('Not spam', () => {
      it('should move the email to the Inbox, refresh, select the next email and focus the notice', async () => {
        await setup('spam', [first, second, third])

        await move('Not spam', [second, third])

        expect(moveEmail).toHaveBeenCalledWith(accountId, 's1', 'inbox')
        expect(getAllEmails).toHaveBeenCalledTimes(2)
        expect(await screen.findByText('Viewing s2')).toBeInTheDocument()
        expect(getEmailContents).toHaveBeenLastCalledWith(accountId, 's2')
        expect(screen.queryByText('Polling place notice')).not.toBeInTheDocument()
        expect(noticeOf('Moved to Inbox.')).toHaveFocus()
        expect(within(noticeOf('Moved to Inbox.')).getByText(sender)).toBeInTheDocument()
        expect(screen.getByText(/Spam has 1 more email from this sender/)).toBeInTheDocument()
        expect(SpamSuggestions).not.toHaveBeenCalled()
      })

      it('should place the notice in the viewer, after the list, at md and up', async () => {
        const matchMedia = await setup('spam', [first, second])

        await move('Not spam', [second])

        expect(matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
        const list = screen.getByRole('navigation', { name: 'Spam emails' })
        expect(list.compareDocumentPosition(noticeOf('Moved to Inbox.'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
      })

      it('should return to the list below md, with the notice on top of it and focused', async () => {
        await setup('spam', [first, second], false)

        await move('Not spam', [second])

        const notice = noticeOf('Moved to Inbox.')
        const list = screen.getByRole('navigation', { name: 'Spam emails' })
        expect(notice.compareDocumentPosition(list)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(notice).toHaveFocus()
        // The next email is loaded for later, without leaving the list.
        expect(getEmailContents).toHaveBeenLastCalledWith(accountId, 's2')
      })

      it('should leave the list and show no notice when the move fails', async () => {
        moveEmail.mockRejectedValueOnce(new Error('Network Error'))
        await setup('spam', [first, second])

        await click('Not spam')

        expect(getAllEmails).toHaveBeenCalledTimes(1)
        expect(screen.getByText('Polling place notice')).toBeInTheDocument()
        expect(screen.queryByText('Moved to Inbox.')).not.toBeInTheDocument()
      })

      it('should drop the moved email and still show the notice when the reload fails', async () => {
        await setup('spam', [first, second])

        getAllEmails.mockRejectedValueOnce(new Error('Network Error'))
        await click('Not spam')

        expect(await screen.findByText(/Couldn't load your emails/)).toBeInTheDocument()
        expect(screen.queryByText('Polling place notice')).not.toBeInTheDocument()
        expect(noticeOf('Moved to Inbox.')).toHaveFocus()
        expect(screen.getByText(/Spam has 1 more email/)).toBeInTheDocument()
      })

      it('should take focus again on a second move', async () => {
        await setup('spam', [first, second, third])
        await move('Not spam', [second, third])
        await screen.findByText('Viewing s2')
        screen.getByRole('button', { name: 'Not spam' }).focus()
        await move('Not spam', [third])

        expect(moveEmail).toHaveBeenLastCalledWith(accountId, 's2', 'inbox')
        expect(await screen.findByText('Viewing s3')).toBeInTheDocument()
        expect(noticeOf('Moved to Inbox.')).toHaveFocus()
        expect(screen.queryByText(/more email/)).not.toBeInTheDocument()
      })

      it('should show the empty Spam state after moving the last email', async () => {
        await setup('spam', [first])

        await move('Not spam', [])

        expect(await screen.findByText('No spam right now')).toBeInTheDocument()
        expect(screen.getByText('Select an email to view')).toBeInTheDocument()
        expect(noticeOf('Moved to Inbox.')).toHaveFocus()
      })

      it('should keep a refresh that started before the move from showing the moved email again', async () => {
        const unreadFirst = { ...first, data: { ...first.data, viewed: false } }
        let resolveStaleLoad: (emails: EmailBatch[]) => void = () => undefined
        const staleLoad = new Promise<EmailBatch[]>((resolve) => {
          resolveStaleLoad = resolve
        })
        setViewport(true)
        // The initial load, the refresh after marking s1 read (held open), then the reload after the move.
        getAllEmails
          .mockResolvedValueOnce([unreadFirst, second])
          .mockReturnValueOnce(staleLoad)
          .mockResolvedValueOnce([second])
        render(
          <Mailbox
            deleteEmail={deleteEmail}
            folder="spam"
            getAllEmails={getAllEmails}
            getEmailAttachment={getEmailAttachment}
            getEmailContents={getEmailContents}
            moveEmail={moveEmail}
            patchEmail={patchEmail}
          />,
        )
        await screen.findByText('Viewing s1')
        await waitFor(() => expect(getAllEmails).toHaveBeenCalledTimes(2))

        await click('Not spam')
        await screen.findByText('Viewing s2')
        await act(async () => {
          resolveStaleLoad([unreadFirst, second])
        })

        expect(screen.queryByText('Polling place notice')).not.toBeInTheDocument()
        expect(screen.getByText('Second notice')).toBeInTheDocument()
      })

      it('should offer no trust when the sender has no address', async () => {
        await setup('spam', [batch('s9', 'unknown', 'No sender', 4000)])

        await move('Not spam', [])

        expect(await screen.findByText('Moved to Inbox.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Trust/ })).not.toBeInTheDocument()
      })
    })

    describe('trusting the sender', () => {
      const moveFirst = async (): Promise<void> => {
        await setup('spam', [first, second])
        await move('Not spam', [second])
        await screen.findByText('Moved to Inbox.')
      }

      it('should add the address to trusted senders', async () => {
        await moveFirst()

        await click('Trust this address')

        expect(getAccount).toHaveBeenCalledWith(accountId)
        expect(putAccount).toHaveBeenCalledWith(accountId, {
          ...account,
          spamFilter: { blockPhrases: [], sensitivity: 'medium', trustedSenders: [sender] },
        })
        expect(await screen.findByText(/added to trusted senders/)).toBeInTheDocument()
      })

      it('should add the domain to an existing trusted senders list', async () => {
        const spamFilter = { blockPhrases: ['crypto'], sensitivity: 'high' as const, trustedSenders: ['a@b.com'] }
        jest.mocked(getAccount).mockResolvedValueOnce({ ...account, spamFilter })
        await moveFirst()

        await click('Trust all @harborvotes.org')

        expect(putAccount).toHaveBeenCalledWith(accountId, {
          ...account,
          spamFilter: { ...spamFilter, trustedSenders: ['a@b.com', '@harborvotes.org'] },
        })
        expect(await screen.findByText('@harborvotes.org')).toBeInTheDocument()
      })

      it('should accept a sender that is already trusted without saving', async () => {
        jest.mocked(getAccount).mockResolvedValueOnce({
          ...account,
          spamFilter: { blockPhrases: [], sensitivity: 'medium', trustedSenders: ['Notices@HarborVotes.org'] },
        })
        await moveFirst()

        await click('Trust this address')

        expect(await screen.findByText(/added to trusted senders/)).toBeInTheDocument()
        expect(putAccount).not.toHaveBeenCalled()
      })

      it('should show the list-full message without saving when the list is full', async () => {
        const trustedSenders = Array.from({ length: 100 }, (_, index) => `user${index}@domain.com`)
        jest.mocked(getAccount).mockResolvedValueOnce({
          ...account,
          spamFilter: { blockPhrases: [], sensitivity: 'medium', trustedSenders },
        })
        await moveFirst()

        await click('Trust this address')

        expect(await screen.findByText(/Your trusted senders list is full/)).toBeInTheDocument()
        expect(putAccount).not.toHaveBeenCalled()
      })

      it('should keep the offer and explain when saving fails', async () => {
        jest.mocked(putAccount).mockRejectedValueOnce(new Error('Network Error'))
        await moveFirst()

        await click('Trust this address')

        expect(
          await screen.findByText("We couldn't add that trusted sender. Nothing changed — try again."),
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Trust this address' })).toBeInTheDocument()
      })

      it('should show the list-full message when the save is refused for the list limit', async () => {
        jest.mocked(putAccount).mockRejectedValueOnce(Object.assign(new Error('Bad Request'), { status: 400 }))
        await moveFirst()

        await click('Trust this address')

        expect(await screen.findByText(/Your trusted senders list is full/)).toBeInTheDocument()
        expect(screen.queryByText(/We couldn't add that trusted sender/)).not.toBeInTheDocument()
      })

      it('should keep the offer when the account cannot be read', async () => {
        jest.mocked(getAccount).mockRejectedValueOnce(new Error('Network Error'))
        await moveFirst()

        await click('Trust this address')

        expect(await screen.findByText(/We couldn't add that trusted sender/)).toBeInTheDocument()
        expect(putAccount).not.toHaveBeenCalled()
      })

      it('should save nothing when declined', async () => {
        await moveFirst()

        await click('No thanks')

        expect(screen.queryByRole('button', { name: /Trust/ })).not.toBeInTheDocument()
        expect(screen.getByText('Moved to Inbox.')).toBeInTheDocument()
        expect(getAccount).not.toHaveBeenCalled()
        expect(putAccount).not.toHaveBeenCalled()
      })

      it('should offer only the address for a free-mail sender', async () => {
        await setup('spam', [batch('s4', 'deals@gmail.com', 'Free offer', 5000), first])

        await move('Not spam', [first])

        expect(moveEmail).toHaveBeenCalledWith(accountId, 's4', 'inbox')
        expect(await screen.findByRole('button', { name: 'Trust this address' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Trust all/ })).not.toBeInTheDocument()
      })
    })

    describe('marking the next email read', () => {
      const unreadSecond = { ...second, data: { ...second.data, viewed: false } }

      it('should not mark the next email read below md while the list is showing', async () => {
        await setup('spam', [first, unreadSecond], false)

        await move('Not spam', [unreadSecond])
        await screen.findByText('Viewing s2')

        expect(patchEmail).not.toHaveBeenCalled()
      })

      it('should mark the next email read below md once the user opens it', async () => {
        await setup('spam', [first, unreadSecond], false)
        await move('Not spam', [unreadSecond])
        await screen.findByText('Viewing s2')

        await click('Show selected email')

        expect(patchEmail).toHaveBeenCalledWith(accountId, 's2', [{ op: 'replace', path: '/viewed', value: true }])
      })

      it('should mark the next email read at md and up, where it is shown', async () => {
        await setup('spam', [first, unreadSecond])

        await move('Not spam', [unreadSecond])

        await waitFor(() =>
          expect(patchEmail).toHaveBeenCalledWith(accountId, 's2', [{ op: 'replace', path: '/viewed', value: true }]),
        )
      })
    })

    describe('dismissing the notice', () => {
      it('should return focus to the first viewer action at md and up', async () => {
        await setup('spam', [first, second])
        await move('Not spam', [second])
        await screen.findByText('Viewing s2')

        await click('Dismiss')

        expect(screen.queryByText('Moved to Inbox.')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Not spam' })).toHaveFocus()
      })

      it('should return focus to the first viewer action on Escape', async () => {
        await setup('spam', [first, second])
        await move('Not spam', [second])
        await screen.findByText('Viewing s2')

        await act(async () => {
          await userEvent.keyboard('{Escape}')
        })

        expect(screen.queryByText('Moved to Inbox.')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Not spam' })).toHaveFocus()
      })

      it('should return focus to the list below md', async () => {
        await setup('spam', [first, second], false)
        await move('Not spam', [second])

        await click('Dismiss')

        expect(screen.getByRole('navigation', { name: 'Spam emails' })).toHaveFocus()
      })

      it('should return focus to the list when the viewer has no actions', async () => {
        await setup('spam', [first])
        await move('Not spam', [])

        await click('Dismiss')

        expect(document.activeElement).toHaveTextContent('No spam right now')
      })
    })

    describe('Move to spam', () => {
      const inboxFirst = batch('i1', 'pitch@agency.com', 'App development offer', 3000)
      const inboxSecond = batch('i2', 'friend@domain.com', 'Lunch?', 2000)

      it('should move the email to Spam and offer suggestions', async () => {
        await setup('inbox', [inboxFirst, inboxSecond])

        await move('Move to spam', [inboxSecond])

        expect(moveEmail).toHaveBeenCalledWith(accountId, 'i1', 'spam')
        expect(await screen.findByText('Viewing i2')).toBeInTheDocument()
        expect(noticeOf('Moved to Spam.')).toHaveFocus()
        expect(screen.getByRole('button', { name: 'Suggest rule changes' })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Trust/ })).not.toBeInTheDocument()
      })

      it('should open suggestions for the moved email with the Inbox list', async () => {
        await setup('inbox', [inboxFirst, inboxSecond])
        await move('Move to spam', [inboxSecond])

        await click('Suggest rule changes')

        expect(screen.getByRole('dialog')).toHaveTextContent('Suggestions for i1')
        expect(SpamSuggestions).toHaveBeenLastCalledWith(
          expect.objectContaining({ accountId, emailId: 'i1', inboxEmails: [inboxSecond], open: true }),
          undefined,
        )
      })

      it('should close suggestions and confirm the saved changes once applied', async () => {
        await setup('inbox', [inboxFirst, inboxSecond])
        await move('Move to spam', [inboxSecond])
        await click('Suggest rule changes')

        await click('Apply 2 changes')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByText('2 rule changes saved.')).toBeInTheDocument()
        expect(noticeOf('Moved to Spam.')).toHaveFocus()
      })

      it('should close suggestions and keep the offer when cancelled', async () => {
        await setup('inbox', [inboxFirst, inboxSecond])
        await move('Move to spam', [inboxSecond])
        await click('Suggest rule changes')

        await click('Cancel')

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Suggest rule changes' })).toBeInTheDocument()
      })

      it('should keep suggestions mounted but closed before any move', async () => {
        await setup('inbox', [inboxFirst, inboxSecond])

        expect(SpamSuggestions).toHaveBeenLastCalledWith(
          expect.objectContaining({ emailId: '', open: false }),
          undefined,
        )
      })
    })
  })
})
