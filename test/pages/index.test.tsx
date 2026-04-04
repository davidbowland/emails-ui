import Index from '@pages/index'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { useRouter } from 'next/router'
import React from 'react'

import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/privacy-link')
jest.mock('@config/amplify')
jest.mock('next/head', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), replace: jest.fn() }),
}))

describe('Index page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(PrivacyLink).mockReturnValue(<></>)
  })

  it('should render Authenticated component', () => {
    render(<Index />)
    expect(Authenticated).toHaveBeenCalled()
  })

  it('should navigate to inbox page', () => {
    const mockReplace = jest.fn()
    jest.mocked(useRouter).mockReturnValueOnce({ push: jest.fn(), replace: mockReplace } as any)
    render(<Index />)
    expect(mockReplace).toHaveBeenCalledWith('/inbox')
  })

  it('should render PrivacyLink component', () => {
    render(<Index />)
    expect(PrivacyLink).toHaveBeenCalled()
  })

  it('returns title in Head', () => {
    render(<Index />)
    expect(document.title).toBe('Email | dbowland.com')
  })
})
