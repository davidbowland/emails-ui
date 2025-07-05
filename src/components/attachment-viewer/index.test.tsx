import { accountId, attachments, attachmentUrl, emailId } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import React from 'react'

import AttachmentViewer from './index'

jest.mock('aws-amplify')
jest.mock('axios')

describe('Attachment viewer component', () => {
  const getAttachment = jest.fn()
  const mockBlob = new Blob(['test data'], { type: 'image/jpeg' })

  beforeAll(() => {
    getAttachment.mockResolvedValue(attachmentUrl)
    jest.mocked(axios.get).mockResolvedValue({ data: mockBlob })
    console.error = jest.fn()

    window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url')
    window.URL.revokeObjectURL = jest.fn()
  })

  it('should download attachment when clicked', async () => {
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />,
    )

    const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(attachmentElement)
    })

    expect(getAttachment).toHaveBeenCalledWith(accountId, emailId, '18453696e0bac7e24cd1')

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(attachmentUrl.url, { responseType: 'blob' })
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(attachmentUrl.url)
    })
  })

  it('should show error message when attachment download fails', async () => {
    jest.mocked(getAttachment).mockRejectedValueOnce(new Error('Download failed'))
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />,
    )

    const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(attachmentElement)
    })

    expect(await screen.findByText(/Error downloading the attachment. Please try again./i)).toBeVisible()
  })

  it('should remove error message when close button is clicked', async () => {
    jest.mocked(getAttachment).mockRejectedValueOnce(new Error('Download failed'))
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />,
    )

    const attachmentElement = (await screen.findByText(/20221018_135343.jpg/i)) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(attachmentElement)
    })

    await screen.findByText(/Error downloading the attachment. Please try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(closeSnackbarButton)
    })

    expect(screen.queryByText(/Error downloading the attachment. Please try again./i)).not.toBeInTheDocument()
  })
})
