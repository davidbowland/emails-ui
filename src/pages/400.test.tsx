import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'
import Themed from '@components/themed'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import BadRequest from './400'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/server-error-message')
jest.mock('@components/themed')

describe('400 error page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(ServerErrorMessage).mockReturnValue(<></>)
    mocked(Themed).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render Authenticated component', () => {
    render(<BadRequest />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  it('should render ServerErrorMessage with correct title', () => {
    const expectedTitle = '400: Bad Request'
    render(<BadRequest />)
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything(),
    )
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledTimes(1)
  })
})
