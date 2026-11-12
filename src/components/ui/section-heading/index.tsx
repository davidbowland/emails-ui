import React from 'react'

export type SectionHeadingSurface = 'paper' | 'shell'
export type SectionHeadingTone = 'muted' | 'strong'

export interface SectionHeadingProps {
  as?: 'h2' | 'h3' | 'div'
  children: React.ReactNode
  id?: string
  // 12 is the Settings and compose eyebrow; 11 is the smaller label in the mailbox header and
  // install offer, which inherits its line height rather than taking text-xs's.
  size?: 11 | 12
  surface?: SectionHeadingSurface
  // Lets a script focus the heading (-1). The heading then also shows a keyboard focus ring.
  tabIndex?: number
  // 'strong' uses the surface's body text color instead of its muted one. On the shell both are
  // --text-primary, because --text-muted fails AA there.
  tone?: SectionHeadingTone
}

const COLORS: Record<SectionHeadingSurface, Record<SectionHeadingTone, string>> = {
  paper: { muted: 'var(--text-paper-muted)', strong: 'var(--text-paper)' },
  shell: { muted: 'var(--text-primary)', strong: 'var(--text-primary)' },
}

const SectionHeading = ({
  as: Tag = 'h2',
  children,
  id,
  size = 12,
  surface = 'paper',
  tabIndex,
  tone = 'muted',
}: SectionHeadingProps): React.ReactNode => (
  <Tag
    className={[
      size === 12 ? 'text-xs font-semibold uppercase' : 'font-semibold uppercase',
      tabIndex === undefined ? '' : 'focus-target',
    ]
      .filter(Boolean)
      .join(' ')}
    id={id}
    style={{
      color: COLORS[surface][tone],
      fontFamily: 'Outfit, sans-serif',
      letterSpacing: '0.1em',
      fontSize: size === 11 ? '11px' : undefined,
    }}
    tabIndex={tabIndex}
  >
    {children}
  </Tag>
)

export default SectionHeading
