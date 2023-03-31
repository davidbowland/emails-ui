import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { mocked } from 'jest-mock'
import React from 'react'

import PrivacyLink from '@components/privacy-link'
import ServerErrorMessage from './index'

jest.mock('@components/privacy-link')

describe('Server error message component', () => {
  const title = 'server-error-message'
  const children = 'Nothing to see here'

  beforeAll(() => {
    mocked(PrivacyLink).mockReturnValue(<></>)
  })

  test('expect rendering ServerErrorMessage has title in output', () => {
    render(<ServerErrorMessage title={title}> </ServerErrorMessage>)

    expect(screen.getByText(title)).toBeInTheDocument()
  })

  test('expect rendering ServerErrorMessage contains passed children in output', () => {
    render(<ServerErrorMessage title={title}>{children}</ServerErrorMessage>)

    expect(screen.getByText(children, { exact: false })).toBeInTheDocument()
  })

  test('expect rendering ServerErrorMessage has link to home', () => {
    render(<ServerErrorMessage title={title}> </ServerErrorMessage>)

    const anchors = screen.getAllByRole('link') as HTMLAnchorElement[]
    expect(anchors.filter((link) => new URL(link.href).pathname === '/').length).toBe(1)
  })

  test('expect rendering ServerErrorMessage has privacy link', () => {
    render(<ServerErrorMessage title={title}> </ServerErrorMessage>)

    expect(mocked(PrivacyLink)).toHaveBeenCalledTimes(1)
  })
})
