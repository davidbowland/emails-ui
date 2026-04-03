import { Spinner } from '@heroui/react'
import { Send, Trash2 } from 'lucide-react'
import React from 'react'

export const ComposeDivider = (): React.ReactNode => (
  <div style={{ height: '1px', background: 'var(--paper-border)' }} />
)

export const SendButton = ({
  disabled,
  isSubmitting,
  onClick,
}: {
  disabled: boolean
  isSubmitting: boolean
  onClick: () => void
}): React.ReactNode => (
  <button
    className="btn-accent flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-all"
    disabled={disabled}
    onClick={onClick}
    style={{
      fontFamily: 'Outfit, sans-serif',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {isSubmitting ? <Spinner size="sm" /> : <Send size={14} />}
    Send
  </button>
)

export const DiscardButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }): React.ReactNode => (
  <button
    className="btn-ghost-paper flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
    disabled={disabled}
    onClick={onClick}
    style={{
      fontFamily: 'Outfit, sans-serif',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    <Trash2 size={14} />
    Discard
  </button>
)
