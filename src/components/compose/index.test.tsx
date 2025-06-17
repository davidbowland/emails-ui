import AddressLine from '@components/address-line'
import AttachmentUploader from '@components/attachment-uploader'
import HtmlEditor from '@components/html-editor'
import { accountId, addresses, attachments, email, user } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import * as gatsby from 'gatsby'
import React from 'react'

import Compose from './index'
import * as emails from '@services/emails'

jest.mock('aws-amplify')
jest.mock('gatsby')
jest.mock('@components/address-line')
jest.mock('@components/attachment-uploader')
jest.mock('@components/html-editor')
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
    jest.mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    jest.mocked(AddressLine).mockReturnValue(<>AddressLine</>)
    jest.mocked(AttachmentUploader).mockReturnValue(<>AttachmentUploader</>)
    jest.mocked(HtmlEditor).mockImplementation(({ inputRef }) => <div ref={inputRef}></div>)
    jest.mocked(emails).postSentEmail.mockResolvedValue(email)
    jest.mocked(getSelection).mockReturnValue(selection)
    jest.mocked(selection).toString.mockReturnValue('textContent')

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

  test('expect error message when user not logged in', async () => {
    jest.mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<Compose />)

    expect(await screen.findByText(/Error authenticating user. Please reload the page to try again./i)).toBeVisible()
  })

  test('expect closing snackbar removes error', async () => {
    jest.mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<Compose />)

    await screen.findByText(/Error authenticating user. Please reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(closeSnackbarButton)

    expect(
      screen.queryByText(/Error authenticating user. Please reload the page to try again./i),
    ).not.toBeInTheDocument()
  })

  test('expect discardCallback called when discard clicked', async () => {
    render(<Compose discardCallback={discardCallback} />)

    const discardButton = (await screen.findByText(/Discard/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(discardButton)
    const discardDialogButton = (await screen.findAllByText(/Discard/i, { selector: 'button' }))[1] as HTMLButtonElement
    fireEvent.click(discardDialogButton)

    expect(discardCallback).toHaveBeenCalledTimes(1)
  })

  test('expect discardCallback not called when discard cancelled', async () => {
    render(<Compose discardCallback={discardCallback} />)

    const discardButton = (await screen.findByText(/Discard/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(discardButton)
    const keepEditingButton = (await screen.findByText(/Keep editing/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(keepEditingButton)

    expect(discardCallback).not.toHaveBeenCalled()
  })

  test('expect error message when no recipients', async () => {
    render(<Compose />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(sendButton)

    expect(await screen.findByText(/Please enter recipients./i)).toBeVisible()
    expect(emails.postSentEmail).not.toHaveBeenCalled()
  })

  test('expect error message when postSentEmail rejects', async () => {
    jest.mocked(emails).postSentEmail.mockRejectedValueOnce(undefined)
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(sendButton)

    expect(await screen.findByText(/Error sending email. Please try again in a few moments./i)).toBeVisible()
  })

  test('expect error message when too large of attachments', async () => {
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
    fireEvent.click(sendButton)

    expect(await screen.findByText(/Attachments cannot exceed [\d,]+ bytes./i)).toBeVisible()
  })

  test('expect postSentEmail and navigate called', async () => {
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
    fireEvent.change(subjectInput, { target: { value: 'Hello, e-mail world!' } })
    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(sendButton)

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

  test('expect postSentEmail called with no subject', async () => {
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(sendButton)

    expect(emails.postSentEmail).toHaveBeenCalledWith(accountId, expect.objectContaining({ subject: 'no subject' }))
  })

  test('expect postSentEmail called with textContent when no selection', async () => {
    jest.mocked(getSelection).mockReturnValueOnce(undefined)
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    fireEvent.click(sendButton)

    expect(emails.postSentEmail).toHaveBeenCalledWith(accountId, expect.objectContaining({ text: '' }))
  })

  test('expect components rendered', async () => {
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
      {},
    )
    expect(AddressLine).toHaveBeenCalledWith(expect.objectContaining({ addresses: [], label: 'CC:' }), {})
    expect(AddressLine).toHaveBeenCalledWith(expect.objectContaining({ addresses: [], label: 'BCC:' }), {})
    expect(HtmlEditor).toHaveBeenCalledWith(expect.objectContaining({ initialBody: body }), {})
    await waitFor(() => {
      expect(AttachmentUploader).toHaveBeenCalledWith(expect.objectContaining({ accountId, attachments: [] }), {})
    })
  })
})
