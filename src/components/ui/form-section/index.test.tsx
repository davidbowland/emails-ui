import React from 'react'

import FormSection from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('FormSection component', () => {
  it('should label the section by its heading', () => {
    render(
      <FormSection heading="Spam filter" headingId="spam">
        <p>Body</p>
      </FormSection>,
    )

    expect(screen.getByRole('region', { name: 'Spam filter' })).toHaveTextContent('Body')
  })

  it('should show "Not saved yet" for the unsaved status', () => {
    render(<FormSection heading="Spam filter" headingId="spam" status="unsaved" />)

    expect(screen.getByText('Not saved yet')).toBeVisible()
  })

  it('should show "Saves automatically" for the auto status', () => {
    render(<FormSection heading="Notifications" headingId="notes" status="auto" />)

    expect(screen.getByText('Saves automatically')).toBeVisible()
  })

  it('should show no tag without a status', () => {
    render(<FormSection heading="Spam filter" headingId="spam" />)

    expect(screen.queryByText('Not saved yet')).toBeNull()
    expect(screen.queryByText('Saves automatically')).toBeNull()
  })

  it('should make the heading focusable by script', () => {
    render(<FormSection heading="Spam filter" headingId="spam" />)

    screen.getByRole('heading').focus()

    expect(screen.getByRole('heading')).toHaveFocus()
  })
})
