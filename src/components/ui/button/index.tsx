import React from 'react'

import { usePressState } from './use-press-state'
import { IconProps, IconSize } from '@components/ui/icons'
import Spinner, { SpinnerSize, SpinnerSurface } from '@components/ui/spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'toolbar' | 'shell' | 'attachment'

type DataAttributes = { [attribute: `data-${string}`]: string | number | boolean | undefined }

// Forwarded to the <button>. aria-busy and aria-disabled are left out: busy and unavailableReason
// own them. There is no `disabled`: a button is never natively disabled (spec G4).
export type ButtonPassthrough = Omit<React.AriaAttributes, 'aria-busy' | 'aria-disabled'> &
  DataAttributes &
  Pick<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'id' | 'onBlur' | 'onFocus' | 'onKeyDown' | 'onMouseEnter' | 'onMouseLeave' | 'role' | 'tabIndex' | 'title'
  > & {
    ref?: React.Ref<HTMLButtonElement>
  }

export interface ButtonProps extends ButtonPassthrough {
  busy?: boolean
  busyLabel?: string
  children: React.ReactNode
  className?: string
  icon?: React.ComponentType<IconProps>
  iconSize?: IconSize
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  style?: React.CSSProperties
  type?: 'button' | 'submit'
  unavailableReason?: string
  variant?: ButtonVariant
}

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  attachment: 'btn-attachment',
  danger: 'btn-ghost-danger',
  primary: 'btn-accent',
  secondary: 'btn-ghost-paper',
  shell: 'btn-shell',
  toolbar: 'btn-toolbar',
}

export const spinnerSurfaceFor = (variant: string): SpinnerSurface =>
  variant === 'primary' ? 'accent' : variant === 'shell' ? 'shell' : 'paper'

// The busy spinner takes the icon's place, so it matches the icon size as closely as Spinner allows:
// the nearest supported size, and on a tie the smaller one, so the spinner never outgrows the icon.
// 9 and 10 have nothing smaller, so they take 12.
export const SPINNER_SIZE_FOR_ICON: Record<IconSize, SpinnerSize> = {
  9: 12,
  10: 12,
  12: 12,
  13: 12,
  14: 14,
  15: 14,
  16: 16,
  17: 16,
  18: 16,
  20: 20,
  24: 24,
  28: 24,
}

const LAYER = 'col-start-1 row-start-1 inline-flex items-center justify-center gap-2'

const Button = ({
  'aria-describedby': describedBy,
  busy = false,
  busyLabel,
  children,
  className,
  icon: Icon,
  iconSize = 16,
  onBlur,
  onClick,
  onKeyDown,
  ref,
  style,
  type = 'button',
  unavailableReason,
  variant = 'secondary',
  ...rest
}: ButtonProps): React.ReactNode => {
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
  const ready = (
    <>
      {Icon && <Icon size={iconSize} />}
      {children}
    </>
  )
  const spinner = <Spinner size={SPINNER_SIZE_FOR_ICON[iconSize]} surface={spinnerSurfaceFor(variant)} />
  // With a busy label, the ready content stays laid out underneath, invisible and aria-hidden, so
  // the busy button never shrinks below its ready width. Without one, the content is the same as
  // ready with the spinner in the icon's place, so it is rendered once.
  const busyContent =
    busyLabel === undefined ? (
      <>
        {spinner}
        {children}
      </>
    ) : (
      <span className="grid">
        <span aria-hidden="true" className={`${LAYER} invisible`}>
          {ready}
        </span>
        <span className={LAYER}>
          {spinner}
          {busyLabel}
        </span>
      </span>
    )
  return (
    <>
      <button
        {...passthrough}
        {...buttonProps}
        className={`btn-target inline-flex items-center justify-center gap-2 ${BUTTON_VARIANT_CLASSES[variant]}${className ? ` ${className}` : ''}`}
        style={style}
        type={type}
      >
        {busy ? busyContent : ready}
      </button>
      {reason}
    </>
  )
}

export default Button
