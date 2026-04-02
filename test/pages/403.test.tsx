import Forbidden from '@pages/403'
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

describe('403 error page', () => {
  beforeAll(() => {
    jest.mocked(Authenticated).mockImplementation(({ children }) => <>{children}</>)
    jest.mocked(ServerErrorMessage).mockReturnValue(<></>)
    jest.mocked(Themed).mockImplementation(({ children }) => <>{children}</>)
  })

  it('should render Authenticated component', () => {
    render(<Forbidden />)
    expect(Authenticated).toHaveBeenCalledTimes(1)
  })

  it('should render ServerErrorMessage with correct title', () => {
    const expectedTitle = '403: Forbidden'
    render(<Forbidden />)
    expect(ServerErrorMessage).toHaveBeenCalledWith(expect.objectContaining({ title: expectedTitle }), undefined)
    expect(ServerErrorMessage).toHaveBeenCalledTimes(1)
  })

  it('should return title in Head', () => {
    render(<Forbidden />)
    expect(document.title).toBe('403: Forbidden | dbowland.com')
  })
})
