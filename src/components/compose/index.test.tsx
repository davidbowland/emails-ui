import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Auth } from 'aws-amplify'
import React from 'react'
import { mocked } from 'jest-mock'

import * as emails from '@services/emails'
import * as gatsby from 'gatsby'
import { accountId, addresses, attachments, email, user } from '@test/__mocks__'
import AddressLine from '@components/address-line'
import AttachmentUploader from '@components/attachment-uploader'
import Compose from './index'
import HtmlEditor from '@components/html-editor'

jest.mock('aws-amplify')
jest.mock('gatsby')
jest.mock('@components/address-line')
jest.mock('@components/attachment-uploader')
jest.mock('@components/html-editor')
jest.mock('@services/emails')

describe('Compose component', () => {
  const discardCallback = jest.fn()

  beforeAll(() => {
    mocked(Auth).currentAuthenticatedUser.mockResolvedValue(user)
    mocked(AddressLine).mockReturnValue(<>AddressLine</>)
    mocked(AttachmentUploader).mockReturnValue(<>AttachmentUploader</>)
    mocked(HtmlEditor).mockImplementation(({ inputRef }) => <div ref={inputRef}></div>)
    mocked(emails).postSentEmail.mockResolvedValue(email)

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
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<Compose />)

    expect(await screen.findByText(/Error authenticating user. Please reload the page to try again./i)).toBeVisible()
  })

  test('expect closing snackbar removes error', async () => {
    mocked(Auth).currentAuthenticatedUser.mockRejectedValueOnce(undefined)
    render(<Compose />)

    await screen.findByText(/Error authenticating user. Please reload the page to try again./i)
    const closeSnackbarButton = (await screen.findByLabelText(/Close/i, { selector: 'button' })) as HTMLButtonElement
    act(() => {
      closeSnackbarButton.click()
    })
    expect(
      screen.queryByText(/Error authenticating user. Please reload the page to try again./i)
    ).not.toBeInTheDocument()
  })

  test('expect discardCallback called when discard clicked', async () => {
    render(<Compose discardCallback={discardCallback} />)

    const discardButton = (await screen.findByText(/Discard/i, { selector: 'button' })) as HTMLButtonElement
    act(() => {
      discardButton.click()
    })
    const discardDialogButton = (await screen.findAllByText(/Discard/i, { selector: 'button' }))[1] as HTMLButtonElement
    act(() => {
      discardDialogButton.click()
    })

    expect(discardCallback).toHaveBeenCalledTimes(1)
  })

  test('expect discardCallback not called when discard cancelled', async () => {
    render(<Compose discardCallback={discardCallback} />)

    const discardButton = (await screen.findByText(/Discard/i, { selector: 'button' })) as HTMLButtonElement
    act(() => {
      discardButton.click()
    })
    const keepEditingButton = (await screen.findByText(/Keep editing/i, { selector: 'button' })) as HTMLButtonElement
    act(() => {
      keepEditingButton.click()
    })

    expect(discardCallback).not.toHaveBeenCalled()
  })

  test('expect error message when no recipients', async () => {
    render(<Compose />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await sendButton.click()
    })

    expect(await screen.findByText(/Please enter recipients./i)).toBeVisible()
    expect(mocked(emails).postSentEmail).not.toHaveBeenCalled()
  })

  test('expect error message when postSentEmail rejects', async () => {
    mocked(emails).postSentEmail.mockRejectedValueOnce(undefined)
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await sendButton.click()
    })

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
      />
    )

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await sendButton.click()
    })

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
      />
    )

    const subjectInput = (await screen.findByLabelText(/Subject/i)) as HTMLInputElement
    await act(async () => {
      fireEvent.change(subjectInput, { target: { value: 'Hello, e-mail world!' } })
    })
    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await sendButton.click()
    })

    expect(mocked(emails).postSentEmail).toHaveBeenCalledWith(accountId, {
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
      text: '',
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
    expect(mocked(gatsby).navigate).toHaveBeenCalledWith('/outbox')
  })

  test('expect postSentEmail called with no subject', async () => {
    render(<Compose initialToAddresses={addresses} />)

    const sendButton = (await screen.findByText(/Send/i, { selector: 'button' })) as HTMLButtonElement
    await act(async () => {
      await sendButton.click()
    })

    expect(mocked(emails).postSentEmail).toHaveBeenCalledWith(
      accountId,
      expect.objectContaining({ subject: 'no subject' })
    )
  })

  test('expect components rendered', async () => {
    const body = '<p>Hello, world!</p>'
    render(<Compose initialBody={body} initialToAddresses={addresses} />)

    expect(mocked(AddressLine)).toHaveBeenCalledWith(
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
      {}
    )
    expect(mocked(AddressLine)).toHaveBeenCalledWith(expect.objectContaining({ addresses: [], label: 'CC:' }), {})
    expect(mocked(AddressLine)).toHaveBeenCalledWith(expect.objectContaining({ addresses: [], label: 'BCC:' }), {})
    expect(mocked(HtmlEditor)).toHaveBeenCalledWith(expect.objectContaining({ initialBody: body }), {})
    waitFor(() => {
      expect(mocked(AttachmentUploader)).toHaveBeenCalledWith(
        expect.objectContaining({ accountId, attachments: [] }),
        {}
      )
    })
  })
})
