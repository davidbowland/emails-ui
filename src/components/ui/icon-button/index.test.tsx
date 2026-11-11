import React from 'react'

import IconButton from './index'
import { CloseIcon, TrashIcon } from '@components/ui/icons'
import Spinner from '@components/ui/spinner'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('@components/ui/spinner')

describe('IconButton component', () => {
  const onClick = jest.fn()

  beforeAll(() => {
    jest.mocked(Spinner).mockReturnValue(<span data-testid="spinner" />)
  })

  it('should be named by its label, not its icon', () => {
    render(<IconButton icon={TrashIcon} label="Delete email" />)

    expect(screen.getByRole('button', { name: 'Delete email' })).toContainElement(screen.getByTestId('icon-Trash2'))
  })

  it('should draw its icon at the given size', () => {
    render(<IconButton icon={TrashIcon} label="Delete email" size={12} />)

    expect(screen.getByTestId('icon-Trash2')).toHaveAttribute('size', '12')
  })

  it('should call onClick when pressed', async () => {
    render(<IconButton icon={TrashIcon} label="Delete email" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete email' }))
    await userEvent.keyboard('{Enter}')

    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it.each(['toolbar', 'shell', 'close', 'chip-remove'] as const)('should render the %s variant', (variant) => {
    render(<IconButton icon={CloseIcon} label="Close" variant={variant} />)

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('should show a spinner at its icon size while busy and ignore presses', async () => {
    render(<IconButton busy icon={TrashIcon} label="Delete email" onClick={onClick} size={14} variant="shell" />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(screen.getByRole('button', { name: 'Delete email' }))

    expect(screen.getByRole('button', { name: 'Delete email' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Delete email' })).toContainElement(screen.getByTestId('spinner'))
    expect(jest.mocked(Spinner)).toHaveBeenCalledWith({ size: 14, surface: 'shell' }, undefined)
    expect(onClick).not.toHaveBeenCalled()
  })

  it.each([
    [15, 14],
    [17, 16],
  ] as const)('should draw its icon at %i, and a %i spinner while busy at that size', (size, spinnerSize) => {
    const { rerender } = render(<IconButton icon={TrashIcon} label="Delete email" size={size} />)

    expect(screen.getByTestId('icon-Trash2')).toHaveAttribute('size', String(size))
    rerender(<IconButton busy icon={TrashIcon} label="Delete email" size={size} />)
    expect(jest.mocked(Spinner)).toHaveBeenCalledWith({ size: spinnerSize, surface: 'paper' }, undefined)
  })

  it('should draw a paper spinner off the shell', () => {
    render(<IconButton busy icon={TrashIcon} label="Delete email" variant="chip-remove" />)

    expect(jest.mocked(Spinner)).toHaveBeenCalledWith({ size: 16, surface: 'paper' }, undefined)
  })

  it('should show the reason instead of calling onClick while unavailable', async () => {
    render(
      <IconButton
        icon={TrashIcon}
        label="Remove spam.example"
        onClick={onClick}
        unavailableReason="Wait until your changes finish saving."
        variant="chip-remove"
      />,
    )

    const button = screen.getByRole('button', { name: 'Remove spam.example' })
    expect(button).toHaveAccessibleDescription('Wait until your changes finish saving.')

    await userEvent.click(button)

    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Wait until your changes finish saving.')

    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('should forward passthrough attributes and its ref', async () => {
    const onMouseEnter = jest.fn()
    const ref = React.createRef<HTMLButtonElement>()
    render(
      <IconButton
        data-testid="CancelIcon"
        icon={CloseIcon}
        label="Remove spam.example"
        onMouseEnter={onMouseEnter}
        ref={ref}
        title="Remove"
      />,
    )

    await userEvent.hover(screen.getByTestId('CancelIcon'))

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Remove spam.example' }))
    expect(screen.getByTestId('CancelIcon')).toBe(ref.current)
    expect(onMouseEnter).toHaveBeenCalledTimes(1)
  })

  it('should require a label and have no disabled prop', () => {
    render(
      <>
        {/* @ts-expect-error -- label is required */}
        <IconButton icon={TrashIcon} />
        {/* @ts-expect-error -- IconButton has no disabled prop (spec G4) */}
        <IconButton disabled icon={TrashIcon} label="Delete email" onClick={onClick} />
      </>,
    )

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('should never be natively disabled, even when disabled is forced past the types', async () => {
    render(<IconButton {...({ disabled: true } as object)} icon={TrashIcon} label="Delete email" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete email' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
