import { del, get, patch, post, put } from 'aws-amplify/api'
import { fetchAuthSession } from 'aws-amplify/auth'

import { apiName } from '@config/amplify'
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

// v6 types request bodies as `DocumentType`, which does not accept PatchOperation[], Account or
// EmailOutbound even though they serialize identically.
type AnyBody = any

const authHeaders = async (): Promise<Record<string, string>> => {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString()
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
  } catch {
    // Not signed in
  }
  return {}
}

/* Accounts */

export const deleteAccount = async (accountId: string): Promise<Account | undefined> => {
  const { body, statusCode } = await del({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}`,
  }).response
  // The API answers 204 when the account is already gone; there is no body to parse.
  return statusCode === 204 ? undefined : (body.json() as unknown as Promise<Account>)
}

export const getAccount = async (accountId: string): Promise<Account> => {
  const { body } = await get({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}`,
  }).response
  return body.json() as unknown as Promise<Account>
}

export const patchAccount = async (accountId: string, patchOperations: PatchOperation[]): Promise<Account> => {
  const { body } = await patch({
    apiName,
    options: { body: patchOperations as AnyBody, headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}`,
  }).response
  return body.json() as unknown as Promise<Account>
}

export const putAccount = async (accountId: string, account: Account): Promise<Account> => {
  const { body } = await put({
    apiName,
    options: { body: account as AnyBody, headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}`,
  }).response
  return body.json() as unknown as Promise<Account>
}

/* Received emails */

export const deleteReceivedEmail = async (accountId: string, emailId: string): Promise<Email> => {
  const { body } = await del({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}`,
  }).response
  return body.json() as unknown as Promise<Email>
}

export const getAllReceivedEmails = async (accountId: string): Promise<EmailBatch[]> => {
  const { body } = await get({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/received`,
  }).response
  return body.json() as unknown as Promise<EmailBatch[]>
}

export const getReceivedAttachment = async (
  accountId: string,
  emailId: string,
  attachmentId: string,
): Promise<SignedUrl> => {
  const { body } = await get({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(
      emailId,
    )}/attachments/${encodeURIComponent(attachmentId)}`,
  }).response
  return body.json() as unknown as Promise<SignedUrl>
}

export const getReceivedEmailContents = async (accountId: string, emailId: string): Promise<EmailContents> => {
  const { body } = await get({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}/contents`,
  }).response
  return body.json() as unknown as Promise<EmailContents>
}

export const patchReceivedEmail = async (
  accountId: string,
  emailId: string,
  patchOperations: PatchOperation[],
): Promise<Email> => {
  const { body } = await patch({
    apiName,
    options: { body: patchOperations as AnyBody, headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}`,
  }).response
  return body.json() as unknown as Promise<Email>
}

export const postBounceEmail = async (accountId: string, emailId: string): Promise<Email> => {
  const { body } = await post({
    apiName,
    // v6 retries 5xx up to three times by default; v5 never retried. Bouncing is not idempotent,
    // so a 5xx returned after the bounce was already sent would send a second one.
    options: { headers: await authHeaders(), retryStrategy: { strategy: 'no-retry' } },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}/bounce`,
  }).response
  return body.json() as unknown as Promise<Email>
}

/* Sent emails */

export const deleteSentEmail = async (accountId: string, emailId: string): Promise<Email> => {
  const { body } = await del({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}`,
  }).response
  return body.json() as unknown as Promise<Email>
}

export const getAllSentEmails = async (accountId: string): Promise<EmailBatch[]> => {
  const { body } = await get({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/sent`,
  }).response
  return body.json() as unknown as Promise<EmailBatch[]>
}

export const getSentAttachment = async (
  accountId: string,
  emailId: string,
  attachmentId: string,
): Promise<SignedUrl> => {
  const { body } = await get({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(
      emailId,
    )}/attachments/${encodeURIComponent(attachmentId)}`,
  }).response
  return body.json() as unknown as Promise<SignedUrl>
}

export const getSentEmailContents = async (accountId: string, emailId: string): Promise<EmailContents> => {
  const { body } = await get({
    apiName,
    options: { headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}/contents`,
  }).response
  return body.json() as unknown as Promise<EmailContents>
}

export const patchSentEmail = async (
  accountId: string,
  emailId: string,
  patchOperations: PatchOperation[],
): Promise<Email> => {
  const { body } = await patch({
    apiName,
    options: { body: patchOperations as AnyBody, headers: await authHeaders() },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}`,
  }).response
  return body.json() as unknown as Promise<Email>
}

export const postSentAttachment = async (accountId: string): Promise<PostSignedUrl> => {
  const { body } = await post({
    apiName,
    // v6 retries 5xx up to three times by default; v5 never retried. A replay mints a second
    // presigned upload URL — wasteful rather than harmful, but POST is treated uniformly here.
    options: { headers: await authHeaders(), retryStrategy: { strategy: 'no-retry' } },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/sent/attachments`,
  }).response
  return body.json() as unknown as Promise<PostSignedUrl>
}

export const postSentEmail = async (accountId: string, email: EmailOutbound): Promise<Email> => {
  const { body } = await post({
    apiName,
    // v6 retries 5xx up to three times by default; v5 never retried. Sending an email is not
    // idempotent, so a 5xx returned after the message was queued would send it twice.
    options: { body: email as AnyBody, headers: await authHeaders(), retryStrategy: { strategy: 'no-retry' } },
    path: `/accounts/${encodeURIComponent(accountId)}/emails/sent`,
  }).response
  return body.json() as unknown as Promise<Email>
}
