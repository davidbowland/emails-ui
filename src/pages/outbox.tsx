import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'
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
      <main style={{ height: '100%' }}>
        <Authenticated>
          <div className="px-2">
            <Mailbox
              deleteEmail={deleteSentEmail}
              getAllEmails={getAllSentEmails}
              getEmailAttachment={getSentAttachment}
              getEmailContents={getSentEmailContents}
              patchEmail={patchSentEmail}
            />
          </div>
        </Authenticated>
        <PrivacyLink />
      </main>
    </>
  )
}

export default OutboxPage
