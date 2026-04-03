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
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center" role="alert">
      <div className="flex items-center gap-2 rounded bg-red-700 px-4 py-3 text-white shadow-lg">
        <span>{message}</span>
        <button aria-label="Close" className="ml-2 font-bold" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default ErrorSnackbar
