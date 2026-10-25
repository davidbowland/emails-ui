import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import {
  deleteReceivedEmail,
  getAllSpamEmails,
  getReceivedAttachment,
  getReceivedEmailContents,
  moveReceivedEmail,
  patchReceivedEmail,
} from '@services/emails'

// No bounceEmail: spam often carries a forged From, so a bounce would land on an innocent
// stranger (backscatter).
const SpamPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Spam | dbowland.com</title>
        <meta content="noindex, nofollow" name="robots" />
      </Head>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Authenticated>
          <Mailbox
            deleteEmail={deleteReceivedEmail}
            folder="spam"
            getAllEmails={getAllSpamEmails}
            getEmailAttachment={getReceivedAttachment}
            getEmailContents={getReceivedEmailContents}
            moveEmail={moveReceivedEmail}
            patchEmail={patchReceivedEmail}
          />
        </Authenticated>
      </div>
    </>
  )
}

export default SpamPage
