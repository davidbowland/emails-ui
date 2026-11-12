import React from 'react'

import IconButton from '@components/ui/icon-button'
import { CloseIcon, PlusIcon } from '@components/ui/icons'

export interface ChipProps {
  // Marks a chip added but not yet saved: an accent border, a plus icon and a screen-reader suffix.
  isNew?: boolean
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

const Chip = ({ isNew, label, onRemove, removeLabel, removeUnavailableReason }: ChipProps): React.ReactNode => (
  <span
    className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs"
    style={{
      background: isNew ? 'var(--accent-subtle)' : 'var(--paper-surface)',
      border: `1px solid ${isNew ? 'var(--accent-deep)' : 'var(--paper-border)'}`,
      color: isNew ? 'var(--text-paper)' : 'var(--text-paper-muted)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}
    title={label}
  >
    {isNew && <PlusIcon size={10} />}
    {/* A long label wraps anywhere rather than truncating, so a phone shows all of it. */}
    <span className="min-w-0" style={{ overflowWrap: 'anywhere' }}>
      {label}
      {isNew && <span className="sr-only"> (not saved yet)</span>}
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
