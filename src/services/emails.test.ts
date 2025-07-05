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
import { CognitoUserSession } from 'amazon-cognito-identity-js'
import { API, Auth } from 'aws-amplify'

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

jest.mock('@aws-amplify/analytics')
jest.mock('@config/amplify', () => ({
  apiName: 'apiName',
}))
jest.mock('aws-amplify')

describe('Emails service', () => {
  const apiName = 'apiName'

  beforeAll(() => {
    const userSession = { getIdToken: () => ({ getJwtToken: () => '' }) } as CognitoUserSession
    jest.mocked(Auth).currentSession.mockResolvedValue(userSession)
  })

  describe('accounts', () => {
    describe('deleteAccount', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).del.mockResolvedValueOnce(account)

        const result = await deleteAccount(accountId)

        expect(API.del).toHaveBeenCalledWith(apiName, `/accounts/${accountId}`, {})
        expect(result).toEqual(account)
      })
    })

    describe('getAccount', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).get.mockResolvedValueOnce(account)

        const result = await getAccount(accountId)

        expect(API.get).toHaveBeenCalledWith(apiName, `/accounts/${accountId}`, {})
        expect(result).toEqual(account)
      })
    })

    describe('patchAccount', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).patch.mockResolvedValueOnce(account)

        const result = await patchAccount(accountId, jsonPatchOperations)

        expect(API.patch).toHaveBeenCalledWith(apiName, `/accounts/${accountId}`, { body: jsonPatchOperations })
        expect(result).toEqual(account)
      })
    })

    describe('putAccount', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).put.mockResolvedValueOnce(account)

        const result = await putAccount(accountId, account)

        expect(API.put).toHaveBeenCalledWith(apiName, `/accounts/${accountId}`, { body: account })
        expect(result).toEqual(account)
      })
    })
  })

  describe('received emails', () => {
    describe('deleteReceivedEmail', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).del.mockResolvedValueOnce(email)

        const result = await deleteReceivedEmail(accountId, emailId)

        expect(API.del).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/received/${emailId}`, {})
        expect(result).toEqual(email)
      })
    })

    describe('getAllReceivedEmails', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).get.mockResolvedValueOnce(emailBatch)

        const result = await getAllReceivedEmails(accountId)

        expect(API.get).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/received`, {})
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getReceivedAttachment', () => {
      it('should return the attachment URL', async () => {
        jest.mocked(API).get.mockResolvedValueOnce(attachmentUrl)

        const result = await getReceivedAttachment(accountId, emailId, attachmentId)

        expect(API.get).toHaveBeenCalledWith(
          apiName,
          `/accounts/${accountId}/emails/received/${emailId}/attachments/${attachmentId}`,
          {},
        )
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getReceivedEmailContents', () => {
      it('should return the email contents', async () => {
        jest.mocked(API).get.mockResolvedValueOnce(emailContents)

        const result = await getReceivedEmailContents(accountId, emailId)

        expect(API.get).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/received/${emailId}/contents`, {})
        expect(result).toEqual(emailContents)
      })
    })

    describe('patchReceivedEmail', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).patch.mockResolvedValueOnce(email)

        const result = await patchReceivedEmail(accountId, emailId, jsonPatchOperations)

        expect(API.patch).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/received/${emailId}`, {
          body: jsonPatchOperations,
        })
        expect(result).toEqual(email)
      })
    })
  })

  describe('sent emails', () => {
    describe('deleteSentEmail', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).del.mockResolvedValueOnce(email)

        const result = await deleteSentEmail(accountId, emailId)

        expect(API.del).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/sent/${emailId}`, {})
        expect(result).toEqual(email)
      })
    })

    describe('getAllSentEmails', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).get.mockResolvedValueOnce(emailBatch)

        const result = await getAllSentEmails(accountId)

        expect(API.get).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/sent`, {})
        expect(result).toEqual(emailBatch)
      })
    })

    describe('getSentAttachment', () => {
      it('should return the attachment URL', async () => {
        jest.mocked(API).get.mockResolvedValueOnce(attachmentUrl)

        const result = await getSentAttachment(accountId, emailId, attachmentId)

        expect(API.get).toHaveBeenCalledWith(
          apiName,
          `/accounts/${accountId}/emails/sent/${emailId}/attachments/${attachmentId}`,
          {},
        )
        expect(result).toEqual(attachmentUrl)
      })
    })

    describe('getSentEmailContents', () => {
      it('should return the email contents', async () => {
        jest.mocked(API).get.mockResolvedValueOnce(emailContents)

        const result = await getSentEmailContents(accountId, emailId)

        expect(API.get).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/sent/${emailId}/contents`, {})
        expect(result).toEqual(emailContents)
      })
    })

    describe('postSentAttachment', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).post.mockResolvedValueOnce(postAttachmentResult)

        const result = await postSentAttachment(accountId)

        expect(API.post).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/sent/attachments`, {})
        expect(result).toEqual(postAttachmentResult)
      })
    })

    describe('patchSentEmail', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).patch.mockResolvedValueOnce(email)

        const result = await patchSentEmail(accountId, emailId, jsonPatchOperations)

        expect(API.patch).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/sent/${emailId}`, {
          body: jsonPatchOperations,
        })
        expect(result).toEqual(email)
      })
    })

    describe('postSentEmail', () => {
      it('should return the result from the API call', async () => {
        jest.mocked(API).post.mockResolvedValueOnce(email)

        const result = await postSentEmail(accountId, outboundEmail)

        expect(API.post).toHaveBeenCalledWith(apiName, `/accounts/${accountId}/emails/sent`, { body: outboundEmail })
        expect(result).toEqual(email)
      })
    })
  })
})
