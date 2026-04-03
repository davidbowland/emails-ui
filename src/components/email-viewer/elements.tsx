import { Chip, Separator, Spinner } from '@heroui/react'
import { Ban, Eye, EyeOff, Forward, Reply, ReplyAll, Trash2 } from 'lucide-react'
import React from 'react'

export const SubjectLine = ({ bounced, subject }: { bounced?: boolean; subject: string }): React.ReactNode => (
  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
    <h4 className="text-2xl font-normal">{subject}</h4>
    {bounced && (
      <Chip color="danger" variant="secondary">
        Bounced
      </Chip>
    )}
  </div>
)

export const EmailDivider = (): React.ReactNode => <Separator />

export const ActionButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}): React.ReactNode => (
  <button
    aria-label={label}
    className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
    onClick={onClick}
    title={label}
  >
    {icon}
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
    className="flex items-center gap-1 rounded px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700"
    onClick={onClick}
  >
    {showImages ? <EyeOff size={18} /> : <Eye size={18} />}
    {showImages ? 'Hide images' : 'Show images'}
  </button>
)

export const ReplyButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Reply size={18} />} label="Reply" onClick={onClick} />
)

export const ReplyAllButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<ReplyAll size={18} />} label="Reply all" onClick={onClick} />
)

export const ForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Forward size={18} />} label="Forward" onClick={onClick} />
)

export const BounceButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Ban size={18} />} label="Bounce email" onClick={onClick} />
)

export const DeleteButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <ActionButton icon={<Trash2 size={18} />} label="Delete email" onClick={onClick} />
)

export const LoadingOverlay = ({ open }: { open: boolean }): React.ReactNode => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Spinner />
    </div>
  )
}
