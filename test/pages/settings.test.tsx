import React from 'react'

import AccountSettings from '@components/account-settings'
import Authenticated from '@components/auth'
import SettingsPage from '@pages/settings'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/account-settings')
jest.mock('@components/auth')
jest.mock('@config/amplify')
jest.mock('next/head', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))

describe('Settings page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render AccountSettings component', () => {
    render(<SettingsPage />)
    expect(AccountSettings).toHaveBeenCalledTimes(1)
  })

  it('should render Authenticated component', () => {
    render(<SettingsPage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('returns title in Head', () => {
    render(<SettingsPage />)
    expect(document.title).toBe('Email | dbowland.com')
  })

  it('should exclude the page from search indexes', () => {
    render(<SettingsPage />)
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })
})
