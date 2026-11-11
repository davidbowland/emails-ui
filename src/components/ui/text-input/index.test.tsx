import React from 'react'

import TextInput from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('TextInput component', () => {
  it('should forward its ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<TextInput aria-label="Name" ref={ref} />)

    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Name' }))
  })

  it('should accept typing and report each change', async () => {
    const onChange = jest.fn()
    render(<TextInput aria-label="Name" onChange={onChange} />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada')

    expect(onChange).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada')
  })

  it('should ignore typing while read-only and keep its value', async () => {
    const onChange = jest.fn()
    render(<TextInput aria-label="Name" defaultValue="Ada" onChange={onChange} readOnly />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'xyz')

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada')
  })

  it('should stay focusable while read-only', async () => {
    render(<TextInput aria-label="Name" readOnly />)

    await userEvent.tab()

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
  })

  it('should expose its description and invalid state', () => {
    render(
      <>
        <p id="help">Shown on your emails</p>
        <TextInput aria-label="Name" describedBy="help" invalid />
      </>,
    )

    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input).toHaveAccessibleDescription('Shown on your emails')
    expect(input).toBeInvalid()
  })

  it('should accept typing in the bare variant, but not while read-only', async () => {
    const onChange = jest.fn()
    const { rerender } = render(<TextInput aria-label="Subject" onChange={onChange} variant="bare" />)

    await userEvent.type(screen.getByRole('textbox', { name: 'Subject' }), 'Hi')
    expect(screen.getByRole('textbox', { name: 'Subject' })).toHaveValue('Hi')

    rerender(<TextInput aria-label="Subject" onChange={onChange} readOnly variant="bare" />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Subject' }), 'xyz')
    expect(screen.getByRole('textbox', { name: 'Subject' })).toHaveValue('Hi')
  })
})
