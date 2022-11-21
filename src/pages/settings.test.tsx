import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import AccountSettings from '@components/account-settings'
import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'
import SettingsPage from './settings'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/account-settings')
jest.mock('@components/auth')
jest.mock('@components/privacy-link')

describe('Settings page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering SettingsPage renders Compose', () => {
    render(<SettingsPage />)
    expect(mocked(AccountSettings)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering SettingsPage renders Authenticated', () => {
    render(<SettingsPage />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering SettingsPage renders PrivacyLink', () => {
    render(<SettingsPage />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
