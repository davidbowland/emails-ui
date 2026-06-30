import { Save } from 'lucide-react'
import React from 'react'

export const SettingsCard = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div
    style={{
      height: '100%',
      width: '100%',
      overflowY: 'auto',
      background: 'var(--paper-bg)',
      color: 'var(--text-paper)',
    }}
  >
    {children}
  </div>
)

export const SettingsTitle = (): React.ReactNode => (
  <div style={{ marginBottom: '4px' }}>
    {/* Eyebrow */}
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        background: 'var(--accent-subtle)',
        border: '1px solid var(--accent-border)',
        marginBottom: '10px',
      }}
    >
      <span
        style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: 'var(--accent)',
        }}
      >
        Preferences
      </span>
    </div>
    <h1
      className="font-display"
      style={{
        color: 'var(--text-paper)',
        fontWeight: 400,
        fontSize: '26px',
        letterSpacing: '-0.025em',
        margin: 0,
        lineHeight: 1.2,
      }}
    >
      Account Settings
    </h1>
  </div>
)

export const SettingsDivider = (): React.ReactNode => (
  <div style={{ height: '1px', background: 'var(--paper-border)', opacity: 0.7 }} />
)

export const SaveButton = ({
  disabled,
  isSaving,
  onClick,
}: {
  disabled: boolean
  isSaving: boolean
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
      }}
    >
      {isSaving ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            animation: 'spin 0.8s linear infinite',
            display: 'block',
          }}
        />
      ) : (
        <Save size={12} strokeWidth={2} />
      )}
    </div>
    Save
  </button>
)
