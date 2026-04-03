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
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-[#272727]">
        <h2 className="mb-4 text-xl font-medium" id="confirm-dialog-title">
          {title}
        </h2>
        <div className="mb-6 text-sm">{children}</div>
        <div className="flex justify-end gap-2">
          <button className="rounded px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="rounded px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
