import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'
import Themed from '@components/themed'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import NotFound, { Head } from './404'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/server-error-message')
jest.mock('@components/themed')
jest.mock('@config/amplify')

describe('404 error page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(ServerErrorMessage).mockReturnValue(<></>)
    jest.mocked(Themed).mockImplementation(({ children }) => <>{children}</>)
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '' },
    })
  })

  beforeEach(() => {
    window.location.pathname = '/an-invalid-page'
  })

  it('should render Authenticated component', () => {
    render(<NotFound />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render ServerErrorMessage with correct title', () => {
    const expectedTitle = '404: Not Found'
    render(<NotFound />)
    expect(ServerErrorMessage).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything(),
    )
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('should return title in Head component', () => {
    const { container } = render(<Head {...({} as any)} />)
    expect(container).toMatchInlineSnapshot(`
      <div>
        <title>
          404: Not Found | dbowland.com
        </title>
      </div>
    `)
  })
})
