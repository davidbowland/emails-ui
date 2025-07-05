import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import * as gatsby from 'gatsby'
import React from 'react'

import Index, { Head } from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/privacy-link')
jest.mock('@config/amplify')
jest.mock('gatsby')

describe('Index page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(PrivacyLink).mockReturnValue(<></>)
  })

  it('should render Authenticated component', () => {
    render(<Index />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should navigate to inbox page', () => {
    render(<Index />)
    expect(gatsby.navigate).toHaveBeenCalledWith('/inbox')
  })

  it('should render PrivacyLink component', () => {
    render(<Index />)
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
