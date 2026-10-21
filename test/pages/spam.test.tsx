import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import SpamPage from '@pages/spam'
import * as emails from '@services/emails'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/mailbox')
jest.mock('@config/amplify')
jest.mock('@services/emails')
jest.mock('next/head', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))

describe('Spam page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render Authenticated component', () => {
    render(<SpamPage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render the Spam folder without a bounce action', () => {
    render(<SpamPage />)
    expect(Mailbox).toHaveBeenCalledWith(
      {
        deleteEmail: jest.mocked(emails).deleteReceivedEmail,
        folder: 'spam',
        getAllEmails: jest.mocked(emails).getAllSpamEmails,
        getEmailAttachment: jest.mocked(emails).getReceivedAttachment,
        getEmailContents: jest.mocked(emails).getReceivedEmailContents,
        moveEmail: jest.mocked(emails).moveReceivedEmail,
        patchEmail: jest.mocked(emails).patchReceivedEmail,
      },
      undefined,
    )
  })

  it('returns title in Head', () => {
    render(<SpamPage />)
    expect(document.title).toBe('Spam | dbowland.com')
  })

  it('should exclude the page from search indexes', () => {
    render(<SpamPage />)
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })
})
