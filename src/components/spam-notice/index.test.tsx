import React from 'react'

import SpamNotice, { movedEmailName, SpamNoticeProps, subjectName } from './index'
import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('SpamNotice component', () => {
  const sender = 'notices@harborcountyvotes.org'
  const from = `Harbor County Votes <${sender}>`
  const subject = 'Your ballot is ready'
  const moved = `“${subject}” from ${from}`
  const onTrust = jest.fn()
  const onDecline = jest.fn()
  const onSuggest = jest.fn()
  const onDismiss = jest.fn()

  const baseProps: SpamNoticeProps = {
    from,
    kind: 'not-spam',
    moveId: 'move-1',
    onDecline,
    onDismiss,
    onSuggest,
    onTrust,
    sender,
    subject,
    trustState: 'offer',
  }

  const getSection = (): HTMLElement => screen.getByRole('status').closest('section') as HTMLElement

  describe('not spam', () => {
    it('announces the move and asks to trust the sender', () => {
      render(<SpamNotice {...baseProps} />)

      expect(screen.getByRole('status')).toHaveTextContent(`Moved to Inbox:${moved}Always trust ${sender}?`)
    })

    it('trusts the address', async () => {
      render(<SpamNotice {...baseProps} />)

      await userEvent.click(screen.getByRole('button', { name: `Trust ${sender}` }))

      expect(onTrust).toHaveBeenCalledWith(sender)
    })

    it('names the address on the trust button, with the full label as its tooltip', () => {
      const long = `${'x'.repeat(60)}@${'y'.repeat(60)}.example`
      render(<SpamNotice {...baseProps} sender={long} />)

      expect(screen.getByRole('button', { name: `Trust ${long}` })).toHaveAttribute('title', `Trust ${long}`)
    })

    it('describes the address trust button with the question', () => {
      render(<SpamNotice {...baseProps} />)

      expect(screen.getByRole('button', { name: `Trust ${sender}` })).toHaveAccessibleDescription(
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

      expect(screen.getByRole('button', { name: 'Trust friend@gmail.com' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Trust all/ })).not.toBeInTheDocument()
    })

    it('offers no trust when the sender has no domain', () => {
      render(<SpamNotice {...baseProps} sender="postmaster" />)

      expect(screen.getByRole('status')).toHaveTextContent(`Moved to Inbox:${moved}`, { normalizeWhitespace: true })
      expect(screen.queryByRole('button', { name: /Trust/ })).not.toBeInTheDocument()
    })

    it('offers no trust for a sender the API would refuse', () => {
      render(<SpamNotice {...baseProps} sender='"odd user"@example.com' />)

      expect(screen.queryByRole('button', { name: /Trust/ })).not.toBeInTheDocument()
    })

    it('offers an address with an apostrophe in its local part', () => {
      render(<SpamNotice {...baseProps} sender="o'brien@corp.com" />)

      expect(screen.getByRole('button', { name: "Trust o'brien@corp.com" })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Trust all @corp.com' })).toBeInTheDocument()
    })

    it('says one more email is in Spam', () => {
      render(<SpamNotice {...baseProps} otherFromSender={1} />)

      expect(screen.getByText(/^Spam has 1 more/)).toHaveTextContent(
        `Spam has 1 more email from ${sender}. Trusting a sender only affects new mail, so move it with Not spam.`,
      )
    })

    it('says several more emails are in Spam', () => {
      render(<SpamNotice {...baseProps} otherFromSender={3} />)

      expect(screen.getByText(/^Spam has 3 more/)).toHaveTextContent(
        `Spam has 3 more emails from ${sender}. Trusting a sender only affects new mail, so move them with Not spam.`,
      )
    })

    it('omits the count when no other email is in Spam', () => {
      render(<SpamNotice {...baseProps} otherFromSender={0} />)

      expect(screen.queryByText(/Spam has/)).not.toBeInTheDocument()
    })

    it('shows saving and ignores presses while saving', async () => {
      render(<SpamNotice {...baseProps} trustState="saving" />)

      expect(screen.getByText('Saving…', { selector: 'p' })).toBeVisible()
      const busyButtons = screen.getAllByRole('button', { name: 'Saving…' })
      expect(busyButtons).toHaveLength(3)
      await userEvent.click(busyButtons[0])
      await userEvent.click(busyButtons[1])
      await userEvent.click(busyButtons[2])

      expect(onTrust).not.toHaveBeenCalled()
      expect(onDecline).not.toHaveBeenCalled()
    })

    it('marks only the pressed button busy and explains the others while saving', async () => {
      const { rerender } = render(<SpamNotice {...baseProps} />)
      await userEvent.click(screen.getByRole('button', { name: 'Trust all @harborcountyvotes.org' }))
      rerender(<SpamNotice {...baseProps} trustState="saving" />)

      expect(screen.getByRole('button', { name: `Trust ${sender}` })).toHaveAccessibleDescription(
        new RegExp('Wait until your changes finish saving\\.$'),
      )
      expect(screen.getByRole('button', { name: 'No thanks' })).toHaveAccessibleDescription(
        'Wait until your changes finish saving.',
      )
      expect(screen.getByRole('button', { name: 'Saving…' })).not.toHaveAccessibleDescription(/Wait/)
    })

    it('ignores the pressed button and shows why the others wait while saving', async () => {
      const { rerender } = render(<SpamNotice {...baseProps} />)
      await userEvent.click(screen.getByRole('button', { name: `Trust ${sender}` }))
      rerender(<SpamNotice {...baseProps} trustState="saving" />)
      await userEvent.click(screen.getByRole('button', { name: 'Saving…' }))
      await userEvent.click(screen.getByRole('button', { name: 'No thanks' }))

      expect(onTrust).toHaveBeenCalledTimes(1)
      expect(onDecline).not.toHaveBeenCalled()
      expect(
        screen.getByText('Wait until your changes finish saving.', { selector: '[role="status"] span' }),
      ).toBeInTheDocument()
    })

    it('closes the reason, not the notice, on Escape', async () => {
      const { rerender } = render(<SpamNotice {...baseProps} />)
      await userEvent.click(screen.getByRole('button', { name: `Trust ${sender}` }))
      rerender(<SpamNotice {...baseProps} trustState="saving" />)
      await userEvent.click(screen.getByRole('button', { name: 'No thanks' }))
      const reason = screen.getByText('Wait until your changes finish saving.', { selector: '[role="status"] > span' })
        .parentElement as HTMLElement
      await userEvent.keyboard('{Escape}')

      expect(reason).toBeEmptyDOMElement()
      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('confirms the trusted sender', () => {
      render(<SpamNotice {...baseProps} trustState="accepted" trustedValue="@harborcountyvotes.org" />)

      expect(screen.getByRole('status')).toHaveTextContent(
        `Moved to Inbox:${moved}@harborcountyvotes.org added to trusted senders.`,
      )
      expect(screen.queryByRole('button', { name: `Trust ${sender}` })).not.toBeInTheDocument()
    })

    it('shows only the move once declined', () => {
      render(<SpamNotice {...baseProps} trustState="declined" />)

      expect(screen.getByRole('status')).toHaveTextContent(`Moved to Inbox:${moved}`, { normalizeWhitespace: true })
      expect(screen.queryByRole('button', { name: 'No thanks' })).not.toBeInTheDocument()
    })

    it('explains a full trusted senders list', () => {
      render(<SpamNotice {...baseProps} trustState="full" />)

      expect(screen.getByText(/^Your trusted senders list is full/)).toHaveTextContent(
        `Your trusted senders list is full — 100 is the limit. Remove one under Spam filter in Settings, then add ${sender} there.`,
      )
      expect(screen.queryByRole('button', { name: `Trust ${sender}` })).not.toBeInTheDocument()
    })

    it('shows no offer without a sender', () => {
      render(<SpamNotice {...baseProps} sender={undefined} />)

      expect(screen.getByRole('status')).toHaveTextContent(`Moved to Inbox:${moved}`, { normalizeWhitespace: true })
      expect(screen.queryByRole('button', { name: `Trust ${sender}` })).not.toBeInTheDocument()
    })
  })

  describe('moved to spam', () => {
    it('offers rule suggestions', async () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" />)

      expect(screen.getByRole('status')).toHaveTextContent(
        `Moved to Spam:${moved}Want fewer emails like that one? We can read it and suggest changes to your spam rules.`,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Suggest rule changes' }))

      expect(onSuggest).toHaveBeenCalled()
    })

    it('does not offer trust', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" />)

      expect(screen.queryByRole('button', { name: `Trust ${sender}` })).not.toBeInTheDocument()
    })

    it('confirms one saved change', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" updatedCount={1} />)

      expect(screen.getByRole('status')).toHaveTextContent(
        `Moved to Spam:${moved}1 rule change saved.You can change your spam filter anytime in Settings.`,
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
        `Moved to Spam:${moved}Those changes were already in your rules.You can change your spam filter anytime in Settings.`,
      )
      expect(screen.queryByText(/rule changes saved/)).not.toBeInTheDocument()
    })
  })

  describe('naming the moved email', () => {
    // The line under "Moved to …:" that names the moved email.
    const movedLine = (): HTMLElement => screen.getByText(/^Moved to (Inbox|Spam):$/).nextElementSibling as HTMLElement

    const renderName = (name: React.ReactNode): HTMLElement => render(<p>{name}</p>).container.firstChild as HTMLElement

    it('names the moved email by subject and sender', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" />)

      expect(screen.getByText('Moved to Spam:')).toBeVisible()
      expect(movedLine()).toHaveTextContent(moved)
    })

    it('isolates the subject and the sender from the text around them', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" />)

      expect(within(movedLine()).getByText(subject).tagName).toBe('BDI')
      expect(within(movedLine()).getByText(from).tagName).toBe('BDI')
    })

    it('drops bidi controls from the subject and the sender', () => {
      render(
        <SpamNotice
          {...baseProps}
          from={'Mallory \u2066<m@evil.example>\u2069'}
          kind="moved-to-spam"
          subject={'Invoice \u202Efdp.exe'}
        />,
      )

      expect(movedLine()).toHaveTextContent('“Invoice fdp.exe” from Mallory <m@evil.example>')
      expect(movedLine().textContent).not.toMatch(/[\u202A-\u202E\u2066-\u2069]/)
    })

    it('says the moved email has no subject', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" subject="" />)

      expect(movedLine()).toHaveTextContent(`The email with no subject from ${from}`)
    })

    it('treats a blank subject as no subject', () => {
      render(<SpamNotice {...baseProps} subject="   " />)

      expect(movedLine()).toHaveTextContent(`The email with no subject from ${from}`)
    })

    it('cuts a long subject short', () => {
      render(<SpamNotice {...baseProps} kind="moved-to-spam" subject={`${'a'.repeat(80)}bcdef`} />)

      expect(movedLine()).toHaveTextContent(`“${'a'.repeat(80)}…” from ${from}`)
      expect(movedLine()).not.toHaveTextContent('bcdef')
    })

    it('cuts a long sender short', () => {
      render(<SpamNotice {...baseProps} from={`${'n'.repeat(80)} <${sender}>`} kind="moved-to-spam" />)

      expect(movedLine()).toHaveTextContent(`“${subject}” from ${'n'.repeat(80)}…`)
      expect(movedLine()).not.toHaveTextContent(sender)
    })

    it('drops the quotes around the display name', () => {
      render(<SpamNotice {...baseProps} from={`"Harbor County" <${sender}>`} kind="moved-to-spam" />)

      expect(movedLine()).toHaveTextContent(`“${subject}” from Harbor County <${sender}>`)
    })

    it.each(['unknown', 'Unknown', '', '   '])('says the sender is unknown for %j', (unknown) => {
      render(<SpamNotice {...baseProps} from={unknown} kind="moved-to-spam" />)

      expect(movedLine()).toHaveTextContent(`“${subject}” from an unknown sender`)
    })

    it('keeps a subject of exactly 80 characters whole', () => {
      expect(renderName(subjectName('b'.repeat(80)))).toHaveTextContent(`“${'b'.repeat(80)}”`)
    })

    it('never splits a character when cutting a subject short', () => {
      expect(renderName(subjectName(`${'a'.repeat(79)}😀😀`))).toHaveTextContent(`“${'a'.repeat(79)}😀…”`)
    })

    it('names an email with no subject in lowercase mid-sentence', () => {
      expect(renderName(movedEmailName('', from))).toHaveTextContent(`the email with no subject from ${from}`)
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
      await userEvent.click(screen.getByRole('button', { name: `Trust ${sender}` }))

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
