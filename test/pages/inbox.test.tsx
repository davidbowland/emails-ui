import InboxPage from '@pages/inbox'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import * as emails from '@services/emails'

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
        getAllEmails: jest.mocked(emails).getAllReceivedEmails,
        getEmailAttachment: jest.mocked(emails).getReceivedAttachment,
        getEmailContents: jest.mocked(emails).getReceivedEmailContents,
        patchEmail: jest.mocked(emails).patchReceivedEmail,
      },
      undefined,
    )
  })

  it('returns title in Head', () => {
    render(<InboxPage />)
    expect(document.title).toBe('Email | dbowland.com')
  })
})
