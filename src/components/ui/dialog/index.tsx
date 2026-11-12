import React, { useEffect, useId, useRef } from 'react'

import Button from '@components/ui/button'

export interface DialogProps {
  cancelLabel?: string
  children: React.ReactNode
  confirmLabel?: string
  // The id of an element inside the dialog that describes it, read after the title.
  describedBy?: string
  // Replaces the Cancel/Confirm pair. The dialog still closes on Escape through onCancel.
  footer?: React.ReactNode
  onCancel: () => void
  // Only the default footer calls this, so a dialog with its own footer may leave it out.
  onConfirm?: () => void
  open: boolean
  // Where focus goes on close, instead of the element that had it when the dialog opened.
  returnFocusTo?: () => HTMLElement | null
  // For long content: the panel stops short of the viewport and the body scrolls between the
  // fixed title and footer.
  scrollable?: boolean
  title: string
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

const Dialog = ({
  cancelLabel = 'Cancel',
  children,
  confirmLabel = 'Confirm',
  describedBy,
  footer,
  onCancel,
  onConfirm,
  open,
  returnFocusTo,
  scrollable = false,
  title,
}: DialogProps): React.ReactNode => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const wasOpenRef = useRef(false)
  const titleId = useId()

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
      // Initial focus only: an aria-disabled button refuses the press, so landing on it would
      // leave the user on a dead control. It stays in the Tab order below.
      Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
        .find((element) => element.getAttribute('aria-disabled') !== 'true')
        ?.focus()
    } else if (wasOpenRef.current) {
      ;((returnFocusTo?.() ?? triggerRef.current) as HTMLElement | null)?.focus()
    }
    wasOpenRef.current = open
    // returnFocusTo is read only when the dialog closes; a new function identity must not refire it.
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        // A control inside already handled this Escape (an unavailable Button closing its reason
        // bubble), so the dialog stays open.
        if (event.defaultPrevented) return
        event.stopPropagation()
        onCancel()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  return (
    <div
      aria-describedby={describedBy}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      ref={dialogRef}
      role="dialog"
      style={open ? undefined : { display: 'none' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        onClick={onCancel}
        role="presentation"
        style={{ background: 'rgba(26, 24, 20, 0.7)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="animate-fade-in relative mx-4 flex w-full max-w-md flex-col rounded-xl p-6"
        style={{
          background: 'var(--paper-bg)',
          color: 'var(--text-paper)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--paper-border)',
          maxHeight: scrollable ? 'calc(100% - 32px)' : undefined,
        }}
      >
        <h2 className="mb-3 font-display text-lg" id={titleId} style={{ color: 'var(--text-paper)', fontWeight: 700 }}>
          {title}
        </h2>
        <div
          className="mb-6 text-sm leading-relaxed"
          style={{
            color: 'var(--text-paper-muted)',
            fontFamily: 'Outfit, sans-serif',
            ...(scrollable ? { flex: '1 1 auto', minHeight: 0, overflowY: 'auto' as const } : {}),
          }}
        >
          {children}
        </div>
        {footer ?? (
          <div className="flex justify-end gap-2">
            <Button
              className="rounded-md px-4 py-2 text-sm font-medium transition-all"
              onClick={onCancel}
              style={{ fontFamily: 'Outfit, sans-serif' }}
              variant="secondary"
            >
              {cancelLabel}
            </Button>
            <Button
              className="rounded-md px-4 py-2 text-sm font-medium transition-all"
              onClick={onConfirm}
              style={{ fontFamily: 'Outfit, sans-serif' }}
              variant="primary"
            >
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dialog
