import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { http, HttpResponse, server } from '@test/setup-server'
import React from 'react'

import { accountId, attachments, attachmentUrl, emailId } from '@test/__mocks__'
import AttachmentViewer from './index'

jest.mock('aws-amplify')

describe('Attachment viewer component', () => {
  const attachmentBlob = new Blob(['Hello, world'])
  const getAttachment = jest.fn()
  const getEndpoint = jest.fn()

  beforeAll(() => {
    getAttachment.mockResolvedValue(attachmentUrl)
    getEndpoint.mockReturnValue(attachmentBlob)

    console.error = jest.fn()
    server.use(
      http.get('http://localhost/a/really/long/url', async () => {
        const body = getEndpoint()
        return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
      })
    )
  })

  test('expect attachment downloaded', async () => {
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />
    )

    const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
    fireEvent.click(attachmentElement)

    expect(getAttachment).toHaveBeenCalledWith(accountId, emailId, '18453696e0bac7e24cd1')
  })

  test('expect error message when attachment download error', async () => {
    getAttachment.mockRejectedValueOnce(undefined)
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />
    )

    const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
    fireEvent.click(attachmentElement)

    expect(await screen.findByText(/Error downloading the attachment. Please try again./i)).toBeVisible()
  })

  test('expect closing error message removes it', async () => {
    getAttachment.mockRejectedValueOnce(undefined)
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />
    )

    const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
    fireEvent.click(attachmentElement)
    await screen.findByText(/Error downloading the attachment. Please try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(closeSnackbarButton)

    expect(screen.queryByText(/Error downloading the attachment. Please try again./i)).not.toBeInTheDocument()
  })
})
