import React from 'react'

import SpamNotice, { SpamNoticeProps } from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('SpamNotice component', () => {
  const sender = 'notices@harborcountyvotes.org'
  const onTrust = jest.fn()
  const onDecline = jest.fn()
  const onSuggest = jest.fn()
  const onDismiss = jest.fn()

  const baseProps: SpamNoticeProps = {
    kind: 'not-spam',
    moveId: 'move-1',
    onDecline,
    onDismiss,
    onSuggest,
    onTrust,
    sender,
    trustState: 'offer',
  }

  const getSection = (): HTMLElement => screen.getByRole('status').closest('section') as HTMLElement

  describe('not spam', () => {
    it('announces the move and asks to trust the sender', () => {
      render(<SpamNotice {...baseProps} />)

      expect(screen.getByRole('status')).toHaveTextContent(`Moved to Inbox.Always trust ${sender}?`)
    })

    it('trusts the address', async () => {
      render(<SpamNotice {...baseProps} />)

      await userEvent.click(screen.getByRole('button', { name: 'Trust this address' }))

      expect(onTrust).toHaveBeenCalledWith(sender)
    })

    it('describes "Trust this address" with the question', () => {
      render(<SpamNotice {...baseProps} />)

      expect(screen.getByRole('button', { name: 'Trust this address' })).toHaveAccessibleDescription(
        new RegExp(`^Always trust ${sender} ?\\?$`),
      )
    })

    it('trusts the whole domain', async () => {
      render(<SpamNotice {...baseProps} />)

      await userEvent.click(screen.getByRole('button', { name: 'Trust all @harborcountyvotes.org' }))

      expect(onTrust).toHaveBeenCalledWith('@harborcountyvotes.org')
    })

    it('lowercases the domain rule', () => {
      render(<SpamNotice {...baseProps} sender="News@Example.COM" />)

      expect(screen.getByRole('button', { name: 'Trust all @example.com' })).toBeInTheDocument()
    })

    it('declines', async () => {
      render(<SpamNotice {...baseProps} />)

      await userEvent.click(screen.getByRole('button', { name: 'No thanks' }))

      expect(onDecline).toHaveBeenCalled()
      expect(onTrust).not.toHaveBeenCalled()
    })

    it('offers only the address for free mail', () => {
      render(<SpamNotice {...baseProps} sender="friend@gmail.com" />)

      expect(screen.getByRole('button', { name: 'Trust this address' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Trust all/ })).not.toBeInTheDocument()
    })

    it('offers no trust when the sender has no domain', () => {
      render(<SpamNotice {...baseProps} sender="postmaster" />)

      expect(screen.getByRole('status')).toHaveTextContent(/^Moved to Inbox\.$/)
      expect(screen.queryByRole('button', { name: /Trust/ })).not.toBeInTheDocument()
    })

    it('offers no trust for a sender the API would refuse', () => {
      render(<SpamNotice {...baseProps} sender='"odd user"@example.com' />)

      expect(screen.queryByRole('button', { name: /Trust/ })).not.toBeInTheDocument()
    })

    it('offers an address with an apostrophe in its local part', () => {
      render(<SpamNotice {...baseProps} sender="o'brien@corp.com" />)

      expect(screen.getByRole('button', { name: 'Trust this address' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Trust all @corp.com' })).toBeInTheDocument()
    })

    it('says one more email is in Spam', () => {
      render(<SpamNotice {...baseProps} otherFromSender={1} />)

      expect(
        screen.getByText(
          'Spam has 1 more email from this sender. Trusting a sender only affects new mail, so move it with Not spam.',
        ),
      ).toBeVisible()
    })

    it('says several more emails are in Spam', () => {
      render(<SpamNotice {...baseProps} otherFromSender={3} />)

      expect(
        screen.getByText(
          'Spam has 3 more emails from this sender. Trusting a sender only affects new mail, so move them with Not spam.',
        ),
      ).toBeVisible()
    })

    it('omits the count when no other email is in Spam', () => {
      render(<SpamNotice {...baseProps} otherFromSender={0} />)

      expect(screen.queryByText(/Spam has/)).not.toBeInTheDocument()
    })

    it('shows saving and ignores presses while saving', async () => {
      render(<SpamNotice {...baseProps} trustState="saving" />)

      expect(screen.getByText('Saving…')).toBeVisible()
      await userEvent.click(screen.getByRole('button', { name: 'Trust this address' }))
      await userEvent.click(screen.getByRole('button', { name: 'Trust all @harborcountyvotes.org' }))
      await userEvent.click(screen.getByRole('button', { name: 'No thanks' }))

      expect(onTrust).not.toHaveBeenCalled()
      expect(onDecline).not.toHaveBeenCalled()
    })

    it('confirms the trusted sender', () => {
      render(<SpamNotice {...baseProps} trustState="accepted" trustedValue="@harborcountyvotes.org" />)

      expect(screen.getByRole('status')).toHaveTextContent(
        'Moved to Inbox.@harborcountyvotes.org added to trusted senders.',
      )
      expect(screen.queryByRole('button', { name: 'Trust this address' })).not.toBeInTheDocument()
    })

    it('shows only the move once declined', () => {
      render(<SpamNotice {...baseProps} trustState="declined" />)

      expect(screen.getByRole('status')).toHaveTextContent(/^Moved to Inbox\.$/)
      expect(screen.queryByRole('button', { name: 'No thanks' })).not.toBeInTheDocument()
    })

    it('explains a full trusted senders list', () => {
      render(<SpamNotice {...baseProps} trustState="full" />)

      expect(
        screen.getByText(
          'Your trusted senders list is full — 100 is the limit. Remove one under Spam filter in Settings, then add this sender there.',
        ),
      ).toBeVisible()
      expect(screen.queryByRole('button', { name: 'Trust this address' })).not.toBeInTheDocument()
    })

    it('shows no offer without a sender', () => {
      render(<SpamNotice {...baseProps} sender={undefined} />)

      expect(screen.getByRole('status')).toHaveTextContent(/^Moved to Inbox\.$/)
      expect(screen.queryByRole('button', { name: 'Trust this address' })).not.toBeInTheDocument()
    })
  })

  describe('moved to spam', () => {
    it('offers rule suggestions', async () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" />)

      expect(screen.getByRole('status')).toHaveTextContent(
        'Moved to Spam.Want fewer emails like this? We can read this one and suggest changes to your spam rules.',
      )
      await userEvent.click(screen.getByRole('button', { name: 'Suggest rule changes' }))

      expect(onSuggest).toHaveBeenCalled()
    })

    it('does not offer trust', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" />)

      expect(screen.queryByRole('button', { name: 'Trust this address' })).not.toBeInTheDocument()
    })

    it('confirms one saved change', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" updatedCount={1} />)

      expect(screen.getByRole('status')).toHaveTextContent(
        'Moved to Spam.1 rule change saved.You can change your spam filter anytime in Settings.',
      )
      expect(screen.queryByRole('button', { name: 'Suggest rule changes' })).not.toBeInTheDocument()
    })

    it('confirms several saved changes', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" updatedCount={2} />)

      expect(screen.getByText('2 rule changes saved.')).toBeVisible()
    })

    it('says the picks were already rules when nothing changed', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" updatedCount={0} />)

      expect(screen.getByRole('status')).toHaveTextContent(
        'Moved to Spam.Those changes were already in your rules.You can change your spam filter anytime in Settings.',
      )
      expect(screen.queryByText(/rule changes saved/)).not.toBeInTheDocument()
    })
  })

  describe('focus and dismissal', () => {
    it('takes focus when shown', () => {
      render(<SpamNotice {...baseProps} />)

      expect(getSection()).toHaveFocus()
    })

    it('takes focus again for a new move', () => {
      const { rerender } = render(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} />
        </>,
      )
      screen.getByRole('button', { name: 'Elsewhere' }).focus()

      rerender(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} kind="moved-to-spam" />
        </>,
      )

      expect(getSection()).toHaveFocus()
    })

    it('takes focus again for a new move of the same kind and sender', () => {
      const { rerender } = render(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} />
        </>,
      )
      screen.getByRole('button', { name: 'Elsewhere' }).focus()

      rerender(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} moveId="move-2" />
        </>,
      )

      expect(getSection()).toHaveFocus()
    })

    it('takes focus when rule changes are saved', () => {
      const { rerender } = render(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} kind="moved-to-spam" />
        </>,
      )
      screen.getByRole('button', { name: 'Elsewhere' }).focus()

      rerender(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} kind="moved-to-spam" updatedCount={1} />
        </>,
      )

      expect(getSection()).toHaveFocus()
    })

    it('takes focus back when the pressed button goes away', async () => {
      const { rerender } = render(<SpamNotice {...baseProps} />)
      await userEvent.click(screen.getByRole('button', { name: 'Trust this address' }))

      rerender(<SpamNotice {...baseProps} trustState="accepted" trustedValue={sender} />)

      expect(getSection()).toHaveFocus()
    })

    it('leaves focus alone on a state change when focus is elsewhere', () => {
      const { rerender } = render(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} />
        </>,
      )
      screen.getByRole('button', { name: 'Elsewhere' }).focus()

      rerender(
        <>
          <button>Elsewhere</button>
          <SpamNotice {...baseProps} trustState="declined" />
        </>,
      )

      expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus()
    })

    it('dismisses with the Dismiss button', async () => {
      render(<SpamNotice {...baseProps} />)

      await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

      expect(onDismiss).toHaveBeenCalled()
    })

    it('dismisses with Escape', async () => {
      render(<SpamNotice {...baseProps} />)

      await userEvent.keyboard('{Escape}')

      expect(onDismiss).toHaveBeenCalled()
    })

    it('ignores other keys', async () => {
      render(<SpamNotice {...baseProps} />)

      await userEvent.keyboard('{Enter}')

      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('never traps focus', async () => {
      render(
        <>
          <SpamNotice {...baseProps} />
          <button>After</button>
        </>,
      )

      await userEvent.tab()
      await userEvent.tab()
      await userEvent.tab()
      await userEvent.tab()
      await userEvent.tab()

      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
    })
  })
})
