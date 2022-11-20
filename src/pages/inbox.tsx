import Grid from '@mui/material/Grid'
import { Helmet } from 'react-helmet'
import React from 'react'

import {
  deleteReceivedEmail,
  getAllReceivedEmails,
  getReceivedAttachment,
  getReceivedEmailContents,
} from '@services/emails'
import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'

const InboxPage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Helmet>
        <title>Email | dbowland.com</title>
      </Helmet>
      <Authenticated>
        <Grid container sx={{ padding: '0px 10px' }}>
          <Grid item xs>
            <Mailbox
              deleteEmail={deleteReceivedEmail}
              getAllEmails={getAllReceivedEmails}
              getEmailAttachment={getReceivedAttachment}
              getEmailContents={getReceivedEmailContents}
            />
          </Grid>
        </Grid>
      </Authenticated>
      <PrivacyLink />
    </main>
  )
}

export default InboxPage
