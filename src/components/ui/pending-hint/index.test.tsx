import React from 'react'

import PendingHint from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('PendingHint component', () => {
  it('should render its text with the given id', () => {
    const { container } = render(<PendingHint id="hint-1">Press Enter to add.</PendingHint>)

    expect(screen.getByText('Press Enter to add.')).toBeVisible()
    expect(container.querySelector('#hint-1')).toHaveTextContent('Press Enter to add.')
  })

  it('should hide its icon from the accessibility tree', () => {
    const { container } = render(<PendingHint id="hint-1">Press Enter to add.</PendingHint>)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
