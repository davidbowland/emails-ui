import React from 'react'

import IconButton from '@components/ui/icon-button'
import { IconProps } from '@components/ui/icons'

export const ToolbarButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<IconProps>
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}): React.ReactNode => (
  <IconButton
    className="rounded p-1.5 transition-colors"
    icon={icon}
    label={label}
    onClick={onClick}
    size={15}
    title={label}
  />
)

export const ToolbarDivider = (): React.ReactNode => (
  <span className="mx-1 inline-block h-5 w-px align-middle" style={{ background: 'var(--paper-border)' }} />
)
