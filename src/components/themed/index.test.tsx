import '@testing-library/jest-dom'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import CssBaseline from '@mui/material/CssBaseline'
import { mocked } from 'jest-mock'
import React from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'

import Disclaimer from '@components/disclaimer'
import { theme } from '@test/__mocks__'
import Themed from './index'

jest.mock('@aws-amplify/analytics')
jest.mock('@mui/material/CssBaseline')
jest.mock('@mui/material/styles', () => ({
  createTheme: jest.fn(),
  ThemeProvider: jest.fn(),
}))
jest.mock('@mui/material/useMediaQuery')
jest.mock('@components/disclaimer')

describe('Themed component', () => {
  const children = <>fnord</>

  beforeAll(() => {
    mocked(CssBaseline).mockReturnValue(<></>)
    mocked(Disclaimer).mockReturnValue(<></>)
    mocked(ThemeProvider).mockImplementation(({ children }) => <>{children}</>)
    mocked(createTheme).mockReturnValue(theme)
    mocked(useMediaQuery).mockReturnValue(false)
  })

  test('expect rendering Themed has children in output', async () => {
    render(<Themed>{children}</Themed>)

    expect(await screen.findByText('fnord')).toBeInTheDocument()
  })

  test('expect rendering Themed renders CssBaseline', async () => {
    render(<Themed>{children}</Themed>)

    expect(mocked(CssBaseline)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering Themed renders Disclaimer', async () => {
    render(<Themed>{children}</Themed>)

    expect(mocked(Disclaimer)).toHaveBeenCalledTimes(1)
  })

  test('expect rendering Themed uses light theme when reqeusted', () => {
    render(<Themed>{children}</Themed>)

    expect(mocked(createTheme)).toHaveBeenCalledWith({
      palette: {
        background: {
          default: '#ededed',
          paper: '#fff',
        },
        mode: 'light',
      },
    })
    expect(mocked(ThemeProvider)).toHaveBeenCalledWith(expect.objectContaining({ theme }), {})
  })

  test('expect rendering Themed uses dark theme when reqeusted', () => {
    mocked(useMediaQuery).mockReturnValueOnce(true)
    render(<Themed>{children}</Themed>)

    expect(mocked(createTheme)).toHaveBeenCalledWith({
      palette: {
        background: {
          default: '#121212',
          paper: '#121212',
        },
        mode: 'dark',
      },
    })
    expect(mocked(ThemeProvider)).toHaveBeenCalledWith(expect.objectContaining({ theme }), {})
  })
})
