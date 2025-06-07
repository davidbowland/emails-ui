import { accountId, attachments, postAttachmentResult } from '@test/__mocks__'
import { http, HttpResponse, server } from '@test/setup-server'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import AttachmentUploader from './index'
import * as emails from '@services/emails'

jest.mock('aws-amplify')
jest.mock('@services/emails')

describe('Attachment viewer component', () => {
  const file = new File(['fnord'], 'test.file', { type: 'image/png' })
  const postEndpoint = jest.fn()
  const setAttachments = jest.fn()

  beforeAll(() => {
    mocked(emails).postSentAttachment.mockResolvedValue(postAttachmentResult)
    postEndpoint.mockReturnValue({})

    console.error = jest.fn()
    server.use(
      http.post(postAttachmentResult.url, async () => {
        const body = postEndpoint()
        return body ? HttpResponse.json(body) : new HttpResponse(null, { status: 400 })
      }),
    )
  })

  test('expect attachment removed when remove clicked', async () => {
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const removeButton = (await screen.findAllByLabelText(/Remove attachment/i))[0] as HTMLButtonElement
    fireEvent.click(removeButton)

    expect(setAttachments).toHaveBeenCalledWith([
      {
        filename: '20221101_212453.jpg',
        id: '184536985e234b582b22',
        key: 'attachments/account/184536985e234b582b22',
        size: 1555850,
        type: 'image/jpeg',
      },
    ])
  })

  test('expect error message when attachment upload', async () => {
    mocked(emails).postSentAttachment.mockRejectedValueOnce(undefined)
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    fireEvent.change(fileUpload, { target: { files: [file] } })

    expect(
      await screen.findByText(/Error uploading file. Please ensure file is below file size limit and then try again./i),
    ).toBeVisible()
  })

  test('expect closing error message removes it', async () => {
    mocked(emails).postSentAttachment.mockRejectedValueOnce(undefined)
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    fireEvent.change(fileUpload, { target: { files: [file] } })
    await screen.findByText(/Error uploading file. Please ensure file is below file size limit and then try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(closeSnackbarButton)

    expect(
      screen.queryByText(/Error uploading file. Please ensure file is below file size limit and then try again./i),
    ).not.toBeInTheDocument()
  })

  test('expect postSignedUrl called with file', async () => {
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    fireEvent.change(fileUpload, {
      target: { files: [file] },
    })

    await waitFor(() => {
      expect(postEndpoint).toHaveBeenCalledTimes(1)
    })
    expect(setAttachments).toHaveBeenCalledWith([
      ...attachments,
      {
        filename: 'test.file',
        id: 'uuuuu-uuuuu-iiiii-ddddd',
        key: 'attachments/account/uuuuu-uuuuu-iiiii-ddddd',
        size: 5,
        type: 'image/png',
      },
    ])
  })
})
