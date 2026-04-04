import { Spinner } from '@heroui/react'
import { AlertCircle, Ban, Eye, EyeOff, Forward, Reply, ReplyAll, Trash2 } from 'lucide-react'
import React from 'react'

export const SubjectLine = ({ bounced, subject }: { bounced?: boolean; subject: string }): React.ReactNode => (
  <div className="flex flex-wrap items-start gap-3 px-8 pt-8 pb-3">
    <h1
      className="font-display text-2xl leading-tight"
      style={{ color: 'var(--text-paper)', fontWeight: 400, flex: '1 1 auto', minWidth: 0 }}
    >
      {subject}
    </h1>
    {bounced && (
      <span
        className="mt-1 inline-flex flex-shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
        style={{
          background: 'rgba(196, 92, 42, 0.12)',
          border: '1px solid rgba(196, 92, 42, 0.3)',
          color: 'var(--accent)',
          fontFamily: 'IBM Plex Mono, monospace',
        }}
      >
        <AlertCircle size={11} />
        Bounced
      </span>
    )}
  </div>
)

export const EmailDivider = (): React.ReactNode => (
  <div className="mx-8 my-3" style={{ height: '1px', background: 'var(--paper-border)' }} />
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
    className={`group flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all sm:px-3 ${variant === 'danger' ? 'btn-ghost-danger' : 'btn-ghost-paper'}`}
    onClick={onClick}
    style={{ fontFamily: 'Outfit, sans-serif' }}
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
    className="btn-ghost-paper flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all sm:px-3"
    onClick={onClick}
    style={{ fontFamily: 'Outfit, sans-serif' }}
  >
    {showImages ? <EyeOff size={13} /> : <Eye size={13} />}
    <span className="hidden sm:inline">{showImages ? 'Hide images' : 'Show images'}</span>
  </button>
)

export const ReplyButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Reply size={13} />} label="Reply" onClick={onClick} />
)

export const ReplyAllButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<ReplyAll size={13} />} label="Reply all" onClick={onClick} />
)

export const ForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Forward size={13} />} label="Forward" onClick={onClick} />
)

export const BounceButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Ban size={13} />} label="Bounce email" onClick={onClick} variant="danger" />
)

export const DeleteButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Trash2 size={13} />} label="Delete email" onClick={onClick} variant="danger" />
)

export const LoadingOverlay = ({ open }: { open: boolean }): React.ReactNode => {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(245, 240, 232, 0.85)' }}
    >
      <Spinner />
    </div>
  )
}
