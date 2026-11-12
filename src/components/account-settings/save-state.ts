import { forwardAddressError } from '@components/address-line'
import { bounceRuleError } from '@components/bounce-sender-input'
import { blockPhraseError, trustedSenderError } from '@components/spam-filter-settings'
import { Account, DEFAULT_SPAM_FILTER, SpamFilter } from '@types'

export type SectionKey = 'name' | 'forwarding' | 'bounce' | 'spam'
export type DraftKey = 'forwarding' | 'bounce' | 'blockPhrases' | 'trustedSenders'

export const SECTION_ORDER: SectionKey[] = ['name', 'forwarding', 'bounce', 'spam']
export const DRAFT_ORDER: DraftKey[] = ['forwarding', 'bounce', 'blockPhrases', 'trustedSenders']
const DRAFT_SECTION: Record<DraftKey, SectionKey> = {
  forwarding: 'forwarding',
  bounce: 'bounce',
  blockPhrases: 'spam',
  trustedSenders: 'spam',
}

export type Drafts = Record<DraftKey, string>

export interface Fields {
  name: string
  forwardTargets: string[]
  bounceSenders: string[]
  spamFilter: SpamFilter
}

export const EMPTY_DRAFTS: Drafts = { forwarding: '', bounce: '', blockPhrases: '', trustedSenders: '' }

export const SECTION_LABEL: Record<SectionKey, string> = {
  name: 'Display name',
  forwarding: 'Forwarding',
  bounce: 'Bounce rules',
  spam: 'Spam filter',
}

export const ENTRY_NOUN: Record<DraftKey, string> = {
  forwarding: 'forwarding address',
  bounce: 'bounce rule',
  blockPhrases: 'block phrase',
  trustedSenders: 'trusted sender',
}

const sameList = (a: string[], b: string[]): boolean => a.length === b.length && a.every((item, i) => item === b[i])

const hasDraft = (drafts: Drafts, section: SectionKey): boolean =>
  DRAFT_ORDER.some((key) => DRAFT_SECTION[key] === section && drafts[key].trim() !== '')

const sectionChanged = (account: Account, fields: Fields, drafts: Drafts, section: SectionKey): boolean => {
  const saved = account.spamFilter ?? DEFAULT_SPAM_FILTER
  const fieldsDiffer = {
    name: () => fields.name !== account.name,
    forwarding: () => !sameList(fields.forwardTargets, account.forwardTargets),
    bounce: () => !sameList(fields.bounceSenders, account.bounceSenders),
    spam: () =>
      fields.spamFilter.sensitivity !== saved.sensitivity ||
      !sameList(fields.spamFilter.blockPhrases, saved.blockPhrases) ||
      !sameList(fields.spamFilter.trustedSenders, saved.trustedSenders),
  }[section]
  return fieldsDiffer() || hasDraft(drafts, section)
}

export const changedSections = (account: Account, fields: Fields, drafts: Drafts): SectionKey[] =>
  SECTION_ORDER.filter((section) => sectionChanged(account, fields, drafts, section))

const listFor = (fields: Fields, key: DraftKey): string[] =>
  ({
    forwarding: fields.forwardTargets,
    bounce: fields.bounceSenders,
    blockPhrases: fields.spamFilter.blockPhrases,
    trustedSenders: fields.spamFilter.trustedSenders,
  })[key]

const VALIDATORS: Record<DraftKey, (list: string[], entry: string) => string | undefined> = {
  forwarding: forwardAddressError,
  bounce: bounceRuleError,
  blockPhrases: blockPhraseError,
  trustedSenders: trustedSenderError,
}

const appendDraft = (fields: Fields, key: DraftKey, entry: string): Fields =>
  ({
    forwarding: { ...fields, forwardTargets: [...fields.forwardTargets, entry] },
    bounce: { ...fields, bounceSenders: [...fields.bounceSenders, entry] },
    blockPhrases: {
      ...fields,
      spamFilter: { ...fields.spamFilter, blockPhrases: [...fields.spamFilter.blockPhrases, entry] },
    },
    trustedSenders: {
      ...fields,
      spamFilter: { ...fields.spamFilter, trustedSenders: [...fields.spamFilter.trustedSenders, entry] },
    },
  })[key]

const isRepeat = (list: string[], entry: string): boolean =>
  list.some((item) => item.trim().toLowerCase() === entry.toLowerCase())

export const commitDrafts = (
  fields: Fields,
  drafts: Drafts,
): { ok: true; fields: Fields } | { ok: false; errors: Partial<Record<DraftKey, string>>; first: DraftKey } => {
  const pending = DRAFT_ORDER.map((key) => ({ key, entry: drafts[key].trim() })).filter(({ entry }) => entry !== '')
  const checked = pending
    .filter(({ key, entry }) => !isRepeat(listFor(fields, key), entry))
    .map(({ key, entry }) => ({ key, entry, error: VALIDATORS[key](listFor(fields, key), entry) }))
  const refused = checked.filter(({ error }) => error !== undefined)
  if (refused.length > 0) {
    return {
      ok: false,
      errors: Object.fromEntries(refused.map(({ key, error }) => [key, error])),
      first: refused[0].key,
    }
  }
  return { ok: true, fields: checked.reduce((acc, { key, entry }) => appendDraft(acc, key, entry), fields) }
}

export const joinSections = (sections: SectionKey[]): string => {
  const labels = sections.map((section) => SECTION_LABEL[section])
  if (labels.length <= 2) {
    return labels.join(' and ')
  }
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`
}

export const draftLine = (count: number): string | undefined => {
  if (count <= 0) {
    return undefined
  }
  return count === 1
    ? "1 entry isn't added yet. Save adds it first."
    : `${count} entries aren't added yet. Save adds them first.`
}
