import Authenticated from '@components/auth'
import Compose from '@components/compose'
import PrivacyLink from '@components/privacy-link'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import ComposePage, { Head } from './compose'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/compose')
jest.mock('@components/privacy-link')
jest.mock('@config/amplify')

describe('Compose page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(PrivacyLink).mockReturnValue(<></>)
  })

  it('should render Authenticated component', () => {
    render(<ComposePage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render Compose component', () => {
    render(<ComposePage />)
    expect(Compose).toHaveBeenCalledTimes(1)
  })

  it('should render PrivacyLink component', () => {
    render(<ComposePage />)
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
