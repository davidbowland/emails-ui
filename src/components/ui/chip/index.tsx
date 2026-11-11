import React from 'react'

import IconButton from '@components/ui/icon-button'
import { CloseIcon } from '@components/ui/icons'

export interface ChipProps {
  label: string
  // Omit for a chip that can't be removed: no remove control renders.
  onRemove?: () => void
  // The remove control's accessible name. Defaults to "Remove <label>".
  removeLabel?: string
  // While set, a press on the remove control shows this reason instead of calling onRemove.
  removeUnavailableReason?: string
}

// The 12px icon sits in a 24x24 target; the negative margin keeps the chip its visual size.
const REMOVE_STYLE: React.CSSProperties = { margin: '-6px' }

const Chip = ({ label, onRemove, removeLabel, removeUnavailableReason }: ChipProps): React.ReactNode => (
  <span
    className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs"
    style={{
      background: 'var(--paper-surface)',
      border: '1px solid var(--paper-border)',
      color: 'var(--text-paper-muted)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}
    title={label}
  >
    {/* A long label wraps anywhere rather than truncating, so a phone shows all of it. */}
    <span className="min-w-0" style={{ overflowWrap: 'anywhere' }}>
      {label}
    </span>
    {onRemove && (
      <IconButton
        className="shrink-0 rounded-full"
        // Callers' tests find the remove control by this id, as they did before the library.
        data-testid="CancelIcon"
        icon={CloseIcon}
        label={removeLabel ?? `Remove ${label}`}
        onClick={onRemove}
        size={12}
        style={REMOVE_STYLE}
        unavailableReason={removeUnavailableReason}
        variant="chip-remove"
      />
    )}
  </span>
)

export default Chip
