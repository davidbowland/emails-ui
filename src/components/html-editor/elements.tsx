import React from 'react'

export const ToolbarButton = ({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}): React.ReactNode => (
  <button aria-label={label} className="btn-toolbar rounded p-1.5 transition-colors" onClick={onClick} title={label}>
    {children}
  </button>
)

export const ToolbarDivider = (): React.ReactNode => (
  <span className="mx-1 inline-block h-5 w-px align-middle" style={{ background: 'var(--paper-border)' }} />
)
