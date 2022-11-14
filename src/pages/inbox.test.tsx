import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import Inbox from '@components/inbox'
import InboxPage from './inbox'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/inbox')
jest.mock('@components/privacy-link')

describe('Inbox page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering InboxPage renders Authenticated', () => {
    render(<InboxPage />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering InboxPage renders Inbox', () => {
    render(<InboxPage />)
    expect(mocked(Inbox)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering InboxPage renders PrivacyLink', () => {
    render(<InboxPage />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
