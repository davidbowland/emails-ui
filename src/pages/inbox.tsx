import Head from 'next/head'
import React from 'react'

import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'
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
      <main style={{ height: '100%' }}>
        <Authenticated>
          <div className="px-2">
            <Mailbox
              bounceEmail={postBounceEmail}
              deleteEmail={deleteReceivedEmail}
              getAllEmails={getAllReceivedEmails}
              getEmailAttachment={getReceivedAttachment}
              getEmailContents={getReceivedEmailContents}
              patchEmail={patchReceivedEmail}
            />
          </div>
        </Authenticated>
        <PrivacyLink />
      </main>
    </>
  )
}

export default InboxPage
