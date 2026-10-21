import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import InboxPage from '@pages/inbox'
import * as emails from '@services/emails'
import { accountId } from '@test/__mocks__'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/mailbox')
jest.mock('@config/amplify')
jest.mock('@services/emails')
jest.mock('next/head', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))

describe('Inbox page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render Authenticated component', () => {
    render(<InboxPage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render Mailbox with correct props', () => {
    render(<InboxPage />)
    expect(Mailbox).toHaveBeenCalledWith(
      {
        bounceEmail: jest.mocked(emails).postBounceEmail,
        deleteEmail: jest.mocked(emails).deleteReceivedEmail,
        folder: 'inbox',
        getAllEmails: expect.any(Function),
        getEmailAttachment: jest.mocked(emails).getReceivedAttachment,
        getEmailContents: jest.mocked(emails).getReceivedEmailContents,
        moveEmail: jest.mocked(emails).moveReceivedEmail,
        patchEmail: jest.mocked(emails).patchReceivedEmail,
      },
      undefined,
    )
  })

  it('should load the Inbox folder only', async () => {
    jest.mocked(emails).getAllReceivedEmails.mockResolvedValueOnce([])
    render(<InboxPage />)

    const { getAllEmails } = jest.mocked(Mailbox).mock.calls[0][0]
    expect(await getAllEmails(accountId)).toEqual([])
    expect(emails.getAllReceivedEmails).toHaveBeenCalledWith(accountId, 'inbox')
  })

  it('returns title in Head', () => {
    render(<InboxPage />)
    expect(document.title).toBe('Email | dbowland.com')
  })

  it('should exclude the page from search indexes', () => {
    render(<InboxPage />)
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })
})
