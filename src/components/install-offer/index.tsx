import React, { useEffect, useId, useRef, useState } from 'react'

import {
  AppsIcon,
  Badge,
  Change,
  ChangesPanel,
  CollapsedLink,
  DisclosureTrigger,
  DownloadIcon,
  getSurfaceTokens,
  InstallButton,
  MenuDotsIcon,
  OfflineIcon,
  PhoneIcon,
  RefreshIcon,
  StepList,
  WindowIcon,
} from './elements'
import { isPhoneLike, useInstallPrompt } from './use-install-prompt'
import { setInstallCollapsed, isInstallCollapsed } from '@services/install-dismissal'
import { InstallState, InstallSurface } from '@types'

export interface InstallOfferProps {
  dismissible?: boolean
  surface: InstallSurface
}

const DISCLOSURE_LABEL = 'What changes when I install this?'
const OVERRIDE_LABEL = 'Not your browser? Pick it here'

const REASSURANCE_HEADING = 'What stays the same'
const REASSURANCE_LINES = [
  'Nothing moves, and nothing is copied anywhere new.',
  'Same address, same sign-in, same mail on every device.',
  'You remove it like any other app.',
]

// The three concrete changes. Change 2 differs by device: a dock on desktop, a home screen
// on a phone. The other two are identical everywhere.
const buildChanges = (phone: boolean): Change[] => [
  {
    body: 'No tabs, no address bar — the mailbox gets the whole window.',
    icon: <WindowIcon />,
    title: 'It opens in its own window',
  },
  phone
    ? { body: 'Named Email, beside your other apps.', icon: <AppsIcon />, title: 'An icon lands on your home screen' }
    : { body: 'Named Email, beside your other apps.', icon: <AppsIcon />, title: 'An icon lands in your dock' },
  {
    body: 'The app still opens in a dead spot. New mail arrives when the connection does.',
    icon: <OfflineIcon />,
    title: 'It opens with no connection',
  },
]

// The manual browser instructions revealed by the override, plus the per-state step sets.
const CHROMIUM_STEPS = [
  'Open the browser menu — the ⋮ at the top right',
  'Choose Cast, save and share',
  'Choose Install page as app',
]
const FIREFOX_STEPS = ['Open the Firefox menu — the ⋮ at the top right', 'Tap Install, then confirm with Add']
const IOS_STEPS = ['Tap Share in the toolbar', 'Tap Add to Home Screen', 'Tap Add']

const OVERRIDE_SETS = [
  { label: 'Chrome, Edge, or Brave', steps: CHROMIUM_STEPS },
  { label: 'Firefox on Android', steps: FIREFOX_STEPS },
  { label: 'Safari on iPhone or iPad', steps: IOS_STEPS },
]

interface StateCopy {
  badge: React.ReactNode
  body: string
  hasButton: boolean
  heading: string
  note?: string
  steps?: string[]
}

const getStateCopy = (state: InstallState): StateCopy | null => {
  switch (state) {
    case 'promptable':
      return {
        badge: <DownloadIcon />,
        body: 'Its own window, its own icon — and you sign in once inside it.',
        hasButton: true,
        heading: 'Install this mailbox',
      }
    case 'spent':
      return {
        badge: <MenuDotsIcon />,
        body: 'You closed the install prompt, and this browser offers it only once per visit.',
        hasButton: false,
        heading: 'Install Email from your browser menu',
        note: 'Reload the page and the Install button comes back.',
        steps: CHROMIUM_STEPS,
      }
    case 'menu':
      return {
        badge: <MenuDotsIcon />,
        body: 'Firefox for Android installs from its menu.',
        hasButton: false,
        heading: 'Add Email to your home screen from the Firefox menu',
        steps: FIREFOX_STEPS,
      }
    case 'ios':
      return {
        badge: <PhoneIcon />,
        body: "Safari adds Email to your home screen. Only Safari can — other iOS browsers can't.",
        hasButton: false,
        heading: 'Add Email to your home screen',
        steps: IOS_STEPS,
      }
    default:
      return null
  }
}

const InstallOffer = ({ dismissible = false, surface }: InstallOfferProps): React.ReactNode => {
  const { promptInstall, state } = useInstallPrompt()
  const tokens = getSurfaceTokens(surface)

  const [collapsed, setCollapsed] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)

  const headingId = useId()
  const changesRegionId = useId()
  const overrideRegionId = useId()

  const sectionRef = useRef<HTMLElement>(null)
  const collapsedLinkRef = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<'banner' | 'link' | null>(null)

  // Resolve the persisted collapse boolean after mount, matching the state hook so the
  // static export and the first client render agree (both render nothing).
  useEffect(() => {
    if (dismissible) {
      setCollapsed(isInstallCollapsed())
    }
  }, [dismissible])

  // Focus is never stranded: after collapsing, land on the one-line link; after expanding,
  // land inside the banner. A control the reader just pressed never vanishes from under them.
  useEffect(() => {
    if (pendingFocus.current === 'link') {
      collapsedLinkRef.current?.focus()
    } else if (pendingFocus.current === 'banner') {
      sectionRef.current?.focus()
    }
    pendingFocus.current = null
  }, [collapsed])

  if (state === 'hidden') {
    return null
  }

  const copy = getStateCopy(state)
  if (copy === null) {
    return null
  }

  if (dismissible && collapsed) {
    return (
      <div style={{ background: 'transparent', padding: '9px 0' }}>
        <CollapsedLink
          onClick={() => {
            pendingFocus.current = 'banner'
            setInstallCollapsed(false)
            setCollapsed(false)
          }}
          ref={collapsedLinkRef}
          tokens={tokens}
        />
      </div>
    )
  }

  const phone = isPhoneLike(state)
  const showOverride = state !== 'promptable'

  return (
    <section
      aria-labelledby={headingId}
      className="animate-fade-slide-up"
      ref={sectionRef}
      style={{
        background: 'var(--accent-subtle)',
        borderLeft: '2px solid var(--accent)',
        borderRadius: '12px',
        outline: 'none',
      }}
      tabIndex={-1}
    >
      <div style={{ alignItems: 'flex-start', display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px 20px' }}>
        <Badge tokens={tokens}>{copy.badge}</Badge>

        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <h2
            id={headingId}
            style={{
              color: tokens.text,
              fontFamily: 'Outfit, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              margin: 0,
              overflowWrap: 'anywhere',
            }}
          >
            {copy.heading}
          </h2>
          <p
            style={{
              color: tokens.text,
              fontSize: '13.5px',
              margin: '4px 0 0',
              maxWidth: '64ch',
              overflowWrap: 'anywhere',
            }}
          >
            {copy.body}
          </p>

          {copy.steps && <StepList steps={copy.steps} tokens={tokens} />}

          {copy.note && (
            <p
              style={{
                alignItems: 'flex-start',
                color: tokens.text,
                display: 'flex',
                fontSize: '12.5px',
                gap: '8px',
                marginTop: '12px',
              }}
            >
              <span aria-hidden="true" style={{ color: tokens.iconAccent, marginTop: '2px' }}>
                <RefreshIcon />
              </span>
              <span>{copy.note}</span>
            </p>
          )}

          <div>
            <DisclosureTrigger
              controls={changesRegionId}
              expanded={changesOpen}
              label={DISCLOSURE_LABEL}
              onToggle={() => setChangesOpen((open) => !open)}
              tokens={tokens}
            />
          </div>

          {changesOpen && (
            <div className="animate-fade-in" id={changesRegionId}>
              <ChangesPanel
                changes={buildChanges(phone)}
                changesHeadingId={`${changesRegionId}-h`}
                reassuranceHeading={REASSURANCE_HEADING}
                reassuranceLines={REASSURANCE_LINES}
                tokens={tokens}
              />
            </div>
          )}

          {showOverride && (
            <div style={{ marginTop: '12px' }}>
              <button
                aria-controls={overrideRegionId}
                aria-expanded={overrideOpen}
                onClick={() => setOverrideOpen((open) => !open)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: tokens.text,
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '13px',
                  minHeight: '28px',
                  padding: '4px 0',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
                type="button"
              >
                {OVERRIDE_LABEL}
              </button>
              {overrideOpen && (
                <div
                  className="animate-fade-in"
                  id={overrideRegionId}
                  style={{
                    background: tokens.cardBg,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: '12px',
                    marginTop: '12px',
                    padding: '12px 14px',
                  }}
                >
                  {OVERRIDE_SETS.map((set) => (
                    <div key={set.label} style={{ marginTop: '4px' }}>
                      <h3
                        style={{
                          color: tokens.text,
                          fontFamily: 'Outfit, sans-serif',
                          fontSize: '13px',
                          fontWeight: 600,
                          margin: 0,
                        }}
                      >
                        {set.label}
                      </h3>
                      <StepList steps={set.steps} tokens={tokens} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ alignItems: 'center', display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {copy.hasButton && <InstallButton onClick={() => void promptInstall()} />}
          {dismissible && (
            <button
              aria-label="Collapse this offer to a one-line link"
              onClick={() => {
                pendingFocus.current = 'link'
                setInstallCollapsed(true)
                setCollapsed(true)
              }}
              style={{
                alignItems: 'center',
                background: 'none',
                border: 'none',
                borderRadius: '8px',
                color: tokens.text,
                cursor: 'pointer',
                display: 'flex',
                height: '28px',
                justifyContent: 'center',
                lineHeight: 1,
                width: '28px',
              }}
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default InstallOffer
