import React from 'react'

import { ButtonPassthrough, SPINNER_SIZE_FOR_ICON, spinnerSurfaceFor } from '@components/ui/button'
import { usePressState } from '@components/ui/button/use-press-state'
import { IconProps } from '@components/ui/icons'
import Spinner from '@components/ui/spinner'

export type IconButtonVariant = 'toolbar' | 'shell' | 'close' | 'chip-remove'

export interface IconButtonProps extends ButtonPassthrough {
  busy?: boolean
  className?: string
  icon: React.ComponentType<IconProps>
  // Required: an icon-only button needs an accessible name. It becomes the aria-label.
  label: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  // 15 is the html-editor toolbar's size and 17 the shell's open-menu size. While busy, they take
  // the nearest smaller Spinner size (14 and 16), as Button does.
  size?: 12 | 14 | 15 | 16 | 17 | 20
  style?: React.CSSProperties
  unavailableReason?: string
  variant?: IconButtonVariant
}

export const ICON_BUTTON_VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  'chip-remove': 'chip-delete',
  close: 'btn-close',
  shell: 'btn-shell',
  toolbar: 'btn-toolbar',
}

const IconButton = ({
  'aria-describedby': describedBy,
  busy = false,
  className,
  icon: Icon,
  label,
  onBlur,
  onClick,
  onKeyDown,
  ref,
  size = 16,
  style,
  unavailableReason,
  variant = 'toolbar',
  ...rest
}: IconButtonProps): React.ReactNode => {
  // No disabled prop exists, but strip one passed around the types: a button is never natively
  // disabled (spec G4).
  const { disabled: _disabled, ...passthrough } = rest as typeof rest & { disabled?: unknown }
  const { buttonProps, reason } = usePressState({
    'aria-describedby': describedBy,
    busy,
    onBlur,
    onClick,
    onKeyDown,
    ref,
    unavailableReason,
  })
  return (
    <>
      <button
        {...passthrough}
        {...buttonProps}
        aria-label={label}
        className={`btn-target-square inline-flex items-center justify-center ${ICON_BUTTON_VARIANT_CLASSES[variant]}${className ? ` ${className}` : ''}`}
        style={style}
        type="button"
      >
        {busy ? (
          <Spinner size={SPINNER_SIZE_FOR_ICON[size]} surface={spinnerSurfaceFor(variant)} />
        ) : (
          <Icon size={size} />
        )}
      </button>
      {reason}
    </>
  )
}

export default IconButton
