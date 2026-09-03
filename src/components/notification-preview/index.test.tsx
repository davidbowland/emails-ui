import React from 'react'

import NotificationPreviewFigure, { PREVIEW_LABELS } from './index'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

describe('NotificationPreviewFigure', () => {
  it('shows the sender and the subject at the most informative level', () => {
    render(<NotificationPreviewFigure preview="sender-and-subject" />)

    expect(screen.getByText('Sarah Smith')).toBeVisible()
    expect(screen.getByText('Lunch Thursday?')).toBeVisible()
  })

  it('shows the sender alone at the middle level', () => {
    render(<NotificationPreviewFigure preview="sender-only" />)

    expect(screen.getByText('Sarah Smith')).toBeVisible()
    expect(screen.getByText('sent you an email')).toBeVisible()
  })

  it('shows neither at the most private level', () => {
    render(<NotificationPreviewFigure preview="none" />)

    expect(screen.getByText('Emails')).toBeVisible()
    expect(screen.getByText('New email')).toBeVisible()
  })

  it('captions the figure with the level it is showing', () => {
    render(<NotificationPreviewFigure preview="sender-only" />)

    expect(screen.getByText(`Example — ${PREVIEW_LABELS['sender-only']}`)).toBeVisible()
  })

  it('names every level', () => {
    expect(PREVIEW_LABELS).toEqual({
      none: 'Neither',
      'sender-and-subject': 'Sender and subject',
      'sender-only': 'Sender only',
    })
  })
})
