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
    className="btn-accent"
    disabled={disabled}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '9px 20px',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '0.01em',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {/* Button-in-button icon */}
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '7px',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'transform 0.15s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {isSubmitting ? <Spinner size="sm" /> : <Send size={12} strokeWidth={2} />}
    </div>
    Send
  </button>
)

export const DiscardButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }): React.ReactNode => (
  <button
    className="btn-ghost-paper"
    disabled={disabled}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '9px 16px',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontWeight: 400,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    <Trash2 size={13} strokeWidth={1.5} />
    Discard
  </button>
)
