import React from 'react'

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'disabled'> {
  describedBy?: string
  invalid?: boolean
  ref?: React.Ref<HTMLInputElement>
  // 'boxed' is a bordered field. 'bare' has no border, a transparent background and no padding of its
  // own, so the caller's className sets the padding (compose's subject line).
  variant?: 'bare' | 'boxed'
}

// Read-only, never disabled (G7): the text keeps its normal color. A boxed field's border turns dashed.
const TextInput = ({
  className,
  describedBy,
  invalid,
  readOnly,
  ref,
  style,
  type = 'text',
  variant = 'boxed',
  ...rest
}: TextInputProps): React.ReactNode => {
  const boxed = variant === 'boxed'
  const variantStyle: React.CSSProperties = boxed
    ? {
        background: 'var(--paper-surface)',
        border: `1px ${readOnly ? 'dashed' : 'solid'} ${invalid ? 'var(--accent)' : 'var(--paper-border)'}`,
        padding: '10px 12px',
      }
    : { background: 'transparent', border: 'none', padding: 0 }
  return (
    <input
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      // No outline utility here: the global :focus-visible ring in index.css must stay visible.
      className={`w-full${boxed ? ' rounded-md' : ''}${className ? ` ${className}` : ''}`}
      readOnly={readOnly}
      ref={ref}
      style={{
        color: 'var(--text-paper)',
        cursor: readOnly ? 'default' : undefined,
        fontFamily: 'Outfit, sans-serif',
        fontSize: '14px',
        ...variantStyle,
        ...style,
      }}
      type={type}
      {...rest}
    />
  )
}

export default TextInput
