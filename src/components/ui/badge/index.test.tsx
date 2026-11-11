import React from 'react'

import Badge from './index'
import { AlertCircleIcon } from '@components/ui/icons'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('Badge component', () => {
  it('should show its text', () => {
    render(<Badge>Bounced</Badge>)

    expect(screen.getByText('Bounced')).toBeVisible()
  })

  it('should draw a decorative icon beside the text', () => {
    render(
      <Badge icon={AlertCircleIcon} tone="accent">
        Bounced
      </Badge>,
    )

    expect(screen.getByTestId('icon-AlertCircle')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it.each(['shell', 'paper'] as const)('should show its text on the %s surface', (surface) => {
    render(
      <Badge surface={surface} tone="accent">
        Bounced
      </Badge>,
    )

    expect(screen.getByText('Bounced')).toBeVisible()
  })

  it('should draw its icon at the larger size too', () => {
    render(
      <Badge icon={AlertCircleIcon} size="md" surface="paper" tone="accent">
        Bounced
      </Badge>,
    )

    expect(screen.getByText('Bounced')).toBeVisible()
    expect(screen.getByTestId('icon-AlertCircle')).toHaveAttribute('aria-hidden', 'true')
  })

  it('should draw no icon without one', () => {
    render(<Badge>Bounced</Badge>)

    expect(screen.queryByTestId('icon-AlertCircle')).not.toBeInTheDocument()
  })
})
