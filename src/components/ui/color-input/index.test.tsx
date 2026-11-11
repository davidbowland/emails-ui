import React from 'react'

import ColorInput from './index'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

describe('ColorInput component', () => {
  it('should be named by its label and show its value', () => {
    render(<ColorInput label="Text color" onChange={jest.fn()} value="#ff0000" />)

    expect(screen.getByLabelText('Text color')).toHaveValue('#ff0000')
  })

  it('should report the new color', () => {
    const onChange = jest.fn()
    render(<ColorInput label="Text color" onChange={onChange} value="#ff0000" />)

    // userEvent cannot drive a native color picker; a change event is the only way in.
    fireEvent.change(screen.getByLabelText('Text color'), { target: { value: '#00ff00' } })

    expect(onChange).toHaveBeenCalledWith('#00ff00')
  })

  it('should pass its id and test id through', () => {
    render(<ColorInput data-testid="color-1" id="color-1" label="Text color" onChange={jest.fn()} value="#ff0000" />)

    expect(screen.getByTestId('color-1')).toHaveAttribute('id', 'color-1')
  })
})
