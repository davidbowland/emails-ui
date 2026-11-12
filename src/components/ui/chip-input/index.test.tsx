import React, { createRef, useState } from 'react'

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

  it('controlled: shows value and reports typing via onDraftChange', async () => {
    const onDraftChange = jest.fn()
    const Harness = (): React.ReactNode => {
      const [text, setText] = useState('')
      return (
        <ChipInput
          ariaLabel="Phrase"
          onAdd={onAdd}
          onDraftChange={(next) => {
            onDraftChange(next)
            setText(next)
          }}
          placeholder="Phrase"
          value={text}
        />
      )
    }
    render(<Harness />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Phrase' }), 'ab')

    expect(onDraftChange).toHaveBeenNthCalledWith(1, 'a')
    expect(onDraftChange).toHaveBeenNthCalledWith(2, 'ab')
  })

  it('returns focus to the box after Add, even when the Add button goes away', async () => {
    const Harness = (): React.ReactNode => {
      const [text, setText] = useState('abc')
      return (
        <ChipInput
          addLabel="Add block phrase"
          addOnBlur={false}
          ariaLabel="Phrase"
          onAdd={onAdd}
          onDraftChange={setText}
          placeholder="Phrase"
          value={text}
        />
      )
    }
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Add block phrase' }))

    expect(screen.queryByRole('button', { name: 'Add block phrase' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Phrase' })).toHaveFocus()
  })

  it('returns focus to the box after a refused Add', async () => {
    onAdd.mockReturnValueOnce(false)
    render(
      <ChipInput
        addLabel="Add block phrase"
        addOnBlur={false}
        ariaLabel="Phrase"
        onAdd={onAdd}
        onDraftChange={jest.fn()}
        placeholder="Phrase"
        value="abc"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add block phrase' }))

    expect(screen.getByRole('textbox', { name: 'Phrase' })).toHaveFocus()
  })

  it('controlled: shows the given value', () => {
    render(<ChipInput ariaLabel="Phrase" onAdd={onAdd} onDraftChange={jest.fn()} placeholder="Phrase" value="abc" />)

    expect(screen.getByRole('textbox', { name: 'Phrase' })).toHaveValue('abc')
  })

  it('addOnBlur false: leaving the box does not call onAdd', async () => {
    render(<ChipInput addOnBlur={false} ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" />)
    const input = screen.getByRole('textbox', { name: 'Phrase' })

    await userEvent.type(input, 'abc')
    await userEvent.tab()

    expect(onAdd).not.toHaveBeenCalled()
    expect(input).toHaveValue('abc')
  })

  it('addOnBlur false: Enter still adds', async () => {
    render(<ChipInput addOnBlur={false} ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Phrase' }), 'abc{Enter}')

    expect(onAdd).toHaveBeenCalledWith('abc')
  })

  it('addOnBlur default: leaving the box calls onAdd', async () => {
    render(<ChipInput ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Phrase' }), 'abc')
    await userEvent.tab()

    expect(onAdd).toHaveBeenCalledWith('abc')
  })

  it.each(['boxed', 'underline'] as const)('shows pending text with addOnBlur false (%s)', async (variant) => {
    render(<ChipInput addOnBlur={false} ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" variant={variant} />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Phrase' }), 'abc')

    expect(screen.getByRole('textbox', { name: 'Phrase' })).toHaveValue('abc')
  })

  it('addLabel: an Add button named by addLabel appears only while text is present', async () => {
    render(<ChipInput addLabel="Add block phrase" ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" />)

    expect(screen.queryByRole('button', { name: 'Add block phrase' })).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox', { name: 'Phrase' }), 'abc')

    expect(screen.getByRole('button', { name: 'Add block phrase' })).toBeInTheDocument()
  })

  it('Add button commits like Enter', async () => {
    const onDraftChange = jest.fn()
    render(
      <ChipInput
        addLabel="Add block phrase"
        addOnBlur={false}
        ariaLabel="Phrase"
        onAdd={onAdd}
        onDraftChange={onDraftChange}
        placeholder="Phrase"
        value="abc"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add block phrase' }))

    expect(onAdd).toHaveBeenCalledWith('abc')
    expect(onDraftChange).toHaveBeenCalledWith('')
  })

  it('clicking Add keeps focus in the box, so a phone keyboard stays open', async () => {
    const onBlur = jest.fn()
    render(<ChipInput addLabel="Add block phrase" ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" />)
    const input = screen.getByRole('textbox', { name: 'Phrase' })
    input.addEventListener('blur', onBlur)

    await userEvent.type(input, 'free lunch')
    await userEvent.click(screen.getByRole('button', { name: 'Add block phrase' }))

    expect(onAdd).toHaveBeenCalledWith('free lunch')
    expect(onBlur).not.toHaveBeenCalled()
    expect(input).toHaveFocus()
  })

  it('refused commit keeps the text', async () => {
    const onDraftChange = jest.fn()
    onAdd.mockReturnValueOnce(false)
    render(
      <ChipInput
        addLabel="Add block phrase"
        addOnBlur={false}
        ariaLabel="Phrase"
        onAdd={onAdd}
        onDraftChange={onDraftChange}
        placeholder="Phrase"
        value="abc"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add block phrase' }))

    expect(onAdd).toHaveBeenCalledWith('abc')
    expect(onDraftChange).not.toHaveBeenCalled()
  })

  it('read-only Add button explains why', async () => {
    render(
      <ChipInput
        addLabel="Add block phrase"
        ariaLabel="Phrase"
        onAdd={onAdd}
        placeholder="Phrase"
        readOnly
        readOnlyReason="Wait until Save finishes."
        value="abc"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Add block phrase' }))

    expect(screen.getAllByText('Wait until Save finishes.').length).toBeGreaterThan(0)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('no addLabel renders the bare input', () => {
    const { container } = render(<ChipInput ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" />)

    expect(container.firstChild).toBe(screen.getByRole('textbox', { name: 'Phrase' }))
  })

  it('keeps ref on the input when addLabel wraps it', () => {
    const ref = createRef<HTMLInputElement>()
    render(<ChipInput addLabel="Add" ariaLabel="Phrase" onAdd={onAdd} placeholder="Phrase" ref={ref} />)

    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Phrase' }))
  })
})
