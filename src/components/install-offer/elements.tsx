import React from 'react'

import Button from '@components/ui/button'
import { ChevronDownIcon, DownloadIcon, IconProps, IconSize, ShieldCheckIcon } from '@components/ui/icons'
import SectionHeading from '@components/ui/section-heading'
import { InstallSurface } from '@types'

// --- Surface tokens -------------------------------------------------------------------
// Never uses --text-muted for readable text: it fails AA on the shell (2.29:1). Shell text
// is --text-primary (at least 7.1:1), paper text is --text-paper (15.28:1).

export interface SurfaceTokens {
  border: string
  // The library variant for this surface's text-style buttons. Each button paints its own
  // background and text color inline, so the variant contributes its focus ring and cursor.
  buttonVariant: 'shell' | 'toolbar'
  cardBg: string
  disclosureFill: string
  iconAccent: string
  text: string
}

export const getSurfaceTokens = (surface: InstallSurface): SurfaceTokens =>
  surface === 'paper'
    ? {
        border: 'var(--paper-border)',
        buttonVariant: 'toolbar',
        cardBg: 'var(--paper-bg)',
        disclosureFill: 'rgba(0,0,0,0.035)',
        iconAccent: 'var(--accent-deep)',
        text: 'var(--text-paper)',
      }
    : {
        border: 'var(--shell-border)',
        buttonVariant: 'shell',
        cardBg: 'var(--shell-surface-hover)',
        disclosureFill: 'rgba(255,255,255,0.035)',
        iconAccent: 'var(--accent-hover)',
        text: 'var(--text-primary)',
      }

// --- Icon tile (icon + surface, paired with a text heading elsewhere) ------------------

export const IconTile = ({
  icon: Icon,
  size,
  tokens,
}: {
  icon: React.ComponentType<IconProps>
  size: IconSize
  tokens: SurfaceTokens
}): React.ReactNode => (
  <div
    aria-hidden="true"
    style={{
      alignItems: 'center',
      background: 'var(--accent-subtle)',
      border: '1px solid var(--accent-border)',
      borderRadius: '11px',
      color: tokens.iconAccent,
      display: 'flex',
      flexShrink: 0,
      height: '36px',
      justifyContent: 'center',
      width: '36px',
    }}
  >
    <Icon size={size} />
  </div>
)

// --- Install button (filled, white on --accent-deep: 5.34:1) --------------------------

export const InstallButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <Button
    className="min-h-9"
    icon={DownloadIcon}
    onClick={onClick}
    style={{
      background: 'var(--accent-deep)',
      borderRadius: '10px',
      boxShadow: 'var(--shadow-sm)',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      padding: '8px 18px',
      whiteSpace: 'nowrap',
    }}
    variant="primary"
  >
    Install
  </Button>
)

// --- Collapsed one-line link ----------------------------------------------------------

export const CollapsedLink = ({
  onClick,
  ref,
  tokens,
}: {
  onClick: () => void
  ref?: React.Ref<HTMLButtonElement>
  tokens: SurfaceTokens
}): React.ReactNode => (
  <Button
    className="min-h-[26px]"
    onClick={onClick}
    ref={ref}
    style={{
      background: 'none',
      borderRadius: 0,
      color: tokens.text,
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      padding: '3px 8px',
      textDecoration: 'underline',
      textUnderlineOffset: '3px',
    }}
    variant={tokens.buttonVariant}
  >
    <span style={{ color: tokens.iconAccent, display: 'inline-flex' }}>
      <DownloadIcon />
    </span>
    Install Email
  </Button>
)

// --- Disclosure trigger (bordered, single line, chevron pinned right) -----------------

export const DisclosureTrigger = ({
  controls,
  expanded,
  label,
  onToggle,
  tokens,
}: {
  controls: string
  expanded: boolean
  label: string
  onToggle: () => void
  tokens: SurfaceTokens
}): React.ReactNode => (
  <Button
    aria-controls={controls}
    aria-expanded={expanded}
    className="min-h-8"
    onClick={onToggle}
    style={{
      background: tokens.disclosureFill,
      border: `1px solid ${tokens.border}`,
      borderRadius: '9px',
      color: tokens.text,
      // Full-width, and the label is free to wrap: on a narrow card an inline nowrap control
      // ran off the edge and pushed the chevron off-screen.
      display: 'flex',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontWeight: 500,
      justifyContent: 'flex-start',
      letterSpacing: '0.01em',
      marginTop: '14px',
      padding: '6px 12px',
      textAlign: 'left',
      width: '100%',
    }}
    variant={tokens.buttonVariant}
  >
    <span style={{ overflowWrap: 'anywhere' }}>{label}</span>
    <span
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        marginLeft: 'auto',
        paddingLeft: '4px',
        transform: expanded ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      <ChevronDownIcon />
    </span>
  </Button>
)

// --- Numbered step list (number AND text, never a hue-only indicator) -----------------

export const StepList = ({ steps, tokens }: { steps: string[]; tokens: SurfaceTokens }): React.ReactNode => (
  <ol
    style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', margin: '12px 0 0', padding: 0 }}
  >
    {steps.map((step, index) => (
      <li
        key={index}
        style={{ alignItems: 'flex-start', color: tokens.text, display: 'flex', fontSize: '13.5px', gap: '10px' }}
      >
        <span
          aria-hidden="true"
          style={{
            alignItems: 'center',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            borderRadius: '6px',
            color: tokens.iconAccent,
            display: 'flex',
            flexShrink: 0,
            fontSize: '11px',
            fontWeight: 600,
            height: '20px',
            justifyContent: 'center',
            marginTop: '1px',
            width: '20px',
          }}
        >
          {index + 1}
        </span>
        <span style={{ overflowWrap: 'anywhere' }}>
          <span className="sr-only">{`Step ${index + 1}: `}</span>
          {step}
        </span>
      </li>
    ))}
  </ol>
)

// --- What-changes panel (three concrete changes + the reassurance) --------------------

export interface Change {
  body: string
  icon: React.ReactNode
  title: string
}

export const ChangesPanel = ({
  changes,
  changesHeadingId,
  reassuranceHeading,
  reassuranceLines,
  surface,
  tokens,
}: {
  changes: Change[]
  changesHeadingId: string
  reassuranceHeading: string
  reassuranceLines: string[]
  surface: InstallSurface
  tokens: SurfaceTokens
}): React.ReactNode => (
  <div style={{ borderTop: `1px solid ${tokens.border}`, marginTop: '14px', paddingTop: '14px' }}>
    <div style={{ marginBottom: '12px' }}>
      <SectionHeading as="h3" id={changesHeadingId} size={11} surface={surface} tone="strong">
        What changes
      </SectionHeading>
    </div>
    <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
      {changes.map((change, index) => (
        <div key={index} style={{ alignItems: 'flex-start', display: 'flex', gap: '10px', minWidth: 0 }}>
          <span aria-hidden="true" style={{ color: tokens.iconAccent, marginTop: '2px' }}>
            {change.icon}
          </span>
          <div>
            <strong
              style={{
                color: tokens.text,
                display: 'block',
                fontSize: '13.5px',
                fontWeight: 600,
                overflowWrap: 'anywhere',
              }}
            >
              {change.title}
            </strong>
            <span
              style={{
                color: tokens.text,
                display: 'block',
                fontSize: '12.5px',
                marginTop: '2px',
                overflowWrap: 'anywhere',
              }}
            >
              {change.body}
            </span>
          </div>
        </div>
      ))}
    </div>
    <div
      style={{
        background: tokens.cardBg,
        border: `1px solid ${tokens.border}`,
        borderRadius: '12px',
        display: 'flex',
        gap: '10px',
        marginTop: '14px',
        padding: '12px 14px',
      }}
    >
      <span aria-hidden="true" style={{ color: tokens.iconAccent, marginTop: '2px' }}>
        <ShieldCheckIcon size={18} />
      </span>
      <div>
        <h3
          style={{
            color: tokens.text,
            fontFamily: 'Outfit, sans-serif',
            fontSize: '12.5px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {reassuranceHeading}
        </h3>
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            listStyle: 'none',
            margin: '6px 0 0',
            padding: 0,
          }}
        >
          {reassuranceLines.map((line, index) => (
            <li
              key={index}
              style={{
                color: tokens.text,
                fontSize: '12.5px',
                overflowWrap: 'anywhere',
                paddingLeft: '14px',
                position: 'relative',
              }}
            >
              <span aria-hidden="true" style={{ left: 0, position: 'absolute' }}>
                —
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)
