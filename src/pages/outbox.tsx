import Grid from '@mui/material/Grid'
import { Helmet } from 'react-helmet'
import React from 'react'

import { deleteSentEmail, getAllSentEmails, getSentAttachment, getSentEmailContents } from '@services/emails'
import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'

const OutboxPage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Helmet>
        <title>Email | dbowland.com</title>
      </Helmet>
      <Authenticated>
        <Grid container sx={{ padding: '25px 10px' }}>
          <Grid item xs>
            <Mailbox
              deleteEmail={deleteSentEmail}
              getAllEmails={getAllSentEmails}
              getEmailAttachment={getSentAttachment}
              getEmailContents={getSentEmailContents}
            />
          </Grid>
        </Grid>
      </Authenticated>
      <PrivacyLink />
    </main>
  )
}

export default OutboxPage
