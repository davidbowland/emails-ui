import { Auth } from 'aws-amplify'
import { CognitoUserSession } from 'amazon-cognito-identity-js'

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
  postSentAttachment,
  postSentEmail,
  putAccount,
} from './emails'
import { http, HttpResponse, server } from '@test/setup-server'

const baseUrl = process.env.GATSBY_EMAILS_API_BASE_URL
jest.mock('@aws-amplify/analytics')

describe('Emails service', () => {
  beforeAll(() => {
    const userSession = { getIdToken: () => ({ getJwtToken: () => '' }) } as CognitoUserSession
    jest.spyOn(Auth, 'currentSession').mockResolvedValue(userSession)
  })

  describe('accounts', () => {
    describe('deleteAccount', () => {
      const deleteEndpoint = jest.fn().mockReturnValue(account)

      beforeAll(() => {
        server.use(
          http.delete(`${baseUrl}/accounts/:id`, async ({ params }) => {
            const { id } = params
            const body = deleteEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await deleteAccount(accountId)
        expect(deleteEndpoint).toHaveBeenCalledWith(accountId)
        expect(result).toEqual(account)
      })
    })

    describe('getAccount', () => {
      const getEndpoint = jest.fn().mockReturnValue(account)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/accounts/:id`, async ({ params }) => {
            const { id } = params
            const body = getEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await getAccount(accountId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId)
        expect(result).toEqual(account)
      })
    })

    describe('patchAccount', () => {
      const patchEndpoint = jest.fn().mockReturnValue(account)

      beforeAll(() => {
        server.use(
          http.patch(`${baseUrl}/accounts/:id`, async ({ params, request }) => {
            const { id } = params
            const body = patchEndpoint(id, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await patchAccount(accountId, jsonPatchOperations)
        expect(patchEndpoint).toHaveBeenCalledWith(accountId, jsonPatchOperations)
        expect(result).toEqual(account)
      })
    })

    describe('putAccount', () => {
      const putEndpoint = jest.fn().mockReturnValue(account)

      beforeAll(() => {
        server.use(
          http.put(`${baseUrl}/accounts/:id`, async ({ params, request }) => {
            const { id } = params
            const body = putEndpoint(id, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await putAccount(accountId, account)
        expect(putEndpoint).toHaveBeenCalledWith(accountId, account)
        expect(result).toEqual(account)
      })
    })
  })

  describe('received emails', () => {
    describe('deleteReceivedEmail', () => {
      const deleteEndpoint = jest.fn().mockReturnValue(email)

      beforeAll(() => {
        server.use(
          http.delete(`${baseUrl}/accounts/:id/emails/received/:emailId`, async ({ params }) => {
            const { emailId, id } = params
            const body = deleteEndpoint(id, emailId)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await deleteReceivedEmail(accountId, emailId)
        expect(deleteEndpoint).toHaveBeenCalledTimes(1)
        expect(result).toEqual(email)
      })
    })

    describe('getAllReceivedEmails', () => {
      const getEndpoint = jest.fn().mockReturnValue(emailBatch)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/accounts/:id/emails/received`, async ({ params }) => {
            const { id } = params
            const body = getEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await getAllReceivedEmails(accountId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId)
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getReceivedAttachment', () => {
      const getEndpoint = jest.fn().mockReturnValue(attachmentUrl)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/accounts/:id/emails/received/:emailId/attachments/:attachmentId`, async ({ params }) => {
            const { attachmentId, emailId, id } = params
            const body = getEndpoint(id, emailId, attachmentId)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect attachment returned', async () => {
        const result = await getReceivedAttachment(accountId, emailId, attachmentId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId, emailId, attachmentId)
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getReceivedEmailContents', () => {
      const getEndpoint = jest.fn().mockReturnValue(emailContents)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/accounts/:id/emails/received/:emailId/contents`, async ({ params }) => {
            const { emailId, id } = params
            const body = getEndpoint(id, emailId)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await getReceivedEmailContents(accountId, emailId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId, emailId)
        expect(result).toEqual(emailContents)
      })
    })

    describe('patchReceivedEmail', () => {
      const patchEndpoint = jest.fn().mockReturnValue(email)

      beforeAll(() => {
        server.use(
          http.patch(`${baseUrl}/accounts/:id/emails/received/:emailId`, async ({ params, request }) => {
            const { emailId, id } = params
            const body = patchEndpoint(id, emailId, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await patchReceivedEmail(accountId, emailId, jsonPatchOperations)
        expect(patchEndpoint).toHaveBeenCalledWith(accountId, emailId, jsonPatchOperations)
        expect(result).toEqual(email)
      })
    })
  })

  describe('sent emails', () => {
    describe('deleteSentEmail', () => {
      const deleteEndpoint = jest.fn().mockReturnValue(email)

      beforeAll(() => {
        server.use(
          http.delete(`${baseUrl}/accounts/:id/emails/sent/:emailId`, async ({ params }) => {
            const { emailId, id } = params
            const body = deleteEndpoint(id, emailId)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await deleteSentEmail(accountId, emailId)
        expect(deleteEndpoint).toHaveBeenCalledTimes(1)
        expect(result).toEqual(email)
      })
    })

    describe('getAllSentEmails', () => {
      const getEndpoint = jest.fn().mockReturnValue(emailBatch)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/accounts/:id/emails/sent`, async ({ params }) => {
            const { id } = params
            const body = getEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await getAllSentEmails(accountId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId)
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getSentAttachment', () => {
      const getEndpoint = jest.fn().mockReturnValue(attachmentUrl)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/accounts/:id/emails/sent/:emailId/attachments/:attachmentId`, async ({ params }) => {
            const { attachmentId, emailId, id } = params
            const body = getEndpoint(id, emailId, attachmentId)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect attachment returned', async () => {
        const result = await getSentAttachment(accountId, emailId, attachmentId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId, emailId, attachmentId)
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getSentEmailContents', () => {
      const getEndpoint = jest.fn().mockReturnValue(emailContents)

      beforeAll(() => {
        server.use(
          http.get(`${baseUrl}/accounts/:id/emails/sent/:emailId/contents`, async ({ params }) => {
            const { emailId, id } = params
            const body = getEndpoint(id, emailId)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await getSentEmailContents(accountId, emailId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId, emailId)
        expect(result).toEqual(emailContents)
      })
    })

    describe('postSentAttachment', () => {
      const postEndpoint = jest.fn().mockReturnValue(postAttachmentResult)

      beforeAll(() => {
        server.use(
          http.post(`${baseUrl}/accounts/:id/emails/sent/attachments`, async ({ params }) => {
            const { id } = params
            const body = postEndpoint(id)
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await postSentAttachment(accountId)
        expect(postEndpoint).toHaveBeenCalledWith(accountId)
        expect(result).toEqual(postAttachmentResult)
      })
    })

    describe('patchSentEmail', () => {
      const patchEndpoint = jest.fn().mockReturnValue(email)

      beforeAll(() => {
        server.use(
          http.patch(`${baseUrl}/accounts/:id/emails/sent/:emailId`, async ({ params, request }) => {
            const { emailId, id } = params
            const body = patchEndpoint(id, emailId, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await patchSentEmail(accountId, emailId, jsonPatchOperations)
        expect(patchEndpoint).toHaveBeenCalledWith(accountId, emailId, jsonPatchOperations)
        expect(result).toEqual(email)
      })
    })

    describe('postSentEmail', () => {
      const postEndpoint = jest.fn().mockReturnValue(email)

      beforeAll(() => {
        server.use(
          http.post(`${baseUrl}/accounts/:id/emails/sent`, async ({ params, request }) => {
            const { id } = params
            const body = postEndpoint(id, await request.json())
            return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await postSentEmail(accountId, outboundEmail)
        expect(postEndpoint).toHaveBeenCalledWith(accountId, outboundEmail)
        expect(result).toEqual(email)
      })
    })
  })
})
