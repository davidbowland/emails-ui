import React from 'react'

export const DisclaimerBar = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div
    className="fixed inset-x-0 bottom-0 z-50 p-4"
    style={{
      background: 'var(--shell-surface)',
      borderTop: '1px solid var(--shell-border)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}
  >
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  </div>
)

export const DisclaimerTitle = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <h6 className="text-base font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
    {children}
  </h6>
)

export const DisclaimerBody = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
    {children}
  </p>
)

export const AcceptButton = ({ onPress }: { onPress: () => void }): React.ReactNode => (
  <button
    className="btn-accept rounded-md px-4 py-2 text-sm font-medium transition-all"
    onClick={onPress}
    style={{ fontFamily: 'Outfit, sans-serif' }}
  >
    Accept &amp; continue
  </button>
)
