import { X } from 'lucide-react'
import React from 'react'

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
      <button
        aria-label="Dismiss"
        className="btn-close -mr-1 -mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md"
        onClick={onDismiss}
        type="button"
      >
        <X aria-hidden="true" size={14} strokeWidth={1.5} />
      </button>
    </div>
  </section>
)

export interface NoticeButtonProps {
  children: string
  describedBy?: string
  // Kept in the Tab order while busy (aria-disabled, not disabled) so focus is not dropped.
  disabled?: boolean
  onClick: () => void
  variant: 'accent' | 'ghost'
}

// 32px tall. Long labels (a long domain) truncate, with the full text in the title.
export const NoticeButton = ({
  children,
  describedBy,
  disabled = false,
  onClick,
  variant,
}: NoticeButtonProps): React.ReactNode => (
  <button
    aria-describedby={describedBy}
    aria-disabled={disabled || undefined}
    className={`${variant === 'accent' ? 'btn-accent' : 'btn-ghost-paper'} inline-flex h-8 max-w-full items-center px-3 text-xs font-medium`}
    onClick={disabled ? undefined : onClick}
    title={children}
    type="button"
  >
    <span className="overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
  </button>
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
  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-paper-muted)', lineHeight: '16px' }}>
    {children}
  </p>
)

export const Mono = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <span className="font-mono" style={{ fontSize: '13px' }}>
    {children}
  </span>
)
