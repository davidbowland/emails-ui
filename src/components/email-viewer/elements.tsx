import React from 'react'

import Badge from '@components/ui/badge'
import Button from '@components/ui/button'
import Divider from '@components/ui/divider'
import {
  AlertCircleIcon,
  BanIcon,
  EyeIcon,
  EyeOffIcon,
  ForwardIcon,
  IconProps,
  InboxIcon,
  ReplyAllIcon,
  ReplyIcon,
  ShieldAlertIcon,
  TrashIcon,
} from '@components/ui/icons'
import Spinner from '@components/ui/spinner'

export const SubjectLine = ({ bounced, subject }: { bounced?: boolean; subject: string }): React.ReactNode => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap' as const,
      alignItems: 'flex-start',
      gap: '12px',
      padding: '32px 32px 16px',
    }}
  >
    <h1
      className="font-display"
      style={{
        color: 'var(--text-paper)',
        fontWeight: 400,
        fontSize: '22px',
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
        flex: '1 1 auto',
        minWidth: 0,
        margin: 0,
      }}
    >
      {subject}
    </h1>
    {bounced && (
      // The top margin lines the badge up with the heading's first line.
      <span style={{ display: 'inline-flex', flexShrink: 0, marginTop: '4px' }}>
        <Badge icon={AlertCircleIcon} size="md" surface="paper" tone="accent">
          Bounced
        </Badge>
      </span>
    )}
  </div>
)

export const EmailDivider = (): React.ReactNode => (
  <div style={{ margin: '8px 32px' }}>
    <Divider />
  </div>
)

const ACTION_CLASSES = 'h-8 px-2 text-xs font-medium transition-all sm:px-3'
const ACTION_STYLE: React.CSSProperties = { borderRadius: '8px', fontFamily: 'Outfit, sans-serif', gap: '6px' }

export const ActionButton = ({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ComponentType<IconProps>
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}): React.ReactNode => (
  <Button
    aria-label={label}
    className={`group ${ACTION_CLASSES}`}
    icon={icon}
    iconSize={12}
    onClick={onClick}
    style={ACTION_STYLE}
    title={label}
    variant={variant === 'danger' ? 'danger' : 'secondary'}
  >
    <span className="hidden sm:inline">{label}</span>
  </Button>
)

export const ShowImagesButton = ({
  onClick,
  showImages,
}: {
  onClick: () => void
  showImages: boolean
}): React.ReactNode => (
  <Button
    aria-label={showImages ? 'Hide images' : 'Show images'}
    className={ACTION_CLASSES}
    icon={showImages ? EyeOffIcon : EyeIcon}
    iconSize={12}
    onClick={onClick}
    style={ACTION_STYLE}
  >
    <span aria-hidden="true" className="hidden sm:inline">
      {showImages ? 'Hide images' : 'Show images'}
    </span>
  </Button>
)

export const ReplyButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={ReplyIcon} label="Reply" onClick={onClick} />
)

export const ReplyAllButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={ReplyAllIcon} label="Reply all" onClick={onClick} />
)

export const ForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={ForwardIcon} label="Forward" onClick={onClick} />
)

export const NotSpamButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={InboxIcon} label="Not spam" onClick={onClick} />
)

export const MoveToSpamButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={ShieldAlertIcon} label="Move to spam" onClick={onClick} variant="danger" />
)

export const BounceButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={BanIcon} label="Bounce email" onClick={onClick} variant="danger" />
)

export const DeleteButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={TrashIcon} label="Delete email" onClick={onClick} variant="danger" />
)

export const LoadingOverlay = ({ open }: { open: boolean }): React.ReactNode => {
  if (!open) return null
  return (
    <div
      aria-label="Loading"
      role="status"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(244, 240, 232, 0.88)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease forwards',
      }}
    >
      <Spinner size={40} />
    </div>
  )
}
