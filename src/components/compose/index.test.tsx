import { accountId, addresses, attachments, email, user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Auth } from 'aws-amplify'
import * as gatsby from 'gatsby'
import React from 'react'

import Compose from './index'
import AddressLine from '@components/address-line'
import AttachmentUploader from '@components/attachment-uploader'
import HtmlEditor from '@components/html-editor'
import * as emails from '@services/emails'

jest.mock('aws-amplify')
jest.mock('gatsby')
jest.mock('@components/address-line')
jest.mock('@components/attachment-uploader')
jest.mock('@components/html-editor')
jest.mock('@config/amplify')
jest.mock('@services/emails')

describe('Compose component', () => {
  const discardCallback = jest.fn()
  const getSelection = jest.fn()
  const selection = {
    removeAllRanges: jest.fn(),
    selectAllChildren: jest.fn(),
    toString: jest.fn(),
  }

  beforeAll(() => {
    jest.mocked(Auth.currentAuthenticatedUser).mockResolvedValue(user)
    jest.mocked(AddressLine).mockReturnValue(<>AddressLine</>)
    jest.mocked(AttachmentUploader).mockReturnValue(<>AttachmentUploader</>)
    jest.mocked(HtmlEditor).mockImplementation(({ inputRef }) => <div ref={inputRef}></div>)
    jest.mocked(emails.postSentEmail).mockResolvedValue(email)
    jest.mocked(getSelection).mockReturnValue(selection)
    jest.mocked(selection.toString).mockReturnValue('textContent')

    console.error = jest.fn()
    Object.defineProperty(window, 'getSelection', {
      configurable: true,
      value: getSelection,
    })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: jest.fn() },
    })
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: jest.fn(),
    })
  })

  it('should show error message when user is not logged in', async () => {
    jest.mocked(Auth.currentAuthenticatedUser).mockRejectedValueOnce(new Error('Not authenticated'))
    render(<Compose />)

    expect(await screen.findByText(/Error authenticating user. Please reload the page to try again./i)).toBeVisible()
  })

  it('should remove error message when close button is clicked', async () => {
    jest.mocked(Auth.currentAuthenticatedUser).mockRejectedValueOnce(new Error('Not authenticated'))
    render(<Compose />)

    await screen.findByText(/Error authenticating user. Please reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement

    await act(async () => {
      await userEvent.click(closeSnackbarButton)
    })

    expect(
      screen.queryByText(/Error authenticating user. Please reload the page to try again./i),
    ).not.toBeInTheDocument()
  })

  it('should call discardCallback when discard is confirmed', async () => {
    render(<Compose discardCallback={discardCallback} />)

    const discardButton = (await screen.findByText(/Discard/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(discardButton)
    })

    const discardDialogButton = (await screen.findAllByText(/Discard/i, { selector: 'button' }))[1] as HTMLButtonElement
    await act(async () => {
      await userEvent.click(discardDialogButton)
    })

    expect(discardCallback).toHaveBeenCalledTimes(1)
  })

  it('should not call discardCallback when discard is cancelled', async () => {
    render(<Compose discardCallback={discardCallback} />)

    const discardButton = (await screen.findByText(/Discard/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(discardButton)
    })

    const keepEditingButton = (await screen.findByText(/Keep editing/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(keepEditingButton)
    })

    expect(discardCallback).not.toHaveBeenCalled()
  })

  it('should show error message when no recipients are provided', async () => {
    render(<Compose />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(sendButton)
    })

    expect(await screen.findByText(/Please enter recipients./i)).toBeVisible()
    expect(emails.postSentEmail).not.toHaveBeenCalled()
  })

  it('should show error message when email sending fails', async () => {
    jest.mocked(emails.postSentEmail).mockRejectedValueOnce(new Error('Sending failed'))
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(sendButton)
    })

    expect(await screen.findByText(/Error sending email. Please try again in a few moments./i)).toBeVisible()
  })

  it('should show error message when attachments are too large', async () => {
    render(
      <Compose
        initialAttachments={[
          {
            filename: '20221018_135343.jpg',
            id: '18453696e0bac7e24cd1',
            key: 'attachments/account/18453696e0bac7e24cd1',
            size: 10_000_001,
            type: 'image/jpeg',
          },
        ]}
        initialToAddresses={addresses}
      />,
    )

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(sendButton)
    })

    expect(await screen.findByText(/Attachments cannot exceed [\d,]+ bytes./)).toBeVisible()
  })

  it('should call postSentEmail and navigate when email is sent successfully', async () => {
    const inReplyTo = 'umnbghjkk'
    const references = ['0pokm', 'erfgb']
    render(
      <Compose
        inReplyTo={inReplyTo}
        initialAttachments={attachments}
        initialToAddresses={addresses}
        references={references}
      />,
    )

    const subjectInput = (await screen.findByLabelText(/Subject/i)) as HTMLInputElement
    await act(async () => {
      await userEvent.type(subjectInput, 'Hello, e-mail world!')
    })

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(sendButton)
    })

    await waitFor(() => {
      expect(gatsby.navigate).toHaveBeenCalled()
    })
    expect(emails.postSentEmail).toHaveBeenCalledWith(accountId, {
      attachments: [
        {
          cid: '18453696e0bac7e24cd1',
          content: 'attachments/account/18453696e0bac7e24cd1',
          contentDisposition: 'attachment',
          contentType: 'image/jpeg',
          filename: '20221018_135343.jpg',
          headerLines: {},
          headers: {},
          size: 1731238,
          type: 'attachment',
        },
        {
          cid: '184536985e234b582b22',
          content: 'attachments/account/184536985e234b582b22',
          contentDisposition: 'attachment',
          contentType: 'image/jpeg',
          filename: '20221101_212453.jpg',
          headerLines: {},
          headers: {},
          size: 1555850,
          type: 'attachment',
        },
      ],
      bcc: [],
      cc: [],
      from: {
        address: 'dave@domain.com',
        name: '',
      },
      html: '',
      inReplyTo,
      references,
      replyTo: {
        address: 'dave@domain.com',
        name: '',
      },
      sender: {
        address: 'dave@domain.com',
        name: '',
      },
      subject: 'Hello, e-mail world!',
      text: 'textContent',
      to: [
        {
          address: 'a@domain.com',
          name: 'A',
        },
        {
          address: 'b@domain.com',
          name: '',
        },
      ],
    })
    expect(gatsby.navigate).toHaveBeenCalledWith('/outbox')
  })

  it('should use "no subject" when subject is empty', async () => {
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(sendButton)
    })

    expect(emails.postSentEmail).toHaveBeenCalledWith(accountId, expect.objectContaining({ subject: 'no subject' }))
  })

  it('should use empty text when no selection is available', async () => {
    jest.mocked(getSelection).mockReturnValueOnce(undefined)
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await userEvent.click(sendButton)
    })

    expect(emails.postSentEmail).toHaveBeenCalledWith(accountId, expect.objectContaining({ text: '' }))
  })

  it('should render all necessary components', async () => {
    const body = '<p>Hello, world!</p>'
    render(<Compose initialBody={body} initialToAddresses={addresses} />)

    expect(AddressLine).toHaveBeenCalledWith(
      expect.objectContaining({
        addresses: [
          {
            address: 'a@domain.com',
            name: 'A',
          },
          {
            address: 'b@domain.com',
            name: '',
          },
        ],
        label: 'To:',
      }),
      expect.anything(),
    )
    expect(AddressLine).toHaveBeenCalledWith(
      expect.objectContaining({ addresses: [], label: 'CC:' }),
      expect.anything(),
    )
    expect(AddressLine).toHaveBeenCalledWith(
      expect.objectContaining({ addresses: [], label: 'BCC:' }),
      expect.anything(),
    )
    expect(HtmlEditor).toHaveBeenCalledWith(expect.objectContaining({ initialBody: body }), expect.anything())
    await waitFor(() => {
      expect(AttachmentUploader).toHaveBeenCalledWith(
        expect.objectContaining({ accountId, attachments: [] }),
        expect.anything(),
      )
    })
  })
})
