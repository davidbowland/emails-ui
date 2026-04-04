import React from 'react'

export interface ErrorSnackbarProps {
  message: string | undefined
  onClose: () => void
}

const ErrorSnackbar = ({ message, onClose }: ErrorSnackbarProps): React.ReactNode => {
  if (message === undefined) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2" role="alert">
      <div
        className="animate-fade-in flex items-center gap-3 rounded-xl px-5 py-3 text-sm shadow-lg"
        style={{
          background: 'var(--paper-bg)',
          border: '1px solid rgba(196, 92, 42, 0.4)',
          color: 'var(--text-paper)',
          fontFamily: 'Outfit, sans-serif',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '90vw',
          whiteSpace: 'nowrap',
        }}
      >
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-paper)' }}>{message}</span>
        <button
          aria-label="Close"
          className="btn-close ml-1 flex-shrink-0 text-base transition-opacity"
          onClick={onClose}
          style={{ lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default ErrorSnackbar
