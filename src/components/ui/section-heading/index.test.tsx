import React from 'react'

import SectionHeading from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('SectionHeading component', () => {
  it('should render an h2 with its id by default', () => {
    render(<SectionHeading id="spam">Spam filter</SectionHeading>)

    const heading = screen.getByRole('heading', { level: 2, name: 'Spam filter' })
    expect(heading).toHaveAttribute('id', 'spam')
  })

  it('should render an h3 when asked', () => {
    render(<SectionHeading as="h3">What changes</SectionHeading>)

    expect(screen.getByRole('heading', { level: 3, name: 'What changes' })).toBeVisible()
  })

  it('should render the smaller, strong heading by its name', () => {
    render(
      <SectionHeading as="h3" size={11} tone="strong">
        What changes
      </SectionHeading>,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'What changes' })).toBeVisible()
  })

  it('should render plain text with no heading role for div', () => {
    render(
      <SectionHeading as="div" surface="shell">
        New Message
      </SectionHeading>,
    )

    expect(screen.getByText('New Message')).toBeVisible()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('should make the heading focusable by script when tabIndex is set', () => {
    render(<SectionHeading tabIndex={-1}>Spam filter</SectionHeading>)

    screen.getByRole('heading', { name: 'Spam filter' }).focus()

    expect(screen.getByRole('heading', { name: 'Spam filter' })).toHaveFocus()
  })
})
