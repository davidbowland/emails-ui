import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import Cookies from 'universal-cookie'

import { AcceptButton, DisclaimerBar, DisclaimerBody, DisclaimerTitle } from './elements'

const Disclaimer = (): React.ReactNode => {
  const cookies = useRef(new Cookies()).current

  // Start open to match SSR, then close via useEffect if cookie is set
  const [open, setOpen] = useState(true)

  useEffect(() => {
    if (cookies.get('disclaimer_accept') === 'true') {
      setOpen(false)
    }
  }, [])

  const closeDrawer = (): void => {
    setOpen(false)
    cookies.set('disclaimer_accept', 'true', { path: '/', sameSite: 'strict', secure: true })
  }

  if (!open) {
    return null
  }

  return (
    <DisclaimerBar>
      <DisclaimerTitle>Cookie and Privacy Disclosure</DisclaimerTitle>
      <div className="flex w-full flex-col items-center gap-2 sm:flex-row">
        <div className="flex flex-1 flex-col gap-2">
          <DisclaimerBody>
            This site only uses essential cookies such as those used to keep you logged in. We may collect your phone
            number simply to prevent fraud and to keep costs low. Depending on your activity, your IP address may appear
            in our logs for up to 90 days. We never sell your information.
          </DisclaimerBody>
          <DisclaimerBody>
            See our <Link href="/privacy-policy">privacy policy</Link> for more information.
          </DisclaimerBody>
        </div>
        <div className="p-1 text-center sm:w-auto">
          <AcceptButton onPress={closeDrawer} />
        </div>
      </div>
    </DisclaimerBar>
  )
}

export default Disclaimer
