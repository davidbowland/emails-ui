import React from 'react'

export const ToolbarButton = ({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}): React.ReactNode => (
  <button
    aria-label={label}
    className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
    onClick={onClick}
    title={label}
  >
    {children}
  </button>
)

export const ToolbarDivider = (): React.ReactNode => (
  <span className="mx-1 inline-block h-6 w-px bg-gray-300 align-middle dark:bg-gray-600" />
)
