import { Save } from 'lucide-react'
import React from 'react'

export const SettingsCard = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="h-full w-full overflow-y-auto" style={{ background: 'var(--paper-bg)', color: 'var(--text-paper)' }}>
    {children}
  </div>
)

export const SettingsTitle = (): React.ReactNode => (
  <h1 className="font-display text-2xl" style={{ color: 'var(--text-paper)', fontWeight: 400 }}>
    Account Settings
  </h1>
)

export const SettingsDivider = (): React.ReactNode => (
  <div style={{ height: '1px', background: 'var(--paper-border)' }} />
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
    className="btn-accent flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-all"
    disabled={disabled}
    onClick={onClick}
    style={{
      fontFamily: 'Outfit, sans-serif',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {isSaving ? (
      <span
        className="h-3.5 w-3.5 animate-spin rounded-full"
        style={{ border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
      />
    ) : (
      <Save size={14} />
    )}
    Save
  </button>
)
