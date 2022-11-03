import '@testing-library/jest-dom'
import React from 'react'
import { mocked } from 'jest-mock'
import { render } from '@testing-library/react'

import Authenticated from '@components/auth'
import BadRequest from './400'
import ServerErrorMessage from '@components/server-error-message'
import Themed from '@components/themed'

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

  test('expect rendering BadRequest renders Authenticated', () => {
    render(<BadRequest />)
    expect(mocked(Authenticated)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering BadRequest renders ServerErrorMessage', () => {
    const expectedTitle = '400: Bad Request'
    render(<BadRequest />)
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledWith(
      expect.objectContaining({ title: expectedTitle }),
      expect.anything()
    )
    expect(mocked(ServerErrorMessage)).toHaveBeenCalledTimes(1)
  })
})
