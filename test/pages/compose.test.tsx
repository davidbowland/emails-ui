import ComposePage from '@pages/compose'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import Authenticated from '@components/auth'
import Compose from '@components/compose'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/compose')
jest.mock('@config/amplify')
jest.mock('next/head', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))

describe('Compose page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render Authenticated component', () => {
    render(<ComposePage />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render Compose component', () => {
    render(<ComposePage />)
    expect(Compose).toHaveBeenCalledTimes(1)
  })

  it('returns title in Head', () => {
    render(<ComposePage />)
    expect(document.title).toBe('Email | dbowland.com')
  })
})
