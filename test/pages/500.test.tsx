import InternalServerError from '@pages/500'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import React from 'react'

import Authenticated from '@components/auth'
import ServerErrorMessage from '@components/server-error-message'
import Themed from '@components/themed'

jest.mock('@aws-amplify/analytics')
jest.mock('@components/auth')
jest.mock('@components/server-error-message')
jest.mock('@components/themed')
jest.mock('@config/amplify')
jest.mock('next/head', () => jest.fn().mockImplementation(({ children }) => <>{children}</>))

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
    expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('should return title in Head', () => {
    render(<InternalServerError />)
    expect(document.title).toBe('500: Internal Server Error | dbowland.com')
  })
})
