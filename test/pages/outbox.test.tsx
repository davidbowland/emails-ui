import OutboxPage from '@pages/outbox'
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

describe('Outbox page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render Authenticated component', () => {
    render(<OutboxPage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render Mailbox with correct props', () => {
    render(<OutboxPage />)
    expect(Mailbox).toHaveBeenCalledWith(
      {
        deleteEmail: jest.mocked(emails).deleteSentEmail,
        getAllEmails: jest.mocked(emails).getAllSentEmails,
        getEmailAttachment: jest.mocked(emails).getSentAttachment,
        getEmailContents: jest.mocked(emails).getSentEmailContents,
        patchEmail: jest.mocked(emails).patchSentEmail,
      },
      undefined,
    )
  })

  it('returns title in Head', () => {
    render(<OutboxPage />)
    expect(document.title).toBe('Email | dbowland.com')
  })
})
