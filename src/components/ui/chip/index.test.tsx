import React from 'react'

import Chip from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Chip component', () => {
  const onRemove = jest.fn()

  it('should show its label', () => {
    render(<Chip label="alice@example.com" />)

    expect(screen.getByText('alice@example.com')).toBeVisible()
  })

  it('should have no remove control without onRemove', () => {
    render(<Chip label="alice@example.com" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should call onRemove when the remove control is pressed', async () => {
    render(<Chip label="alice@example.com" onRemove={onRemove} />)

    await userEvent.click(screen.getByRole('button', { name: 'Remove alice@example.com' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('should keep the CancelIcon test id on the remove control', async () => {
    render(<Chip label="alice@example.com" onRemove={onRemove} />)

    await userEvent.click(screen.getByTestId('CancelIcon'))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('should name the remove control with removeLabel when given', () => {
    render(<Chip label="spam.example" onRemove={onRemove} removeLabel="Stop blocking spam.example" />)

    expect(screen.getByRole('button', { name: 'Stop blocking spam.example' })).toBeInTheDocument()
  })

  it('should draw the remove control as an icon, not a text glyph', () => {
    render(<Chip label="alice@example.com" onRemove={onRemove} />)

    expect(screen.getByRole('button', { name: 'Remove alice@example.com' })).not.toHaveTextContent('✕')
    expect(screen.getByTestId('icon-X')).toBeInTheDocument()
  })

  it('should show the reason instead of removing while removal is unavailable', async () => {
    render(
      <Chip
        label="alice@example.com"
        onRemove={onRemove}
        removeUnavailableReason="Wait until your changes finish saving."
      />,
    )
    const remove = screen.getByRole('button', { name: 'Remove alice@example.com' })
    expect(remove).toHaveAccessibleDescription('Wait until your changes finish saving.')

    await userEvent.click(remove)

    expect(onRemove).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Wait until your changes finish saving.')
  })

  it('should keep the remove control in the tab order while removal is unavailable', async () => {
    render(
      <Chip
        label="alice@example.com"
        onRemove={onRemove}
        removeUnavailableReason="Wait until your changes finish saving."
      />,
    )

    await userEvent.tab()

    expect(screen.getByRole('button', { name: 'Remove alice@example.com' })).toHaveFocus()
  })

  it('isNew adds "(not saved yet)" for screen readers', () => {
    render(<Chip isNew label="alice@example.com" />)

    expect(screen.getByText('(not saved yet)', { exact: false })).toBeInTheDocument()
  })

  it('has no "(not saved yet)" without isNew', () => {
    render(<Chip label="alice@example.com" />)

    expect(screen.queryByText('(not saved yet)', { exact: false })).not.toBeInTheDocument()
  })
})
