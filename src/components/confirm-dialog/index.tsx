import React from 'react'

export interface ConfirmDialogProps {
  cancelLabel?: string
  children: React.ReactNode
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
}

const ConfirmDialog = ({
  cancelLabel = 'Cancel',
  children,
  confirmLabel = 'Confirm',
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps): React.ReactNode => {
  return (
    <div
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      style={open ? undefined : { display: 'none' }}
    >
      <div
        className="absolute inset-0"
        onClick={onCancel}
        style={{ background: 'rgba(26, 24, 20, 0.7)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="animate-fade-in relative mx-4 w-full max-w-md rounded-xl p-6"
        style={{
          background: 'var(--paper-bg)',
          color: 'var(--text-paper)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--paper-border)',
        }}
      >
        <h2
          className="mb-3 font-display text-lg"
          id="confirm-dialog-title"
          style={{ color: 'var(--text-paper)', fontWeight: 700 }}
        >
          {title}
        </h2>
        <div
          className="mb-6 text-sm leading-relaxed"
          style={{ color: 'var(--text-paper-muted)', fontFamily: 'Outfit, sans-serif' }}
        >
          {children}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="btn-ghost-paper rounded-md px-4 py-2 text-sm font-medium transition-all"
            onClick={onCancel}
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {cancelLabel}
          </button>
          <button
            className="btn-accent rounded-md px-4 py-2 text-sm font-medium transition-all"
            onClick={onConfirm}
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
