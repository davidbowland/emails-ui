import React from 'react'

import SpamSuggestions, { SpamSuggestionsProps } from './index'
import * as emails from '@services/emails'
import { account, accountId, emailId, spamImpactIncomplete, spamImpactResponse } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Account,
  HttpError,
  SpamImpactResponse,
  SpamPhraseImpact,
  SpamSuggestion,
  SpamSuggestionsResponse,
} from '@types'

jest.mock('@services/emails')

describe('SpamSuggestions component', () => {
  const noImpact = spamImpactResponse.phrases[1]
  const phraseImpact = (phrase: string, impact: Partial<SpamPhraseImpact>): SpamPhraseImpact => ({
    ...noImpact,
    ...impact,
    phrase,
  })
  const inboxHit = spamImpactResponse.phrases[0].inbox
  const spamHit = spamImpactResponse.phrases[0].spam

  // "app development" matches the Inbox (2 emails) and Spam; "lottery" nothing; "crypto" the Inbox (2 emails).
  const impactResponse: SpamImpactResponse = {
    ...spamImpactResponse,
    phrases: [
      phraseImpact('app development', { inbox: inboxHit, spam: spamHit }),
      phraseImpact('lottery', {}),
      phraseImpact('crypto', { inbox: inboxHit }),
    ],
  }

  const appDevelopment: SpamSuggestion = {
    id: 's1',
    kind: 'addBlockPhrase',
    level: 'targeted',
    reason: 'A pitch for outsourced app work.',
    value: 'app development',
  }
  const lottery: SpamSuggestion = {
    id: 's2',
    kind: 'addBlockPhrase',
    level: 'broader',
    reason: 'A prize scam.',
    value: 'lottery',
  }
  const crypto: SpamSuggestion = {
    id: 's3',
    kind: 'addBlockPhrase',
    level: 'aggressive',
    reason: 'Crypto offers.',
    value: 'crypto',
  }
  const removeSender: SpamSuggestion = {
    id: 's4',
    kind: 'removeTrustedSender',
    level: 'targeted',
    reason: 'This sender sent the spam.',
    value: '@pitch.example',
  }
  const raiseHigh: SpamSuggestion = {
    id: 's5',
    kind: 'raiseSensitivity',
    level: 'aggressive',
    reason: 'More spam is slipping by.',
    value: 'high',
  }
  // In the response's order, which is not the order of the groups.
  const suggestions: SpamSuggestion[] = [appDevelopment, lottery, crypto, removeSender, raiseHigh]
  // The same suggestions as an API from before levels sends them, with no level, so none is picked when they
  // arrive. For tests that pick from scratch.
  const unpicked = suggestions.map(({ level: _level, ...suggestion }) => suggestion) as unknown as SpamSuggestion[]

  const spamAccount: Account = {
    ...account,
    spamFilter: { blockPhrases: ['casino'], sensitivity: 'medium', trustedSenders: ['@pitch.example', 'me@home.com'] },
  }

  const onApplied = jest.fn()
  const onClose = jest.fn()

  const emailSubject = 'You won the lottery'
  const emailFrom = 'Prize Desk <prizes@lucky.example>'
  const props: SpamSuggestionsProps = {
    accountId,
    emailFrom,
    emailId,
    emailSubject,
    onApplied,
    onClose,
    open: true,
  }

  const httpError = (status?: number, code?: string): HttpError => Object.assign(new Error('failed'), { code, status })

  const renderResults = async (overrides: Partial<SpamSuggestionsProps> = {}): Promise<void> => {
    render(<SpamSuggestions {...props} {...overrides} />)
    await screen.findByRole('checkbox', { name: 'Add “app development” to block phrases' })
    await screen.findByText(/2 suggested phrases match emails in your Inbox/)
  }

  // The dialog's own live region. An unavailable footer button mounts a status region of its own for
  // its reason, beside the button; the dialog's region is the one with no button beside it.
  const dialogStatus = (): HTMLElement =>
    screen
      .getAllByRole('status')
      .find(
        (status) => within(status.parentElement as HTMLElement).queryAllByRole('button').length === 0,
      ) as HTMLElement

  const renderUnpicked = async (): Promise<void> => {
    jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: unpicked })
    await renderResults()
  }

  const groupNames = (): string[] =>
    screen
      .getAllByRole('list')
      .map((list) => list.getAttribute('aria-labelledby'))
      .filter((id): id is string => id !== null)
      .map((id) => document.getElementById(id)?.textContent ?? '')

  const rowsIn = (group: string): string[] =>
    within(screen.getByRole('list', { name: group }))
      .getAllByRole('checkbox')
      .map((checkbox) => checkbox.getAttribute('aria-labelledby') ?? '')
      .map((id) => document.getElementById(id)?.textContent ?? '')

  const pick = async (name: string): Promise<void> => {
    await userEvent.click(screen.getByRole('checkbox', { name }))
  }

  const deferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void } => {
    let resolve: (value: T) => void = () => undefined
    const promise = new Promise<T>((done) => {
      resolve = done
    })
    return { promise, resolve }
  }

  beforeAll(() => {
    jest.mocked(emails).postSpamSuggestions.mockResolvedValue({ suggestions })
    jest.mocked(emails).postSpamImpact.mockResolvedValue(impactResponse)
    jest.mocked(emails).getAccount.mockResolvedValue(spamAccount)
    jest.mocked(emails).putAccount.mockResolvedValue(spamAccount)
    console.error = jest.fn()
  })

  describe('loading', () => {
    it('shows a status while reading the email', () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)

      expect(screen.getByRole('dialog', { name: 'Suggested rule changes' })).toBeVisible()
      expect(dialogStatus()).toHaveTextContent(`Reading “${emailSubject}”`)
    })

    it('says the email has no subject', () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} emailSubject="" />)

      expect(dialogStatus()).toHaveTextContent(/^Reading the email with no subject$/)
    })

    it('cuts a long subject short', () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} emailSubject={`${'a'.repeat(80)}bcdef`} />)

      expect(dialogStatus()).toHaveTextContent(new RegExp(`^Reading “${'a'.repeat(80)}…”$`))
    })

    it('asks for suggestions for the moved email', () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)

      expect(emails.postSpamSuggestions).toHaveBeenCalledWith(accountId, emailId)
    })

    it('asks for nothing while closed', () => {
      render(<SpamSuggestions {...props} open={false} />)

      expect(emails.postSpamSuggestions).not.toHaveBeenCalled()
    })

    it('closes with Cancel', async () => {
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('keeps focus on the first button when the results arrive', async () => {
      const response = deferred<SpamSuggestionsResponse>()
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(response.promise)
      render(<SpamSuggestions {...props} />)
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

      await act(async () => response.resolve({ suggestions }))

      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })

    it('ignores a response that arrives after closing', async () => {
      const response = deferred<SpamSuggestionsResponse>()
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(response.promise)
      const { rerender } = render(<SpamSuggestions {...props} />)
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => response.resolve({ suggestions }))

      expect(screen.queryByRole('checkbox', { hidden: true })).not.toBeInTheDocument()
    })

    it('ignores an error that arrives after closing', async () => {
      let reject: (reason: unknown) => void = () => undefined
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(
        new Promise((_, fail) => {
          reject = fail
        }),
      )
      const { rerender } = render(<SpamSuggestions {...props} />)
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => reject(httpError(429, 'DAILY_LIMIT')))

      expect(screen.queryByText("You've reached today's limit for rule suggestions.")).not.toBeInTheDocument()
    })
  })

  describe('results', () => {
    it('lists each suggestion as a labeled checkbox, with Targeted and Broader picked and Aggressive not', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “app development” to block phrases' })

      expect(screen.getAllByRole('checkbox')).toHaveLength(5)
      expect(screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Add “crypto” to block phrases' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Raise sensitivity to High' })).not.toBeChecked()
      expect(screen.getByRole('button', { name: 'Apply 3 changes anyway' })).toBeInTheDocument()
    })

    it('unticks a phrase we picked once the check finds it in the Inbox', async () => {
      await renderResults()

      expect(screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toBeChecked()
      expect(screen.queryByRole('note')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Apply 2 changes' })).toBeInTheDocument()
      expect(dialogStatus()).toHaveTextContent('5 suggested changes, 2 picked for you.')
    })

    it('asks for picks when the check unticks every phrase we picked', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [appDevelopment, crypto] })
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [impactResponse.phrases[0], noImpact] })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/1 suggested phrase matches emails in your Inbox/)

      expect(screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' })).not.toBeChecked()
      expect(screen.getByText('Pick the changes you want. We save nothing until you apply them.')).toBeVisible()
      expect(screen.queryByText(/We picked the safer changes/)).not.toBeInTheDocument()
      expect(dialogStatus()).toHaveTextContent('2 suggested changes, none picked for you.')
    })

    it('leaves the picks alone when the check finishes after the person changed them', async () => {
      const response = deferred<SpamImpactResponse>()
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(response.promise)
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await pick('Add “lottery” to block phrases')

      await act(async () => response.resolve(impactResponse))

      expect(screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).not.toBeChecked()
      expect(screen.getByRole('button', { name: 'Apply 2 changes anyway' })).toBeInTheDocument()
    })

    it('groups the rows by level, from Targeted to Aggressive, under headings with help', async () => {
      await renderResults()

      expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
        'Targeted',
        'Broader',
        'Aggressive',
      ])
      expect(groupNames()).toEqual(['Targeted', 'Broader', 'Aggressive'])
      expect(rowsIn('Targeted')).toEqual([
        'Add “app development” to block phrases',
        'Remove @pitch.example from trusted senders',
      ])
      expect(rowsIn('Broader')).toEqual(['Add “lottery” to block phrases'])
      expect(rowsIn('Aggressive')).toEqual(['Add “crypto” to block phrases', 'Raise sensitivity to High'])
      expect(screen.getByText('Closest to the email you moved. These rarely catch mail you want.')).toBeVisible()
      expect(screen.getByText('These catch more mail like that one. They may catch some mail you want.')).toBeVisible()
      expect(
        screen.getByText(
          "These catch the most. They're the likeliest to catch mail you want, so we didn't pick them for you.",
        ),
      ).toBeVisible()
    })

    it('leaves out a group with no suggestions', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [crypto, removeSender] })
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [impactResponse.phrases[2]] })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/1 suggested phrase matches emails in your Inbox/)

      expect(groupNames()).toEqual(['Targeted', 'Aggressive'])
      expect(screen.queryByRole('heading', { name: 'Broader' })).not.toBeInTheDocument()
      expect(screen.queryByText(/These catch more mail like this/)).not.toBeInTheDocument()
    })

    it('treats a suggestion without a level as targeted', async () => {
      const { level: _level, ...noLevel } = crypto
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [noLevel, raiseHigh],
      } as unknown as SpamSuggestionsResponse)
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [noImpact] })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(rowsIn('Targeted')).toEqual(['Add “crypto” to block phrases'])
      expect(screen.getByRole('checkbox', { name: 'Add “crypto” to block phrases' })).toBeChecked()
    })

    it('treats a High sensitivity change without a level as aggressive, and a Medium one as broader', async () => {
      const { level: _high, ...legacyHigh } = raiseHigh
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [legacyHigh],
      } as unknown as SpamSuggestionsResponse)
      const { unmount } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Raise sensitivity to High' })

      expect(groupNames()).toEqual(['Aggressive'])
      expect(screen.getByRole('checkbox', { name: 'Raise sensitivity to High' })).not.toBeChecked()
      unmount()

      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [{ id: 'm', kind: 'raiseSensitivity', reason: 'Some spam gets through.', value: 'medium' }],
      } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)

      await screen.findByRole('checkbox', { name: 'Raise sensitivity to Medium' })
      expect(groupNames()).toEqual(['Broader'])
    })

    it('groups a response from before levels, but picks none of it', async () => {
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [noImpact, noImpact, noImpact] })
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: unpicked })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(groupNames()).toEqual(['Targeted', 'Aggressive'])
      expect(rowsIn('Targeted')).toEqual([
        'Add “app development” to block phrases',
        'Add “lottery” to block phrases',
        'Add “crypto” to block phrases',
        'Remove @pitch.example from trusted senders',
      ])
      expect(screen.queryAllByRole('checkbox', { checked: true })).toHaveLength(0)
      expect(screen.getByText('Pick the changes you want. We save nothing until you apply them.')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Apply changes' })).toBeInTheDocument()
    })

    it.each(['extreme', '', null])('drops a suggestion with the level %p', async (level) => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [{ ...crypto, level }, raiseHigh],
      } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Raise sensitivity to High' })

      expect(screen.getAllByRole('checkbox')).toHaveLength(1)
      expect(emails.postSpamImpact).not.toHaveBeenCalled()
    })

    it('guesses the level only when it is missing, and drops one with an unknown level', async () => {
      const { level: _level, ...noLevel } = lottery
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [noLevel, { ...crypto, level: 'extreme' }],
      } as unknown as SpamSuggestionsResponse)
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [noImpact] })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(groupNames()).toEqual(['Targeted'])
      expect(rowsIn('Targeted')).toEqual(['Add “lottery” to block phrases'])
      expect(screen.queryByRole('checkbox', { name: 'Add “crypto” to block phrases' })).not.toBeInTheDocument()
      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['lottery'], emailId)
    })

    it('announces how many changes are suggested and how many we picked', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(dialogStatus()).toHaveTextContent('5 suggested changes, 3 picked for you.')
    })

    it('announces when we picked none', async () => {
      await renderUnpicked()

      expect(dialogStatus()).toHaveTextContent('5 suggested changes, none picked for you.')
    })

    it('announces a single suggestion', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [lottery] })
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [impactResponse.phrases[1]] })
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText(/1 suggested change, 1 picked for you\./)).toBeInTheDocument()
    })

    it('says we picked the safer changes when it picked some', async () => {
      await renderResults()

      expect(
        screen.getByText(
          'We picked the safer changes for you. You can change them. We save nothing until you apply them.',
        ),
      ).toBeVisible()
    })

    it('asks for picks when it picked none', async () => {
      await renderUnpicked()

      expect(screen.getByText('Pick the changes you want. We save nothing until you apply them.')).toBeVisible()
      expect(screen.queryByText(/We picked the safer changes/)).not.toBeInTheDocument()
    })

    it('shows the footnote about what was checked', async () => {
      await renderResults()

      expect(
        screen.getByText(
          "We checked subjects and message text in 100 of 150 Inbox emails and 25 of 40 Spam emails, newest first. We didn't check attachments or older mail. If you add these phrases, future mail with them will go to Spam, unless it comes from a trusted sender.",
        ),
      ).toBeVisible()
    })

    it('says "this phrase" in the footnote when one phrase is suggested', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [lottery, removeSender] })
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...impactResponse,
        phrases: [phraseImpact('lottery', {})],
      })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['lottery'], emailId)
      expect(screen.getByText(/If you add this phrase, future mail with it will go to Spam/)).toBeVisible()
    })

    it('leaves the footnote out and makes no check when no phrase is suggested', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [removeSender, raiseHigh] })
      render(<SpamSuggestions {...props} />)

      await screen.findByRole('checkbox', { name: 'Raise sensitivity to High' })

      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
      expect(emails.postSpamImpact).not.toHaveBeenCalled()
    })

    it('checks the phrases in suggestion order, excluding the moved email', async () => {
      await renderResults()

      expect(emails.postSpamImpact).toHaveBeenCalledTimes(1)
      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['app development', 'lottery', 'crypto'], emailId)
    })

    it('shows the checking line on each phrase row until the check resolves', async () => {
      const response = deferred<SpamImpactResponse>()
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(response.promise)
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(screen.getAllByText('Checking your mail…')).toHaveLength(3)
      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()

      await act(async () => response.resolve(impactResponse))

      expect(screen.queryByText('Checking your mail…')).not.toBeInTheDocument()
      expect(screen.getAllByText(/Matches 2 of 100 Inbox emails:/)).toHaveLength(2)
    })

    it('announces while the check runs', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(dialogStatus()).toHaveTextContent('5 suggested changes, 3 picked for you. Checking your mail…')
    })

    it('announces when the check could not read all of the Inbox', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactIncomplete,
        phrases: [phraseImpact('app development', {}), phraseImpact('lottery', {}), phraseImpact('crypto', {})],
      })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We couldn't check all of your Inbox/)

      expect(dialogStatus()).toHaveTextContent(
        "5 suggested changes, 3 picked for you. We couldn't check all of your Inbox.",
      )
      expect(dialogStatus()).not.toHaveTextContent('We finished checking your mail.')
    })

    it('announces how many suggested phrases match the Inbox when the check finishes', async () => {
      await renderResults()

      expect(dialogStatus()).toHaveTextContent(
        '5 suggested changes, 2 picked for you. 2 suggested phrases match emails in your Inbox.',
      )
      expect(dialogStatus()).not.toHaveTextContent('We finished checking your mail.')
    })

    it('announces one suggested phrase matching the Inbox in the singular', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...impactResponse,
        phrases: [
          phraseImpact('app development', { spam: spamHit }),
          phraseImpact('lottery', {}),
          impactResponse.phrases[2],
        ],
      })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/1 suggested phrase matches emails in your Inbox/)

      expect(dialogStatus()).toHaveTextContent(
        '5 suggested changes, 3 picked for you. 1 suggested phrase matches emails in your Inbox.',
      )
    })

    it('announces that the check finished when no suggested phrase matches the Inbox', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...impactResponse,
        phrases: [
          phraseImpact('app development', { spam: spamHit }),
          phraseImpact('lottery', {}),
          phraseImpact('crypto', {}),
        ],
      })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(dialogStatus()).toHaveTextContent('5 suggested changes, 3 picked for you. We finished checking your mail.')
      expect(dialogStatus()).not.toHaveTextContent(/match emails in your Inbox/)
    })

    it('announces an incomplete Inbox check even when a suggested phrase matches the Inbox', async () => {
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...spamImpactIncomplete, phrases: impactResponse.phrases })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We couldn't check all of your Inbox/)

      expect(dialogStatus()).toHaveTextContent(
        "5 suggested changes, 2 picked for you. We couldn't check all of your Inbox.",
      )
      expect(dialogStatus()).not.toHaveTextContent(/match emails in your Inbox/)
    })

    it('describes a row with its reason and impact', async () => {
      await renderResults()

      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toHaveAccessibleDescription(
        'A prize scam. No matches in 100 Inbox emails No matches in 25 Spam emails',
      )
    })

    it("keeps each phrase's result on its row when the groups reorder the rows", async () => {
      // Response order: crypto (aggressive), lottery (broader), app development (targeted). The groups
      // show them in reverse, but the results follow the response.
      const response: SpamImpactResponse = {
        ...impactResponse,
        phrases: [
          phraseImpact('crypto', { inbox: inboxHit }),
          phraseImpact('lottery', { spam: spamHit }),
          phraseImpact('app development', {}),
        ],
      }
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [crypto, raiseHigh, lottery, removeSender, appDevelopment],
      })
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(response)
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/1 suggested phrase matches emails in your Inbox/)

      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['crypto', 'lottery', 'app development'], emailId)
      expect(rowsIn('Targeted')).toEqual([
        'Remove @pitch.example from trusted senders',
        'Add “app development” to block phrases',
      ])
      expect(rowsIn('Aggressive')).toEqual(['Add “crypto” to block phrases', 'Raise sensitivity to High'])
      expect(screen.getByRole('checkbox', { name: 'Add “crypto” to block phrases' })).toHaveAccessibleDescription(
        'Crypto offers. Matches 2 of 100 Inbox emails: No matches in 25 Spam emails',
      )
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toHaveAccessibleDescription(
        'A prize scam. No matches in 100 Inbox emails Matches 3 of 25 Spam emails:',
      )
      expect(
        screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' }),
      ).toHaveAccessibleDescription(
        'A pitch for outsourced app work. No matches in 100 Inbox emails No matches in 25 Spam emails',
      )
      expect(screen.queryByRole('note')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Apply 3 changes' })).toBeInTheDocument()
    })

    it("shows each phrase's result in its own position", async () => {
      const response: SpamImpactResponse = {
        ...impactResponse,
        phrases: [phraseImpact('lottery', { inbox: inboxHit }), phraseImpact('app development', {})],
      }
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [removeSender, lottery, raiseHigh, appDevelopment],
      })
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(response)
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/1 suggested phrase matches emails in your Inbox/)

      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['lottery', 'app development'], emailId)
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toHaveAccessibleDescription(
        /Matches 2 of 100 Inbox emails/,
      )
      expect(
        screen.getByRole('checkbox', { name: 'Add “app development” to block phrases' }),
      ).toHaveAccessibleDescription(/No matches in 100 Inbox emails/)
    })

    it('lists the matching emails the API sent in the row, but describes the checkbox with the counts only', async () => {
      await renderResults()

      const checkbox = screen.getByRole('checkbox', {
        name: 'Add “app development” to block phrases',
      })
      const row = within(checkbox.closest('label') as HTMLElement)
      expect(row.getByText('Lunch on Friday')).toBeVisible()
      expect(row.getByText('Your receipt')).toBeVisible()
      expect(checkbox).toHaveAccessibleDescription(
        'A pitch for outsourced app work. Matches 2 of 100 Inbox emails: Also matches 3 of 25 Spam emails:',
      )
      expect(checkbox).not.toHaveAccessibleDescription(/Lunch on Friday|friend@domain\.com/)
    })

    it('drops the old check result when the email changes while open', async () => {
      const response = deferred<SpamImpactResponse>()
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByText(/2 suggested phrases match emails in your Inbox/)
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(response.promise)

      rerender(<SpamSuggestions {...props} emailId="other" />)
      await screen.findAllByText('Checking your mail…')

      expect(emails.postSpamImpact).toHaveBeenLastCalledWith(
        accountId,
        ['app development', 'lottery', 'crypto'],
        'other',
      )
      expect(screen.queryByText(/Matches 2 of 100 Inbox emails/)).not.toBeInTheDocument()
      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
    })

    it('leaves a dropped malformed phrase out of the check', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [{ id: 'x', kind: 'addBlockPhrase', reason: 'Odd value.', value: 7 }, lottery, raiseHigh],
      } as unknown as SpamSuggestionsResponse)
      jest
        .mocked(emails)
        .postSpamImpact.mockResolvedValueOnce({ ...impactResponse, phrases: [impactResponse.phrases[1]] })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We finished checking your mail/)

      expect(emails.postSpamImpact).toHaveBeenCalledWith(accountId, ['lottery'], emailId)
    })

    it.each([
      ['a rejected check', () => jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(httpError(503))],
      [
        'a malformed response',
        () =>
          jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({ phrases: [] } as unknown as SpamImpactResponse),
      ],
      [
        'a response with the wrong number of phrases',
        () => jest.mocked(emails).postSpamImpact.mockResolvedValueOnce(spamImpactIncomplete),
      ],
    ])('shows the failure line on each phrase row for %s', async (_name, arrange) => {
      arrange()
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We couldn't check your mail/)

      expect(screen.getAllByText("We couldn't check this phrase against your mail.")).toHaveLength(3)
      expect(screen.queryByText(/We checked subjects and message text/)).not.toBeInTheDocument()
      expect(dialogStatus()).toHaveTextContent("We couldn't check your mail.")
    })

    it('ignores a check result that arrives after closing', async () => {
      const response = deferred<SpamImpactResponse>()
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(response.promise)
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => response.resolve(impactResponse))
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions })
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      rerender(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(screen.queryByText(/Matches 2 of 100 Inbox emails/)).not.toBeInTheDocument()
      expect(screen.getAllByText('Checking your mail…')).toHaveLength(3)
    })

    it('ignores a check failure that arrives after closing', async () => {
      let reject: (reason: unknown) => void = () => undefined
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(
        new Promise((_, fail) => {
          reject = fail
        }),
      )
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      rerender(<SpamSuggestions {...props} open={false} />)

      await act(async () => reject(httpError(503)))

      expect(console.error).not.toHaveBeenCalledWith('Error checking suggested phrases against mail', expect.anything())
    })

    it('says a sender change applies to new mail only', async () => {
      await renderResults()

      expect(
        screen.getByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' }),
      ).toHaveAccessibleDescription('This sender sent the spam. Applies to new mail only')
    })

    it('warns that High may catch real mail', async () => {
      await renderResults()

      expect(screen.getByRole('checkbox', { name: 'Raise sensitivity to High' })).toHaveAccessibleDescription(
        'More spam is slipping by. Applies to new mail only. High may catch real mail.',
      )
      expect(
        within(
          screen.getByText('Applies to new mail only. High may catch real mail.').parentElement as HTMLElement,
        ).getByTestId('icon-TriangleAlert'),
      ).toBeInTheDocument()
    })

    it('gives no extra warning for Medium', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [
          { id: 'm', kind: 'raiseSensitivity', level: 'broader', reason: 'Some spam gets through.', value: 'medium' },
        ],
      })
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByRole('checkbox', { name: 'Raise sensitivity to Medium' })).toHaveAccessibleDescription(
        'Some spam gets through. Applies to new mail only',
      )
    })
  })

  describe('apply button', () => {
    it('reads "Apply changes" and explains instead of applying with no picks', async () => {
      await renderUnpicked()

      const apply = screen.getByRole('button', { name: 'Apply changes' })
      expect(apply).toHaveAccessibleDescription('Pick at least one change to apply.')
      await userEvent.click(apply)

      expect(within(apply.parentElement as HTMLElement).getByRole('status')).toHaveTextContent(
        'Pick at least one change to apply.',
      )
      expect(emails.getAccount).not.toHaveBeenCalled()
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('applies once a change is picked after a press with none', async () => {
      await renderUnpicked()
      await userEvent.click(screen.getByRole('button', { name: 'Apply changes' }))
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(onApplied).toHaveBeenCalledWith(1)
    })

    it('closes only the reason, not the dialog, on Escape', async () => {
      await renderUnpicked()
      const apply = screen.getByRole('button', { name: 'Apply changes' })
      await userEvent.click(apply)
      const reason = within(apply.parentElement as HTMLElement).getByRole('status')
      expect(reason).toHaveTextContent('Pick at least one change to apply.')
      await userEvent.keyboard('{Escape}')

      expect(reason).toBeEmptyDOMElement()
      expect(screen.getByRole('dialog')).toBeVisible()
      expect(onClose).not.toHaveBeenCalled()
    })

    it('counts one pick', async () => {
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
      expect(screen.queryByRole('note')).not.toBeInTheDocument()
    })

    it('counts several picks', async () => {
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await pick('Raise sensitivity to High')

      expect(screen.getByRole('button', { name: 'Apply 2 changes' })).toBeInTheDocument()
    })

    it('drops a pick when unticked', async () => {
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply changes' })).toBeInTheDocument()
    })

    it('warns once a matching phrase is picked', async () => {
      await renderUnpicked()
      await pick('Add “app development” to block phrases')

      expect(screen.getByRole('note')).toHaveTextContent(
        'A picked phrase matches emails in your Inbox. Those emails stay put, but new mail containing it will go to Spam, unless it comes from a trusted sender.',
      )
      expect(screen.getByRole('button', { name: 'Apply 1 change anyway' })).toBeInTheDocument()
    })

    it('uses the plural warning for two matching phrases', async () => {
      await renderUnpicked()
      await pick('Add “app development” to block phrases')
      await pick('Add “crypto” to block phrases')
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('note')).toHaveTextContent(
        'Picked phrases match emails in your Inbox. Those emails stay put, but new mail containing them will go to Spam, unless it comes from a trusted sender.',
      )
      expect(screen.getByRole('button', { name: 'Apply 3 changes anyway' })).toBeInTheDocument()
    })

    it('says "anyway" while the check is still running, and applies', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: unpicked })
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change anyway' }))

      expect(screen.queryByRole('note')).not.toBeInTheDocument()
      expect(onApplied).toHaveBeenCalledWith(1)
    })

    it('says "anyway" when the check failed', async () => {
      jest.mocked(emails).postSpamImpact.mockRejectedValueOnce(httpError(503))
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: unpicked })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We couldn't check your mail/)
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change anyway' })).toBeInTheDocument()
      expect(screen.queryByRole('note')).not.toBeInTheDocument()
    })

    it('says "anyway" when the Inbox was only partly checked', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...spamImpactIncomplete,
        phrases: [phraseImpact('app development', {}), phraseImpact('lottery', {}), phraseImpact('crypto', {})],
      })
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: unpicked })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/We couldn't check all of your Inbox/)
      await pick('Add “lottery” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change anyway' })).toBeInTheDocument()
    })

    it('does not say "anyway" for a Spam-only match', async () => {
      jest.mocked(emails).postSpamImpact.mockResolvedValueOnce({
        ...impactResponse,
        phrases: [
          phraseImpact('app development', { spam: spamHit }),
          phraseImpact('lottery', {}),
          impactResponse.phrases[2],
        ],
      })
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: unpicked })
      render(<SpamSuggestions {...props} />)
      await screen.findByText(/1 suggested phrase matches emails in your Inbox/)
      await pick('Add “app development” to block phrases')

      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
    })

    it('does not say "anyway" for a sender change while the check runs', async () => {
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: unpicked })
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await pick('Remove @pitch.example from trusted senders')

      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
    })
  })

  describe('applying', () => {
    it('applies the changes we picked without any further picks', async () => {
      await renderResults()
      await userEvent.click(screen.getByRole('button', { name: 'Apply 2 changes' }))

      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...spamAccount,
        spamFilter: {
          blockPhrases: ['casino', 'lottery'],
          sensitivity: 'medium',
          trustedSenders: ['me@home.com'],
        },
      })
      expect(onApplied).toHaveBeenCalledWith(2)
    })

    it('stops before the API when the picks we made would pass the block-phrase limit', async () => {
      const full = Array.from({ length: 99 }, (_, index) => `phrase ${index}`)
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: full, sensitivity: 'medium', trustedSenders: [] },
      })
      jest.mocked(emails).postSpamImpact.mockReturnValueOnce(new Promise(() => undefined))
      render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await userEvent.click(screen.getByRole('button', { name: 'Apply 3 changes anyway' }))

      expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
        'These would put your block phrases over the limit of 100.',
      )
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('re-reads the account, saves only the picks and reports the count', async () => {
      await renderUnpicked()
      await pick('Add “app development” to block phrases')
      await pick('Remove @pitch.example from trusted senders')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 2 changes anyway' }))

      expect(emails.getAccount).toHaveBeenCalledWith(accountId)
      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...spamAccount,
        spamFilter: {
          blockPhrases: ['casino', 'app development'],
          sensitivity: 'medium',
          trustedSenders: ['me@home.com'],
        },
      })
      expect(onApplied).toHaveBeenCalledWith(2)
    })

    it('counts only the picks that change the filter', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: ['Lottery'], sensitivity: 'medium', trustedSenders: [] },
      })
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await pick('Remove @pitch.example from trusted senders')
      await pick('Raise sensitivity to High')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 3 changes' }))

      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...spamAccount,
        spamFilter: { blockPhrases: ['Lottery'], sensitivity: 'high', trustedSenders: [] },
      })
      expect(onApplied).toHaveBeenCalledWith(1)
    })

    it('skips the save and reports 0 when every pick is already a rule', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: ['Lottery'], sensitivity: 'medium', trustedSenders: [] },
      })
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(onApplied).toHaveBeenCalledWith(0)
    })

    it('starts from the default filter for an account without one', async () => {
      jest.mocked(emails).getAccount.mockResolvedValueOnce(account)
      await renderUnpicked()
      await pick('Raise sensitivity to High')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...account,
        spamFilter: { blockPhrases: [], sensitivity: 'high', trustedSenders: [] },
      })
    })

    it('shows "Applying…" and ignores Escape, Cancel and picks while saving', async () => {
      jest.mocked(emails).putAccount.mockReturnValueOnce(new Promise(() => undefined))
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      const applying = await screen.findByRole('button', { name: 'Applying…' })
      await userEvent.click(applying)
      const cancel = screen.getByRole('button', { name: 'Cancel' })
      await userEvent.click(cancel)
      const reason = within(cancel.parentElement as HTMLElement).getByRole('status')
      expect(reason).toHaveTextContent('Wait until we finish applying your changes.')
      await userEvent.keyboard('{Escape}')
      expect(reason).toBeEmptyDOMElement()
      await userEvent.keyboard('{Escape}')
      await pick('Raise sensitivity to High')

      expect(onClose).not.toHaveBeenCalled()
      expect(emails.getAccount).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('checkbox', { name: 'Raise sensitivity to High' })).not.toBeChecked()
    })

    it('stops before the API when block phrases would pass the limit', async () => {
      const full = Array.from({ length: 100 }, (_, index) => `phrase ${index}`)
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: full, sensitivity: 'medium', trustedSenders: [] },
      })
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
        'These would put your block phrases over the limit of 100. Pick fewer, or make room under Spam filter in Settings and add them there.',
      )
      expect(emails.putAccount).not.toHaveBeenCalled()
      expect(onApplied).not.toHaveBeenCalled()
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toBeChecked()
    })

    it('saves when trusted senders are already over the limit but the picks do not grow them', async () => {
      const overFull = Array.from({ length: 101 }, (_, index) => `user${index}@domain.com`)
      jest.mocked(emails).getAccount.mockResolvedValueOnce({
        ...spamAccount,
        spamFilter: { blockPhrases: [], sensitivity: 'medium', trustedSenders: overFull },
      })
      await renderUnpicked()
      await pick('Raise sensitivity to High')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(emails.putAccount).toHaveBeenCalledWith(accountId, {
        ...spamAccount,
        spamFilter: { blockPhrases: [], sensitivity: 'high', trustedSenders: overFull },
      })
      expect(screen.getByRole('alert')).toBeEmptyDOMElement()
      expect(onApplied).toHaveBeenCalledWith(1)
    })

    it('keeps the picks and explains when saving fails', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(httpError(500))
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(
        await within(screen.getByRole('dialog')).findByText(
          "We couldn't save those changes. Your picks are still here — try again.",
        ),
      ).toBeVisible()
      expect(screen.getByRole('alert')).toHaveTextContent(
        "We couldn't save those changes. Your picks are still here — try again.",
      )
      expect(screen.getByRole('checkbox', { name: 'Add “lottery” to block phrases' })).toBeChecked()
      expect(screen.getByRole('button', { name: 'Apply 1 change' })).toBeInTheDocument()
      expect(onApplied).not.toHaveBeenCalled()
    })

    it('explains when re-reading the account fails', async () => {
      jest.mocked(emails).getAccount.mockRejectedValueOnce(httpError(503))
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
        "We couldn't save those changes. Your picks are still here — try again.",
      )
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('keeps an empty alert region mounted before any error', async () => {
      await renderUnpicked()

      expect(within(screen.getByRole('dialog')).getByRole('alert')).toBeEmptyDOMElement()
    })

    it('clears the error when applying again', async () => {
      jest.mocked(emails).putAccount.mockRejectedValueOnce(httpError(500))
      await renderUnpicked()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))
      await screen.findByText("We couldn't save those changes. Your picks are still here — try again.")

      await userEvent.click(screen.getByRole('button', { name: 'Apply 1 change' }))

      expect(screen.getByRole('alert')).toBeEmptyDOMElement()
      expect(onApplied).toHaveBeenCalledWith(1)
    })
  })

  describe('closing', () => {
    it('closes with Cancel and saves nothing', async () => {
      await renderResults()
      await pick('Add “lottery” to block phrases')
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onClose).toHaveBeenCalled()
      expect(emails.putAccount).not.toHaveBeenCalled()
    })

    it('closes with Escape', async () => {
      await renderResults()
      await userEvent.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalled()
    })

    it('returns focus to the trigger', async () => {
      const { rerender } = render(
        <>
          <button>Suggest rule changes</button>
          <SpamSuggestions {...props} open={false} />
        </>,
      )
      screen.getByRole('button', { name: 'Suggest rule changes' }).focus()
      rerender(
        <>
          <button>Suggest rule changes</button>
          <SpamSuggestions {...props} />
        </>,
      )
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      rerender(
        <>
          <button>Suggest rule changes</button>
          <SpamSuggestions {...props} open={false} />
        </>,
      )

      expect(screen.getByRole('button', { name: 'Suggest rule changes' })).toHaveFocus()
    })

    it('picks the safer changes again when opened again', async () => {
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' })
      await pick('Remove @pitch.example from trusted senders')
      expect(screen.getByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' })).not.toBeChecked()
      rerender(<SpamSuggestions {...props} open={false} />)

      rerender(<SpamSuggestions {...props} />)

      expect(await screen.findByRole('checkbox', { name: 'Remove @pitch.example from trusted senders' })).toBeChecked()
    })

    it('says which email the suggestions are based on, before the lead', async () => {
      await renderResults()

      const basedOn = screen.getByText(/^Based on/)
      expect(basedOn).toHaveTextContent(`Based on “${emailSubject}” from ${emailFrom}.`)
      expect(basedOn.compareDocumentPosition(screen.getByText(/^We picked the safer changes/))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
    })

    it('says the suggestions are based on an email with no subject', async () => {
      await renderResults({ emailSubject: '' })

      expect(screen.getByText(/^Based on/)).toHaveTextContent(`Based on the email with no subject from ${emailFrom}.`)
    })

    it('says the sender of the email is unknown', async () => {
      await renderResults({ emailFrom: 'unknown' })

      expect(screen.getByText(/^Based on/)).toHaveTextContent(`Based on “${emailSubject}” from an unknown sender.`)
    })

    it('drops bidi controls from the subject', async () => {
      await renderResults({ emailSubject: 'Invoice \u202Efdp.exe' })

      expect(screen.getByText(/^Based on/)).toHaveTextContent(`Based on “Invoice fdp.exe” from ${emailFrom}.`)
      expect(screen.getByText(/^Based on/).textContent).not.toContain('\u202E')
    })

    it('starts fresh when opened again', async () => {
      const { rerender } = render(<SpamSuggestions {...props} />)
      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })
      await pick('Add “lottery” to block phrases')
      rerender(<SpamSuggestions {...props} open={false} />)
      jest.mocked(emails).postSpamSuggestions.mockReturnValueOnce(new Promise(() => undefined))

      rerender(<SpamSuggestions {...props} />)

      expect(dialogStatus()).toHaveTextContent(`Reading “${emailSubject}”`)
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })
  })

  describe('messages', () => {
    it.each([
      [
        429,
        'DAILY_LIMIT',
        "You've reached today's limit for rule suggestions.",
        'Try again tomorrow. That email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        429,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. That email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        429,
        'THROTTLED',
        "Rule suggestions aren't available right now.",
        'Try again later. That email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        503,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. That email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        403,
        undefined,
        `Rule suggestions aren't available for “${emailSubject}”.`,
        "It's still in Spam, and you can change your spam filter anytime in Settings.",
      ],
      [
        404,
        undefined,
        `Rule suggestions aren't available for “${emailSubject}”.`,
        "It's still in Spam, and you can change your spam filter anytime in Settings.",
      ],
      [
        500,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. That email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
      [
        undefined,
        undefined,
        "Rule suggestions aren't available right now.",
        'Try again later. That email is still in Spam, and you can change your spam filter anytime in Settings.',
      ],
    ])('shows the message for status %s with code %s', async (status, code, lead, detail) => {
      jest.mocked(emails).postSpamSuggestions.mockRejectedValueOnce(httpError(status, code))
      render(<SpamSuggestions {...props} />)

      await screen.findByRole('button', { name: 'Close' })
      expect(dialogStatus()).toHaveTextContent(`${lead}${detail}`)
      expect(screen.queryByRole('button', { name: /Apply/ })).not.toBeInTheDocument()
    })

    it('shows the message for a rejection that is not an error', async () => {
      jest.mocked(emails).postSpamSuggestions.mockRejectedValueOnce(undefined)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText("Rule suggestions aren't available right now.")).toBeVisible()
    })

    it('closes from a message', async () => {
      jest.mocked(emails).postSpamSuggestions.mockRejectedValueOnce(httpError(429, 'DAILY_LIMIT'))
      render(<SpamSuggestions {...props} />)

      await userEvent.click(await screen.findByRole('button', { name: 'Close' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('says when there are no suggestions', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({ suggestions: [] })
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText(/^We don't have any suggestions for/)).toHaveTextContent(
        `We don't have any suggestions for “${emailSubject}”.`,
      )
      expect(
        screen.getByText(
          "It's still in Spam. To catch more mail like it, add a block phrase under Spam filter in Settings.",
        ),
      ).toBeVisible()
    })

    it('drops suggestions of an unknown kind', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [{ id: 'x', kind: 'addTrustedSender', reason: 'Lenient.', value: '@evil.example' }],
      } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText(/^We don't have any suggestions for/)).toHaveTextContent(
        `We don't have any suggestions for “${emailSubject}”.`,
      )
    })

    it.each([
      [{ id: 7, kind: 'addBlockPhrase', reason: 'Odd id.', value: 'lottery' }],
      [{ id: 'x', kind: 'addBlockPhrase', reason: 'Odd value.', value: ['lottery'] }],
      [{ id: 'x', kind: 'addBlockPhrase', reason: undefined, value: 'lottery' }],
      [{ id: 'x', kind: 7, reason: 'Odd kind.', value: 'lottery' }],
      [null],
    ])('drops a malformed suggestion %j', async (suggestion) => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [suggestion],
      } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText(/^We don't have any suggestions for/)).toHaveTextContent(
        `We don't have any suggestions for “${emailSubject}”.`,
      )
    })

    it('keeps only the first suggestion with a given id', async () => {
      jest.mocked(emails).postSpamSuggestions.mockResolvedValueOnce({
        suggestions: [lottery, { ...crypto, id: lottery.id }],
      })
      render(<SpamSuggestions {...props} />)

      await screen.findByRole('checkbox', { name: 'Add “lottery” to block phrases' })

      expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    })

    it('treats a malformed response as no suggestions', async () => {
      jest
        .mocked(emails)
        .postSpamSuggestions.mockResolvedValueOnce({ suggestions: 'nope' } as unknown as SpamSuggestionsResponse)
      render(<SpamSuggestions {...props} />)

      expect(await screen.findByText(/^We don't have any suggestions for/)).toHaveTextContent(
        `We don't have any suggestions for “${emailSubject}”.`,
      )
    })
  })
})
