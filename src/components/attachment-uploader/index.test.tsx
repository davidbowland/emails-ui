import { accountId, attachments, postAttachmentResult } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import React from 'react'

import AttachmentUploader from './index'
import * as emails from '@services/emails'

jest.mock('aws-amplify')
jest.mock('@config/amplify')
jest.mock('@services/emails')
jest.mock('axios')

describe('Attachment uploader component', () => {
  const file = new File(['fnord'], 'test.file', { type: 'image/png' })
  const setAttachments = jest.fn()

  beforeAll(() => {
    jest.mocked(emails.postSentAttachment).mockResolvedValue(postAttachmentResult)
    jest.mocked(axios.post).mockResolvedValue({})
    console.error = jest.fn()
  })

  it('should remove attachment when remove button is clicked', async () => {
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const removeButton = (await screen.findAllByLabelText(/Remove attachment/i))[0] as HTMLButtonElement
    await act(async () => {
      await userEvent.click(removeButton)
    })

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

  it('should show error message when attachment upload fails', async () => {
    jest.mocked(emails.postSentAttachment).mockRejectedValueOnce(new Error('Upload failed'))
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    await act(async () => {
      await userEvent.upload(fileUpload, file)
    })

    expect(
      await screen.findByText(/Error uploading file. Please ensure file is below file size limit and then try again./i),
    ).toBeVisible()
  })

  it('should remove error message when close button is clicked', async () => {
    jest.mocked(emails.postSentAttachment).mockRejectedValueOnce(new Error('Upload failed'))
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    await act(async () => {
      await userEvent.upload(fileUpload, file)
    })

    await screen.findByText(/Error uploading file. Please ensure file is below file size limit and then try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(closeSnackbarButton)
    })

    expect(
      screen.queryByText(/Error uploading file. Please ensure file is below file size limit and then try again./i),
    ).not.toBeInTheDocument()
  })

  it('should call postSentAttachment and upload file successfully', async () => {
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    await act(async () => {
      await userEvent.upload(fileUpload, file)
    })

    await waitFor(() => {
      expect(emails.postSentAttachment).toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledWith(postAttachmentResult.url, expect.any(FormData), expect.anything())
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
