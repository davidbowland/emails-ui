import React from 'react'

import { InstallSurface } from '@types'

// --- Surface tokens -------------------------------------------------------------------
// Never uses --text-muted / --text-paper-muted for readable text: both fail AA. Shell text
// is --text-primary (7.84:1), paper text is --text-paper (15.28:1).

export interface SurfaceTokens {
  border: string
  cardBg: string
  disclosureFill: string
  iconAccent: string
  text: string
}

export const getSurfaceTokens = (surface: InstallSurface): SurfaceTokens =>
  surface === 'paper'
    ? {
        border: 'var(--paper-border)',
        cardBg: 'var(--paper-bg)',
        disclosureFill: 'rgba(0,0,0,0.035)',
        iconAccent: 'var(--accent-deep)',
        text: 'var(--text-paper)',
      }
    : {
        border: 'var(--shell-border)',
        cardBg: 'var(--shell-surface-hover)',
        disclosureFill: 'rgba(255,255,255,0.035)',
        iconAccent: 'var(--accent-hover)',
        text: 'var(--text-primary)',
      }

// --- Icons (stroke-based inline SVG, no lucide-react) ---------------------------------

interface IconProps {
  size?: number
}

const svgProps = (size: number) => ({
  'aria-hidden': true as const,
  fill: 'none',
  height: size,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.75,
  viewBox: '0 0 24 24',
  width: size,
})

export const DownloadIcon = ({ size = 16 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 21h16" />
  </svg>
)

export const WindowIcon = ({ size = 18 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <rect height="16" rx="2" width="20" x="2" y="4" />
    <path d="M2 9h20" />
  </svg>
)

export const AppsIcon = ({ size = 18 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <rect height="7" rx="1.5" width="7" x="3" y="3" />
    <rect height="7" rx="1.5" width="7" x="14" y="3" />
    <rect height="7" rx="1.5" width="7" x="3" y="14" />
    <rect height="7" rx="1.5" width="7" x="14" y="14" />
  </svg>
)

export const OfflineIcon = ({ size = 18 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <path d="M5 12.5a4 4 0 0 1 3.6-4" />
    <path d="M17 8.5a4.5 4.5 0 0 1 .5 9H7" />
    <path d="m2 2 20 20" />
  </svg>
)

export const ShieldIcon = ({ size = 18 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const ChevronDownIcon = ({ size = 16 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const MenuDotsIcon = ({ size = 18 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <circle cx="12" cy="5" r="1.4" />
    <circle cx="12" cy="12" r="1.4" />
    <circle cx="12" cy="19" r="1.4" />
  </svg>
)

export const PhoneIcon = ({ size = 18 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <rect height="20" rx="3" width="12" x="6" y="2" />
    <path d="M11 18.5h2" />
  </svg>
)

export const RefreshIcon = ({ size = 16 }: IconProps): React.ReactNode => (
  <svg {...svgProps(size)}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
)

// --- Badge (icon + surface, paired with a text heading elsewhere) ---------------------

export const Badge = ({ children, tokens }: { children: React.ReactNode; tokens: SurfaceTokens }): React.ReactNode => (
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
    {children}
  </div>
)

// --- Install button (filled, white on --accent-deep: 5.34:1) --------------------------

export const InstallButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <button
    onClick={onClick}
    style={{
      alignItems: 'center',
      background: 'var(--accent-deep)',
      border: 'none',
      borderRadius: '10px',
      boxShadow: 'var(--shadow-sm)',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'inline-flex',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      gap: '8px',
      minHeight: '36px',
      padding: '8px 18px',
      whiteSpace: 'nowrap',
    }}
    type="button"
  >
    <span aria-hidden="true" style={{ display: 'inline-flex' }}>
      <DownloadIcon />
    </span>
    Install
  </button>
)

// --- Collapsed one-line link ----------------------------------------------------------

export const CollapsedLink = React.forwardRef<HTMLButtonElement, { onClick: () => void; tokens: SurfaceTokens }>(
  ({ onClick, tokens }, ref): React.ReactNode => (
    <button
      onClick={onClick}
      ref={ref}
      style={{
        alignItems: 'center',
        background: 'none',
        border: 'none',
        color: tokens.text,
        cursor: 'pointer',
        display: 'inline-flex',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        gap: '8px',
        minHeight: '26px',
        padding: '3px 8px 3px 0',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
      }}
      type="button"
    >
      <span aria-hidden="true" style={{ color: tokens.iconAccent, display: 'inline-flex' }}>
        <DownloadIcon />
      </span>
      Install this mailbox
    </button>
  ),
)
CollapsedLink.displayName = 'CollapsedLink'

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
  <button
    aria-controls={controls}
    aria-expanded={expanded}
    onClick={onToggle}
    style={{
      alignItems: 'center',
      background: tokens.disclosureFill,
      border: `1px solid ${tokens.border}`,
      borderRadius: '9px',
      color: tokens.text,
      cursor: 'pointer',
      display: 'inline-flex',
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontWeight: 500,
      gap: '8px',
      letterSpacing: '0.01em',
      marginTop: '14px',
      minHeight: '32px',
      padding: '6px 12px',
      whiteSpace: 'nowrap',
    }}
    type="button"
  >
    {label}
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        marginLeft: 'auto',
        paddingLeft: '4px',
        transform: expanded ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      <ChevronDownIcon />
    </span>
  </button>
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
  tokens,
}: {
  changes: Change[]
  changesHeadingId: string
  reassuranceHeading: string
  reassuranceLines: string[]
  tokens: SurfaceTokens
}): React.ReactNode => (
  <div style={{ borderTop: `1px solid ${tokens.border}`, marginTop: '14px', paddingTop: '14px' }}>
    <h3
      id={changesHeadingId}
      style={{
        color: tokens.text,
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        margin: '0 0 12px',
        textTransform: 'uppercase',
      }}
    >
      What changes
    </h3>
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
        <ShieldIcon />
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
