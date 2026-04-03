import { Button, Card, CardContent, Separator, Spinner } from '@heroui/react'
import { Save } from 'lucide-react'
import React from 'react'

export const SettingsCard = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <Card className="h-full w-full">
    <CardContent>{children}</CardContent>
  </Card>
)

export const SettingsTitle = (): React.ReactNode => <h4 className="text-2xl font-normal">Account Settings</h4>

export const SettingsDivider = (): React.ReactNode => <Separator />

export const SaveButton = ({
  disabled,
  isSaving,
  onClick,
}: {
  disabled: boolean
  isSaving: boolean
  onClick: () => void
}): React.ReactNode => (
  <Button isDisabled={disabled} onPress={onClick} variant="primary">
    {isSaving ? <Spinner /> : <Save size={14} />}
    Save
  </Button>
)
