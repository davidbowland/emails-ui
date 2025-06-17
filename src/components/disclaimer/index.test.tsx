import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import Cookies from 'universal-cookie'

import Disclaimer from './index'

jest.mock('universal-cookie')

describe('Disclaimer component', () => {
  const mockCookieGet = jest.fn()
  const mockCookieSet = jest.fn()

  beforeAll(() => {
    jest.mocked(Cookies).mockImplementation(
      () =>
        ({
          get: mockCookieGet,
          set: mockCookieSet,
        }) as unknown as Cookies,
    )
  })

  test('expect disclaimer loads under normal circumstances', async () => {
    render(<Disclaimer />)

    expect(await screen.findByText(/Accept & continue/i)).toBeVisible()
  })

  test('expect disclaimer closes when button clicked', async () => {
    render(<Disclaimer />)

    const closeButton = (await screen.findByText(/Accept & continue/i, {
      selector: 'button',
    })) as HTMLButtonElement
    fireEvent.click(closeButton)

    expect(mockCookieSet).toHaveBeenCalledWith('disclaimer_accept', 'true', {
      path: '/',
      sameSite: 'strict',
      secure: true,
    })
    expect(screen.queryByText(/Cookie and Privacy Disclosure/i)).not.toBeInTheDocument()
  })

  test('expect disclaimer loads closed when cookie set', async () => {
    mockCookieGet.mockReturnValueOnce('true')
    render(<Disclaimer />)

    expect(mockCookieGet).toHaveBeenCalledWith('disclaimer_accept')
    expect(screen.queryByText(/Cookie and Privacy Disclosure/i)).not.toBeInTheDocument()
  })
})
