import { del, get, patch, post, put } from 'aws-amplify/api'
import { fetchAuthSession } from 'aws-amplify/auth'

import {
  deleteAccount,
  deleteReceivedEmail,
  deleteSentEmail,
  getAccount,
  getAllReceivedEmails,
  getAllSentEmails,
  getReceivedAttachment,
  getReceivedEmailContents,
  getSentAttachment,
  getSentEmailContents,
  patchAccount,
  patchReceivedEmail,
  patchSentEmail,
  postBounceEmail,
  postSentAttachment,
  postSentEmail,
  putAccount,
} from './emails'
import {
  account,
  accountId,
  attachmentId,
  attachmentUrl,
  email,
  emailBatch,
  emailContents,
  emailId,
  jsonPatchOperations,
  outboundEmail,
  postAttachmentResult,
} from '@test/__mocks__'

jest.mock('@aws-amplify/analytics')
jest.mock('@config/amplify', () => ({
  apiName: 'apiName',
}))
jest.mock('aws-amplify/api')
jest.mock('aws-amplify/auth')

const mockResponse = (data: unknown, statusCode = 200): any => ({
  response: Promise.resolve({ body: { json: () => Promise.resolve(data) }, statusCode }),
})

describe('Emails service', () => {
  const apiName = 'apiName'
  const authorizedHeaders = { Authorization: 'Bearer mock-jwt-token' }

  beforeAll(() => {
    jest.mocked(fetchAuthSession).mockResolvedValue({
      tokens: { idToken: { payload: {}, toString: () => 'mock-jwt-token' } },
    } as any)
  })

  describe('accounts', () => {
    describe('deleteAccount', () => {
      beforeAll(() => {
        jest.mocked(del).mockReturnValue(mockResponse(account))
      })

      it('should return the result from the API call', async () => {
        const result = await deleteAccount(accountId)

        expect(del).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}`,
        })
        expect(result).toEqual(account)
      })

      it('should return undefined when the account is already gone', async () => {
        jest.mocked(del).mockReturnValueOnce(mockResponse(undefined, 204))

        const result = await deleteAccount(accountId)

        expect(result).toBeUndefined()
      })

      it('should retry, because deleting an account is idempotent', async () => {
        await deleteAccount(accountId)

        expect(jest.mocked(del).mock.calls[0][0].options?.retryStrategy).toBeUndefined()
      })

      it('should send empty headers when the session cannot be fetched', async () => {
        jest.mocked(fetchAuthSession).mockRejectedValueOnce(new Error('Not signed in'))

        const result = await deleteAccount(accountId)

        expect(del).toHaveBeenCalledWith({
          apiName,
          options: { headers: {} },
          path: `/accounts/${accountId}`,
        })
        expect(result).toEqual(account)
      })

      it('should send empty headers when the session has no id token', async () => {
        jest.mocked(fetchAuthSession).mockResolvedValueOnce({ tokens: undefined } as any)

        await deleteAccount(accountId)

        expect(del).toHaveBeenCalledWith({
          apiName,
          options: { headers: {} },
          path: `/accounts/${accountId}`,
        })
      })
    })

    describe('getAccount', () => {
      beforeAll(() => {
        jest.mocked(get).mockReturnValue(mockResponse(account))
      })

      it('should return the result from the API call', async () => {
        const result = await getAccount(accountId)

        expect(get).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}`,
        })
        expect(result).toEqual(account)
      })

      it('should retry, because reads are idempotent', async () => {
        await getAccount(accountId)

        expect(jest.mocked(get).mock.calls[0][0].options?.retryStrategy).toBeUndefined()
      })
    })

    describe('patchAccount', () => {
      beforeAll(() => {
        jest.mocked(patch).mockReturnValue(mockResponse(account))
      })

      it('should return the result from the API call', async () => {
        const result = await patchAccount(accountId, jsonPatchOperations)

        expect(patch).toHaveBeenCalledWith({
          apiName,
          options: { body: jsonPatchOperations, headers: authorizedHeaders },
          path: `/accounts/${accountId}`,
        })
        expect(result).toEqual(account)
      })

      it('should retry, because the patch operations are idempotent', async () => {
        await patchAccount(accountId, jsonPatchOperations)

        expect(jest.mocked(patch).mock.calls[0][0].options?.retryStrategy).toBeUndefined()
      })
    })

    describe('putAccount', () => {
      beforeAll(() => {
        jest.mocked(put).mockReturnValue(mockResponse(account))
      })

      it('should return the result from the API call', async () => {
        const result = await putAccount(accountId, account)

        expect(put).toHaveBeenCalledWith({
          apiName,
          options: { body: account, headers: authorizedHeaders },
          path: `/accounts/${accountId}`,
        })
        expect(result).toEqual(account)
      })

      it('should retry, because a put is idempotent', async () => {
        await putAccount(accountId, account)

        expect(jest.mocked(put).mock.calls[0][0].options?.retryStrategy).toBeUndefined()
      })
    })
  })

  describe('received emails', () => {
    describe('deleteReceivedEmail', () => {
      beforeAll(() => {
        jest.mocked(del).mockReturnValue(mockResponse(email))
      })

      it('should return the result from the API call', async () => {
        const result = await deleteReceivedEmail(accountId, emailId)

        expect(del).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/received/${emailId}`,
        })
        expect(result).toEqual(email)
      })
    })

    describe('getAllReceivedEmails', () => {
      beforeAll(() => {
        jest.mocked(get).mockReturnValue(mockResponse(emailBatch))
      })

      it('should return the result from the API call', async () => {
        const result = await getAllReceivedEmails(accountId)

        expect(get).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/received`,
        })
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getReceivedAttachment', () => {
      beforeAll(() => {
        jest.mocked(get).mockReturnValue(mockResponse(attachmentUrl))
      })

      it('should return the attachment URL', async () => {
        const result = await getReceivedAttachment(accountId, emailId, attachmentId)

        expect(get).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/received/${emailId}/attachments/${attachmentId}`,
        })
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getReceivedEmailContents', () => {
      beforeAll(() => {
        jest.mocked(get).mockReturnValue(mockResponse(emailContents))
      })

      it('should return the email contents', async () => {
        const result = await getReceivedEmailContents(accountId, emailId)

        expect(get).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/received/${emailId}/contents`,
        })
        expect(result).toEqual(emailContents)
      })
    })

    describe('patchReceivedEmail', () => {
      beforeAll(() => {
        jest.mocked(patch).mockReturnValue(mockResponse(email))
      })

      it('should return the result from the API call', async () => {
        const result = await patchReceivedEmail(accountId, emailId, jsonPatchOperations)

        expect(patch).toHaveBeenCalledWith({
          apiName,
          options: { body: jsonPatchOperations, headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/received/${emailId}`,
        })
        expect(result).toEqual(email)
      })
    })

    describe('postBounceEmail', () => {
      beforeAll(() => {
        jest.mocked(post).mockReturnValue(mockResponse(email))
      })

      it('should return the result from the API call', async () => {
        const result = await postBounceEmail(accountId, emailId)

        expect(post).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders, retryStrategy: { strategy: 'no-retry' } },
          path: `/accounts/${accountId}/emails/received/${emailId}/bounce`,
        })
        expect(result).toEqual(email)
      })

      it('should not retry, because bouncing an email sends a message', async () => {
        await postBounceEmail(accountId, emailId)

        expect(jest.mocked(post).mock.calls[0][0].options?.retryStrategy).toEqual({ strategy: 'no-retry' })
      })
    })
  })

  describe('sent emails', () => {
    describe('deleteSentEmail', () => {
      beforeAll(() => {
        jest.mocked(del).mockReturnValue(mockResponse(email))
      })

      it('should return the result from the API call', async () => {
        const result = await deleteSentEmail(accountId, emailId)

        expect(del).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/sent/${emailId}`,
        })
        expect(result).toEqual(email)
      })
    })

    describe('getAllSentEmails', () => {
      beforeAll(() => {
        jest.mocked(get).mockReturnValue(mockResponse(emailBatch))
      })

      it('should return the result from the API call', async () => {
        const result = await getAllSentEmails(accountId)

        expect(get).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/sent`,
        })
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getSentAttachment', () => {
      beforeAll(() => {
        jest.mocked(get).mockReturnValue(mockResponse(attachmentUrl))
      })

      it('should return the attachment URL', async () => {
        const result = await getSentAttachment(accountId, emailId, attachmentId)

        expect(get).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/sent/${emailId}/attachments/${attachmentId}`,
        })
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getSentEmailContents', () => {
      beforeAll(() => {
        jest.mocked(get).mockReturnValue(mockResponse(emailContents))
      })

      it('should return the email contents', async () => {
        const result = await getSentEmailContents(accountId, emailId)

        expect(get).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/sent/${emailId}/contents`,
        })
        expect(result).toEqual(emailContents)
      })
    })

    describe('patchSentEmail', () => {
      beforeAll(() => {
        jest.mocked(patch).mockReturnValue(mockResponse(email))
      })

      it('should return the result from the API call', async () => {
        const result = await patchSentEmail(accountId, emailId, jsonPatchOperations)

        expect(patch).toHaveBeenCalledWith({
          apiName,
          options: { body: jsonPatchOperations, headers: authorizedHeaders },
          path: `/accounts/${accountId}/emails/sent/${emailId}`,
        })
        expect(result).toEqual(email)
      })
    })

    describe('postSentAttachment', () => {
      beforeAll(() => {
        jest.mocked(post).mockReturnValue(mockResponse(postAttachmentResult))
      })

      it('should return the result from the API call', async () => {
        const result = await postSentAttachment(accountId)

        expect(post).toHaveBeenCalledWith({
          apiName,
          options: { headers: authorizedHeaders, retryStrategy: { strategy: 'no-retry' } },
          path: `/accounts/${accountId}/emails/sent/attachments`,
        })
        expect(result).toEqual(postAttachmentResult)
      })

      it('should not retry, because a replay mints a second upload URL', async () => {
        await postSentAttachment(accountId)

        expect(jest.mocked(post).mock.calls[0][0].options?.retryStrategy).toEqual({ strategy: 'no-retry' })
      })
    })

    describe('postSentEmail', () => {
      beforeAll(() => {
        jest.mocked(post).mockReturnValue(mockResponse(email))
      })

      it('should return the result from the API call', async () => {
        const result = await postSentEmail(accountId, outboundEmail)

        expect(post).toHaveBeenCalledWith({
          apiName,
          options: {
            body: outboundEmail,
            headers: authorizedHeaders,
            retryStrategy: { strategy: 'no-retry' },
          },
          path: `/accounts/${accountId}/emails/sent`,
        })
        expect(result).toEqual(email)
      })

      it('should not retry, because a replay sends the email twice', async () => {
        await postSentEmail(accountId, outboundEmail)

        expect(jest.mocked(post).mock.calls[0][0].options?.retryStrategy).toEqual({ strategy: 'no-retry' })
      })
    })
  })
})
