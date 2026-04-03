import { Spinner } from '@heroui/react'
import React from 'react'

const LoadingSpinner = (): React.ReactNode => {
  return (
    <div className="flex min-h-[40vh] items-center justify-center md:min-h-[80vh]">
      <Spinner />
    </div>
  )
}

export default LoadingSpinner
