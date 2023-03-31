import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { rest, server } from '@test/setup-server'
import { mocked } from 'jest-mock'
import React from 'react'

import * as emails from '@services/emails'
import { accountId, attachments, postAttachmentResult } from '@test/__mocks__'
import AttachmentUploader from './index'

jest.mock('aws-amplify')
jest.mock('@services/emails')

describe('Attachment viewer component', () => {
  const file = new File(['fnord'], 'test.file', { type: 'image/png' })
  const postEndpoint = jest.fn()
  const setAttachments = jest.fn()

  beforeAll(() => {
    mocked(emails).postSentAttachment.mockResolvedValue(postAttachmentResult)
    postEndpoint.mockReturnValue({})

    server.use(
      rest.post(postAttachmentResult.url, async (req, res, ctx) => {
        const body = postEndpoint()
        return res(body ? ctx.body(body) : ctx.status(400))
      })
    )
  })

  test('expect attachment removed when remove clicked', async () => {
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const removeButton = (await screen.findAllByLabelText(/Remove attachment/i))[0] as HTMLButtonElement
    act(() => {
      removeButton.click()
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

  test('expect error message when attachment upload', async () => {
    mocked(emails).postSentAttachment.mockRejectedValueOnce(undefined)
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    await act(async () => {
      await fireEvent.change(fileUpload, {
        target: { files: [file] },
      })
    })

    expect(
      await screen.findByText(/Error uploading file. Please ensure file is below file size limit and then try again./i)
    ).toBeVisible()
  })

  test('expect closing error message removes it', async () => {
    mocked(emails).postSentAttachment.mockRejectedValueOnce(undefined)
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    await act(async () => {
      await fireEvent.change(fileUpload, {
        target: { files: [file] },
      })
    })
    await screen.findByText(/Error uploading file. Please ensure file is below file size limit and then try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    act(() => {
      closeSnackbarButton.click()
    })
    expect(
      screen.queryByText(/Error uploading file. Please ensure file is below file size limit and then try again./i)
    ).not.toBeInTheDocument()
  })

  test('expect postSignedUrl called with file', async () => {
    render(<AttachmentUploader accountId={accountId} attachments={attachments} setAttachments={setAttachments} />)

    const fileUpload = (await screen.findByLabelText(/Attachment upload/i)) as HTMLInputElement
    await act(async () => {
      await fireEvent.change(fileUpload, {
        target: { files: [file] },
      })
    })

    expect(postEndpoint).toHaveBeenCalledTimes(1)
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
