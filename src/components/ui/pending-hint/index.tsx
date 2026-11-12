import React from 'react'

import { CornerDownLeftIcon } from '@components/ui/icons'

export interface PendingHintProps {
  children: React.ReactNode
  id: string
}

// The line under a box that holds uncommitted text. It has no live region: the field points at it
// with aria-describedby.
const PendingHint = ({ children, id }: PendingHintProps): React.ReactNode => (
  <p className="flex items-center gap-1.5 text-sm" id={id} style={{ color: 'var(--text-paper)' }}>
    <span style={{ color: 'var(--accent-deep)', display: 'inline-flex' }}>
      <CornerDownLeftIcon size={12} />
    </span>
    {children}
  </p>
)

export default PendingHint
