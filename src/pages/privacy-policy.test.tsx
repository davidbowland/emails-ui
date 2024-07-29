import '@testing-library/jest-dom'
import { mocked } from 'jest-mock'
import React from 'react'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import PrivacyPage from './privacy-policy'
import PrivacyPolicy from '@components/privacy-policy'

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
