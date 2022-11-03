export { AmplifyUser } from '@aws-amplify/ui'
export { Operation as PatchOperation } from 'fast-json-patch'
export { Theme } from '@mui/material/styles'

export interface StringObject {
  [key: string]: string
}

export interface AttachmentContents {
  body: Buffer | string
  metadata: StringObject
}

export interface Account {
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
  html: string
  text: string
  value: {
    address: string
    group?: string[]
    name: string
  }[]
}

export interface EmailAddressReplyTo {
  display: string
  value: {
    address: string
    group?: string[]
    name: string
  }[]
}

export interface EmailHeaders {
  [key: string]: string
}

export interface EmailContents {
  attachments?: EmailAttachment[]
  bodyHtml: string
  bodyText: string
  ccAddress?: EmailAddress
  fromAddress: EmailAddress
  headers: EmailHeaders
  id: string
  inReplyTo?: string
  references: string[]
  replyToAddress: EmailAddressReplyTo
  subject?: string
  toAddress?: EmailAddress
}
