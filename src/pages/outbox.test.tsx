import '@testing-library/jest-dom'
import { mocked } from 'jest-mock'
import React from 'react'
import { render } from '@testing-library/react'

import * as emails from '@services/emails'
import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import OutboxPage from './outbox'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/mailbox')
jest.mock('@components/privacy-link')
jest.mock('@services/emails')

describe('Outbox page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering OutboxPage renders Authenticated', () => {
    render(<OutboxPage />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering OutboxPage renders Mailbox', () => {
    render(<OutboxPage />)
    expect(mocked(Mailbox)).toHaveBeenCalledWith(
      {
        deleteEmail: mocked(emails).deleteSentEmail,
        getAllEmails: mocked(emails).getAllSentEmails,
        getEmailAttachment: mocked(emails).getSentAttachment,
        getEmailContents: mocked(emails).getSentEmailContents,
        patchEmail: mocked(emails).patchSentEmail,
      },
      {}
    )
  })

  test('expect rendering OutboxPage renders PrivacyLink', () => {
    render(<OutboxPage />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
