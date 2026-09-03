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

export interface Account {
  bounceSenders: string[]
  forwardTargets: string[]
  name: string
  notificationPreview: NotificationPreview
  id?: string
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

export interface Email {
  attachments?: EmailAttachment[]
  bcc?: string[]
  bounced?: boolean
  canBeBounced?: boolean
  cc?: string[]
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

export interface PostSignedUrl {
  fields: StringObject
  url: string
}

export interface SignedUrl {
  url: string
}
