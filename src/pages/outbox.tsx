import Authenticated from '@components/auth'
import Mailbox from '@components/mailbox'
import PrivacyLink from '@components/privacy-link'
import { HeadFC } from 'gatsby'
import React from 'react'

import Grid from '@mui/material/Grid'

import {
  deleteSentEmail,
  getAllSentEmails,
  getSentAttachment,
  getSentEmailContents,
  patchSentEmail,
} from '@services/emails'

const OutboxPage = (): JSX.Element => {
  return (
    <main style={{ height: '100%' }}>
      <Authenticated>
        <Grid container sx={{ padding: '0px 10px' }}>
          <Grid item xs>
            <Mailbox
              deleteEmail={deleteSentEmail}
              getAllEmails={getAllSentEmails}
              getEmailAttachment={getSentAttachment}
              getEmailContents={getSentEmailContents}
              patchEmail={patchSentEmail}
            />
          </Grid>
        </Grid>
      </Authenticated>
      <PrivacyLink />
    </main>
  )
}

export const Head: HeadFC = () => <title>Email | dbowland.com</title>

export default OutboxPage
