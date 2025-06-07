import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'
import Themed from '@components/themed'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import InternalServerError from './500'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/server-error-message')
jest.mock('@components/themed')

describe('500 error page', () => {
  beforeAll(() => {
    mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    mocked(ServerErrorMessage).mockReturnValue(<></>)
    mocked(Themed).mockImplementation(({ children }) => <>{children}</>)
  })

  test('expect rendering InternalServerError renders Authenticated', () => {
    render(<InternalServerError />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering InternalServerError renders ServerErrorMessage', () => {
    const expectedTitle = '500: Internal Server Error'
    render(<InternalServerError />)
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything(),
    )
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledTimes(1)
  })
})
