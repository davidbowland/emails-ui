import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import InboxPage, { Head } from './inbox'
import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'
import * as emails from '@services/emails'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/mailbox')
jest.mock('@components/privacy-link')
jest.mock('@config/amplify')
jest.mock('@services/emails')

describe('Inbox page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(PrivacyLink).mockReturnValue(<></>)
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
      {},
    )
  })

  it('should render PrivacyLink component', () => {
    render(<InboxPage />)
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
