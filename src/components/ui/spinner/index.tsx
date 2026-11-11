import React from 'react'

export type SpinnerSize = 12 | 14 | 16 | 20 | 24 | 40
export type SpinnerSurface = 'paper' | 'shell' | 'accent'

export interface SpinnerProps {
  label?: string
  size?: SpinnerSize
  surface?: SpinnerSurface
}

// The ring is the faint track; the arc is the part that reads as motion. AC6's contrast test holds
// each arc to 3:1 on its surface.
export const SPINNER_COLORS: Record<SpinnerSurface, { arc: string; ring: string }> = {
  accent: { arc: '#fff', ring: 'rgba(255,255,255,0.3)' },
  paper: { arc: 'var(--accent)', ring: 'var(--paper-border)' },
  shell: { arc: 'var(--accent)', ring: 'var(--shell-border)' },
}

const BORDER_WIDTHS: Record<SpinnerSize, number> = { 12: 1.5, 14: 1.5, 16: 2, 20: 2, 24: 2, 40: 3 }

// Drawn with borders, not an <svg>. It keeps turning under prefers-reduced-motion (index.css): a
// frozen spinner reads as a hang.
const Spinner = ({ label, size = 16, surface = 'paper' }: SpinnerProps): React.ReactNode => {
  const { arc, ring } = SPINNER_COLORS[surface]
  const accessibility = label ? { role: 'status' as const } : { 'aria-hidden': true as const }
  return (
    <span {...accessibility} className="inline-flex flex-shrink-0 items-center justify-center">
      <span
        className="block animate-spin rounded-full"
        style={{
          border: `${BORDER_WIDTHS[size]}px solid ${ring}`,
          borderTopColor: arc,
          height: `${size}px`,
          width: `${size}px`,
        }}
      />
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}

export default Spinner
