import React from 'react'

const LoadingSpinner = (): React.ReactNode => {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center">
      <div
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full"
        role="progressbar"
        style={{
          border: '2px solid var(--paper-border)',
          borderTopColor: 'var(--accent)',
        }}
      />
    </div>
  )
}

export default LoadingSpinner
