import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import Inbox from '@components/inbox'
import Index from './index'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/inbox')
jest.mock('@components/privacy-link')

describe('Index page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering Index renders Authenticated', () => {
    render(<Index />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering Index renders Inbox', () => {
    render(<Index />)
    expect(mocked(Inbox)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering Index renders PrivacyLink', () => {
    render(<Index />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
