import { API } from 'aws-amplify'

import { Account, Email, EmailBatch, EmailContents, PatchOperation } from '@types'
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

export const getReceivedAttachment = (accountId: string, emailId: string, attachmentId: string): Promise<Blob> =>
  API.get(
    apiName,
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(
      emailId
    )}/attachments/${encodeURIComponent(attachmentId)}`,
    { responseType: 'blob' }
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
