import { HeadFC } from 'gatsby'
import React from 'react'

import Grid from '@mui/material/Grid'

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

const InboxPage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Authenticated>
        <Grid container sx={{ padding: '0px 10px' }}>
          <Grid item xs>
            <Mailbox
              bounceEmail={postBounceEmail}
              deleteEmail={deleteReceivedEmail}
              getAllEmails={getAllReceivedEmails}
              getEmailAttachment={getReceivedAttachment}
              getEmailContents={getReceivedEmailContents}
              patchEmail={patchReceivedEmail}
            />
          </Grid>
        </Grid>
      </Authenticated>
      <PrivacyLink />
    </main>
  )
}

export const Head: HeadFC = () => <title>Email | dbowland.com</title>

export default InboxPage
