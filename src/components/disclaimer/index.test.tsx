import '@testing-library/jest-dom'
import { MockedObject, mocked } from 'jest-mock'
import { act, render, screen } from '@testing-library/react'
import Cookies from 'universal-cookie'
import React from 'react'

import Disclaimer from './index'

jest.mock('universal-cookie')

describe('Disclaimer component', () => {
  const mockCookieGet = jest.fn()
  const mockCookieSet = jest.fn()

  beforeAll(() => {
    mocked(Cookies).mockImplementation(
      () =>
        ({
          get: mockCookieGet,
          set: mockCookieSet,
        } as unknown as MockedObject<Cookies>)
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
    act(() => {
      closeButton.click()
    })
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
