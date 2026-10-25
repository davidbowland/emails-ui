import React from 'react'

import SpamFilterSettings, { blockPhraseError, SpamFilterSettingsHandle, trustedSenderError } from './index'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpamFilter } from '@types'

describe('SpamFilterSettings', () => {
  const onChange = jest.fn()

  const spamFilter: SpamFilter = {
    blockPhrases: ['crypto'],
    sensitivity: 'medium',
    trustedSenders: ['@harbor.org'],
  }

  const fullList = (prefix: string): string[] => Array.from({ length: 100 }, (_, index) => `${prefix}${index}.com`)

  // act() is not documented to hand back its callback's result, so the result is collected here.
  const commit = (ref: React.RefObject<SpamFilterSettingsHandle | null>): SpamFilter | undefined => {
    const results: (SpamFilter | undefined)[] = []
    act(() => {
      results.push(ref.current?.commitDrafts())
    })
    return results[0]
  }

  const renderSettings = (
    value: SpamFilter = spamFilter,
    disabled = false,
    ref?: React.Ref<SpamFilterSettingsHandle>,
  ): void => {
    render(<SpamFilterSettings disabled={disabled} onChange={onChange} ref={ref} value={value} />)
  }

  const phraseBox = (): HTMLInputElement => screen.getByRole('textbox', { name: 'Block phrases:' }) as HTMLInputElement
  const senderBox = (): HTMLInputElement =>
    screen.getByRole('textbox', { name: 'Trusted senders:' }) as HTMLInputElement

  const addPhrase = async (text: string): Promise<void> => {
    await userEvent.type(phraseBox(), `${text}{Enter}`)
  }

  const addSender = async (text: string): Promise<void> => {
    await userEvent.type(senderBox(), `${text}{Enter}`)
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

  describe('sensitivity', () => {
    it('explains the score on the group itself (AC-037)', () => {
      renderSettings()

      expect(screen.getByRole('group', { name: 'Sensitivity' })).toHaveAccessibleDescription(
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
      renderSettings(spamFilter, true)

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

    it('adds a phrase on Enter', async () => {
      renderSettings()

      await addPhrase('app development')

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, blockPhrases: ['crypto', 'app development'] })
    })

    it('counts the list, naming it for a screen reader', () => {
      renderSettings()

      expect(screen.getByText((_, element) => element?.textContent === '1 of 100 block phrases')).toBeVisible()
    })

    it('refuses a phrase of symbols alone, keeping it in the box with the reason linked to it', async () => {
      renderSettings()

      await addPhrase('!!!')

      expect(onChange).not.toHaveBeenCalled()
      expect(phraseBox()).toHaveValue('!!!')
      expect(phraseBox()).toBeInvalid()
      expect(phraseBox()).toHaveAccessibleDescription(expect.stringContaining('Add at least one letter or number.'))
    })

    it('announces the reason in a live region', async () => {
      renderSettings()

      await addPhrase('!!!')

      expect(screen.getByText('Add at least one letter or number.').closest('[role="status"]')).toBeInTheDocument()
    })

    it('refuses a phrase over 100 characters', async () => {
      renderSettings()

      await addPhrase('a'.repeat(101))

      expect(screen.getByText('That phrase is 101 characters. Shorten it to 100 or fewer.')).toBeVisible()
    })

    it('refuses a phrase once the list holds 100', async () => {
      renderSettings({ ...spamFilter, blockPhrases: fullList('phrase') })

      await addPhrase('invoice')

      expect(
        screen.getByText("You've reached the limit of 100 block phrases. Remove one to add another."),
      ).toBeVisible()
    })

    it('refuses an exact repeat in any case', async () => {
      renderSettings()

      await addPhrase('CRYPTO')

      expect(screen.getByText('“CRYPTO” is already on your list.')).toBeVisible()
    })

    it('refuses a repeat that differs only in punctuation', async () => {
      renderSettings()

      await addPhrase('Crypto!')

      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText('“Crypto!” is already on your list.')).toBeVisible()
    })

    it('clears the reason once a phrase is added', async () => {
      renderSettings()

      await addPhrase('!!!')
      await userEvent.clear(phraseBox())
      await addPhrase('invoice')

      expect(screen.queryByText('Add at least one letter or number.')).not.toBeInTheDocument()
      expect(phraseBox()).toBeValid()
    })

    it('explains a refused repeat once the box loses focus', async () => {
      renderSettings()

      await userEvent.type(phraseBox(), 'crypto')
      await userEvent.tab()

      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByText('“crypto” is already on your list.')).toBeVisible()
    })

    it('clears the reason once the box is emptied', async () => {
      renderSettings()

      await addPhrase('!!!')
      await userEvent.clear(phraseBox())

      expect(screen.queryByText('Add at least one letter or number.')).not.toBeInTheDocument()
      expect(phraseBox()).toBeValid()
    })

    it('clears the reason when an emptied box loses focus', async () => {
      renderSettings()

      await addPhrase('!!!')
      fireEvent.blur(phraseBox(), { target: { value: '' } })

      expect(screen.queryByText('Add at least one letter or number.')).not.toBeInTheDocument()
    })

    it('reports a removed phrase', async () => {
      renderSettings()

      await userEvent.click(screen.getByRole('button', { name: 'Remove crypto' }))

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, blockPhrases: [] })
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

    it('counts the list, naming it for a screen reader', () => {
      renderSettings()

      expect(screen.getByText((_, element) => element?.textContent === '1 of 100 trusted senders')).toBeVisible()
    })

    it.each(['user@domain.com', '@domain.com', 'domain.com'])('adds %s', async (entry: string) => {
      renderSettings()

      await addSender(entry)

      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, trustedSenders: ['@harbor.org', entry] })
    })

    it('refuses to trust everyone', async () => {
      renderSettings()

      await addSender('*')

      expect(onChange).not.toHaveBeenCalled()
      expect(senderBox()).toBeInvalid()
      expect(senderBox()).toHaveAccessibleDescription(
        expect.stringContaining('Trusting everyone would turn the filter off. Enter an address or a domain.'),
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
      renderSettings()

      await addSender(entry)

      expect(screen.getByText('Enter an address (user@domain.com) or a domain (@domain.com).')).toBeVisible()
    })

    it('refuses an entry over 100 characters', async () => {
      renderSettings()

      await addSender(`${'a'.repeat(97)}.com`)

      expect(screen.getByText('That entry is 101 characters. Shorten it to 100 or fewer.')).toBeVisible()
    })

    it('refuses an entry once the list holds 100', async () => {
      renderSettings({ ...spamFilter, trustedSenders: fullList('@sender') })

      await addSender('@new.com')

      expect(
        screen.getByText("You've reached the limit of 100 trusted senders. Remove one to add another."),
      ).toBeVisible()
    })

    it('refuses a repeat in any case', async () => {
      renderSettings()

      await addSender('@HARBOR.org')

      expect(screen.getByText('“@HARBOR.org” is already on your list.')).toBeVisible()
    })
  })

  describe('commitDrafts', () => {
    it('adds a phrase still in its box, clears the box and returns the filter to save', async () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      await userEvent.type(phraseBox(), 'invoice')
      const result = commit(ref)

      expect(result).toEqual({ ...spamFilter, blockPhrases: ['crypto', 'invoice'] })
      expect(onChange).toHaveBeenCalledWith({ ...spamFilter, blockPhrases: ['crypto', 'invoice'] })
      expect(phraseBox()).toHaveValue('')
    })

    it('adds a trusted sender still in its box', async () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      await userEvent.type(senderBox(), '@new.com')
      const result = commit(ref)

      expect(result).toEqual({ ...spamFilter, trustedSenders: ['@harbor.org', '@new.com'] })
      expect(senderBox()).toHaveValue('')
    })

    it('adds the entries still in both boxes and clears them both', () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      fireEvent.change(phraseBox(), { target: { value: 'invoice' } })
      fireEvent.change(senderBox(), { target: { value: '@new.com' } })
      const result = commit(ref)

      const expected = {
        ...spamFilter,
        blockPhrases: ['crypto', 'invoice'],
        trustedSenders: ['@harbor.org', '@new.com'],
      }
      expect(result).toEqual(expected)
      expect(onChange).toHaveBeenCalledWith(expected)
      expect(phraseBox()).toHaveValue('')
      expect(senderBox()).toHaveValue('')
    })

    it('drops an exact repeat silently, clearing its box without blocking the save', () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      fireEvent.change(senderBox(), { target: { value: '@HARBOR.org' } })
      const result = commit(ref)

      expect(result).toEqual(spamFilter)
      expect(onChange).not.toHaveBeenCalled()
      expect(senderBox()).toHaveValue('')
      expect(senderBox()).toBeValid()
      expect(screen.queryByText('“@HARBOR.org” is already on your list.')).not.toBeInTheDocument()
    })

    it('drops a repeat and still adds the other box’s entry', () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      fireEvent.change(phraseBox(), { target: { value: 'crypto' } })
      fireEvent.change(senderBox(), { target: { value: '@new.com' } })
      const result = commit(ref)

      expect(result).toEqual({ ...spamFilter, trustedSenders: ['@harbor.org', '@new.com'] })
      expect(phraseBox()).toHaveValue('')
    })

    it('returns the filter unchanged and reports nothing when both boxes are empty', () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      const result = commit(ref)

      expect(result).toEqual(spamFilter)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('returns nothing, shows the reason and focuses the box when a typed entry is refused', async () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      await userEvent.type(senderBox(), '*')
      await userEvent.click(screen.getByRole('radio', { name: 'Medium' }))
      const result = commit(ref)

      expect(result).toBeUndefined()
      expect(onChange).not.toHaveBeenCalled()
      expect(senderBox()).toHaveFocus()
      expect(senderBox()).toHaveValue('*')
      expect(
        screen.getByText('Trusting everyone would turn the filter off. Enter an address or a domain.'),
      ).toBeVisible()
    })

    it('focuses the first refused box when both boxes hold refused entries', () => {
      const ref = React.createRef<SpamFilterSettingsHandle>()
      renderSettings(spamFilter, false, ref)

      fireEvent.change(phraseBox(), { target: { value: '!!!' } })
      fireEvent.change(senderBox(), { target: { value: '*' } })
      const result = commit(ref)

      expect(result).toBeUndefined()
      expect(phraseBox()).toHaveFocus()
      expect(screen.getByText('Add at least one letter or number.')).toBeVisible()
      expect(
        screen.getByText('Trusting everyone would turn the filter off. Enter an address or a domain.'),
      ).toBeVisible()
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
