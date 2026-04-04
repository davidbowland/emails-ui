import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import {
  deleteSentEmail,
  getAllSentEmails,
  getSentAttachment,
  getSentEmailContents,
  patchSentEmail,
} from '@services/emails'

const OutboxPage = (): React.ReactNode => {
  return (
    <>
      <Head>
        <title>Email | dbowland.com</title>
      </Head>
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Authenticated>
          <Mailbox
            deleteEmail={deleteSentEmail}
            getAllEmails={getAllSentEmails}
            getEmailAttachment={getSentAttachment}
            getEmailContents={getSentEmailContents}
            patchEmail={patchSentEmail}
          />
        </Authenticated>
      </div>
    </>
  )
}

export default OutboxPage
