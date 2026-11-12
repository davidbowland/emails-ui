import React from 'react'

import SpamFilterSettings, { blockPhraseError, SpamDraftKey, trustedSenderError } from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpamFilter } from '@types'

describe('SpamFilterSettings', () => {
  const onChange = jest.fn()
  const onDraftChange = jest.fn()
  const onErrorChange = jest.fn()
  const inputRef = jest.fn()

  const spamFilter: SpamFilter = {
    blockPhrases: ['crypto'],
    sensitivity: 'medium',
    trustedSenders: ['@harbor.org'],
  }

  const fullList = (prefix: string): string[] => Array.from({ length: 100 }, (_, index) => `${prefix}${index}.com`)

  interface Options {
    changed?: boolean
    drafts?: Partial<Record<SpamDraftKey, string>>
    errors?: Partial<Record<SpamDraftKey, string>>
    readOnly?: boolean
    savedValue?: SpamFilter
    value?: SpamFilter
  }

  const renderSettings = ({
    changed = false,
    drafts = {},
    errors = {},
    readOnly = false,
    savedValue = spamFilter,
    value = spamFilter,
  }: Options = {}): void => {
    render(
      <SpamFilterSettings
        changed={changed}
        drafts={{ blockPhrases: '', trustedSenders: '', ...drafts }}
        errors={errors}
        inputRef={inputRef}
        onChange={onChange}
        onDraftChange={onDraftChange}
        onErrorChange={onErrorChange}
        readOnly={readOnly}
        readOnlyReason="Wait until Save finishes."
        savedValue={savedValue}
        value={value}
      />,
    )
  }

  const phraseBox = (): HTMLInputElement => screen.getByRole('textbox', { name: 'Block phrases:' }) as HTMLInputElement
  const senderBox = (): HTMLInputElement =>
    screen.getByRole('textbox', { name: 'Trusted senders:' }) as HTMLInputElement

  // The page owns the draft, so a box shows the text it is given and Enter submits that text.
  const addPhrase = async (text: string): Promise<void> => {
    renderSettings({ drafts: { blockPhrases: text } })
    await userEvent.type(phraseBox(), '{Enter}')
  }

  const addSender = async (text: string): Promise<void> => {
    renderSettings({ drafts: { trustedSenders: text } })
    await userEvent.type(senderBox(), '{Enter}')
  }

  describe('the section', () => {
    it('names itself and says what happens to spam', () => {
      renderSettings()

      expect(screen.getByRole('region', { name: 'Spam filter' })).toBeVisible()
      expect(
        screen.getByText("Spam goes to your Spam folder. We don't forward it or send a notification for it."),
      ).toBeVisible()
    })
  })

  describe('unsaved changes', () => {
    it('changed shows "Not saved yet"', () => {
      renderSettings({ changed: true })

      expect(screen.getByText('Not saved yet')).toBeVisible()
    })

    it('shows no mark when nothing changed', () => {
      renderSettings()

      expect(screen.queryByText('Not saved yet')).not.toBeInTheDocument()
    })
  })

  describe('sensitivity', () => {
    it('explains the score on the group itself (AC-037)', () => {
      renderSettings()

      expect(screen.getByRole('radiogroup', { name: 'Sensitivity' })).toHaveAccessibleDescription(
        'Every new email gets a spam score from warning signs like hidden characters in your domain, placeholder text such as {{First Name}}, and "reply NO to stop" lines. Sensitivity sets how high that score must be before mail goes to Spam. Mail that fails our spam or virus scan on arrival always goes to Spam.',
      )
    })

    it('offers each level named by itself and described by its helper', () => {
      renderSettings()

      expect(screen.getByRole('radio', { name: 'Low' })).toHaveAccessibleDescription('Catches only obvious spam')
      expect(screen.getByRole('radio', { name: 'Medium' })).toHaveAccessibleDescription(
        'Catches most spam (recommended)',
      )
      expect(screen.getByRole('radio', { name: 'High' })).toHaveAccessibleDescription(
        'Catches more spam, but may catch real mail',
      )
    })

    it('shows the saved level as chosen', () => {
      renderSettings()

      expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked()
    })

    it('reports a new level with the rest of the filter unchanged', async () => {
      renderSettings()

      await userEvent.click(screen.getByRole('radio', { name: 'High' }))

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, sensitivity: 'high' })
    })

    it('reports nothing while the page is saving', async () => {
      renderSettings({ readOnly: true })

      await userEvent.click(screen.getByRole('radio', { name: 'High' }))

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('block phrases', () => {
    it('labels the box and asks for a phrase', () => {
      renderSettings()

      expect(phraseBox()).toHaveAttribute('placeholder', 'Add a word or phrase, then press Enter')
      expect(phraseBox()).toHaveAttribute('enterkeyhint', 'done')
    })

    it('explains whole-phrase matching in the box description', () => {
      renderSettings()

      expect(phraseBox()).toHaveAccessibleDescription(
        'Each entry is matched as a whole phrase, so "app development" won\'t match "app" on its own. Mail whose subject or body contains any of them goes to Spam.',
      )
    })

    it('typing calls onDraftChange', async () => {
      renderSettings()

      await userEvent.type(phraseBox(), 'a')

      expect(onDraftChange).toHaveBeenCalledWith('blockPhrases', 'a')
    })

    it('hands its input to the page', () => {
      renderSettings()

      expect(inputRef).toHaveBeenCalledWith('blockPhrases', phraseBox())
      expect(inputRef).toHaveBeenCalledWith('trustedSenders', senderBox())
    })

    it('Enter on a valid phrase adds it via onChange and clears the draft', async () => {
      await addPhrase('app development')

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, blockPhrases: ['crypto', 'app development'] })
      expect(onErrorChange).toHaveBeenCalledWith('blockPhrases', undefined)
      expect(onDraftChange).toHaveBeenCalledWith('blockPhrases', '')
    })

    it('Add button is named "Add block phrase" and adds the draft', async () => {
      renderSettings({ drafts: { blockPhrases: 'invoice' } })

      await userEvent.click(screen.getByRole('button', { name: 'Add block phrase' }))

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, blockPhrases: ['crypto', 'invoice'] })
    })

    it('counts the list, naming it for a screen reader', () => {
      renderSettings()

      expect(screen.getByText((_, element) => element?.textContent === '1 of 100 block phrases')).toBeVisible()
    })

    it('Enter on "$$$" calls onErrorChange with "Add at least one letter or number."', async () => {
      await addPhrase('$$$')

      expect(onChange).not.toHaveBeenCalled()
      expect(onErrorChange).toHaveBeenCalledWith('blockPhrases', 'Add at least one letter or number.')
    })

    it('refuses a phrase over 100 characters', async () => {
      await addPhrase('a'.repeat(101))

      expect(onErrorChange).toHaveBeenCalledWith(
        'blockPhrases',
        'That phrase is 101 characters. Shorten it to 100 or fewer.',
      )
    })

    it('refuses a phrase once the list holds 100', async () => {
      const value = { ...spamFilter, blockPhrases: fullList('phrase') }
      renderSettings({ drafts: { blockPhrases: 'invoice' }, savedValue: value, value })
      await userEvent.type(phraseBox(), '{Enter}')

      expect(onErrorChange).toHaveBeenCalledWith(
        'blockPhrases',
        "You've reached the limit of 100 block phrases. Remove one to add another.",
      )
    })

    it('a repeat calls onErrorChange with the already-listed message', async () => {
      await addPhrase('CRYPTO')

      expect(onChange).not.toHaveBeenCalled()
      expect(onErrorChange).toHaveBeenCalledWith('blockPhrases', '“CRYPTO” is already on your list.')
    })

    it('refuses a repeat that differs only in punctuation', async () => {
      await addPhrase('Crypto!')

      expect(onChange).not.toHaveBeenCalled()
      expect(onErrorChange).toHaveBeenCalledWith('blockPhrases', '“Crypto!” is already on your list.')
    })

    it('leaving the box neither adds nor shows a refusal', async () => {
      renderSettings({ drafts: { blockPhrases: 'crypto' } })

      await userEvent.click(phraseBox())
      await userEvent.tab()

      expect(onChange).not.toHaveBeenCalled()
      expect(onErrorChange).not.toHaveBeenCalled()
    })

    it('errors prop renders in a FieldError status', () => {
      renderSettings({ errors: { blockPhrases: 'Add at least one letter or number.' } })

      expect(screen.getByText('Add at least one letter or number.').closest('[role="status"]')).toBeInTheDocument()
      expect(phraseBox()).toBeInvalid()
      expect(phraseBox()).toHaveAccessibleDescription(expect.stringContaining('Add at least one letter or number.'))
    })

    it('pending hint shows "Not added yet. Press Enter or choose Add." while a draft is present', () => {
      renderSettings({ drafts: { blockPhrases: 'invoice' } })

      expect(screen.getByText('Not added yet. Press Enter or choose Add.')).toBeVisible()
      expect(phraseBox()).toHaveAccessibleDescription(expect.stringContaining('Not added yet.'))
    })

    it('shows no pending hint when the draft is blank', () => {
      renderSettings({ drafts: { blockPhrases: '  ' } })

      expect(screen.queryByText('Not added yet. Press Enter or choose Add.')).not.toBeInTheDocument()
    })

    it('marks a phrase not yet saved', () => {
      renderSettings({
        savedValue: { ...spamFilter, blockPhrases: [] },
      })

      expect(screen.getByText('(not saved yet)', { exact: false })).toBeInTheDocument()
    })

    it('reports a removed phrase', async () => {
      renderSettings()

      await userEvent.click(screen.getByRole('button', { name: 'Remove crypto' }))

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, blockPhrases: [] })
    })

    it('removes nothing while the page is saving, and says why', async () => {
      renderSettings({ readOnly: true })

      await userEvent.click(screen.getByRole('button', { name: 'Remove crypto' }))

      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getAllByRole('status').map((region) => region.textContent)).toContain('Wait until Save finishes.')
    })

    it('adds nothing on Enter while the page is saving', async () => {
      renderSettings({ drafts: { blockPhrases: 'invoice' }, readOnly: true })

      await userEvent.type(phraseBox(), '{Enter}')

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('trusted senders', () => {
    it('labels the box and asks for an address or domain', () => {
      renderSettings()

      expect(senderBox()).toHaveAttribute('placeholder', 'Email or @domain.com')
      expect(senderBox()).toHaveAttribute('enterkeyhint', 'done')
    })

    it('says trust counts only when the sender can be verified (AC-041)', () => {
      renderSettings()

      expect(senderBox()).toHaveAccessibleDescription(
        'Trust senders by address (user@domain.com) or domain (@domain.com, which covers its subdomains). Their mail skips your spam filter when we can verify it really came from them, but mail that fails our virus or spam scan on arrival still goes to Spam.',
      )
    })

    it('typing calls onDraftChange', async () => {
      renderSettings()

      await userEvent.type(senderBox(), 'a')

      expect(onDraftChange).toHaveBeenCalledWith('trustedSenders', 'a')
    })

    it('Add button is named "Add trusted sender" and adds the draft', async () => {
      renderSettings({ drafts: { trustedSenders: '@new.com' } })

      await userEvent.click(screen.getByRole('button', { name: 'Add trusted sender' }))

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, trustedSenders: ['@harbor.org', '@new.com'] })
    })

    it('counts the list, naming it for a screen reader', () => {
      renderSettings()

      expect(screen.getByText((_, element) => element?.textContent === '1 of 100 trusted senders')).toBeVisible()
    })

    it('shows the pending hint for a typed sender', () => {
      renderSettings({ drafts: { trustedSenders: '@new.com' } })

      expect(screen.getByText('Not added yet. Press Enter or choose Add.')).toBeVisible()
    })

    it.each(['user@domain.com', '@domain.com', 'domain.com'])('adds %s', async (entry: string) => {
      await addSender(entry)

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, trustedSenders: ['@harbor.org', entry] })
    })

    it('refuses to trust everyone', async () => {
      await addSender('*')

      expect(onChange).not.toHaveBeenCalled()
      expect(onErrorChange).toHaveBeenCalledWith(
        'trustedSenders',
        'Trusting everyone would turn the filter off. Enter an address or a domain.',
      )
    })

    it.each([
      'harbor',
      'user@',
      '@domain',
      'a@b@c.com',
      'user name@domain.com',
      'domain.',
      'domain..com',
      '*@domain.com',
      '"user"@domain.com',
      '<user@domain.com>',
      'a,b@domain.com',
      'user@do;main.com',
      'user(x)@domain.com',
      "user@o'brien.com",
      'ex\u200bample.com',
    ])('refuses %s as neither an address nor a domain', async (entry: string) => {
      await addSender(entry)

      expect(onErrorChange).toHaveBeenCalledWith(
        'trustedSenders',
        'Enter an address (user@domain.com) or a domain (@domain.com).',
      )
    })

    it('refuses an entry over 100 characters', async () => {
      await addSender(`${'a'.repeat(97)}.com`)

      expect(onErrorChange).toHaveBeenCalledWith(
        'trustedSenders',
        'That entry is 101 characters. Shorten it to 100 or fewer.',
      )
    })

    it('refuses an entry once the list holds 100', async () => {
      const value = { ...spamFilter, trustedSenders: fullList('@sender') }
      renderSettings({ drafts: { trustedSenders: '@new.com' }, savedValue: value, value })
      await userEvent.type(senderBox(), '{Enter}')

      expect(onErrorChange).toHaveBeenCalledWith(
        'trustedSenders',
        "You've reached the limit of 100 trusted senders. Remove one to add another.",
      )
    })

    it('refuses a repeat in any case', async () => {
      await addSender('@HARBOR.org')

      expect(onErrorChange).toHaveBeenCalledWith('trustedSenders', '“@HARBOR.org” is already on your list.')
    })

    it('renders its own error', () => {
      renderSettings({ errors: { trustedSenders: 'Enter an address (user@domain.com) or a domain (@domain.com).' } })

      expect(senderBox()).toBeInvalid()
      expect(phraseBox()).toBeValid()
    })
  })

  describe('blockPhraseError', () => {
    it('accepts a phrase with words', () => {
      expect(blockPhraseError([], 'app development')).toBeUndefined()
    })

    it('refuses a phrase with no letters or digits', () => {
      expect(blockPhraseError([], '— ... —')).toBe('Add at least one letter or number.')
    })
  })

  describe('trustedSenderError', () => {
    it('accepts an address', () => {
      expect(trustedSenderError([], 'user@domain.com')).toBeUndefined()
    })

    it("accepts an apostrophe in the address's local part", () => {
      expect(trustedSenderError([], "o'brien@corp.com")).toBeUndefined()
    })

    it('refuses a wildcard', () => {
      expect(trustedSenderError([], '*')).toBe(
        'Trusting everyone would turn the filter off. Enter an address or a domain.',
      )
    })
  })
})
