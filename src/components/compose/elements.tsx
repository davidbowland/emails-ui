import { Button, Card, CardContent, Separator, Spinner } from '@heroui/react'
import { Send, Trash2 } from 'lucide-react'
import React from 'react'

export const ComposeCard = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <Card className="min-h-[40vh] w-full overflow-auto pt-2 md:min-h-[80vh]">
    <CardContent>{children}</CardContent>
  </Card>
)

export const ComposeDivider = (): React.ReactNode => <Separator />

export const SendButton = ({
  disabled,
  isSubmitting,
  onClick,
}: {
  disabled: boolean
  isSubmitting: boolean
  onClick: () => void
}): React.ReactNode => (
  <Button isDisabled={disabled} onPress={onClick} variant="primary">
    {isSubmitting ? <Spinner /> : <Send size={14} />}
    Send
  </Button>
)

export const DiscardButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }): React.ReactNode => (
  <Button isDisabled={disabled} onPress={onClick} variant="outline">
    <Trash2 size={14} />
    Discard
  </Button>
)
