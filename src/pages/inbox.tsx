import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import {
  deleteReceivedEmail,
  getAllReceivedEmails,
  getReceivedAttachment,
  getReceivedEmailContents,
  patchReceivedEmail,
  postBounceEmail,
} from '@services/emails'

const InboxPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Authenticated>
          <Mailbox
            bounceEmail={postBounceEmail}
            deleteEmail={deleteReceivedEmail}
            getAllEmails={getAllReceivedEmails}
            getEmailAttachment={getReceivedAttachment}
            getEmailContents={getReceivedEmailContents}
            patchEmail={patchReceivedEmail}
          />
        </Authenticated>
      </div>
    </>
  )
}

export default InboxPage
