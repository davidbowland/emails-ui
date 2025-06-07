import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import InboxPage from './inbox'
import * as emails from '@services/emails'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/mailbox')
jest.mock('@components/privacy-link')
jest.mock('@services/emails')

describe('Inbox page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering InboxPage renders Authenticated', () => {
    render(<InboxPage />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering InboxPage renders Mailbox', () => {
    render(<InboxPage />)
    expect(mocked(Mailbox)).toHaveBeenCalledWith(
      {
        deleteEmail: mocked(emails).deleteReceivedEmail,
        getAllEmails: mocked(emails).getAllReceivedEmails,
        getEmailAttachment: mocked(emails).getReceivedAttachment,
        getEmailContents: mocked(emails).getReceivedEmailContents,
        patchEmail: mocked(emails).patchReceivedEmail,
      },
      {},
    )
  })

  test('expect rendering InboxPage renders PrivacyLink', () => {
    render(<InboxPage />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
