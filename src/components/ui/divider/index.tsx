import React from 'react'

export interface DividerProps {
  // How strongly the rule shows: 1 is the full border color, lower values fade it.
  opacity?: number
  surface?: 'paper' | 'shell'
}

const SURFACE_COLORS = { paper: 'var(--paper-border)', shell: 'var(--shell-border)' } as const

const Divider = ({ opacity = 1, surface = 'paper' }: DividerProps): React.ReactNode => (
  <div style={{ height: '1px', background: SURFACE_COLORS[surface], opacity }} />
)

export default Divider
