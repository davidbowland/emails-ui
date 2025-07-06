import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import PrivacyPage, { Head } from './privacy-policy'
import Authenticated from '@components/auth'
import PrivacyPolicy from '@components/privacy-policy'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/privacy-policy')

describe('Privacy page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(PrivacyPolicy).mockReturnValue(<></>)
  })

  it('should render Authenticated component', () => {
    render(<PrivacyPage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render PrivacyPolicy component', () => {
    render(<PrivacyPage />)
    expect(PrivacyPolicy).toHaveBeenCalledTimes(1)
  })

  it('should return title in Head component', () => {
    const { container } = render(<Head {...({} as any)} />)
    expect(container).toMatchInlineSnapshot(`
      <div>
        <title>
          Privacy Policy | dbowland.com
        </title>
      </div>
    `)
  })
})
