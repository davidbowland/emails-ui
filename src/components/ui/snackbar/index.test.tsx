import React from 'react'

import Snackbar from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Snackbar component', () => {
  const onClose = jest.fn()

  it('should render error message when message is provided', () => {
    render(<Snackbar message="Something went wrong" onClose={onClose} />)

    expect(screen.getByText(/Something went wrong/i)).toBeVisible()
  })

  it('should not render when message is undefined', () => {
    render(<Snackbar message={undefined} onClose={onClose} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    render(<Snackbar message="Something went wrong" onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should show a long message in full alongside the close button', () => {
    const longMessage = "We couldn't save those changes. Your picks are still here — try again."
    render(<Snackbar message={longMessage} onClose={onClose} />)

    expect(screen.getByRole('alert')).toHaveTextContent(longMessage)
    expect(screen.getByRole('button', { name: 'Close' })).toBeVisible()
  })

  it('should show an icon, not a text glyph, on the close button', () => {
    render(<Snackbar message="Something went wrong" onClose={onClose} />)

    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveTextContent('✕')
    expect(screen.getByTestId('icon-X')).toBeInTheDocument()
  })
})
