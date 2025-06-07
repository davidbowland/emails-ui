import Authenticated from '@components/auth'
import PrivacyPolicy from '@components/privacy-policy'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import PrivacyPage from './privacy-policy'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/privacy-policy')

describe('Privacy page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyPolicy).mockReturnValue(<></>)
  })

  test('expect rendering PrivacyPage renders Authenticated', () => {
    render(<PrivacyPage />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('Rendering PrivacyPage also renders PrivacyPolicy', () => {
    render(<PrivacyPage />)
    expect(mocked(PrivacyPolicy)).toHaveBeenCalledTimes(1)
  })
})
