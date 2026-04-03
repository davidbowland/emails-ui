import { Card, CardContent, Chip, Separator } from '@heroui/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import React from 'react'

export const MailboxCard = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <Card className="h-full max-h-[80vh] w-full overflow-y-auto">
    <CardContent>{children}</CardContent>
  </Card>
)

export const ViewerCard = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <Card className="min-h-[40vh] w-full overflow-auto md:min-h-[80vh]">
    <CardContent>{children}</CardContent>
  </Card>
)

export const EmailListDivider = (): React.ReactNode => <Separator />

export const BouncedChip = (): React.ReactNode => (
  <Chip color="danger" variant="secondary">
    Bounced
  </Chip>
)

export const NavForwardButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <button
    aria-label="Show selected email"
    className="rounded p-2 hover:bg-gray-200 md:hidden dark:hover:bg-gray-700"
    onClick={onClick}
  >
    <ArrowRight size={18} />
  </button>
)

export const NavBackButton = ({ onClick }: { onClick: () => void }): React.ReactNode => (
  <button
    aria-label="Back to email list"
    className="rounded p-2 hover:bg-gray-200 md:hidden dark:hover:bg-gray-700"
    onClick={onClick}
  >
    <ArrowLeft size={18} />
  </button>
)
