import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import ErrorSnackbar from './index'

describe('ErrorSnackbar component', () => {
  const onClose = jest.fn()

  it('should render error message when message is provided', () => {
    render(<ErrorSnackbar message="Something went wrong" onClose={onClose} />)

    expect(screen.getByText(/Something went wrong/i)).toBeVisible()
  })

  it('should not render when message is undefined', () => {
    render(<ErrorSnackbar message={undefined} onClose={onClose} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(<ErrorSnackbar message="Something went wrong" onClose={onClose} />)

    const closeButton = screen.getByLabelText(/Close/i, { selector: 'button' }) as HTMLButtonElement
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
