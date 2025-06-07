import Authenticated from '@components/auth'
import Compose from '@components/compose'
import PrivacyLink from '@components/privacy-link'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import ComposePage from './compose'

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
