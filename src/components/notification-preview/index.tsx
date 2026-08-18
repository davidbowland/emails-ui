import React from 'react'

import { NotificationPreview } from '@types'

export interface NotificationPreviewProps {
  preview: NotificationPreview
}

// The names the radios use. Exported so the settings screen and this figure can never drift.
export const PREVIEW_LABELS: Record<NotificationPreview, string> = {
  none: 'Neither',
  'sender-and-subject': 'Sender and subject',
  'sender-only': 'Sender only',
}

// The three rows the service worker actually draws (scripts/sw-src.js buildNotification), with
// one worked example rather than a description of one.
const EXAMPLES: Record<NotificationPreview, { body: string; title: string }> = {
  none: { body: 'New email', title: 'Emails' },
  'sender-and-subject': { body: 'Lunch Thursday?', title: 'Sarah Smith' },
  'sender-only': { body: 'sent you an email', title: 'Sarah Smith' },
}

const NotificationPreviewFigure = ({ preview }: NotificationPreviewProps): React.ReactNode => {
  const example = EXAMPLES[preview]
  return (
    <figure style={{ margin: '12px 0 0' }}>
      <div
        style={{
          alignItems: 'center',
          background: 'var(--paper-surface)',
          border: '1px solid var(--paper-border)',
          borderRadius: '12px',
          display: 'flex',
          gap: '12px',
          padding: '12px 14px',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            alignItems: 'center',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            borderRadius: '9px',
            color: 'var(--accent)',
            display: 'flex',
            flexShrink: 0,
            fontFamily: 'Libre Baskerville, serif',
            fontSize: '13px',
            fontWeight: 700,
            height: '30px',
            justifyContent: 'center',
            width: '30px',
          }}
        >
          E
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              color: 'var(--text-paper)',
              display: 'block',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {example.title}
          </span>
          <span
            style={{
              color: 'var(--text-paper-muted)',
              display: 'block',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '13px',
            }}
          >
            {example.body}
          </span>
        </span>
      </div>
      <figcaption
        style={{
          color: 'var(--text-paper-muted)',
          fontFamily: 'Outfit, sans-serif',
          fontSize: '12px',
          marginTop: '6px',
        }}
      >
        Example — {PREVIEW_LABELS[preview]}
      </figcaption>
    </figure>
  )
}

export default NotificationPreviewFigure
