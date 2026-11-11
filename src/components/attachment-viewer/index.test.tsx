import axios from 'axios'
import React from 'react'

import AttachmentViewer from './index'
import { accountId, attachments, attachmentUrl, emailId } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

  it('should explain, and download nothing more, when another attachment is pressed mid-download', async () => {
    const download: { resolve: (value: typeof attachmentUrl) => void } = { resolve: () => undefined }
    getAttachment.mockReturnValueOnce(
      new Promise((resolve) => {
        download.resolve = resolve
      }),
    )
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />,
    )

    await userEvent.click(await screen.findByRole('button', { name: /20221018_135343.jpg/i }))
    await userEvent.click(screen.getByRole('button', { name: /20221101_212453.jpg/i }))

    expect(screen.getByRole('status')).toHaveTextContent('Wait until the other attachment finishes downloading.')
    expect(getAttachment).toHaveBeenCalledTimes(1)
    await act(async () => {
      download.resolve(attachmentUrl)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should ignore a second press on the attachment that is downloading', async () => {
    const download: { resolve: (value: typeof attachmentUrl) => void } = { resolve: () => undefined }
    getAttachment.mockReturnValueOnce(
      new Promise((resolve) => {
        download.resolve = resolve
      }),
    )
    render(
      <AttachmentViewer
        accountId={accountId}
        attachments={attachments}
        emailId={emailId}
        getAttachment={getAttachment}
      />,
    )

    await userEvent.click(await screen.findByRole('button', { name: '20221018_135343.jpg' }))
    // The busy button keeps its filename, so it stays the same width.
    expect(screen.getByRole('button', { name: '20221018_135343.jpg' })).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(screen.getByRole('button', { name: '20221018_135343.jpg' }))

    expect(getAttachment).toHaveBeenCalledTimes(1)
    await act(async () => {
      download.resolve(attachmentUrl)
    })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '20221018_135343.jpg' })).not.toHaveAttribute('aria-busy'),
    )
  })
})
