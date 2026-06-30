import { Spinner } from '@heroui/react'
import { AlertCircle, Ban, Eye, EyeOff, Forward, Reply, ReplyAll, Trash2 } from 'lucide-react'
import React from 'react'

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
      <span
        style={{
          marginTop: '4px',
          display: 'inline-flex',
          flexShrink: 0,
          alignItems: 'center',
          gap: '4px',
          borderRadius: '8px',
          padding: '3px 8px',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)',
          color: 'var(--accent)',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '10px',
          fontWeight: 500,
        }}
      >
        <AlertCircle size={10} strokeWidth={1.5} />
        Bounced
      </span>
    )}
  </div>
)

export const EmailDivider = (): React.ReactNode => (
  <div
    style={{
      margin: '8px 32px',
      height: '1px',
      background: 'var(--paper-border)',
    }}
  />
)

export const ActionButton = ({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}): React.ReactNode => (
  <button
    aria-label={label}
    className={`group flex h-8 items-center gap-1.5 px-2 text-xs font-medium transition-all sm:px-3 ${variant === 'danger' ? 'btn-ghost-danger' : 'btn-ghost-paper'}`}
    onClick={onClick}
    style={{ fontFamily: 'Outfit, sans-serif', borderRadius: '8px' }}
    title={label}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
)

export const ShowImagesButton = ({
  onClick,
  showImages,
}: {
  onClick: () => void
  showImages: boolean
}): React.ReactNode => (
  <button
    aria-label={showImages ? 'Hide images' : 'Show images'}
    className="btn-ghost-paper flex h-8 items-center gap-1.5 px-2 text-xs font-medium transition-all sm:px-3"
    onClick={onClick}
    style={{ fontFamily: 'Outfit, sans-serif', borderRadius: '8px' }}
  >
    {showImages ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />}
    <span aria-hidden="true" className="hidden sm:inline">
      {showImages ? 'Hide images' : 'Show images'}
    </span>
  </button>
)

export const ReplyButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Reply size={12} strokeWidth={1.5} />} label="Reply" onClick={onClick} />
)

export const ReplyAllButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<ReplyAll size={12} strokeWidth={1.5} />} label="Reply all" onClick={onClick} />
)

export const ForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Forward size={12} strokeWidth={1.5} />} label="Forward" onClick={onClick} />
)

export const BounceButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Ban size={12} strokeWidth={1.5} />} label="Bounce email" onClick={onClick} variant="danger" />
)

export const DeleteButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Trash2 size={12} strokeWidth={1.5} />} label="Delete email" onClick={onClick} variant="danger" />
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
      <Spinner />
    </div>
  )
}
