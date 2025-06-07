import Authenticated from '@components/auth'
import PrivacyLink from '@components/privacy-link'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import * as gatsby from 'gatsby'
import { mocked } from 'jest-mock'
import React from 'react'

import Index from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/privacy-link')
jest.mock('gatsby')

describe('Index page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  it('should render Authenticated component', () => {
    render(<Index />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  it('should navigate to inbox page', () => {
    render(<Index />)
    expect(mocked(gatsby).navigate).toHaveBeenCalledWith('/inbox')
  })

  it('should render PrivacyLink component', () => {
    render(<Index />)
    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
