import React from 'react'

import Button from '@components/ui/button'
import IconButton from '@components/ui/icon-button'
import { CloseIcon } from '@components/ui/icons'

export interface NoticeCardProps {
  actions?: React.ReactNode
  children: React.ReactNode
  onDismiss: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void
  sectionRef: React.Ref<HTMLElement>
}

// A paper card with an accent border. It takes focus programmatically (tabIndex -1), so its ring
// is drawn here: the global :focus-visible rule skips tabindex="-1". No aria-label: the status
// text inside names it.
export const NoticeCard = ({
  actions,
  children,
  onDismiss,
  onKeyDown,
  sectionRef,
}: NoticeCardProps): React.ReactNode => (
  <section
    className="animate-fade-slide-up rounded-[10px] px-3.5 py-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    onKeyDown={onKeyDown}
    ref={sectionRef}
    style={{
      background: 'var(--paper-surface)',
      border: '1px solid var(--accent-border)',
      color: 'var(--text-paper)',
      fontFamily: 'Outfit, sans-serif',
      lineHeight: '20px',
    }}
    tabIndex={-1}
  >
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
        style={{ background: 'var(--accent)' }}
      />
      <div className="min-w-0 flex-1">
        {children}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
      <IconButton
        className="-mr-1 -mt-0.5 h-6 w-6 flex-shrink-0 rounded-md"
        icon={CloseIcon}
        label="Dismiss"
        onClick={onDismiss}
        size={14}
        variant="close"
      />
    </div>
  </section>
)

export interface NoticeButtonProps {
  // Spinner in place, presses ignored, and kept in the Tab order so focus is not dropped.
  busy?: boolean
  children: string
  describedBy?: string
  onClick: () => void
  // A press shows this instead of calling onClick.
  unavailableReason?: string
  variant: 'accent' | 'ghost'
}

// 32px tall. Long labels (a long domain) truncate, with the full text in the title.
export const NoticeButton = ({
  busy = false,
  children,
  describedBy,
  onClick,
  unavailableReason,
  variant,
}: NoticeButtonProps): React.ReactNode => (
  <Button
    aria-describedby={describedBy}
    busy={busy}
    // The ready label stays laid out under "Saving…", so a busy button keeps its width.
    busyLabel="Saving…"
    className="h-8 max-w-full px-3 text-xs font-medium"
    onClick={onClick}
    title={children}
    unavailableReason={unavailableReason}
    variant={variant === 'accent' ? 'primary' : 'secondary'}
  >
    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
  </Button>
)

export const Lead = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <p style={{ fontWeight: 600 }}>{children}</p>
)

export const Line = ({ children, id }: { children: React.ReactNode; id?: string }): React.ReactNode => (
  <p className="mt-0.5" id={id} style={{ overflowWrap: 'anywhere' }}>
    {children}
  </p>
)

export const Info = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <p
    className="mt-0.5 text-xs"
    style={{ color: 'var(--text-paper-muted)', lineHeight: '16px', overflowWrap: 'anywhere' }}
  >
    {children}
  </p>
)

export const Mono = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <span className="font-mono" style={{ fontSize: '13px' }}>
    {children}
  </span>
)
