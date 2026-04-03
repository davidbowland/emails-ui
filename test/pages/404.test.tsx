import NotFound from '@pages/404'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/server-error-message')
jest.mock('@config/amplify')
jest.mock('next/head', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))

describe('404 error page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(ServerErrorMessage).mockReturnValue(<></>)
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '' },
    })
  })

  it('should render Authenticated component', () => {
    render(<NotFound />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render ServerErrorMessage with correct title', () => {
    const expectedTitle = '404: Not Found'
    render(<NotFound />)
    expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('should return title in Head', () => {
    render(<NotFound />)
    expect(document.title).toBe('404: Not Found | dbowland.com')
  })
})
