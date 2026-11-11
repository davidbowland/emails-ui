import React from 'react'

import { IconProps, IconSize } from '@components/ui/icons'

export type BadgeTone = 'neutral' | 'accent'
export type BadgeSurface = 'shell' | 'paper'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  children: React.ReactNode
  // A leading icon from the icon library, drawn at the size's icon size beside the 10px text.
  icon?: React.ComponentType<IconProps>
  // 'sm' fits a mailbox row; 'md' gives the email viewer's subject line a roomier pill.
  size?: BadgeSize
  // What the badge sits on. The accent tone needs different colors on the dark shell and on paper.
  surface?: BadgeSurface
  tone?: BadgeTone
}

export const BADGE_STYLES: Record<BadgeSurface, Record<BadgeTone, React.CSSProperties>> = {
  shell: {
    // For the dark shell surface, where the badge is used (mailbox rows); contrast.test.ts holds it to AA there.
    accent: {
      background: 'var(--accent-subtle)',
      border: '1px solid var(--accent-border)',
      color: 'var(--accent-hover)',
    },
    neutral: {
      background: 'var(--paper-surface)',
      border: '1px solid var(--paper-border)',
      color: 'var(--text-paper-muted)',
    },
  },
  paper: {
    // --accent-deep over an opaque --paper-surface fill, not the --accent-subtle tint: on paper that
    // tint pulls every violet token under 4.5:1. The violet border keeps the accent look.
    accent: {
      background: 'var(--paper-surface)',
      border: '1px solid var(--accent-border)',
      color: 'var(--accent-deep)',
    },
    neutral: {
      background: 'var(--paper-surface)',
      border: '1px solid var(--paper-border)',
      color: 'var(--text-paper-muted)',
    },
  },
}

const BADGE_SIZES: Record<BadgeSize, { box: React.CSSProperties; iconSize: IconSize }> = {
  md: { box: { borderRadius: '8px', gap: '4px', padding: '3px 8px' }, iconSize: 10 },
  sm: { box: { borderRadius: '6px', gap: '3px', padding: '2px 6px' }, iconSize: 9 },
}

// A small status pill, such as "Bounced" on a mailbox row.
const Badge = ({
  children,
  icon: Icon,
  size = 'sm',
  surface = 'shell',
  tone = 'neutral',
}: BadgeProps): React.ReactNode => (
  <span
    style={{
      alignItems: 'center',
      display: 'inline-flex',
      flexShrink: 0,
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: '10px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      ...BADGE_SIZES[size].box,
      ...BADGE_STYLES[surface][tone],
    }}
  >
    {Icon && <Icon size={BADGE_SIZES[size].iconSize} />}
    {children}
  </span>
)

export default Badge
