import React from 'react'

import Spinner from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('Spinner component', () => {
  it('should be decorative without a label', () => {
    const { container } = render(
      <p>
        <Spinner />
      </p>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(container.querySelector('p')).toHaveTextContent('')
    // Its outermost element is hidden from the accessibility tree, taking the whole spinner with it.
    expect(container.querySelector('p')?.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('should be decorative on every surface and size', () => {
    render(
      <>
        <Spinner size={12} surface="accent" />
        <Spinner size={24} surface="shell" />
        <Spinner size={40} surface="paper" />
      </>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should announce its label as a status', () => {
    render(<Spinner label="Loading…" size={40} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  })
})
