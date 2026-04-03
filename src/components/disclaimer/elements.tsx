import { Button } from '@heroui/react'
import React from 'react'

export const DisclaimerBar = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <div className="fixed inset-x-0 bottom-0 z-50 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:bg-[#272727]">
    <div className="flex flex-col gap-2">{children}</div>
  </div>
)

export const DisclaimerTitle = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <h6 className="text-xl font-medium">{children}</h6>
)

export const DisclaimerBody = ({ children }: { children: React.ReactNode }): React.ReactNode => (
  <p className="text-sm">{children}</p>
)

export const AcceptButton = ({ onPress }: { onPress: () => void }): React.ReactNode => (
  <Button onPress={onPress} variant="primary">
    Accept &amp; continue
  </Button>
)
