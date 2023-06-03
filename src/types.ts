export { AmplifyUser } from '@aws-amplify/ui'
export { Operation as PatchOperation } from 'fast-json-patch'
export { Theme } from '@mui/material/styles'

export interface StringObject {
  [key: string]: string
}

export interface AttachmentCommon {
  checksum?: string
  cid?: string
  content: any
  contentDisposition: string
  contentId?: string
  contentType: string
  filename?: string
  headerLines: any
  headers: StringObject
  related?: boolean
  size: number
  type: 'attachment'
}

export interface AttachmentContents {
  body: Buffer | string
  metadata: StringObject
}

export interface Account {
  name: string
  id?: string
  forwardTargets: string[]
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

export interface EmailHeaders {
  [key: string]: string
}

export interface EmailContents {
  attachments?: EmailAttachment[]
  bccAddress?: EmailAddressParsed
  bodyHtml: string
  bodyText: string
  ccAddress?: EmailAddressParsed
  date?: string
  fromAddress: EmailAddressParsed
  headers: EmailHeaders
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

export interface PostSignedUrl {
  fields: StringObject
  url: string
}

export interface SignedUrl {
  url: string
}
