import { Check, Save } from 'lucide-react'
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

// 'saved' is the resting state: everything on screen is what the server holds. A disabled control
// has to say why it is disabled, so the state is the label rather than a hint beside it -- a screen
// reader skips the hint on a disabled button.
export type SaveState = 'saved' | 'saving' | 'unsaved'

export const saveState = (hasUnsavedChanges: boolean, isSaving: boolean): SaveState => {
  if (isSaving) {
    return 'saving'
  }
  return hasUnsavedChanges ? 'unsaved' : 'saved'
}

const SAVE_LABELS: Record<SaveState, string> = {
  saved: 'Saved',
  saving: 'Saving…',
  unsaved: 'Save',
}

// .btn-accent:disabled is painted for the dark shell, where it lands at 1.9:1 on linen -- fine for
// the rare disabled button, wrong for one that sits disabled most of the time. 'saved' therefore
// gets a paper treatment that stays legible (5.6:1), and 'saving' keeps the accent it was pressed
// in so one click does not restyle the button twice on its way to settling.
const ACCENT: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--accent-deep) 0%, var(--accent-deep-hover) 100%)',
  color: '#fff',
}

const SAVE_STYLES: Record<SaveState, React.CSSProperties> = {
  saved: {
    background: 'var(--paper-surface)',
    border: '1px solid var(--paper-border)',
    boxShadow: 'none',
    color: 'var(--text-paper-muted)',
  },
  saving: ACCENT,
  unsaved: ACCENT,
}

const BADGE_BACKGROUNDS: Record<SaveState, string> = {
  saved: 'rgba(28,26,23,0.06)',
  saving: 'rgba(255,255,255,0.15)',
  unsaved: 'rgba(255,255,255,0.15)',
}

const SaveIcon = ({ state }: { state: SaveState }): React.ReactNode => {
  if (state === 'saving') {
    return (
      <span
        style={{
          animation: 'spin 0.8s linear infinite',
          border: '1.5px solid rgba(255,255,255,0.3)',
          borderRadius: '50%',
          borderTopColor: '#fff',
          display: 'block',
          height: '12px',
          width: '12px',
        }}
      />
    )
  }
  return state === 'saved' ? <Check size={12} strokeWidth={2.5} /> : <Save size={12} strokeWidth={2} />
}

export const SaveButton = ({
  hasUnsavedChanges,
  isSaving,
  onClick,
}: {
  hasUnsavedChanges: boolean
  isSaving: boolean
  onClick: () => void
}): React.ReactNode => {
  const state = saveState(hasUnsavedChanges, isSaving)
  const pressable = state === 'unsaved'

  // aria-disabled, not disabled: a disabled button leaves the tab order the moment the save lands,
  // dropping focus to the body, so a keyboard reader's next Tab restarts at the top of the page.
  // The press is refused here instead. The label says which state refused it.
  const handleClick = (): void => {
    if (pressable) {
      onClick()
    }
  }

  return (
    <button
      aria-disabled={!pressable}
      className="btn-accent"
      onClick={handleClick}
      style={{
        alignItems: 'center',
        cursor: pressable ? 'pointer' : 'not-allowed',
        display: 'flex',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        gap: '8px',
        letterSpacing: '0.01em',
        padding: '9px 20px',
        ...SAVE_STYLES[state],
      }}
      type="button"
    >
      {/* Button-in-button icon */}
      <div
        style={{
          alignItems: 'center',
          background: BADGE_BACKGROUNDS[state],
          borderRadius: '7px',
          display: 'flex',
          flexShrink: 0,
          height: '24px',
          justifyContent: 'center',
          width: '24px',
        }}
      >
        <SaveIcon state={state} />
      </div>
      {SAVE_LABELS[state]}
    </button>
  )
}
