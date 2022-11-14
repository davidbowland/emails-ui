import { Auth } from 'aws-amplify'
import { CognitoUserSession } from 'amazon-cognito-identity-js'

import {
  account,
  accountId,
  attachmentContents,
  attachmentId,
  email,
  emailBatch,
  emailContents,
  emailId,
  jsonPatchOperations,
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
  putAccount,
} from './emails'
import { rest, server } from '@test/setup-server'

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
          rest.delete(`${baseUrl}/accounts/:id`, async (req, res, ctx) => {
            const { id } = req.params
            const body = deleteEndpoint(id)
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.get(`${baseUrl}/accounts/:id`, async (req, res, ctx) => {
            const { id } = req.params
            const body = getEndpoint(id)
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.patch(`${baseUrl}/accounts/:id`, async (req, res, ctx) => {
            const { id } = req.params
            const body = patchEndpoint(id, await req.json())
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.put(`${baseUrl}/accounts/:id`, async (req, res, ctx) => {
            const { id } = req.params
            const body = putEndpoint(id, await req.json())
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.delete(`${baseUrl}/accounts/:id/emails/received/:emailId`, async (req, res, ctx) => {
            const { emailId, id } = req.params
            const body = deleteEndpoint(id, emailId)
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.get(`${baseUrl}/accounts/:id/emails/received`, async (req, res, ctx) => {
            const { id } = req.params
            const body = getEndpoint(id)
            return res(body ? ctx.json(body) : ctx.status(400))
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
      const getEndpoint = jest.fn().mockReturnValue(attachmentContents)

      beforeAll(() => {
        server.use(
          rest.get(
            `${baseUrl}/accounts/:id/emails/received/:emailId/attachments/:attachmentId`,
            async (req, res, ctx) => {
              const { attachmentId, emailId, id } = req.params
              const body = getEndpoint(id, emailId, attachmentId)
              return res(body ? ctx.body(body) : ctx.status(400))
            }
          )
        )
      })

      test('expect attachment returned', async () => {
        const result = await getReceivedAttachment(accountId, emailId, attachmentId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId, emailId, attachmentId)
        expect(result).toEqual(attachmentContents)
      })
    })

    describe('getReceivedEmailContents', () => {
      const getEndpoint = jest.fn().mockReturnValue(emailContents)

      beforeAll(() => {
        server.use(
          rest.get(`${baseUrl}/accounts/:id/emails/received/:emailId/contents`, async (req, res, ctx) => {
            const { emailId, id } = req.params
            const body = getEndpoint(id, emailId)
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.patch(`${baseUrl}/accounts/:id/emails/received/:emailId`, async (req, res, ctx) => {
            const { emailId, id } = req.params
            const body = patchEndpoint(id, emailId, await req.json())
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.delete(`${baseUrl}/accounts/:id/emails/sent/:emailId`, async (req, res, ctx) => {
            const { emailId, id } = req.params
            const body = deleteEndpoint(id, emailId)
            return res(body ? ctx.json(body) : ctx.status(400))
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
          rest.get(`${baseUrl}/accounts/:id/emails/sent`, async (req, res, ctx) => {
            const { id } = req.params
            const body = getEndpoint(id)
            return res(body ? ctx.json(body) : ctx.status(400))
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
      const getEndpoint = jest.fn().mockReturnValue(attachmentContents)

      beforeAll(() => {
        server.use(
          rest.get(`${baseUrl}/accounts/:id/emails/sent/:emailId/attachments/:attachmentId`, async (req, res, ctx) => {
            const { attachmentId, emailId, id } = req.params
            const body = getEndpoint(id, emailId, attachmentId)
            return res(body ? ctx.body(body) : ctx.status(400))
          })
        )
      })

      test('expect attachment returned', async () => {
        const result = await getSentAttachment(accountId, emailId, attachmentId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId, emailId, attachmentId)
        expect(result).toEqual(attachmentContents)
      })
    })

    describe('getSentEmailContents', () => {
      const getEndpoint = jest.fn().mockReturnValue(emailContents)

      beforeAll(() => {
        server.use(
          rest.get(`${baseUrl}/accounts/:id/emails/sent/:emailId/contents`, async (req, res, ctx) => {
            const { emailId, id } = req.params
            const body = getEndpoint(id, emailId)
            return res(body ? ctx.json(body) : ctx.status(400))
          })
        )
      })

      test('expect result from call returned', async () => {
        const result = await getSentEmailContents(accountId, emailId)
        expect(getEndpoint).toHaveBeenCalledWith(accountId, emailId)
        expect(result).toEqual(emailContents)
      })
    })
  })
})
