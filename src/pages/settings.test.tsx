import AccountSettings from '@components/account-settings'
import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import SettingsPage, { Head } from './settings'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/account-settings')
jest.mock('@components/auth')
jest.mock('@components/privacy-link')
jest.mock('@config/amplify')

describe('Settings page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(PrivacyLink).mockReturnValue(<></>)
  })

  it('should render AccountSettings component', () => {
    render(<SettingsPage />)
    expect(AccountSettings).toHaveBeenCalledTimes(1)
  })

  it('should render Authenticated component', () => {
    render(<SettingsPage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render PrivacyLink component', () => {
    render(<SettingsPage />)
    expect(PrivacyLink).toHaveBeenCalledTimes(1)
  })

  it('returns title in Head component', () => {
    const { container } = render(<Head {...({} as any)} />)
    expect(container).toMatchInlineSnapshot(`
      <div>
        <title>
          Email | dbowland.com
        </title>
      </div>
    `)
  })
})
