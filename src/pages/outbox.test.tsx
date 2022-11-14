import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import Outbox from '@components/outbox'
import OutboxPage from './outbox'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/outbox')
jest.mock('@components/privacy-link')

describe('Outbox page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering OutboxPage renders Authenticated', () => {
    render(<OutboxPage />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering OutboxPage renders Inbox', () => {
    render(<OutboxPage />)
    expect(mocked(Outbox)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering OutboxPage renders PrivacyLink', () => {
    render(<OutboxPage />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
