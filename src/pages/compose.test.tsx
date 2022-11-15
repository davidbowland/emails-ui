import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import Compose from '@components/compose'
import ComposePage from './compose'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/compose')
jest.mock('@components/privacy-link')

describe('Compose page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering ComposePage renders Authenticated', () => {
    render(<ComposePage />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering ComposePage renders Compose', () => {
    render(<ComposePage />)
    expect(mocked(Compose)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering ComposePage renders PrivacyLink', () => {
    render(<ComposePage />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
