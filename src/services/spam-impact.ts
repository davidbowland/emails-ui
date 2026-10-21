import { EmailBatch, PhraseMatch, SpamFilter, SpamSensitivity, SpamSuggestion } from '@types'

// The API rejects a list longer than this; the UI checks first so it never sends one.
export const SPAM_FILTER_LIST_LIMIT = 100

/* Phrase matching (AC-048) */

// Every Unicode format character: zero-width spaces and joiners, the BOM, the soft hyphen. Senders
// hide them inside words to dodge filters.
const FORMAT_CHARACTER = /\p{Cf}/u

// Escaped so every character is visible in review: NBSP, en dash, em dash, curly quotes, ellipsis.
const LOOK_ALIKES: Readonly<Record<string, string>> = {
  '\u00A0': ' ',
  '\u2013': '-',
  '\u2014': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2026': '...',
}

// A fixed pattern. Nothing the owner or a sender types is ever turned into a RegExp.
// Combining marks stay inside their word, so "İstanbul" is one word, not two.
const WORD_CHARACTER = /[\p{L}\p{M}\p{N}]/u

// NFKC; lowercase; drop format characters; fold typographic look-alikes; delete apostrophes
// (so "won't" and "wont" agree); treat everything but letters, combining marks and digits as a
// space; split.
export const toWords = (text: string): string[] =>
  Array.from(
    Array.from(text.normalize('NFKC').toLowerCase())
      .filter((character) => !FORMAT_CHARACTER.test(character))
      .map((character) => LOOK_ALIKES[character] ?? character)
      .join(''),
  )
    .filter((character) => character !== "'")
    .map((character) => (WORD_CHARACTER.test(character) ? character : ' '))
    .join('')
    .split(' ')
    .filter((word) => word.length > 0)

// True when the phrase's words appear consecutively in the text. A phrase with no words (only
// symbols) matches nothing.
export const containsPhrase = (textWords: string[], phraseWords: string[]): boolean =>
  phraseWords.length > 0 &&
  textWords.some(
    (_, start) =>
      start + phraseWords.length <= textWords.length &&
      phraseWords.every((word, offset) => textWords[start + offset] === word),
  )

/* Impact on the Inbox */

// The subjects of the given emails that contain the phrase. The list API returns no bodies, so
// subjects are all the UI can check.
export const matchInboxSubjects = (phrase: string, emails: EmailBatch[]): string[] => {
  const phraseWords = toWords(phrase)
  return emails
    .map((email) => email.data.subject || '')
    .filter((subject) => containsPhrase(toWords(subject), phraseWords))
}

// Each phrase in `next` that is not in `saved` and matches at least one Inbox subject.
export const newPhraseMatches = (saved: string[], next: string[], emails: EmailBatch[]): PhraseMatch[] =>
  next
    .filter((phrase) => !saved.includes(phrase))
    .map((phrase) => ({ phrase, subjects: matchInboxSubjects(phrase, emails) }))
    .filter((match) => match.subjects.length > 0)

/* Trust */

const FREE_MAIL_DOMAINS = new Set([
  'aol.com',
  'gmail.com',
  'hotmail.com',
  'icloud.com',
  'outlook.com',
  'proton.me',
  'yahoo.com',
])

// Accepts a bare domain, an @domain rule or a full address. Trusting one of these domains would
// trust millions of strangers, so only the address may be trusted.
export const isFreeMailDomain = (domain: string): boolean => {
  const trimmed = domain.trim().toLowerCase()
  return FREE_MAIL_DOMAINS.has(trimmed.slice(trimmed.lastIndexOf('@') + 1))
}

/* Suggestions */

const SENSITIVITY_RANK: Readonly<Record<SpamSensitivity, number>> = { high: 3, low: 1, medium: 2 }

const isSensitivity = (value: string): value is SpamSensitivity => Object.hasOwn(SENSITIVITY_RANK, value)

const applySuggestion = (spamFilter: SpamFilter, suggestion: SpamSuggestion): SpamFilter => {
  switch (suggestion.kind) {
    case 'addBlockPhrase':
      // Compared as words, so "Crypto!" and "crypto" count as the same phrase.
      return spamFilter.blockPhrases.some((phrase) => toWords(phrase).join(' ') === toWords(suggestion.value).join(' '))
        ? spamFilter
        : { ...spamFilter, blockPhrases: [...spamFilter.blockPhrases, suggestion.value] }
    case 'removeTrustedSender':
      return {
        ...spamFilter,
        trustedSenders: spamFilter.trustedSenders.filter(
          (sender) => sender.toLowerCase() !== suggestion.value.toLowerCase(),
        ),
      }
    case 'raiseSensitivity':
      // Stricter only: a value that would lower sensitivity, or is not a level at all, is ignored.
      return isSensitivity(suggestion.value) &&
        SENSITIVITY_RANK[suggestion.value] > SENSITIVITY_RANK[spamFilter.sensitivity]
        ? { ...spamFilter, sensitivity: suggestion.value }
        : spamFilter
    default:
      return spamFilter
  }
}

// The filter with the picked suggestions applied in order. The input is never changed.
export const applySuggestions = (spamFilter: SpamFilter, picked: SpamSuggestion[]): SpamFilter =>
  picked.reduce(applySuggestion, spamFilter)

// Which list, if any, is over the limit. Block phrases are checked first.
export const wouldExceedLimits = (spamFilter: SpamFilter): 'blockPhrases' | 'trustedSenders' | undefined =>
  spamFilter.blockPhrases.length > SPAM_FILTER_LIST_LIMIT
    ? 'blockPhrases'
    : spamFilter.trustedSenders.length > SPAM_FILTER_LIST_LIMIT
      ? 'trustedSenders'
      : undefined
