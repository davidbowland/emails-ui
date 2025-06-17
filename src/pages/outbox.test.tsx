import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import OutboxPage, { Head } from './outbox'
import * as emails from '@services/emails'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/mailbox')
jest.mock('@components/privacy-link')
jest.mock('@services/emails')

describe('Outbox page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(PrivacyLink).mockReturnValue(<></>)
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
      {},
    )
  })

  it('should render PrivacyLink component', () => {
    render(<OutboxPage />)
    expect(PrivacyLink).toHaveBeenCalledTimes(1)
  })

  it('returns title in Head component', () => {
    const { container } = render(<Head {...({} as any)} />)
    expect(container).toMatchInlineSnapshot(`
      <div>
        <title>
          Email | dbowland.com
        </title>
      </div>
    `)
  })
})
