import React, { createRef } from 'react'

import ChipInput from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('ChipInput component', () => {
  const onAdd = jest.fn()

  beforeAll(() => {
    onAdd.mockReturnValue(true)
  })

  it('should call onAdd on Enter and clear the box when accepted', async () => {
    render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)
    const input = screen.getByRole('textbox', { name: 'Email address' })

    await userEvent.type(input, 'alice@example.com{Enter}')

    expect(onAdd).toHaveBeenCalledWith('alice@example.com')
    expect(input).toHaveValue('')
  })

  it('should call onAdd on blur and clear the box when accepted', async () => {
    render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)
    const input = screen.getByRole('textbox', { name: 'Email address' })

    await userEvent.type(input, 'alice@example.com')
    await userEvent.tab()

    expect(onAdd).toHaveBeenCalledWith('alice@example.com')
    expect(input).toHaveValue('')
  })

  it('should keep the text when onAdd rejects it', async () => {
    onAdd.mockReturnValueOnce(false)
    render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)
    const input = screen.getByRole('textbox', { name: 'Email address' })

    await userEvent.type(input, 'not an address{Enter}')

    expect(onAdd).toHaveBeenCalledWith('not an address')
    expect(input).toHaveValue('not an address')
  })

  it('should not call onAdd for blank text', async () => {
    render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), '   {Enter}')

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('should not submit a surrounding form on Enter', async () => {
    const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />
      </form>,
    )

    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'alice@example.com{Enter}')

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should keep pending text and not commit it when leaving a read-only box', async () => {
    const { rerender } = render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)
    const input = screen.getByRole('textbox', { name: 'Email address' })
    await userEvent.type(input, 'alice@example.com')
    rerender(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" readOnly />)

    await userEvent.tab()

    expect(input).toHaveValue('alice@example.com')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('should keep pending text and not commit it on Enter while read-only', async () => {
    const { rerender } = render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)
    const input = screen.getByRole('textbox', { name: 'Email address' })
    await userEvent.type(input, 'alice@example.com')
    rerender(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" readOnly />)

    await userEvent.keyboard('{Enter}')

    expect(input).toHaveValue('alice@example.com')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it.each(['boxed', 'underline'] as const)('should take focus by Tab while read-only (%s)', async (variant) => {
    render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" readOnly variant={variant} />)

    await userEvent.tab()

    expect(screen.getByRole('textbox', { name: 'Email address' })).toHaveFocus()
  })

  it('should not commit pending text just by becoming writable again', async () => {
    const { rerender } = render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)
    const input = screen.getByRole('textbox', { name: 'Email address' })
    await userEvent.type(input, 'alice@example.com')
    rerender(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" readOnly />)

    rerender(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" />)

    expect(onAdd).not.toHaveBeenCalled()
    expect(input).toHaveValue('alice@example.com')
  })

  it('should expose the input through its ref', async () => {
    const ref = createRef<HTMLInputElement>()
    render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" ref={ref} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Email address' }), 'alice@example.com')

    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Email address' }))
    expect(ref.current?.value).toBe('alice@example.com')
  })

  it('should be named by a label through inputId', () => {
    render(
      <>
        <label htmlFor="blocked-senders">Blocked senders</label>
        <ChipInput inputId="blocked-senders" onAdd={onAdd} placeholder="sender@example.com" />
      </>,
    )

    expect(screen.getByRole('textbox', { name: 'Blocked senders' })).toBeInTheDocument()
  })

  it('should expose describedBy, invalid, placeholder and enterKeyHint', () => {
    render(
      <>
        <p id="rule-hint">One address or domain per entry.</p>
        <ChipInput
          ariaLabel="Blocked sender"
          describedBy="rule-hint"
          enterKeyHint="done"
          invalid
          onAdd={onAdd}
          placeholder="sender@example.com"
        />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Blocked sender' })

    expect(input).toHaveAccessibleDescription('One address or domain per entry.')
    expect(input).toBeInvalid()
    expect(input).toHaveAttribute('placeholder', 'sender@example.com')
    expect(input).toHaveAttribute('enterkeyhint', 'done')
  })

  it('should commit on Enter in the underline variant too', async () => {
    render(<ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" variant="underline" />)
    const input = screen.getByRole('textbox', { name: 'Email address' })

    await userEvent.type(input, 'alice@example.com{Enter}')

    expect(onAdd).toHaveBeenCalledWith('alice@example.com')
    expect(input).toHaveValue('')
  })

  it('should keep pending text when leaving a read-only box in the underline variant', async () => {
    const { rerender } = render(
      <ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" variant="underline" />,
    )
    const input = screen.getByRole('textbox', { name: 'Email address' })
    await userEvent.type(input, 'alice@example.com')
    rerender(
      <ChipInput ariaLabel="Email address" onAdd={onAdd} placeholder="Add address…" readOnly variant="underline" />,
    )

    await userEvent.tab()

    expect(input).toHaveValue('alice@example.com')
    expect(onAdd).not.toHaveBeenCalled()
  })
})
