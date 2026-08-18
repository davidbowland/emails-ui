import { fetchAuthSession } from 'aws-amplify/auth'

import {
  deletePushSubscription,
  deleteReceivedEmail,
  deleteSentEmail,
  getAccount,
  getAllReceivedEmails,
  getAllSentEmails,
  getReceivedAttachment,
  getReceivedEmailContents,
  getSentAttachment,
  getSentEmailContents,
  getVapidPublicKey,
  patchReceivedEmail,
  patchSentEmail,
  postBounceEmail,
  postPushSubscription,
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
  pushEndpoint,
  pushSubscription,
} from '@test/__mocks__'

jest.mock('@aws-amplify/analytics')
jest.mock('@config/amplify', () => ({
  baseUrl: 'http://localhost',
}))
jest.mock('aws-amplify/auth')

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

const mockResponse = (data: unknown, ok = true, status = 200): unknown => ({
  json: () => Promise.resolve(data),
  ok,
  status,
})

// A real 204 has no body, so `.json()` rejects. Rejecting here is what proves
// requestNoContent never reads one.
const noContentResponse = (): unknown => ({
  json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
  ok: true,
  status: 204,
})

describe('Emails service', () => {
  const baseUrl = 'http://localhost'
  const authorizedHeaders = { Authorization: 'Bearer mock-jwt-token' }
  const jsonHeaders = { ...authorizedHeaders, 'Content-Type': 'application/json' }

  beforeAll(() => {
    jest.mocked(fetchAuthSession).mockResolvedValue({
      tokens: { idToken: { payload: {}, toString: () => 'mock-jwt-token' } },
    } as any)
    mockFetch.mockResolvedValue(mockResponse(email))
  })

  describe('request handling', () => {
    it('should reject when the response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Internal server error' }, false, 500))

      await expect(getAccount(accountId)).rejects.toThrow(`GET /accounts/${accountId} responded with 500`)
    })

    it('should send no authorization header when the session cannot be fetched', async () => {
      jest.mocked(fetchAuthSession).mockRejectedValueOnce(new Error('Not signed in'))
      mockFetch.mockResolvedValueOnce(mockResponse(account))

      await getAccount(accountId)

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}`, {
        headers: {},
        method: 'GET',
      })
    })

    it('should send no authorization header when the session has no token', async () => {
      jest.mocked(fetchAuthSession).mockResolvedValueOnce({} as any)
      mockFetch.mockResolvedValueOnce(mockResponse(account))

      await getAccount(accountId)

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}`, {
        headers: {},
        method: 'GET',
      })
    })

    it('should escape path parameters', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(account))

      await getAccount('a b/c')

      expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/a%20b%2Fc`, {
        headers: authorizedHeaders,
        method: 'GET',
      })
    })
  })

  describe('accounts', () => {
    describe('getAccount', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(account))

        const result = await getAccount(accountId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}`, {
          headers: authorizedHeaders,
          method: 'GET',
        })
        expect(result).toEqual(account)
      })
    })

    describe('putAccount', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(account))

        const result = await putAccount(accountId, account)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}`, {
          body: JSON.stringify(account),
          headers: jsonHeaders,
          method: 'PUT',
        })
        expect(result).toEqual(account)
      })
    })
  })

  describe('push subscriptions', () => {
    describe('getVapidPublicKey', () => {
      it('should unwrap the public key from the response', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ publicKey: 'BPublicKey123' }))

        const result = await getVapidPublicKey()

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/vapid-public-key`, {
          headers: authorizedHeaders,
          method: 'GET',
        })
        expect(result).toEqual('BPublicKey123')
      })
    })

    describe('postPushSubscription', () => {
      it('should send the subscription wrapped in a subscription key', async () => {
        mockFetch.mockResolvedValueOnce(noContentResponse())

        await postPushSubscription(accountId, pushSubscription)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/push-subscriptions`, {
          body: JSON.stringify({ subscription: pushSubscription }),
          headers: jsonHeaders,
          method: 'POST',
        })
      })

      it('should resolve without reading a body from a 204', async () => {
        mockFetch.mockResolvedValueOnce(noContentResponse())

        await expect(postPushSubscription(accountId, pushSubscription)).resolves.toBeUndefined()
      })

      it('should reject when the response is not ok', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Bad request' }, false, 400))

        await expect(postPushSubscription(accountId, pushSubscription)).rejects.toThrow(
          `POST /accounts/${accountId}/push-subscriptions responded with 400`,
        )
      })
    })

    describe('deletePushSubscription', () => {
      it('should send the endpoint as a URL-encoded query parameter', async () => {
        mockFetch.mockResolvedValueOnce(noContentResponse())

        await deletePushSubscription(accountId, pushEndpoint)

        expect(mockFetch).toHaveBeenCalledWith(
          `${baseUrl}/accounts/${accountId}/push-subscriptions?endpoint=${encodeURIComponent(pushEndpoint)}`,
          { headers: authorizedHeaders, method: 'DELETE' },
        )
      })

      it('should resolve without reading a body from a 204', async () => {
        mockFetch.mockResolvedValueOnce(noContentResponse())

        await expect(deletePushSubscription(accountId, pushEndpoint)).resolves.toBeUndefined()
      })
    })
  })

  describe('received emails', () => {
    describe('deleteReceivedEmail', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        const result = await deleteReceivedEmail(accountId, emailId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/received/${emailId}`, {
          headers: authorizedHeaders,
          method: 'DELETE',
        })
        expect(result).toEqual(email)
      })
    })

    describe('getAllReceivedEmails', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(emailBatch))

        const result = await getAllReceivedEmails(accountId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/received`, {
          headers: authorizedHeaders,
          method: 'GET',
        })
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getReceivedAttachment', () => {
      it('should return the attachment URL', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(attachmentUrl))

        const result = await getReceivedAttachment(accountId, emailId, attachmentId)

        expect(mockFetch).toHaveBeenCalledWith(
          `${baseUrl}/accounts/${accountId}/emails/received/${emailId}/attachments/${attachmentId}`,
          { headers: authorizedHeaders, method: 'GET' },
        )
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getReceivedEmailContents', () => {
      it('should return the email contents', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(emailContents))

        const result = await getReceivedEmailContents(accountId, emailId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/received/${emailId}/contents`, {
          headers: authorizedHeaders,
          method: 'GET',
        })
        expect(result).toEqual(emailContents)
      })
    })

    describe('patchReceivedEmail', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        const result = await patchReceivedEmail(accountId, emailId, jsonPatchOperations)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/received/${emailId}`, {
          body: JSON.stringify(jsonPatchOperations),
          headers: jsonHeaders,
          method: 'PATCH',
        })
        expect(result).toEqual(email)
      })
    })

    describe('postBounceEmail', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        const result = await postBounceEmail(accountId, emailId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/received/${emailId}/bounce`, {
          headers: authorizedHeaders,
          method: 'POST',
        })
        expect(result).toEqual(email)
      })

      it('should send the request exactly once', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        await postBounceEmail(accountId, emailId)

        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('sent emails', () => {
    describe('deleteSentEmail', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        const result = await deleteSentEmail(accountId, emailId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/sent/${emailId}`, {
          headers: authorizedHeaders,
          method: 'DELETE',
        })
        expect(result).toEqual(email)
      })
    })

    describe('getAllSentEmails', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(emailBatch))

        const result = await getAllSentEmails(accountId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/sent`, {
          headers: authorizedHeaders,
          method: 'GET',
        })
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getSentAttachment', () => {
      it('should return the attachment URL', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(attachmentUrl))

        const result = await getSentAttachment(accountId, emailId, attachmentId)

        expect(mockFetch).toHaveBeenCalledWith(
          `${baseUrl}/accounts/${accountId}/emails/sent/${emailId}/attachments/${attachmentId}`,
          { headers: authorizedHeaders, method: 'GET' },
        )
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getSentEmailContents', () => {
      it('should return the email contents', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(emailContents))

        const result = await getSentEmailContents(accountId, emailId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/sent/${emailId}/contents`, {
          headers: authorizedHeaders,
          method: 'GET',
        })
        expect(result).toEqual(emailContents)
      })
    })

    describe('patchSentEmail', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        const result = await patchSentEmail(accountId, emailId, jsonPatchOperations)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/sent/${emailId}`, {
          body: JSON.stringify(jsonPatchOperations),
          headers: jsonHeaders,
          method: 'PATCH',
        })
        expect(result).toEqual(email)
      })
    })

    describe('postSentAttachment', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(postAttachmentResult))

        const result = await postSentAttachment(accountId)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/sent/attachments`, {
          headers: authorizedHeaders,
          method: 'POST',
        })
        expect(result).toEqual(postAttachmentResult)
      })
    })

    describe('postSentEmail', () => {
      it('should return the result from the API call', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        const result = await postSentEmail(accountId, outboundEmail)

        expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/accounts/${accountId}/emails/sent`, {
          body: JSON.stringify(outboundEmail),
          headers: jsonHeaders,
          method: 'POST',
        })
        expect(result).toEqual(email)
      })

      it('should send the request exactly once', async () => {
        mockFetch.mockResolvedValueOnce(mockResponse(email))

        await postSentEmail(accountId, outboundEmail)

        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })
  })
})
