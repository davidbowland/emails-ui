import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'
import Themed from '@components/themed'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import InternalServerError, { Head } from './500'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/server-error-message')
jest.mock('@components/themed')

describe('500 error page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(ServerErrorMessage).mockReturnValue(<></>)
    jest.mocked(Themed).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render Authenticated component', () => {
    render(<InternalServerError />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render ServerErrorMessage with correct title', () => {
    const expectedTitle = '500: Internal Server Error'
    render(<InternalServerError />)
    expect(ServerErrorMessage).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything(),
    )
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('returns title in Head component', () => {
    const { container } = render(<Head {...({} as any)} />)
    expect(container).toMatchInlineSnapshot(`
      <div>
        <title>
          500: Internal Server Error -- dbowland.com
        </title>
      </div>
    `)
  })
})
