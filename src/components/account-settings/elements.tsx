import React from 'react'

// Why a control in a section Save owns can't run while Save is busy. AccountSettings passes it to
// every such control as its readOnlyReason. Worded for the mail check too, when nothing is being
// written yet.
export const WAIT_FOR_SAVE_REASON = 'Wait until Save finishes.'

// The scroll container. The unsaved bar sticks to its bottom, so the bottom scroll padding, at
// least the bar's height, keeps a focused field or heading from scrolling in under the bar.
export const SettingsCard = ({
  children,
  scrollPaddingBottom,
}: {
  children: React.ReactNode
  scrollPaddingBottom: number
}): React.ReactNode => (
  <div
    style={{
      height: '100%',
      scrollPaddingBottom: `${scrollPaddingBottom}px`,
      width: '100%',
      overflowY: 'auto',
      background: 'var(--paper-bg)',
      color: 'var(--text-paper)',
    }}
  >
    {children}
  </div>
)

// The h1 takes focus when the saved or discarded bar leaves while focus was in it.
export const SettingsTitle = ({ ref }: { ref?: React.Ref<HTMLHeadingElement> }): React.ReactNode => (
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
      className="font-display focus-target"
      ref={ref}
      style={{
        color: 'var(--text-paper)',
        fontWeight: 400,
        fontSize: '26px',
        letterSpacing: '-0.025em',
        margin: 0,
        lineHeight: 1.2,
      }}
      tabIndex={-1}
    >
      Account settings
    </h1>
  </div>
)
