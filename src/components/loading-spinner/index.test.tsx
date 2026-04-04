import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import LoadingSpinner from './index'

describe('LoadingSpinner component', () => {
  it('should render a spinner', () => {
    render(<LoadingSpinner />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
