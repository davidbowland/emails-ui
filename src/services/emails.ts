import { API } from 'aws-amplify'

import {
  Account,
  Email,
  EmailBatch,
  EmailContents,
  EmailOutbound,
  PatchOperation,
  PostSignedUrl,
  SignedUrl,
} from '@types'
import { apiName } from '@config/amplify'

/* Accounts */

export const deleteAccount = (accountId: string): Promise<Account> =>
  API.del(apiName, `/accounts/${encodeURIComponent(accountId)}`, {})

export const getAccount = (accountId: string): Promise<Account> =>
  API.get(apiName, `/accounts/${encodeURIComponent(accountId)}`, {})

export const patchAccount = (accountId: string, patchOperations: PatchOperation[]): Promise<Account> =>
  API.patch(apiName, `/accounts/${encodeURIComponent(accountId)}`, { body: patchOperations })

export const putAccount = (accountId: string, account: Account): Promise<Account> =>
  API.put(apiName, `/accounts/${encodeURIComponent(accountId)}`, { body: account })

/* Received emails */

export const deleteReceivedEmail = (accountId: string, emailId: string): Promise<Email> =>
  API.del(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}`, {})

export const getAllReceivedEmails = (accountId: string): Promise<EmailBatch[]> =>
  API.get(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/received`, {})

export const getReceivedAttachment = (accountId: string, emailId: string, attachmentId: string): Promise<SignedUrl> =>
  API.get(
    apiName,
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(
      emailId
    )}/attachments/${encodeURIComponent(attachmentId)}`,
    {}
  )

export const getReceivedEmailContents = (accountId: string, emailId: string): Promise<EmailContents> =>
  API.get(
    apiName,
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}/contents`,
    {}
  )

export const patchReceivedEmail = (
  accountId: string,
  emailId: string,
  patchOperations: PatchOperation[]
): Promise<Email> =>
  API.patch(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}`, {
    body: patchOperations,
  })

/* Sent emails */

export const deleteSentEmail = (accountId: string, emailId: string): Promise<Email> =>
  API.del(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}`, {})

export const getAllSentEmails = (accountId: string): Promise<EmailBatch[]> =>
  API.get(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/sent`, {})

export const getSentAttachment = (accountId: string, emailId: string, attachmentId: string): Promise<SignedUrl> =>
  API.get(
    apiName,
    `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(
      emailId
    )}/attachments/${encodeURIComponent(attachmentId)}`,
    {}
  )

export const getSentEmailContents = (accountId: string, emailId: string): Promise<EmailContents> =>
  API.get(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}/contents`, {})

export const postSentAttachment = (accountId: string): Promise<PostSignedUrl> =>
  API.post(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/sent/attachments`, {})

export const postSentEmail = (accountId: string, email: EmailOutbound): Promise<Email> =>
  API.post(apiName, `/accounts/${encodeURIComponent(accountId)}/emails/sent`, { body: email })
