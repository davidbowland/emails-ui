import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

import {
  applySuggestions,
  containsPhrase,
  isFreeMailDomain,
  isValidTrustedSender,
  matchInboxSubjects,
  newPhraseMatches,
  SPAM_FILTER_LIST_LIMIT,
  toWords,
  wouldExceedLimits,
} from './spam-impact'
import vectors from '@assets/phrase-matching-vectors.json'
import { DEFAULT_SPAM_FILTER, EmailBatch, SpamFilter, SpamSuggestion } from '@types'

interface PhraseVector {
  expected: boolean
  note: string
  phrase: string
  text: string
}

const toEmail = (subject: string, index: number): EmailBatch => ({
  accountId: 'account',
  data: { from: 'sender@domain.com', subject, timestamp: index, to: ['dave@domain.com'], viewed: false },
  id: `email-${index}`,
})

const inbox: EmailBatch[] = [
  'Quick question about your app',
  'Happy birthday!',
  'App: install today',
  'Reply with “NO” to stop',
  'Weekly report',
].map(toEmail)

const suggestion = (kind: SpamSuggestion['kind'], value: string): SpamSuggestion => ({
  id: `${kind}-${value}`,
  kind,
  reason: 'Because',
  value,
})

const listOf = (size: number, prefix: string): string[] =>
  Array.from({ length: size }, (_, index) => `${prefix}${index}`)

describe('spam-impact', () => {
  describe('phrase-matching vectors', () => {
    it('should cover at least 25 cases', () => {
      expect((vectors as PhraseVector[]).length).toBeGreaterThanOrEqual(25)
    })

    // emails-inbound-service keeps an identical copy of this file and pins the same hash, so the two
    // matchers are tested against the same cases. Change both copies together and update both hashes.
    it('should match the hash pinned in both repos', () => {
      const file = readFileSync(join(__dirname, '../assets/phrase-matching-vectors.json'))

      expect(createHash('sha256').update(file).digest('hex')).toEqual(
        '5dd99f289e03d75e07ab265b3e01dfe204689abce0bbce5368a903ac591ade78',
      )
    })

    it.each(vectors as PhraseVector[])('$note', ({ expected, phrase, text }) => {
      expect(containsPhrase(toWords(text), toWords(phrase))).toEqual(expected)
    })
  })

  describe('toWords', () => {
    it('should drop every format character, including the soft hyphen', () => {
      expect(toWords('What\u00ADsApp n\u2060ow')).toEqual(['whatsapp', 'now'])
    })

    it('should keep combining marks inside their word', () => {
      expect(toWords('İstanbul')).toHaveLength(1)
      expect(toWords('नमस्ते दुनिया')).toHaveLength(2)
    })

    it('should normalize, fold and split per AC-048', () => {
      expect(toWords('  Won’t STOP​— reply “NO”… 12/hour\n')).toEqual(['wont', 'stop', 'reply', 'no', '12', 'hour'])
    })

    it('should return no words for symbols only', () => {
      expect(toWords('$$$ --- !!!')).toEqual([])
    })

    it('should keep letters and digits from other scripts', () => {
      expect(toWords('Привет, мир 2024')).toEqual(['привет', 'мир', '2024'])
    })
  })

  describe('containsPhrase', () => {
    it('should match consecutive words', () => {
      expect(containsPhrase(['a', 'b', 'c'], ['b', 'c'])).toBe(true)
    })

    it('should not match words that are not consecutive', () => {
      expect(containsPhrase(['a', 'b', 'c'], ['a', 'c'])).toBe(false)
    })

    it('should not match an empty phrase', () => {
      expect(containsPhrase(['a'], [])).toBe(false)
    })

    it('should not match a phrase longer than the text', () => {
      expect(containsPhrase(['a'], ['a', 'b'])).toBe(false)
    })
  })

  describe('matchInboxSubjects', () => {
    it('should return the subjects containing the phrase as whole words', () => {
      expect(matchInboxSubjects('app', inbox)).toEqual(['Quick question about your app', 'App: install today'])
    })

    it('should match across quote styles', () => {
      expect(matchInboxSubjects('reply with "no"', inbox)).toEqual(['Reply with “NO” to stop'])
    })

    it('should return nothing for a phrase with no words', () => {
      expect(matchInboxSubjects('!!!', inbox)).toEqual([])
    })

    it('should treat a missing subject as empty', () => {
      const noSubject = { ...toEmail('', 9), data: { ...toEmail('', 9).data, subject: undefined } }

      expect(matchInboxSubjects('app', [noSubject as unknown as EmailBatch])).toEqual([])
    })
  })

  describe('newPhraseMatches', () => {
    it('should report only new phrases that match a subject', () => {
      expect(newPhraseMatches(['weekly'], ['weekly', 'app', 'invoice', 'birthday'], inbox)).toEqual([
        { phrase: 'app', subjects: ['Quick question about your app', 'App: install today'] },
        { phrase: 'birthday', subjects: ['Happy birthday!'] },
      ])
    })

    it('should report nothing when no phrase is new', () => {
      expect(newPhraseMatches(['app'], ['app'], inbox)).toEqual([])
    })
  })

  describe('isFreeMailDomain', () => {
    it.each(['gmail.com', '@outlook.com', 'Someone@Hotmail.com', ' yahoo.com ', 'icloud.com', 'aol.com', 'proton.me'])(
      'should flag %s',
      (domain) => {
        expect(isFreeMailDomain(domain)).toBe(true)
      },
    )

    it.each(['domain.com', '@company.example', 'mail.gmail.com.example', 'user@gmail.co'])(
      'should not flag %s',
      (domain) => {
        expect(isFreeMailDomain(domain)).toBe(false)
      },
    )
  })

  describe('isValidTrustedSender', () => {
    it.each([
      'user@domain.com',
      'first.last+tag@mail.domain.co.uk',
      "o'brien@corp.com",
      '@domain.com',
      'domain.com',
      'mail.domain.com',
    ])('should accept %s', (entry) => {
      expect(isValidTrustedSender(entry)).toBe(true)
    })

    it.each([
      '*',
      '*@domain.com',
      '@*.com',
      '*.domain.com',
      'com',
      '@com',
      'user@domain',
      'user@',
      '@',
      '',
      'user name@domain.com',
      'user@@domain.com',
      'domain..com',
      '.domain.com',
      'domain.com.',
      'a,b@domain.com',
      'user@do;main.com',
      '<user@domain.com>',
      '"user"@domain.com',
      "user@o'brien.com",
      "@o'brien.com",
      "o'brien.com",
      'user(x)@domain.com',
      'ex\u200bample.com',
    ])('should reject "%s"', (entry) => {
      expect(isValidTrustedSender(entry)).toBe(false)
    })
  })

  describe('applySuggestions', () => {
    const spamFilter: SpamFilter = {
      blockPhrases: ['crypto'],
      sensitivity: 'medium',
      trustedSenders: ['friend@domain.com', '@partner.com'],
    }

    it('should append a block phrase', () => {
      expect(applySuggestions(spamFilter, [suggestion('addBlockPhrase', 'usd 12/hour')]).blockPhrases).toEqual([
        'crypto',
        'usd 12/hour',
      ])
    })

    it('should not add a block phrase twice', () => {
      expect(applySuggestions(spamFilter, [suggestion('addBlockPhrase', 'crypto')]).blockPhrases).toEqual(['crypto'])
    })

    it('should not add a block phrase that differs only in case or punctuation', () => {
      expect(applySuggestions(spamFilter, [suggestion('addBlockPhrase', 'Crypto!')]).blockPhrases).toEqual(['crypto'])
    })

    it('should remove a trusted sender regardless of case', () => {
      expect(
        applySuggestions(spamFilter, [suggestion('removeTrustedSender', 'Friend@Domain.com')]).trustedSenders,
      ).toEqual(['@partner.com'])
    })

    it('should raise sensitivity', () => {
      expect(applySuggestions(spamFilter, [suggestion('raiseSensitivity', 'high')]).sensitivity).toEqual('high')
    })

    it.each(['low', 'medium', 'extreme', 'constructor'])('should ignore raising sensitivity to %s', (value) => {
      expect(applySuggestions(spamFilter, [suggestion('raiseSensitivity', value)]).sensitivity).toEqual('medium')
    })

    it('should ignore an unknown kind', () => {
      const unknown = { ...suggestion('addBlockPhrase', 'x'), kind: 'addTrustedSender' } as unknown as SpamSuggestion

      expect(applySuggestions(spamFilter, [unknown])).toEqual(spamFilter)
    })

    it('should apply several suggestions without changing the input', () => {
      const result = applySuggestions(spamFilter, [
        suggestion('addBlockPhrase', 'whatsapp'),
        suggestion('removeTrustedSender', '@partner.com'),
        suggestion('raiseSensitivity', 'high'),
      ])

      expect(result).toEqual({
        blockPhrases: ['crypto', 'whatsapp'],
        sensitivity: 'high',
        trustedSenders: ['friend@domain.com'],
      })
      expect(spamFilter).toEqual({
        blockPhrases: ['crypto'],
        sensitivity: 'medium',
        trustedSenders: ['friend@domain.com', '@partner.com'],
      })
    })
  })

  describe('wouldExceedLimits', () => {
    it('should return undefined for lists that grow to the limit', () => {
      expect(
        wouldExceedLimits(DEFAULT_SPAM_FILTER, {
          ...DEFAULT_SPAM_FILTER,
          blockPhrases: listOf(SPAM_FILTER_LIST_LIMIT, 'p'),
          trustedSenders: listOf(SPAM_FILTER_LIST_LIMIT, 's'),
        }),
      ).toBeUndefined()
    })

    it('should report block phrases that grow past the limit', () => {
      expect(
        wouldExceedLimits(
          { ...DEFAULT_SPAM_FILTER, blockPhrases: listOf(100, 'p') },
          { ...DEFAULT_SPAM_FILTER, blockPhrases: listOf(101, 'p') },
        ),
      ).toEqual('blockPhrases')
    })

    it('should report trusted senders that grow past the limit', () => {
      expect(
        wouldExceedLimits(
          { ...DEFAULT_SPAM_FILTER, trustedSenders: listOf(100, 's') },
          { ...DEFAULT_SPAM_FILTER, trustedSenders: listOf(101, 's') },
        ),
      ).toEqual('trustedSenders')
    })

    it('should ignore lists already over the limit that do not grow', () => {
      const overFull = { ...DEFAULT_SPAM_FILTER, blockPhrases: listOf(101, 'p'), trustedSenders: listOf(102, 's') }

      expect(
        wouldExceedLimits(overFull, { ...overFull, sensitivity: 'high', trustedSenders: listOf(101, 's') }),
      ).toBeUndefined()
    })
  })
})
