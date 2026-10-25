import { fetchAuthSession } from 'aws-amplify/auth'

import { baseUrl } from '@config/amplify'
import {
  Account,
  Email,
  EmailBatch,
  EmailContents,
  EmailFolder,
  EmailOutbound,
  HttpError,
  PatchOperation,
  PostSignedUrl,
  SignedUrl,
  SpamSuggestionsResponse,
} from '@types'

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

// The string `code` from an error body, or undefined when the body is missing, not JSON, or has none.
const errorCode = async (response: Response): Promise<string | undefined> => {
  try {
    const body: unknown = await response.json()
    const code = (body as { code?: unknown } | null)?.code
    return typeof code === 'string' ? code : undefined
  } catch {
    return undefined
  }
}

// A failed request throws, and nothing is ever sent twice. Callers report the failure and let the
// user decide what to do, which for a mutation means re-reading state rather than guessing.
const send = async (method: string, path: string, body?: unknown): Promise<Response> => {
  const headers = await authHeaders()
  const response = await fetch(`${baseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? headers : { ...headers, 'Content-Type': 'application/json' },
    method,
  })
  if (!response.ok) {
    // Path only, never the query string: the push endpoint travels there, and anyone holding it
    // can send to that browser. The API redacts it from its logs; callers of this hand the
    // message straight to console.error, so it must not carry it either.
    // The status rides along so callers can tell a 403, 429 or 503 apart without parsing text.
    const code = await errorCode(response)
    const error: HttpError = Object.assign(
      new Error(`${method} ${path.split('?')[0]} responded with ${response.status}`),
      code === undefined ? { status: response.status } : { code, status: response.status },
    )
    throw error
  }
  return response
}

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const response = await send(method, path, body)
  return response.json() as Promise<T>
}

// The 204 sibling. A No Content response has no body, so calling response.json() on it throws
// SyntaxError -- which is exactly what `request` would do here.
const requestNoContent = async (method: string, path: string, body?: unknown): Promise<void> => {
  await send(method, path, body)
}

/* Accounts */

export const getAccount = (accountId: string): Promise<Account> =>
  request<Account>('GET', `/accounts/${encodeURIComponent(accountId)}`)

export const putAccount = (accountId: string, account: Account): Promise<Account> =>
  request<Account>('PUT', `/accounts/${encodeURIComponent(accountId)}`, account)

/* Push subscriptions */

export const deletePushSubscription = (accountId: string, endpoint: string): Promise<void> =>
  requestNoContent(
    'DELETE',
    `/accounts/${encodeURIComponent(accountId)}/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`,
  )

export const getVapidPublicKey = async (): Promise<string> => {
  const response = await request<{ publicKey: string }>('GET', '/vapid-public-key')
  return response.publicKey
}

export const postPushSubscription = (accountId: string, subscription: PushSubscriptionJSON): Promise<void> =>
  requestNoContent('POST', `/accounts/${encodeURIComponent(accountId)}/push-subscriptions`, { subscription })

/* Received emails */

export const deleteReceivedEmail = (accountId: string, emailId: string): Promise<Email> =>
  request<Email>('DELETE', `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}`)

export const getAllReceivedEmails = (accountId: string, folder: EmailFolder = 'inbox'): Promise<EmailBatch[]> =>
  request<EmailBatch[]>(
    'GET',
    `/accounts/${encodeURIComponent(accountId)}/emails/received?folder=${encodeURIComponent(folder)}`,
  )

export const getAllSpamEmails = (accountId: string): Promise<EmailBatch[]> => getAllReceivedEmails(accountId, 'spam')

export const getReceivedAttachment = (accountId: string, emailId: string, attachmentId: string): Promise<SignedUrl> =>
  request<SignedUrl>(
    'GET',
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(
      emailId,
    )}/attachments/${encodeURIComponent(attachmentId)}`,
  )

export const getReceivedEmailContents = (accountId: string, emailId: string): Promise<EmailContents> =>
  request<EmailContents>(
    'GET',
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}/contents`,
  )

export const patchReceivedEmail = (
  accountId: string,
  emailId: string,
  patchOperations: PatchOperation[],
): Promise<Email> =>
  request<Email>(
    'PATCH',
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}`,
    patchOperations,
  )

export const moveReceivedEmail = (accountId: string, emailId: string, folder: EmailFolder): Promise<Email> =>
  patchReceivedEmail(accountId, emailId, [{ op: 'replace', path: '/folder', value: folder }])

export const postSpamSuggestions = (accountId: string, emailId: string): Promise<SpamSuggestionsResponse> =>
  request<SpamSuggestionsResponse>(
    'POST',
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}/spam-suggestions`,
  )

export const postBounceEmail = (accountId: string, emailId: string): Promise<Email> =>
  request<Email>(
    'POST',
    `/accounts/${encodeURIComponent(accountId)}/emails/received/${encodeURIComponent(emailId)}/bounce`,
  )

/* Sent emails */

export const deleteSentEmail = (accountId: string, emailId: string): Promise<Email> =>
  request<Email>('DELETE', `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}`)

export const getAllSentEmails = (accountId: string): Promise<EmailBatch[]> =>
  request<EmailBatch[]>('GET', `/accounts/${encodeURIComponent(accountId)}/emails/sent`)

export const getSentAttachment = (accountId: string, emailId: string, attachmentId: string): Promise<SignedUrl> =>
  request<SignedUrl>(
    'GET',
    `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(
      emailId,
    )}/attachments/${encodeURIComponent(attachmentId)}`,
  )

export const getSentEmailContents = (accountId: string, emailId: string): Promise<EmailContents> =>
  request<EmailContents>(
    'GET',
    `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}/contents`,
  )

export const patchSentEmail = (accountId: string, emailId: string, patchOperations: PatchOperation[]): Promise<Email> =>
  request<Email>(
    'PATCH',
    `/accounts/${encodeURIComponent(accountId)}/emails/sent/${encodeURIComponent(emailId)}`,
    patchOperations,
  )

export const postSentAttachment = (accountId: string): Promise<PostSignedUrl> =>
  request<PostSignedUrl>('POST', `/accounts/${encodeURIComponent(accountId)}/emails/sent/attachments`)

export const postSentEmail = (accountId: string, email: EmailOutbound): Promise<Email> =>
  request<Email>('POST', `/accounts/${encodeURIComponent(accountId)}/emails/sent`, email)
