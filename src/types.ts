export type { AuthUser } from 'aws-amplify/auth'
export type { Operation as PatchOperation } from 'fast-json-patch'

export interface StringObject {
  [key: string]: string
}

export interface AttachmentCommon {
  checksum?: string
  cid?: string
  content: unknown
  contentDisposition: string
  contentId?: string
  contentType: string
  filename?: string
  headerLines: unknown
  headers: StringObject
  related?: boolean
  size: number
  type: 'attachment'
}

// How much a push notification is allowed to reveal on a locked screen. The API applies the
// default on read, so every account this UI receives carries a concrete value; the field is
// required here because putAccount replaces the whole account and a body that omits it would
// silently reset the reader's choice. The constant lives beside the type because it is the
// type's canonical default, and this file is excluded from coverage.
export type NotificationPreview = 'sender-and-subject' | 'sender-only' | 'none'
export const DEFAULT_NOTIFICATION_PREVIEW: NotificationPreview = 'sender-and-subject'

// The owner's spam rules. Sensitivity picks the score threshold; block phrases send matching mail
// to Spam; trusted senders skip the content filter when the sender authenticates. The constant
// sits beside the type for the same reason as DEFAULT_NOTIFICATION_PREVIEW.
export type SpamSensitivity = 'low' | 'medium' | 'high'

export interface SpamFilter {
  blockPhrases: string[]
  sensitivity: SpamSensitivity
  trustedSenders: string[]
}

export const DEFAULT_SPAM_FILTER: SpamFilter = { blockPhrases: [], sensitivity: 'medium', trustedSenders: [] }

export interface Account {
  bounceSenders: string[]
  forwardTargets: string[]
  name: string
  notificationPreview: NotificationPreview
  id?: string
  // Optional, unlike notificationPreview: an account saved before the spam filter existed has
  // none (read it as `account.spamFilter ?? DEFAULT_SPAM_FILTER`), and the API keeps the stored
  // value when a PUT omits it, so leaving it out never resets the owner's rules.
  spamFilter?: SpamFilter
}

export interface AccountBatch {
  data: Account
  id: string
}

export interface DownloadedAttachment {
  body: Buffer
  type: string
}

export interface EmailAttachment {
  filename: string
  id: string
  key?: string
  size: number
  type: string
}

// A stored email with no folder is in the Inbox: mail received before the spam filter has none.
export type EmailFolder = 'inbox' | 'spam'

export interface Email {
  attachments?: EmailAttachment[]
  bcc?: string[]
  bounced?: boolean
  canBeBounced?: boolean
  cc?: string[]
  folder?: EmailFolder
  from: string
  subject: string
  timestamp: number
  to: string[]
  viewed: boolean
}

export interface EmailBatch {
  accountId: string
  data: Email
  id: string
}

export interface EmailAddress {
  address: string
  group?: string[]
  name: string
}

export interface EmailAddressParsed {
  html: string
  text: string
  value: EmailAddress[]
}

export interface EmailAddressReplyTo {
  display: string
  value: EmailAddress[]
}

export interface EmailContents {
  attachments?: EmailAttachment[]
  bccAddress?: EmailAddressParsed
  bodyHtml: string
  bodyText: string
  ccAddress?: EmailAddressParsed
  date?: string
  fromAddress: EmailAddressParsed
  headers: StringObject
  id: string
  inReplyTo?: string
  references: string[]
  replyToAddress: EmailAddressReplyTo
  subject?: string
  toAddress?: EmailAddressParsed
}

export interface EmailOutbound {
  attachments?: AttachmentCommon[]
  bcc?: EmailAddress[]
  cc?: EmailAddress[]
  from: EmailAddress
  headers?: StringObject
  html: string
  inReplyTo?: string
  references?: string[]
  replyTo: EmailAddress
  sender: EmailAddress
  subject: string
  text: string
  to: EmailAddress[]
}

// Which of the five mutually exclusive things the install offer can show. The browser
// decides which one; the reader never picks. `hidden` covers both an already-installed
// app and a browser that cannot install at all — in both cases the offer renders nothing.
export type InstallState = 'chromium' | 'hidden' | 'ios' | 'menu' | 'promptable' | 'spent'

// The two surfaces the offer renders on: the midnight-navy shell (sign-in card) and the
// warm-linen paper (Settings). Drives which token set the component reaches for.
export type InstallSurface = 'paper' | 'shell'

// A new block phrase and the Inbox subjects it would match.
export interface PhraseMatch {
  phrase: string
  subjects: string[]
}

// What a failed API call throws: the status lets callers tell 403, 429 and 503 apart.
export interface HttpError extends Error {
  status: number
}

export interface PostSignedUrl {
  fields: StringObject
  url: string
}

export interface SignedUrl {
  url: string
}

// Only changes that make the filter stricter. The API drops any other kind before it reaches
// the UI. For raiseSensitivity, `value` is the new SpamSensitivity.
export type SpamSuggestionKind = 'addBlockPhrase' | 'removeTrustedSender' | 'raiseSensitivity'

export interface SpamSuggestion {
  id: string
  kind: SpamSuggestionKind
  reason: string
  value: string
}

export interface SpamSuggestionsResponse {
  suggestions: SpamSuggestion[]
}
