import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import {
  deleteReceivedEmail,
  getAllReceivedEmails,
  getReceivedAttachment,
  getReceivedEmailContents,
  moveReceivedEmail,
  patchReceivedEmail,
  postBounceEmail,
} from '@services/emails'
import { EmailBatch } from '@types'

// Bound to the Inbox, so the list never depends on getAllReceivedEmails' default folder.
const getInboxEmails = (accountId: string): Promise<EmailBatch[]> => getAllReceivedEmails(accountId, 'inbox')

const InboxPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
        <meta content="noindex, nofollow" name="robots" />
      </Head>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Authenticated>
          <Mailbox
            bounceEmail={postBounceEmail}
            deleteEmail={deleteReceivedEmail}
            folder="inbox"
            getAllEmails={getInboxEmails}
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

export default InboxPage
