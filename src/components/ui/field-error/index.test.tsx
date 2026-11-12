import React from 'react'

import FieldError from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('FieldError component', () => {
  it('should stay mounted as a status with no message', () => {
    render(<FieldError id="err" />)

    expect(screen.getByRole('status')).toHaveAttribute('id', 'err')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('should show the message', () => {
    render(<FieldError id="err" message="That address is already on your list." />)

    expect(screen.getByRole('status')).toHaveTextContent('That address is already on your list.')
  })
})
