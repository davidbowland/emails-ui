import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import ConfirmDialog from './index'

describe('ConfirmDialog component', () => {
  const onCancel = jest.fn()
  const onConfirm = jest.fn()

  it('should render title and children when open', () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </ConfirmDialog>,
    )

    expect(screen.getByText(/Delete item\?/i)).toBeVisible()
    expect(screen.getByText(/Are you sure\?/i)).toBeVisible()
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </ConfirmDialog>,
    )

    fireEvent.click(screen.getByText(/Cancel/i, { selector: 'button' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmDialog onCancel={onCancel} onConfirm={onConfirm} open={true} title="Delete item?">
        Are you sure?
      </ConfirmDialog>,
    )

    fireEvent.click(screen.getByText(/Confirm/i, { selector: 'button' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should use custom button labels when provided', () => {
    render(
      <ConfirmDialog
        cancelLabel="Go back"
        confirmLabel="Continue"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open={true}
        title="Delete item?"
      >
        Are you sure?
      </ConfirmDialog>,
    )

    expect(screen.getByText(/Go back/i, { selector: 'button' })).toBeVisible()
    expect(screen.getByText(/Continue/i, { selector: 'button' })).toBeVisible()
  })
})
